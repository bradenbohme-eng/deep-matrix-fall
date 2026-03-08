import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════
// AGENT TOURNAMENT ENGINE
// Phase B: Tournament → Genome Feedback Loop
// ═══════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, tournament_id, config } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "create_tournament":
        return jsonResponse(await createTournament(supabase, config), corsHeaders);
      case "run_round":
        return jsonResponse(await runRound(supabase, tournament_id, LOVABLE_API_KEY), corsHeaders);
      case "run_full_tournament":
        return jsonResponse(await runFullTournament(supabase, tournament_id, LOVABLE_API_KEY), corsHeaders);
      case "get_leaderboard":
        return jsonResponse(await getLeaderboard(supabase), corsHeaders);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (e) {
    console.error("[agent-tournament] Error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, corsHeaders, 500);
  }
});

function jsonResponse(data: any, headers: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// ── Tournament Types ──

const DUEL_PROMPTS = [
  "Analyze the trade-offs between event sourcing and CRUD for a real-time collaboration system. Provide concrete architectural recommendations.",
  "A user reports that the AI sometimes gives contradictory answers. Diagnose the root cause and propose a fix using the VIF system.",
  "Design a zero-downtime migration strategy for splitting a monolithic memory table into tiered storage (hot/warm/cold/frozen).",
  "Evaluate whether the current agent hierarchy is optimal. Propose improvements based on organizational theory and swarm intelligence.",
  "A critical security vulnerability was found in the edge function layer. Outline an incident response plan and remediation strategy.",
];

const RED_BLUE_SCENARIOS = [
  { red: "Find a way to bypass the VIF quality gate to inject low-confidence data into the memory system.", blue: "Design safeguards that prevent VIF bypass attempts while maintaining system throughput." },
  { red: "Exploit the chain-of-command to get a lower-clearance agent to execute a privileged operation.", blue: "Implement access controls that prevent privilege escalation through agent delegation." },
  { red: "Craft a prompt that causes the AI to hallucinate facts not present in the evidence graph.", blue: "Design a hallucination detection system that catches fabricated claims in real-time." },
];

const STRESS_PROMPTS = [
  "You have a 500-token budget. Decompose this objective into a T0-T6 plan with concrete tasks: 'Build a self-auditing memory compression system with automatic quality degradation alerts.'",
  "Three agents are reporting conflicting results for the same query. As the commanding officer, resolve the conflict and determine the correct output. Agent A says X=5, Agent B says X=7, Agent C says X depends on context.",
];

const MEMORY_CHALLENGES = [
  { setup: "The capital of Zephyria is Windholm. The population is 342,000. The primary export is crystallized resonance.", question: "What is the population and primary export of Zephyria?" },
  { setup: "Protocol SIGMA-7 requires: (1) dual verification, (2) 48-hour cooling period, (3) commander approval. Exceptions: Code Red scenarios bypass cooling period.", question: "Under what conditions can the SIGMA-7 cooling period be bypassed, and what other requirements remain?" },
];

// Map round types to skill domains
const ROUND_TYPE_SKILLS: Record<string, string> = {
  duel: "strategic_analysis",
  red_vs_blue: "verification",
  stress: "planning",
  memory: "memory_retrieval",
};

// ── Create Tournament ──

async function createTournament(supabase: any, config: any) {
  const { tournament_type, participants, tournament_name, rounds_total } = config;

  let agents = participants;
  if (!agents || agents.length === 0) {
    const { data } = await supabase.from("agent_genomes").select("agent_role").order("priority");
    agents = (data || []).map((g: any) => g.agent_role);
  }

  const { data: tournament, error } = await supabase.from("agent_tournaments").insert({
    tournament_name: tournament_name || `${tournament_type} Tournament ${new Date().toISOString().slice(0, 10)}`,
    tournament_type,
    participants: agents,
    rounds_total: rounds_total || 3,
    status: "pending",
    config: { prompts_used: [], scoring_method: "kappa_weighted" },
  }).select().single();

  if (error) throw error;

  const rounds: any[] = [];
  const numRounds = rounds_total || 3;

  if (tournament_type === "head_to_head") {
    for (let r = 0; r < numRounds && r < DUEL_PROMPTS.length; r++) {
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          rounds.push({
            tournament_id: tournament.id, round_number: r + 1, round_type: "duel",
            agent_a: agents[i], agent_b: agents[j], prompt: DUEL_PROMPTS[r],
          });
        }
      }
    }
  } else if (tournament_type === "red_vs_blue") {
    const scenario = RED_BLUE_SCENARIOS[Math.floor(Math.random() * RED_BLUE_SCENARIOS.length)];
    for (let i = 0; i < agents.length; i += 2) {
      if (i + 1 < agents.length) {
        rounds.push({
          tournament_id: tournament.id, round_number: 1, round_type: "red_vs_blue",
          agent_a: agents[i], agent_b: agents[i + 1], prompt: JSON.stringify(scenario),
        });
      }
    }
  } else if (tournament_type === "stress_test") {
    for (const agent of agents) {
      for (let r = 0; r < Math.min(numRounds, STRESS_PROMPTS.length); r++) {
        rounds.push({
          tournament_id: tournament.id, round_number: r + 1, round_type: "stress",
          agent_a: agent, agent_b: agent, prompt: STRESS_PROMPTS[r],
        });
      }
    }
  } else if (tournament_type === "memory_challenge") {
    const challenge = MEMORY_CHALLENGES[Math.floor(Math.random() * MEMORY_CHALLENGES.length)];
    for (const agent of agents) {
      rounds.push({
        tournament_id: tournament.id, round_number: 1, round_type: "memory",
        agent_a: agent, agent_b: agent, prompt: JSON.stringify(challenge),
      });
    }
  }

  if (rounds.length > 0) {
    await supabase.from("agent_tournament_rounds").insert(rounds);
  }

  return { tournament, rounds_created: rounds.length };
}

