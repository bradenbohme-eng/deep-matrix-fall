// Task Queue + DAG Engine
// Manages task dependencies, priorities, and queue mutations with full audit trail

import type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskSpec,
  AcceptanceCriterion,
  UUID,
  Timestamp,
  DAGState,
  DAGNode,
  DAGEdge,
  QueueState,
  QueueMutationPayload,
  TaskHistoryEntry,
  ContextRef,
  TaskResult,
} from './types';
import { EventStore } from './eventStore';

// ============================================================================
// UTILITIES
// ============================================================================

function generateUUID(): UUID {
  return crypto.randomUUID?.() ?? 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

// ============================================================================
// TASK QUEUE CLASS
// ============================================================================

export class TaskQueue {
  private tasks: Map<UUID, Task> = new Map();
  private dag: DAGState = { nodes: [], edges: [], roots: [], leaves: [], ready: [] };
  private activeTaskId?: UUID;
  private eventStore: EventStore;
  private titleToId: Map<string, UUID> = new Map();

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  // --------------------------------------------------------------------------
  // Task Creation
  // --------------------------------------------------------------------------

  createTask(spec: TaskSpec, dependencyTitles?: string[]): Task {
    const taskId = generateUUID();
    const now = Date.now();

    // Resolve dependency titles to IDs
    const dependencies: UUID[] = [];
    if (dependencyTitles) {
      for (const title of dependencyTitles) {
        const depId = this.titleToId.get(title);
        if (depId) dependencies.push(depId);
      }
    }
    if (spec.dependencies) {
      for (const title of spec.dependencies) {
        const depId = this.titleToId.get(title);
        if (depId) dependencies.push(depId);
      }
    }

    const task: Task = {
      task_id: taskId,
      title: spec.title,
      prompt: spec.prompt,
      acceptance_criteria: spec.acceptance_criteria,
      dependencies,
      priority: spec.priority,
      status: 'queued',
      context_refs: [],
      history: [{
        timestamp: now,
        field: 'status',
        oldValue: null,
        newValue: 'queued',
        reason: 'Task created',
        actor: 'system',
      }],
      created_at: now,
      subtask_ids: [],
      retry_count: 0,
      max_retries: 3,
      metadata: {},
    };

    // Check if blocked by dependencies
    if (dependencies.length > 0) {
      const allDepsComplete = dependencies.every(depId => {
        const dep = this.tasks.get(depId);
        return dep?.status === 'done';
      });
      if (!allDepsComplete) {
        task.status = 'blocked';
        task.history.push({
          timestamp: now,
          field: 'status',
          oldValue: 'queued',
          newValue: 'blocked',
          reason: 'Blocked by incomplete dependencies',
          actor: 'system',
        });
      }
    }

    this.tasks.set(taskId, task);
    this.titleToId.set(spec.title, taskId);
    this.rebuildDAG();

    // Log event
    this.eventStore.append('TASK_CREATED', { task_id: taskId, title: task.title, priority: task.priority }, { taskId });

    return task;
  }

  // --------------------------------------------------------------------------
  // Task State Transitions
  // --------------------------------------------------------------------------

  activateTask(taskId: UUID): Task | null {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'queued') return null;

    const now = Date.now();
    task.status = 'active';
    task.started_at = now;
    task.history.push({
      timestamp: now,
      field: 'status',
      oldValue: 'queued',
      newValue: 'active',
      reason: 'Task activated for execution',
      actor: 'system',
    });

    this.activeTaskId = taskId;
    this.eventStore.append('TASK_UPDATED', { task_id: taskId, updates: { status: 'active' } }, { taskId });

    return task;
  }

  completeTask(taskId: UUID, result: TaskResult): Task | null {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'active') return null;

    const now = Date.now();
    task.status = 'done';
    task.completed_at = now;
    task.result = result;
    task.history.push({
      timestamp: now,
      field: 'status',
      oldValue: 'active',
      newValue: 'done',
      reason: result.success ? 'Task completed successfully' : 'Task completed with issues',
      actor: 'system',
    });

    if (this.activeTaskId === taskId) {
      this.activeTaskId = undefined;
    }

    // Unblock dependent tasks
    this.updateBlockedTasks();
    this.rebuildDAG();

    this.eventStore.append('TASK_COMPLETED', { task_id: taskId, result }, { taskId });

    return task;
  }

  failTask(taskId: UUID, error: string): Task | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const now = Date.now();
    const oldStatus = task.status;
    task.status = 'failed';
    task.completed_at = now;
    task.result = {
      success: false,
      output: null,
      artifacts: [],
      verification_results: [],
      duration_ms: task.started_at ? now - task.started_at : 0,
      tokens_used: 0,
      error,
    };
    task.history.push({
      timestamp: now,
      field: 'status',
      oldValue: oldStatus,
      newValue: 'failed',
      reason: `Task failed: ${error}`,
      actor: 'system',
    });

    if (this.activeTaskId === taskId) {
      this.activeTaskId = undefined;
    }

    this.rebuildDAG();
    this.eventStore.append('TASK_FAILED', { task_id: taskId, error }, { taskId });

    return task;
  }

  cancelTask(taskId: UUID, reason: string): Task | null {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'done' || task.status === 'failed') return null;

    const now = Date.now();
    const oldStatus = task.status;
    task.status = 'canceled';
    task.history.push({
      timestamp: now,
      field: 'status',
      oldValue: oldStatus,
      newValue: 'canceled',
      reason,
      actor: 'user',
    });

    if (this.activeTaskId === taskId) {
      this.activeTaskId = undefined;
    }

    this.rebuildDAG();
    this.logMutation('remove', [taskId], reason);

    return task;
  }

  // --------------------------------------------------------------------------
  // Queue Mutations (with justification logging)
  // --------------------------------------------------------------------------

  reprioritize(taskId: UUID, newPriority: TaskPriority, justification: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    const oldPriority = task.priority;
    const beforeState = this.captureState([taskId]);

    task.priority = newPriority;
    task.history.push({
      timestamp: Date.now(),
      field: 'priority',
      oldValue: oldPriority,
      newValue: newPriority,
      reason: justification,
      actor: 'agent',
    });

    this.rebuildDAG();
    this.logMutation('reprioritize', [taskId], justification, beforeState);

    return true;
  }

  splitTask(taskId: UUID, subtaskSpecs: TaskSpec[], justification: string): Task[] {
    const parentTask = this.tasks.get(taskId);
    if (!parentTask) return [];

    const beforeState = this.captureState([taskId]);
    const subtasks: Task[] = [];

    for (const spec of subtaskSpecs) {
      const subtask = this.createTask(spec);
      subtask.parent_task_id = taskId;
      parentTask.subtask_ids.push(subtask.task_id);
      subtasks.push(subtask);
    }

    // Block parent until all subtasks complete
    parentTask.dependencies.push(...subtasks.map(t => t.task_id));
    parentTask.status = 'blocked';
    parentTask.history.push({
      timestamp: Date.now(),
      field: 'split',
      oldValue: null,
      newValue: subtasks.map(t => t.task_id),
      reason: justification,
      actor: 'agent',
    });

    this.rebuildDAG();
    this.logMutation('split', [taskId, ...subtasks.map(t => t.task_id)], justification, beforeState);

    return subtasks;
  }

  mergeTasks(taskIds: UUID[], mergedSpec: TaskSpec, justification: string): Task | null {
    if (taskIds.length < 2) return null;

    const beforeState = this.captureState(taskIds);
    
    // Create merged task
    const mergedTask = this.createTask(mergedSpec);
    
    // Cancel original tasks
    for (const taskId of taskIds) {
      const task = this.tasks.get(taskId);
      if (task) {
        task.status = 'canceled';
        task.history.push({
          timestamp: Date.now(),
          field: 'merge',
          oldValue: null,
          newValue: mergedTask.task_id,
          reason: justification,
          actor: 'agent',
        });
      }
    }

    this.rebuildDAG();
    this.logMutation('merge', [...taskIds, mergedTask.task_id], justification, beforeState);

    return mergedTask;
  }

  addDependency(taskId: UUID, dependsOn: UUID, justification: string): boolean {
    const task = this.tasks.get(taskId);
    const depTask = this.tasks.get(dependsOn);
    if (!task || !depTask) return false;

    if (task.dependencies.includes(dependsOn)) return false;

    const beforeState = this.captureState([taskId]);
    task.dependencies.push(dependsOn);

    // Check if this creates a cycle
    if (this.hasCycle()) {
      task.dependencies.pop();
      return false;
    }

    // Update blocked status
    if (depTask.status !== 'done') {
      task.status = 'blocked';
      task.history.push({
        timestamp: Date.now(),
        field: 'dependencies',
        oldValue: task.dependencies.slice(0, -1),
        newValue: task.dependencies,
        reason: justification,
        actor: 'agent',
      });
    }

    this.rebuildDAG();
    this.logMutation('block', [taskId, dependsOn], justification, beforeState);

    return true;
  }

  // --------------------------------------------------------------------------
  // Task Selection
  // --------------------------------------------------------------------------

  getNextTask(): Task | null {
    if (this.activeTaskId) return null; // One task at a time

    // Get ready tasks (queued with all dependencies satisfied)
    const readyTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'queued')
      .filter(t => this.dag.ready.includes(t.task_id))
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    return readyTasks[0] ?? null;
  }

  getActiveTask(): Task | null {
    return this.activeTaskId ? this.tasks.get(this.activeTaskId) ?? null : null;
  }

  // --------------------------------------------------------------------------
  // Query Methods
  // --------------------------------------------------------------------------

  getTask(taskId: UUID): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  getQueueState(): QueueState {
    return {
      tasks: Object.fromEntries(this.tasks),
      active_task_id: this.activeTaskId,
      completed_count: this.getTasksByStatus('done').length,
      failed_count: this.getTasksByStatus('failed').length,
      total_count: this.tasks.size,
    };
  }

  getDAGState(): DAGState {
    return { ...this.dag };
  }

  // --------------------------------------------------------------------------
  // DAG Operations
  // --------------------------------------------------------------------------

  private rebuildDAG(): void {
    const nodes: DAGNode[] = [];
    const edges: DAGEdge[] = [];
    const roots: UUID[] = [];
    const leaves: UUID[] = [];
    const ready: UUID[] = [];

    // Build nodes and edges
    for (const task of this.tasks.values()) {
      nodes.push({
        task_id: task.task_id,
        status: task.status,
        priority: task.priority,
        depth: 0, // Will be computed
      });

      for (const depId of task.dependencies) {
        edges.push({
          from: depId,
          to: task.task_id,
          type: 'requires',
        });
      }
    }

    // Find roots (no incoming edges)
    const hasIncoming = new Set(edges.map(e => e.to));
    for (const node of nodes) {
      if (!hasIncoming.has(node.task_id)) {
        roots.push(node.task_id);
      }
    }

    // Find leaves (no outgoing edges)
    const hasOutgoing = new Set(edges.map(e => e.from));
    for (const node of nodes) {
      if (!hasOutgoing.has(node.task_id)) {
        leaves.push(node.task_id);
      }
    }

    // Compute depths using topological sort
    const depths = new Map<UUID, number>();
    const computeDepth = (taskId: UUID, visited: Set<UUID>): number => {
      if (depths.has(taskId)) return depths.get(taskId)!;
      if (visited.has(taskId)) return 0; // Cycle detected
      visited.add(taskId);

      const task = this.tasks.get(taskId);
      if (!task || task.dependencies.length === 0) {
        depths.set(taskId, 0);
        return 0;
      }

      const maxDepDepth = Math.max(
        ...task.dependencies.map(d => computeDepth(d, visited))
      );
      const depth = maxDepDepth + 1;
      depths.set(taskId, depth);
      return depth;
    };

    for (const node of nodes) {
      node.depth = computeDepth(node.task_id, new Set());
    }

    // Find ready tasks (queued with all deps done)
    for (const task of this.tasks.values()) {
      if (task.status !== 'queued') continue;
      const allDepsDone = task.dependencies.every(depId => {
        const dep = this.tasks.get(depId);
        return dep?.status === 'done';
      });
      if (allDepsDone) {
        ready.push(task.task_id);
      }
    }

    this.dag = { nodes, edges, roots, leaves, ready };
  }

  private hasCycle(): boolean {
    const visited = new Set<UUID>();
    const recursionStack = new Set<UUID>();

    const dfs = (taskId: UUID): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const task = this.tasks.get(taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (!visited.has(depId)) {
            if (dfs(depId)) return true;
          } else if (recursionStack.has(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const taskId of this.tasks.keys()) {
      if (!visited.has(taskId)) {
        if (dfs(taskId)) return true;
      }
    }

    return false;
  }

  private updateBlockedTasks(): void {
    for (const task of this.tasks.values()) {
      if (task.status !== 'blocked') continue;

      const allDepsDone = task.dependencies.every(depId => {
        const dep = this.tasks.get(depId);
        return dep?.status === 'done';
      });

      if (allDepsDone) {
        task.status = 'queued';
        task.history.push({
          timestamp: Date.now(),
          field: 'status',
          oldValue: 'blocked',
          newValue: 'queued',
          reason: 'All dependencies completed',
          actor: 'system',
        });
        this.eventStore.append('TASK_UPDATED', { task_id: task.task_id, updates: { status: 'queued' } }, { taskId: task.task_id });
      }
    }
  }

  // --------------------------------------------------------------------------
  // Mutation Logging
  // --------------------------------------------------------------------------

  private captureState(taskIds: UUID[]): QueueMutationPayload['before_state'] {
    const priorities: Record<UUID, number> = {};
    const statuses: Record<UUID, TaskStatus> = {};

    for (const taskId of taskIds) {
      const task = this.tasks.get(taskId);
      if (task) {
        priorities[taskId] = task.priority;
        statuses[taskId] = task.status;
      }
    }

    return { priorities, statuses };
  }

  private logMutation(
    type: QueueMutationPayload['mutation_type'],
    affectedTasks: UUID[],
    justification: string,
    beforeState?: QueueMutationPayload['before_state']
  ): void {
    const before = beforeState ?? this.captureState(affectedTasks);
    const after = this.captureState(affectedTasks);

    const payload = {
      mutation_type: type,
      affected_tasks: affectedTasks,
      justification,
      before_state: before,
      after_state: after,
    };

    this.eventStore.append('QUEUE_MUTATION', payload);
  }

  // --------------------------------------------------------------------------
  // Import/Export
  // --------------------------------------------------------------------------

  export(): { tasks: Task[]; dag: DAGState } {
    return {
      tasks: Array.from(this.tasks.values()),
      dag: this.dag,
    };
  }

  import(data: { tasks: Task[] }): void {
    this.tasks.clear();
    this.titleToId.clear();

    for (const task of data.tasks) {
      this.tasks.set(task.task_id, task);
      this.titleToId.set(task.title, task.task_id);
    }

    this.rebuildDAG();
  }

  clear(): void {
    this.tasks.clear();
    this.titleToId.clear();
    this.activeTaskId = undefined;
    this.dag = { nodes: [], edges: [], roots: [], leaves: [], ready: [] };
  }
}
