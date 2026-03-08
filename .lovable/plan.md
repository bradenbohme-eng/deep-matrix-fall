

# Improving the Testing & AI Systems — Analysis and Plan

## Current State Assessment

After reviewing the entire cognitive stack (6 edge functions, scenario runners, HQ chat pipeline, self-evolution engine), here are the **real problems**:

### Problem 1: Tests Don't Prove the AI Can Actually USE the System
The scenario runners fire hardcoded payloads at edge functions and check for non-error responses. They never test whether the AI (hq-chat) actually leverages CMC/VIF/SEG during a real conversation. There's no closed-loop test: "ask the AI a question → verify it retrieved the right memory → verify it cited it → verify VIF scored the output."

### Problem 2: No Feedback Loop Between Chat and Engines
`hq-chat` does post-processing as fire-and-forget (`schedulePostProcessing`), but it only logs a meta_observer message and stores the raw query as a warm atom. It never:
- Runs SEG extraction on the AI's **response**
- Runs VIF verification on the AI's **response**
- Updates the reasoning chain with the **final answer**
- Feeds verification results back into memory for future retrieval

### Problem 3: Agent Discord is Display-Only
The Agent Discord feed is a read-only log viewer with no filtering, no threading, and no ability for agents to **react to each other's messages**. It's a dead-end display, not an actual coordination channel.

### Problem 4: Self-Evolution Proposals Are Never Applied
The `approve_proposal` action updates a DB status field but doesn't actually change any system behavior. There's no mechanism to apply proposals (update prompts, tweak thresholds, modify retrieval params).

### Problem 5: Scenarios Use Hardcoded Data
Every scenario runner uses static test strings. They don't test with real user data or verify that previous test data persists and is retrievable in future runs.

---

## Implementation Plan

### Phase 1: Closed-Loop Integration Test (the "Proof Scenario")

Add a 6th scenario called **"Full Cognitive Loop"** that:
1. Ingests a unique fact via CMC (`"The capital of Zephyria is Windholm"`)
2. Calls `hq-chat` with a question that requires that fact (`"What is the capital of Zephyria?"`)
3. Parses the streamed response and checks it contains `"Windholm"`
4. Queries `aimos_reasoning_chains` to verify a chain was created for this interaction
5. Queries `aimos_agent_discord` to verify meta_observer logged the interaction
6. Runs VIF scoring on the response and checks κ > 0.6

This proves the AI **actually uses** the memory system. Pass/fail is objective.

**Files**: `src/components/shell/ScenariosPanel.tsx`

### Phase 2: Fix hq-chat Post-Processing Pipeline

Update `supabase/functions/hq-chat/index.ts`:
- Collect the full streamed response using a `TransformStream` that tees the SSE
- After streaming completes, run **VIF verify** on the response text
- Run **SEG extract_local** on the response to capture new entities
- Update the `aimos_reasoning_chains` record with `final_answer` and `confidence_kappa` from VIF
- Store high-confidence response segments as new memory atoms

This makes every chat interaction strengthen the knowledge base.

### Phase 3: Agent Discord Filtering & Threading

Update the `AgentDiscordFeed` component:
- Add filter dropdowns: by `agent_role`, by `message_type`, by `plan_id`
- Group messages by `thread_id` with collapsible thread headers
- Add Supabase Realtime subscription instead of polling every 5s
- Show thread context: plan objective at thread header

**Files**: `src/components/shell/ScenariosPanel.tsx` (AgentDiscordFeed component)

### Phase 4: Make Self-Evolution Proposals Actionable

Update `supabase/functions/self-evolution/index.ts`:
- When a proposal is approved, actually execute it:
  - `prompt_update`: Store new system prompt fragments in a `system_prompts` table that `hq-chat` reads
  - `threshold_update`: Update confidence thresholds in an `aimos_config` table
  - `memory_policy`: Update decay/compression parameters
- Add a `system_prompts` and `aimos_config` table via migration
- Wire `hq-chat` to read from `system_prompts` table on each request

**Files**: `supabase/functions/self-evolution/index.ts`, `supabase/functions/hq-chat/index.ts`, new migration

### Phase 5: Continuous Regression Test Suite

Add an automated test runner that can execute all 6 scenarios in sequence and persist results:
- Store each run's results in `aimos_test_runs` with timestamps and pass/fail per step
- Add a "Run All" button to ScenariosPanel
- Show historical pass rates in MetricsPanel (trend line over time)
- Flag regressions: if a previously-passing scenario fails, emit an ALERT to Agent Discord

**Files**: `src/components/shell/ScenariosPanel.tsx`, `src/components/shell/MetricsPanel.tsx`

---

## Summary of Changes

| Phase | What It Proves | Key Files |
|-------|---------------|-----------|
| 1 | AI actually retrieves and uses stored memories | ScenariosPanel.tsx |
| 2 | Every chat interaction strengthens the knowledge base | hq-chat/index.ts |
| 3 | Agent coordination is visible and filterable | ScenariosPanel.tsx |
| 4 | Self-evolution proposals have real system impact | self-evolution/index.ts, hq-chat/index.ts, migration |
| 5 | System health is tracked over time with regression detection | ScenariosPanel.tsx, MetricsPanel.tsx |