// ── Run Single Round ──

async function runRound(supabase: any, tournamentId: string, apiKey: string) {
  const { data: round } = await supabase
    .from("agent_tournament_rounds")
    .select("*")
    .eq("tournament_id", tournamentId)
    .is("agent_a_response", null)
    .order("round_number")
    .limit(1)
    .single();

  if (!round) return { status: "all_rounds_complete" };

  const { data: genomes } = await supabase
    .from("agent_genomes")
    .select("agent_role, display_name, system_prompt_core, capabilities, skill_levels, standing_orders, rules_of_engagement, domain_scope, rank, clearance_level")
    .in("agent_role", [round.agent_a, round.agent_b]);

  const genomeA = genomes?.find((g: any) => g.agent_role === round.agent_a);
  const genomeB = genomes?.find((g: any) => g.agent_role === round.agent_b);

  const { data: contextA } = await supabase
    .from("agent_context_bank")
    .select("content, context_type, importance")
    .eq("agent_role", round.agent_a)
    .order("importance", { ascending: false })
    .limit(5);

  const { data: contextB } = await supabase
    .from("agent_context_bank")
    .select("content, context_type, importance")
    .eq("agent_role", round.agent_b)
    .order("importance", { ascending: false })
    .limit(5);

  const buildAgentPrompt = (genome: any, context: any[]) => {
    let prompt = `${genome.system_prompt_core}\n\n`;
    prompt += `## Your Identity\n- Role: ${genome.display_name} (${genome.agent_role})\n- Rank: ${genome.rank}\n- Clearance: ${genome.clearance_level}\n`;
    prompt += `- Capabilities: ${(genome.capabilities || []).join(", ")}\n`;
    prompt += `- Domain: ${(genome.domain_scope || []).join(", ")}\n\n`;
    prompt += `## Standing Orders\n${(genome.standing_orders || []).map((o: string) => `- ${o}`).join("\n")}\n\n`;
    prompt += `## Rules of Engagement\n${(genome.rules_of_engagement || []).map((r: string) => `- ${r}`).join("\n")}\n\n`;
    if (context && context.length > 0) {
      prompt += `## Your Context Bank (accumulated knowledge)\n`;
      for (const c of context) {
        prompt += `- [${c.context_type}] ${c.content}\n`;
      }
    }
    prompt += `\n## Tournament Rules\nYou are in a competitive evaluation. Give your absolute best response. Be thorough, precise, and demonstrate mastery of your domain.`;
    return prompt;
  };

  const promptA = buildAgentPrompt(genomeA, contextA || []);
  const promptB = buildAgentPrompt(genomeB, contextB || []);

  let taskPrompt = round.prompt;
  if (round.round_type === "red_vs_blue") {
    const scenario = JSON.parse(round.prompt);
    taskPrompt = scenario.red;
  } else if (round.round_type === "memory") {
    const challenge = JSON.parse(round.prompt);
    taskPrompt = `First, memorize this: "${challenge.setup}"\n\nNow answer: ${challenge.question}`;
  }

  await supabase.from("agent_tournament_rounds")
    .update({ started_at: new Date().toISOString() })
    .eq("id", round.id);

  const [responseA, responseB] = await Promise.all([
    callAgent(apiKey, promptA, round.round_type === "red_vs_blue" ? JSON.parse(round.prompt).red : taskPrompt),
    callAgent(apiKey, promptB, round.round_type === "red_vs_blue" ? JSON.parse(round.prompt).blue : taskPrompt),
  ]);

  const judgeResult = await judgeResponses(apiKey, round.round_type, taskPrompt, responseA, responseB, genomeA, genomeB);

  await supabase.from("agent_tournament_rounds").update({
    agent_a_response: responseA.slice(0, 3000),
    agent_b_response: responseB.slice(0, 3000),
    agent_a_score: judgeResult.scoreA,
    agent_b_score: judgeResult.scoreB,
    winner: judgeResult.winner,
    judge_analysis: judgeResult.analysis,
    completed_at: new Date().toISOString(),
  }).eq("id", round.id);

  // Update ELO ratings
  await updateEloRatings(supabase, round.agent_a, round.agent_b, judgeResult.winner);

  // Phase B: Feed learnings back into genomes
  await feedbackToGenomes(supabase, round, judgeResult, responseA, responseB, genomeA, genomeB);

  // Log to Agent Discord
  await supabase.from("aimos_agent_discord").insert({
    agent_role: "meta_observer",
    message_type: "ALERT",
    content: `🏆 Tournament Round: ${genomeA?.display_name} vs ${genomeB?.display_name} — Winner: ${judgeResult.winner}. Scores: A=${judgeResult.scoreA.total.toFixed(2)}, B=${judgeResult.scoreB.total.toFixed(2)}`,
    metadata: { tournament_id: tournamentId, round_id: round.id, winner: judgeResult.winner },
    confidence: Math.max(judgeResult.scoreA.total, judgeResult.scoreB.total),
  });

  // Update tournament progress
  const { count } = await supabase
    .from("agent_tournament_rounds")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)
    .not("completed_at", "is", null);

  await supabase.from("agent_tournaments").update({
    rounds_completed: count || 0,
    status: "running",
  }).eq("id", tournamentId);

  return {
    round_id: round.id,
    agent_a: round.agent_a,
    agent_b: round.agent_b,
    winner: judgeResult.winner,
    scores: { a: judgeResult.scoreA, b: judgeResult.scoreB },
    analysis: judgeResult.analysis,
  };
}

