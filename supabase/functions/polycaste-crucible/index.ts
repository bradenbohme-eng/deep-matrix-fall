import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════
// POLYCASTE CRUCIBLE — Adversarial Pre-Output Stress Testing
// Implements The Deliberative Polycaste "Generative Adversarial Reasoning"
// 
// Draft → Inquisitor Attack → Blandness Penalty → Rewrite Loop → Release Gate
// ═══════════════════════════════════════════════════════════

const BLANDNESS_PATTERNS = [
  /\bAs an AI\b/i,
  /\bI don['']t have personal\b/i,
  /\bIn conclusion\b/i,
  /\bIt['']s important to note\b/i,
  /\bI hope this helps\b/i,
  /\bLet me know if you\b/i,
  /\bI['']d be happy to\b/i,
  /\bI cannot provide\b/i,
  /\bI['']m just an AI\b/i,
  /\bplease note that\b/i,
  /\bTo summarize\b/i,
  /\bIn summary\b/i,
  /\bAs I mentioned\b/i,
  /\bIt['']s worth noting\b/i,
  /\bHowever, it['']s important\b/i,
];

const FALLACY_PATTERNS = [
  { name: "circular_reasoning", pattern: /because .+ therefore .+ because/i },
  { name: "appeal_to_authority", pattern: /experts say|studies show|research indicates/i },
  { name: "false_dichotomy", pattern: /either .+ or .+ (only|just) (two|2)/i },
  { name: "hasty_generalization", pattern: /\ball .+\b(are|is|always|never)\b/i },
];

interface CrucibleRequest {
  action: "attack" | "rewrite" | "full_loop" | "health_check";
  draft?: string;
  userQuery?: string;
  maxIterations?: number;
  confidenceThreshold?: number;
  entropyThreshold?: number;
  chainId?: string;
}

interface CrucibleResult {
  success: boolean;
  passed: boolean;
  finalDraft: string;
  iterations: number;
  confidence: number;
  rhetoricalEntropy: number;
  blandnessScore: number;
  critiques: CritiqueResult[];
  fallaciesDetected: string[];
  releasedAt?: string;
}

