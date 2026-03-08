// CenterWorkspace — Canon §9: The Thing Itself
// "The center is sacred. It must show the thing the user is actually working on."

import React, { useMemo } from 'react';
import type { WorldPage, SubPage } from './types';
import OrchestrationDashboard from '@/components/hq/OrchestrationDashboard';
import DAGVisualization from '@/components/hq/DAGVisualization';
import TestHarnessPanel from '@/components/hq/TestHarnessPanel';
import EvolutionCenter from './EvolutionCenter';
import Editor from '@monaco-editor/react';
import { useIDEStore } from '@/components/ide/useIDEStore';
import type { Task, DAGState } from '@/lib/orchestration/types';
import {
  Activity,
  Workflow,
  ScrollText,
  FlaskConical,
  Code,
  Eye,
  GitCompare,
} from 'lucide-react';

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
  const demoTasks = useMemo(() => {
    const tasks = new Map<string, Task>();
    const ids = ['t1', 't2', 't3', 't4', 't5'];
    const titles = ['Analyze constraints', 'Generate draft', 'Verify output', 'Run checks', 'Emit checkpoint'];
    const statuses: Array<Task['status']> = ['done', 'active', 'queued', 'queued', 'queued'];
    const priorities = [80, 90, 70, 60, 50];

    ids.forEach((id, i) => {
      tasks.set(id, {
        task_id: id,
        title: titles[i],
        prompt: '',
        acceptance_criteria: [],
        dependencies: i > 0 ? [ids[i - 1]] : [],
        priority: priorities[i],
        status: statuses[i],
        context_refs: [],
        history: [],
        created_at: Date.now(),
        subtask_ids: [],
        retry_count: 0,
        max_retries: 3,
        metadata: {},
      });
    });
    return tasks;
  }, []);

  const demoDag = useMemo((): DAGState => {
    const ids = Array.from(demoTasks.keys());
    return {
      nodes: ids.map((id, i) => ({
        task_id: id,
        status: demoTasks.get(id)!.status,
        priority: demoTasks.get(id)!.priority,
        depth: i,
      })),
      edges: ids.slice(1).map((id, i) => ({
        from: ids[i],
        to: id,
        type: 'requires' as const,
      })),
      roots: [ids[0]],
      leaves: [ids[ids.length - 1]],
      ready: ids.filter(id => demoTasks.get(id)!.status === 'queued' && 
        demoTasks.get(id)!.dependencies.every(d => demoTasks.get(d)?.status === 'done')),
    };
  }, [demoTasks]);

  switch (subPage) {
    case 'command':
      return <OrchestrationDashboard />;
    case 'pipeline':
      return <DAGVisualization tasks={demoTasks} dagState={demoDag} />;
    case 'events':
      return <EventLogCenter />;
    case 'tests':
      return <TestHarnessPanel />;
    default:
      return null;
  }
};

// ─── Event Log Center ───
const EventLogCenter: React.FC = () => {
  const events = [
    { id: 'e1', type: 'RUN_STARTED', ts: '2026-03-07T10:00:00Z', hash: '0000...0000', payload: '{"run_id":"r-001"}' },
    { id: 'e2', type: 'PLAN_CREATED', ts: '2026-03-07T10:00:01Z', hash: '7f3a...e2b1', payload: '{"tasks":5}' },
    { id: 'e3', type: 'ACTION_EXECUTED', ts: '2026-03-07T10:00:04Z', hash: 'a1b2...c3d4', payload: '{"action":"extract_constraints"}' },
    { id: 'e4', type: 'VERIFICATION_PASSED', ts: '2026-03-07T10:00:08Z', hash: 'b2c3...d4e5', payload: '{"check":"schema_valid"}' },
    { id: 'e5', type: 'TOOL_CALLED', ts: '2026-03-07T10:00:12Z', hash: 'c3d4...e5f6', payload: '{"tool":"search_memory","args":{}}' },
    { id: 'e6', type: 'BUDGET_TICK', ts: '2026-03-07T10:00:15Z', hash: 'd4e5...f6a7', payload: '{"iterations":34,"tokens":18200}' },
    { id: 'e7', type: 'CHECKPOINT_CREATED', ts: '2026-03-07T10:00:16Z', hash: 'e5f6...a7b8', payload: '{"snapshot_id":"snap-001"}' },
  ];

  const typeColors: Record<string, string> = {
    RUN_STARTED: 'text-info',
    PLAN_CREATED: 'text-primary',
    ACTION_EXECUTED: 'text-foreground',
    VERIFICATION_PASSED: 'text-success',
    VERIFICATION_FAILED: 'text-destructive',
    TOOL_CALLED: 'text-warning',
    BUDGET_TICK: 'text-muted-foreground',
    CHECKPOINT_CREATED: 'text-info',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-border flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Event Log — Hash-Chained Audit Trail
        </span>
        <span className="badge-live ml-auto">{events.length} events</span>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="px-4 py-2 w-36">Timestamp</th>
              <th className="px-4 py-2 w-44">Type</th>
              <th className="px-4 py-2 w-28">Hash</th>
              <th className="px-4 py-2">Payload</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-surface-3 transition-colors cursor-pointer">
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(e.ts).toLocaleTimeString()}
                </td>
                <td className={`px-4 py-2 ${typeColors[e.type] || ''}`}>
                  {e.type}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{e.hash}</td>
                <td className="px-4 py-2 text-muted-foreground truncate max-w-xs">{e.payload}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
          <div className="flex items-center border-b border-border bg-surface-1 overflow-x-auto">
            {ideStore.openTabs.map(tab => (
              <div
                key={tab.id}
                className={`flex items-center px-3 py-1.5 text-xs font-mono cursor-pointer border-r border-border
                  ${ideStore.activeTabId === tab.id ? 'bg-surface-2 text-foreground' : 'text-muted-foreground hover:bg-surface-2'}`}
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
