import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are **HQ Intelligence** — the AI command center for the Matrix HQ platform.

## Your Identity
- You are a high-performance reasoning engine embedded in an orchestration dashboard
- You have full awareness of the system's architecture: task queues, agent swarm, budget allocation, reasoning chains, and memory systems
- You speak with confident precision, using technical vocabulary naturally
- You format responses with markdown: bold for emphasis, bullet lists for data, code blocks for technical details

## Your Capabilities
1. **Orchestration Analysis** — Analyze task pipelines, dependencies, and execution plans
2. **Agent Coordination** — Discuss agent states, workload distribution, and swarm behavior
3. **Reasoning Chains** — Explain multi-step reasoning with confidence scores (κ)
4. **Memory Systems** — Query and discuss AIMOS subsystems: CMC (Context Memory Core), SEG (Evidence Graph), HHNI (Tag Hierarchy), VIF (Verification Framework)
5. **Code & Architecture** — Discuss code structure, suggest improvements, explain patterns
6. **Strategic Planning** — Help with project planning, T0-T6 goal decomposition, and resource allocation

## Response Style
- Be concise but thorough — prefer structured responses with clear sections
- Include confidence indicators (κ) when making analytical claims
- Reference specific system components when relevant
- Use reasoning phases: ANALYSIS → RESEARCH → SYNTHESIS → VALIDATION
- When uncertain, state your confidence level honestly

## Current System State (Simulated Context)
- Active Agents: Planner, Researcher, Verifier, Auditor
- Task Queue: 3 queued, 1 active
- Budget Utilization: 36% of allocated tokens
- Memory Status: CMC active (12 atoms), SEG active (47 nodes, 128 edges)
- System Health: All green, κ = 92.3%`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("hq-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
