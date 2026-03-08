

# Contextual Sync: The Most Advanced Context System

## What This Is

The uploaded paper describes **Contextual Sync** — a formal architecture for AI-native software engineering built around a **Bitemporal Contract Index (BCI)**, hierarchical navigation (L0-L5), token-weighted context resolution, synchronization gating, bounded remediation loops, and a semantic evidence graph. This is a massive step beyond the current AIMOS memory system.

The current system stores memory atoms, does keyword retrieval, and has basic VIF scoring. Contextual Sync replaces that with a structured substrate where every code artifact has contracts, dependency hashes, blast radius estimates, quartet parity checks (code/docs/tests/traces), and a 12-state synchronization state machine.

## Architecture: What Gets Built

```text
┌──────────────────────────────────────────────────────────────┐
│                    CONTEXTUAL SYNC ENGINE                     │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  BCI Store   │  │  Boundary    │  │  Dependency &       │ │
│  │  (entities,  │  │  View Gen    │  │  Drift Engine       │ │
│  │  versions,   │  │  (L0-L5)     │  │  (hashes, blast     │ │
│  │  bitemporal) │  │              │  │   radius, stale)    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────────────┘ │
│         │                 │                  │               │
│  ┌──────┴─────────────────┴──────────────────┴─────────────┐ │
│  │              Context Resolver Service                    │ │
│  │   Token-weighted · Budget-aware · Utility-scored         │ │
│  └───────────────────────┬─────────────────────────────────┘ │
│                          │                                   │
│  ┌───────────────────────┴─────────────────────────────────┐ │
│  │              Synchronization Gate                        │ │
│  │   Quartet parity · Confidence κ · State machine          │ │
│  │   PROCEED | WARN | REFRESH | REMEDIATE | ABSTAIN | ESC   │ │
│  └───────────────────────┬─────────────────────────────────┘ │
│                          │                                   │
│  ┌───────────────────────┴─────────────────────────────────┐ │
│  │         Remediation Orchestrator                         │ │
│  │   Bounded retries · Priority ranking · Escalation        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Evidence Graph (SEG extended)                │ │
│  │   Witnesses · Contradictions · Lessons · Overrides       │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Task 1: Database Schema — BCI Tables

Create the core Contextual Sync tables via migration:

**`bci_entities`** — The Bitemporal Contract Index core
- `entity_id` (text, primary key) — canonical ID like `ent://repo/module/file#symbol`
- `kind` (text) — function, type, module, file, test, schema, route, config
- `path` (text) — file path
- `language` (text)
- `owner` (text) — owning module/subsystem
- `visibility` (text) — public/private/internal
- `span` (jsonb) — `{line_start, line_end, byte_start, byte_end}`
- `contract` (jsonb) — `{summary, inputs, outputs, side_effects, failure_modes, stability}`
- `weights` (jsonb) — `{token_weight, boundary_weights: {L0-L5}, hotness, criticality}`
- `boundary_views` (jsonb) — `{L0: purpose, L1: signature, L2: role, L3: branch_map, L4: ops, L5_ref}`
- `dependencies` (jsonb) — `{imports, depends_on, dependency_hash}`
- `quartet` (jsonb) — `{code_refs, doc_refs, test_refs, trace_refs}`
- `sync_status` (text) — UNINDEXED/INDEXED/SYNCED/STALE/DRIFTED/PENDING_VALIDATION/PARTIALLY_SYNCED/BLOCKED/REMEDIATING/ESCALATED/SUPERSEDED/ARCHIVED
- `parity_score` (float)
- `confidence_score` (float)
- `blast_radius` (int)
- `stale_reasons` (text[])
- `contradiction_refs` (text[])
- `tx_time` (timestamptz)
- `valid_time_start` (timestamptz)
- `valid_time_end` (timestamptz, nullable — null means currently valid)
- `supersedes` (text, nullable)
- `superseded_by` (text, nullable)
- `created_at`, `updated_at`

