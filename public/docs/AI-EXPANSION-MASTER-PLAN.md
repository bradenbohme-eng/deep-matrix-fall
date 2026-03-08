# AI Capabilities Expansion — Master Plan

## Overview
Massive four-phase expansion bringing real LLM intelligence + rich cognitive visualization to the Matrix HQ platform. Uses **Both** mode: real Lovable AI Gateway for chat responses + simulated agent swarm visualization running alongside.

---

## Phase 1: Live AI Chat (Real Backend)
**Status**: 🔨 Building  
**Edge Function**: `hq-chat`  
**Model**: `google/gemini-3-flash-preview` (default)

### Architecture
```
[Right Panel Chat] → SSE stream → [hq-chat edge function] → [Lovable AI Gateway]
                                          ↕
                                   [AIMOS System Prompt]
                                   [Conversation History]
```

### Components
1. **`supabase/functions/hq-chat/index.ts`** — Streaming edge function
   - System prompt embeds HQ orchestration context (task queue, agent states, budget)
   - Streams via SSE using `text/event-stream`
   - Handles 429/402 rate limit errors gracefully
   - Uses `LOVABLE_API_KEY` (auto-provisioned)

2. **`src/lib/hqChatService.ts`** — Frontend streaming client
   - Token-by-token SSE parsing
   - AbortController for cancellation
   - Error state management (rate limits, network failures)

3. **`RightPanel.tsx` AIChatPanel** — Updated UI
   - Real streaming with progressive token rendering
   - Markdown rendering via `react-markdown`
   - Error toasts for rate limits
   - Conversation history sent with each request

### Data Flow
- User types message → append to local state → POST to edge function with full history
- Edge function prepends system prompt → forwards to Lovable AI Gateway with `stream: true`
- SSE chunks flow back → `onDelta` callback updates last assistant message progressively
- On `[DONE]` → mark streaming complete

---

## Phase 2: Agent Swarm Visualization Engine
**Status**: 📋 Planned

### Architecture
```
[Real AI Response] → [AgentSimulator] → [SwarmPanel]
                          ↕
                    [Simulated Agents]
                    - Planner (T0-T6 goals)
                    - Researcher (evidence)
                    - Verifier (confidence)
                    - Auditor (quality gates)
```

### Components
1. **`src/lib/agentSimulator.ts`** — Core simulation engine
   - Takes real AI query + response as input
   - Generates plausible agent activity traces
   - Simulates multi-agent coordination with timing
   - Produces reasoning chains with confidence scores

2. **`src/components/shell/SwarmPanel.tsx`** — Visualization
   - **SWARM tab**: Active agents, thread participation, workload bars
   - **REASON tab**: T0-T6 goal hierarchy tree with decomposition
   - **THINK tab**: Multi-phase reasoning (ANALYSIS → SYNTHESIS → AUDIT)
   - **SEARCH tab**: Memory system queries (CMC/SEG/HHNI)

3. **Split-view toggle** — 50/50 alongside chat
   - AnimatePresence for smooth panel transitions
   - Synchronized with real AI response timing

### Simulation Rules
- Agent activities trigger 200-800ms after real AI starts streaming
- Reasoning phases align with response complexity
- Confidence scores derived from response length + query complexity
- All activities logged to `aimos_reasoning_chains` table

---

## Phase 3: Document RAG Pipeline
**Status**: ✅ Complete

### Architecture
```
[Upload] → [document-processor] → [Chunks] → [Embeddings]
                                        ↓
[AI Query] → [hq-chat] → [RAG Context Injection] → [Lovable AI Gateway]
                              ↑
                        [Semantic Search]
                        [aimos_memory_atoms]
```

### Components
1. **Enhanced `document-processor` edge function**
   - Accept .docx, .pdf, .txt, .md uploads
   - Code-aware chunking for source files
   - Generate embeddings via Lovable AI
   - Store in `aimos_memory_atoms` with tags

2. **`src/lib/ragService.ts`** — Retrieval client
   - Semantic search via `find_similar_memories` DB function
   - BM25 keyword fallback
   - Context window management (max 8000 tokens)
   - Source attribution tracking

3. **Memory Panel integration**
   - Show indexed document count
   - Display retrieval hits during AI queries
   - Visualize embedding space clusters

### Storage
- Raw files → `document-assets` bucket
- Chunks → `aimos_memory_atoms` table
- Embeddings → `embedding` column (vector type)
- Relationships → `aimos_evidence_graph` table

---

## Phase 4: Code Analysis & Generation
**Status**: 📋 Planned

### Architecture
```
[IDE Panel] → [code-assistant] → [Lovable AI Gateway]
                    ↕
              [File Context]
              [SAM Index]
              [RAG Retrieved Code]
```

### Components
1. **Enhanced `code-assistant` edge function**
   - Code review with issue detection
   - Refactoring suggestions with diffs
   - Scaffolding generation (components, hooks, services)
   - Test generation

2. **`src/components/ide/AIAssistantPanel.tsx`** — Enhanced
   - Inline code suggestions with syntax highlighting
   - Accept/reject diff interface
   - Multi-file awareness via SAM index
   - Context from RAG pipeline

3. **IDE Integration**
   - Right-click "Ask AI" on selected code
   - Auto-detect code smells and suggest fixes
   - Generate unit tests for selected functions

---

## Cross-Cutting Concerns

### Error Handling
- All edge functions handle 429 (rate limit) and 402 (payment required)
- Frontend shows toast notifications for all error states
- Automatic retry with exponential backoff for transient failures

### Context Management
- System prompts include current orchestration state
- Conversation history limited to last 20 messages (token budget)
- RAG context injected as `[CONTEXT]` block in system prompt

### Performance
- SSE streaming for all AI responses (no buffering)
- Lazy-load agent simulation only when SwarmPanel is visible
- Debounced RAG queries (300ms)
- AbortController on all fetch calls for cleanup

### Security
- All AI calls routed through edge functions (never client-direct)
- `LOVABLE_API_KEY` used server-side only
- No user secrets exposed to frontend
