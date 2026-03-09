// SEG (Symbolic Evidence Graph) Query Engine
// Phase 5: Client-side graph traversal and knowledge queries

import { supabase } from '@/integrations/supabase/client';

export interface SEGEntity {
  id: string;
  name: string;
  entity_type: string;
  description: string | null;
  aliases: string[] | null;
  confidence: number | null;
  source_atom_ids: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface SEGRelationship {
  id: string;
  source_entity_id: string | null;
  target_entity_id: string | null;
  relationship_type: string;
  strength: number | null;
  evidence_atom_ids: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  confidence: number;
  description: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── Fetch all entities ───
export async function fetchEntities(): Promise<SEGEntity[]> {
  const { data, error } = await supabase
    .from('aimos_entities')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('[SEG] fetchEntities error:', error); return []; }
  return (data ?? []) as SEGEntity[];
}

// ─── Fetch all relationships ───
export async function fetchRelationships(): Promise<SEGRelationship[]> {
  const { data, error } = await supabase
    .from('aimos_entity_relationships')
    .select('*');
  if (error) { console.error('[SEG] fetchRelationships error:', error); return []; }
  return (data ?? []) as SEGRelationship[];
}

// ─── Build full graph ───
export async function buildGraph(): Promise<GraphData> {
  const [entities, relationships] = await Promise.all([
    fetchEntities(),
    fetchRelationships(),
  ]);

  const nodes: GraphNode[] = entities.map(e => ({
    id: e.id,
    label: e.name,
    type: e.entity_type,
    confidence: e.confidence ?? 0.5,
    description: e.description ?? '',
  }));

  const entityIds = new Set(entities.map(e => e.id));
  const edges: GraphEdge[] = relationships
    .filter(r => r.source_entity_id && r.target_entity_id &&
                 entityIds.has(r.source_entity_id) && entityIds.has(r.target_entity_id))
    .map(r => ({
      id: r.id,
      source: r.source_entity_id!,
      target: r.target_entity_id!,
      type: r.relationship_type,
      strength: r.strength ?? 0.5,
    }));

  return { nodes, edges };
}

// ─── Neighborhood query ───
export async function getNeighborhood(entityId: string, depth: number = 1): Promise<GraphData> {
  const full = await buildGraph();
  const visited = new Set<string>();
  const frontier = [entityId];

  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const nodeId of frontier) {
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      for (const edge of full.edges) {
        if (edge.source === nodeId && !visited.has(edge.target)) next.push(edge.target);
        if (edge.target === nodeId && !visited.has(edge.source)) next.push(edge.source);
      }
    }
    frontier.length = 0;
    frontier.push(...next);
  }
  // Include final frontier
  frontier.forEach(id => visited.add(id));

  return {
    nodes: full.nodes.filter(n => visited.has(n.id)),
    edges: full.edges.filter(e => visited.has(e.source) && visited.has(e.target)),
  };
}

