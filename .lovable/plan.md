

# Make AIM-OS Actually Think: From Write-Only to Closed-Loop Cognition

## The Brutal Truth

The system currently performs **decomposition theater**. Here's what the data proves:

| Problem | Evidence |
|---------|----------|
| Plans never execute | All 6 active plans stuck at `current_step: 0` |
| Memory never verified | 26/26 atoms have `verification_status: 'pending'` — VIF never runs |
| Approved proposals never applied | 1 approved proposal ("Coherence-Weighted Self-Audit Cycle") sitting with implementation steps defined but zero execution |
| κ scores are fake | `computeLocalVIFScore` is keyword overlap, not semantic verification. Average κ = 0.48 |
| No contradiction detection | SEG stores entities but never checks for conflicts |
| Memory retrieval is weak | Keyword-based `ilike` matching, no semantic search, no DVNS physics |

The GitHub repo (sev-32/AIM-OS) defines what these systems *should* do. The Supabase implementation has the tables but none of the closing loops. This plan fixes the five most critical gaps.

---

## Phase 1: Close the Proposal Execution Loop

**Problem:** Approved proposals have `implementation_plan` with concrete steps, but nothing reads them or acts.

**Fix in `hq-chat/index.ts`:** After every response post-processing, check for approved proposals and execute their config/prompt changes automatically:

- Query `evolution_proposals` where `status = 'approved' AND applied_at IS NULL`
- For each proposal, parse `implementation_plan.steps` and execute what's automatable:
  - If step mentions config thresholds → update `aimos_config` 
  - If step mentions system prompts → insert into `system_prompts`
  - If step mentions monitoring → create a test scenario in `aimos_test_scenarios`
- Set `applied_at = now()`, store `applied_changes` with what was done
- Log to `aimos_agent_discord` as `PROPOSAL_APPLIED`

**Fix in `SystemProofDashboard.tsx`:** Add an "Apply Approved" button that triggers this same logic client-side for immediate feedback.

---

## Phase 2: Real VIF — Verify Memory Atoms, Gate Low-Confidence

**Problem:** `verification_status` is always 'pending'. The VIF score in `hq-chat` is computed from word overlap, not actual verification.

**Fix in `hq-chat/index.ts` post-processing (`collectAndPostProcess`):**

1. **Verify claims against existing knowledge:** After extracting entities from a response, query SEG for contradictions:
   - For each new entity, search `aimos_entities` for entities with the same name but different descriptions
   - If found, flag as contradiction, insert into `aimos_claim_verification` with `status: 'disputed'`
   - If no contradiction, mark `status: 'verified'`

2. **Update atom verification status:** When a response references a previously stored atom (via CMC retrieval), and the response is consistent with it (κ > 0.6), update that atom's `verification_status` to `'verified'`

3. **Improve κ computation:** Replace the naive word-overlap `computeLocalVIFScore` with:
   - **Factual accuracy:** Check if response claims align with retrieved atoms (current, but weighted by atom confidence)
   - **Self-consistency:** Compare response against the last 3 chains for the same tags — flag contradictions
   - **Completeness:** Check if all retrieved atoms were addressed (not just word count ratio)
   - **Hedging penalty:** Current, but add bonus for explicit confidence statements ("I'm uncertain about X")

4. **κ-gating:** If computed κ < 0.4, append a VIF warning to the response stream: `\n\n> ⚠️ VIF: Low confidence (κ={score}). Verify independently.`

---

## Phase 3: Plan Advancement — Execute Steps, Not Just Decompose

**Problem:** Plans are created with steps but `current_step` never advances past 0.

**Fix in `hq-chat/index.ts`:**

1. In `gatherLiveState`, also load active plans with their current step
2. In `buildSystemPrompt`, include the active plan's current step as a directive: "You are currently executing Step {N} of plan '{title}': {step_description}. Focus your response on completing this step."
3. In `collectAndPostProcess`, after generating a response:
   - Check if the response addresses the current plan step's objective
   - If the response is substantive (>200 chars, κ > 0.5), advance `current_step` by 1
   - Log the step completion in `execution_log`
   - If `current_step >= steps.length`, set plan `status: 'completed'`, `completed_at: now()`

**Fix in `SystemProofDashboard.tsx`:** Show plan progress with a step-by-step timeline, not just "step 0".

---

## Phase 4: Memory Decay & Promotion — Make Memory Levels Real

**Problem:** Memory levels (hot/warm/cold/frozen) exist but atoms never move between them. Per the GitHub spec, CMC should have active lifecycle management.

**Fix — New background process in `hq-chat/index.ts` (runs every Nth call, e.g., every 10th):**

1. **Decay:** Atoms with `access_count = 0` and `last_accessed_at` older than 7 days → demote one level (hot→warm→cold→frozen)
2. **Promotion:** Atoms accessed 3+ times in last 48 hours → promote one level
3. **Compression:** When demoting to `cold` or `frozen`, generate a compressed summary (first 200 chars) and store in `compressed_from` field
4. **Verification decay:** Atoms with `verification_status = 'verified'` that haven't been re-verified in 30 days → reset to `pending`

This creates real memory lifecycle as described in the CMC spec.

---

## Phase 5: Quality Timeline — Track Trends, Not Just Snapshots

**Problem:** The dashboard shows current state but has no awareness of whether things are getting better or worse over time.

**Fix in `SystemProofDashboard.tsx`:**

1. **Quality Trend Panel:** Query last 20 `aimos_reasoning_chains` ordered by date. Plot:
   - κ score over time (line chart)
   - Response length over time
   - Atoms retrieved per query over time
   - Color-code by quality tier (green/yellow/red)

2. **Regression Detection:** Compare average κ of last 5 chains vs previous 5. If it dropped >15%, show a red alert: "Quality regression detected: κ dropped from X to Y"

3. **Self-Audit Trend:** Plot `system_health_score` from `self_audit_log` over time (already partially built, but connect it to the quality data)

4. **Cross-System Integrity Score:** New metric computed from:
   - % of atoms with verification_status != 'pending'
   - % of plans with current_step > 0
   - % of proposals with applied_at != null
   - Average κ across recent chains
   - Display as a single "System Integrity" percentage

---

## Files Changed

| File | What Changes |
|------|-------------|
| `supabase/functions/hq-chat/index.ts` | Phases 1-4: proposal execution, real VIF verification, plan advancement, memory decay |
| `src/components/shell/SystemProofDashboard.tsx` | Phase 5: quality timeline, regression detection, integrity score, plan progress view |

## Why This Matters

The GitHub spec describes systems that *verify*, *remember*, *learn*, and *evolve*. Right now this implementation *stores* and *displays*. These five changes close the loops:

- Proposals get applied (evolution actually happens)
- Memory gets verified (VIF actually gates)
- Plans advance (APOE actually orchestrates)  
- Memory decays and promotes (CMC actually manages lifecycle)
- Quality is tracked over time (the system knows if it's improving)

After this, the System Proof Dashboard will show *real* proof: atoms moving between tiers, plans completing steps, proposals being applied, κ trending upward, and regressions caught automatically.