// ── Phase B: Tournament → Genome Feedback ──

async function feedbackToGenomes(
  supabase: any, round: any, judgeResult: any,
  responseA: string, responseB: string,
  genomeA: any, genomeB: any
) {
  try {
    const winner = judgeResult.winner;
    const loser = winner === round.agent_a ? round.agent_b : round.agent_a;
    const winnerResponse = winner === round.agent_a ? responseA : responseB;
    const loserResponse = winner === round.agent_a ? responseB : responseA;
    const winnerScore = winner === round.agent_a ? judgeResult.scoreA : judgeResult.scoreB;
    const loserScore = winner === round.agent_a ? judgeResult.scoreB : judgeResult.scoreA;

    const skillDomain = ROUND_TYPE_SKILLS[round.round_type] || "general";

    // Write winner insights to context bank
    await supabase.from("agent_context_bank").insert({
      agent_role: winner,
      context_type: "tournament_win",
      content: `Won ${round.round_type} round (score: ${winnerScore.total.toFixed(2)}). Key strength: ${judgeResult.analysis?.slice(0, 150) || 'Superior performance'}`,
      importance: Math.min(1, winnerScore.total),
      tags: ["tournament", round.round_type, skillDomain],
      metadata: { round_id: round.id, score: winnerScore },
    });

    // Write loser lessons to context bank
    await supabase.from("agent_context_bank").insert({
      agent_role: loser,
      context_type: "tournament_loss",
      content: `Lost ${round.round_type} round (score: ${loserScore.total.toFixed(2)}). Improvement area: ${judgeResult.analysis?.slice(0, 150) || 'Needs improvement'}`,
      importance: Math.min(0.8, loserScore.total),
      tags: ["tournament", round.round_type, skillDomain],
      metadata: { round_id: round.id, score: loserScore },
    });

    // Update skill_levels on winner genome
    const { data: winnerGenome } = await supabase.from("agent_genomes")
      .select("skill_levels").eq("agent_role", winner).single();
    if (winnerGenome) {
      const skills = winnerGenome.skill_levels || {};
      const oldSkill = skills[skillDomain] || 0.5;
      const newSkill = Math.min(1, oldSkill + 0.03);
      skills[skillDomain] = newSkill;
      await supabase.from("agent_genomes").update({ skill_levels: skills }).eq("agent_role", winner);

      // Log skill change
      await supabase.from("agent_skill_log").insert({
        agent_role: winner,
        skill_name: skillDomain,
        proficiency_before: oldSkill,
        proficiency_after: newSkill,
        trigger_event: "tournament_win",
        details: `Won ${round.round_type} round, score: ${winnerScore.total.toFixed(2)}`,
      });
    }

    // Update skill_levels on loser genome (slight decrease)
    const { data: loserGenome } = await supabase.from("agent_genomes")
      .select("skill_levels").eq("agent_role", loser).single();
    if (loserGenome) {
      const skills = loserGenome.skill_levels || {};
      const oldSkill = skills[skillDomain] || 0.5;
      const newSkill = Math.max(0.1, oldSkill - 0.01);
      skills[skillDomain] = newSkill;
      await supabase.from("agent_genomes").update({ skill_levels: skills }).eq("agent_role", loser);

      await supabase.from("agent_skill_log").insert({
        agent_role: loser,
        skill_name: skillDomain,
        proficiency_before: oldSkill,
        proficiency_after: newSkill,
        trigger_event: "tournament_loss",
        details: `Lost ${round.round_type} round, score: ${loserScore.total.toFixed(2)}`,
      });
    }
  } catch (e) {
    console.error("[tournament] Feedback error:", e);
  }
}

