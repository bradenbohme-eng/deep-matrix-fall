import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════
// HQ-CHAT — Full Cognitive Pipeline with Post-Processing
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

    // ── STEP 1: Load dynamic config ──
    const dynamicConfig = await loadDynamicConfig(supabase);

    // ── STEP 2: Gather live system state ──
    const liveState = await gatherLiveState(supabase);

    // ── STEP 3: CMC Retrieval with HHNI tag expansion ──
    const queryTags = extractTags(lastUserMsg);
    const expandedTags = await expandTagsViaHHNI(supabase, queryTags);
    const cmcContext = await retrieveFromCMC(supabase, lastUserMsg, expandedTags, dynamicConfig);

    // ── STEP 4: VIF Pre-Gate — assess context quality ──
    const pregate = assessPregate(cmcContext.atoms);
    
    // ── STEP 5: Load dynamic system prompts ──
    const dynamicPrompts = await loadDynamicPrompts(supabase);

    // ── STEP 5b: Load agent genomes for swarm context ──
    const agentGenomes = await loadAgentGenomes(supabase);
    
    // ── STEP 6: Build enriched system prompt ──
    const systemPrompt = buildSystemPrompt(liveState, cmcContext, pregate, expandedTags, dynamicPrompts, agentGenomes);

    // ── STEP 7: Create reasoning chain record ──
    const chainId = crypto.randomUUID();
    const conversationId = crypto.randomUUID();
    
    if (lastUserMsg.length > 5) {
      await supabase.from("aimos_reasoning_chains").insert({
        id: chainId,
        conversation_id: conversationId,
        user_query: lastUserMsg.slice(0, 500),
        reasoning_steps: [
          { phase: "CMC_RETRIEVE", detail: `${cmcContext.atoms.length} atoms retrieved`, tags: expandedTags },
          { phase: "VIF_PREGATE", detail: `Quality: ${pregate.quality}, Confidence: ${((pregate.avgConfidence || 0) * 100).toFixed(1)}%` },
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

    // ── STEP 8: Stream AI response via tee ──
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

    // ── STEP 9: Tee stream — one for client, one for post-processing ──
    const [clientStream, captureStream] = response.body!.tee();

    // ── STEP 10: Background post-processing with FULL response capture ──
    collectAndPostProcess(supabase, captureStream, chainId, lastUserMsg, cmcContext.atoms, dynamicConfig);

    // ── STEP 11: Update atom access counts ──
    for (const atom of cmcContext.atoms) {
      supabase.from("aimos_memory_atoms")
        .update({ access_count: (atom.access_count || 0) + 1, last_accessed_at: new Date().toISOString() })
        .eq("id", atom.id)
        .then(() => {});
    }

    return new Response(clientStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[hq-chat] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// ═══════════════════════════════════════════════════════════
// DYNAMIC CONFIG & PROMPTS (Phase 4)
// ═══════════════════════════════════════════════════════════

async function loadDynamicConfig(supabase: any): Promise<Record<string, any>> {
  try {
    const { data } = await supabase.from("aimos_config").select("config_key, config_value");
    const config: Record<string, any> = {};
    for (const row of data || []) {
      config[row.config_key] = row.config_value?.value ?? row.config_value;
    }
    return config;
  } catch (e) {
    console.error("[hq-chat] Failed to load dynamic config:", e);
    return {};
  }
}

async function loadDynamicPrompts(supabase: any): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("system_prompts")
      .select("prompt_text, priority")
      .eq("is_active", true)
      .order("priority", { ascending: false });
    return (data || []).map((p: any) => p.prompt_text);
  } catch (e) {
    console.error("[hq-chat] Failed to load dynamic prompts:", e);
    return [];
}

// ═══════════════════════════════════════════════════════════
// AGENT GENOMES — Persistent Agent Identity & Context
// ═══════════════════════════════════════════════════════════

async function loadAgentGenomes(supabase: any): Promise<any[]> {
  try {
    const { data: genomes } = await supabase
      .from("agent_genomes")
      .select("agent_role, display_name, system_prompt_core, capabilities, skill_levels, avg_kappa, total_tasks_completed")
      .order("priority", { ascending: true });

    if (!genomes || genomes.length === 0) return [];

    // Load top context entries per agent (most important ones)
    const roles = genomes.map((g: any) => g.agent_role);
    const { data: contextEntries } = await supabase
      .from("agent_context_bank")
      .select("agent_role, context_type, content, importance")
      .in("agent_role", roles)
      .order("importance", { ascending: false })
      .limit(30);

    // Attach context to genomes
    for (const g of genomes) {
      g.top_context = (contextEntries || [])
        .filter((c: any) => c.agent_role === g.agent_role)
        .slice(0, 5);
    }

    return genomes;
  } catch (e) {
    console.error("[hq-chat] Failed to load agent genomes:", e);
    return [];
  }
}

async function updateAgentGenomePostTask(supabase: any, agentRole: string, kappa: number, tokensUsed: number, learnings: string[], chainId: string) {
  try {
    // Update genome stats
    const { data: genome } = await supabase
      .from("agent_genomes")
      .select("total_tasks_completed, total_tokens_used, avg_kappa")
      .eq("agent_role", agentRole)
      .maybeSingle();

    if (genome) {
      const newTotal = (genome.total_tasks_completed || 0) + 1;
      const newAvgKappa = ((genome.avg_kappa || 0.5) * (genome.total_tasks_completed || 0) + kappa) / newTotal;
      await supabase.from("agent_genomes").update({
        total_tasks_completed: newTotal,
        total_tokens_used: (genome.total_tokens_used || 0) + tokensUsed,
        avg_kappa: newAvgKappa,
        avg_confidence: newAvgKappa,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("agent_role", agentRole);
    }

    // Store learnings as context bank entries
    for (const learning of learnings.slice(0, 3)) {
      await supabase.from("agent_context_bank").insert({
        agent_role: agentRole,
        context_type: kappa > 0.7 ? "success" : "pattern",
        content: learning,
        importance: Math.min(1, kappa),
        source_chain_id: chainId,
        tags: [],
        metadata: { kappa, tokens: tokensUsed },
      });
    }
  } catch (e) {
    console.error("[hq-chat] Failed to update agent genome:", e);
  }
}
}

// ═══════════════════════════════════════════════════════════
// POST-PROCESSING: Collect full response, run VIF + SEG
// ═══════════════════════════════════════════════════════════

async function collectAndPostProcess(
  supabase: any,
  stream: ReadableStream,
  chainId: string,
  query: string,
  atoms: any[],
  config: Record<string, any>
) {
  try {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    // Collect all SSE chunks
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Parse SSE data lines to extract content
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const json = JSON.parse(line.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) fullResponse += delta;
          } catch {}
        }
      }
    }

    if (fullResponse.length < 10) return;

    console.log(`[hq-chat] Post-processing ${fullResponse.length} chars for chain ${chainId}`);

    // ── VIF: Score the response ──
    const vifScore = computeLocalVIFScore(fullResponse, query, atoms);

    // ── SEG: Extract entities from response ──
    const entities = extractLocalEntities(fullResponse);

    // ── Update reasoning chain with final answer + κ ──
    await supabase.from("aimos_reasoning_chains").update({
      final_answer: fullResponse.slice(0, 2000),
      confidence_kappa: vifScore.kappa,
      quality_tier: vifScore.kappa > 0.8 ? "green" : vifScore.kappa > 0.5 ? "yellow" : "red",
      reasoning_steps: [
        { phase: "CMC_RETRIEVE", detail: `${atoms.length} atoms retrieved` },
        { phase: "VIF_PREGATE", detail: `Pre-gate passed` },
        { phase: "AI_GENERATE", detail: `${fullResponse.length} chars generated` },
        { phase: "VIF_POSTGATE", detail: `κ=${vifScore.kappa.toFixed(3)} (${vifScore.tier})` },
        { phase: "SEG_EXTRACT", detail: `${entities.length} entities found` },
      ],
    }).eq("id", chainId);

    // ── Store high-confidence response as memory atom ──
    if (vifScore.kappa > (config.vif_kappa_threshold || 0.6) && fullResponse.length > 50) {
      await supabase.from("aimos_memory_atoms").insert({
        content: `AI Response (κ=${vifScore.kappa.toFixed(2)}): ${fullResponse.slice(0, 1000)}`,
        content_type: "ai_response",
        tags: extractTags(query),
        memory_level: "warm",
        access_count: 0,
        confidence_score: vifScore.kappa,
        quality_score: vifScore.kappa,
        metadata: { chain_id: chainId, source: "hq_chat_response", entities_extracted: entities.length },
      });
    }

    // ── Store entities in SEG ──
    for (const entity of entities.slice(0, 10)) {
      await supabase.from("aimos_entities").upsert({
        name: entity.name,
        entity_type: entity.type,
        description: entity.context,
        confidence: vifScore.kappa * 0.9,
        metadata: { source_chain: chainId },
      }, { onConflict: "name" }).then(() => {});
    }

    // ── Log to Agent Discord ──
    await supabase.from("aimos_agent_discord").insert({
      agent_role: "meta_observer",
      message_type: "SUMMARY",
      content: `Response post-processed: ${fullResponse.length} chars, κ=${vifScore.kappa.toFixed(3)}, ${entities.length} entities extracted. Chain: ${chainId.slice(0, 8)}`,
      metadata: { chainId, kappa: vifScore.kappa, entities: entities.length, responseLength: fullResponse.length },
      confidence: vifScore.kappa,
    });

  } catch (e) {
    console.error("[hq-chat] Post-processing error:", e);
    // Non-blocking — don't crash the response
  }
}

function computeLocalVIFScore(response: string, query: string, atoms: any[]): { kappa: number; tier: string } {
  // Factual accuracy: check if response references retrieved atoms
  const atomContents = atoms.map(a => a.content?.toLowerCase() || "");
  const responseLower = response.toLowerCase();
  let evidenceOverlap = 0;
  for (const ac of atomContents) {
    const words = ac.split(/\s+/).filter((w: string) => w.length > 4);
    const matched = words.filter((w: string) => responseLower.includes(w)).length;
    evidenceOverlap += words.length > 0 ? matched / words.length : 0;
  }
  const factualAccuracy = atomContents.length > 0 ? Math.min(1, evidenceOverlap / atomContents.length) : 0.5;

  // Consistency: check for contradictions (hedging markers)
  const hedgeCount = (response.match(/\b(however|but|although|on the other hand|conversely)\b/gi) || []).length;
  const consistency = Math.max(0.3, 1 - hedgeCount * 0.1);

  // Completeness: response length relative to query complexity
  const queryWords = query.split(/\s+/).length;
  const responseWords = response.split(/\s+/).length;
  const completeness = Math.min(1, responseWords / (queryWords * 5));

  // Relevance: keyword overlap with query
  const queryKeywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const relevantHits = queryKeywords.filter((k: string) => responseLower.includes(k)).length;
  const relevance = queryKeywords.length > 0 ? relevantHits / queryKeywords.length : 0.5;

  // Freshness: always fresh for new responses
  const freshness = 0.95;

  // Weighted kappa
  const kappa = factualAccuracy * 0.30 + consistency * 0.20 + completeness * 0.20 + relevance * 0.20 + freshness * 0.10;
  const tier = kappa > 0.8 ? "green" : kappa > 0.5 ? "yellow" : "red";

  return { kappa, tier };
}

function extractLocalEntities(text: string): { name: string; type: string; context: string }[] {
  const entities: { name: string; type: string; context: string }[] = [];
  
  // Extract capitalized noun phrases (simple NER)
  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const seen = new Set<string>();
  let match;
  while ((match = capitalizedPattern.exec(text)) !== null) {
    const name = match[1];
    if (name.length > 2 && !seen.has(name.toLowerCase()) && !["The", "This", "That", "These", "Those", "Here", "There"].includes(name)) {
      seen.add(name.toLowerCase());
      // Get surrounding context
      const start = Math.max(0, match.index - 50);
      const end = Math.min(text.length, match.index + name.length + 50);
      entities.push({
        name,
        type: inferEntityType(name, text),
        context: text.slice(start, end).replace(/\n/g, " ").trim(),
      });
    }
  }

  // Extract technical terms (UPPERCASE acronyms)
  const acronymPattern = /\b([A-Z]{2,6})\b/g;
  while ((match = acronymPattern.exec(text)) !== null) {
    const name = match[1];
    if (!seen.has(name.toLowerCase()) && !["API", "URL", "CSS", "HTML", "JSON", "HTTP"].includes(name)) {
      seen.add(name.toLowerCase());
      entities.push({ name, type: "system", context: text.slice(Math.max(0, match.index - 30), match.index + name.length + 30).trim() });
    }
  }

  return entities.slice(0, 15);
}

function inferEntityType(name: string, context: string): string {
  const ctx = context.toLowerCase();
  if (ctx.includes("engine") || ctx.includes("system") || ctx.includes("framework")) return "system";
  if (ctx.includes("protocol") || ctx.includes("algorithm")) return "concept";
  if (ctx.includes("person") || ctx.includes("user") || ctx.includes("agent")) return "agent";
  return "entity";
}

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

    const { data: recentChains } = await supabase
      .from("aimos_reasoning_chains")
      .select("confidence_kappa, quality_tier")
      .order("created_at", { ascending: false })
      .limit(20);

    const kappaScores = (recentChains || []).filter((c: any) => c.confidence_kappa != null).map((c: any) => c.confidence_kappa);
    const avgKappa = kappaScores.length > 0 ? kappaScores.reduce((a: number, b: number) => a + b, 0) / kappaScores.length : 0;

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

  const { data: hierarchy } = await supabase
    .from("aimos_tag_hierarchy")
    .select("tag_name, parent_tag")
    .or(tags.map((t) => `tag_name.eq.${t}`).join(",") + "," + tags.map((t) => `parent_tag.eq.${t}`).join(","));

  for (const h of hierarchy || []) {
    expanded.add(h.tag_name);
    if (h.parent_tag) expanded.add(h.parent_tag);
  }

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

async function retrieveFromCMC(supabase: any, query: string, tags: string[], config: Record<string, any>): Promise<{ atoms: any[]; contextBlock: string }> {
  const retrievalLimit = config.memory_retrieval_limit || 8;
  const tokenBudgetMax = config.context_token_budget || 6000;
  const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
  
  const keywordFilter = keywords.length > 0
    ? keywords.slice(0, 5).map((k: string) => `content.ilike.%${k}%`).join(",")
    : null;

  let q1 = supabase
    .from("aimos_memory_atoms")
    .select("id, content, content_type, tags, source_refs, confidence_score, memory_level, access_count")
    .in("memory_level", ["hot", "warm"])
    .order("confidence_score", { ascending: false })
    .limit(retrievalLimit + 2);

  if (keywordFilter) q1 = q1.or(keywordFilter);
  const { data: keywordAtoms } = await q1;

  let tagAtoms: any[] = [];
  if (tags.length > 0) {
    const { data } = await supabase
      .from("aimos_memory_atoms")
      .select("id, content, content_type, tags, source_refs, confidence_score, memory_level, access_count")
      .in("memory_level", ["hot", "warm"])
      .overlaps("tags", tags)
      .order("confidence_score", { ascending: false })
      .limit(retrievalLimit);
    tagAtoms = data || [];
  }

  const seen = new Map<string, any>();
  for (const a of [...(keywordAtoms || []), ...tagAtoms]) {
    if (!seen.has(a.id) || a.confidence_score > seen.get(a.id).confidence_score) {
      seen.set(a.id, a);
    }
  }

  const atoms = Array.from(seen.values())
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, retrievalLimit);

  let tokenBudget = tokenBudgetMax;
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
  const avgConfidence = atomCount > 0 ? atoms.reduce((s: number, a: any) => s + (a.confidence_score || 0.5), 0) / atomCount : 0;
  const quality = atomCount >= 3 && avgConfidence >= 0.5 ? "sufficient" : atomCount >= 1 ? "low" : "none";
  return { quality, atomCount, avgConfidence, shouldHedge: quality !== "sufficient" };
}

function buildSystemPrompt(liveState: any, cmcContext: any, pregate: any, tags: string[], dynamicPrompts: string[]): string {
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

  // Inject dynamic prompts from evolution proposals
  if (dynamicPrompts.length > 0) {
    prompt += `\n\n## Dynamic Directives (from Self-Evolution)\n${dynamicPrompts.join("\n\n")}`;
  }

  if (cmcContext.contextBlock) {
    prompt += `\n\n## Retrieved Memory Context\n${cmcContext.contextBlock}`;
  }

  if (pregate.shouldHedge) {
    prompt += `\n\n## ⚠ VIF Pre-Gate Warning\nContext quality: ${pregate.quality} (${pregate.atomCount} atoms, κ=${(pregate.avgConfidence * 100).toFixed(0)}%). Hedge appropriately and note what you're uncertain about.`;
  }

  return prompt;
}