// ─── Seed core entities from spec ───
export async function seedCoreEntities(): Promise<number> {
  const coreEntities = [
    { name: 'CMC', entity_type: 'system', description: 'Contextual Memory Core — 4-tier persistent memory (hot/warm/cold/frozen)' },
    { name: 'HHNI', entity_type: 'system', description: 'Hierarchical Navigation Interface — multi-level tag taxonomy' },
    { name: 'VIF', entity_type: 'system', description: 'Verification Integrity Framework — confidence gating and fact-checking' },
    { name: 'APOE', entity_type: 'system', description: 'Attention Priority Orchestration Engine — goal decomposition T0-T6' },
    { name: 'SEG', entity_type: 'system', description: 'Symbolic Evidence Graph — entity-relationship knowledge graph' },
    { name: 'ContextSync', entity_type: 'system', description: 'Bitemporal Contract Indexing and Token-Weighted Retrieval for AI-Assisted Software Engineering' },
    { name: 'BCI', entity_type: 'component', description: 'Bitemporal Contract Index — core data structure of ContextSync' },
    { name: 'Runtime Spine', entity_type: 'component', description: '7-stage cognitive pipeline: Intake → Interpret → Deliberate → Assemble → Route → Synthesize → Persist' },
    { name: 'Agent Discord', entity_type: 'protocol', description: 'Typed, threaded, time-aligned logging of all agent activities' },
    { name: 'Cognitive Loop', entity_type: 'protocol', description: 'Context-Reflect-Execute-Audit-Deliver processing cycle from deepthinkOS' },
    { name: 'Mind Palace', entity_type: 'concept', description: '5-folder cognitive workspace structure from deepthinkOS' },
    { name: 'Self-Evolution', entity_type: 'system', description: 'Observe-Diagnose-Propose-Approve-Apply-Monitor improvement cycle' },
    { name: 'Kappa Score', entity_type: 'metric', description: 'κ confidence metric measuring reasoning quality and coherence' },
    { name: 'Token-Weighted Retrieval', entity_type: 'concept', description: 'Solver that selects optimal atoms within a token budget' },
    { name: 'Synchronization Gate', entity_type: 'concept', description: 'Contract drift detection that blocks unsafe edits' },
  ];

  const coreRelationships = [
    { source: 'CMC', target: 'HHNI', type: 'DEPENDS_ON' },
    { source: 'VIF', target: 'CMC', type: 'USES' },
    { source: 'APOE', target: 'CMC', type: 'USES' },
    { source: 'SEG', target: 'CMC', type: 'DEPENDS_ON' },
    { source: 'SEG', target: 'VIF', type: 'USES' },
    { source: 'ContextSync', target: 'BCI', type: 'PART_OF' },
    { source: 'BCI', target: 'Token-Weighted Retrieval', type: 'USES' },
    { source: 'BCI', target: 'Synchronization Gate', type: 'USES' },
    { source: 'Runtime Spine', target: 'CMC', type: 'USES' },
    { source: 'Runtime Spine', target: 'VIF', type: 'USES' },
    { source: 'Self-Evolution', target: 'VIF', type: 'DEPENDS_ON' },
    { source: 'Self-Evolution', target: 'SEG', type: 'USES' },
    { source: 'Kappa Score', target: 'VIF', type: 'PART_OF' },
    { source: 'Agent Discord', target: 'APOE', type: 'PART_OF' },
    { source: 'Cognitive Loop', target: 'Runtime Spine', type: 'SIMILAR_TO' },
    { source: 'Mind Palace', target: 'CMC', type: 'SIMILAR_TO' },
  ];

  // Upsert entities
  let seeded = 0;
  const entityIdMap: Record<string, string> = {};

  for (const ent of coreEntities) {
    const { data: existing } = await supabase
      .from('aimos_entities')
      .select('id')
      .eq('name', ent.name)
      .eq('entity_type', ent.entity_type)
      .limit(1);

    if (existing && existing.length > 0) {
      entityIdMap[ent.name] = existing[0].id;
      continue;
    }

    const { data, error } = await supabase
      .from('aimos_entities')
      .insert({ ...ent, confidence: 0.95 })
      .select('id')
      .single();

    if (!error && data) {
      entityIdMap[ent.name] = data.id;
      seeded++;
    }
  }

  // Insert relationships
  for (const rel of coreRelationships) {
    const sourceId = entityIdMap[rel.source];
    const targetId = entityIdMap[rel.target];
    if (!sourceId || !targetId) continue;

    const { data: existing } = await supabase
      .from('aimos_entity_relationships')
      .select('id')
      .eq('source_entity_id', sourceId)
      .eq('target_entity_id', targetId)
      .eq('relationship_type', rel.type)
      .limit(1);

    if (existing && existing.length > 0) continue;

    await supabase
      .from('aimos_entity_relationships')
      .insert({
        source_entity_id: sourceId,
        target_entity_id: targetId,
        relationship_type: rel.type,
        strength: 0.9,
      });
  }

  console.log(`[SEG] Seeded ${seeded} new core entities`);
  return seeded;
}
