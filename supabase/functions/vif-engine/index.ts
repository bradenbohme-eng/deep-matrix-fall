import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════
// VIF ENGINE — Verifiable Intelligence Framework
// Handles: pre-gate, verify, score, correct
// ═══════════════════════════════════════════════════════════

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
      case "pregate":
        return await handlePregate(supabase, body);
      case "verify":
        return await handleVerify(supabase, lovableKey, body);
      case "score":
        return await handleScore(supabase, body);
      default:
        return json({ error: "Unknown action", actions: ["pregate", "verify", "score"] }, 400);
    }
  } catch (e) {
    console.error("[VIF] Error:", e);
    return json({ error: e.message }, 500);
  }
});

// ── PRE-GATE: Check context quality before AI call ──
async function handlePregate(supabase: any, body: any) {
  const { contextAtoms = [] } = body;

  const atomCount = contextAtoms.length;
  const avgConfidence = atomCount > 0
    ? contextAtoms.reduce((s: number, a: any) => s + (a.confidence_score || 0.5), 0) / atomCount
    : 0;

  const quality = atomCount >= 3 && avgConfidence >= 0.5 ? "sufficient" : atomCount >= 1 ? "low" : "none";
  const shouldHedge = quality !== "sufficient";

  return json({
    success: true,
    pregate: {
      atomCount,
      avgConfidence,
      quality,
      shouldHedge,
      instruction: shouldHedge
        ? "You have limited context. State what you know and what you're uncertain about. Hedge appropriately."
        : null,
    },
  });
}

// ── VERIFY: Post-response verification with claim extraction ──
async function handleVerify(supabase: any, lovableKey: string | undefined, body: any) {
  const { response, contextAtoms = [], chainId, query } = body;
  if (!response) return json({ error: "response required" }, 400);

  // Extract claims using AI
  let claims: any[] = [];
  if (lovableKey) {
    try {
      const extractResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: "Extract factual claims from the following AI response. Return a JSON array of objects with 'claim' (string) and 'type' ('factual'|'opinion'|'inference'). Only extract concrete, verifiable claims. Max 10 claims.",
            },
            { role: "user", content: response.slice(0, 3000) },
          ],
          tools: [{
            type: "function",
            function: {
              name: "extract_claims",
              description: "Extract factual claims from text",
              parameters: {
                type: "object",
                properties: {
                  claims: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        claim: { type: "string" },
                        type: { type: "string", enum: ["factual", "opinion", "inference"] },
                      },
                      required: ["claim", "type"],
                    },
                  },
                },
                required: ["claims"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "extract_claims" } },
        }),
      });

      if (extractResp.ok) {
        const data = await extractResp.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const args = JSON.parse(toolCall.function.arguments);
          claims = args.claims || [];
        }
      }
    } catch (e) {
      console.error("[VIF] Claim extraction failed:", e);
    }
  }

  // Cross-reference claims against CMC atoms
  const contextText = contextAtoms.map((a: any) => a.content || "").join("\n").toLowerCase();
  const verifiedClaims = claims.map((c: any) => {
    const claimWords = c.claim.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const matchCount = claimWords.filter((w: string) => contextText.includes(w)).length;
    const matchRatio = claimWords.length > 0 ? matchCount / claimWords.length : 0;

    let status: string;
    if (matchRatio >= 0.5) status = "verified";
    else if (c.type === "inference") status = "inference";
    else status = "unverified";

    return {
      claim: c.claim,
      type: c.type,
      status,
      matchRatio,
      confidence: matchRatio * 0.8 + (c.type === "factual" ? 0.1 : 0),
    };
  });

  // Store claim verifications
  if (chainId && verifiedClaims.length > 0) {
    for (const vc of verifiedClaims) {
      await supabase.from("aimos_claim_verification").insert({
        chain_id: chainId,
        claim_text: vc.claim,
        status: vc.status,
        confidence: vc.confidence,
      });
    }
  }

  // Compute overall scores
  const verified = verifiedClaims.filter((c: any) => c.status === "verified").length;
  const contradicted = verifiedClaims.filter((c: any) => c.status === "contradicted").length;
  const total = verifiedClaims.length || 1;

  const factualAccuracy = verified / total;
  const hallucinationRisk = contradicted / total;

  return json({
    success: true,
    verification: {
      claims: verifiedClaims,
      factualAccuracy,
      hallucinationRisk,
      totalClaims: verifiedClaims.length,
      verified,
      contradicted,
      unverified: verifiedClaims.filter((c: any) => c.status === "unverified").length,
    },
  });
}

// ── SCORE: Compute composite κ score ──
async function handleScore(supabase: any, body: any) {
  const {
    factualAccuracy = 0.5,
    consistency = 0.7,
    completeness = 0.6,
    relevance = 0.7,
    freshness = 0.8,
    chainId,
  } = body;

  const weights = { factualAccuracy: 0.30, consistency: 0.25, completeness: 0.20, relevance: 0.15, freshness: 0.10 };
  const kappa =
    factualAccuracy * weights.factualAccuracy +
    consistency * weights.consistency +
    completeness * weights.completeness +
    relevance * weights.relevance +
    freshness * weights.freshness;

  let qualityTier: string;
  if (kappa >= 0.85) qualityTier = "green";
  else if (kappa >= 0.60) qualityTier = "yellow";
  else if (kappa >= 0.40) qualityTier = "orange";
  else qualityTier = "red";

  // Update reasoning chain with κ score
  if (chainId) {
    await supabase.from("aimos_reasoning_chains").update({
      confidence_kappa: kappa,
      quality_tier: qualityTier,
      verification_report: { factualAccuracy, consistency, completeness, relevance, freshness },
    }).eq("id", chainId);
  }

  return json({
    success: true,
    score: {
      kappa,
      qualityTier,
      components: { factualAccuracy, consistency, completeness, relevance, freshness },
      shouldHedge: qualityTier === "orange" || qualityTier === "red",
      shouldSuppress: qualityTier === "red",
    },
  });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
