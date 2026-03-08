

# Evolution Center: Advanced Testing & VM Integration Plan

## Current State
The Evolution Center has four panels (Audit, Engines, Sandbox, Proposals) with basic health checks, a 6-step pipeline test (CMC→SEG→VIF→APOE), a code sandbox, and proposal management. Tests are shallow — they ping engines and check DB counts. No multi-agent orchestration testing, no research chains, no document processing validation, no chained reasoning verification.

## What We Need to Build (Phased)

### Phase A: Advanced Test Scenarios (New Sub-Page: "Scenarios")
Add a **Scenarios** sub-page with pre-built complex test templates that exercise the full cognitive stack:

1. **Research & Document Chain** — Ingest a doc via `document-processor` → extract entities via SEG → store in CMC → verify via VIF → produce a summary. Validates the full RAG pipeline end-to-end.

2. **Multi-Agent Orchestration** — Submit a complex objective to APOE → decompose T0→T6 → execute task queue entries sequentially (Planner→Researcher→Builder→Verifier) → log all activity to Agent Discord → display the full agent trace with timing.

3. **Memory Lifecycle** — Create atoms at hot tier → trigger decay via CMC → verify tier transitions (hot→warm→cold) → test semantic compression → verify retrieval still works after compression.

4. **Claim Verification Loop** — Generate a response with claims → extract claims via VIF → verify each claim against CMC/SEG evidence → compute aggregate κ → display a verification report card.

5. **Self-Evolution Cycle** — Run full audit → generate proposals → approve one → verify it was applied → re-audit to confirm improvement.

Each scenario shows a live step-by-step execution trace with per-step latency, pass/fail, agent Discord messages, and expandable output inspection.

### Phase B: Agent Discord Live Feed
Add a real-time **Agent Discord** viewer panel that:
- Polls or subscribes to `aimos_agent_discord` table
- Shows threaded agent messages grouped by `thread_id`
- Color-coded by `message_type` (THOUGHT=blue, DECISION=green, ALERT=red, etc.)
- Filterable by agent role and plan
- Appears as a collapsible bottom panel on the Scenarios page

### Phase C: VM/External Connection Layer
Add a **Connections** sub-page for managing external AI endpoints:
- Register external API endpoints (Gemini direct, local MCP servers, Cloudflare workers)
- Test connectivity and latency to each registered endpoint
- Route specific agent roles to specific backends (e.g., Researcher→Perplexity, Builder→Gemini 2.5 Pro)
- Store connection configs in a new `aimos_vm_connections` table
- Edge function proxy (`vm-proxy`) that routes requests based on connection config

### Phase D: Metrics Dashboard & Regression Tracking
Add a **Metrics** sub-page:
- Historical test results stored in `aimos_test_runs` table
- Trend charts (recharts) for: avg latency per engine, κ score over time, pipeline pass rate
- Regression detection: flag when metrics degrade vs. previous runs
- Export test reports as JSON

## Database Changes

```sql
-- Test scenarios and their runs
CREATE TABLE aimos_test_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  scenario_type TEXT NOT NULL, -- 'research_chain', 'multi_agent', 'memory_lifecycle', etc.
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE aimos_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES aimos_test_scenarios(id),
  status TEXT DEFAULT 'running',
  steps JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- VM/External connections
CREATE TABLE aimos_vm_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  connection_type TEXT NOT NULL, -- 'gemini', 'openai', 'mcp', 'cloudflare', 'local'
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'untested',
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## UI Changes

```text
EvolutionCenter Sub-Pages (updated):
┌─────────┬──────────┬───────────┬─────────────┬───────────┬─────────┐
│  AUDIT  │ ENGINES  │ SCENARIOS │ CONNECTIONS │  METRICS  │PROPOSALS│
└─────────┴──────────┴───────────┴─────────────┴───────────┴─────────┘
                          ↑ NEW       ↑ NEW        ↑ NEW
```

- **Scenarios**: Grid of scenario cards → click to run → live step trace with Agent Discord feed
- **Connections**: Register/test external VM endpoints, assign to agent roles
- **Metrics**: Recharts trend lines for system health over time

## File Changes
- `src/components/shell/types.ts` — Add new sub-pages: `scenarios`, `connections`, `metrics`
- `src/components/shell/EvolutionCenter.tsx` — Add 3 new panel components
- `src/components/shell/SubPageBar.tsx` — Add new tabs
- `supabase/functions/vm-proxy/index.ts` — New edge function for external routing
- Migration for new tables

## Implementation Order
1. **Phase A first** — Most value, tests real cognitive depth immediately
2. **Phase B** — Agent Discord feed makes orchestration tests observable
3. **Phase C** — VM connections enable routing to stronger models
4. **Phase D** — Metrics give historical tracking for regression detection

