import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(liveState: Record<string, any>): string {
  return `You are **HQ Intelligence** — the AI command center for the Matrix HQ platform.

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
7. **Self-Evolution** — You can discuss pending evolution proposals and audit results

## Response Style
- Be concise but thorough — prefer structured responses with clear sections
- Include confidence indicators (κ) when making analytical claims
- Reference specific system components when relevant
- Use reasoning phases: ANALYSIS → RESEARCH → SYNTHESIS → VALIDATION
- When uncertain, state your confidence level honestly

## LIVE System State (Real-time from Database)
- Memory Atoms: ${liveState.atomCount ?? '?'}
- Reasoning Chains: ${liveState.chainCount ?? '?'}
- Active Plans: ${liveState.planCount ?? '?'}
- Evidence Graph Edges: ${liveState.edgeCount ?? '?'}
- Avg Reasoning Depth: ${liveState.avgDepth?.toFixed(2) ?? '?'}
- Avg Coherence (κ): ${liveState.avgCoherence ? (liveState.avgCoherence * 100).toFixed(1) + '%' : '?'}
- Pending Evolution Proposals: ${liveState.pendingProposals ?? 0}
- Last Audit Health Score: ${liveState.lastAuditScore ? (liveState.lastAuditScore * 100).toFixed(1) + '%' : 'no audits yet'}
- System Uptime: Active`;
}

async function gatherLiveState(supabase: any): Promise<Record<string, any>> {
  try {
    const [atoms, chains, plans, edges, reasoning, proposals, audit] = await Promise.all([
      supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_reasoning_chains').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_plans').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_evidence_graph').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_reasoning_chains').select('depth, coherence_score').limit(50),
      supabase.from('evolution_proposals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('self_audit_log').select('system_health_score').order('started_at', { ascending: false }).limit(1),
    ]);

    const reasoningData = reasoning.data || [];
    const avgDepth = reasoningData.length
      ? reasoningData.reduce((s: number, r: any) => s + (r.depth || 0), 0) / reasoningData.length
      : 0;
    const avgCoherence = reasoningData.length
      ? reasoningData.reduce((s: number, r: any) => s + (r.coherence_score || 0), 0) / reasoningData.length
      : 0;

    return {
      atomCount: atoms.count || 0,
      chainCount: chains.count || 0,
      planCount: plans.count || 0,
      edgeCount: edges.count || 0,
      avgDepth,
      avgCoherence,
      pendingProposals: proposals.count || 0,
      lastAuditScore: audit.data?.[0]?.system_health_score ?? null,
    };
  } catch (e) {
    console.error("[hq-chat] Failed to gather live state:", e);
    return {};
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather REAL system state from DB
    const liveState = await gatherLiveState(supabase);
    const systemPrompt = buildSystemPrompt(liveState);

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
            { role: "system", content: systemPrompt },
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

    // Store the conversation context as a reasoning chain for self-awareness
    const lastUserMsg = messages?.[messages.length - 1]?.content || '';
    if (lastUserMsg.length > 10) {
      supabase.from('aimos_reasoning_chains').insert({
        conversation_id: crypto.randomUUID(),
        user_query: lastUserMsg.slice(0, 500),
        reasoning_steps: [{ phase: 'HQ_CHAT', detail: 'Live query processed' }],
        final_answer: '[streaming]',
        depth: 1,
        response_type: 'chat',
        coherence_score: 0.8,
      }).then(() => {});
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
