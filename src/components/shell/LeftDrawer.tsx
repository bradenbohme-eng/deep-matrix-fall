// LeftDrawer — Canon §12: Live data from Supabase for all worlds

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import type { WorldPage, LeftTab } from './types';

interface LeftDrawerProps {
  activeWorld: WorldPage;
  activeTab: LeftTab;
  width: number;
  isOpen: boolean;
}

const LeftDrawer: React.FC<LeftDrawerProps> = ({ activeWorld, activeTab, width, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div
      className="h-full bg-surface-2 border-r border-border flex flex-col overflow-hidden"
      style={{ width: `${width}px` }}
    >
      <div className="px-3 py-2 border-b border-border flex items-center">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          {activeTab}
        </span>
      </div>
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-3">
          {renderDrawerContent(activeWorld, activeTab)}
        </div>
      </ScrollArea>
    </div>
  );
};

function renderDrawerContent(world: WorldPage, tab: LeftTab): React.ReactNode {
  if (world === 'orchestration') {
    switch (tab) {
      case 'tasks': return <LiveTasksList />;
      case 'agents': return <LiveAgentsList />;
      case 'context': return <LiveContextTiers />;
      case 'budgets': return <LiveBudgetMeters />;
      case 'policies': return <LivePoliciesList />;
      default: return <PlaceholderContent label={tab} />;
    }
  }
  if (world === 'evolve') {
    switch (tab) {
      case 'status': return <LiveSystemStatus />;
      case 'history': return <LiveHistory />;
      case 'config': return <LiveConfig />;
      default: return <PlaceholderContent label={tab} />;
    }
  }
  return <PlaceholderContent label={tab} />;
}

// ─── Live Tasks from aimos_task_queue ───
const LiveTasksList: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('aimos_task_queue')
        .select('id, agent_role, tier, status, input, created_at')
        .order('created_at', { ascending: false }).limit(20);
      setTasks(data || []);
      setLoading(false);
    };
    load();
    const ch = supabase.channel('drawer-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aimos_task_queue' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const statusColors: Record<string, string> = {
    completed: 'bg-success/20 text-success', running: 'bg-primary/20 text-primary',
    queued: 'bg-muted text-muted-foreground', failed: 'bg-destructive/20 text-destructive',
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-1.5">
      {tasks.map(task => (
        <div key={task.id} className="surface-raised rounded-md p-2.5 cursor-pointer interactive-ghost">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-foreground truncate flex-1">
              {(task.input as any)?.description?.slice(0, 50) || task.agent_role}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground ml-2">{task.tier}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${statusColors[task.status] || 'bg-muted text-muted-foreground'}`}>
              {task.status}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">{task.agent_role}</span>
          </div>
        </div>
      ))}
      {tasks.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No tasks in queue</p>}
    </div>
  );
};

// ─── Live Agents ───
const LiveAgentsList: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('agent_genomes')
      .select('agent_role, display_name, avg_kappa, avg_confidence, total_tasks_completed, capabilities, last_active_at')
      .order('priority', { ascending: true })
      .then(({ data }) => setAgents(data || []));
  }, []);

  return (
    <div className="space-y-2">
      {agents.map(agent => (
        <div key={agent.agent_role} className="surface-raised rounded-md p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono text-foreground">{agent.display_name}</span>
            <span className="text-[9px] font-mono text-muted-foreground">
              κ {((agent.avg_kappa || 0.5) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>{agent.total_tasks_completed || 0} tasks</span>
            <span>{(agent.capabilities || []).length} caps</span>
          </div>
          <div className="h-1 bg-surface-1 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(agent.avg_confidence || 0.5) * 100}%` }} />
          </div>
        </div>
      ))}
      {agents.length === 0 && <LoadingState />}
    </div>
  );
};

// ─── Live Context Tiers ───
const LiveContextTiers: React.FC = () => {
  const [tiers, setTiers] = useState<{ name: string; count: number; tokens: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const results = [];
      for (const level of ['hot', 'warm', 'cold', 'frozen']) {
        const { count } = await supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }).eq('memory_level', level);
        results.push({ name: level.charAt(0).toUpperCase() + level.slice(1), count: count || 0, tokens: (count || 0) * 150 });
      }
      setTiers(results);
    };
    load();
  }, []);

  return (
    <div className="space-y-2">
      {tiers.map(tier => (
        <div key={tier.name} className="surface-raised rounded-md p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-foreground">{tier.name}</span>
            <span className="text-[9px] font-mono text-muted-foreground">{tier.count} atoms</span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">~{tier.tokens.toLocaleString()} tokens</span>
        </div>
      ))}
    </div>
  );
};

