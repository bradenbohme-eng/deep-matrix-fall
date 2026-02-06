// Orchestration Dashboard - Task Queue, Event Log, DAG View, Budget Meters

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface OrchestrationDashboardProps {
  className?: string;
}

const OrchestrationDashboard: React.FC<OrchestrationDashboardProps> = ({ className }) => {
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
    wall_time_ms: 0,
    output_tokens: 0,
    tool_calls: 0,
    iterations: 0,
    llm_calls: 0,
    risk_used: 0,
  });
  const [kernel, setKernel] = useState<OrchestrationKernel | null>(null);
  const [selectedTab, setSelectedTab] = useState('queue');

  // Initialize and subscribe to event store
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

  // Create demo kernel for testing
  const initializeKernel = useCallback(() => {
    const newKernel = createKernel({ budgets });
    setKernel(newKernel);
    
    // Add some demo tasks
    const store = getEventStore();
    const queue = new TaskQueue(store);
    
    // Task 1: No dependencies
    queue.createTask({
      title: 'Initialize Project Structure',
      prompt: 'Set up the base project structure with folders and config files',
      priority: 90,
      acceptance_criteria: [],
    });
    
    // Task 2: Depends on Task 1
    queue.createTask({
      title: 'Implement Core Module',
      prompt: 'Build the core functionality module with proper error handling',
      priority: 80,
      acceptance_criteria: [],
      dependencies: ['Initialize Project Structure'],
    });
    
    // Task 3: Depends on Task 2
    queue.createTask({
      title: 'Write Unit Tests',
      prompt: 'Create comprehensive unit tests for all core functions',
      priority: 70,
      acceptance_criteria: [],
      dependencies: ['Implement Core Module'],
    });

    // Task 4: Independent branch
    queue.createTask({
      title: 'Setup CI/CD Pipeline',
      prompt: 'Configure continuous integration and deployment pipelines',
      priority: 60,
      acceptance_criteria: [],
    });

    // Task 5: Depends on Tasks 3 and 4
    queue.createTask({
      title: 'Deploy to Staging',
      prompt: 'Deploy the application to staging environment',
      priority: 50,
      acceptance_criteria: [],
      dependencies: ['Write Unit Tests', 'Setup CI/CD Pipeline'],
    });
    
    setEvents(store.getEvents());
    const materializer = new StateMaterializer();
    const state = materializer.materialize(store.getEvents());
    setTasks(state.tasks);
    setDagState(queue.getDAGState());
  }, [budgets]);

  const handleStart = () => {
    setIsRunning(true);
    // Simulate progress
    const interval = setInterval(() => {
      setConsumed(prev => ({
        ...prev,
        iterations: Math.min(prev.iterations + 1, budgets.max_iterations),
        tool_calls: Math.min(prev.tool_calls + Math.random() > 0.7 ? 1 : 0, budgets.max_tool_calls),
        llm_calls: Math.min(prev.llm_calls + Math.random() > 0.8 ? 1 : 0, budgets.max_llm_calls),
      }));
    }, 1000);
    
    setTimeout(() => {
      clearInterval(interval);
      setIsRunning(false);
    }, 10000);
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
    setConsumed({
      wall_time_ms: 0,
      output_tokens: 0,
      tool_calls: 0,
      iterations: 0,
      llm_calls: 0,
      risk_used: 0,
    });
  };

  const toggleEventExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-500';
      case 'active': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      case 'blocked': return 'text-orange-500';
      default: return 'text-muted-foreground';
    }
  };

  const getEventIcon = (type: string) => {
    if (type.includes('TASK')) return <List className="w-3 h-3" />;
    if (type.includes('VERIFICATION')) return <CheckCircle className="w-3 h-3" />;
    if (type.includes('TOOL')) return <Zap className="w-3 h-3" />;
    if (type.includes('LLM')) return <Activity className="w-3 h-3" />;
    if (type.includes('ERROR')) return <XCircle className="w-3 h-3" />;
    return <GitBranch className="w-3 h-3" />;
  };

  const exportRun = () => {
    const store = getEventStore();
    const data = store.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orchestration-run-${data.runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-mono text-sm font-bold">ORCHESTRATION ENGINE</span>
          <Badge variant={isRunning ? 'default' : 'secondary'}>
            {isRunning ? 'RUNNING' : 'IDLE'}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={initializeKernel}
            className="h-7 text-xs"
          >
            <Upload className="w-3 h-3 mr-1" />
            Init Demo
          </Button>
          <Button
            size="sm"
            variant={isRunning ? 'destructive' : 'default'}
            onClick={isRunning ? handleStop : handleStart}
            className="h-7 text-xs"
          >
            {isRunning ? (
              <>
                <Square className="w-3 h-3 mr-1" />
                STOP
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                Run
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} className="h-7 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          <Button size="sm" variant="outline" onClick={exportRun} className="h-7 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Budget Meters */}
      <div className="grid grid-cols-6 gap-2 p-3 border-b border-border bg-muted/10">
        {[
          { label: 'Iterations', value: consumed.iterations, max: budgets.max_iterations },
          { label: 'Tool Calls', value: consumed.tool_calls, max: budgets.max_tool_calls },
          { label: 'LLM Calls', value: consumed.llm_calls, max: budgets.max_llm_calls },
          { label: 'Tokens', value: consumed.output_tokens, max: budgets.max_output_tokens },
          { label: 'Time (s)', value: Math.floor(consumed.wall_time_ms / 1000), max: Math.floor(budgets.max_wall_time_ms / 1000) },
          { label: 'Risk', value: consumed.risk_used, max: budgets.risk_budget },
        ].map((meter) => {
          const percentage = (meter.value / meter.max) * 100;
          const isWarning = percentage > 75;
          const isDanger = percentage > 90;
          
          return (
            <div key={meter.label} className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">{meter.label}</span>
                <span className={isDanger ? 'text-destructive' : isWarning ? 'text-yellow-500' : 'text-foreground'}>
                  {meter.value}/{meter.max}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={`h-1 ${isDanger ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-yellow-500' : ''}`}
              />
            </div>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-8">
          <TabsTrigger value="queue" className="text-xs h-7">
            <List className="w-3 h-3 mr-1" />
            Task Queue ({tasks.size})
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs h-7">
            <Activity className="w-3 h-3 mr-1" />
            Events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="dag" className="text-xs h-7">
            <GitBranch className="w-3 h-3 mr-1" />
            DAG View
          </TabsTrigger>
          <TabsTrigger value="results" className="text-xs h-7">
            <BarChart3 className="w-3 h-3 mr-1" />
            Test Results
          </TabsTrigger>
        </TabsList>

        {/* Task Queue */}
        <TabsContent value="queue" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {Array.from(tasks.values()).length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No tasks in queue. Click "Init Demo" to load sample tasks.
                </div>
              ) : (
                Array.from(tasks.values())
                  .sort((a, b) => b.priority - a.priority)
                  .map((task) => (
                    <div
                      key={task.task_id}
                      className="flex items-center p-2 rounded bg-muted/20 hover:bg-muted/40 text-xs font-mono"
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(task.status)}`} />
                      <div className="flex-1">
                        <div className="font-bold">{task.title}</div>
                        <div className="text-muted-foreground truncate">{task.prompt}</div>
                      </div>
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        P{task.priority}
                      </Badge>
                      <Badge 
                        variant={task.status === 'done' ? 'default' : 'secondary'} 
                        className="ml-2 text-[10px]"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Event Log */}
        <TabsContent value="events" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {events.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No events recorded yet.
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.event_id}
                    className="rounded bg-muted/20 hover:bg-muted/40 text-xs font-mono"
                  >
                    <div 
                      className="flex items-center p-2 cursor-pointer"
                      onClick={() => toggleEventExpand(event.event_id)}
                    >
                      {expandedEvents.has(event.event_id) ? (
                        <ChevronDown className="w-3 h-3 mr-2 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3 h-3 mr-2 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground mr-2">
                        [{new Date(event.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className="mr-2">{getEventIcon(event.type)}</span>
                      <span className="text-primary">{event.type}</span>
                      <span className="ml-auto text-muted-foreground text-[10px]">
                        #{event.sequence}
                      </span>
                    </div>
                    {expandedEvents.has(event.event_id) && (
                      <div className="px-6 pb-2 text-muted-foreground">
                        <pre className="text-[10px] overflow-x-auto">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                        <div className="mt-1 text-[10px]">
                          Hash: {event.hash_self.slice(0, 8)}...
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* DAG View */}
        <TabsContent value="dag" className="flex-1 m-0 overflow-hidden">
          <DAGVisualization
            tasks={tasks}
            dagState={dagState}
            onTaskSelect={(taskId) => console.log('Selected task:', taskId)}
          />
        </TabsContent>

        {/* Test Results */}
        <TabsContent value="results" className="flex-1 m-0 overflow-hidden">
          <TestResultsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrchestrationDashboard;