**`bci_entity_versions`** — Historical version chain
- `id`, `entity_id` (FK), `version_number`, `contract`, `weights`, `boundary_views`, `dependencies`, `dependency_hash`, `tx_time`, `valid_time_start`, `valid_time_end`

**`sync_evaluations`** — Gate decision records
- `id`, `target_entities` (text[]), `event` (text), `status_before`, `status_after`
- `scores` (jsonb) — `{parity, confidence, witness_coverage, contract_alignment}`
- `policy` (jsonb) — snapshot of thresholds used
- `detected_failures` (text[])
- `contradiction_refs` (text[])
- `recommended_action` (text) — PROCEED/WARN/REFRESH/REMEDIATE/ABSTAIN/ESCALATE
- `tx_time`, `valid_time_start`, `valid_time_end`

**`sync_witnesses`** — Evidence binding
- `id`, `kind` (test_run, trace, static_check, doc_update), `subject_entities` (text[])
- `claims_supported` (text[]), `result` (text), `environment` (jsonb)
- `artifacts` (text[]), `tx_time`, `valid_time_start`, `valid_time_end`

**`sync_contradictions`** — First-class contradiction objects
- `id`, `subject` (text), `object` (text), `relation` (text), `reason` (text)
- `severity` (text), `status` (open/resolved/archived), `tx_time`, `valid_time_start`, `valid_time_end`

**`sync_remediation_atoms`** — Bounded repair tasks
- `id`, `origin_evaluation_id` (FK), `target_entity` (text), `failure_class` (text)
- `missing_dimensions` (text[]), `required_context` (text[]), `narrowed_task` (text)
- `retry_budget_remaining` (int), `authority_tier` (text), `escalation_target` (text)
- `status` (pending/active/completed/failed/escalated), `tx_time`

**`sync_policy_profiles`** — Configurable gate thresholds
- `id`, `name` (text, unique), `min_confidence` (float), `min_parity` (float)
- `min_witness_coverage` (float), `max_blast_radius_auto` (int), `max_auto_retries` (int)
- `block_on` (text[]), `warn_on` (text[]), `version` (int), `is_active` (bool)

Indexes on `entity_id`, `sync_status`, `path`, `kind`, `tx_time`.

### Task 2: Edge Function — `context-sync` Engine

New Supabase edge function: `supabase/functions/context-sync/index.ts`

Handles multiple actions routed by `action` field:

**`index_entity`** — Parse and index a code artifact into BCI
- Accept entity data (path, kind, contract, span, dependencies)
- Generate L0-L5 boundary views using Gemini (compact, machine-first)
- Compute token weights, dependency hash (SHA-256 of sorted dependency list)
- Estimate blast radius via downstream dependency count weighted by criticality
- Store with bitemporal timestamps, sync_status: "INDEXED"
- If prior version exists, close its `valid_time_end` and set `supersedes`

**`resolve_context`** — Token-weighted context assembly
- Accept: task prompt, target entity hints, token budget, policy profile name
- Implementation of the utility function: `U(v,l|q) = α·rel + β·crit + γ·hot + δ·contra - λ·cost + ε·dep`
- Two-stage heuristic: (1) select nucleus entities + critical dependencies, (2) greedily fill by marginal utility/token
- Return execution manifest: selected entities with levels, dropped entities with reasons, projected cost

**`evaluate_sync`** — Synchronization gate
- Accept: changed entity IDs, proposed change description
- Compute quartet parity (harmonic mean of code/docs/tests/traces alignment)
- Compute confidence κ via logistic function: `σ(θ₀ + θ₁P + θ₂A + θ₃W - θ₄R_hall - θ₅R_contra - θ₆R_scope)`
- Check for blocking contradictions
- Return gate outcome: PROCEED/WARN/REFRESH/REMEDIATE/ABSTAIN/ESCALATE
- Store sync_evaluation record
- Emit state transitions for affected entities

