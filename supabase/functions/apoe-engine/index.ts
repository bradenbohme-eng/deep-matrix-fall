import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════
// APOE ENGINE — Attention Priority Orchestration Engine
// Handles: decompose goals, manage task queue, agent discord
// ═══════════════════════════════════════════════════════════

const AGENT_ROLES = [
  { id: "planner", name: "Planner", capabilities: ["decompose", "prioritize", "schedule"] },
  { id: "researcher", name: "Researcher", capabilities: ["search_cmc", "retrieve_evidence", "cite_sources"] },
  { id: "builder", name: "Builder", capabilities: ["generate_code", "create_schemas", "write_functions"] },
  { id: "verifier", name: "Verifier", capabilities: ["validate", "test", "score_confidence"] },
  { id: "auditor", name: "Auditor", capabilities: ["review", "flag_issues", "propose_improvements"] },
  { id: "meta_observer", name: "MetaObserver", capabilities: ["monitor_agents", "detect_loops", "escalate"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const body = await req.json();

    switch (body.action) {
      case "decompose":
        return await handleDecompose(supabase, lovableKey, body);
      case "discord_log":
        return await handleDiscordLog(supabase, body);
      case "queue_status":
        return await handleQueueStatus(supabase, body);
      case "execute_next":
        return await handleExecuteNext(supabase, lovableKey, body);
      case "agents":
        return json({ success: true, agents: AGENT_ROLES });
      default:
        return json({ error: "Unknown action", actions: ["decompose", "discord_log", "queue_status", "execute_next", "agents"] }, 400);
    }
  } catch (e) {
    console.error("[APOE] Error:", e);
    return json({ error: e.message }, 500);
  }
});

// ── DECOMPOSE: T0→T6 goal hierarchy via AI ──
async function handleDecompose(supabase: any, lovableKey: string | undefined, body: any) {
  const { objective, userId } = body;
  if (!objective || !lovableKey) return json({ error: "objective and LOVABLE_API_KEY required" }, 400);

  // Log planner activity
  const planId = crypto.randomUUID();

  await logDiscord(supabase, {
    plan_id: null,
    agent_role: "planner",
    message_type: "THOUGHT",
    content: `Received objective: "${objective}". Beginning T0→T6 decomposition.`,
    thread_id: planId,
  });

  // Use AI for goal decomposition
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are the APOE Planner agent. Decompose objectives into a T0-T6 goal hierarchy.
T0: User Intent (the original objective)
T1: High-level sub-goals (2-4)
T2: Required modules/components for each T1
T3: Architecture/interfaces for each T2
T4: Detailed specs
T5: Implementation steps
T6: Testing/monitoring criteria

Keep each level concise. Return structured output.`,
        },
        { role: "user", content: objective },
      ],
      tools: [{
        type: "function",
        function: {
          name: "decompose_goal",
          description: "Decompose an objective into T0-T6 hierarchy",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              t0: { type: "string", description: "Core intent" },
              t1: { type: "array", items: { type: "object", properties: { goal: { type: "string" }, priority: { type: "string", enum: ["critical", "high", "medium", "low"] } }, required: ["goal"] } },
              t2: { type: "array", items: { type: "object", properties: { module: { type: "string" }, parent_t1: { type: "integer" } }, required: ["module"] } },
              t3: { type: "array", items: { type: "object", properties: { spec: { type: "string" }, parent_t2: { type: "integer" } }, required: ["spec"] } },
              success_criteria: { type: "array", items: { type: "string" } },
            },
            required: ["title", "t0", "t1", "success_criteria"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "decompose_goal" } },
    }),
  });

  if (!resp.ok) return json({ error: "AI decomposition failed" }, 500);

  const data = await resp.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return json({ error: "No decomposition result" }, 500);

  const plan = JSON.parse(toolCall.function.arguments);

  // Store plan
  const { data: storedPlan, error } = await supabase.from("aimos_plans").insert({
    title: plan.title,
    objective: plan.t0,
    steps: plan,
    success_criteria: plan.success_criteria,
    status: "active",
    user_id: userId || null,
  }).select("id").single();

  if (error) return json({ error: "Failed to store plan" }, 500);

  // Create task queue entries for T1 goals
  for (let i = 0; i < (plan.t1 || []).length; i++) {
    await supabase.from("aimos_task_queue").insert({
      plan_id: storedPlan.id,
      tier: "T1",
      agent_role: "planner",
      input: { goal: plan.t1[i].goal, priority: plan.t1[i].priority || "medium" },
      status: "queued",
    });
  }

  // Log completion
  await logDiscord(supabase, {
    plan_id: storedPlan.id,
    agent_role: "planner",
    message_type: "DECISION",
    content: `Decomposed "${plan.title}" into ${plan.t1?.length || 0} T1 goals with ${plan.success_criteria?.length || 0} success criteria.`,
    thread_id: planId,
    confidence: 0.85,
  });

  return json({ success: true, planId: storedPlan.id, plan });
}

// ── DISCORD LOG: Record agent activity ──
async function handleDiscordLog(supabase: any, body: any) {
  const { planId, agentRole, messageType, content, threadId, confidence, metadata } = body;

  await logDiscord(supabase, {
    plan_id: planId || null,
    agent_role: agentRole,
    message_type: messageType,
    content,
    thread_id: threadId || crypto.randomUUID(),
    confidence,
    metadata,
  });

  return json({ success: true });
}

// ── QUEUE STATUS: Get task queue state ──
async function handleQueueStatus(supabase: any, body: any) {
  const { planId } = body;

  let query = supabase.from("aimos_task_queue").select("*").order("created_at", { ascending: true });
  if (planId) query = query.eq("plan_id", planId);

  const { data: tasks } = await query.limit(50);

  const statusCounts: Record<string, number> = {};
  for (const t of tasks || []) {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  }

  return json({ success: true, tasks: tasks || [], statusCounts });
}

// ── EXECUTE NEXT: Run the next queued task ──
async function handleExecuteNext(supabase: any, lovableKey: string | undefined, body: any) {
  const { planId } = body;

  // Find next queued task with no blocking dependencies
  let query = supabase.from("aimos_task_queue").select("*").eq("status", "queued").order("created_at", { ascending: true }).limit(1);
  if (planId) query = query.eq("plan_id", planId);

  const { data: tasks } = await query;
  if (!tasks || tasks.length === 0) return json({ success: true, message: "No queued tasks" });

  const task = tasks[0];

  // Mark as running
  await supabase.from("aimos_task_queue").update({ status: "running", started_at: new Date().toISOString() }).eq("id", task.id);

  // Log agent picking up task
  await logDiscord(supabase, {
    plan_id: task.plan_id,
    agent_role: task.agent_role,
    message_type: "TASK_ACCEPT",
    content: `Executing T${task.tier.slice(1)} task: ${JSON.stringify(task.input).slice(0, 200)}`,
    confidence: 0.7,
  });

  // For now, mark as completed (real execution would involve AI calls)
  await supabase.from("aimos_task_queue").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    output: { result: "Task processed", details: task.input },
    confidence: 0.75,
  }).eq("id", task.id);

  await logDiscord(supabase, {
    plan_id: task.plan_id,
    agent_role: task.agent_role,
    message_type: "TASK_COMPLETE",
    content: `Completed T${task.tier.slice(1)} task.`,
    confidence: 0.75,
  });

  return json({ success: true, executed: task.id, tier: task.tier });
}

// ── Helper: Log to Agent Discord ──
async function logDiscord(supabase: any, entry: any) {
  await supabase.from("aimos_agent_discord").insert(entry);
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