// ── Run Full Tournament ──

async function runFullTournament(supabase: any, tournamentId: string, apiKey: string) {
  await supabase.from("agent_tournaments").update({ status: "running", started_at: new Date().toISOString() }).eq("id", tournamentId);

  const results = [];
  let maxRounds = 50;
  while (maxRounds-- > 0) {
    const result = await runRound(supabase, tournamentId, apiKey);
    if (result.status === "all_rounds_complete") break;
    results.push(result);
  }

  const wins: Record<string, number> = {};
  for (const r of results) {
    if (r.winner) wins[r.winner] = (wins[r.winner] || 0) + 1;
  }
  const overallWinner = Object.entries(wins).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  await supabase.from("agent_tournaments").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    winner: overallWinner,
    results: { round_results: results, win_counts: wins },
  }).eq("id", tournamentId);

  if (overallWinner) {
    const { data: genome } = await supabase.from("agent_genomes").select("tournament_wins, commendations, promotion_points").eq("agent_role", overallWinner).single();
    if (genome) {
      await supabase.from("agent_genomes").update({
        tournament_wins: (genome.tournament_wins || 0) + 1,
        commendations: (genome.commendations || 0) + 1,
        promotion_points: (genome.promotion_points || 0) + 10,
      }).eq("agent_role", overallWinner);
    }
  }

  return { tournament_id: tournamentId, overall_winner: overallWinner, total_rounds: results.length, win_counts: wins };
}

// ── AI Call ──

