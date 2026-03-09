// CenterWorkspace — Canon §9: The Thing Itself
// "The center is sacred. It must show the thing the user is actually working on."

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { WorldPage, SubPage } from './types';
import OrchestrationDashboard from '@/components/hq/OrchestrationDashboard';
import DAGVisualization from '@/components/hq/DAGVisualization';
import TestHarnessPanel from '@/components/hq/TestHarnessPanel';
import EvolutionCenter from './EvolutionCenter';
import AgentGenomesPanel from './AgentGenomesPanel';
import Editor from '@monaco-editor/react';
import { useIDEStore } from '@/components/ide/useIDEStore';
import { supabase } from '@/integrations/supabase/client';
import type { Task, DAGState } from '@/lib/orchestration/types';
import {
  Activity,
  Workflow,
  ScrollText,
  FlaskConical,
  Code,
  Eye,
  GitCompare,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CenterWorkspaceProps {
  activeWorld: WorldPage;
  activeSubPage: SubPage;
}

const CenterWorkspace: React.FC<CenterWorkspaceProps> = ({ activeWorld, activeSubPage }) => {
  if (activeWorld === 'orchestration') {
    return <OrchestrationCenter subPage={activeSubPage} />;
  }
  if (activeWorld === 'code') {
    return <CodeCenter subPage={activeSubPage} />;
  }
  if (activeWorld === 'evolve') {
    return <EvolutionCenter subPage={activeSubPage} />;
  }

  // Placeholder for other worlds
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
        <p className="text-sm font-mono text-muted-foreground">
          {activeWorld.toUpperCase()} / {activeSubPage}
        </p>
        <p className="text-xs text-muted-foreground mt-1">World under construction</p>
      </div>
    </div>
  );
};