interface CritiqueResult {
  iteration: number;
  blandnessScore: number;
  rhetoricalEntropy: number;
  fallacies: string[];
  critique: string;
  rewriteInstructions?: string;
  passed: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: CrucibleRequest = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    switch (body.action) {
      case "health_check":
        return json({
          status: "ok",
          engine: "polycaste-crucible",
          version: "1.0.0",
          capabilities: ["attack", "rewrite", "full_loop"],
          blandnessPatterns: BLANDNESS_PATTERNS.length,
          fallacyDetectors: FALLACY_PATTERNS.length,
        });

      case "attack":
        return await handleAttack(body.draft || "", supabase);

      case "rewrite":
        return await handleRewrite(body.draft || "", body.userQuery || "", lovableKey!, supabase);

      case "full_loop":
        return await handleFullLoop(body, lovableKey!, supabase);

      default:
        return json({ error: "Unknown action", available: ["health_check", "attack", "rewrite", "full_loop"] }, 400);
    }
  } catch (e) {
    console.error("[polycaste-crucible] Error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
// ATTACK — Inquisitor evaluates draft for weaknesses
// ═══════════════════════════════════════════════════════════

async function handleAttack(draft: string, supabase: any): Promise<Response> {
  const critique = analyzeForWeaknesses(draft);

  // Log to Agent Discord
  await supabase.from("aimos_agent_discord").insert({
    agent_role: "inquisitor",
    message_type: "CRITIQUE",
    content: `Analyzed draft (${draft.length} chars). Blandness: ${(critique.blandnessScore * 100).toFixed(1)}%, Entropy: ${(critique.rhetoricalEntropy * 100).toFixed(1)}%. Fallacies: ${critique.fallacies.join(", ") || "none"}`,
    confidence: critique.rhetoricalEntropy,
    metadata: {
      blandnessScore: critique.blandnessScore,
      rhetoricalEntropy: critique.rhetoricalEntropy,
      fallacies: critique.fallacies,
      passed: critique.passed,
    },
  });

  return json({
    success: true,
    critique,
  });
}

function analyzeForWeaknesses(draft: string): CritiqueResult {
  // Calculate blandness score
  const matchedPatterns = BLANDNESS_PATTERNS.filter(p => p.test(draft));
  const blandnessScore = matchedPatterns.length / BLANDNESS_PATTERNS.length;
  const rhetoricalEntropy = 1 - blandnessScore;

  // Detect logical fallacies
  const fallacies = FALLACY_PATTERNS
    .filter(f => f.pattern.test(draft))
    .map(f => f.name);

  // Generate critique text
  const critiqueParts: string[] = [];
  
  if (blandnessScore > 0.2) {
    critiqueParts.push(`High blandness detected (${(blandnessScore * 100).toFixed(0)}%). Remove generic AI boilerplate phrases.`);
  }
  
  if (fallacies.length > 0) {
    critiqueParts.push(`Logical fallacies detected: ${fallacies.join(", ")}. Strengthen reasoning.`);
  }

  // Check structural issues
  const sentences = draft.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((a, s) => a + s.split(/\s+/).length, 0) / Math.max(sentences.length, 1);
  
  if (avgSentenceLength > 35) {
    critiqueParts.push("Excessive sentence length. Break into shorter, punchier statements for impact.");
  }
  if (avgSentenceLength < 8 && sentences.length > 3) {
    critiqueParts.push("Overly fragmented. Consider combining ideas for better flow.");
  }

  // Check for substantive content
  if (draft.length < 50 && draft.includes("?")) {
    critiqueParts.push("Response appears deflective. Provide concrete substance.");
  }

  const critique = critiqueParts.length > 0 
    ? critiqueParts.join(" ") 
    : "Draft passes initial scrutiny. Minor polish may enhance impact.";

  // Determine pass/fail
  // κ ≥ 0.75 AND entropy ≥ 0.80
  const passed = rhetoricalEntropy >= 0.80 && fallacies.length === 0 && blandnessScore < 0.2;

  return {
    iteration: 0,
    blandnessScore,
    rhetoricalEntropy,
    fallacies,
    critique,
    passed,
    rewriteInstructions: passed ? undefined : `Rewrite to address: ${critique}`,
  };
}

// ═══════════════════════════════════════════════════════════
// REWRITE — Synthesizer rewrites draft based on critique
// ═══════════════════════════════════════════════════════════

async function handleRewrite(draft: string, userQuery: string, lovableKey: string, supabase: any): Promise<Response> {
  const critique = analyzeForWeaknesses(draft);
  
  if (critique.passed) {
    return json({ success: true, draft, unchanged: true, reason: "Draft already passes crucible" });
  }

  const rewrittenDraft = await rewriteWithAI(draft, userQuery, critique, lovableKey);

  // Log to Agent Discord
  await supabase.from("aimos_agent_discord").insert({
    agent_role: "synthesizer",
    message_type: "REWRITE",
    content: `Rewrote draft based on Inquisitor critique. Original: ${draft.length} chars → New: ${rewrittenDraft.length} chars`,
    confidence: 0.8,
    metadata: {
      originalLength: draft.length,
      newLength: rewrittenDraft.length,
      critiqueSummary: critique.critique,
    },
  });

  return json({
    success: true,
    draft: rewrittenDraft,
    unchanged: false,
    appliedCritique: critique.critique,
  });
}

async function rewriteWithAI(draft: string, userQuery: string, critique: CritiqueResult, lovableKey: string): Promise<string> {
  const systemPrompt = `You are the AIMOS Synthesizer agent. Your task is to rewrite a draft response to address critiques from the Inquisitor.

CRITIQUE TO ADDRESS:
${critique.critique}

RULES:
1. NEVER use phrases like "As an AI", "I hope this helps", "Let me know if", "In conclusion"
2. Be direct, substantive, and intellectually rigorous
3. Avoid sycophantic language
4. Use varied sentence structure — mix long analytical sentences with short impactful ones
5. If the original had logical fallacies (${critique.fallacies.join(", ")}), fix the reasoning
6. Maintain the core meaning while improving clarity and impact

Return ONLY the rewritten response, nothing else.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Original user query: "${userQuery}"\n\nDraft to rewrite:\n${draft}` },
      ],
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    console.error("[polycaste-crucible] AI rewrite failed:", resp.status);
    return draft; // Return original if rewrite fails
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || draft;
}

