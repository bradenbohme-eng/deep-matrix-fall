

# Context Testing Laboratory — Full Page for Method Comparison

## What Gets Built

A new dedicated page at `/context-lab` with a full-screen testing environment for comparing context retrieval methods under different scenarios. This is a standalone route (not buried in the Evolve sub-page tabs) so it can be used as a primary workspace.

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  CONTEXT TESTING LABORATORY                    [Export JSON] │
├─────────┬───────────────────────────────────────────────────┤
│         │                                                   │
│ METHOD  │  TEST CONFIGURATION                               │
│ SELECT  │  ┌─────────────────────────────────────────────┐  │
│         │  │ Prompt: [____________________________]      │  │
│ ☑ BCI   │  │ Token Budget: [4000]  Policy: [default ▼]  │  │
│ ☑ CMC   │  │ Scenario: [Custom ▼] [Code Gen ▼] [Debug]  │  │
│ ☑ RAG   │  └─────────────────────────────────────────────┘  │
│ ☑ Naive │                                                   │
│         │  RESULTS COMPARISON (side-by-side cards)          │
│ ─────── │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ PRESETS │  │ BCI      │ │ CMC      │ │ RAG      │         │
│         │  │ 823ms    │ │ 340ms    │ │ 210ms    │         │
│ Code    │  │ κ: 0.82  │ │ κ: 0.61  │ │ κ: 0.45  │         │
│ Debug   │  │ 12 ents  │ │ 8 atoms  │ │ 5 chunks │         │
│ Arch    │  │ Tokens:  │ │ Tokens:  │ │ Tokens:  │         │
│ Refactor│  │ 3200     │ │ 2800     │ │ 1900     │         │
│ Memory  │  └──────────┘ └──────────┘ └──────────┘         │
│ Security│                                                   │
│         │  WINNER ANALYSIS                                  │
│ ─────── │  "BCI retrieved 4 critical deps CMC missed.      │
│ HISTORY │  RAG was fastest but lowest coverage."            │
│         │                                                   │
│ Run #3  │  DETAILED COMPARISON TABLE                        │
│ Run #2  │  Method | Latency | Entities | κ | Coverage      │
│ Run #1  │  BCI    | 823ms   | 12       | .82 | 94%         │
│         │  CMC    | 340ms   | 8        | .61 | 72%         │
│         │                                                   │
│         │  TREND CHART (runs over time)                     │
│         │  [Line chart: κ per method across runs]           │
└─────────┴───────────────────────────────────────────────────┘
```

## Implementation

### 1. New Page Component: `src/pages/ContextLab.tsx`

Full-page layout with:

**Left sidebar:**
- Method checkboxes (BCI Context Sync, CMC Memory Retrieval, RAG Chunk Search, Naive Keyword)
- Preset scenario buttons (Code Generation, Debugging, Architecture Review, Refactoring, Memory Recall, Security Audit) — each pre-fills a prompt and token budget
- Run history list (stored in localStorage)

**Center workspace:**
- **Test Config Panel**: Prompt textarea, token budget slider (1000-16000), policy profile selector, optional target entity hints
- **Run Button**: Executes all selected methods in parallel, measures latency
- **Results Cards**: Side-by-side comparison cards for each method showing:
  - Latency (ms)
  - Entities/atoms/chunks retrieved
  - Token cost
  - Coverage score (% of target entities found)
  - Quality score (κ or equivalent)
  - The actual retrieved context (expandable)
- **Winner Analysis**: Auto-generated summary of which method won and why
- **Comparison Table**: Sortable table of all metrics across methods
- **Trend Chart**: `recharts` LineChart plotting κ and latency across historical runs per method

### 2. Context Method Implementations

Each method calls a different retrieval path:

**BCI (Context Sync)**: Calls `context-sync` edge function with `action: 'resolve_context'` — returns utility-scored manifest with boundary views

**CMC (Memory Atoms)**: Calls `cmc-engine` with `action: 'retrieve'` — returns keyword-matched memory atoms by tags

**RAG (Chunk Search)**: Queries `chunks` table via `match_chunks` function if embeddings exist, otherwise falls back to `ilike` on content

**Naive Keyword**: Direct `ilike` search on `bci_entities` + `aimos_memory_atoms` by prompt words — baseline comparison

### 3. Scoring & Comparison Logic

For each method result, compute:
- `latency_ms`: wall clock time
- `entity_count`: number of results returned
- `token_cost`: estimated tokens consumed by returned context
- `coverage`: % of target entities (if specified) that were found
- `relevance_score`: word overlap between prompt and returned content (simple but uniform across methods)
- `depth_score`: average boundary level depth (BCI-specific, 0 for others)

Winner determination: weighted score = 0.3×relevance + 0.25×coverage + 0.2×(1/normalized_latency) + 0.15×depth + 0.1×(budget_efficiency)

### 4. Route Registration

Add `/context-lab` route in `App.tsx`.

### 5. Preset Scenarios

Each preset provides:
```ts
{ 
  name: string,
  prompt: string, 
  token_budget: number, 
  target_entities: string[],
  expected_kinds: string[]  // for coverage scoring
}
```

Six built-in presets covering different retrieval challenges (high-dependency code gen, debugging with traces, broad architecture review, etc.).

## Files Changed

| File | What |
|------|------|
| `src/pages/ContextLab.tsx` | New: Full context testing laboratory page |
| `src/App.tsx` | Add `/context-lab` route |
| `src/components/shell/types.ts` | Add 'context-lab' to evolve sub-pages |
| `src/components/shell/EvolutionCenter.tsx` | Route to ContextLab from shell |

