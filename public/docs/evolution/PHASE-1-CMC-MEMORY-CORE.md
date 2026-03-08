# Phase 1: Context Memory Core (CMC) — Evolution Plan

**Priority**: 🔴 CRITICAL — Foundation for all other systems  
**Status**: 🔨 In Progress  
**Dependencies**: Supabase tables (`aimos_memory_atoms`, `aimos_evidence_graph`)  
**Target**: Persistent, hierarchical, queryable memory with temporal decay

---

## 1. Current State

- `aimos_memory_atoms` table exists with basic fields (content, tags, confidence, timestamps)
- 11 memory atoms seeded from core docs (κ=0.99)
- Basic RAG retrieval via `ragService.ts` (BM25 keyword + tag similarity)
- `hq-chat` injects live atom count into system prompt
- No hierarchical levels, no compression, no temporal decay

## 2. Target Architecture

```
┌─────────────────────────────────────────────────┐
│                  CMC ENGINE                      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ L1: HOT  │→ │ L2: WARM │→ │ L3: COLD/ARCH │  │
│  │ Working  │  │ Session  │  │ Deep Storage   │  │
│  │ Context  │  │ Memory   │  │ + Compression  │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│       ↕              ↕              ↕            │
│  ┌──────────────────────────────────────────┐    │
│  │         Semantic Dumbbell Compressor      │    │
│  │  Preserves head/tail · Compresses middle  │    │
│  └──────────────────────────────────────────┘    │
│       ↕              ↕              ↕            │
│  ┌──────────────────────────────────────────┐    │
│  │         Retrieval Router (RAG+Graph)      │    │
│  │  BM25 · Tag Match · Graph Traverse · LRU  │    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## 3. Implementation Steps

### 3.1 Memory Level Classification
Add `memory_level` enum to `aimos_memory_atoms`:
- `hot` — Current conversation context, last 5 interactions. In-memory + DB.
- `warm` — Session-scoped. Last 24h of interactions. DB with fast retrieval.
- `cold` — Archived. Compressed via Semantic Dumbbell. DB with lazy load.
- `frozen` — Rarely accessed. Max compression. Retrievable but slow.

### 3.2 Temporal Decay Engine
Create `cmc-decay` edge function (cron or on-demand):
```
Every 6 hours:
  1. Score all atoms: relevance = base_score × decay_factor^(hours_since_access / half_life)
  2. Promote/demote between levels based on access_count + recency
  3. Compress atoms dropping from warm → cold (Semantic Dumbbell)
  4. Archive atoms dropping from cold → frozen
  5. Log transitions to `self_audit_log`
```

### 3.3 Semantic Dumbbell Compression
Edge function `cmc-compress`:
```
Input: Full content string (N tokens)
Output: Compressed content (target: N × 0.3)
Algorithm:
  1. Split into sentences
  2. Score each sentence by information density (entity count + keyword density)
  3. Preserve top 30% from first third (HEAD)
  4. Preserve top 30% from last third (TAIL)
  5. From middle third, keep only sentences with density > 0.7
  6. Stitch with "[…compressed…]" markers
  7. Store original hash for integrity verification
```

### 3.4 Hierarchical Summarization
When atoms accumulate in a topic cluster (>10 atoms same tag):
1. Generate **micro-summary** (1 sentence) via AI
2. Generate **macro-summary** (1 paragraph) via AI
3. Create parent atom linking children via `parent_id`
4. Update `aimos_evidence_graph` with SUMMARIZES relationships

### 3.5 Smart Retrieval Router
Upgrade `ragService.ts`:
```typescript
async function retrieve(query: string, options: RetrievalOptions) {
  // 1. Always search HOT first (in-memory cache)
  // 2. Parallel: BM25 keyword search + Tag match on WARM
  // 3. If confidence < 0.7, extend to COLD with graph traversal
  // 4. Never search FROZEN unless explicitly requested
  // 5. Merge results, deduplicate, rank by composite score
  // 6. Increment access_count on all retrieved atoms
}
```

### 3.6 Context Window Builder
For every AI call, build context window:
```
[SYSTEM PROMPT]
[LIVE STATE: atom_count, chain_count, plan_count]
[RETRIEVED CONTEXT: top-K atoms from retrieval router]
[CONVERSATION HISTORY: last N messages]
[USER QUERY]
```
Target: Stay under 8000 tokens for context block. Prioritize by relevance score.

## 4. Database Changes Required

```sql
-- Add memory level and decay tracking
ALTER TABLE aimos_memory_atoms 
  ADD COLUMN memory_level TEXT DEFAULT 'warm' CHECK (memory_level IN ('hot','warm','cold','frozen')),
  ADD COLUMN access_count INTEGER DEFAULT 0,
  ADD COLUMN last_accessed_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN compressed_from TEXT, -- original atom ID if this is a compression
  ADD COLUMN compression_ratio FLOAT;

-- Index for fast level-based queries
CREATE INDEX idx_atoms_memory_level ON aimos_memory_atoms(memory_level);
CREATE INDEX idx_atoms_last_accessed ON aimos_memory_atoms(last_accessed_at);
```

## 5. Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `cmc-decay` | Cron (6h) or manual | Promote/demote atoms between levels |
| `cmc-compress` | On demotion to cold | Semantic Dumbbell compression |
| `cmc-retrieve` | Per AI query | Smart multi-level retrieval |
| `cmc-ingest` | On new content | Classify, tag, score, store |

## 6. Success Metrics

- **Retrieval accuracy**: >0.90 (relevant atom in top-5 results)
- **Context efficiency**: <8000 tokens per AI call context block
- **Compression ratio**: 0.3 for cold, 0.1 for frozen
- **Decay latency**: <2s for level transitions
- **Zero data loss**: Original content always recoverable via hash

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Over-compression loses critical info | Always keep original hash; frozen atoms are never deleted |
| Decay promotes wrong atoms | Access-count-weighted scoring; manual pin capability |
| Retrieval too slow on cold storage | Pre-computed summaries serve as proxy; lazy-load full content |
| Token budget exceeded | Hard cap with truncation; prioritize by relevance score |

---

*This phase is the bedrock. Every other system (HHNI, VIF, APOE, SEG) reads from and writes to CMC.*