// ═══════════════════════════════════════════════════════════
// FULL LOOP — Complete Adversarial Crucible with gating
// ═══════════════════════════════════════════════════════════

async function handleFullLoop(body: CrucibleRequest, lovableKey: string, supabase: any): Promise<Response> {
  const {
    draft: initialDraft = "",
    userQuery = "",
    maxIterations = 3,
    confidenceThreshold = 0.75,
    entropyThreshold = 0.80,
    chainId,
  } = body;

  let currentDraft = initialDraft;
  const critiques: CritiqueResult[] = [];
  let iteration = 0;
  let passed = false;
  let finalCritique: CritiqueResult | null = null;

  // Log crucible start
  await supabase.from("aimos_agent_discord").insert({
    agent_role: "inquisitor",
    message_type: "CRUCIBLE_START",
    content: `Beginning adversarial crucible for draft (${initialDraft.length} chars). Max ${maxIterations} iterations. Thresholds: κ≥${confidenceThreshold}, ε≥${entropyThreshold}`,
    confidence: 0.5,
    metadata: { chainId, maxIterations, confidenceThreshold, entropyThreshold },
  });

  while (iteration < maxIterations && !passed) {
    iteration++;

    // Attack
    const critique = analyzeForWeaknesses(currentDraft);
    critique.iteration = iteration;
    critiques.push(critique);

    // Check if passes thresholds
    const meetsConfidence = critique.rhetoricalEntropy >= entropyThreshold;
    const noFallacies = critique.fallacies.length === 0;
    const lowBlandness = critique.blandnessScore < (1 - entropyThreshold);

    if (meetsConfidence && noFallacies && lowBlandness) {
      passed = true;
      finalCritique = critique;
      critique.passed = true;
      break;
    }

    // Rewrite if not passed and not last iteration
    if (iteration < maxIterations) {
      currentDraft = await rewriteWithAI(currentDraft, userQuery, critique, lovableKey);
    }

    finalCritique = critique;
  }

  // Store verification record
  if (chainId) {
    await supabase.from("aimos_claim_verification").insert({
      chain_id: chainId,
      claim_text: currentDraft.slice(0, 500),
      confidence: finalCritique?.rhetoricalEntropy || 0,
      status: passed ? "verified" : "flagged",
      rhetorical_entropy: finalCritique?.rhetoricalEntropy || 0,
      blandness_score: finalCritique?.blandnessScore || 0,
      crucible_iteration: iteration,
    });
  }

  // Log crucible result
  await supabase.from("aimos_agent_discord").insert({
    agent_role: "inquisitor",
    message_type: passed ? "CRUCIBLE_PASS" : "CRUCIBLE_FAIL",
    content: `Crucible ${passed ? "PASSED" : "FAILED"} after ${iteration} iteration(s). Final entropy: ${((finalCritique?.rhetoricalEntropy || 0) * 100).toFixed(1)}%, Blandness: ${((finalCritique?.blandnessScore || 0) * 100).toFixed(1)}%`,
    confidence: finalCritique?.rhetoricalEntropy || 0,
    metadata: { 
      passed, 
      iterations: iteration, 
      finalEntropy: finalCritique?.rhetoricalEntropy,
      finalBlandness: finalCritique?.blandnessScore,
      chainId,
    },
  });

  const result: CrucibleResult = {
    success: true,
    passed,
    finalDraft: currentDraft,
    iterations: iteration,
    confidence: finalCritique?.rhetoricalEntropy || 0,
    rhetoricalEntropy: finalCritique?.rhetoricalEntropy || 0,
    blandnessScore: finalCritique?.blandnessScore || 0,
    critiques,
    fallaciesDetected: [...new Set(critiques.flatMap(c => c.fallacies))],
    releasedAt: passed ? new Date().toISOString() : undefined,
  };

  // If not passed, append confidence warning
  if (!passed) {
    result.finalDraft = currentDraft + "\n\n[CONFIDENCE: LOW — Response did not clear adversarial validation threshold]";
  }

  return json(result);
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
