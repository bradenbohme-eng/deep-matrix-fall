// DAG Visualization - Interactive task dependency graph using React Flow
// Shows task execution flow, dependencies, and real-time status

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
} from 'lucide-react';
import type { Task, DAGState, DAGNode as DAGNodeType, DAGEdge } from '@/lib/orchestration/types';

// ============================================================================
// TYPES
// ============================================================================

interface DAGVisualizationProps {
  tasks: Map<string, Task>;
  dagState: DAGState;
  activeTaskId?: string;
  onTaskSelect?: (taskId: string) => void;
  className?: string;
}

interface TaskNodeData extends Record<string, unknown> {
  task: Task;
  isActive: boolean;
  depth: number;
}

type TaskNode = Node<TaskNodeData>;

// ============================================================================
// CUSTOM NODE COMPONENT
// ============================================================================

const TaskNodeComponent: React.FC<NodeProps<TaskNode>> = ({ data, selected }) => {
  const { task, isActive } = data;

  const getStatusIcon = () => {
    switch (task.status) {
      case 'done':
        return <CheckCircle className="w-4 h-4 text-[hsl(var(--chart-2))]" />;
      case 'active':
        return <Play className="w-4 h-4 text-primary animate-pulse" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4 text-[hsl(var(--chart-4))]" />;
      case 'canceled':
        return <Pause className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'done':
        return 'border-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2))]/10';
      case 'active':
        return 'border-primary bg-primary/20 shadow-lg shadow-primary/20';
      case 'failed':
        return 'border-destructive bg-destructive/10';
      case 'blocked':
        return 'border-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4))]/10';
      case 'canceled':
        return 'border-muted bg-muted/20';
      default:
        return 'border-border bg-background';
    }
  };

  const getPriorityBadge = () => {
    if (task.priority >= 80) {
      return <Badge variant="destructive" className="text-[9px] px-1 py-0">P{task.priority}</Badge>;
    }
    if (task.priority >= 50) {
      return <Badge variant="default" className="text-[9px] px-1 py-0">P{task.priority}</Badge>;
    }
    return <Badge variant="secondary" className="text-[9px] px-1 py-0">P{task.priority}</Badge>;
  };

  return (
    <div
      className={`
        min-w-[160px] max-w-[200px] rounded-lg border-2 p-2 transition-all duration-200
        ${getStatusColor()}
        ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        ${isActive ? 'animate-pulse' : ''}
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-primary border-2 border-background"
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        {getStatusIcon()}
        <span className="text-xs font-bold truncate flex-1">{task.title}</span>
        {getPriorityBadge()}
      </div>

      {/* Status & Info */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="uppercase">{task.status}</span>
        {task.retry_count > 0 && (
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            {task.retry_count}
          </span>
        )}
      </div>

      {/* Dependencies indicator */}
      {task.dependencies.length > 0 && (
        <div className="mt-1 text-[9px] text-muted-foreground">
          {task.dependencies.length} dependencies
        </div>
      )}

      {/* Subtasks indicator */}
      {task.subtask_ids.length > 0 && (
        <div className="mt-1 text-[9px] text-muted-foreground">
          {task.subtask_ids.length} subtasks
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-primary border-2 border-background"
      />
    </div>
  );
};

// ============================================================================
// NODE TYPES
// ============================================================================

const nodeTypes = {
  task: TaskNodeComponent,
};

// ============================================================================
// LAYOUT ALGORITHM
// ============================================================================

function layoutNodes(
  tasks: Map<string, Task>,
  dagState: DAGState
): { nodes: TaskNode[]; edges: Edge[] } {
  const nodes: TaskNode[] = [];
  const edges: Edge[] = [];

  // Group tasks by depth
  const depthGroups = new Map<number, string[]>();
  let maxDepth = 0;

  for (const node of dagState.nodes) {
    if (!depthGroups.has(node.depth)) {
      depthGroups.set(node.depth, []);
    }
    depthGroups.get(node.depth)!.push(node.task_id);
    maxDepth = Math.max(maxDepth, node.depth);
  }

  // Position nodes in layers
  const horizontalSpacing = 280;
  const verticalSpacing = 100;

  for (let depth = 0; depth <= maxDepth; depth++) {
    const taskIds = depthGroups.get(depth) ?? [];
    const startY = -(taskIds.length - 1) * verticalSpacing / 2;

    taskIds.forEach((taskId, index) => {
      const task = tasks.get(taskId);
      if (!task) return;

      const dagNode = dagState.nodes.find(n => n.task_id === taskId);

      nodes.push({
        id: taskId,
        type: 'task',
        position: {
          x: depth * horizontalSpacing,
          y: startY + index * verticalSpacing,
        },
        data: {
          task,
          isActive: task.status === 'active',
          depth: dagNode?.depth ?? 0,
        },
      });
    });
  }

  // Create edges
  for (const edge of dagState.edges) {
    edges.push({
      id: `${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      type: 'smoothstep',
      animated: edge.type === 'requires',
      style: {
        stroke: edge.type === 'blocks' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
        strokeWidth: 2,
      },
    });
  }

  return { nodes, edges };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DAGVisualization: React.FC<DAGVisualizationProps> = ({
  tasks,
  dagState,
  activeTaskId,
  onTaskSelect,
  className,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Compute layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return layoutNodes(tasks, dagState);
  }, [tasks, dagState]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = layoutNodes(tasks, dagState);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [tasks, dagState, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
      onTaskSelect?.(node.id);
    },
    [onTaskSelect]
  );

  const selectedTask = selectedNode ? tasks.get(selectedNode) : null;

  // Stats
  const stats = useMemo(() => {
    const taskArray = Array.from(tasks.values());
    return {
      total: taskArray.length,
      completed: taskArray.filter(t => t.status === 'done').length,
      active: taskArray.filter(t => t.status === 'active').length,
      blocked: taskArray.filter(t => t.status === 'blocked').length,
      failed: taskArray.filter(t => t.status === 'failed').length,
      queued: taskArray.filter(t => t.status === 'queued').length,
    };
  }, [tasks]);

  if (tasks.size === 0) {
    return (
      <div className={`h-full flex items-center justify-center bg-background ${className}`}>
        <div className="text-center text-muted-foreground">
          <Info className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <div className="text-sm">No tasks in DAG</div>
          <div className="text-xs mt-1">Initialize the orchestration to see task flow</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex bg-background ${className}`}>
      {/* Main Graph */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="hsl(var(--border))" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="!bg-muted/80 !border-border !rounded-lg !shadow-lg"
          />
          <MiniMap
            nodeColor={(node) => {
              const task = (node.data as unknown as TaskNodeData)?.task;
              if (!task) return 'hsl(var(--muted-foreground))';
              switch (task.status) {
                case 'done': return 'hsl(var(--chart-2))';
                case 'active': return 'hsl(var(--primary))';
                case 'failed': return 'hsl(var(--destructive))';
                case 'blocked': return 'hsl(var(--chart-4))';
                default: return 'hsl(var(--muted-foreground))';
              }
            }}
            className="!bg-muted/80 !border-border !rounded-lg"
          />

          {/* Stats Panel */}
          <Panel position="top-left" className="!m-2">
            <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-2 space-y-1">
              <div className="text-xs font-bold text-muted-foreground">DAG STATUS</div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]" />
                  <span>Done: {stats.completed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>Active: {stats.active}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span>Queued: {stats.queued}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-4))]" />
                  <span>Blocked: {stats.blocked}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span>Failed: {stats.failed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Total: {stats.total}</span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Legend */}
          <Panel position="bottom-left" className="!m-2">
            <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-2">
              <div className="text-[10px] font-bold text-muted-foreground mb-1">EDGE TYPES</div>
              <div className="flex gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-primary" />
                  <span>Requires</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-destructive" />
                  <span>Blocks</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Task Details Sidebar */}
      {selectedTask && (
        <div className="w-64 border-l border-border bg-muted/30 flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="text-xs font-bold text-muted-foreground">TASK DETAILS</div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {/* Title */}
              <div>
                <div className="text-[10px] text-muted-foreground">Title</div>
                <div className="text-sm font-bold">{selectedTask.title}</div>
              </div>

              {/* Status */}
              <div>
                <div className="text-[10px] text-muted-foreground">Status</div>
                <Badge
                  variant={
                    selectedTask.status === 'done' ? 'default' :
                    selectedTask.status === 'failed' ? 'destructive' :
                    'secondary'
                  }
                >
                  {selectedTask.status}
                </Badge>
              </div>

              {/* Priority */}
              <div>
                <div className="text-[10px] text-muted-foreground">Priority</div>
                <div className="text-sm">{selectedTask.priority}</div>
              </div>

              {/* Prompt */}
              <div>
                <div className="text-[10px] text-muted-foreground">Prompt</div>
                <div className="text-xs bg-background/50 p-2 rounded max-h-24 overflow-y-auto">
                  {selectedTask.prompt}
                </div>
              </div>

              {/* Dependencies */}
              {selectedTask.dependencies.length > 0 && (
                <div>
                  <div className="text-[10px] text-muted-foreground">Dependencies ({selectedTask.dependencies.length})</div>
                  <div className="space-y-1">
                    {selectedTask.dependencies.map(depId => {
                      const dep = tasks.get(depId);
                      return (
                        <div key={depId} className="text-[10px] flex items-center gap-1">
                          {dep?.status === 'done' ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <Clock className="w-3 h-3 text-muted-foreground" />
                          )}
                          {dep?.title ?? depId.slice(0, 8)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* History */}
              <div>
                <div className="text-[10px] text-muted-foreground">History ({selectedTask.history.length})</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedTask.history.slice(-5).reverse().map((entry, i) => (
                    <div key={i} className="text-[10px] bg-background/50 p-1 rounded">
                      <div className="font-mono text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                      <div>{entry.field}: {String(entry.oldValue)} → {String(entry.newValue)}</div>
                      <div className="text-muted-foreground">{entry.reason}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Result */}
              {selectedTask.result && (
                <div>
                  <div className="text-[10px] text-muted-foreground">Result</div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Success:</span>
                      <span className={selectedTask.result.success ? 'text-green-500' : 'text-red-500'}>
                        {selectedTask.result.success ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{selectedTask.result.duration_ms}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tokens:</span>
                      <span>{selectedTask.result.tokens_used}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default DAGVisualization;
