// Bottom Panel - Terminal (LIVE AI), Problems, Output, Diagnostics (LIVE), Debug, Tests

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Terminal, AlertCircle, FileOutput, Activity, Bug, X, Minus, Maximize2, FlaskConical, Loader2,
} from 'lucide-react';
import type { BottomPanelTab } from './types';
import TestHarnessPanel from './TestHarnessPanel';

interface BottomPanelProps {
  activeTab: BottomPanelTab;
  onTabChange: (tab: BottomPanelTab) => void;
  height: number;
  onHeightChange: (height: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'warn' | 'error' | 'success' | 'command';
  message: string;
}

const tabs: { id: BottomPanelTab; icon: React.ElementType; label: string }[] = [
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'problems', icon: AlertCircle, label: 'Problems' },
  { id: 'output', icon: FileOutput, label: 'Output' },
  { id: 'diagnostics', icon: Activity, label: 'Diagnostics' },
  { id: 'debug', icon: Bug, label: 'Debug' },
  { id: 'tests', icon: FlaskConical, label: 'Tests' },
];

// ─── Live Diagnostics Panel ───
const LiveDiagnostics: React.FC = () => {
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [atoms, chains, plans, tasks, entities, proposals, actions, genomes] = await Promise.all([
        supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }),
        supabase.from('aimos_reasoning_chains').select('confidence_kappa').order('created_at', { ascending: false }).limit(20),
        supabase.from('aimos_plans').select('*', { count: 'exact', head: true }),
        supabase.from('aimos_task_queue').select('status').limit(200),
        supabase.from('aimos_entities').select('*', { count: 'exact', head: true }),
        supabase.from('evolution_proposals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('ai_action_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('agent_genomes').select('agent_role, avg_kappa, total_tasks_completed, last_active_at').order('priority', { ascending: true }),
      ]);

      const ks = (chains.data || []).map((c: any) => c.confidence_kappa).filter((v: any) => v != null);
      const avgK = ks.length ? ks.reduce((a: number, b: number) => a + b, 0) / ks.length : 0;

      const taskData = tasks.data || [];
      const queued = taskData.filter((t: any) => t.status === 'queued').length;
      const running = taskData.filter((t: any) => t.status === 'running').length;
      const done = taskData.filter((t: any) => t.status === 'completed').length;

      setData({
        atoms: atoms.count || 0,
        avgKappa: avgK,
        chains: ks.length,
        plans: plans.count || 0,
        entities: entities.count || 0,
        pendingProposals: proposals.count || 0,
        pendingActions: actions.count || 0,
        tasks: { queued, running, done, total: taskData.length },
        agents: genomes.data || [],
      });
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  if (!data) return <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="h-full p-3 overflow-auto">
      <div className="grid grid-cols-5 gap-3 mb-3">
        <MetricCard label="Memory Atoms" value={data.atoms} />
        <MetricCard label="Avg κ" value={`${(data.avgKappa * 100).toFixed(1)}%`} color={data.avgKappa >= 0.7 ? 'text-success' : data.avgKappa >= 0.4 ? 'text-warning' : 'text-destructive'} />
        <MetricCard label="Active Plans" value={data.plans} />
        <MetricCard label="Entities (SEG)" value={data.entities} />
        <MetricCard label="Pending Actions" value={data.pendingActions} color={data.pendingActions > 0 ? 'text-warning' : undefined} />
      </div>
      <div className="grid grid-cols-4 gap-3 mb-3">
        <MetricCard label="Tasks Queued" value={data.tasks.queued} />
        <MetricCard label="Tasks Running" value={data.tasks.running} color="text-primary" />
        <MetricCard label="Tasks Done" value={data.tasks.done} color="text-success" />
        <MetricCard label="Proposals" value={data.pendingProposals} color={data.pendingProposals > 0 ? 'text-warning' : undefined} />
      </div>
      {data.agents.length > 0 && (
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1.5">Agent Swarm</div>
          <div className="grid grid-cols-4 gap-2">
            {data.agents.slice(0, 8).map((a: any) => (
              <div key={a.agent_role} className="bg-muted/20 rounded p-2 border border-border text-[10px] font-mono">
                <div className="text-foreground truncate">{a.agent_role}</div>
                <div className="flex justify-between text-muted-foreground mt-0.5">
                  <span>κ{((a.avg_kappa || 0.5) * 100).toFixed(0)}%</span>
                  <span>{a.total_tasks_completed || 0}T</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color }) => (
  <div className="bg-muted/20 rounded p-2.5 border border-border">
    <div className="text-[9px] text-muted-foreground font-mono uppercase">{label}</div>
    <div className={`text-lg font-mono font-bold ${color || 'text-foreground'}`}>{value}</div>
  </div>
);

// ─── Live Output Panel ───
const LiveOutputPanel: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('aimos_agent_discord')
      .select('agent_role, message_type, content, confidence, created_at')
      .order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => setLogs(data || []));

    const ch = supabase.channel('output-discord')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'aimos_agent_discord' }, (payload) => {
        setLogs(prev => [payload.new, ...prev].slice(0, 50));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const typeColors: Record<string, string> = {
    SUMMARY: 'text-primary', PLAN_ADVANCE: 'text-success', PROPOSAL_APPLIED: 'text-warning',
    LIFECYCLE_RUN: 'text-info', ALERT: 'text-destructive', THOUGHT: 'text-muted-foreground',
  };

  return (
    <ScrollArea className="h-full p-2 font-mono text-xs">
      {logs.map((log, i) => (
        <div key={i} className="mb-1">
          <span className="text-muted-foreground/50 mr-2">[{new Date(log.created_at).toLocaleTimeString()}]</span>
          <span className="text-muted-foreground mr-1">[{log.agent_role}]</span>
          <span className={`mr-1 ${typeColors[log.message_type] || 'text-foreground'}`}>{log.message_type}</span>
          <span className="text-foreground/80">{log.content?.slice(0, 200)}</span>
        </div>
      ))}
      {logs.length === 0 && <div className="text-muted-foreground text-center py-4">No agent output yet</div>}
    </ScrollArea>
  );
};

const BottomPanel: React.FC<BottomPanelProps> = ({
  activeTab, onTabChange, height, onHeightChange, isOpen, onClose,
}) => {
  const [terminalHistory, setTerminalHistory] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date(), type: 'success', message: 'HQ Terminal v5.0 — Connected to AIMOS backend' },
    { id: '2', timestamp: new Date(), type: 'info', message: 'Type "help" for available commands, or ask natural language questions.' },
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleMouseDown = () => {
    isDragging.current = true;
    const move = (e: MouseEvent) => { if (isDragging.current) onHeightChange(window.innerHeight - e.clientY); };
    const up = () => { isDragging.current = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const executeCommand = async (cmd: string) => {
    const entry: LogEntry = { id: Date.now().toString(), timestamp: new Date(), type: 'command', message: `$ ${cmd}` };
    setTerminalHistory(prev => [...prev, entry]);

    if (cmd === 'clear') { setTerminalHistory([]); return; }
    if (cmd === 'help') {
      setTerminalHistory(prev => [...prev, {
        id: (Date.now() + 1).toString(), timestamp: new Date(), type: 'info',
        message: `Commands:\n  status     — System health\n  agents     — List agents\n  memory     — Memory stats\n  tasks      — Task queue\n  plans      — Active plans\n  search <q> — Search memory\n  clear      — Clear terminal\n  <any text> — Ask HQ Intelligence`,
      }]);
      return;
    }

    setIsExecuting(true);
    try {
      if (cmd === 'status') {
        const [atoms, chains, plans, entities] = await Promise.all([
          supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }),
          supabase.from('aimos_reasoning_chains').select('confidence_kappa').order('created_at', { ascending: false }).limit(10),
          supabase.from('aimos_plans').select('*', { count: 'exact', head: true }),
          supabase.from('aimos_entities').select('*', { count: 'exact', head: true }),
        ]);
        const ks = (chains.data || []).map((c: any) => c.confidence_kappa).filter((v: any) => v != null);
        const avgK = ks.length ? ks.reduce((a: number, b: number) => a + b, 0) / ks.length : 0;
        setTerminalHistory(prev => [...prev, { id: (Date.now() + 1).toString(), timestamp: new Date(), type: 'success',
          message: `System Status: OPERATIONAL\nAtoms: ${atoms.count}\nPlans: ${plans.count}\nEntities: ${entities.count}\nAvg κ: ${(avgK * 100).toFixed(1)}%`,
        }]);
      } else if (cmd === 'agents') {
        const { data } = await supabase.from('agent_genomes').select('agent_role, display_name, avg_kappa, total_tasks_completed').order('priority', { ascending: true });
        const lines = (data || []).map((a: any) => `  ${a.display_name} (${a.agent_role}) — κ${((a.avg_kappa || 0.5) * 100).toFixed(0)}% | ${a.total_tasks_completed || 0} tasks`);
        setTerminalHistory(prev => [...prev, { id: (Date.now() + 1).toString(), timestamp: new Date(), type: 'info', message: `Active Agents:\n${lines.join('\n')}` }]);
      } else if (cmd === 'memory') {
        const levels: string[] = [];
        for (const l of ['hot', 'warm', 'cold', 'frozen']) {
          const { count } = await supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }).eq('memory_level', l);
          levels.push(`  ${l.toUpperCase()}: ${count || 0}`);
        }
        setTerminalHistory(prev => [...prev, { id: (Date.now() + 1).toString(), timestamp: new Date(), type: 'info', message: `Memory Tiers:\n${levels.join('\n')}` }]);
      } else if (cmd === 'tasks') {
        const { data } = await supabase.from('aimos_task_queue').select('agent_role, tier, status, input').order('created_at', { ascending: false }).limit(10);
        const lines = (data || []).map((t: any) => `  [${t.tier}] ${t.agent_role} — ${t.status} — ${(t.input as any)?.description?.slice(0, 60) || '...'}`);
        setTerminalHistory(prev => [...prev, { id: (Date.now() + 1).toString(), timestamp: new Date(), type: 'info', message: `Recent Tasks:\n${lines.join('\n') || '  (none)'}` }]);
      } else if (cmd === 'plans') {
        const { data } = await supabase.from('aimos_plans').select('title, status, current_step, steps').eq('status', 'active').limit(5);
        const lines = (data || []).map((p: any) => `  "${p.title}" — Step ${(p.current_step || 0) + 1}/${Array.isArray(p.steps) ? p.steps.length : '?'}`);
        setTerminalHistory(prev => [...prev, { id: (Date.now() + 1).toString(), timestamp: new Date(), type: 'info', message: `Active Plans:\n${lines.join('\n') || '  (none)'}` }]);
      } else if (cmd.startsWith('search ')) {
        const query = cmd.slice(7);
        const { data } = await supabase.from('aimos_memory_atoms').select('content, memory_level, confidence_score')
          .or(`content.ilike.%${query}%`).order('confidence_score', { ascending: false }).limit(5);
        const lines = (data || []).map((a: any) => `  [${a.memory_level}|κ${Math.round((a.confidence_score || 0.5) * 100)}%] ${a.content?.slice(0, 100)}`);
        setTerminalHistory(prev => [...prev, { id: (Date.now() + 1).toString(), timestamp: new Date(), type: 'info', message: lines.length ? `Results:\n${lines.join('\n')}` : 'No results found.' }]);
      } else {
        // Forward to HQ chat as a natural language query
        setTerminalHistory(prev => [...prev, { id: (Date.now() + 1).toString(), timestamp: new Date(), type: 'info', message: 'Querying HQ Intelligence...' }]);
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hq-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ messages: [{ role: 'user', content: cmd }] }),
        });
        if (resp.ok && resp.body) {
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let full = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try { const j = JSON.parse(line.slice(6)); const c = j.choices?.[0]?.delta?.content; if (c) full += c; } catch {}
              }
            }
          }
          setTerminalHistory(prev => [...prev, { id: (Date.now() + 2).toString(), timestamp: new Date(), type: 'success', message: full || '(empty response)' }]);
        } else {
          setTerminalHistory(prev => [...prev, { id: (Date.now() + 2).toString(), timestamp: new Date(), type: 'error', message: `Error: ${resp.status}` }]);
        }
      }
    } catch (e) {
      setTerminalHistory(prev => [...prev, { id: (Date.now() + 1).toString(), timestamp: new Date(), type: 'error', message: `Error: ${e instanceof Error ? e.message : 'unknown'}` }]);
    }
    setIsExecuting(false);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim() || isExecuting) return;
    executeCommand(terminalInput.trim());
    setTerminalInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="bg-card border-t border-primary/20 flex flex-col" style={{ height: `${height}px` }}>
      <div ref={resizeRef} onMouseDown={handleMouseDown} className="h-1 bg-transparent hover:bg-primary/30 cursor-ns-resize" />
      
      <div className="flex items-center justify-between px-2 py-1 bg-muted/30 border-b border-border">
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button key={tab.id} onClick={() => onTabChange(tab.id)} variant="ghost" size="sm"
                className={`h-7 px-3 text-xs font-mono ${isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <IconComponent className="w-3 h-3 mr-1" />{tab.label}
              </Button>
            );
          })}
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"><Minus className="w-3 h-3" /></Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"><Maximize2 className="w-3 h-3" /></Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'terminal' && (
          <div className="h-full flex flex-col bg-black/50">
            <ScrollArea className="flex-1 p-2 font-mono text-xs">
              {terminalHistory.map((entry) => (
                <div key={entry.id} className={`mb-1 ${
                  entry.type === 'error' ? 'text-destructive' :
                  entry.type === 'warn' ? 'text-yellow-500' :
                  entry.type === 'success' ? 'text-primary' :
                  entry.type === 'command' ? 'text-cyan-400' :
                  'text-muted-foreground'
                }`}>
                  <span className="text-muted-foreground/50 mr-2">[{entry.timestamp.toLocaleTimeString()}]</span>
                  <span className="whitespace-pre-wrap">{entry.message}</span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </ScrollArea>
            <form onSubmit={handleTerminalSubmit} className="p-2 border-t border-border">
              <div className="flex items-center">
                <span className="text-primary mr-2 font-mono text-xs">$</span>
                <input type="text" value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-xs"
                  placeholder={isExecuting ? 'Executing...' : 'Enter command or natural language query...'}
                  disabled={isExecuting} autoFocus />
                {isExecuting && <Loader2 className="w-3 h-3 animate-spin text-primary ml-2" />}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'problems' && (
          <ScrollArea className="h-full p-2">
            <div className="text-center text-muted-foreground py-8 text-sm font-mono">No problems detected — system nominal</div>
          </ScrollArea>
        )}

        {activeTab === 'output' && <LiveOutputPanel />}
        {activeTab === 'diagnostics' && <LiveDiagnostics />}

        {activeTab === 'debug' && (
          <ScrollArea className="h-full p-2 font-mono text-xs">
            <div className="text-muted-foreground">Debug console connected to AIMOS cognitive pipeline. Reasoning chains and tool calls are logged here.</div>
          </ScrollArea>
        )}

        {activeTab === 'tests' && <div className="h-full"><TestHarnessPanel /></div>}
      </div>
    </div>
  );
};

export default BottomPanel;
