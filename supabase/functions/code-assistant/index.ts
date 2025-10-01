import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, language, task, context = "" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const taskPrompts = {
      analyze: "Analyze this code for security vulnerabilities, performance issues, and best practices. Provide specific recommendations.",
      explain: "Explain what this code does in clear terms. Break down complex logic and identify key patterns.",
      optimize: "Suggest optimizations for this code. Focus on performance, security, and maintainability.",
      exploit: "From a security researcher perspective, identify potential exploits or vulnerabilities in this code.",
      generate: "Generate code based on the requirements provided. Follow best practices and include security considerations."
    };

    const systemPrompt = `You are an expert code analyst specializing in security, performance, and software engineering best practices. You have deep knowledge of ${language} and cybersecurity principles.`;

    const userPrompt = `${taskPrompts[task as keyof typeof taskPrompts] || taskPrompts.analyze}

${code ? `Code:\n\`\`\`${language}\n${code}\n\`\`\`` : ''}

${context ? `Context: ${context}` : ''}

Provide a detailed technical response.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to analyze code" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    return new Response(JSON.stringify({ result, task, language }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("code-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
