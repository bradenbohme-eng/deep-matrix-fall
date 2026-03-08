# Evolution Master Overview — All Phases

**System**: AIMOS (AI Memory Operating System)  
**Architecture**: Three-Layer (Chat → Cognitive → Memory)  
**Governance**: Human-in-the-loop approval for all system mutations  
**Date**: March 2026

---

## Phase Map

```
Phase 0: THIS DOCUMENT (overview + dependencies)
Phase 1: CMC  — Context Memory Core        🔴 CRITICAL  → Foundation
Phase 2: HHNI — Hierarchical Navigation     🟠 HIGH      → Discovery
Phase 3: VIF  — Verifiable Intelligence     🟠 HIGH      → Trust
Phase 4: APOE — Orchestration Engine        🟡 MEDIUM    → Autonomy
Phase 5: SEG  — Symbolic Evidence Graph     🟡 MEDIUM    → Knowledge
Phase 6: SELF — Self-Evolution              🟢 ONGOING   → Growth
```

## Dependency Graph

```
         ┌────────┐
         │ Phase 1│ CMC (Memory)
         │ 🔴     │
         └───┬────┘
             │
      ┌──────┼──────┐
      ↓      ↓      ↓
 ┌────────┐ ┌────────┐
 │Phase 2 │ │Phase 3 │
 │HHNI 🟠 │ │VIF  🟠 │
 └───┬────┘ └───┬────┘
     │      ┌───┘
     ↓      ↓
 ┌────────┐ ┌────────┐
 │Phase 4 │ │Phase 5 │
 │APOE 🟡 │ │SEG  🟡 │
 └───┬────┘ └───┬────┘
     └────┬─────┘
          ↓
     ┌────────┐
     │Phase 6 │
     │SELF 🟢 │ (requires all)
     └────────┘
```

## Execution Order

1. **Phase 1 (CMC)** — Build first. All systems read/write memory.
2. **Phase 2 (HHNI) + Phase 3 (VIF)** — Build in parallel. Independent of each other but both need CMC.
3. **Phase 4 (APOE) + Phase 5 (SEG)** — Build in parallel. APOE needs VIF for gates, SEG needs HHNI for tags.
4. **Phase 6 (Self-Evolution)** — Continuously enhanced as each phase completes.

## Cross-System Data Flow

```
User Query
  → CMC retrieval (context)
  → HHNI tag expansion (broader search)
  → VIF pre-gate (context quality check)
  → APOE decomposition (if complex query)
  → AI Generation (with full context)
  → VIF post-gate (response verification)
  → SEG entity extraction (knowledge capture)
  → CMC storage (new memory atom)
  → HHNI auto-tag (classify new knowledge)
  → Self-Evolution metrics (track quality)
```

## Key Tables

| Table | Phase | Purpose |
|-------|-------|---------|
| `aimos_memory_atoms` | 1 | Core memory storage |
| `aimos_tag_hierarchy` | 2 | Tag taxonomy |
| `aimos_tag_cooccurrence` | 2 | Tag relationships (new) |
| `aimos_confidence_metrics` | 3 | Entity confidence |
| `aimos_claim_verification` | 3 | Per-claim verification (new) |
| `aimos_plans` | 4 | Goal hierarchies |
| `aimos_task_queue` | 4 | Execution queue (new) |
| `aimos_agent_discord` | 4 | Agent activity log (new) |
| `aimos_entities` | 5 | Knowledge entities (new) |
| `aimos_entity_relationships` | 5 | Entity graph (new) |
| `aimos_evidence_graph` | 5 | Atom-to-atom links |
| `aimos_reasoning_chains` | 3,4 | Chain-of-thought log |
| `evolution_proposals` | 6 | System change proposals |
| `self_audit_log` | 6 | Health check history |
| `aimos_system_snapshots` | 6 | State snapshots (new) |
| `aimos_audit_schedule` | 6 | Scheduled audits (new) |

## Key Edge Functions

| Function | Phase | Purpose |
|----------|-------|---------|
| `hq-chat` | 1 | AI chat with CMC context |
| `cmc-decay` | 1 | Memory level transitions |
| `cmc-compress` | 1 | Semantic Dumbbell compression |
| `hhni-autotag` | 2 | Automatic tag assignment |
| `vif-verify` | 3 | Response verification |
| `vif-score` | 3 | Confidence scoring |
| `apoe-decompose` | 4 | Goal decomposition |
| `seg-extract` | 5 | Entity extraction |
| `self-evolution` | 6 | Audit + propose + apply |

## Guiding Principles

From the three core specifications:

1. **UNIFIED_TEXTBOOK**: CMC is persistent, hierarchical, queryable. HHNI enables navigation. VIF prevents hallucination. APOE orchestrates. SEG links knowledge.

2. **deepthinkOS**: Every operation follows the Cognitive Loop: Context → Reflect → Execute → Audit → Deliver. The 5-folder Mind Palace structures all knowledge.

3. **OmniBus**: The 13 Protocol Laws govern all evolution. The 9-layer kernel stack defines the processing pipeline. Human sovereignty is law #10 — the human always has final say.

---

## Document Index

- `PHASE-0-OVERVIEW.md` — This file
- `PHASE-1-CMC-MEMORY-CORE.md` — Memory foundation
- `PHASE-2-HHNI-NAVIGATION.md` — Tag navigation
- `PHASE-3-VIF-VERIFICATION.md` — Quality & trust
- `PHASE-4-APOE-ORCHESTRATION.md` — Planning & agents
- `PHASE-5-SEG-KNOWLEDGE-GRAPH.md` — Knowledge graph
- `PHASE-6-SELF-EVOLUTION.md` — Autonomous improvement
