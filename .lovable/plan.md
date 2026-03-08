

# Deep Self-Reflection, Testing & Visual Proof System

## What Was Found

**Working well (confirmed via live screenshots):**
- System Proof Dashboard: 9/12 subsystems HEALTHY, 139 total rows, 560ms probe time
- CMC Memory Core: 22 atoms at "warm" tier, avg confidence 0.723
- Reasoning Chains: 6 chains with κ scores (0.615, 0.8, 0.8)
- SEG Knowledge Graph: 21 entities
- APOE Plans: 6 active plans, 20 tasks queued
- Agent Discord: 34 messages with real planner THOUGHT/DECISION entries
- HHNI Tag Hierarchy: 25 tags across 4 levels
- Agent Genomes: 7 agents with ELO ratings and 17 relationships
- Status bar shows live counts on every page

**Broken or empty:**
1. **Proposals panel shows "No proposals yet"** despite 14 proposals in DB — because it calls `self-evolution` edge function's `get_proposals` action instead of querying the DB directly
2. **VIF Claim Verification**: 0 entries (never populated)
3. **VIF Confidence Metrics**: 0 entries
4. **Evidence Graph**: 0 entries
5. **Agent Skill Log**: 0 entries
6. **Metrics panel**: empty because no test runs have been persisted to `aimos_test_runs`

---

## Implementation Plan

### 1. Fix Proposals Panel — Query DB Directly
**File:** `src/components/shell/EvolutionCenter.tsx`

Replace the `loadProposals` callback to query `evolution_proposals` table directly via Supabase client instead of going through the edge function. This fixes the "No proposals yet" bug.

```typescript
const loadProposals = useCallback(async () => {
  const { data } = await supabase
    .from('evolution_proposals')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  setProposals(data || []);
}, []);
```

Auto-load on mount with `useEffect`.

### 2. Add "Self-Reflection" Action to System Proof Dashboard
**File:** `src/components/shell/SystemProofDashboard.tsx`

Add a **"Self-Reflect"** button that:
- Runs `runFullProof()` to gather current state
- Calls `hq-chat` edge function with a special system prompt containing the proof data
- Asks the AI: "Analyze this system state. What subsystems are empty? What should be improved? Generate specific recommendations."
- Displays the AI's self-analysis inline in the dashboard as a collapsible "AI Analysis" card
- Persists the reflection as a memory atom in `aimos_memory_atoms` with `content_type: 'self_reflection'`
- Creates `evolution_proposals` for each actionable recommendation

### 3. Add "Populate Empty Subsystems" One-Click Action
**File:** `src/components/shell/SystemProofDashboard.tsx`

For each subsystem showing "EMPTY", add a **"Seed"** button that writes real test data:
- **VIF Claim Verification**: Insert test claims from existing reasoning chains (extract claims from `final_answer` fields)
- **VIF Confidence Metrics**: Compute confidence scores from existing memory atoms and reasoning chains
- **Evidence Graph**: Build relationships from existing entities in SEG
- **Agent Skill Log**: Log current skill snapshots from agent genomes

This uses existing data to cross-populate empty tables, proving the interconnected system works.

### 4. Add "Live Cognitive Test" — End-to-End Proof with Visual Timeline
**File:** `src/components/shell/SystemProofDashboard.tsx`

Add a **"Run Live Test"** button that performs a real cognitive loop in the UI with a visual step-by-step timeline:

1. **Ingest** — Write a unique fact to `aimos_memory_atoms` (show the row)
2. **Retrieve** — Query the atom back and display it
3. **Reason** — Call `hq-chat` with a question about the fact
4. **Verify** — Check the reasoning chain was created, show κ score
5. **Extract** — Check SEG entities were created from the response
6. **Log** — Check Agent Discord for the thread
7. **Reflect** — Write a self-assessment of the test result as a new memory atom

Each step shows: status icon, latency, actual data row returned, and a diff of what changed in the DB (before/after counts).

### 5. Persist Proof Snapshots & Show History
**File:** `src/components/shell/SystemProofDashboard.tsx`

After each `runFullProof()`, persist the result to `self_audit_log`:
```typescript
await supabase.from('self_audit_log').insert({
  audit_type: 'system_proof',
  system_health_score: proof.overallHealth,
  findings: proof.subsystems.map(s => ({ name: s.name, count: s.count, status: s.status, latencyMs: s.latencyMs })),
  proposals_generated: 0,
});
```

Add a "History" section at the bottom showing past proof snapshots with health score trends over time (line chart).

### 6. Self-Process Adjustment UI
**File:** `src/components/shell/SystemProofDashboard.tsx`

Add a "Process Controls" section where the AI can inspect and adjust its own operational parameters:
- Read from `aimos_config` table: show current thresholds (vif_kappa_threshold, context_bank_max_entries, importance_decay_rate)
- Provide edit controls (sliders/inputs) to adjust values
- On save, update `aimos_config` and log the change to `aimos_agent_discord` as a `CONFIG_CHANGE` message
- Show before/after comparison

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/shell/EvolutionCenter.tsx` | Fix proposals query to use DB directly |
| `src/components/shell/SystemProofDashboard.tsx` | Add Self-Reflect, Seed empty subsystems, Live Test, History, Process Controls |

## Technical Details

- Self-Reflect calls `supabase.functions.invoke('hq-chat', ...)` with proof data serialized as context
- Seed functions use existing table data to cross-populate (e.g., extract claims from reasoning chain `final_answer` → insert into `aimos_claim_verification`)
- Live Test creates a unique timestamped fact to avoid false positives
- All results are persisted, not just displayed — every action writes back to the DB
- Process Controls read/write `aimos_config` table directly via Supabase client