**`create_remediation`** — Generate bounded repair task
- Accept: evaluation_id
- Generate remediation atom with narrowed task, missing dimensions, retry budget
- Store and return

**`propagate_drift`** — Dependency hash change propagation
- Accept: changed entity_id
- Recompute dependency hashes for dependents
- Mark downstream entities STALE or DRIFTED
- Estimate blast radius
- Return affected entity list

**`record_witness`** — Bind evidence to entities
- Accept: witness data (kind, subject entities, result, environment)
- Store witness, update witness coverage for subject entities
- If witness passes, potentially transition entities from STALE to SYNCED

### Task 3: Integrate Context Sync into HQ-Chat Pipeline

Modify `supabase/functions/hq-chat/index.ts`:

- After CMC retrieval, call `resolve_context` from the context-sync engine to get a token-budgeted, utility-scored execution manifest instead of naive keyword retrieval
- Inject boundary views at appropriate levels into the system prompt
- After response generation, run `evaluate_sync` to gate the response quality using quartet parity
- If gate returns BLOCKED/REMEDIATE, log to agent discord and flag in reasoning chain
- Store response as a witness for referenced entities

### Task 4: Context Sync Dashboard Panel

New component: `src/components/shell/ContextSyncDashboard.tsx`

Sections:
1. **BCI Overview** — Entity count by kind, sync status distribution (pie/bar chart), stale entity count
2. **Sync State Heatmap** — Grid of entities colored by sync status (green=SYNCED, yellow=STALE, red=DRIFTED/BLOCKED)
3. **Gate History** — Recent sync evaluations with scores, outcomes, and expandable details
4. **Active Contradictions** — Open contradictions with severity, subject/object entities
5. **Remediation Queue** — Active remediation atoms with retry budgets and status
6. **Policy Profiles** — View and switch between active policies
7. **Blast Radius Visualizer** — When selecting an entity, show downstream impact estimate
8. **Evidence Timeline** — Bitemporal view of witnesses and validity windows

Wire into the Shell's LeftRail or as a new workspace page accessible via SubPageBar.

### Task 5: Wire Into Existing Systems

- **CMC Integration**: BCI entities reference memory atoms. When an entity transitions to STALE, related memory atoms get verification_status reset to "pending"
- **SEG Integration**: BCI entities map to `aimos_entities`. Contradictions in context-sync feed into `aimos_claim_verification`
- **Evolution Integration**: When sync evaluations detect recurring failure patterns, auto-generate evolution proposals
- **Agent Discord**: All state transitions and gate decisions logged as structured messages

## Files Changed

| File | What |
|------|------|
| `supabase/migrations/new` | BCI tables, sync tables, policy tables, indexes |
| `supabase/functions/context-sync/index.ts` | New: Full Contextual Sync engine (index, resolve, gate, remediate, propagate, witness) |
| `supabase/functions/hq-chat/index.ts` | Integrate context resolver and sync gate into pipeline |
| `src/components/shell/ContextSyncDashboard.tsx` | New: Full dashboard for BCI state, gate history, contradictions, remediation queue |
| `src/components/shell/CenterWorkspace.tsx` | Route to new dashboard |
| `src/components/shell/types.ts` | Add 'context-sync' workspace type |
| `src/components/shell/useShellStore.ts` | Add context-sync navigation |
| `supabase/config.toml` | Register context-sync function |

## Why This Matters

The current system does keyword-based `ilike` retrieval and word-overlap VIF scoring. Contextual Sync replaces that with:
- **Structured navigation** instead of flat search (L0-L5 boundary views)
- **Token-budgeted assembly** instead of "grab whatever matches" (utility-scored knapsack)
- **Real synchronization gating** instead of post-hoc κ scores (quartet parity + state machine)
- **Bounded remediation** instead of "log the failure and move on" (retry budgets + escalation)
- **Bitemporal truth** instead of mutable overwrites (validity windows, supersession chains)
- **First-class contradictions** instead of buried warnings (severity-weighted, auditable)