// ─── Orchestration World ───
const OrchestrationCenter: React.FC<{ subPage: SubPage }> = ({ subPage }) => {
  const [liveTasks, setLiveTasks] = useState<Map<string, Task>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('aimos_task_queue')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (!error && data) {
      const taskMap = new Map<string, Task>();
      data.forEach((row: any) => {
        const deps = row.dependencies || [];
        taskMap.set(row.id, {
          task_id: row.id,
          title: row.input?.title || row.agent_role || row.id,
          prompt: row.input?.prompt || '',
          acceptance_criteria: [],
          dependencies: deps,
          priority: row.confidence ? Math.round(row.confidence * 100) : 50,
          status: row.status === 'completed' ? 'done' : row.status === 'running' ? 'active' : row.status === 'failed' ? 'failed' : 'queued',
          context_refs: [],
          history: [],
          created_at: new Date(row.created_at).getTime(),
          subtask_ids: [],
          retry_count: row.retry_count || 0,
          max_retries: 3,
          metadata: { agent_role: row.agent_role, tier: row.tier },
        });
      });
      setLiveTasks(taskMap);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
    const ch = supabase
      .channel('task-queue-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aimos_task_queue' }, () => {
        fetchTasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchTasks]);

  const liveDag = useMemo((): DAGState => {
    const ids = Array.from(liveTasks.keys());
    return {
      nodes: ids.map((id, i) => ({
        task_id: id,
        status: liveTasks.get(id)!.status,
        priority: liveTasks.get(id)!.priority,
        depth: i,
      })),
      edges: ids.flatMap(id => {
        const task = liveTasks.get(id)!;
        return task.dependencies
          .filter(d => liveTasks.has(d))
          .map(d => ({ from: d, to: id, type: 'requires' as const }));
      }),
      roots: ids.filter(id => liveTasks.get(id)!.dependencies.length === 0),
      leaves: ids.filter(id => !ids.some(oid => liveTasks.get(oid)!.dependencies.includes(id))),
      ready: ids.filter(id =>
        liveTasks.get(id)!.status === 'queued' &&
        liveTasks.get(id)!.dependencies.every(d => liveTasks.get(d)?.status === 'done')
      ),
    };
  }, [liveTasks]);

  if (loading && liveTasks.size === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  switch (subPage) {
    case 'command':
      return <OrchestrationDashboard />;
    case 'pipeline':
      return <DAGVisualization tasks={liveTasks} dagState={liveDag} />;
    case 'events':
      return <EventLogCenter />;
    case 'tests':
      return <TestHarnessPanel />;
    case 'genomes':
      return <AgentGenomesPanel />;
    default:
      return null;
  }
};

// ─── Event Log Center (Live from Supabase) ───
const EventLogCenter: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    // Pull from aimos_agent_discord as the canonical event stream
    const { data, error } = await supabase
      .from('aimos_agent_discord')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setEvents(data.map((row: any) => ({
        id: row.id,
        type: row.message_type?.toUpperCase() || 'EVENT',
        ts: row.created_at,
        agent: row.agent_role,
        content: row.content?.substring(0, 120) || '',
        confidence: row.confidence,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
    const ch = supabase
      .channel('event-log-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'aimos_agent_discord' }, (payload) => {
        const row = payload.new as any;
        setEvents(prev => [{
          id: row.id,
          type: row.message_type?.toUpperCase() || 'EVENT',
          ts: row.created_at,
          agent: row.agent_role,
          content: row.content?.substring(0, 120) || '',
          confidence: row.confidence,
        }, ...prev].slice(0, 100));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchEvents]);

  const typeColors: Record<string, string> = {
    OBSERVATION: 'text-info',
    PLAN: 'text-primary',
    ACTION: 'text-foreground',
    VERIFICATION: 'text-success',
    CONTRADICTION: 'text-destructive',
    TOOL_USE: 'text-warning',
    REASONING: 'text-accent',
    RESPONSE: 'text-primary',
    REPORT: 'text-muted-foreground',
    EVENT: 'text-muted-foreground',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-border flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Event Log — Live Agent Discord Stream
        </span>
        <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={fetchEvents}>
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Badge variant="outline" className="text-[10px]">
          {events.length} events
        </Badge>
      </div>
      <ScrollArea className="flex-1">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="px-4 py-2 w-36">Timestamp</th>
              <th className="px-4 py-2 w-28">Type</th>
              <th className="px-4 py-2 w-24">Agent</th>
              <th className="px-4 py-2">Content</th>
              <th className="px-4 py-2 w-16">κ</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(e.ts).toLocaleTimeString()}
                </td>
                <td className={`px-4 py-2 ${typeColors[e.type] || 'text-muted-foreground'}`}>
                  {e.type}
                </td>
                <td className="px-4 py-2 text-accent">{e.agent}</td>
                <td className="px-4 py-2 text-muted-foreground truncate max-w-xs">{e.content}</td>
                <td className="px-4 py-2 text-primary">{e.confidence != null ? e.confidence.toFixed(2) : '—'}</td>
              </tr>
            ))}
            {events.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No events yet. Agent activity will appear here in real-time.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
};

// ─── Code World ───
const CodeCenter: React.FC<{ subPage: SubPage }> = ({ subPage }) => {
  const ideStore = useIDEStore();
  const activeTab = ideStore.openTabs.find(t => t.id === ideStore.activeTabId);

  if (subPage === 'editor') {
    return (
      <div className="h-full flex flex-col">
        {/* File tabs */}
        {ideStore.openTabs.length > 0 && (
          <div className="flex items-center border-b border-border bg-muted/30 overflow-x-auto">
            {ideStore.openTabs.map(tab => (
              <div
                key={tab.id}
                className={`flex items-center px-3 py-1.5 text-xs font-mono cursor-pointer border-r border-border
                  ${ideStore.activeTabId === tab.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                onClick={() => ideStore.setActiveTabId(tab.id)}
              >
                {tab.name}
                {tab.modified && <span className="text-primary ml-1">●</span>}
              </div>
            ))}
          </div>
        )}
        <div className="flex-1">
          {activeTab ? (
            <Editor
              height="100%"
              language={activeTab.language || 'typescript'}
              value={activeTab.content}
              onChange={v => v !== undefined && activeTab && ideStore.updateTabContent(activeTab.id, v)}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: true, scale: 0.8 },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                bracketPairColorization: { enabled: true },
                padding: { top: 8 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Code className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                <p className="text-sm font-mono text-muted-foreground">No file open</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm font-mono text-muted-foreground">{subPage} view</p>
    </div>
  );
};

export default CenterWorkspace;
