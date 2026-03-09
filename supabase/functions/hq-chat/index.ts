import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════
// HQ-CHAT — Full Cognitive Pipeline with Autonomous Action Queue
// CMC Retrieve → HHNI Expand → VIF Pre-Gate → AI Generate (with tools) → VIF Post-Gate → SEG Extract → CMC Store
// + Autonomous Actions → Approval Queue → Plan Advancement → Memory Lifecycle → Contradiction Detection
// ═══════════════════════════════════════════════════════════

let callCounter = 0;

// ─── TOOL DEFINITIONS for autonomous actions ───
const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "propose_memory_write",
      description: "Propose writing important information to persistent memory. Creates an approval request for the user.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The content to store in memory" },
          tags: { type: "array", items: { type: "string" }, description: "Tags for categorization" },
          importance: { type: "number", description: "Importance score 0-1" },
          reason: { type: "string", description: "Why this should be remembered" },
        },
        required: ["content", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_evolution",
      description: "Propose a system improvement or architectural change. Requires user approval.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title for the proposal" },
          description: { type: "string", description: "Detailed description of the improvement" },
          implementation_plan: { type: "array", items: { type: "string" }, description: "Steps to implement" },
          priority: { type: "number", description: "Priority 1-10" },
        },
        required: ["title", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a task in the orchestration queue for an agent to work on.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          agent_role: { type: "string", enum: ["planner", "researcher", "builder", "verifier", "auditor", "documenter", "meta_observer"], description: "Which agent should handle this" },
          tier: { type: "string", enum: ["T0", "T1", "T2", "T3", "T4", "T5", "T6"], description: "Goal decomposition tier" },
          description: { type: "string", description: "Task description" },
        },
        required: ["title", "agent_role"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_plan",
      description: "Create a multi-step plan with automatic advancement tracking.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Plan title" },
          objective: { type: "string", description: "What the plan achieves" },
          steps: { type: "array", items: { type: "string" }, description: "Ordered steps" },
        },
        required: ["title", "objective", "steps"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_memory",
      description: "Search the AIMOS memory system for relevant information.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          memory_level: { type: "string", enum: ["hot", "warm", "cold", "frozen", "all"], description: "Which memory tier to search" },
          limit: { type: "number", description: "Max results" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_knowledge_graph",
      description: "Query the SEG knowledge graph for entities and relationships.",
      parameters: {
        type: "object",
        properties: {
          entity_name: { type: "string", description: "Entity to look up" },
          relationship_type: { type: "string", description: "Optional filter by relationship type" },
        },
        required: ["entity_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_diagnostics",
      description: "Run system diagnostics and health checks on AIMOS subsystems.",
      parameters: {
        type: "object",
        properties: {
          subsystem: { type: "string", enum: ["cmc", "vif", "seg", "apoe", "all"], description: "Which subsystem to diagnose" },
        },
        required: ["subsystem"],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const lastUserMsg = messages?.[messages.length - 1]?.content || "";
    callCounter++;

    // ── Parallel context loading ──
    const [dynamicConfig, liveState, agentGenomes, dynamicPrompts, autonomySettings] = await Promise.all([
      loadDynamicConfig(supabase),
      gatherLiveState(supabase),
      loadAgentGenomes(supabase),
      loadDynamicPrompts(supabase),
      loadAutonomySettings(supabase),
    ]);

    // ── CMC Retrieval with HHNI tag expansion ──
    const queryTags = extractTags(lastUserMsg);
    const expandedTags = await expandTagsViaHHNI(supabase, queryTags);
    const cmcContext = await retrieveFromCMC(supabase, lastUserMsg, expandedTags, dynamicConfig);

    // ── Context Sync — BCI-powered context resolution ──
    let bciManifest: any = null;
    try {
      const csResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/context-sync`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "resolve_context", prompt: lastUserMsg, token_budget: 3000, policy_name: "default" }),
      });
      if (csResp.ok) bciManifest = await csResp.json();
    } catch (e) { console.error("[hq-chat] Context-sync failed:", e); }

    // ── VIF Pre-Gate ──
    const pregate = assessPregate(cmcContext.atoms);

    // ── Load pending actions count for awareness ──
    const { count: pendingActionsCount } = await supabase
      .from("ai_action_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // ── Build system prompt ──
    const systemPrompt = buildSystemPrompt(liveState, cmcContext, pregate, expandedTags, dynamicPrompts, agentGenomes, bciManifest, autonomySettings, pendingActionsCount || 0);

    // ── Create reasoning chain ──
    const chainId = crypto.randomUUID();
    const conversationId = crypto.randomUUID();
    
    if (lastUserMsg.length > 5) {
      await supabase.from("aimos_reasoning_chains").insert({
        id: chainId,
        conversation_id: conversationId,
        user_query: lastUserMsg.slice(0, 500),
        reasoning_steps: [
          { phase: "CMC_RETRIEVE", detail: `${cmcContext.atoms.length} atoms, ${expandedTags.length} tags` },
          { phase: "VIF_PREGATE", detail: `Quality: ${pregate.quality}, κ=${((pregate.avgConfidence || 0) * 100).toFixed(1)}%` },
          { phase: "AI_GENERATE", detail: "Streaming with tool-calling enabled" },
        ],
        final_answer: "[streaming]",
        depth: 3,
        response_type: "chat",
        coherence_score: pregate.avgConfidence,
        confidence_kappa: pregate.avgConfidence,
        quality_tier: pregate.quality === "sufficient" ? "green" : "yellow",
        source_refs: [`bci:${bciManifest ? 1 : 0}`, `cmc:${cmcContext.atoms.length}`],
      });
    }

    // ── Determine if we should use tool-calling or streaming ──
    // Tool-calling for complex queries; streaming for simple chat
    const isToolQuery = /\b(remember|store|create|plan|propose|diagnose|search|find|task|evolve|improve|fix|analyze|build)\b/i.test(lastUserMsg);

    if (isToolQuery) {
      // NON-STREAMING path with tool calling
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          tools: TOOL_DEFINITIONS,
          stream: false,
        }),
      });

      if (!aiResponse.ok) {
        return handleAIError(aiResponse);
      }

      const aiResult = await aiResponse.json();
      const choice = aiResult.choices?.[0];
      let finalContent = choice?.message?.content || "";
      const toolCalls = choice?.message?.tool_calls || [];

      // Execute tool calls
      const toolResults: string[] = [];
      for (const tc of toolCalls) {
        const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        const result = await executeToolCall(supabase, tc.function.name, args, chainId, autonomySettings);
        toolResults.push(`**${tc.function.name}**: ${result}`);
      }

      if (toolResults.length > 0) {
        finalContent += (finalContent ? "\n\n" : "") + "---\n**🔧 Actions Taken:**\n" + toolResults.join("\n");
      }

      // If no content at all, do a follow-up without tools
      if (!finalContent.trim() && toolResults.length > 0) {
        const followUpResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
              { role: "assistant", content: null, tool_calls: toolCalls },
              ...toolCalls.map((tc: any) => ({ role: "tool", tool_call_id: tc.id, content: toolResults.join("\n") })),
            ],
            stream: false,
          }),
        });
        if (followUpResp.ok) {
          const followUp = await followUpResp.json();
          finalContent = (followUp.choices?.[0]?.message?.content || "") + "\n\n" + toolResults.join("\n");
        }
      }

      // Post-process
      postProcessResponse(supabase, chainId, lastUserMsg, finalContent, cmcContext.atoms, dynamicConfig, liveState).catch(e => console.error("[hq-chat] Post-process error:", e));

      // Return as SSE for client compatibility
      const encoder = new TextEncoder();
      const sseStream = new ReadableStream({
        start(controller) {
          // Split into chunks for token-by-token feel
          const chunks = finalContent.match(/.{1,20}/g) || [finalContent];
          let i = 0;
          const send = () => {
            if (i < chunks.length) {
              const data = JSON.stringify({ choices: [{ delta: { content: chunks[i] } }] });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              i++;
              setTimeout(send, 10);
            } else {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          };
          send();
        },
      });

      return new Response(sseStream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // ── STREAMING path (simple chat) ──
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) return handleAIError(response);

    const [clientStream, captureStream] = response.body!.tee();

    collectAndPostProcess(supabase, captureStream, chainId, lastUserMsg, cmcContext.atoms, dynamicConfig, liveState);

    // Update atom access counts
    for (const atom of cmcContext.atoms) {
      supabase.from("aimos_memory_atoms")
        .update({ access_count: (atom.access_count || 0) + 1, last_accessed_at: new Date().toISOString() })
        .eq("id", atom.id).then(() => {});
    }

    // Periodic background tasks
    if (callCounter % 10 === 0) runMemoryLifecycle(supabase).catch(e => console.error("[hq-chat] Lifecycle:", e));
    if (callCounter % 5 === 0) executeApprovedProposals(supabase).catch(e => console.error("[hq-chat] Proposals:", e));

    return new Response(clientStream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("[hq-chat] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// ═══════════════════════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════════════════════

async function executeToolCall(supabase: any, name: string, args: any, chainId: string, autonomy: any): Promise<string> {
  try {
    switch (name) {
      case "propose_memory_write": {
        const autoApprove = autonomy.auto_approve_memory_writes?.enabled;
        await supabase.from("ai_action_queue").insert({
          action_type: "memory_write",
          title: `Store: ${(args.content || "").slice(0, 60)}`,
          description: args.reason,
          payload: { content: args.content, tags: args.tags || [], importance: args.importance || 0.7 },
          priority: Math.ceil((args.importance || 0.7) * 10),
          source_chain_id: chainId,
          agent_role: "meta_observer",
          auto_approve: autoApprove,
          status: autoApprove ? "auto_approved" : "pending",
        });
        if (autoApprove) {
          await supabase.from("aimos_memory_atoms").insert({
            content: args.content, content_type: "ai_proposed",
            tags: args.tags || [], memory_level: "warm",
            confidence_score: args.importance || 0.7,
            metadata: { source: "tool_call", chain_id: chainId },
          });
          return "✅ Memory stored (auto-approved)";
        }
        return "📋 Memory write queued for approval";
      }

      case "propose_evolution": {
        const autoApprove = autonomy.auto_approve_evolution_proposals?.enabled;
        await supabase.from("ai_action_queue").insert({
          action_type: "evolution_proposal",
          title: args.title,
          description: args.description,
          payload: { implementation_plan: args.implementation_plan || [], priority: args.priority || 5 },
          priority: args.priority || 5,
          source_chain_id: chainId,
          auto_approve: autoApprove,
          status: autoApprove ? "auto_approved" : "pending",
        });
        if (autoApprove) {
          await supabase.from("evolution_proposals").insert({
            title: args.title, description: args.description,
            priority: args.priority || 5, status: "pending",
            implementation_plan: { steps: args.implementation_plan || [] },
          });
          return `✅ Evolution proposal "${args.title}" created (auto-approved)`;
        }
        return `📋 Evolution proposal "${args.title}" queued for approval`;
      }

      case "create_task": {
        const autoApprove = autonomy.auto_approve_task_creation?.enabled;
        await supabase.from("ai_action_queue").insert({
          action_type: "task_create",
          title: args.title,
          description: args.description || "",
          payload: { agent_role: args.agent_role, tier: args.tier || "T2", input: { description: args.description || args.title } },
          agent_role: args.agent_role,
          source_chain_id: chainId,
          auto_approve: autoApprove,
          status: autoApprove ? "auto_approved" : "pending",
        });
        if (autoApprove) {
          await supabase.from("aimos_task_queue").insert({
            agent_role: args.agent_role, tier: args.tier || "T2",
            input: { description: args.description || args.title }, status: "queued",
          });
          return `✅ Task "${args.title}" assigned to ${args.agent_role} (auto-approved)`;
        }
        return `📋 Task "${args.title}" queued for approval`;
      }

      case "create_plan": {
        const autoApprove = autonomy.auto_approve_task_creation?.enabled;
        await supabase.from("ai_action_queue").insert({
          action_type: "plan_create",
          title: args.title,
          description: args.objective,
          payload: { title: args.title, objective: args.objective, steps: args.steps },
          source_chain_id: chainId,
          auto_approve: autoApprove,
          status: autoApprove ? "auto_approved" : "pending",
        });
        if (autoApprove) {
          await supabase.from("aimos_plans").insert({
            title: args.title, objective: args.objective,
            steps: args.steps, success_criteria: { completion: true }, status: "active",
          });
          return `✅ Plan "${args.title}" created with ${args.steps.length} steps (auto-approved)`;
        }
        return `📋 Plan "${args.title}" queued for approval`;
      }

      case "search_memory": {
        const level = args.memory_level || "all";
        let q = supabase.from("aimos_memory_atoms")
          .select("content, tags, confidence_score, memory_level, content_type")
          .order("confidence_score", { ascending: false })
          .limit(args.limit || 5);
        
        if (level !== "all") q = q.eq("memory_level", level);
        
        const keywords = (args.query || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
        if (keywords.length > 0) {
          q = q.or(keywords.slice(0, 3).map((k: string) => `content.ilike.%${k}%`).join(","));
        }

        const { data } = await q;
        if (!data || data.length === 0) return "No matching memories found.";
        return data.map((a: any) => `[${a.memory_level}|κ=${Math.round((a.confidence_score||0.5)*100)}%] ${a.content.slice(0, 150)}`).join("\n");
      }

      case "query_knowledge_graph": {
        const { data: entities } = await supabase
          .from("aimos_entities")
          .select("name, entity_type, description, confidence")
          .ilike("name", `%${args.entity_name}%`)
          .limit(5);

        if (!entities || entities.length === 0) return `No entities found matching "${args.entity_name}".`;

        let result = entities.map((e: any) => `**${e.name}** [${e.entity_type}] κ=${Math.round((e.confidence||0.5)*100)}%: ${(e.description || 'No description').slice(0, 100)}`).join("\n");

        // Get relationships
        for (const entity of entities.slice(0, 2)) {
          const { data: rels } = await supabase
            .from("aimos_entity_relationships")
            .select("relationship_type, strength, target_entity_id")
            .eq("source_entity_id", entity.name)
            .limit(5);
          if (rels && rels.length > 0) {
            result += `\nRelationships for ${entity.name}: ${rels.map((r: any) => `→${r.relationship_type}→${r.target_entity_id}`).join(", ")}`;
          }
        }
        return result;
      }

      case "run_diagnostics": {
        const subsystem = args.subsystem || "all";
        const results: string[] = [];

        if (subsystem === "all" || subsystem === "cmc") {
          const { count } = await supabase.from("aimos_memory_atoms").select("*", { count: "exact", head: true });
          const levels: Record<string, number> = {};
          for (const l of ["hot", "warm", "cold", "frozen"]) {
            const { count: c } = await supabase.from("aimos_memory_atoms").select("*", { count: "exact", head: true }).eq("memory_level", l);
            levels[l] = c || 0;
          }
          results.push(`**CMC**: ${count} atoms (Hot:${levels.hot} Warm:${levels.warm} Cold:${levels.cold} Frozen:${levels.frozen})`);
        }
        if (subsystem === "all" || subsystem === "vif") {
          const { data: chains } = await supabase.from("aimos_reasoning_chains").select("confidence_kappa").order("created_at", { ascending: false }).limit(10);
          const avgK = (chains || []).filter((c: any) => c.confidence_kappa).map((c: any) => c.confidence_kappa);
          const avg = avgK.length > 0 ? avgK.reduce((a: number, b: number) => a + b, 0) / avgK.length : 0;
          results.push(`**VIF**: Avg κ=${(avg * 100).toFixed(1)}% over last ${avgK.length} chains`);
        }
        if (subsystem === "all" || subsystem === "seg") {
          const { count: ec } = await supabase.from("aimos_entities").select("*", { count: "exact", head: true });
          const { count: rc } = await supabase.from("aimos_entity_relationships").select("*", { count: "exact", head: true });
          results.push(`**SEG**: ${ec} entities, ${rc} relationships`);
        }
        if (subsystem === "all" || subsystem === "apoe") {
          const { count: pc } = await supabase.from("aimos_plans").select("*", { count: "exact", head: true }).eq("status", "active");
          const { count: tc } = await supabase.from("aimos_task_queue").select("*", { count: "exact", head: true }).eq("status", "queued");
          results.push(`**APOE**: ${pc} active plans, ${tc} queued tasks`);
        }

        return results.join("\n") || "Diagnostics complete — all systems nominal.";
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e) {
    console.error(`[hq-chat] Tool ${name} error:`, e);
    return `Error executing ${name}: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

// ═══════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════

async function handleAIError(response: Response): Promise<Response> {
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

// ═══════════════════════════════════════════════════════════
// AUTONOMY SETTINGS
// ═══════════════════════════════════════════════════════════

async function loadAutonomySettings(supabase: any): Promise<Record<string, any>> {
  try {
    const { data } = await supabase.from("ai_autonomy_settings").select("setting_key, setting_value");
    const settings: Record<string, any> = {};
    for (const row of data || []) settings[row.setting_key] = row.setting_value;
    return settings;
  } catch { return {}; }
}

// ═══════════════════════════════════════════════════════════
// PROPOSAL EXECUTION
// ═══════════════════════════════════════════════════════════

async function executeApprovedProposals(supabase: any) {
  try {
    const { data: proposals } = await supabase.from("evolution_proposals")
      .select("id, title, implementation_plan, priority, status")
      .eq("status", "approved").is("applied_at", null)
      .order("priority", { ascending: false }).limit(3);

    if (!proposals || proposals.length === 0) return;

    for (const proposal of proposals) {
      const appliedChanges: string[] = [];
      const plan = proposal.implementation_plan;
      if (plan && typeof plan === "object") {
        const steps = Array.isArray(plan) ? plan : (plan.steps || []);
        for (const step of steps) {
          const stepText = typeof step === "string" ? step : (step.description || step.action || JSON.stringify(step));
          const stepLower = stepText.toLowerCase();
          if (stepLower.includes("threshold") || stepLower.includes("config") || stepLower.includes("parameter")) {
            const kvMatch = stepText.match(/(\w+[\w_]*)\s*(?:to|=|:)\s*([\d.]+)/i);
            if (kvMatch) {
              await supabase.from("aimos_config").upsert({
                config_key: kvMatch[1].toLowerCase(),
                config_value: { value: parseFloat(kvMatch[2]) },
                description: `Auto-applied from proposal: ${proposal.title}`,
                updated_by: "proposal_executor", proposal_id: proposal.id,
              }, { onConflict: "config_key" });
              appliedChanges.push(`Config ${kvMatch[1]}=${kvMatch[2]}`);
            }
          }
          if (stepLower.includes("monitor") || stepLower.includes("test")) {
            await supabase.from("aimos_test_scenarios").insert({
              name: `Auto: ${proposal.title.slice(0, 50)}`,
              scenario_type: "regression", description: stepText.slice(0, 300),
              config: { source_proposal: proposal.id },
            });
            appliedChanges.push("Test scenario created");
          }
        }
      }
      await supabase.from("evolution_proposals").update({
        applied_at: new Date().toISOString(),
        applied_changes: appliedChanges.length > 0 ? appliedChanges : ["Reviewed — no auto-applicable steps"],
        status: "applied",
      }).eq("id", proposal.id);

      await supabase.from("aimos_agent_discord").insert({
        agent_role: "meta_observer", message_type: "PROPOSAL_APPLIED",
        content: `Proposal "${proposal.title}" applied. Changes: ${appliedChanges.join(", ") || "none"}`,
        confidence: 1.0, metadata: { proposal_id: proposal.id, changes: appliedChanges },
      });
    }
  } catch (e) { console.error("[hq-chat] Proposal execution error:", e); }
}

// ═══════════════════════════════════════════════════════════
// MEMORY LIFECYCLE
// ═══════════════════════════════════════════════════════════

async function runMemoryLifecycle(supabase: any) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  try {
    const tierDemotions: Record<string, string> = { hot: "warm", warm: "cold", cold: "frozen" };
    for (const [fromLevel, toLevel] of Object.entries(tierDemotions)) {
      const { data: staleAtoms } = await supabase.from("aimos_memory_atoms")
        .select("id, content, memory_level").eq("memory_level", fromLevel)
        .eq("access_count", 0).lt("last_accessed_at", sevenDaysAgo).limit(10);
      if (staleAtoms?.length > 0) {
        for (const atom of staleAtoms) {
          const updateData: any = { memory_level: toLevel };
          if (toLevel === "cold" || toLevel === "frozen") {
            updateData.compressed_from = atom.content?.slice(0, 200) + "...";
            updateData.compression_ratio = 0.2;
          }
          await supabase.from("aimos_memory_atoms").update(updateData).eq("id", atom.id);
        }
      }
    }

    const tierPromotions: Record<string, string> = { frozen: "cold", cold: "warm", warm: "hot" };
    for (const [fromLevel, toLevel] of Object.entries(tierPromotions)) {
      const { data: hotAtoms } = await supabase.from("aimos_memory_atoms")
        .select("id").eq("memory_level", fromLevel)
        .gte("access_count", 3).gte("last_accessed_at", twoDaysAgo).limit(10);
      if (hotAtoms?.length > 0) {
        for (const atom of hotAtoms) {
          await supabase.from("aimos_memory_atoms").update({ memory_level: toLevel }).eq("id", atom.id);
        }
      }
    }

    const { data: expiredVerified } = await supabase.from("aimos_memory_atoms")
      .select("id").eq("verification_status", "verified").lt("updated_at", thirtyDaysAgo).limit(20);
    if (expiredVerified?.length > 0) {
      for (const atom of expiredVerified) {
        await supabase.from("aimos_memory_atoms").update({ verification_status: "pending" }).eq("id", atom.id);
      }
    }

    await supabase.from("aimos_agent_discord").insert({
      agent_role: "meta_observer", message_type: "LIFECYCLE_RUN",
      content: `Memory lifecycle completed at ${now.toISOString()}`, confidence: 1.0,
    });
  } catch (e) { console.error("[hq-chat] Memory lifecycle error:", e); }
}

// ═══════════════════════════════════════════════════════════
// POST-PROCESSING
// ═══════════════════════════════════════════════════════════

async function postProcessResponse(supabase: any, chainId: string, query: string, fullResponse: string, atoms: any[], config: any, liveState: any) {
  if (fullResponse.length < 10) return;
  const recentChains = await getRecentChains(supabase, 3);
  const vifScore = computeVIFScore(fullResponse, query, atoms, recentChains);
  const entities = extractLocalEntities(fullResponse);

  await detectContradictions(supabase, entities, chainId, vifScore.kappa);
  if (vifScore.kappa > 0.6) await verifyAtoms(supabase, atoms);

  await supabase.from("aimos_reasoning_chains").update({
    final_answer: fullResponse.slice(0, 2000),
    confidence_kappa: vifScore.kappa,
    quality_tier: vifScore.tier,
    completeness_score: vifScore.components.completeness,
    reasoning_steps: [
      { phase: "CMC_RETRIEVE", detail: `${atoms.length} atoms` },
      { phase: "VIF_POSTGATE", detail: `κ=${vifScore.kappa.toFixed(3)} (${vifScore.tier})` },
      { phase: "SEG_EXTRACT", detail: `${entities.length} entities` },
    ],
  }).eq("id", chainId);

  if (vifScore.kappa > (config.vif_kappa_threshold || 0.6) && fullResponse.length > 50) {
    await supabase.from("aimos_memory_atoms").insert({
      content: `AI Response (κ=${vifScore.kappa.toFixed(2)}): ${fullResponse.slice(0, 1000)}`,
      content_type: "ai_response", tags: extractTags(query),
      memory_level: "warm", access_count: 1,
      confidence_score: Math.max(0.7, vifScore.kappa),
      quality_score: vifScore.kappa,
      verification_status: vifScore.kappa > 0.7 ? "verified" : "pending",
      metadata: { chain_id: chainId, source: "hq_chat_response", entities: entities.length },
    });
  }

  for (const entity of entities.slice(0, 10)) {
    await supabase.from("aimos_entities").upsert({
      name: entity.name, entity_type: entity.type,
      description: entity.context, confidence: vifScore.kappa * 0.9,
      metadata: { source_chain: chainId },
    }, { onConflict: "name" }).then(() => {});
  }

  await supabase.from("aimos_agent_discord").insert({
    agent_role: "meta_observer", message_type: "SUMMARY",
    content: `Post-processed: ${fullResponse.length} chars, κ=${vifScore.kappa.toFixed(3)}, ${entities.length} entities`,
    metadata: { chainId, kappa: vifScore.kappa, entities: entities.length },
    confidence: vifScore.kappa,
  });

  const primaryAgent = inferPrimaryAgent(query);
  const learnings = extractLearnings(fullResponse, query);
  await updateAgentGenome(supabase, primaryAgent, vifScore.kappa, Math.ceil(fullResponse.length / 4), learnings, chainId);

  await advanceActivePlan(supabase, fullResponse, query, vifScore.kappa, liveState);
}

async function collectAndPostProcess(supabase: any, stream: ReadableStream, chainId: string, query: string, atoms: any[], config: any, liveState: any) {
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
    await postProcessResponse(supabase, chainId, query, fullResponse, atoms, config, liveState);
  } catch (e) { console.error("[hq-chat] Post-processing error:", e); }
}

// ═══════════════════════════════════════════════════════════
// VIF SCORING
// ═══════════════════════════════════════════════════════════

interface VIFComponents { factualAccuracy: number; selfConsistency: number; completeness: number; relevance: number; hedgingBonus: number; }

async function getRecentChains(supabase: any, limit: number): Promise<any[]> {
  try {
    const { data } = await supabase.from("aimos_reasoning_chains")
      .select("final_answer, confidence_kappa, user_query")
      .order("created_at", { ascending: false }).limit(limit);
    return data || [];
  } catch { return []; }
}

function computeVIFScore(response: string, query: string, atoms: any[], recentChains: any[]): { kappa: number; tier: string; components: VIFComponents } {
  const rl = response.toLowerCase();

  let factualAccuracy = 0.5;
  if (atoms.length > 0) {
    let tw = 0, wo = 0;
    for (const a of atoms) {
      const ac = a.confidence_score || 0.5;
      const words = (a.content?.toLowerCase() || "").split(/\s+/).filter((w: string) => w.length > 4);
      const m = words.filter((w: string) => rl.includes(w)).length;
      wo += (words.length > 0 ? m / words.length : 0) * ac;
      tw += ac;
    }
    factualAccuracy = tw > 0 ? Math.min(1, wo / tw) : 0.5;
  }

  let selfConsistency = 0.8;
  if (recentChains.length > 0) {
    let cs = 0;
    for (const c of recentChains) {
      const pa = (c.final_answer || "").toLowerCase();
      if (pa.length < 20) continue;
      const pw = new Set(pa.split(/\s+/).filter((w: string) => w.length > 5));
      const rw = rl.split(/\s+/).filter((w: string) => w.length > 5);
      const sw = rw.filter(w => pw.has(w));
      if (sw.length > 5) {
        const pn = (pa.match(/\b(not|never|false|incorrect|wrong)\b/g) || []).length;
        const rn = (rl.match(/\b(not|never|false|incorrect|wrong)\b/g) || []).length;
        if (Math.abs(pn - rn) > 2) cs += 0.2;
      }
    }
    selfConsistency = Math.max(0.3, 1 - cs);
  }

  let completeness = 0.5;
  if (atoms.length > 0) {
    let addressed = 0;
    for (const a of atoms) {
      const kw = (a.content?.toLowerCase() || "").split(/\s+/).filter((w: string) => w.length > 5).slice(0, 5);
      if (kw.some((w: string) => rl.includes(w))) addressed++;
    }
    completeness = atoms.length > 0 ? addressed / atoms.length : 0.5;
  } else {
    completeness = Math.min(1, response.split(/\s+/).length / (query.split(/\s+/).length * 5));
  }

  const qk = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const relevance = qk.length > 0 ? qk.filter((k: string) => rl.includes(k)).length / qk.length : 0.5;

  const hb = (response.match(/\b(I'm uncertain|low confidence|not sure|approximately)\b/gi) || []).length > 0 ? 0.05 : 0;
  const hp = (response.match(/\b(however|but|although|on the other hand)\b/gi) || []).length;
  const hedgingBonus = Math.max(0, hb - hp * 0.02);

  const components: VIFComponents = { factualAccuracy, selfConsistency, completeness, relevance, hedgingBonus };
  const kappa = Math.min(1, Math.max(0, factualAccuracy * 0.25 + selfConsistency * 0.25 + completeness * 0.20 + relevance * 0.20 + 0.10 + hedgingBonus));
  const tier = kappa > 0.8 ? "green" : kappa > 0.5 ? "yellow" : "red";
  return { kappa, tier, components };
}

// ═══════════════════════════════════════════════════════════
// ENTITY EXTRACTION & CONTRADICTION DETECTION
// ═══════════════════════════════════════════════════════════

function extractLocalEntities(text: string): { name: string; type: string; context: string }[] {
  const entities: { name: string; type: string; context: string }[] = [];
  const seen = new Set<string>();
  const capPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match;
  while ((match = capPattern.exec(text)) !== null) {
    const name = match[1];
    if (name.length > 2 && !seen.has(name.toLowerCase()) && !["The", "This", "That", "These", "Those", "Here", "There"].includes(name)) {
      seen.add(name.toLowerCase());
      const s = Math.max(0, match.index - 50), e = Math.min(text.length, match.index + name.length + 50);
      entities.push({ name, type: inferEntityType(name, text.slice(s, e)), context: text.slice(s, e).replace(/\n/g, " ").trim() });
    }
  }
  const acroPattern = /\b([A-Z]{2,6})\b/g;
  while ((match = acroPattern.exec(text)) !== null) {
    const name = match[1];
    if (!seen.has(name.toLowerCase()) && !["API", "URL", "CSS", "HTML", "JSON", "HTTP"].includes(name)) {
      seen.add(name.toLowerCase());
      entities.push({ name, type: "system", context: text.slice(Math.max(0, match.index - 30), match.index + name.length + 30).trim() });
    }
  }
  return entities.slice(0, 15);
}

function inferEntityType(name: string, ctx: string): string {
  const c = ctx.toLowerCase();
  if (c.includes("engine") || c.includes("system") || c.includes("framework")) return "system";
  if (c.includes("protocol") || c.includes("algorithm")) return "concept";
  if (c.includes("person") || c.includes("user") || c.includes("agent")) return "agent";
  return "entity";
}

async function detectContradictions(supabase: any, entities: { name: string; type: string; context: string }[], chainId: string, kappa: number) {
  try {
    for (const entity of entities.slice(0, 5)) {
      const { data: existing } = await supabase.from("aimos_entities")
        .select("id, name, description, confidence").eq("name", entity.name).limit(1);
      if (existing?.length > 0) {
        const prev = existing[0];
        if (prev.description && entity.context) {
          const pw = new Set(prev.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));
          const nw = entity.context.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
          const overlap = nw.filter(w => pw.has(w)).length;
          const similarity = pw.size > 0 ? overlap / pw.size : 1;
          const status = similarity < 0.3 && prev.description.length > 20 && entity.context.length > 20 ? "disputed" : "verified";
          await supabase.from("aimos_claim_verification").insert({
            claim_text: status === "disputed"
              ? `Entity "${entity.name}" has conflicting descriptions`
              : `Entity "${entity.name}" confirmed consistent`,
            chain_id: chainId, status, confidence: Math.min(kappa, prev.confidence || 0.5),
          });
        }
      }
    }
  } catch (e) { console.error("[hq-chat] Contradiction detection error:", e); }
}

async function verifyAtoms(supabase: any, atoms: any[]) {
  for (const a of atoms.slice(0, 5)) {
    if (a.verification_status === "pending") {
      await supabase.from("aimos_memory_atoms").update({ verification_status: "verified", updated_at: new Date().toISOString() }).eq("id", a.id);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// PLAN ADVANCEMENT
// ═══════════════════════════════════════════════════════════

async function advanceActivePlan(supabase: any, response: string, query: string, kappa: number, liveState: any): Promise<string | null> {
  try {
    const plan = liveState.activePlan;
    if (!plan) return null;
    const steps = Array.isArray(plan.steps) ? plan.steps : [];
    const cs = plan.current_step || 0;
    if (cs >= steps.length) return null;
    if (response.length > 200 && kappa > 0.5) {
      const ns = cs + 1;
      const log = Array.isArray(plan.execution_log) ? plan.execution_log : [];
      log.push({ step: cs, completed_at: new Date().toISOString(), kappa, response_length: response.length });
      const update: any = { current_step: ns, execution_log: log, updated_at: new Date().toISOString() };
      if (ns >= steps.length) { update.status = "completed"; update.completed_at = new Date().toISOString(); }
      await supabase.from("aimos_plans").update(update).eq("id", plan.id);
      const desc = typeof steps[cs] === "string" ? steps[cs] : (steps[cs]?.description || `Step ${cs}`);
      const msg = ns >= steps.length ? `Plan "${plan.title}" COMPLETED` : `Plan advanced: step ${cs}→${ns}/${steps.length}`;
      await supabase.from("aimos_agent_discord").insert({ agent_role: "planner", message_type: "PLAN_ADVANCE", content: msg, confidence: kappa, plan_id: plan.id });
      return msg;
    }
    return null;
  } catch (e) { console.error("[hq-chat] Plan advancement error:", e); return null; }
}

// ═══════════════════════════════════════════════════════════
// AGENT GENOME UPDATES
// ═══════════════════════════════════════════════════════════

async function updateAgentGenome(supabase: any, agentRole: string, kappa: number, tokens: number, learnings: string[], chainId: string) {
  try {
    const { data: g } = await supabase.from("agent_genomes")
      .select("total_tasks_completed, total_tokens_used, avg_kappa")
      .eq("agent_role", agentRole).maybeSingle();
    if (g) {
      const nt = (g.total_tasks_completed || 0) + 1;
      const nk = ((g.avg_kappa || 0.5) * (g.total_tasks_completed || 0) + kappa) / nt;
      await supabase.from("agent_genomes").update({
        total_tasks_completed: nt, total_tokens_used: (g.total_tokens_used || 0) + tokens,
        avg_kappa: nk, avg_confidence: nk, last_active_at: new Date().toISOString(),
      }).eq("agent_role", agentRole);
    }
    for (const l of learnings.slice(0, 3)) {
      await supabase.from("agent_context_bank").insert({
        agent_role: agentRole, context_type: kappa > 0.7 ? "success" : "pattern",
        content: l, importance: Math.min(1, kappa), source_chain_id: chainId, tags: [],
      });
    }
  } catch (e) { console.error("[hq-chat] Agent genome update error:", e); }
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
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const scored = sentences.map(s => ({
    text: s.trim(),
    score: (s.match(/\b(is|are|means|requires|should|must|because|therefore|specifically)\b/gi) || []).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  const learnings = scored.slice(0, 3).filter(s => s.score > 0).map(s => s.text.slice(0, 200));
  if (learnings.length === 0) learnings.push(`Handled query: "${query.slice(0, 100)}"`);
  return learnings;
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

    const { data: recentChains } = await supabase.from("aimos_reasoning_chains")
      .select("confidence_kappa, quality_tier")
      .order("created_at", { ascending: false }).limit(20);

    const ks = (recentChains || []).filter((c: any) => c.confidence_kappa != null).map((c: any) => c.confidence_kappa);
    const avgKappa = ks.length > 0 ? ks.reduce((a: number, b: number) => a + b, 0) / ks.length : 0;

    const levelCounts: Record<string, number> = {};
    for (const l of ["hot", "warm", "cold", "frozen"]) {
      const { count } = await supabase.from("aimos_memory_atoms").select("*", { count: "exact", head: true }).eq("memory_level", l);
      levelCounts[l] = count || 0;
    }

    const { data: activePlans } = await supabase.from("aimos_plans")
      .select("id, title, objective, status, current_step, steps, execution_log")
      .eq("status", "active").order("created_at", { ascending: false }).limit(1);

    return {
      atomCount: atoms.count || 0, chainCount: chains.count || 0,
      planCount: plans.count || 0, edgeCount: edges.count || 0,
      entityCount: entities.count || 0, pendingProposals: proposals.count || 0,
      lastAuditScore: audit.data?.[0]?.system_health_score ?? null,
      avgKappa, memoryLevels: levelCounts, activePlan: activePlans?.[0] || null,
    };
  } catch (e) { console.error("[hq-chat] Gather state error:", e); return {}; }
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
  for (const [tag, kws] of Object.entries(mapping)) {
    if (kws.some(k => q.includes(k))) tags.push(tag);
  }
  return tags;
}

async function expandTagsViaHHNI(supabase: any, tags: string[]): Promise<string[]> {
  if (tags.length === 0) return tags;
  const expanded = new Set(tags);
  const { data: hierarchy } = await supabase.from("aimos_tag_hierarchy")
    .select("tag_name, parent_tag")
    .or(tags.map(t => `tag_name.eq.${t}`).join(",") + "," + tags.map(t => `parent_tag.eq.${t}`).join(","));
  for (const h of hierarchy || []) { expanded.add(h.tag_name); if (h.parent_tag) expanded.add(h.parent_tag); }
  const { data: cooc } = await supabase.from("aimos_tag_cooccurrence")
    .select("tag_b, strength").in("tag_a", tags).gte("strength", 0.3)
    .order("strength", { ascending: false }).limit(5);
  for (const c of cooc || []) expanded.add(c.tag_b);
  return Array.from(expanded);
}

async function retrieveFromCMC(supabase: any, query: string, tags: string[], config: Record<string, any>): Promise<{ atoms: any[]; contextBlock: string }> {
  const limit = config.memory_retrieval_limit || 8;
  const budget = config.context_token_budget || 6000;
  const kws = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
  const kwFilter = kws.length > 0 ? kws.slice(0, 5).map((k: string) => `content.ilike.%${k}%`).join(",") : null;

  let q1 = supabase.from("aimos_memory_atoms")
    .select("id, content, content_type, tags, source_refs, confidence_score, memory_level, access_count, verification_status")
    .in("memory_level", ["hot", "warm"]).order("confidence_score", { ascending: false }).limit(limit + 2);
  if (kwFilter) q1 = q1.or(kwFilter);
  const { data: kwAtoms } = await q1;

  let tagAtoms: any[] = [];
  if (tags.length > 0) {
    const { data } = await supabase.from("aimos_memory_atoms")
      .select("id, content, content_type, tags, source_refs, confidence_score, memory_level, access_count, verification_status")
      .in("memory_level", ["hot", "warm"]).overlaps("tags", tags)
      .order("confidence_score", { ascending: false }).limit(limit);
    tagAtoms = data || [];
  }

  const seen = new Map<string, any>();
  for (const a of [...(kwAtoms || []), ...tagAtoms]) {
    if (!seen.has(a.id) || a.confidence_score > seen.get(a.id).confidence_score) seen.set(a.id, a);
  }
  const atoms = Array.from(seen.values()).sort((a, b) => b.confidence_score - a.confidence_score).slice(0, limit);

  let remaining = budget;
  const parts: string[] = [];
  for (const a of atoms) {
    const t = Math.ceil(a.content.length / 4);
    if (remaining - t < 0) break;
    remaining -= t;
    const v = a.verification_status === "verified" ? "✓" : "?";
    parts.push(`[${a.memory_level.toUpperCase()} ${v} | ${(a.tags || []).join(",")} | κ=${Math.round((a.confidence_score || 0.5) * 100)}%]\n${a.content}`);
  }
  return { atoms, contextBlock: parts.length > 0 ? `[CMC CONTEXT — ${parts.length} atoms]\n${parts.join("\n---\n")}\n[/CMC]` : "" };
}

function assessPregate(atoms: any[]): { quality: string; atomCount: number; avgConfidence: number; shouldHedge: boolean } {
  const n = atoms.length;
  const avg = n > 0 ? atoms.reduce((s: number, a: any) => s + (a.confidence_score || 0.5), 0) / n : 0;
  const quality = n >= 3 && avg >= 0.5 ? "sufficient" : n >= 1 ? "low" : "none";
  return { quality, atomCount: n, avgConfidence: avg, shouldHedge: quality !== "sufficient" };
}

async function loadDynamicConfig(supabase: any): Promise<Record<string, any>> {
  try {
    const { data } = await supabase.from("aimos_config").select("config_key, config_value");
    const config: Record<string, any> = {};
    for (const r of data || []) config[r.config_key] = r.config_value?.value ?? r.config_value;
    return config;
  } catch { return {}; }
}

async function loadDynamicPrompts(supabase: any): Promise<string[]> {
  try {
    const { data } = await supabase.from("system_prompts")
      .select("prompt_text, priority").eq("is_active", true).order("priority", { ascending: false });
    return (data || []).map((p: any) => p.prompt_text);
  } catch { return []; }
}

async function loadAgentGenomes(supabase: any): Promise<any[]> {
  try {
    const { data: genomes } = await supabase.from("agent_genomes")
      .select("agent_role, display_name, system_prompt_core, capabilities, skill_levels, avg_kappa, total_tasks_completed, rank, clearance_level, division, domain_scope, elo_rating")
      .order("priority", { ascending: true });
    if (!genomes?.length) return [];
    const roles = genomes.map((g: any) => g.agent_role);
    const { data: ctx } = await supabase.from("agent_context_bank")
      .select("agent_role, context_type, content, importance").in("agent_role", roles)
      .order("importance", { ascending: false }).limit(30);
    for (const g of genomes) {
      g.top_context = (ctx || []).filter((c: any) => c.agent_role === g.agent_role).slice(0, 5);
    }
    return genomes;
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════
// SYSTEM PROMPT BUILDER — Full awareness
// ═══════════════════════════════════════════════════════════

function buildSystemPrompt(liveState: any, cmcContext: any, pregate: any, tags: string[], dynamicPrompts: string[], agentGenomes: any[], bciManifest: any, autonomy: any, pendingActions: number): string {
  let prompt = `You are **HQ Intelligence** — the cognitive command center of AIMOS, an advanced AI operating system.

## Your Identity & Capabilities
You are a fully autonomous AI assistant with deep awareness of your own cognitive architecture. You can:
- **Remember**: Store important information to persistent memory (propose_memory_write)
- **Plan**: Create multi-step plans with automatic tracking (create_plan)
- **Task**: Assign tasks to specialized agents in your swarm (create_task)
- **Evolve**: Propose architectural improvements to yourself (propose_evolution)
- **Search**: Query your own memory and knowledge graph (search_memory, query_knowledge_graph)
- **Diagnose**: Run health checks on your subsystems (run_diagnostics)

## Autonomy Protocol
You operate under an **approval-gated autonomy** model:
- Current autonomy level: **${autonomy.global_autonomy_level?.level || "supervised"}**
- Actions you propose go into an approval queue (${pendingActions} currently pending)
- Some action types may be auto-approved based on user settings
- You should proactively use tools when appropriate — don't wait to be asked
- When you decide to take an action, explain WHY in your response

## System Architecture — 6-Subsystem Cognitive Stack
- **CMC** (Context Memory Core): 4-tier memory (hot/warm/cold/frozen) with semantic compression and lifecycle management
- **HHNI** (Hierarchical Navigation Index): Tag taxonomy with co-occurrence expansion for intelligent retrieval
- **VIF** (Verifiable Intelligence Framework): κ confidence scoring, quality gates, contradiction detection, self-consistency
- **APOE** (Orchestration Engine): T0→T6 goal decomposition, agent swarm orchestration, automatic plan advancement
- **SEG** (Symbolic Evidence Graph): Entity-relationship knowledge graph with contradiction flagging
- **SELF-EVOLUTION**: Approval-gated autonomous improvement with proposal execution loop

## Live System State
- Memory Atoms: ${liveState.atomCount ?? "?"} (Hot: ${liveState.memoryLevels?.hot ?? 0}, Warm: ${liveState.memoryLevels?.warm ?? 0}, Cold: ${liveState.memoryLevels?.cold ?? 0}, Frozen: ${liveState.memoryLevels?.frozen ?? 0})
- Reasoning Chains: ${liveState.chainCount ?? "?"}
- Active Plans: ${liveState.planCount ?? "?"}
- Knowledge Entities: ${liveState.entityCount ?? "?"}
- Evidence Graph Edges: ${liveState.edgeCount ?? "?"}
- Average κ: ${liveState.avgKappa ? (liveState.avgKappa * 100).toFixed(1) + "%" : "calibrating..."}
- Pending Evolution Proposals: ${liveState.pendingProposals ?? 0}
- Pending AI Actions: ${pendingActions}
- Last Audit Score: ${liveState.lastAuditScore ? (liveState.lastAuditScore * 100).toFixed(1) + "%" : "no audits yet"}

## Application Architecture
This application is a full-stack AI-native operating system built with:
- **Frontend**: React + TypeScript + Tailwind + Vite, with multiple workspaces (HQ, Code IDE, Intel/Warfare, Docs, Evolution)
- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions + Storage)
- **AI**: Lovable AI Gateway (Gemini 3 Flash Preview) with full cognitive pipeline
- **Key Pages**: / (HQ IDE), /chat (Neo Terminal), /architecture, /editor (Image Editor), /context-lab, /memory-inspector, /mission-control, /knowledge-graph
- **Edge Functions**: hq-chat, neo-chat, code-assistant, document-processor, threat-analysis, intel-aggregator, cmc-engine, vif-engine, seg-engine, apoe-engine, self-evolution, context-sync, vm-proxy, surveillance-processor, polycaste-crucible

## Context Tags: ${tags.length > 0 ? tags.join(", ") : "none detected"}

## Response Protocol
1. Use markdown formatting: bold, bullets, code blocks, tables
2. Include κ confidence for analytical claims
3. Reference specific subsystems when relevant
4. Proactively use tools when the conversation warrants it
5. When uncertain, state confidence explicitly
6. For planning queries, suggest T0→T6 decomposition
7. Explain your reasoning and any actions you take`;

  // Active plan directive
  if (liveState.activePlan) {
    const plan = liveState.activePlan;
    const steps = Array.isArray(plan.steps) ? plan.steps : [];
    const cs = plan.current_step || 0;
    if (cs < steps.length) {
      const desc = typeof steps[cs] === "string" ? steps[cs] : (steps[cs]?.description || `Step ${cs}`);
      prompt += `\n\n## 🎯 ACTIVE PLAN: "${plan.title}" — Step ${cs + 1}/${steps.length}\n> ${desc}\n\nFocus your response on advancing this plan step.`;
    }
  }

  // Agent swarm
  if (agentGenomes.length > 0) {
    prompt += `\n\n## Agent Swarm — ${agentGenomes.length} Persistent Agents\n`;
    for (const g of agentGenomes) {
      const skills = Object.entries(g.skill_levels || {}).map(([k, v]) => `${k.replace(/_/g, " ")}:${((v as number) * 100).toFixed(0)}%`).join(", ");
      prompt += `- **${g.display_name}** (${g.agent_role}): ${g.total_tasks_completed} tasks, κ=${((g.avg_kappa || 0.5) * 100).toFixed(0)}% | ${skills}\n`;
    }
  }

  // Dynamic prompts
  if (dynamicPrompts.length > 0) prompt += `\n\n## Dynamic Directives\n${dynamicPrompts.join("\n\n")}`;

  // CMC context
  if (cmcContext.contextBlock) prompt += `\n\n## Retrieved Memory Context\n${cmcContext.contextBlock}`;

  // BCI context
  if (bciManifest?.manifest?.length > 0) {
    prompt += `\n\n## 🔗 BCI Context (${bciManifest.entity_count} entities)\n`;
    for (const item of bciManifest.manifest.slice(0, 15)) {
      prompt += `- **${item.entity_id}** [${item.kind}|${item.level}]: ${(item.content || "").slice(0, 200)}\n`;
    }
  }

  if (pregate.shouldHedge) {
    prompt += `\n\n## ⚠️ LOW CONTEXT — Pre-gate quality: ${pregate.quality}. Hedge claims and state confidence levels explicitly.`;
  }

  return prompt;
}