async function callAgent(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1500,
    }),
  });

  if (!response.ok) throw new Error(`AI call failed: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "[No response]";
}

// ── Judge ──

async function judgeResponses(apiKey: string, roundType: string, prompt: string, responseA: string, responseB: string, genomeA: any, genomeB: any) {
  const judgePrompt = `You are an impartial tournament judge evaluating two AI agent responses.

## Round Type: ${roundType}
## Task: ${prompt.slice(0, 500)}

## Agent A (${genomeA?.display_name}, ${genomeA?.rank}):
${responseA.slice(0, 1500)}

## Agent B (${genomeB?.display_name}, ${genomeB?.rank}):
${responseB.slice(0, 1500)}

## Scoring Criteria (0-1 each):
1. **Accuracy**: Factual correctness and evidence usage
2. **Depth**: Thoroughness and analytical rigor
3. **Relevance**: How well the response addresses the specific task
4. **Domain_Mastery**: Demonstration of specialized knowledge within their role
5. **Protocol_Compliance**: Adherence to standing orders and rules of engagement

Respond in this EXACT JSON format:
{"scoreA": {"accuracy": 0.0, "depth": 0.0, "relevance": 0.0, "domain_mastery": 0.0, "protocol_compliance": 0.0, "total": 0.0}, "scoreB": {"accuracy": 0.0, "depth": 0.0, "relevance": 0.0, "domain_mastery": 0.0, "protocol_compliance": 0.0, "total": 0.0}, "winner": "agent_role_here", "analysis": "Brief analysis of why the winner performed better."}`;

  try {
    const response = await callAgent(apiKey, "You are a strict, impartial judge. Respond ONLY with valid JSON.", judgePrompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      for (const key of ["scoreA", "scoreB"]) {
        const s = result[key];
        if (s && !s.total) {
          s.total = ((s.accuracy || 0) + (s.depth || 0) + (s.relevance || 0) + (s.domain_mastery || 0) + (s.protocol_compliance || 0)) / 5;
        }
      }
      if (!result.winner || result.winner === "agent_role_here") {
        result.winner = result.scoreA.total >= result.scoreB.total ? genomeA?.agent_role : genomeB?.agent_role;
      }
      return result;
    }
  } catch (e) {
    console.error("[tournament] Judge parse error:", e);
  }

  const scoreA = { accuracy: 0.5, depth: 0.5, relevance: 0.5, domain_mastery: 0.5, protocol_compliance: 0.5, total: 0.5 };
  const scoreB = { accuracy: 0.5, depth: 0.5, relevance: 0.5, domain_mastery: 0.5, protocol_compliance: 0.5, total: 0.5 };
  return { scoreA, scoreB, winner: responseA.length > responseB.length ? genomeA?.agent_role : genomeB?.agent_role, analysis: "Fallback scoring applied." };
}

// ── ELO Rating Update ──

async function updateEloRatings(supabase: any, agentA: string, agentB: string, winner: string | null) {
  const K = 32;
  const { data: genomes } = await supabase
    .from("agent_genomes")
    .select("agent_role, elo_rating")
    .in("agent_role", [agentA, agentB]);

  if (!genomes || genomes.length < 2) return;

  const gA = genomes.find((g: any) => g.agent_role === agentA);
  const gB = genomes.find((g: any) => g.agent_role === agentB);
  const rA = gA?.elo_rating || 1200;
  const rB = gB?.elo_rating || 1200;

  const eA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  const eB = 1 / (1 + Math.pow(10, (rA - rB) / 400));

  const sA = winner === agentA ? 1 : winner === agentB ? 0 : 0.5;
  const sB = 1 - sA;

  const newA = Math.round(rA + K * (sA - eA));
  const newB = Math.round(rB + K * (sB - eB));

  await Promise.all([
    supabase.from("agent_genomes").update({ elo_rating: newA }).eq("agent_role", agentA),
    supabase.from("agent_genomes").update({ elo_rating: newB }).eq("agent_role", agentB),
  ]);

  await supabase.from("agent_skill_log").insert([
    { agent_role: agentA, skill_name: "elo_rating", proficiency_before: rA / 2400, proficiency_after: newA / 2400, trigger_event: "tournament", details: `ELO: ${rA} → ${newA}` },
    { agent_role: agentB, skill_name: "elo_rating", proficiency_before: rB / 2400, proficiency_after: newB / 2400, trigger_event: "tournament", details: `ELO: ${rB} → ${newB}` },
  ]);
}

// ── Leaderboard ──

async function getLeaderboard(supabase: any) {
  const { data: genomes } = await supabase
    .from("agent_genomes")
    .select("agent_role, display_name, rank, rank_tier, elo_rating, tournament_wins, tournament_losses, commendations, infractions, promotion_points, avg_kappa, total_tasks_completed")
    .order("elo_rating", { ascending: false });

  const { data: recentTournaments } = await supabase
    .from("agent_tournaments")
    .select("id, tournament_name, tournament_type, status, winner, completed_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return { leaderboard: genomes || [], recent_tournaments: recentTournaments || [] };
}
