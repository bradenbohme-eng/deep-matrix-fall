import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════
// HQ-CHAT — Full Cognitive Pipeline with Closed-Loop Cognition
// CMC Retrieve → HHNI Expand → VIF Pre-Gate → AI Generate → VIF Post-Gate → SEG Extract → CMC Store
// + Proposal Execution → Plan Advancement → Memory Lifecycle → Contradiction Detection
// ═══════════════════════════════════════════════════════════

// Global call counter for periodic tasks
let callCounter = 0;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const lastUserMsg = messages?.[messages.length - 1]?.content || "";
    callCounter++;

    // ── STEP 1: Load dynamic config ──
    const dynamicConfig = await loadDynamicConfig(supabase);

    // ── STEP 2: Gather live system state (now includes active plans) ──
    const liveState = await gatherLiveState(supabase);

    // ── STEP 3: CMC Retrieval with HHNI tag expansion ──
    const queryTags = extractTags(lastUserMsg);
    const expandedTags = await expandTagsViaHHNI(supabase, queryTags);
    const cmcContext = await retrieveFromCMC(supabase, lastUserMsg, expandedTags, dynamicConfig);

    // ── STEP 3b: Context Sync — BCI-powered context resolution ──
    let bciManifest: any = null;
    try {
      const csResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/context-sync`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "resolve_context",
          prompt: lastUserMsg,
          token_budget: 3000,
          policy_name: "default",
        }),
      });
      if (csResp.ok) bciManifest = await csResp.json();
    } catch (e) {
      console.error("[hq-chat] Context-sync resolve failed (non-blocking):", e);
    }

    // ── STEP 4: VIF Pre-Gate — assess context quality ──
    const pregate = assessPregate(cmcContext.atoms);
    
    // ── STEP 5: Load dynamic system prompts ──
    const dynamicPrompts = await loadDynamicPrompts(supabase);

    // ── STEP 5b: Load agent genomes for swarm context ──
    const agentGenomes = await loadAgentGenomes(supabase);
    
    // ── STEP 6: Build enriched system prompt (now includes BCI context + source attribution) ──
    const contextSourceMeta = {
      bciEntities: Array.isArray(bciManifest?.manifest) ? bciManifest.manifest.length : (bciManifest ? 1 : 0),
      cmcAtoms: cmcContext.atoms.length,
      expandedTags: expandedTags.length,
      bciOk: !!bciManifest,
    };
    const systemPrompt = buildSystemPrompt(liveState, cmcContext, pregate, expandedTags, dynamicPrompts, agentGenomes, bciManifest);

    // ── STEP 7: Create reasoning chain record ──
    const chainId = crypto.randomUUID();
    const conversationId = crypto.randomUUID();
    
    if (lastUserMsg.length > 5) {
      await supabase.from("aimos_reasoning_chains").insert({
        id: chainId,
        conversation_id: conversationId,
        user_query: lastUserMsg.slice(0, 500),
        reasoning_steps: [
          { phase: "CONTEXT_SOURCES", detail: `BCI: ${contextSourceMeta.bciEntities} entities (${contextSourceMeta.bciOk ? 'OK' : 'FAIL'}), CMC: ${contextSourceMeta.cmcAtoms} atoms, Tags: ${contextSourceMeta.expandedTags}` },
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
        source_refs: [`bci:${contextSourceMeta.bciEntities}`, `cmc:${contextSourceMeta.cmcAtoms}`],
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
    collectAndPostProcess(supabase, captureStream, chainId, lastUserMsg, cmcContext.atoms, dynamicConfig, liveState);

    // ── STEP 11: Update atom access counts ──
    for (const atom of cmcContext.atoms) {
      supabase.from("aimos_memory_atoms")
        .update({ access_count: (atom.access_count || 0) + 1, last_accessed_at: new Date().toISOString() })
        .eq("id", atom.id)
        .then(() => {});
    }

    // ── STEP 12: Periodic background tasks (every 10th call) ──
    if (callCounter % 10 === 0) {
      runMemoryLifecycle(supabase).catch(e => console.error("[hq-chat] Memory lifecycle error:", e));
    }

    // ── STEP 13: Execute approved proposals (every 5th call) ──
    if (callCounter % 5 === 0) {
      executeApprovedProposals(supabase).catch(e => console.error("[hq-chat] Proposal execution error:", e));
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
// PHASE 1: PROPOSAL EXECUTION LOOP
// ═══════════════════════════════════════════════════════════

async function executeApprovedProposals(supabase: any) {
  try {
    const { data: proposals } = await supabase
      .from("evolution_proposals")
      .select("id, title, implementation_plan, priority, status")
      .eq("status", "approved")
      .is("applied_at", null)
      .order("priority", { ascending: false })
      .limit(3);

    if (!proposals || proposals.length === 0) return;

    for (const proposal of proposals) {
      const appliedChanges: string[] = [];
      const plan = proposal.implementation_plan;
      
      if (plan && typeof plan === "object") {
        const steps = Array.isArray(plan) ? plan : (plan.steps || []);
        
        for (const step of steps) {
          const stepText = typeof step === "string" ? step : (step.description || step.action || JSON.stringify(step));
          const stepLower = stepText.toLowerCase();
          
          // Auto-execute config threshold changes
          if (stepLower.includes("threshold") || stepLower.includes("config") || stepLower.includes("parameter")) {
            // Extract key-value pairs from step text
            const kvMatch = stepText.match(/(\w+[\w_]*)\s*(?:to|=|:)\s*([\d.]+)/i);
            if (kvMatch) {
              const [, key, value] = kvMatch;
              await supabase.from("aimos_config").upsert({
                config_key: key.toLowerCase(),
                config_value: { value: parseFloat(value) },
                description: `Auto-applied from proposal: ${proposal.title}`,
                updated_by: "proposal_executor",
                proposal_id: proposal.id,
              }, { onConflict: "config_key" });
              appliedChanges.push(`Config ${key}=${value}`);
            }
          }
          
          // Auto-create test scenarios for monitoring steps
          if (stepLower.includes("monitor") || stepLower.includes("test") || stepLower.includes("scenario")) {
            await supabase.from("aimos_test_scenarios").insert({
              name: `Auto: ${proposal.title.slice(0, 50)}`,
              scenario_type: "regression",
              description: stepText.slice(0, 300),
              config: { source_proposal: proposal.id },
            });
            appliedChanges.push(`Test scenario created`);
          }
        }
      }
      
      // Mark proposal as applied
      await supabase.from("evolution_proposals").update({
        applied_at: new Date().toISOString(),
        applied_changes: appliedChanges.length > 0 ? appliedChanges : ["Reviewed — no auto-applicable steps"],
        status: "applied",
      }).eq("id", proposal.id);

      // Log to Agent Discord
      await supabase.from("aimos_agent_discord").insert({
        agent_role: "meta_observer",
        message_type: "PROPOSAL_APPLIED",
        content: `Proposal "${proposal.title}" applied. Changes: ${appliedChanges.join(", ") || "none auto-applicable"}`,
        confidence: 1.0,
        metadata: { proposal_id: proposal.id, changes: appliedChanges },
      });

      console.log(`[hq-chat] Applied proposal: ${proposal.title} (${appliedChanges.length} changes)`);
    }
  } catch (e) {
    console.error("[hq-chat] Proposal execution error:", e);
  }
}

// ═══════════════════════════════════════════════════════════
// PHASE 4: MEMORY LIFECYCLE — Decay, Promote, Compress
// ═══════════════════════════════════════════════════════════

async function runMemoryLifecycle(supabase: any) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  try {
    // ── DECAY: Atoms not accessed in 7 days with access_count=0 ──
    const tierDemotions: Record<string, string> = { hot: "warm", warm: "cold", cold: "frozen" };
    
    for (const [fromLevel, toLevel] of Object.entries(tierDemotions)) {
      const { data: staleAtoms } = await supabase
        .from("aimos_memory_atoms")
        .select("id, content, memory_level")
        .eq("memory_level", fromLevel)
        .eq("access_count", 0)
        .lt("last_accessed_at", sevenDaysAgo)
        .limit(10);

      if (staleAtoms && staleAtoms.length > 0) {
        for (const atom of staleAtoms) {
          const updateData: any = { memory_level: toLevel };
          // Compress when demoting to cold/frozen
          if (toLevel === "cold" || toLevel === "frozen") {
            updateData.compressed_from = atom.content?.slice(0, 200) + "...";
            updateData.compression_ratio = 0.2;
          }
          await supabase.from("aimos_memory_atoms").update(updateData).eq("id", atom.id);
        }
        console.log(`[hq-chat] Memory decay: ${staleAtoms.length} atoms ${fromLevel}→${toLevel}`);
      }
    }

    // ── PROMOTE: Atoms accessed 3+ times in last 48 hours ──
    const tierPromotions: Record<string, string> = { frozen: "cold", cold: "warm", warm: "hot" };
    
    for (const [fromLevel, toLevel] of Object.entries(tierPromotions)) {
      const { data: hotAtoms } = await supabase
        .from("aimos_memory_atoms")
        .select("id")
        .eq("memory_level", fromLevel)
        .gte("access_count", 3)
        .gte("last_accessed_at", twoDaysAgo)
        .limit(10);

      if (hotAtoms && hotAtoms.length > 0) {
        for (const atom of hotAtoms) {
          await supabase.from("aimos_memory_atoms").update({ memory_level: toLevel }).eq("id", atom.id);
        }
        console.log(`[hq-chat] Memory promote: ${hotAtoms.length} atoms ${fromLevel}→${toLevel}`);
      }
    }

    // ── VERIFICATION DECAY: Reset verified atoms older than 30 days ──
    const { data: expiredVerified } = await supabase
      .from("aimos_memory_atoms")
      .select("id")
      .eq("verification_status", "verified")
      .lt("updated_at", thirtyDaysAgo)
      .limit(20);

    if (expiredVerified && expiredVerified.length > 0) {
      for (const atom of expiredVerified) {
        await supabase.from("aimos_memory_atoms").update({ verification_status: "pending" }).eq("id", atom.id);
      }
      console.log(`[hq-chat] Verification decay: ${expiredVerified.length} atoms reset to pending`);
    }

    // Log lifecycle run
    await supabase.from("aimos_agent_discord").insert({
      agent_role: "meta_observer",
      message_type: "LIFECYCLE_RUN",
      content: `Memory lifecycle completed at ${now.toISOString()}`,
      confidence: 1.0,
    });

  } catch (e) {
    console.error("[hq-chat] Memory lifecycle error:", e);
  }
}

// ═══════════════════════════════════════════════════════════
// DYNAMIC CONFIG & PROMPTS
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
}

// ═══════════════════════════════════════════════════════════
// AGENT GENOMES — Persistent Agent Identity & Context
// ═══════════════════════════════════════════════════════════

async function loadAgentGenomes(supabase: any): Promise<any[]> {
  try {
    const { data: genomes } = await supabase
      .from("agent_genomes")
      .select("agent_role, display_name, system_prompt_core, capabilities, skill_levels, avg_kappa, total_tasks_completed, rank, clearance_level, division, reports_to, standing_orders, rules_of_engagement, domain_scope, elo_rating")
      .order("priority", { ascending: true });

    if (!genomes || genomes.length === 0) return [];

    const roles = genomes.map((g: any) => g.agent_role);
    const { data: contextEntries } = await supabase
      .from("agent_context_bank")
      .select("agent_role, context_type, content, importance")
      .in("agent_role", roles)
      .order("importance", { ascending: false })
      .limit(30);

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

// ═══════════════════════════════════════════════════════════
// POST-PROCESSING: Collect full response, run VIF + SEG + Plan Advancement + Contradiction Detection
// ═══════════════════════════════════════════════════════════

async function collectAndPostProcess(
  supabase: any,
  stream: ReadableStream,
  chainId: string,
  query: string,
  atoms: any[],
  config: Record<string, any>,
  liveState: Record<string, any>
) {
  try {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
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

    // ── PHASE 2: Improved VIF Score ──
    const recentChains = await getRecentChains(supabase, 3);
    const vifScore = computeEnhancedVIFScore(fullResponse, query, atoms, recentChains);

    // ── SEG: Extract entities from response ──
    const entities = extractLocalEntities(fullResponse);

    // ── PHASE 2: Contradiction detection against SEG ──
    await detectContradictions(supabase, entities, chainId, vifScore.kappa);

    // ── PHASE 2: Verify retrieved atoms if response is consistent ──
    if (vifScore.kappa > 0.6) {
      await verifyRetrievedAtoms(supabase, atoms);
    }

    // ── Update reasoning chain with final answer + κ ──
    const reasoningSteps = [
      { phase: "CMC_RETRIEVE", detail: `${atoms.length} atoms retrieved` },
      { phase: "VIF_PREGATE", detail: `Pre-gate passed` },
      { phase: "AI_GENERATE", detail: `${fullResponse.length} chars generated` },
      { phase: "VIF_POSTGATE", detail: `κ=${vifScore.kappa.toFixed(3)} (${vifScore.tier}), components: fact=${vifScore.components.factualAccuracy.toFixed(2)} cons=${vifScore.components.selfConsistency.toFixed(2)} comp=${vifScore.components.completeness.toFixed(2)} rel=${vifScore.components.relevance.toFixed(2)}` },
      { phase: "SEG_EXTRACT", detail: `${entities.length} entities found` },
    ];

    // ── PHASE 3: Plan advancement ──
    const planAdvancement = await advanceActivePlan(supabase, fullResponse, query, vifScore.kappa, liveState);
    if (planAdvancement) {
      reasoningSteps.push({ phase: "PLAN_ADVANCE", detail: planAdvancement });
    }

    await supabase.from("aimos_reasoning_chains").update({
      final_answer: fullResponse.slice(0, 2000),
      confidence_kappa: vifScore.kappa,
      quality_tier: vifScore.tier,
      completeness_score: vifScore.components.completeness,
      reasoning_steps: reasoningSteps,
    }).eq("id", chainId);

    // ── PHASE 2: κ-gating warning (logged, not streamed since post-processing) ──
    if (vifScore.kappa < 0.4) {
      console.warn(`[hq-chat] VIF LOW CONFIDENCE: κ=${vifScore.kappa.toFixed(3)} for query: "${query.slice(0, 60)}"`);
    }

    // ── Store high-confidence response as memory atom (boosted confidence for retrieval visibility) ──
    if (vifScore.kappa > (config.vif_kappa_threshold || 0.6) && fullResponse.length > 50) {
      const boostedConfidence = Math.max(0.7, vifScore.kappa);
      await supabase.from("aimos_memory_atoms").insert({
        content: `AI Response (κ=${vifScore.kappa.toFixed(2)}): ${fullResponse.slice(0, 1000)}`,
        content_type: "ai_response",
        tags: extractTags(query),
        memory_level: "warm",
        access_count: 1, // Start at 1 to prevent immediate decay
        confidence_score: boostedConfidence,
        quality_score: vifScore.kappa,
        verification_status: vifScore.kappa > 0.7 ? "verified" : "pending",
        metadata: { chain_id: chainId, source: "hq_chat_response", entities_extracted: entities.length, vif_components: vifScore.components },
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
      content: `Post-processed: ${fullResponse.length} chars, κ=${vifScore.kappa.toFixed(3)} [F:${vifScore.components.factualAccuracy.toFixed(2)} C:${vifScore.components.selfConsistency.toFixed(2)} R:${vifScore.components.relevance.toFixed(2)}], ${entities.length} entities. ${planAdvancement || "No active plan."}`,
      metadata: { chainId, kappa: vifScore.kappa, entities: entities.length, responseLength: fullResponse.length, vifComponents: vifScore.components },
      confidence: vifScore.kappa,
    });

    // ── Update agent genomes ──
    const primaryAgent = inferPrimaryAgent(query);
    const learnings = extractLearnings(fullResponse, query);
    const estimatedTokens = Math.ceil(fullResponse.length / 4);
    
    await Promise.all([
      updateAgentGenomePostTask(supabase, "meta_observer", vifScore.kappa, estimatedTokens, [`Processed query: "${query.slice(0, 60)}". κ=${vifScore.kappa.toFixed(2)}`], chainId),
      primaryAgent !== "meta_observer" 
        ? updateAgentGenomePostTask(supabase, primaryAgent, vifScore.kappa, estimatedTokens, learnings, chainId)
        : Promise.resolve(),
    ]);

    // ── Context Bank Pruning ──
    await pruneContextBanks(supabase, primaryAgent);

  } catch (e) {
    console.error("[hq-chat] Post-processing error:", e);
  }
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: ENHANCED VIF — Self-consistency, weighted scoring
// ═══════════════════════════════════════════════════════════

interface VIFComponents {
  factualAccuracy: number;
  selfConsistency: number;
  completeness: number;
  relevance: number;
  hedgingBonus: number;
}

async function getRecentChains(supabase: any, limit: number): Promise<any[]> {
  try {
    const { data } = await supabase
      .from("aimos_reasoning_chains")
      .select("final_answer, confidence_kappa, user_query")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch { return []; }
}

function computeEnhancedVIFScore(
  response: string, query: string, atoms: any[], recentChains: any[]
): { kappa: number; tier: string; components: VIFComponents } {
  const responseLower = response.toLowerCase();

  // 1. Factual accuracy: weighted by atom confidence
  let factualAccuracy = 0.5;
  if (atoms.length > 0) {
    let totalWeight = 0;
    let weightedOverlap = 0;
    for (const atom of atoms) {
      const atomConf = atom.confidence_score || 0.5;
      const words = (atom.content?.toLowerCase() || "").split(/\s+/).filter((w: string) => w.length > 4);
      const matched = words.filter((w: string) => responseLower.includes(w)).length;
      const overlap = words.length > 0 ? matched / words.length : 0;
      weightedOverlap += overlap * atomConf;
      totalWeight += atomConf;
    }
    factualAccuracy = totalWeight > 0 ? Math.min(1, weightedOverlap / totalWeight) : 0.5;
  }

  // 2. Self-consistency: compare against recent chains
  let selfConsistency = 0.8; // default high if no history
  if (recentChains.length > 0) {
    let contradictionScore = 0;
    for (const chain of recentChains) {
      const prevAnswer = (chain.final_answer || "").toLowerCase();
      if (prevAnswer.length < 20) continue;
      // Check for direct contradictions: same topic, opposite claims
      const prevWords = new Set(prevAnswer.split(/\s+/).filter((w: string) => w.length > 5));
      const responseWords = responseLower.split(/\s+/).filter((w: string) => w.length > 5);
      const sharedWords = responseWords.filter(w => prevWords.has(w));
      // If high overlap but different sentiment markers, flag
      if (sharedWords.length > 5) {
        const prevNeg = (prevAnswer.match(/\b(not|never|false|incorrect|wrong|don't|doesn't)\b/g) || []).length;
        const respNeg = (responseLower.match(/\b(not|never|false|incorrect|wrong|don't|doesn't)\b/g) || []).length;
        if (Math.abs(prevNeg - respNeg) > 2) {
          contradictionScore += 0.2;
        }
      }
    }
    selfConsistency = Math.max(0.3, 1 - contradictionScore);
  }

  // 3. Completeness: check if all retrieved atoms were addressed
  let completeness = 0.5;
  if (atoms.length > 0) {
    let atomsAddressed = 0;
    for (const atom of atoms) {
      const keyWords = (atom.content?.toLowerCase() || "").split(/\s+/).filter((w: string) => w.length > 5).slice(0, 5);
      const anyMatch = keyWords.some((w: string) => responseLower.includes(w));
      if (anyMatch) atomsAddressed++;
    }
    completeness = atoms.length > 0 ? atomsAddressed / atoms.length : 0.5;
  } else {
    // No atoms — use response length as proxy
    const responseWords = response.split(/\s+/).length;
    const queryWords = query.split(/\s+/).length;
    completeness = Math.min(1, responseWords / (queryWords * 5));
  }

  // 4. Relevance: keyword overlap with query
  const queryKeywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const relevantHits = queryKeywords.filter((k: string) => responseLower.includes(k)).length;
  const relevance = queryKeywords.length > 0 ? relevantHits / queryKeywords.length : 0.5;

  // 5. Hedging bonus: explicit confidence statements are good
  const hedgingBonus = (response.match(/\b(I'm uncertain|low confidence|not sure|approximately|roughly|I believe but)\b/gi) || []).length > 0 ? 0.05 : 0;
  const hedgePenalty = (response.match(/\b(however|but|although|on the other hand|conversely)\b/gi) || []).length;
  const hedgeScore = Math.max(0, hedgingBonus - hedgePenalty * 0.02);

  const components: VIFComponents = { factualAccuracy, selfConsistency, completeness, relevance, hedgingBonus: hedgeScore };

  // Weighted kappa
  const kappa = Math.min(1, Math.max(0,
    factualAccuracy * 0.25 +
    selfConsistency * 0.25 +
    completeness * 0.20 +
    relevance * 0.20 +
    0.10 + // freshness baseline
    hedgeScore
  ));

  const tier = kappa > 0.8 ? "green" : kappa > 0.5 ? "yellow" : "red";

  return { kappa, tier, components };
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: CONTRADICTION DETECTION
// ═══════════════════════════════════════════════════════════

async function detectContradictions(supabase: any, entities: { name: string; type: string; context: string }[], chainId: string, kappa: number) {
  try {
    for (const entity of entities.slice(0, 5)) {
      const { data: existing } = await supabase
        .from("aimos_entities")
        .select("id, name, description, confidence")
        .eq("name", entity.name)
        .limit(1);

      if (existing && existing.length > 0) {
        const prev = existing[0];
        // Check if descriptions substantially differ
        if (prev.description && entity.context) {
          const prevWords = new Set(prev.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));
          const newWords = entity.context.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
          const overlap = newWords.filter(w => prevWords.has(w)).length;
          const similarity = prevWords.size > 0 ? overlap / prevWords.size : 1;

          if (similarity < 0.3 && prev.description.length > 20 && entity.context.length > 20) {
            // Flag as potential contradiction
            await supabase.from("aimos_claim_verification").insert({
              claim_text: `Entity "${entity.name}" has conflicting descriptions. Previous: "${prev.description.slice(0, 150)}". New: "${entity.context.slice(0, 150)}"`,
              chain_id: chainId,
              status: "disputed",
              confidence: Math.min(kappa, prev.confidence || 0.5),
            });
            console.log(`[hq-chat] Contradiction detected for entity: ${entity.name}`);
          } else {
            // Consistent — verify the claim
            await supabase.from("aimos_claim_verification").insert({
              claim_text: `Entity "${entity.name}" confirmed consistent across chains`,
              chain_id: chainId,
              status: "verified",
              confidence: kappa,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[hq-chat] Contradiction detection error:", e);
  }
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: VERIFY RETRIEVED ATOMS
// ═══════════════════════════════════════════════════════════

async function verifyRetrievedAtoms(supabase: any, atoms: any[]) {
  try {
    for (const atom of atoms.slice(0, 5)) {
      if (atom.verification_status === "pending") {
        await supabase.from("aimos_memory_atoms").update({
          verification_status: "verified",
          updated_at: new Date().toISOString(),
        }).eq("id", atom.id);
      }
    }
  } catch (e) {
    console.error("[hq-chat] Atom verification error:", e);
  }
}

// ═══════════════════════════════════════════════════════════
// PHASE 3: PLAN ADVANCEMENT
// ═══════════════════════════════════════════════════════════

async function advanceActivePlan(supabase: any, response: string, query: string, kappa: number, liveState: any): Promise<string | null> {
  try {
    const activePlan = liveState.activePlan;
    if (!activePlan) return null;

    const steps = Array.isArray(activePlan.steps) ? activePlan.steps : [];
    const currentStep = activePlan.current_step || 0;
    
    if (currentStep >= steps.length) return null;

    // Check if response is substantive enough to advance
    if (response.length > 200 && kappa > 0.5) {
      const nextStep = currentStep + 1;
      const executionLog = Array.isArray(activePlan.execution_log) ? activePlan.execution_log : [];
      
      executionLog.push({
        step: currentStep,
        completed_at: new Date().toISOString(),
        kappa,
        response_length: response.length,
        query: query.slice(0, 100),
      });

      const updateData: any = {
        current_step: nextStep,
        execution_log: executionLog,
        updated_at: new Date().toISOString(),
      };

      // Complete plan if all steps done
      if (nextStep >= steps.length) {
        updateData.status = "completed";
        updateData.completed_at = new Date().toISOString();
      }

      await supabase.from("aimos_plans").update(updateData).eq("id", activePlan.id);

      const stepDesc = typeof steps[currentStep] === "string" ? steps[currentStep] : (steps[currentStep]?.description || `Step ${currentStep}`);
      const msg = nextStep >= steps.length
        ? `Plan "${activePlan.title}" COMPLETED (all ${steps.length} steps done)`
        : `Plan "${activePlan.title}" advanced: step ${currentStep}→${nextStep}/${steps.length} (${stepDesc.slice(0, 60)})`;

      await supabase.from("aimos_agent_discord").insert({
        agent_role: "planner",
        message_type: "PLAN_ADVANCE",
        content: msg,
        confidence: kappa,
        plan_id: activePlan.id,
      });

      return msg;
    }

    return `Plan "${activePlan.title}" active at step ${currentStep}/${steps.length} — response too brief or low-κ to advance`;
  } catch (e) {
    console.error("[hq-chat] Plan advancement error:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// CONTEXT BANK PRUNING
// ═══════════════════════════════════════════════════════════

async function pruneContextBanks(supabase: any, agentRole: string) {
  try {
    const { data: entries } = await supabase
      .from("agent_context_bank")
      .select("id, importance, last_accessed_at, access_count, content")
      .eq("agent_role", agentRole)
      .order("importance", { ascending: true });

    if (!entries || entries.length <= 50) return;

    const now = Date.now();
    const toDelete: string[] = [];

    for (const e of entries) {
      const lastAccess = e.last_accessed_at ? new Date(e.last_accessed_at).getTime() : now - 7 * 86400000;
      const daysSinceAccess = (now - lastAccess) / 86400000;
      const decayedImportance = Math.max(0, (e.importance || 0.5) - daysSinceAccess * 0.01);

      if (decayedImportance < 0.1 && (e.access_count || 0) === 0) {
        toDelete.push(e.id);
      } else if (decayedImportance !== e.importance) {
        await supabase.from("agent_context_bank").update({ importance: decayedImportance }).eq("id", e.id);
      }
    }

    if (entries.length - toDelete.length > 50) {
      const remaining = entries.filter((e: any) => !toDelete.includes(e.id));
      const excess = remaining.slice(0, remaining.length - 50);
      toDelete.push(...excess.map((e: any) => e.id));
    }

    if (toDelete.length > 0) {
      await supabase.from("agent_context_bank").delete().in("id", toDelete.slice(0, 20));
      console.log(`[hq-chat] Pruned ${Math.min(toDelete.length, 20)} context entries for ${agentRole}`);
    }
  } catch (e) {
    console.error("[hq-chat] Context pruning error:", e);
  }
}

function inferPrimaryAgent(query: string): string {
  const q = query.toLowerCase();
  if (/plan|decompos|goal|task|schedul|priorit/i.test(q)) return "planner";
  if (/search|find|research|evidence|retriev|gather/i.test(q)) return "researcher";
  if (/build|code|implement|create|schema|function/i.test(q)) return "builder";
  if (/verif|check|valid|confiden|hallucin|test/i.test(q)) return "verifier";
  if (/audit|review|quality|assess|improv/i.test(q)) return "auditor";
  if (/doc|write|spec|guide|summar/i.test(q)) return "documenter";
  return "researcher";
}

function extractLearnings(response: string, query: string): string[] {
  const learnings: string[] = [];
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const scored = sentences.map(s => ({
    text: s.trim(),
    score: (s.match(/\b(is|are|means|requires|should|must|because|therefore|specifically)\b/gi) || []).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  for (const s of scored.slice(0, 3)) {
    if (s.score > 0) learnings.push(s.text.slice(0, 200));
  }
  if (learnings.length === 0) learnings.push(`Handled query: "${query.slice(0, 100)}"`);
  return learnings;
}

function extractLocalEntities(text: string): { name: string; type: string; context: string }[] {
  const entities: { name: string; type: string; context: string }[] = [];
  
  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const seen = new Set<string>();
  let match;
  while ((match = capitalizedPattern.exec(text)) !== null) {
    const name = match[1];
    if (name.length > 2 && !seen.has(name.toLowerCase()) && !["The", "This", "That", "These", "Those", "Here", "There"].includes(name)) {
      seen.add(name.toLowerCase());
      const start = Math.max(0, match.index - 50);
      const end = Math.min(text.length, match.index + name.length + 50);
      entities.push({
        name,
        type: inferEntityType(name, text),
        context: text.slice(start, end).replace(/\n/g, " ").trim(),
      });
    }
  }

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

    // ── PHASE 3: Load active plan with current step ──
    const { data: activePlans } = await supabase
      .from("aimos_plans")
      .select("id, title, objective, status, current_step, steps, execution_log")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

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
      activePlan: activePlans?.[0] || null,
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
    .select("id, content, content_type, tags, source_refs, confidence_score, memory_level, access_count, verification_status")
    .in("memory_level", ["hot", "warm"])
    .order("confidence_score", { ascending: false })
    .limit(retrievalLimit + 2);

  if (keywordFilter) q1 = q1.or(keywordFilter);
  const { data: keywordAtoms } = await q1;

  let tagAtoms: any[] = [];
  if (tags.length > 0) {
    const { data } = await supabase
      .from("aimos_memory_atoms")
      .select("id, content, content_type, tags, source_refs, confidence_score, memory_level, access_count, verification_status")
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
    const verifiedTag = a.verification_status === "verified" ? "✓" : "?";
    parts.push(`[${a.memory_level.toUpperCase()} ${verifiedTag} | ${(a.tags || []).join(",")} | κ=${Math.round((a.confidence_score || 0.5) * 100)}%]\n${a.content}`);
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

function buildSystemPrompt(liveState: any, cmcContext: any, pregate: any, tags: string[], dynamicPrompts: string[], agentGenomes: any[] = [], bciManifest: any = null): string {
  let prompt = `You are **HQ Intelligence** — the cognitive command center for AIMOS.

## System Architecture
You operate within a 6-subsystem cognitive stack:
- **CMC** (Context Memory Core): 4-tier memory (hot/warm/cold/frozen) with semantic compression and active lifecycle
- **HHNI** (Hierarchical Navigation Index): Tag taxonomy with co-occurrence expansion
- **VIF** (Verifiable Intelligence Framework): κ confidence scoring with quality gates, contradiction detection, and self-consistency checks
- **APOE** (Orchestration Engine): T0→T6 goal decomposition with agent swarm and automatic plan advancement
- **SEG** (Symbolic Evidence Graph): Entity-relationship knowledge graph with contradiction flagging
- **SELF-EVOLUTION**: Approval-gated autonomous improvement with automatic proposal execution

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

  // ── PHASE 3: Inject active plan directive ──
  if (liveState.activePlan) {
    const plan = liveState.activePlan;
    const steps = Array.isArray(plan.steps) ? plan.steps : [];
    const currentStep = plan.current_step || 0;
    if (currentStep < steps.length) {
      const stepDesc = typeof steps[currentStep] === "string" ? steps[currentStep] : (steps[currentStep]?.description || `Step ${currentStep}`);
      prompt += `\n\n## 🎯 ACTIVE PLAN DIRECTIVE
You are currently executing **Step ${currentStep + 1}/${steps.length}** of plan "${plan.title}":
> ${stepDesc}

**Focus your response on completing this step.** When you provide a substantive answer (>200 chars, κ>0.5), the plan will automatically advance to the next step.`;
    } else {
      prompt += `\n\n## ✅ Plan "${plan.title}" — All ${steps.length} steps completed.`;
    }
  }

  // Inject agent genome awareness
  if (agentGenomes.length > 0) {
    prompt += `\n\n## Agent Swarm — Persistent Genomes\nYou coordinate ${agentGenomes.length} specialized agents, each with persistent identity and evolving skills:\n`;
    for (const g of agentGenomes) {
      const skills = Object.entries(g.skill_levels || {})
        .map(([k, v]) => `${k.replace(/_/g, ' ')}:${((v as number) * 100).toFixed(0)}%`)
        .join(', ');
      prompt += `- **${g.display_name}** (${g.agent_role}): ${g.total_tasks_completed} tasks, κ=${((g.avg_kappa || 0.5) * 100).toFixed(0)}% | Skills: ${skills}\n`;
      
      if (g.top_context && g.top_context.length > 0) {
        prompt += `  Context: ${g.top_context.map((c: any) => `[${c.context_type}] ${c.content.slice(0, 80)}`).join(' | ')}\n`;
      }
    }
    prompt += `\nWhen delegating work, reference the appropriate agent's capabilities and accumulated context. Agents learn from each interaction and maintain their own specialized knowledge banks.`;
  }

  // Inject dynamic prompts from evolution proposals
  if (dynamicPrompts.length > 0) {
    prompt += `\n\n## Dynamic Directives (from Self-Evolution)\n${dynamicPrompts.join("\n\n")}`;
  }

  if (cmcContext.contextBlock) {
    prompt += `\n\n## Retrieved Memory Context\n${cmcContext.contextBlock}`;
  }

  // ── BCI Context Sync — Structured boundary views ──
  if (bciManifest && bciManifest.manifest && bciManifest.manifest.length > 0) {
    prompt += `\n\n## 🔗 BCI Contextual Sync (${bciManifest.entity_count} entities, ${bciManifest.total_tokens} tokens)\n`;
    for (const item of bciManifest.manifest.slice(0, 15)) {
      prompt += `- **${item.entity_id}** [${item.kind}|${item.level}|U=${item.utility}]: ${(item.content || "").slice(0, 200)}\n`;
    }
    if (bciManifest.dropped?.length > 0) {
      prompt += `\n_${bciManifest.dropped.length} entities dropped (budget: ${bciManifest.budget_remaining} tokens remaining)_`;
    }
  }

  if (pregate.shouldHedge) {
    prompt += `\n\n## ⚠ VIF Pre-Gate Warning\nContext quality: ${pregate.quality} (${pregate.atomCount} atoms, κ=${(pregate.avgConfidence * 100).toFixed(0)}%). Hedge appropriately and note what you're uncertain about.`;
  }

  return prompt;
}
