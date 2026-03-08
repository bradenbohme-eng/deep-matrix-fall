

# Testing & Improvement Analysis

After reviewing the full codebase -- ScenariosPanel (929 lines), hq-chat (676 lines), agent-tournament (473 lines), AgentGenomesPanel (552 lines), MetricsPanel (312 lines), self-evolution (1584 lines), and agentGenomeService -- here are the real gaps and a concrete plan to address them.

---

## Current Gaps Identified

### 1. Cognitive Loop Test is Fragile
The cognitive loop scenario ingests a fact then immediately queries hq-chat. But CMC retrieval uses keyword matching (`content.ilike`), and the test queries "What is the capital of Zephyria?" while the fact is stored as "The capital of Zephyria is Windholm-{timestamp}". The keyword match may miss it depending on timing and indexing. There's no wait/retry for eventual consistency.

### 2. Tournament Results Don't Feed Back Into Genomes
The tournament engine updates ELO ratings but doesn't write learnings to `agent_context_bank` or update `skill_levels` based on what was tested. A duel about VIF bypass should update the winner's VIF-related skill proficiency.

### 3. No Cross-Agent Validation Scenario
No test verifies that the chain-of-command actually works: planner delegates to researcher, researcher produces output, verifier checks it, auditor reviews. The multi-agent scenario just queues tasks independently.

### 4. MetricsPanel Doesn't Show Per-Scenario Trends
It shows aggregate pass rate but can't answer "is the Cognitive Loop getting better or worse over time?" -- no per-scenario breakdown.

### 5. Agent Context Banks Have No Pruning
Context bank entries accumulate forever. No decay, no importance re-scoring, no deduplication. Eventually the top-5 context injected into hq-chat will be stale.

### 6. No Scheduled/Automated Test Runs
Tests only run when a human clicks "Run All". There's no periodic health check.

---

## Implementation Plan

### Phase A: Harden the Cognitive Loop Test
**File:** `src/components/shell/ScenariosPanel.tsx`

- Add a 2-second delay between CMC ingest and hq-chat query to allow indexing
- After querying hq-chat, if the response doesn't contain the fact, retry once with a direct CMC retrieval check to distinguish "AI didn't use memory" from "memory wasn't indexed yet"
- Add a dedicated step: "Verify CMC Retrieval" that queries `aimos_memory_atoms` directly to confirm the fact is retrievable before asking hq-chat

### Phase B: Tournament → Genome Feedback Loop
**File:** `supabase/functions/agent-tournament/index.ts`

- After each duel/round, extract the winning strategies as learnings
- Write winner's insights to `agent_context_bank` with `context_type: 'tournament_win'`
- Write loser's mistakes to their bank with `context_type: 'tournament_loss'`
- Update `skill_levels` on the genome based on the challenge domain (e.g., VIF duel → bump `verification` skill for winner, decrease for loser)
- Log skill changes to `agent_skill_log`

### Phase C: Chain-of-Command Integration Test
**File:** `src/components/shell/ScenariosPanel.tsx`

Add a 7th scenario: **"Chain of Command"** that:
1. Creates a complex objective via APOE
2. Verifies Planner genome received the task (check `agent_context_bank` for new entry)
3. Simulates Researcher output and checks Verifier is invoked
4. Checks that Auditor reviews the final output
5. Verifies trust scores between participating agents were updated in `agent_relationships`
6. Confirms the full thread appears in Agent Discord with correct `thread_id` linking

### Phase D: Per-Scenario Trend Charts in MetricsPanel
**File:** `src/components/shell/MetricsPanel.tsx`

- Parse the `metrics` JSON from `aimos_test_runs` to extract `scenario` field
- Group runs by scenario ID
- Add a scenario selector dropdown
- Show per-scenario pass rate trend line and latency trend
- Highlight regressions per scenario (was passing, now failing)

### Phase E: Context Bank Maintenance
**File:** `supabase/functions/hq-chat/index.ts` (post-processing section)

- After updating agent genomes, run a context bank pruning step:
  - If an agent has > 50 context entries, remove lowest-importance entries with access_count = 0
  - Deduplicate entries with > 80% content overlap (keep higher importance)
  - Decay importance by 0.01 per day since last access
- Add a new action to `self-evolution` edge function: `prune_context_banks` that can be triggered manually or via scenario

### Phase F: Scheduled Health Check via Self-Evolution
**File:** `supabase/functions/self-evolution/index.ts`

- Add a `health_check` action that runs a lightweight version of "Run All":
  - CMC ingest + retrieve (no hq-chat call, just memory round-trip)
  - VIF score computation
  - SEG entity extraction
  - Agent genome stats summary
- Returns a health score and writes to `self_audit_log`
- Can be called from a cron or from the UI's "Quick Health Check" button
- Add a "Quick Health Check" button to the MetricsPanel header

---

## Summary

| Phase | What It Fixes | Files |
|-------|--------------|-------|
| A | Flaky cognitive loop test | ScenariosPanel.tsx |
| B | Tournaments don't improve agents | agent-tournament/index.ts |
| C | No chain-of-command verification | ScenariosPanel.tsx |
| D | Can't track per-scenario trends | MetricsPanel.tsx |
| E | Context banks grow unbounded | hq-chat/index.ts |
| F | No automated health monitoring | self-evolution/index.ts, MetricsPanel.tsx |

