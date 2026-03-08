// Orchestration Dashboard — Restyled to Canon Design System
// All colors via semantic tokens, surface hierarchy, material effects

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  XCircle,
  Zap,
  GitBranch,
  List,
  Activity,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  getEventStore,
  StateMaterializer,
  TaskQueue,
  OrchestrationKernel,
  createKernel,
  type Event,
  type Task,
  type Budgets,
  type DAGState,
} from '@/lib/orchestration';
import DAGVisualization from './DAGVisualization';
import TestResultsViewer from './TestResultsViewer';

const OrchestrationDashboard: React.FC<{ className?: string }> = ({ className }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Map<string, Task>>(new Map());
  const [dagState, setDagState] = useState<DAGState>({ nodes: [], edges: [], roots: [], leaves: [], ready: [] });
  const [isRunning, setIsRunning] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [budgets] = useState<Budgets>({
    max_wall_time_ms: 300000,
    max_output_tokens: 100000,
    max_tool_calls: 50,
    max_iterations: 100,
    max_llm_calls: 20,
    risk_budget: 10,
    checkpoint_interval: 5,
  });
  const [consumed, setConsumed] = useState({
    wall_time_ms: 0, output_tokens: 0, tool_calls: 0,
    iterations: 0, llm_calls: 0, risk_used: 0,
  });
  const [kernel, setKernel] = useState<OrchestrationKernel | null>(null);
  const [selectedTab, setSelectedTab] = useState('queue');

  useEffect(() => {
    const store = getEventStore();
    setEvents(store.getEvents());
    const materializer = new StateMaterializer();
    const state = materializer.materialize(store.getEvents());
    setTasks(state.tasks);
    setConsumed(state.budgetConsumed);
    const unsubscribe = store.subscribe((event) => {
      setEvents(prev => [...prev, event]);
      const newState = materializer.materialize([...store.getEvents()]);
      setTasks(newState.tasks);
      setConsumed(newState.budgetConsumed);
    });
    return unsubscribe;
  }, []);

  const initializeKernel = useCallback(() => {
    const newKernel = createKernel({ budgets });
    setKernel(newKernel);
    const store = getEventStore();
    const queue = new TaskQueue(store);
    queue.createTask({ title: 'Initialize Project Structure', prompt: 'Set up base project', priority: 90, acceptance_criteria: [] });
    queue.createTask({ title: 'Implement Core Module', prompt: 'Build core functionality', priority: 80, acceptance_criteria: [], dependencies: ['Initialize Project Structure'] });
    queue.createTask({ title: 'Write Unit Tests', prompt: 'Create comprehensive tests', priority: 70, acceptance_criteria: [], dependencies: ['Implement Core Module'] });
    queue.createTask({ title: 'Setup CI/CD Pipeline', prompt: 'Configure CI/CD', priority: 60, acceptance_criteria: [] });
    queue.createTask({ title: 'Deploy to Staging', prompt: 'Deploy to staging', priority: 50, acceptance_criteria: [], dependencies: ['Write Unit Tests', 'Setup CI/CD Pipeline'] });
    setEvents(store.getEvents());
    const materializer = new StateMaterializer();
    const state = materializer.materialize(store.getEvents());
    setTasks(state.tasks);
    setDagState(queue.getDAGState());
  }, [budgets]);

  const handleStart = () => {
    setIsRunning(true);
    const interval = setInterval(() => {
      setConsumed(prev => ({
        ...prev,
        iterations: Math.min(prev.iterations + 1, budgets.max_iterations),
        tool_calls: Math.min(prev.tool_calls + (Math.random() > 0.7 ? 1 : 0), budgets.max_tool_calls),
        llm_calls: Math.min(prev.llm_calls + (Math.random() > 0.8 ? 1 : 0), budgets.max_llm_calls),
      }));
    }, 1000);
    setTimeout(() => { clearInterval(interval); setIsRunning(false); }, 10000);
  };

  const handleStop = () => {
    setIsRunning(false);
    const store = getEventStore();
    store.append('RUN_STOPPED', { reason: 'User initiated STOP' });
    setEvents(store.getEvents());
  };

  const handleReset = () => {
    const store = getEventStore();
    store.clear();
    setEvents([]);
    setTasks(new Map());
    setConsumed({ wall_time_ms: 0, output_tokens: 0, tool_calls: 0, iterations: 0, llm_calls: 0, risk_used: 0 });
  };

  const exportRun = () => {
    const store = getEventStore();
    const data = store.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `orchestration-run-${data.runId}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      done: 'text-success', active: 'text-warning', failed: 'text-destructive',
      blocked: 'text-warning', queued: 'text-muted-foreground',
    };
    return map[s] || 'text-muted-foreground';
  };

  const statusBg = (s: string) => {
    const map: Record<string, string> = {
      done: 'bg-success/15 text-success border-success/20',
      active: 'bg-warning/15 text-warning border-warning/20',
      failed: 'bg-destructive/15 text-destructive border-destructive/20',
      blocked: 'bg-warning/10 text-warning border-warning/15',
      queued: 'bg-muted text-muted-foreground border-border',
    };
    return map[s] || 'bg-muted text-muted-foreground border-border';
  };

  const TABS = [
    { id: 'queue', icon: List, label: 'Queue', count: tasks.size },
    { id: 'events', icon: Activity, label: 'Events', count: events.length },
    { id: 'dag', icon: GitBranch, label: 'DAG' },
    { id: 'results', icon: BarChart3, label: 'Results' },
  ];

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border surface-raised">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-display uppercase tracking-widest text-foreground">
              Orchestration
            </span>
          </div>
          <span className={`badge-${isRunning ? 'live' : 'warn'}`}>
            {isRunning ? '● RUNNING' : 'IDLE'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <ActionButton icon={Upload} label="Init" onClick={initializeKernel} />
          <ActionButton
            icon={isRunning ? Square : Play}
            label={isRunning ? 'STOP' : 'Run'}
            onClick={isRunning ? handleStop : handleStart}
            variant={isRunning ? 'danger' : 'primary'}
          />
          <ActionButton icon={RotateCcw} label="Reset" onClick={handleReset} />
          <ActionButton icon={Download} label="Export" onClick={exportRun} />
        </div>
      </div>

      {/* ─── Budget Meters ─── */}
      <div className="grid grid-cols-6 gap-3 px-4 py-2.5 border-b border-border">
        {[
          { label: 'Iterations', val: consumed.iterations, max: budgets.max_iterations, icon: Clock },
          { label: 'Tool Calls', val: consumed.tool_calls, max: budgets.max_tool_calls, icon: Zap },
          { label: 'LLM Calls', val: consumed.llm_calls, max: budgets.max_llm_calls, icon: Activity },
          { label: 'Tokens', val: consumed.output_tokens, max: budgets.max_output_tokens, icon: List },
          { label: 'Time (s)', val: Math.floor(consumed.wall_time_ms / 1000), max: Math.floor(budgets.max_wall_time_ms / 1000), icon: Clock },
          { label: 'Risk', val: consumed.risk_used, max: budgets.risk_budget, icon: AlertTriangle },
        ].map(m => {
          const pct = (m.val / m.max) * 100;
          const isDanger = pct > 90;
          const isWarn = pct > 75;
          return (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{m.label}</span>
                <span className={`text-[9px] font-mono ${isDanger ? 'text-destructive' : isWarn ? 'text-warning' : 'text-foreground'}`}>
                  {m.val}/{m.max}
                </span>
              </div>
              <div className="h-1 bg-surface-1 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isDanger ? 'bg-destructive' : isWarn ? 'bg-warning' : 'bg-primary'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, pct)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Tab Bar ─── */}
      <div className="flex items-center gap-0.5 px-3 py-1 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTab(t.id)}
            className={`tab-button ${selectedTab === t.id ? 'active' : ''}`}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
            {t.count !== undefined && (
              <span className="text-[9px] opacity-60">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {selectedTab === 'queue' && (
              <ScrollArea className="h-full custom-scrollbar">
                <div className="p-3 space-y-1.5">
                  {tasks.size === 0 ? (
                    <EmptyState text='No tasks. Click "Init" to load demo.' />
                  ) : (
                    Array.from(tasks.values())
                      .sort((a, b) => b.priority - a.priority)
                      .map(task => (
                        <motion.div
                          key={task.task_id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="surface-raised rounded-md p-3 interactive-ghost cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${statusColor(task.status).replace('text-', 'bg-')}`} />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-mono text-foreground">{task.title}</span>
                              <p className="text-[10px] font-mono text-muted-foreground truncate">{task.prompt}</p>
                            </div>
                            <span className="text-[9px] font-mono text-muted-foreground">P{task.priority}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${statusBg(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </ScrollArea>
            )}

            {selectedTab === 'events' && (
              <ScrollArea className="h-full custom-scrollbar">
                <div className="p-3 space-y-1">
                  {events.length === 0 ? (
                    <EmptyState text="No events recorded." />
                  ) : (
                    events.map(event => (
                      <div key={event.event_id} className="surface-raised rounded-md text-xs font-mono overflow-hidden">
                        <div
                          className="flex items-center px-3 py-2 cursor-pointer interactive-ghost"
                          onClick={() => {
                            setExpandedEvents(prev => {
                              const next = new Set(prev);
                              next.has(event.event_id) ? next.delete(event.event_id) : next.add(event.event_id);
                              return next;
                            });
                          }}
                        >
                          {expandedEvents.has(event.event_id) ? (
                            <ChevronDown className="w-3 h-3 mr-2 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-3 h-3 mr-2 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground mr-3 text-[10px]">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-primary">{event.type}</span>
                          <span className="ml-auto text-muted-foreground text-[9px]">#{event.sequence}</span>
                        </div>
                        <AnimatePresence>
                          {expandedEvents.has(event.event_id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-8 pb-2.5 text-[10px] text-muted-foreground border-t border-border/50 pt-2">
                                <pre className="overflow-x-auto whitespace-pre-wrap">
                                  {JSON.stringify(event.payload, null, 2)}
                                </pre>
                                <div className="mt-1.5 text-[9px]">
                                  Hash: <span className="text-primary/60">{event.hash_self.slice(0, 12)}...</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}

            {selectedTab === 'dag' && (
              <DAGVisualization
                tasks={tasks}
                dagState={dagState}
                onTaskSelect={(id) => console.log('Selected:', id)}
              />
            )}

            {selectedTab === 'results' && <TestResultsViewer />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Helpers ───

const ActionButton: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
}> = ({ icon: Icon, label, onClick, variant = 'default' }) => {
  const styles = {
    default: 'surface-raised interactive-ghost text-muted-foreground hover:text-foreground',
    primary: 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20',
    danger: 'bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/20',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${styles[variant]}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Activity className="w-8 h-8 text-muted-foreground opacity-15 mb-3" />
    <span className="text-xs font-mono text-muted-foreground">{text}</span>
  </div>
);

export default OrchestrationDashboard;