// ─── Live Budget Meters ───
const LiveBudgetMeters: React.FC = () => {
  const [budgets, setBudgets] = useState<{ name: string; used: number; max: number; unit: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [chains, tasks, atoms] = await Promise.all([
        supabase.from('aimos_reasoning_chains').select('*', { count: 'exact', head: true }),
        supabase.from('aimos_task_queue').select('*', { count: 'exact', head: true }),
        supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }),
      ]);
      setBudgets([
        { name: 'Reasoning Chains', used: chains.count || 0, max: 1000, unit: '' },
        { name: 'Tasks Executed', used: tasks.count || 0, max: 500, unit: '' },
        { name: 'Memory Atoms', used: atoms.count || 0, max: 5000, unit: '' },
      ]);
    };
    load();
  }, []);

  return (
    <div className="space-y-3">
      {budgets.map(b => {
        const pct = (b.used / b.max) * 100;
        const isHigh = pct > 80;
        const isMid = pct > 50;
        return (
          <div key={b.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{b.name}</span>
              <span className={`text-[10px] font-mono ${isHigh ? 'text-destructive' : isMid ? 'text-warning' : 'text-foreground'}`}>
                {b.used.toLocaleString()}{b.unit} / {b.max.toLocaleString()}{b.unit}
              </span>
            </div>
            <div className="h-1.5 bg-surface-1 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-destructive' : isMid ? 'bg-warning' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Live Policies ───
const LivePoliciesList: React.FC = () => {
  const [settings, setSettings] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('ai_autonomy_settings').select('setting_key, setting_value')
      .then(({ data }) => setSettings(data || []));
  }, []);

  return (
    <div className="space-y-2">
      {settings.map(s => (
        <div key={s.setting_key} className="surface-raised rounded-md p-2.5">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            {s.setting_key.replace(/_/g, ' ')}
          </div>
          <div className="text-xs font-mono text-foreground">
            {typeof s.setting_value === 'object' ? (
              s.setting_value?.enabled !== undefined
                ? (s.setting_value.enabled ? '✅ Enabled' : '❌ Disabled')
                : (s.setting_value?.level || JSON.stringify(s.setting_value).slice(0, 50))
            ) : String(s.setting_value)}
          </div>
        </div>
      ))}
      {settings.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No autonomy settings configured</p>}
    </div>
  );
};

// ─── Evolve: System Status ───
const LiveSystemStatus: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const [atoms, chains, entities, proposals] = await Promise.all([
        supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }),
        supabase.from('aimos_reasoning_chains').select('confidence_kappa').order('created_at', { ascending: false }).limit(10),
        supabase.from('aimos_entities').select('*', { count: 'exact', head: true }),
        supabase.from('evolution_proposals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      const ks = (chains.data || []).map((c: any) => c.confidence_kappa).filter((v: any) => v != null);
      setData({
        atoms: atoms.count || 0, entities: entities.count || 0, proposals: proposals.count || 0,
        avgK: ks.length ? ks.reduce((a: number, b: number) => a + b, 0) / ks.length : 0,
      });
    };
    load();
  }, []);

  if (!data) return <LoadingState />;

  return (
    <div className="space-y-2">
      <StatusItem label="System" value="OPERATIONAL" color="text-success" />
      <StatusItem label="Memory" value={`${data.atoms} atoms`} />
      <StatusItem label="Knowledge" value={`${data.entities} entities`} />
      <StatusItem label="Avg κ" value={`${(data.avgK * 100).toFixed(1)}%`} color={data.avgK >= 0.7 ? 'text-success' : 'text-warning'} />
      <StatusItem label="Pending" value={`${data.proposals} proposals`} color={data.proposals > 0 ? 'text-warning' : undefined} />
    </div>
  );
};

// ─── Evolve: History ───
const LiveHistory: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('evolution_proposals')
      .select('id, title, status, priority, created_at')
      .order('created_at', { ascending: false }).limit(15)
      .then(({ data }) => setItems(data || []));
  }, []);

  return (
    <div className="space-y-1.5">
      {items.map(item => (
        <div key={item.id} className="surface-raised rounded-md p-2.5">
          <div className="text-xs font-mono text-foreground truncate">{item.title}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
              item.status === 'approved' ? 'bg-success/20 text-success' :
              item.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
              item.status === 'applied' ? 'bg-primary/20 text-primary' :
              'bg-muted text-muted-foreground'
            }`}>{item.status}</span>
            <span className="text-[9px] font-mono text-muted-foreground">P{item.priority}</span>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No evolution history</p>}
    </div>
  );
};

// ─── Evolve: Config ───
const LiveConfig: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('aimos_config')
      .select('config_key, config_value, description, updated_at')
      .order('updated_at', { ascending: false }).limit(20)
      .then(({ data }) => setConfigs(data || []));
  }, []);

  return (
    <div className="space-y-1.5">
      {configs.map(c => (
        <div key={c.config_key} className="surface-raised rounded-md p-2.5">
          <div className="text-[10px] font-mono text-muted-foreground uppercase">{c.config_key}</div>
          <div className="text-xs font-mono text-foreground mt-0.5">
            {typeof c.config_value === 'object' ? JSON.stringify(c.config_value?.value ?? c.config_value).slice(0, 60) : String(c.config_value)}
          </div>
          {c.description && <div className="text-[9px] text-muted-foreground/60 mt-0.5">{c.description.slice(0, 80)}</div>}
        </div>
      ))}
      {configs.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No config entries</p>}
    </div>
  );
};

// ─── Helpers ───
const StatusItem: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="surface-raised rounded-md p-2.5 flex items-center justify-between">
    <span className="text-[10px] font-mono text-muted-foreground uppercase">{label}</span>
    <span className={`text-xs font-mono ${color || 'text-foreground'}`}>{value}</span>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
);

const PlaceholderContent: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-xs text-muted-foreground text-center py-8 font-mono">{label} content</div>
);

export default LeftDrawer;
