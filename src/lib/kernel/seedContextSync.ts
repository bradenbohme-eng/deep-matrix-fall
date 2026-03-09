// Seed ContextSync specification as a high-confidence memory atom
import { supabase } from '@/integrations/supabase/client';

const CONTEXTSYNC_ATOM = {
  content: `ContextSync: Bitemporal Contract Indexing and Token-Weighted Retrieval for AI-Assisted Software Engineering. A formal architecture for hierarchical code navigation, contract drift detection, synchronization gating, and self-remediating orchestration in large software systems. Core component: Bitemporal Contract Index (BCI). Six mechanisms: (1) Watcher/analyzer pipeline converting artifacts into indexed atoms; (2) Hierarchical navigation across abstraction levels; (3) Token-weighted retrieval solver for bounded execution contexts; (4) Synchronization gate detecting contract drift and blocking unsafe edits; (5) Orchestration engine compiling intent into executable plans; (6) Evidence graph storing success/contradiction/correction traces. Full specification available at public/docs/ContextSync.txt (4607 lines).`,
  content_type: 'specification',
  memory_level: 'hot',
  memory_class: 'semantic',
  confidence_score: 0.99,
  quality_score: 0.99,
  tags: ['contextsync', 'bci', 'bitemporal', 'contract-index', 'token-weighted-retrieval', 'synchronization', 'orchestration', 'evidence-graph', 'kernel-rom', 'specification'],
  metadata: {
    source_file: 'public/docs/ContextSync.txt',
    total_lines: 4607,
    document_type: 'formal_architecture_spec',
    kernel_rom: true,
  },
  source_refs: ['public/docs/ContextSync.txt'],
  verification_status: 'verified',
};

export async function seedContextSyncAtom(): Promise<boolean> {
  // Check if already indexed
  const { data: existing } = await supabase
    .from('aimos_memory_atoms')
    .select('id')
    .contains('source_refs', ['public/docs/ContextSync.txt'])
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('[Kernel] ContextSync atom already indexed:', existing[0].id);
    return true;
  }

  const { data, error } = await supabase
    .from('aimos_memory_atoms')
    .insert(CONTEXTSYNC_ATOM)
    .select('id')
    .single();

  if (error) {
    console.error('[Kernel] Failed to seed ContextSync atom:', error);
    return false;
  }

  console.log('[Kernel] ContextSync atom indexed:', data.id);
  return true;
}
