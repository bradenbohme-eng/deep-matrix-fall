import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════
// CONTEXTUAL SYNC ENGINE — Bitemporal Contract Index
// Actions: index_entity, resolve_context, evaluate_sync,
//          create_remediation, propagate_drift, record_witness
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result: any;

    switch (action) {
      case "index_entity":
        result = await indexEntity(supabase, body);
        break;
      case "resolve_context":
        result = await resolveContext(supabase, body);
        break;
      case "evaluate_sync":
        result = await evaluateSync(supabase, body);
        break;
      case "create_remediation":
        result = await createRemediation(supabase, body);
        break;
      case "propagate_drift":
        result = await propagateDrift(supabase, body);
        break;
      case "record_witness":
        result = await recordWitness(supabase, body);
        break;
      case "health":
        result = await healthCheck(supabase);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[context-sync] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// ACTION: index_entity — Parse and index a code artifact into BCI
// ═══════════════════════════════════════════════════════════════

async function indexEntity(supabase: any, body: any) {
  const {
    entity_id,
    kind = "function",
    path,
    language,
    owner,
    visibility = "public",
    span = {},
    contract = {},
    dependencies = {},
    quartet,
  } = body;

  if (!entity_id) throw new Error("entity_id required");

  const now = new Date().toISOString();

  // Compute dependency hash
  const depList = [
    ...(dependencies.imports || []),
    ...(dependencies.depends_on || []),
  ].sort();
  const depHash = await computeHash(depList.join("|"));

  // Generate L0-L5 boundary views from contract
  const boundaryViews = generateBoundaryViews(contract, kind, path);

  // Compute token weights
  const weights = computeWeights(contract, boundaryViews, dependencies);

  // Estimate blast radius
  const blastRadius = await estimateBlastRadius(supabase, entity_id, dependencies);

  // Check for prior version — close it if exists
  const { data: existing } = await supabase
    .from("bci_entities")
    .select("entity_id, sync_status")
    .eq("entity_id", entity_id)
    .is("valid_time_end", null)
    .maybeSingle();

  if (existing) {
    // Supersede prior version
    await supabase
      .from("bci_entities")
      .update({
        valid_time_end: now,
        superseded_by: entity_id,
        sync_status: "SUPERSEDED",
      })
      .eq("entity_id", entity_id);

    // Store version record
    await supabase.from("bci_entity_versions").insert({
      entity_id,
      version_number: 1,
      contract,
      weights,
      boundary_views: boundaryViews,
      dependencies: { ...dependencies, dependency_hash: depHash },
      dependency_hash: depHash,
      tx_time: now,
      valid_time_start: now,
    });
  }

  // Upsert the entity
  const entityData = {
    entity_id,
    kind,
    path,
    language,
    owner,
    visibility,
    span,
    contract,
    weights,
    boundary_views: boundaryViews,
    dependencies: { ...dependencies, dependency_hash: depHash },
    quartet: quartet || { code_refs: [], doc_refs: [], test_refs: [], trace_refs: [] },
    sync_status: "INDEXED",
    parity_score: computeQuartetParity(quartet),
    confidence_score: 0.5,
    blast_radius: blastRadius,
    stale_reasons: [],
    contradiction_refs: [],
    tx_time: now,
    valid_time_start: now,
    valid_time_end: null,
    supersedes: existing ? entity_id : null,
    created_at: now,
    updated_at: now,
  };

  await supabase.from("bci_entities").upsert(entityData, { onConflict: "entity_id" });

  // Log to agent discord
  await supabase.from("aimos_agent_discord").insert({
    agent_role: "context_sync",
    message_type: "ENTITY_INDEXED",
    content: `Indexed entity ${entity_id} (${kind}) blast_radius=${blastRadius}`,
    confidence: 0.9,
    metadata: { entity_id, kind, path, blast_radius: blastRadius },
  });

  return {
    entity_id,
    sync_status: "INDEXED",
    blast_radius: blastRadius,
    dependency_hash: depHash,
    boundary_levels: Object.keys(boundaryViews),
    token_weight: weights.token_weight,
  };
}

// ═══════════════════════════════════════════════════════════════
// ACTION: resolve_context — Token-weighted context assembly
// U(v,l|q) = α·rel + β·crit + γ·hot + δ·contra - λ·cost + ε·dep
// ═══════════════════════════════════════════════════════════════

async function resolveContext(supabase: any, body: any) {
  const {
    prompt,
    target_entities = [],
    token_budget = 4000,
    policy_name = "default",
  } = body;

  if (!prompt) throw new Error("prompt required");

  // Load policy
  const { data: policy } = await supabase
    .from("sync_policy_profiles")
    .select("*")
    .eq("name", policy_name)
    .eq("is_active", true)
    .maybeSingle();

  const effectivePolicy = policy || {
    min_confidence: 0.6,
    min_parity: 0.5,
    min_witness_coverage: 0.3,
  };

  // Fetch all current entities
  const { data: entities } = await supabase
    .from("bci_entities")
    .select("*")
    .is("valid_time_end", null)
    .not("sync_status", "in", '("ARCHIVED","SUPERSEDED")')
    .limit(200);

  if (!entities || entities.length === 0) {
    return {
      manifest: [],
      dropped: [],
      total_tokens: 0,
      budget_remaining: token_budget,
      entity_count: 0,
    };
  }

  const promptLower = prompt.toLowerCase();
  const promptWords = new Set(
    promptLower.split(/\s+/).filter((w: string) => w.length > 3)
  );

  // Utility coefficients
  const α = 0.3; // relevance
  const β = 0.25; // criticality
  const γ = 0.15; // hotness
  const δ = 0.1; // contradiction penalty bonus (want contradictions surfaced)
  const λ = 0.1; // cost penalty
  const ε = 0.1; // dependency bonus

  // Score each entity
  const scored = entities.map((ent: any) => {
    const w = ent.weights || {};
    const contract = ent.contract || {};
    const bv = ent.boundary_views || {};

    // Relevance: word overlap between prompt and contract/path
    const contractText = `${contract.summary || ""} ${ent.path || ""} ${ent.kind || ""}`.toLowerCase();
    const contractWords = contractText.split(/\s+/).filter((w: string) => w.length > 3);
    const overlap = contractWords.filter((w: string) => promptWords.has(w)).length;
    const rel = Math.min(1, overlap / Math.max(1, promptWords.size) * 2);

    // Target entity boost
    const targetBoost = target_entities.includes(ent.entity_id) ? 0.5 : 0;

    // Criticality from weights
    const crit = w.criticality || 0.5;
    const hot = w.hotness || 0.3;
    const contraBonus = (ent.contradiction_refs?.length || 0) > 0 ? 0.3 : 0;
    const cost = (w.token_weight || 100) / token_budget;
    const depBonus = (ent.dependencies?.depends_on?.length || 0) > 0 ? 0.2 : 0;

    const utility =
      α * (rel + targetBoost) +
      β * crit +
      γ * hot +
      δ * contraBonus -
      λ * cost +
      ε * depBonus;

    // Determine best boundary level to include
    const levels = ["L0", "L1", "L2", "L3", "L4"];
    const levelTokens = levels.map((l) => {
      const text = bv[l] || "";
      return { level: l, tokens: Math.ceil(text.length / 4), text };
    });

    return {
      entity_id: ent.entity_id,
      kind: ent.kind,
      path: ent.path,
      sync_status: ent.sync_status,
      utility,
      relevance: rel + targetBoost,
      token_weight: w.token_weight || 100,
      levelTokens,
      contract_summary: contract.summary || "",
      parity_score: ent.parity_score,
      confidence_score: ent.confidence_score,
      boundary_views: bv,
    };
  });

  // Sort by utility descending
  scored.sort((a: any, b: any) => b.utility - a.utility);

  // Greedy knapsack: fill budget
  const manifest: any[] = [];
  const dropped: any[] = [];
  let usedTokens = 0;

  for (const item of scored) {
    // Pick highest level that fits
    let selectedLevel = "L0";
    let selectedTokens = 0;

    for (const lv of item.levelTokens) {
      if (lv.tokens > 0 && usedTokens + lv.tokens <= token_budget) {
        selectedLevel = lv.level;
        selectedTokens = lv.tokens;
      }
    }

    // At minimum include L0
    if (selectedTokens === 0) {
      const l0 = item.levelTokens[0];
      if (l0.tokens > 0 && usedTokens + l0.tokens <= token_budget) {
        selectedLevel = "L0";
        selectedTokens = l0.tokens;
      }
    }

    if (selectedTokens > 0 && usedTokens + selectedTokens <= token_budget) {
      manifest.push({
        entity_id: item.entity_id,
        kind: item.kind,
        path: item.path,
        level: selectedLevel,
        tokens: selectedTokens,
        utility: Math.round(item.utility * 1000) / 1000,
        relevance: Math.round(item.relevance * 1000) / 1000,
        sync_status: item.sync_status,
        content: item.boundary_views[selectedLevel] || item.contract_summary,
      });
      usedTokens += selectedTokens;
    } else {
      dropped.push({
        entity_id: item.entity_id,
        reason: usedTokens >= token_budget ? "budget_exhausted" : "zero_content",
        utility: Math.round(item.utility * 1000) / 1000,
      });
    }
  }

  return {
    manifest,
    dropped: dropped.slice(0, 20),
    total_tokens: usedTokens,
    budget_remaining: token_budget - usedTokens,
    entity_count: manifest.length,
    policy_used: policy_name,
  };
}

// ═══════════════════════════════════════════════════════════════
// ACTION: evaluate_sync — Synchronization gate
// ═══════════════════════════════════════════════════════════════

async function evaluateSync(supabase: any, body: any) {
  const {
    entity_ids = [],
    change_description = "",
    policy_name = "default",
  } = body;

  if (entity_ids.length === 0) throw new Error("entity_ids required");

  // Load policy
  const { data: policy } = await supabase
    .from("sync_policy_profiles")
    .select("*")
    .eq("name", policy_name)
    .maybeSingle();

  const p = policy || { min_confidence: 0.6, min_parity: 0.5, min_witness_coverage: 0.3, max_blast_radius_auto: 10 };

  // Fetch entities
  const { data: entities } = await supabase
    .from("bci_entities")
    .select("*")
    .in("entity_id", entity_ids)
    .is("valid_time_end", null);

  if (!entities || entities.length === 0) {
    return { outcome: "ABSTAIN", reason: "No entities found" };
  }

  // Compute aggregate scores
  let totalParity = 0;
  let totalConfidence = 0;
  let totalBlast = 0;
  let blockingContradictions: string[] = [];
  const statusesBefore: string[] = [];

  for (const ent of entities) {
    totalParity += ent.parity_score || 0;
    totalConfidence += ent.confidence_score || 0;
    totalBlast += ent.blast_radius || 0;
    if (ent.contradiction_refs?.length > 0) {
      blockingContradictions.push(...ent.contradiction_refs);
    }
    statusesBefore.push(ent.sync_status);
  }

  const avgParity = totalParity / entities.length;
  const avgConfidence = totalConfidence / entities.length;
  const maxBlast = totalBlast;

  // Witness coverage
  const { count: witnessCount } = await supabase
    .from("sync_witnesses")
    .select("id", { count: "exact", head: true })
    .overlaps("subject_entities", entity_ids);

  const witnessCoverage = Math.min(1, (witnessCount || 0) / entity_ids.length);

  // Compute κ via logistic: σ(θ₀ + θ₁P + θ₂A + θ₃W - θ₄R_contra - θ₅R_scope)
  const θ = [0.5, 2.0, 1.5, 1.0, -2.0, -0.5];
  const logit =
    θ[0] +
    θ[1] * avgParity +
    θ[2] * avgConfidence +
    θ[3] * witnessCoverage +
    θ[4] * Math.min(1, blockingContradictions.length * 0.3) +
    θ[5] * Math.min(1, maxBlast / 50);
  const kappa = 1 / (1 + Math.exp(-logit));

  // Determine outcome
  let outcome: string;
  const detectedFailures: string[] = [];

  if (blockingContradictions.length > 0) {
    outcome = "REMEDIATE";
    detectedFailures.push(`${blockingContradictions.length} blocking contradictions`);
  } else if (kappa < p.min_confidence * 0.5) {
    outcome = "ABSTAIN";
    detectedFailures.push(`κ=${kappa.toFixed(3)} below critical threshold`);
  } else if (avgParity < p.min_parity) {
    outcome = "REFRESH";
    detectedFailures.push(`Parity ${avgParity.toFixed(2)} < ${p.min_parity}`);
  } else if (kappa < p.min_confidence) {
    outcome = "WARN";
    detectedFailures.push(`κ=${kappa.toFixed(3)} below threshold ${p.min_confidence}`);
  } else if (maxBlast > p.max_blast_radius_auto) {
    outcome = "WARN";
    detectedFailures.push(`Blast radius ${maxBlast} > auto limit ${p.max_blast_radius_auto}`);
  } else {
    outcome = "PROCEED";
  }

  // Determine status transitions
  const statusAfter =
    outcome === "PROCEED"
      ? "SYNCED"
      : outcome === "WARN"
      ? "PENDING_VALIDATION"
      : outcome === "REFRESH"
      ? "STALE"
      : outcome === "REMEDIATE"
      ? "REMEDIATING"
      : outcome === "ABSTAIN"
      ? "BLOCKED"
      : "ESCALATED";

  // Store evaluation
  const evalRecord = {
    target_entities: entity_ids,
    event: change_description || "sync_evaluation",
    status_before: statusesBefore.join(","),
    status_after: statusAfter,
    scores: {
      parity: avgParity,
      confidence: avgConfidence,
      kappa,
      witness_coverage: witnessCoverage,
      blast_radius: maxBlast,
    },
    policy: p,
    detected_failures: detectedFailures,
    contradiction_refs: blockingContradictions,
    recommended_action: outcome,
  };

  const { data: evalRow } = await supabase
    .from("sync_evaluations")
    .insert(evalRecord)
    .select("id")
    .single();

  // Update entity statuses
  for (const ent of entities) {
    await supabase
      .from("bci_entities")
      .update({ sync_status: statusAfter, confidence_score: kappa })
      .eq("entity_id", ent.entity_id);
  }

  // Log
  await supabase.from("aimos_agent_discord").insert({
    agent_role: "context_sync",
    message_type: "SYNC_GATE",
    content: `Sync gate: ${outcome} | κ=${kappa.toFixed(3)} parity=${avgParity.toFixed(2)} blast=${maxBlast} | ${entity_ids.length} entities`,
    confidence: kappa,
    metadata: { evaluation_id: evalRow?.id, outcome, kappa, entity_ids },
  });

  return {
    evaluation_id: evalRow?.id,
    outcome,
    kappa: Math.round(kappa * 1000) / 1000,
    scores: evalRecord.scores,
    detected_failures: detectedFailures,
    status_transition: `${statusesBefore[0] || "?"} → ${statusAfter}`,
    entities_affected: entities.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// ACTION: create_remediation — Generate bounded repair task
// ═══════════════════════════════════════════════════════════════

async function createRemediation(supabase: any, body: any) {
  const { evaluation_id } = body;
  if (!evaluation_id) throw new Error("evaluation_id required");

  const { data: evaluation } = await supabase
    .from("sync_evaluations")
    .select("*")
    .eq("id", evaluation_id)
    .single();

  if (!evaluation) throw new Error("Evaluation not found");

  const remediations = [];
  for (const entityId of evaluation.target_entities || []) {
    const failures = evaluation.detected_failures || [];
    const missingDimensions: string[] = [];
    
    const scores = evaluation.scores || {};
    if ((scores.parity || 0) < 0.5) missingDimensions.push("quartet_parity");
    if ((scores.witness_coverage || 0) < 0.3) missingDimensions.push("witness_coverage");
    if ((scores.confidence || 0) < 0.5) missingDimensions.push("confidence");

    const { data: rem } = await supabase
      .from("sync_remediation_atoms")
      .insert({
        origin_evaluation_id: evaluation_id,
        target_entity: entityId,
        failure_class: failures[0] || "unknown",
        missing_dimensions: missingDimensions,
        required_context: evaluation.target_entities,
        narrowed_task: `Remediate ${entityId}: ${failures.join("; ")}`,
        retry_budget_remaining: (evaluation.policy?.max_auto_retries || 3),
        authority_tier: "auto",
        status: "pending",
      })
      .select("id")
      .single();

    remediations.push({ entity_id: entityId, remediation_id: rem?.id });
  }

  return { evaluation_id, remediations, count: remediations.length };
}

// ═══════════════════════════════════════════════════════════════
// ACTION: propagate_drift — Dependency hash change propagation
// ═══════════════════════════════════════════════════════════════

async function propagateDrift(supabase: any, body: any) {
  const { entity_id } = body;
  if (!entity_id) throw new Error("entity_id required");

  // Find all entities that depend on this one
  const { data: allEntities } = await supabase
    .from("bci_entities")
    .select("entity_id, dependencies, sync_status, blast_radius")
    .is("valid_time_end", null)
    .not("sync_status", "in", '("ARCHIVED","SUPERSEDED")');

  const affected: string[] = [];
  const queue = [entity_id];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const ent of allEntities || []) {
      const deps = ent.dependencies?.depends_on || ent.dependencies?.imports || [];
      if (deps.includes(current) && !visited.has(ent.entity_id)) {
        affected.push(ent.entity_id);
        queue.push(ent.entity_id);
      }
    }
  }

  // Mark affected as STALE
  for (const affId of affected) {
    await supabase
      .from("bci_entities")
      .update({
        sync_status: "STALE",
        stale_reasons: [`dependency_drift:${entity_id}`],
        blast_radius: affected.length,
      })
      .eq("entity_id", affId);
  }

  // Also mark related memory atoms as pending verification
  if (affected.length > 0) {
    const { data: relatedAtoms } = await supabase
      .from("aimos_memory_atoms")
      .select("id")
      .or(affected.map((a) => `content.ilike.%${a.split("#").pop()}%`).join(","))
      .limit(20);

    for (const atom of relatedAtoms || []) {
      await supabase
        .from("aimos_memory_atoms")
        .update({ verification_status: "pending" })
        .eq("id", atom.id);
    }
  }

  // Log
  await supabase.from("aimos_agent_discord").insert({
    agent_role: "context_sync",
    message_type: "DRIFT_PROPAGATED",
    content: `Drift from ${entity_id} propagated to ${affected.length} downstream entities`,
    confidence: 0.95,
    metadata: { source: entity_id, affected, blast_radius: affected.length },
  });

  return {
    source_entity: entity_id,
    affected_entities: affected,
    blast_radius: affected.length,
    memory_atoms_invalidated: 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// ACTION: record_witness — Bind evidence to entities
// ═══════════════════════════════════════════════════════════════

async function recordWitness(supabase: any, body: any) {
  const {
    kind = "test_run",
    subject_entities = [],
    claims_supported = [],
    result = "pass",
    environment = {},
    artifacts = [],
  } = body;

  if (subject_entities.length === 0) throw new Error("subject_entities required");

  const { data: witness } = await supabase
    .from("sync_witnesses")
    .insert({
      kind,
      subject_entities,
      claims_supported,
      result,
      environment,
      artifacts,
    })
    .select("id")
    .single();

  // If witness passes, potentially upgrade entities
  if (result === "pass") {
    for (const entId of subject_entities) {
      const { data: ent } = await supabase
        .from("bci_entities")
        .select("sync_status, parity_score, confidence_score")
        .eq("entity_id", entId)
        .is("valid_time_end", null)
        .maybeSingle();

      if (ent && (ent.sync_status === "STALE" || ent.sync_status === "INDEXED")) {
        const newConf = Math.min(1, (ent.confidence_score || 0.5) + 0.1);
        await supabase
          .from("bci_entities")
          .update({
            sync_status: newConf > 0.7 ? "SYNCED" : "PENDING_VALIDATION",
            confidence_score: newConf,
          })
          .eq("entity_id", entId);
      }
    }
  }

  return {
    witness_id: witness?.id,
    kind,
    result,
    entities_affected: subject_entities.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

async function healthCheck(supabase: any) {
  const [entities, evals, witnesses, contradictions, remediations] = await Promise.all([
    supabase.from("bci_entities").select("sync_status", { count: "exact" }).is("valid_time_end", null),
    supabase.from("sync_evaluations").select("id", { count: "exact", head: true }),
    supabase.from("sync_witnesses").select("id", { count: "exact", head: true }),
    supabase.from("sync_contradictions").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("sync_remediation_atoms").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  // Count by sync status
  const statusCounts: Record<string, number> = {};
  for (const ent of entities.data || []) {
    statusCounts[ent.sync_status] = (statusCounts[ent.sync_status] || 0) + 1;
  }

  return {
    status: "operational",
    entity_count: entities.count || 0,
    evaluation_count: evals.count || 0,
    witness_count: witnesses.count || 0,
    open_contradictions: contradictions.count || 0,
    pending_remediations: remediations.count || 0,
    status_distribution: statusCounts,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function computeHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateBoundaryViews(
  contract: any,
  kind: string,
  path: string | null
): Record<string, string> {
  const summary = contract.summary || "";
  const inputs = contract.inputs || [];
  const outputs = contract.outputs || [];
  const sideEffects = contract.side_effects || [];
  const failureModes = contract.failure_modes || [];

  return {
    L0: summary || `${kind} at ${path || "unknown"}`,
    L1: `${kind} | inputs: ${inputs.join(", ") || "none"} | outputs: ${outputs.join(", ") || "none"}`,
    L2: `Role: ${summary}. Side effects: ${sideEffects.join(", ") || "none"}. Stability: ${contract.stability || "unknown"}`,
    L3: `Branch map: ${failureModes.length} failure modes. ${inputs.length} inputs → ${outputs.length} outputs. Dependencies tracked.`,
    L4: `Full ops: inputs=[${inputs.join(",")}] outputs=[${outputs.join(",")}] side_effects=[${sideEffects.join(",")}] failures=[${failureModes.join(",")}]`,
  };
}

function computeWeights(
  contract: any,
  boundaryViews: Record<string, string>,
  dependencies: any
): any {
  const totalText = Object.values(boundaryViews).join(" ");
  const tokenWeight = Math.ceil(totalText.length / 4);

  const boundaryWeights: Record<string, number> = {};
  for (const [level, text] of Object.entries(boundaryViews)) {
    boundaryWeights[level] = Math.ceil((text as string).length / 4);
  }

  const depCount = (dependencies.depends_on?.length || 0) + (dependencies.imports?.length || 0);
  const criticality = Math.min(1, depCount * 0.1 + (contract.stability === "stable" ? 0.3 : 0.1));
  const hotness = 0.5; // default, updated via access patterns

  return { token_weight: tokenWeight, boundary_weights: boundaryWeights, criticality, hotness };
}

async function estimateBlastRadius(
  supabase: any,
  entityId: string,
  dependencies: any
): Promise<number> {
  // Count how many other entities depend on this one
  const { data: allEnts } = await supabase
    .from("bci_entities")
    .select("entity_id, dependencies")
    .is("valid_time_end", null)
    .limit(100);

  let count = 0;
  for (const ent of allEnts || []) {
    const deps = ent.dependencies?.depends_on || ent.dependencies?.imports || [];
    if (deps.includes(entityId)) count++;
  }
  return count;
}

function computeQuartetParity(quartet: any): number {
  if (!quartet) return 0;
  const dims = [
    (quartet.code_refs?.length || 0) > 0 ? 1 : 0,
    (quartet.doc_refs?.length || 0) > 0 ? 1 : 0,
    (quartet.test_refs?.length || 0) > 0 ? 1 : 0,
    (quartet.trace_refs?.length || 0) > 0 ? 1 : 0,
  ];
  const covered = dims.filter((d) => d > 0).length;
  // Harmonic mean style: only strong if all 4 present
  return covered === 0 ? 0 : covered / 4;
}
