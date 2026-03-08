# Phase 5: Symbolic Evidence Graph (SEG) — Evolution Plan

**Priority**: 🟡 MEDIUM — Connects knowledge into a queryable graph  
**Status**: 📋 Planned  
**Dependencies**: Phase 1 (CMC), Phase 2 (HHNI), `aimos_evidence_graph` table  
**Target**: Entity-relationship knowledge graph with evidence chains and graph traversal

---

## 1. Current State

- `aimos_evidence_graph` table exists (source_atom_id, target_atom_id, relationship_type, strength, validated)
- No entity extraction from AI responses
- No graph traversal queries
- No visualization of knowledge connections
- Evidence graph is empty

## 2. Target Architecture

```
┌────────────────────────────────────────────────┐
│                 SEG ENGINE                      │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │          Entity Extractor                 │  │
│  │  AI response → named entities + relations │  │
│  └──────────────────────────────────────────┘  │
│       ↓                                        │
│  ┌──────────────────────────────────────────┐  │
│  │          Knowledge Graph                  │  │
│  │  Nodes: Entities (concepts, systems,      │  │
│  │         protocols, components)             │  │
│  │  Edges: DEPENDS_ON, PART_OF, CONTRADICTS, │  │
│  │         SUPPORTS, EVOLVED_FROM, USES      │  │
│  └──────────────────────────────────────────┘  │
│       ↓                                        │
│  ┌──────────────────────────────────────────┐  │
│  │          Graph Query Engine               │  │
│  │  Shortest path · Neighborhood · Clusters  │  │
│  │  Evidence chains · Impact analysis        │  │
│  └──────────────────────────────────────────┘  │
│       ↓                                        │
│  ┌──────────────────────────────────────────┐  │
│  │          Evidence Chain Builder            │  │
│  │  Claim → supporting atoms → linked graph  │  │
│  │  nodes → confidence propagation           │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

## 3. Implementation Steps

### 3.1 Entity Extraction
On every new memory atom or AI response:
```
Edge function `seg-extract`:
  1. Send content to AI with extraction prompt
  2. Extract: entities (name, type, description)
  3. Extract: relationships (entity_a, relationship, entity_b)
  4. Deduplicate against existing entities (fuzzy match)
  5. Store new entities + relationships
  6. Link back to source atom via evidence_graph
```

Entity types:
- `system` — CMC, HHNI, VIF, APOE, SEG
- `protocol` — 13 Protocol Laws, Cognitive Loop
- `concept` — compression, decay, confidence
- `component` — edge functions, UI panels, tables
- `metric` — κ score, retrieval accuracy
- `document` — spec files, plans

### 3.2 Relationship Types
```
DEPENDS_ON    — A requires B to function
PART_OF       — A is a component of B
SUPPORTS      — A provides evidence for B
CONTRADICTS   — A conflicts with B
EVOLVED_FROM  — A is an evolution of B
USES          — A consumes/calls B
SIMILAR_TO    — A and B cover related concepts
SPECIALIZES   — A is a more specific version of B
```

### 3.3 Graph Traversal Queries
```typescript
interface SEGQueryEngine {
  // Basic traversal
  getNeighbors(entityId: string, depth?: number): Entity[];
  getRelationships(entityId: string, type?: RelationType): Relationship[];
  
  // Path finding
  shortestPath(fromId: string, toId: string): Path;
  allPaths(fromId: string, toId: string, maxDepth?: number): Path[];
  
  // Analysis
  impactAnalysis(entityId: string): ImpactReport; // What breaks if this changes?
  evidenceChain(claimId: string): EvidenceChain; // Trace support for a claim
  contradictionScan(entityId: string): Contradiction[]; // Find conflicts
  
  // Clustering
  getClusters(): Cluster[]; // Community detection
  getOrphans(): Entity[]; // Unconnected entities
}
```

### 3.4 Evidence Chain Builder
For VIF integration:
```
Given a claim from an AI response:
  1. Extract key entities from claim
  2. Find all atoms mentioning those entities
  3. Traverse SEG relationships to find supporting evidence
  4. Build chain: Claim → Supporting Atoms → Related Entities → Source Docs
  5. Score chain strength: min(edge_strengths) × atom_count_weight
  6. Return structured evidence chain for VIF scoring
```

### 3.5 Confidence Propagation
When an atom's confidence changes:
```
  1. Find all SEG edges from/to that atom
  2. For SUPPORTS edges: propagate confidence increase/decrease (dampened by 0.5)
  3. For CONTRADICTS edges: inverse propagation
  4. Cap propagation at depth 3 to prevent runaway
  5. Log propagation in Agent Discord
```

### 3.6 UI: Knowledge Graph Visualization
Using `@xyflow/react` (already installed):
- Nodes as entities, colored by type
- Edges as relationships, thickness = strength
- Interactive: click node → show details + connected atoms
- Filter by entity type, relationship type, confidence threshold
- Search entities by name
- Highlight evidence chains when VIF is active

## 4. Database Changes

```sql
-- Entity registry
CREATE TABLE IF NOT EXISTS aimos_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- system, protocol, concept, component, metric, document
  description TEXT,
  aliases TEXT[], -- alternative names for deduplication
  source_atom_ids UUID[], -- atoms that mention this entity
  confidence FLOAT DEFAULT 0.5,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, entity_type)
);

-- Entity relationships (supplements aimos_evidence_graph)
CREATE TABLE IF NOT EXISTS aimos_entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID REFERENCES aimos_entities(id) ON DELETE CASCADE,
  target_entity_id UUID REFERENCES aimos_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength FLOAT DEFAULT 0.5,
  evidence_atom_ids UUID[], -- atoms supporting this relationship
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_entity_relationships_source ON aimos_entity_relationships(source_entity_id);
CREATE INDEX idx_entity_relationships_target ON aimos_entity_relationships(target_entity_id);
```

## 5. Success Metrics

- **Entity coverage**: >80% of core concepts from spec docs represented as entities
- **Relationship density**: Average 3+ relationships per entity
- **Evidence chain length**: Average 2-4 hops from claim to source
- **Zero orphans**: All entities connected to at least one other
- **Traversal speed**: <1s for depth-3 neighborhood query

---

*SEG transforms isolated facts into interconnected knowledge.*
