# Phase 2: Hierarchical Navigation Index (HHNI) — Evolution Plan

**Priority**: 🟠 HIGH — Enables intelligent traversal of knowledge  
**Status**: 📋 Planned  
**Dependencies**: Phase 1 (CMC), `aimos_tag_hierarchy` table  
**Target**: Multi-level tag taxonomy with graph-based navigation and predictive prefetching

---

## 1. Current State

- `aimos_tag_hierarchy` table exists (tag_name, parent_tag, level, metadata)
- Tags stored as flat arrays on `aimos_memory_atoms`
- No hierarchical relationships between tags
- No navigation UI or graph traversal
- No predictive prefetching

## 2. Target Architecture

```
┌─────────────────────────────────────────────┐
│              HHNI ENGINE                     │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │        Tag Taxonomy Tree             │     │
│  │  L0: Domains    (ai, security, ops) │     │
│  │  L1: Categories (memory, reasoning) │     │
│  │  L2: Topics     (cmc, vif, decay)   │     │
│  │  L3: Specifics  (compression, bm25) │     │
│  └─────────────────────────────────────┘     │
│       ↕                                      │
│  ┌─────────────────────────────────────┐     │
│  │     Cross-Reference Graph            │     │
│  │  Tag A ←→ Tag B (co-occurrence)     │     │
│  │  Tag A → Tag C (specialization)     │     │
│  │  Tag A ⇄ Tag D (synonym)           │     │
│  └─────────────────────────────────────┘     │
│       ↕                                      │
│  ┌─────────────────────────────────────┐     │
│  │     Predictive Prefetch Engine       │     │
│  │  Given current context tags →        │     │
│  │  predict next-likely-needed atoms    │     │
│  └─────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

## 3. Implementation Steps

### 3.1 Seed Tag Taxonomy
From the three core docs, extract canonical tag hierarchy:
```
ai-mos (L0: Domain)
├── memory (L1)
│   ├── cmc (L2)
│   │   ├── compression (L3)
│   │   ├── decay (L3)
│   │   └── retrieval (L3)
│   ├── persistence (L2)
│   └── versioning (L2)
├── reasoning (L1)
│   ├── vif (L2)
│   ├── apoe (L2)
│   │   ├── t0-intent (L3)
│   │   ├── t1-brief (L3)
│   │   └── t2-t6-execution (L3)
│   └── chains (L2)
├── navigation (L1)
│   ├── hhni (L2)
│   ├── tagging (L2)
│   └── search (L2)
├── knowledge (L1)
│   ├── seg (L2)
│   ├── entities (L2)
│   └── evidence (L2)
└── evolution (L1)
    ├── self-audit (L2)
    ├── proposals (L2)
    └── rollback (L2)
```

### 3.2 Auto-Tagging Engine
Edge function `hhni-autotag`:
```
Input: New memory atom content
Process:
  1. Extract keywords via AI (5-10 per atom)
  2. Match against existing taxonomy (fuzzy, threshold 0.8)
  3. If no match → propose new tag + suggest parent placement
  4. Apply Trinity Tagging System (TTS):
     - Scientific mode: technical/factual tags
     - Visionary mode: conceptual/strategic tags  
     - Sacred mode: foundational/invariant tags
  5. Store tag assignments on atom + update `aimos_tag_hierarchy` counts
```

### 3.3 Co-occurrence Graph
Track which tags appear together:
```sql
CREATE TABLE aimos_tag_cooccurrence (
  tag_a TEXT NOT NULL,
  tag_b TEXT NOT NULL,
  cooccurrence_count INTEGER DEFAULT 1,
  strength FLOAT DEFAULT 0.5,
  PRIMARY KEY (tag_a, tag_b)
);
```
Update on every atom ingestion. Use for:
- "Related topics" suggestions
- Query expansion (user searches "cmc" → also retrieve "compression", "decay")
- Predictive prefetching

### 3.4 Navigation API
```typescript
interface HHNINavigator {
  // Traverse up/down the taxonomy
  getChildren(tag: string): Tag[];
  getParent(tag: string): Tag | null;
  getAncestors(tag: string): Tag[];
  
  // Cross-reference
  getRelated(tag: string, limit?: number): Tag[];
  getSynonyms(tag: string): Tag[];
  
  // Search
  findTags(query: string): Tag[];
  getAtomsForTag(tag: string, level?: MemoryLevel): Atom[];
  
  // Predictive
  predictNextTags(currentTags: string[]): Tag[];
  prefetchContext(currentTags: string[]): Atom[];
}
```

### 3.5 Predictive Prefetch
When the AI is processing a query:
1. Extract active tags from query + conversation context
2. Look up co-occurrence graph for likely-next tags
3. Pre-fetch top-5 atoms from those tags into HOT cache
4. If retrieved atoms are used → reinforce co-occurrence weights
5. If not used → decay co-occurrence weights slightly

### 3.6 UI: Tag Explorer Panel
Add to the shell/matrix UI:
- Tree view of tag hierarchy (collapsible)
- Tag cloud visualization (size = atom count)
- Click tag → show all atoms with that tag
- Drag-and-drop tag reorganization
- Auto-tag suggestions highlighted in gold

## 4. Database Changes

```sql
-- Seed initial hierarchy
INSERT INTO aimos_tag_hierarchy (tag_name, parent_tag, level, description) VALUES
('ai-mos', NULL, 0, 'Root domain for AI Memory Operating System'),
('memory', 'ai-mos', 1, 'Memory subsystems'),
('cmc', 'memory', 2, 'Context Memory Core'),
('compression', 'cmc', 3, 'Semantic compression algorithms'),
('decay', 'cmc', 3, 'Temporal decay and level transitions'),
-- ... full taxonomy from 3.1
;

-- Co-occurrence tracking
CREATE TABLE IF NOT EXISTS aimos_tag_cooccurrence (
  tag_a TEXT NOT NULL,
  tag_b TEXT NOT NULL,
  cooccurrence_count INTEGER DEFAULT 1,
  strength FLOAT DEFAULT 0.5,
  last_updated TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (tag_a, tag_b)
);
```

## 5. Success Metrics

- **Tag coverage**: >95% of atoms have ≥2 tags
- **Taxonomy depth**: Average path length 2.5 levels
- **Prefetch hit rate**: >40% of prefetched atoms used in next query
- **Navigation latency**: <500ms for any traversal operation
- **Auto-tag accuracy**: >85% agreement with manual tagging

## 6. Integration Points

- **CMC**: HHNI tags drive retrieval routing; tag co-occurrence expands search
- **VIF**: Tag consistency validated during confidence scoring
- **APOE**: Task decomposition uses tag hierarchy for scope mapping
- **SEG**: Entity nodes linked to tags for knowledge graph navigation

---

*HHNI transforms flat memory storage into a navigable knowledge landscape.*
