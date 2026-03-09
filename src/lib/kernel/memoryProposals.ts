// Memory Proposals Service — Structured memory write proposal workflow
// Reference: AIOS Master Index §6.3, §45.7

import { supabase } from '@/integrations/supabase/client';
import { makeId } from '../contracts/ids';
import type { MemoryType, CanonicalityStatus, ProposalStatus } from '../contracts/enums';

export interface CreateProposalInput {
  proposedBy: string;
  targetMemoryType: MemoryType;
  candidateContent: string;
  rationale: string;
  confidence: number;
  importance?: number;
  proposedCanonicality?: CanonicalityStatus;
  tags?: string[];
  sessionId?: string;
  targetMemoryId?: string;
}

export interface ProposalRecord {
  id: string;
  created_at: string;
  proposed_by: string;
  target_memory_type: string;
  candidate_content: string;
  rationale: string;
  confidence: number;
  importance: number;
  proposed_canonicality: string;
  resolution_status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  tags: string[];
  session_id: string | null;
}

// ─── Create Proposal ───────────────────────────────────────────────────────

export async function createMemoryProposal(input: CreateProposalInput): Promise<ProposalRecord | null> {
  const { data, error } = await supabase
    .from('memory_write_proposals' as any)
    .insert({
      id: makeId('proposal'),
      proposed_by: input.proposedBy,
      target_memory_type: input.targetMemoryType,
      candidate_content: input.candidateContent,
      rationale: input.rationale,
      confidence: input.confidence,
      importance: input.importance ?? 0.5,
      proposed_canonicality: input.proposedCanonicality ?? 'none',
      tags: input.tags ?? [],
      session_id: input.sessionId,
      target_memory_id: input.targetMemoryId,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create memory proposal:', error);
    return null;
  }

  return data as ProposalRecord;
}

// ─── List Proposals ────────────────────────────────────────────────────────

export async function listProposals(
  status?: ProposalStatus,
  limit = 50
): Promise<ProposalRecord[]> {
  let query = supabase
    .from('memory_write_proposals' as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('resolution_status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list proposals:', error);
    return [];
  }

  return (data ?? []) as ProposalRecord[];
}

// ─── Resolve Proposal ──────────────────────────────────────────────────────

export async function resolveProposal(
  proposalId: string,
  resolution: 'approved' | 'rejected',
  resolvedBy: string
): Promise<boolean> {
  const { error } = await supabase
    .from('memory_write_proposals' as any)
    .update({
      resolution_status: resolution,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  if (error) {
    console.error('Failed to resolve proposal:', error);
    return false;
  }

  // If approved, write to memory atoms
  if (resolution === 'approved') {
    const { data: proposal } = await supabase
      .from('memory_write_proposals' as any)
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposal) {
      const p = proposal as ProposalRecord;
      await supabase.from('aimos_memory_atoms').insert({
        content: p.candidate_content,
        content_type: p.target_memory_type,
        memory_level: 'warm',
        memory_class: mapMemoryTypeToClass(p.target_memory_type),
        tags: p.tags,
        confidence_score: p.confidence,
        quality_score: p.importance,
        metadata: { proposal_id: proposalId, rationale: p.rationale },
      });

      // If proposed as canonical, create canon entry
      if (p.proposed_canonicality === 'canonical') {
        await supabase.from('canon_entries' as any).insert({
          id: makeId('canon'),
          memory_id: proposalId,
          canonical_domain: p.target_memory_type,
          status: 'active',
          promotion_reason: p.rationale,
          evidence_ids: [],
          contradiction_count: 0,
        });
      }
    }
  }

  return true;
}

// ─── Canon Operations ──────────────────────────────────────────────────────

export async function listCanonEntries(domain?: string) {
  let query = supabase
    .from('canon_entries' as any)
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (domain) {
    query = query.eq('canonical_domain', domain);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Failed to list canon entries:', error);
    return [];
  }
  return data ?? [];
}

export async function demoteCanonEntry(entryId: string, reason: string): Promise<boolean> {
  const { error } = await supabase
    .from('canon_entries' as any)
    .update({ status: 'demoted', demotion_reason: reason })
    .eq('id', entryId);

  return !error;
}

// ─── Contradiction Operations ──────────────────────────────────────────────

export async function reportContradiction(
  leftMemoryId: string,
  rightMemoryId: string,
  type: string,
  severity: string,
  recommendation?: string
) {
  const { error } = await supabase
    .from('contradiction_records' as any)
    .insert({
      id: makeId('contradiction'),
      left_memory_id: leftMemoryId,
      right_memory_id: rightMemoryId,
      contradiction_type: type,
      severity,
      recommended_resolution: recommendation,
    });

  return !error;
}

export async function listContradictions(status = 'open') {
  const { data, error } = await supabase
    .from('contradiction_records' as any)
    .select('*')
    .eq('resolution_status', status)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function mapMemoryTypeToClass(memoryType: string): string {
  const map: Record<string, string> = {
    WM: 'procedural',
    EM: 'episodic',
    SM: 'semantic',
    PM: 'semantic',
    UM: 'episodic',
    CM: 'semantic',
    PRM: 'procedural',
  };
  return map[memoryType] ?? 'semantic';
}
