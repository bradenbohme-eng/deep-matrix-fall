

# Perfect Context System Integration with AI Chat

## Current State Analysis

**Context Pipeline Components (Working):**
1. **BCI Context-Sync** — Full utility-scored boundary views, token budgeting, resolve_context action
2. **CMC Engine** — 4-tier memory (hot/warm/cold/frozen), retrieve/ingest/decay
3. **HQ-Chat** — Already integrates both BCI + CMC in its cognitive loop (lines 37-73)
4. **Context Lab** — Testing UI with health checks + seeding capability

**Data Population:**
- `bci_entities`: 3 rows
- `aimos_memory_atoms`: 27 rows
- `chunks`: 0 rows
- `aimos_reasoning_chains`: 9 rows

**Integration Already Present:**
- HQ-Chat calls `context-sync` with `resolve_context` (line 45-61)
- HQ-Chat retrieves CMC atoms via `retrieveFromCMC()` (line 40)
- System prompt includes BCI manifest if available (line 73)
- Post-processing stores high-κ responses back to memory (lines 513-525)

## Gaps to Close

| Gap | Impact | Fix |
|-----|--------|-----|
| BCI context retrieval errors silently suppressed | User doesn't know context enrichment failed | Add telemetry feedback to UI |
| CMC retrieval may return empty if no keywords match | Chat loses memory context | Improve fallback + surface to user |
| Context Lab seeding doesn't populate enough data | Testing yields 0-results | Expand seed entities significantly |
| No visibility into which context sources enriched the response | User can't verify provenance | Add context attribution to chat UI |
| Memory atoms low confidence scoring | Atoms rarely used in retrieval | Boost base confidence for new atoms |

## Implementation Plan

### 1. Enhance HQ-Chat Context Transparency

Add metadata to SSE stream (non-breaking) showing which context sources were used:
- Inject `[CONTEXT SOURCES: BCI (N entities) + CMC (M atoms)]` into system prompt header
- Store context source stats in reasoning chain metadata

### 2. Improve CMC Retrieval Robustness

In `cmc-engine/index.ts` handleRetrieve:
- When keyword search fails, try tag expansion first
- Add semantic overlap scoring (not just exact ILIKE)
- Lower minimum keyword length from 3 to 2

### 3. Expand Context Lab Seeding

Add more SEED_ENTITIES covering all system components:
- Core libs: `kernel.ts`, `contextManager.ts`, `taskQueue.ts`, `verifier.ts`
- UI components: `AppShell.tsx`, `RightPanel.tsx`, `SwarmPanel.tsx`
- Hooks: `useShellStore.ts`, `useHQStore.ts`
- Edge functions: `hq-chat`, `cmc-engine`, `context-sync`

### 4. Add Context Attribution to Chat UI

In `RightPanel.tsx` AIChatPanel:
- Show small badge below AI responses: "Enriched with N BCI entities, M memory atoms"
- Pull from reasoning chain metadata

### 5. Boost New Memory Atom Confidence

In `hq-chat` line 514-525 when storing responses:
- Set initial confidence to 0.7 instead of VIF score for better retrieval visibility
- Set initial `access_count: 1` so atoms aren't immediately decayed

## Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/hq-chat/index.ts` | Add context source metadata to reasoning chain, boost new atom confidence |
| `supabase/functions/cmc-engine/index.ts` | Improve retrieval fallback, lower keyword threshold |
| `src/pages/ContextLab.tsx` | Expand SEED_ENTITIES list |
| `src/components/shell/RightPanel.tsx` | Display context attribution badge on AI responses |
| `src/lib/hqChatService.ts` | (Optional) Parse context metadata from stream if exposed |

