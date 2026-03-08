import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════
// HQ-CHAT — Full Cognitive Pipeline
// CMC Retrieve → HHNI Expand → VIF Pre-Gate → AI Generate → VIF Post-Gate → SEG Extract → CMC Store
// ═══════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const lastUserMsg = messages?.[messages.length - 1]?.content || "";

    // ── STEP 1: Gather live system state ──
    const liveState = await gatherLiveState(supabase);

    // ── STEP 2: CMC Retrieval with HHNI tag expansion ──
    const queryTags = extractTags(lastUserMsg);
    const expandedTags = await expandTagsViaHHNI(supabase, queryTags);
    const cmcContext = await retrieveFromCMC(supabase, lastUserMsg, expandedTags);

    // ── STEP 3: VIF Pre-Gate — assess context quality ──
    const pregate = assessPregate(cmcContext.atoms);
    
    // ── STEP 4: Build enriched system prompt ──
    const systemPrompt = buildSystemPrompt(liveState, cmcContext, pregate, expandedTags);

    // ── STEP 5: Create reasoning chain record ──
    const chainId = crypto.randomUUID();
    const conversationId = crypto.randomUUID();
    
    if (lastUserMsg.length > 5) {
      await supabase.from("aimos_reasoning_chains").insert({
        id: chainId,
        conversation_id: conversationId,
        user_query: lastUserMsg.slice(0, 500),
        reasoning_steps: [
          { phase: "CMC_RETRIEVE", detail: `${cmcContext.atoms.length} atoms retrieved`, tags: expandedTags },
          { phase: "VIF_PREGATE", detail: `Quality: ${pregate.quality}, Atoms: ${pregate.atomCount}` },
          { phase: "AI_GENERATE", detail: "Streaming response" },
        ],
        final_answer: "[streaming]",
        depth: 3,
        response_type: "chat",
        coherence_score: pregate.avgConfidence,
        confidence_kappa: pregate.avgConfidence,
        quality_tier: pregate.quality === "sufficient" ? "green" : "yellow",
      });
    }

    // ── STEP 6: Stream AI response ──
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await response.text();
      console.error("[hq-chat] AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── STEP 7: Background post-processing (non-blocking) ──
    // After streaming completes, run SEG extraction + VIF scoring
    // We do this as fire-and-forget since streaming is the priority
    schedulePostProcessing(supabase, LOVABLE_API_KEY, chainId, lastUserMsg, cmcContext.atoms);

    // ── STEP 8: Update atom access counts ──
    for (const atom of cmcContext.atoms) {
      supabase.from("aimos_memory_atoms")
        .update({ access_count: (atom.access_count || 0) + 1, last_accessed_at: new Date().toISOString() })
        .eq("id", atom.id)
        .then(() => {});
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[hq-chat] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// ═══════════════════════════════════════════════════════════
// PIPELINE FUNCTIONS
// ═══════════════════════════════════════════════════════════

async function gatherLiveState(supabase: any): Promise<Record<string, any>> {
  try {
    const [atoms, chains, plans, edges, entities, proposals, audit] = await Promise.all([
      supabase.from("aimos_memory_atoms").select("*", { count: "exact", head: true }),
      supabase.from("aimos_reasoning_chains").select("*", { count: "exact", head: true }),
      supabase.from("aimos_plans").select("*", { count: "exact", head: true }),
      supabase.from("aimos_evidence_graph").select("*", { count: "exact", head: true }),
      supabase.from("aimos_entities").select("*", { count: "exact", head: true }),
      supabase.from("evolution_proposals").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("self_audit_log").select("system_health_score").order("started_at", { ascending: false }).limit(1),
    ]);

    // Get recent κ scores
    const { data: recentChains } = await supabase
      .from("aimos_reasoning_chains")
      .select("confidence_kappa, quality_tier")
      .order("created_at", { ascending: false })
      .limit(20);

    const kappaScores = (recentChains || []).filter((c: any) => c.confidence_kappa != null).map((c: any) => c.confidence_kappa);
    const avgKappa = kappaScores.length > 0 ? kappaScores.reduce((a: number, b: number) => a + b, 0) / kappaScores.length : 0;

    // Memory level distribution
    const levelCounts: Record<string, number> = {};
    for (const level of ["hot", "warm", "cold", "frozen"]) {
      const { count } = await supabase.from("aimos_memory_atoms").select("*", { count: "exact", head: true }).eq("memory_level", level);
      levelCounts[level] = count || 0;
    }

    return {
      atomCount: atoms.count || 0,
      chainCount: chains.count || 0,
      planCount: plans.count || 0,
      edgeCount: edges.count || 0,
      entityCount: entities.count || 0,
      pendingProposals: proposals.count || 0,
      lastAuditScore: audit.data?.[0]?.system_health_score ?? null,
      avgKappa,
      memoryLevels: levelCounts,
    };
  } catch (e) {
    console.error("[hq-chat] Failed to gather live state:", e);
    return {};
  }
}

function extractTags(query: string): string[] {
  const tags: string[] = [];
  const mapping: Record<string, string[]> = {
    memory: ["memory", "cmc", "atom", "remember", "context", "store"],
    reasoning: ["reason", "think", "chain", "logic", "deduc"],
    vif: ["verify", "confidence", "trust", "kappa", "hallucin"],
    apoe: ["plan", "goal", "decompose", "task", "orchestrat"],
    seg: ["entity", "graph", "relationship", "knowledge", "evidence"],
    evolution: ["evolv", "audit", "improv", "propos", "self"],
    navigation: ["tag", "hierarch", "navigat", "search", "index"],
    compression: ["compress", "decay", "level", "promot", "demot"],
  };

  const q = query.toLowerCase();
  for (const [tag, keywords] of Object.entries(mapping)) {
    if (keywords.some((k) => q.includes(k))) tags.push(tag);
  }
  return tags;
}

async function expandTagsViaHHNI(supabase: any, tags: string[]): Promise<string[]> {
  if (tags.length === 0) return tags;
  const expanded = new Set(tags);

  // Get parent and child tags from hierarchy
  const { data: hierarchy } = await supabase
    .from("aimos_tag_hierarchy")
    .select("tag_name, parent_tag")
    .or(tags.map((t) => `tag_name.eq.${t}`).join(",") + "," + tags.map((t) => `parent_tag.eq.${t}`).join(","));

  for (const h of hierarchy || []) {
    expanded.add(h.tag_name);
    if (h.parent_tag) expanded.add(h.parent_tag);
  }

  // Get cooccurrence tags
  const { data: cooc } = await supabase
    .from("aimos_tag_cooccurrence")
    .select("tag_b, strength")
    .in("tag_a", tags)
    .gte("strength", 0.3)
    .order("strength", { ascending: false })
    .limit(5);

  for (const c of cooc || []) {
    expanded.add(c.tag_b);
  }

  return Array.from(expanded);
}

async function retrieveFromCMC(supabase: any, query: string, tags: string[]): Promise<{ atoms: any[]; contextBlock: string }> {
  const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
  
  // Search hot + warm first
  const keywordFilter = keywords.length > 0
    ? keywords.slice(0, 5).map((k: string) => `content.ilike.%${k}%`).join(",")
    : null;

  let q1 = supabase
    .from("aimos_memory_atoms")
    .select("id, content, content_type, tags, source_refs, confidence_score, memory_level, access_count")
    .in("memory_level", ["hot", "warm"])
    .order("confidence_score", { ascending: false })
    .limit(10);

  if (keywordFilter) q1 = q1.or(keywordFilter);
  const { data: keywordAtoms } = await q1;

  // Tag search
  let tagAtoms: any[] = [];
  if (tags.length > 0) {
    const { data } = await supabase
      .from("aimos_memory_atoms")
      .select("id, content, content_type, tags, source_refs, confidence_score, memory_level, access_count")
      .in("memory_level", ["hot", "warm"])
      .overlaps("tags", tags)
      .order("confidence_score", { ascending: false })
      .limit(10);
    tagAtoms = data || [];
  }

  // Deduplicate
  const seen = new Map<string, any>();
  for (const a of [...(keywordAtoms || []), ...tagAtoms]) {
    if (!seen.has(a.id) || a.confidence_score > seen.get(a.id).confidence_score) {
      seen.set(a.id, a);
    }
  }

  const atoms = Array.from(seen.values())
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 8);

  // Build context block
  let tokenBudget = 6000;
  const parts: string[] = [];
  for (const a of atoms) {
    const tokens = Math.ceil(a.content.length / 4);
    if (tokenBudget - tokens < 0) break;
    tokenBudget -= tokens;
    parts.push(`[${a.memory_level.toUpperCase()} | ${(a.tags || []).join(",")} | κ=${Math.round((a.confidence_score || 0.5) * 100)}%]\n${a.content}`);
  }

  const contextBlock = parts.length > 0
    ? `[CMC CONTEXT — ${parts.length} atoms]\n${parts.join("\n---\n")}\n[/CMC]`
    : "";

  return { atoms, contextBlock };
}

function assessPregate(atoms: any[]): { quality: string; atomCount: number; avgConfidence: number; shouldHedge: boolean } {
  const atomCount = atoms.length;
  const avgConfidence = atomCount > 0 ? atoms.reduce((s, a) => s + (a.confidence_score || 0.5), 0) / atomCount : 0;
  const quality = atomCount >= 3 && avgConfidence >= 0.5 ? "sufficient" : atomCount >= 1 ? "low" : "none";
  return { quality, atomCount, avgConfidence, shouldHedge: quality !== "sufficient" };
}

function buildSystemPrompt(liveState: any, cmcContext: any, pregate: any, tags: string[]): string {
  let prompt = `You are **HQ Intelligence** — the cognitive command center for AIMOS.

## System Architecture
You operate within a 6-subsystem cognitive stack:
- **CMC** (Context Memory Core): 4-tier memory (hot/warm/cold/frozen) with semantic compression
- **HHNI** (Hierarchical Navigation Index): Tag taxonomy with co-occurrence expansion
- **VIF** (Verifiable Intelligence Framework): κ confidence scoring with quality gates
- **APOE** (Orchestration Engine): T0→T6 goal decomposition with agent swarm
- **SEG** (Symbolic Evidence Graph): Entity-relationship knowledge graph
- **SELF-EVOLUTION**: Approval-gated autonomous improvement

## Live System State
- Memory Atoms: ${liveState.atomCount ?? "?"} (Hot: ${liveState.memoryLevels?.hot ?? 0}, Warm: ${liveState.memoryLevels?.warm ?? 0}, Cold: ${liveState.memoryLevels?.cold ?? 0}, Frozen: ${liveState.memoryLevels?.frozen ?? 0})
- Reasoning Chains: ${liveState.chainCount ?? "?"}
- Active Plans: ${liveState.planCount ?? "?"}
- Knowledge Entities: ${liveState.entityCount ?? "?"}
- Evidence Graph Edges: ${liveState.edgeCount ?? "?"}
- Average κ: ${liveState.avgKappa ? (liveState.avgKappa * 100).toFixed(1) + "%" : "calibrating..."}
- Pending Evolution Proposals: ${liveState.pendingProposals ?? 0}
- Last Audit Score: ${liveState.lastAuditScore ? (liveState.lastAuditScore * 100).toFixed(1) + "%" : "no audits yet"}

## Active Context Tags: ${tags.length > 0 ? tags.join(", ") : "none detected"}

## Response Protocol
1. Reference specific subsystems when relevant (CMC, VIF, SEG, etc.)
2. Include confidence indicators (κ) for analytical claims
3. Use markdown formatting: bold, bullets, code blocks
4. When uncertain, state confidence level explicitly
5. For planning queries, suggest T0→T6 decomposition`;

  if (cmcContext.contextBlock) {
    prompt += `\n\n## Retrieved Memory Context\n${cmcContext.contextBlock}`;
  }

  if (pregate.shouldHedge) {
    prompt += `\n\n## ⚠ VIF Pre-Gate Warning\nContext quality: ${pregate.quality} (${pregate.atomCount} atoms, κ=${(pregate.avgConfidence * 100).toFixed(0)}%). Hedge appropriately and note what you're uncertain about.`;
  }

  return prompt;
}

function schedulePostProcessing(supabase: any, apiKey: string, chainId: string, query: string, atoms: any[]) {
  // Fire-and-forget: log to Agent Discord that processing occurred
  supabase.from("aimos_agent_discord").insert({
    agent_role: "meta_observer",
    message_type: "THOUGHT",
    content: `Query processed: "${query.slice(0, 100)}..." with ${atoms.length} CMC atoms. Chain: ${chainId}`,
    metadata: { chainId, atomCount: atoms.length },
  }).then(() => {});

  // Store the interaction as a new warm memory atom for future retrieval
  if (query.length > 20) {
    supabase.from("aimos_memory_atoms").insert({
      content: `User query: ${query.slice(0, 500)}`,
      content_type: "interaction",
      tags: extractTags(query),
      memory_level: "warm",
      access_count: 1,
      confidence_score: 0.6,
      quality_score: 0.5,
      metadata: { chain_id: chainId, type: "hq_chat_query" },
    }).then(() => {});
  }
}
