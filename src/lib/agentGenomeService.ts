// Agent Genome Service — Persistent agent identity, context banks, and skill tracking
import { supabase } from '@/integrations/supabase/client';

export interface AgentGenome {
  id: string;
  agent_role: string;
  display_name: string;
  description: string | null;
  system_prompt_core: string;
  capabilities: string[];
  skill_levels: Record<string, number>;
  personality_traits: Record<string, number>;
  priority: number;
  total_tasks_completed: number;
  total_tokens_used: number;
  avg_confidence: number;
  avg_kappa: number;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentContextEntry {
  id: string;
  agent_role: string;
  context_type: string;
  content: string;
  importance: number;
  access_count: number;
  last_accessed_at: string;
  source_chain_id: string | null;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface AgentSkillLogEntry {
  id: string;
  agent_role: string;
  skill_name: string;
  proficiency_before: number | null;
  proficiency_after: number | null;
  trigger_event: string | null;
  details: string | null;
  created_at: string;
}

// ── Fetch all genomes ──
export async function fetchAllGenomes(): Promise<AgentGenome[]> {
  const { data, error } = await supabase
    .from('agent_genomes')
    .select('*')
    .order('priority', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as AgentGenome[];
}

// ── Fetch single genome ──
export async function fetchGenome(agentRole: string): Promise<AgentGenome | null> {
  const { data, error } = await supabase
    .from('agent_genomes')
    .select('*')
    .eq('agent_role', agentRole)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as AgentGenome | null;
}

// ── Fetch context bank for an agent ──
export async function fetchContextBank(agentRole: string, limit = 50): Promise<AgentContextEntry[]> {
  const { data, error } = await supabase
    .from('agent_context_bank')
    .select('*')
    .eq('agent_role', agentRole)
    .order('importance', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as AgentContextEntry[];
}

// ── Fetch skill log for an agent ──
export async function fetchSkillLog(agentRole: string, limit = 30): Promise<AgentSkillLogEntry[]> {
  const { data, error } = await supabase
    .from('agent_skill_log')
    .select('*')
    .eq('agent_role', agentRole)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as AgentSkillLogEntry[];
}

// ── Fetch context bank stats per agent ──
export async function fetchContextBankStats(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('agent_context_bank')
    .select('agent_role');
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const role = (row as any).agent_role;
    counts[role] = (counts[role] || 0) + 1;
  }
  return counts;
}
