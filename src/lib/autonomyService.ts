// Autonomy Service — Manages AI action queue and approval gates
import { supabase } from '@/integrations/supabase/client';

export interface AIAction {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  payload: Record<string, any>;
  status: string;
  priority: number;
  source_chain_id: string | null;
  agent_role: string;
  auto_approve: boolean;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  execution_result: Record<string, any> | null;
  expires_at: string | null;
}

export interface AutonomySettings {
  auto_approve_memory_writes: { enabled: boolean; max_per_hour: number };
  auto_approve_config_changes: { enabled: boolean };
  auto_approve_task_creation: { enabled: boolean; max_per_hour: number };
  auto_approve_entity_creation: { enabled: boolean; max_per_hour: number };
  auto_approve_evolution_proposals: { enabled: boolean };
  global_autonomy_level: { level: 'locked' | 'supervised' | 'autonomous'; options: string[] };
}

const DEFAULT_SETTINGS: AutonomySettings = {
  auto_approve_memory_writes: { enabled: false, max_per_hour: 10 },
  auto_approve_config_changes: { enabled: false },
  auto_approve_task_creation: { enabled: true, max_per_hour: 20 },
  auto_approve_entity_creation: { enabled: true, max_per_hour: 50 },
  auto_approve_evolution_proposals: { enabled: false },
  global_autonomy_level: { level: 'supervised', options: ['locked', 'supervised', 'autonomous'] },
};

export async function fetchPendingActions(): Promise<AIAction[]> {
  const { data, error } = await supabase
    .from('ai_action_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(50);
  if (error) { console.error('fetchPendingActions error:', error); return []; }
  return (data || []) as unknown as AIAction[];
}

export async function fetchAllActions(limit = 100): Promise<AIAction[]> {
  const { data, error } = await supabase
    .from('ai_action_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchAllActions error:', error); return []; }
  return (data || []) as unknown as AIAction[];
}

export async function approveAction(actionId: string): Promise<boolean> {
  const { data: action } = await supabase
    .from('ai_action_queue')
    .select('*')
    .eq('id', actionId)
    .single();

  if (!action) return false;

  // Execute the action
  const result = await executeAction(action as unknown as AIAction);

  await supabase
    .from('ai_action_queue')
    .update({
      status: 'approved',
      resolved_at: new Date().toISOString(),
      resolved_by: 'user',
      execution_result: result,
    })
    .eq('id', actionId);

  return true;
}

export async function rejectAction(actionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('ai_action_queue')
    .update({
      status: 'rejected',
      resolved_at: new Date().toISOString(),
      resolved_by: 'user',
    })
    .eq('id', actionId);
  return !error;
}

export async function approveAllPending(): Promise<number> {
  const actions = await fetchPendingActions();
  let approved = 0;
  for (const action of actions) {
    const ok = await approveAction(action.id);
    if (ok) approved++;
  }
  return approved;
}

async function executeAction(action: AIAction): Promise<Record<string, any>> {
  try {
    switch (action.action_type) {
      case 'memory_write': {
        const { error } = await supabase.from('aimos_memory_atoms').insert({
          content: action.payload.content,
          content_type: action.payload.content_type || 'ai_proposed',
          tags: action.payload.tags || [],
          memory_level: action.payload.memory_level || 'warm',
          confidence_score: action.payload.confidence || 0.7,
          metadata: { source: 'ai_action_queue', action_id: action.id },
        });
        return error ? { error: error.message } : { success: true };
      }
      case 'evolution_proposal': {
        const { error } = await supabase.from('evolution_proposals').insert({
          title: action.payload.title || action.title,
          description: action.payload.description,
          priority: action.payload.priority || 5,
          status: 'pending',
          implementation_plan: action.payload.implementation_plan || {},
        });
        return error ? { error: error.message } : { success: true };
      }
      case 'task_create': {
        const { error } = await supabase.from('aimos_task_queue').insert({
          agent_role: action.payload.agent_role || action.agent_role,
          tier: action.payload.tier || 'T2',
          input: action.payload.input || { description: action.title },
          status: 'queued',
        });
        return error ? { error: error.message } : { success: true };
      }
      case 'config_change': {
        const { error } = await supabase.from('aimos_config').upsert({
          config_key: action.payload.key,
          config_value: { value: action.payload.value },
          description: `AI-proposed: ${action.title}`,
          updated_by: 'ai_action_queue',
        }, { onConflict: 'config_key' });
        return error ? { error: error.message } : { success: true };
      }
      case 'plan_create': {
        const { error } = await supabase.from('aimos_plans').insert({
          title: action.payload.title || action.title,
          objective: action.payload.objective || action.description || '',
          steps: action.payload.steps || [],
          success_criteria: action.payload.success_criteria || { completion: true },
          status: 'active',
        });
        return error ? { error: error.message } : { success: true };
      }
      case 'entity_create': {
        const { error } = await supabase.from('aimos_entities').upsert({
          name: action.payload.name,
          entity_type: action.payload.entity_type || 'entity',
          description: action.payload.description,
          confidence: action.payload.confidence || 0.7,
        }, { onConflict: 'name' });
        return error ? { error: error.message } : { success: true };
      }
      default:
        return { error: `Unknown action type: ${action.action_type}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Execution failed' };
  }
}

export async function fetchAutonomySettings(): Promise<AutonomySettings> {
  const { data } = await supabase
    .from('ai_autonomy_settings')
    .select('setting_key, setting_value');
  
  if (!data || data.length === 0) return DEFAULT_SETTINGS;
  
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of data) {
    const key = row.setting_key as keyof AutonomySettings;
    if (key in settings) {
      (settings as any)[key] = row.setting_value;
    }
  }
  return settings;
}

export async function updateAutonomySetting(key: string, value: Record<string, any>): Promise<boolean> {
  const { error } = await supabase
    .from('ai_autonomy_settings')
    .update({ setting_value: value as any, updated_at: new Date().toISOString() })
    .eq('setting_key', key);
  return !error;
}

export function subscribeToActions(callback: () => void) {
  const channel = supabase
    .channel('ai-action-queue-realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'ai_action_queue',
    }, () => callback())
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
