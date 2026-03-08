import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, language, task, context, messages, stream = true } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const taskPrompts: Record<string, string> = {
      analyze: "Analyze this code for security vulnerabilities, performance issues, and best practices. Provide specific recommendations with code examples.",
      explain: "Explain what this code does in clear terms. Break down complex logic, identify key patterns, and describe the data flow.",
      optimize: "Suggest optimizations for this code. Focus on performance, security, and maintainability. Provide the optimized code.",
      refactor: "Refactor this code to improve readability, maintainability, and follow best practices. Provide the refactored code with explanations.",
      debug: "Analyze this code for potential bugs, edge cases, and runtime errors. Provide fixes with explanations.",
      generate: "Generate production-ready code based on the requirements provided. Follow best practices, include TypeScript types, error handling, and comments.",
      complete: "Complete the missing implementation in this code. Maintain the existing style and patterns.",
      test: "Generate comprehensive unit tests for this code. Include edge cases, error scenarios, and common use cases.",
      security: "Perform a thorough security audit. Identify vulnerabilities (XSS, injection, auth bypass, data exposure) and provide remediation code.",
      architecture: "Analyze the architecture of this codebase. Evaluate patterns, coupling, separation of concerns, and suggest improvements.",
      overview: "Provide a comprehensive project overview: purpose, technologies used, key components, and architectural decisions.",
    };

    const systemPrompt = `You are an elite code analyst and engineer integrated into the AIMOS HQ platform. You specialize in ${language || 'TypeScript'}, security, performance, and software architecture.

Guidelines:
- Provide actionable, specific feedback with code examples
- Use markdown formatting: headers, code blocks, bullet points
- When providing code, always use fenced code blocks with language tags
- Flag security issues with severity levels (CRITICAL/HIGH/MEDIUM/LOW)
- Include confidence scores for recommendations
- Reference best practices from industry standards`;

    // Build messages array
    let aiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    if (messages && Array.isArray(messages)) {
      // Conversational mode — use provided message history
      aiMessages.push(...messages);
    } else {
      // Single-shot mode — build prompt from task + code
      const taskInstruction = taskPrompts[task] || taskPrompts.analyze;
      let userPrompt = taskInstruction;

      if (code) {
        userPrompt += `\n\n\`\`\`${language || 'typescript'}\n${code}\n\`\`\``;
      }
      if (context) {
        userPrompt += `\n\nAdditional context: ${context}`;
      }

      aiMessages.push({ role: "user", content: userPrompt });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await response.json();
      const result = data.choices[0].message.content;
      return new Response(JSON.stringify({ result, task, language }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("code-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
