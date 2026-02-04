// Orchestration Kernel - Main execution loop and state machine
// Implements: load snapshot → select task → plan → execute → verify → checkpoint

import type {
  KernelState,
  RunStatus,
  AutonomyMode,
  Snapshot,
  Task,
  TaskSpec,
  PlannedAction,
  ActionType,
  UUID,
  Timestamp,
  RunConfig,
  BudgetState,
  QueueState,
  DAGState,
  ContextState,
  ArtifactIndex,
  RunMetadata,
  ContextItem,
  TaskResult,
  VerificationResult,
  CheckpointPayload,
} from './types';
import { EventStore, StateMaterializer, getEventStore } from './eventStore';
import { TaskQueue } from './taskQueue';
import { AutonomyGovernor } from './autonomyGovernor';
import { Verifier, Auditor } from './verifier';
import { ContextManager } from './contextManager';

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
// KERNEL STATE DEFAULTS
// ============================================================================

function createDefaultSnapshot(runId: UUID, config: RunConfig): Snapshot {
  return {
    snapshot_id: generateUUID(),
    run_id: runId,
    timestamp: Date.now(),
    event_sequence: 0,
    queue_state: { tasks: {}, completed_count: 0, failed_count: 0, total_count: 0 },
    dag_state: { nodes: [], edges: [], roots: [], leaves: [], ready: [] },
    context_state: { pinned: [], working_set: [], long_term_refs: [], total_tokens: 0, max_tokens: 16000 },
    budget_state: {
      budgets: config.budgets,
      consumed: { wall_time_ms: 0, output_tokens: 0, tool_calls: 0, iterations: 0, llm_calls: 0, risk_used: 0 },
      remaining: { 
        wall_time_ms: config.budgets.max_wall_time_ms,
        output_tokens: config.budgets.max_output_tokens,
        tool_calls: config.budgets.max_tool_calls,
        iterations: config.budgets.max_iterations,
        llm_calls: config.budgets.max_llm_calls,
        risk_remaining: config.budgets.risk_budget 
      },
      warnings_issued: [],
      exhausted: [],
      last_checkpoint_at: 0,
    },
    artifacts_index: { artifacts: {}, by_name: {}, by_type: {} },
    run_metadata: {
      run_id: runId,
      started_at: Date.now(),
      status: 'initializing',
      mode: config.mode,
      agent_id: 'orchestration-kernel',
      config,
    },
    hash: '',
  };
}

// ============================================================================
// ORCHESTRATION KERNEL
// ============================================================================

export class OrchestrationKernel {
  private eventStore: EventStore;
  private taskQueue: TaskQueue;
  private governor: AutonomyGovernor;
  private verifier: Verifier;
  private auditor: Auditor;
  private contextManager: ContextManager;
  private materializer: StateMaterializer;

  private runId: UUID;
  private status: RunStatus = 'initializing';
  private mode: AutonomyMode;
  private config: RunConfig;
  private currentSnapshot: Snapshot;
  private pendingActions: PlannedAction[] = [];
  private stopRequested = false;
  private lastCheckpointSequence = 0;
  private subscribers: Set<(state: KernelState) => void> = new Set();

  // Execution hook (to be set by integrations)
  private executeAction?: (action: PlannedAction, task: Task | null) => Promise<{ output: unknown; tokens?: number }>;

  constructor(config: RunConfig) {
    this.runId = generateUUID();
    this.config = config;
    this.mode = config.mode;

    // Initialize components
    this.eventStore = getEventStore(this.runId);
    this.taskQueue = new TaskQueue(this.eventStore);
    this.governor = new AutonomyGovernor(this.eventStore, config);
    this.verifier = new Verifier(this.eventStore, config.verification_policy);
    this.auditor = new Auditor(this.eventStore);
    this.contextManager = new ContextManager(this.eventStore, config.context_policy);
    this.materializer = new StateMaterializer();

    // Create initial snapshot
    this.currentSnapshot = createDefaultSnapshot(this.runId, config);

    // Set up governor checkpoint callback
    this.governor.setCheckpointCallback(() => this.checkpoint('stop_request'));

    // Subscribe to events for real-time updates
    this.eventStore.subscribe((event) => {
      this.notifySubscribers();
    });
  }

  // --------------------------------------------------------------------------
  // Run Management
  // --------------------------------------------------------------------------

  async start(initialTasks: TaskSpec[]): Promise<void> {
    this.status = 'running';
    this.governor.startRun();

    // Log run started
    this.eventStore.append('RUN_STARTED', {
      config: this.config,
      initial_queue: initialTasks.map(t => t.title),
      budgets: this.config.budgets,
    });

    // Create initial tasks
    for (const spec of initialTasks) {
      this.taskQueue.createTask(spec);
    }

    // Start execution loop
    await this.runLoop();
  }

  async stop(): Promise<Snapshot> {
    this.stopRequested = true;
    this.governor.requestStop();

    // Create final checkpoint
    const checkpoint = this.checkpoint('stop_request');

    this.status = 'stopped';
    this.eventStore.append('RUN_STOPPED', {
      final_snapshot_id: checkpoint.snapshot_id,
      budget_state: this.governor.getState(),
      queue_state: this.taskQueue.getQueueState(),
    });

    this.governor.acknowledgeStop();
    return checkpoint;
  }

  pause(): void {
    this.status = 'paused';
    this.eventStore.append('AUDIT_NOTE', { note: 'Run paused by user' });
    this.notifySubscribers();
  }

  resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
      this.eventStore.append('AUDIT_NOTE', { note: 'Run resumed by user' });
      this.runLoop();
    }
  }

  // --------------------------------------------------------------------------
  // Main Execution Loop
  // --------------------------------------------------------------------------

  private async runLoop(): Promise<void> {
    while (this.status === 'running') {
      // Check if we can continue
      const canContinue = this.governor.canContinue();
      if (!canContinue.allowed) {
        this.status = this.stopRequested ? 'stopped' : 'budget_exhausted';
        this.eventStore.append('AUDIT_NOTE', { note: `Loop ended: ${canContinue.reason}` });
        break;
      }

      // Tick budgets
      this.governor.tick();

      // Check for STOP
      if (this.governor.isStopRequested()) {
        this.status = 'stopping';
        break;
      }

      // Check for pending approvals in supervised/manual mode
      if (this.governor.getPendingApprovals().length > 0) {
        // Wait for approval (in real implementation, this would be async/event-driven)
        await this.waitForApprovals();
        continue;
      }

      // Select next task
      const task = this.taskQueue.getNextTask();
      if (!task) {
        // Check if all tasks complete
        const queueState = this.taskQueue.getQueueState();
        if (queueState.completed_count + queueState.failed_count >= queueState.total_count) {
          this.status = 'completed';
          this.eventStore.append('RUN_COMPLETED', {
            completed: queueState.completed_count,
            failed: queueState.failed_count,
            total: queueState.total_count,
          });
          break;
        }
        // All remaining tasks are blocked
        await this.delay(100);
        continue;
      }

      // Activate and execute task
      const activeTask = this.taskQueue.activateTask(task.task_id);
      if (activeTask) {
        await this.executeTask(activeTask);
      }

      // Checkpoint if needed
      if (this.governor.shouldCheckpoint()) {
        this.checkpoint('periodic');
      }

      // Small delay to prevent tight loop
      await this.delay(10);
    }

    // Final checkpoint
    if (this.status === 'completed' || this.status === 'stopped' || this.status === 'budget_exhausted') {
      this.checkpoint(this.status === 'stopped' ? 'stop_request' : 'task_complete');
    }
  }

  // --------------------------------------------------------------------------
  // Task Execution
  // --------------------------------------------------------------------------

  private async executeTask(task: Task): Promise<void> {
    const startTime = Date.now();
    let output: unknown = null;
    let tokensUsed = 0;

    try {
      // Plan action
      const action = this.planAction(task);
      this.pendingActions.push(action);

      // Check approval
      const approval = this.governor.evaluateAction(action);
      if (approval === 'denied') {
        throw new Error('Action denied by risk policy');
      }
      if (approval === 'pending') {
        return; // Will be processed after approval
      }

      // Execute action
      this.eventStore.append('ACTION_PLANNED', {
        action_id: action.action_id,
        type: action.type,
        description: action.description,
      }, { taskId: task.task_id });

      if (this.executeAction) {
        const result = await this.executeAction(action, task);
        output = result.output;
        tokensUsed = result.tokens ?? 0;

        // Consume budgets
        this.governor.consumeIteration();
        if (tokensUsed > 0) {
          this.governor.consumeTokens(tokensUsed);
        }
        if (action.type === 'tool_call') {
          this.governor.consumeToolCall();
        }
        if (action.type === 'llm_call') {
          this.governor.consumeLLMCall();
        }
      } else {
        // Simulate execution for testing
        output = { simulated: true, task: task.title };
        tokensUsed = 100;
        this.governor.consumeIteration();
        this.governor.consumeTokens(tokensUsed);
      }

      this.eventStore.append('ACTION_EXECUTED', {
        action_type: action.type,
        input: task.prompt,
        output,
        duration_ms: Date.now() - startTime,
        tokens_used: tokensUsed,
      }, { taskId: task.task_id });

      // Verify result
      const verification = await this.verifier.verify(task, output);

      // Create task result
      const taskResult: TaskResult = {
        success: verification.passed,
        output,
        artifacts: [],
        verification_results: verification.results,
        duration_ms: Date.now() - startTime,
        tokens_used: tokensUsed,
      };

      if (verification.passed) {
        this.taskQueue.completeTask(task.task_id, taskResult);
      } else {
        // Handle failure
        if (this.verifier.shouldSpawnFixTask() && task.retry_count < task.max_retries) {
          // Spawn fix task
          const fixTask = this.spawnFixTask(task, verification.results);
          this.eventStore.append('AUDIT_NOTE', {
            note: `Spawned fix task ${fixTask.task_id} for failed verification`,
            original_task: task.task_id,
          }, { taskId: task.task_id });

          // Update original task
          task.retry_count++;
          this.taskQueue.failTask(task.task_id, 'Verification failed, fix task spawned');
        } else {
          this.taskQueue.failTask(task.task_id, 'Verification failed after max retries');
        }
      }

      // Audit
      this.auditor.audit(task, verification.results);

      // Update context
      this.contextManager.addToWorkingSet({
        type: 'summary',
        content: `Task "${task.title}" ${verification.passed ? 'completed' : 'failed'}`,
        tokens: 50,
        priority: 0.5,
        pinned: false,
      });

      // Remove from pending
      this.pendingActions = this.pendingActions.filter(a => a.action_id !== action.action_id);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.eventStore.append('ERROR_RAISED', {
        error: errorMessage,
        task_id: task.task_id,
      }, { taskId: task.task_id });

      this.taskQueue.failTask(task.task_id, errorMessage);
    }
  }

  private planAction(task: Task): PlannedAction {
    return {
      action_id: generateUUID(),
      type: 'llm_call',
      task_id: task.task_id,
      description: `Execute task: ${task.title}`,
      risk_level: 'low',
      estimated_tokens: 1000,
      requires_approval: this.mode !== 'autonomous',
      planned_at: Date.now(),
    };
  }

  private spawnFixTask(originalTask: Task, failedResults: VerificationResult[]): Task {
    const failedCriteria = failedResults.filter(r => !r.passed);
    const fixSpec: TaskSpec = {
      title: `Fix: ${originalTask.title}`,
      prompt: `The previous attempt to "${originalTask.title}" failed verification.\n\nFailed criteria:\n${failedCriteria.map(r => `- ${r.criterion_id}: ${r.details}`).join('\n')}\n\nPlease fix these issues.`,
      acceptance_criteria: originalTask.acceptance_criteria,
      priority: originalTask.priority + 10, // Higher priority for fixes
    };

    return this.taskQueue.createTask(fixSpec, [originalTask.title]);
  }

  // --------------------------------------------------------------------------
  // Checkpoint
  // --------------------------------------------------------------------------

  checkpoint(reason: CheckpointPayload['reason']): Snapshot {
    const snapshot = this.eventStore.createSnapshot({
      queueState: this.taskQueue.getQueueState(),
      dagState: this.taskQueue.getDAGState(),
      contextState: this.contextManager.getState(),
      budgetState: this.governor.getState(),
      artifactsIndex: { artifacts: {}, by_name: {}, by_type: {} },
      runMetadata: {
        run_id: this.runId,
        started_at: this.currentSnapshot.run_metadata.started_at,
        status: this.status,
        mode: this.mode,
        agent_id: 'orchestration-kernel',
        config: this.config,
      },
    });

    this.currentSnapshot = snapshot;
    this.lastCheckpointSequence = snapshot.event_sequence;

    this.eventStore.append('CHECKPOINT_CREATED', {
      reason,
      snapshot_id: snapshot.snapshot_id,
      summary: `Checkpoint at iteration ${this.governor.getState().consumed.iterations}`,
    });

    this.notifySubscribers();
    return snapshot;
  }

  // --------------------------------------------------------------------------
  // Task Management API
  // --------------------------------------------------------------------------

  addTask(spec: TaskSpec): Task {
    const task = this.taskQueue.createTask(spec);
    this.eventStore.append('QUEUE_MUTATION', {
      mutation_type: 'add',
      affected_tasks: [task.task_id],
      justification: 'Task added via API',
      before_state: { priorities: {}, statuses: {} },
      after_state: { priorities: { [task.task_id]: task.priority }, statuses: { [task.task_id]: task.status } },
    });
    return task;
  }

  cancelTask(taskId: UUID, reason: string): boolean {
    const task = this.taskQueue.cancelTask(taskId, reason);
    return task !== null;
  }

  reprioritize(taskId: UUID, newPriority: number, reason: string): boolean {
    return this.taskQueue.reprioritize(taskId, newPriority, reason);
  }

  // --------------------------------------------------------------------------
  // Approval Management
  // --------------------------------------------------------------------------

  approveAction(actionId: UUID): boolean {
    return this.governor.approveAction(actionId);
  }

  denyAction(actionId: UUID, reason: string): boolean {
    return this.governor.denyAction(actionId, reason);
  }

  private async waitForApprovals(): Promise<void> {
    // In real implementation, this would be event-driven
    await this.delay(100);
  }

  // --------------------------------------------------------------------------
  // State Access
  // --------------------------------------------------------------------------

  getState(): KernelState {
    return {
      run_id: this.runId,
      status: this.status,
      mode: this.mode,
      current_snapshot: this.currentSnapshot,
      pending_actions: [...this.pendingActions],
      stop_requested: this.stopRequested,
      last_checkpoint_sequence: this.lastCheckpointSequence,
    };
  }

  getEvents(since?: number): ReturnType<EventStore['getEvents']> {
    return this.eventStore.getEvents(since);
  }

  getSnapshot(): Snapshot {
    return this.currentSnapshot;
  }

  getQueueState(): QueueState {
    return this.taskQueue.getQueueState();
  }

  getDAGState(): DAGState {
    return this.taskQueue.getDAGState();
  }

  getBudgetState(): BudgetState {
    return this.governor.getState();
  }

  // --------------------------------------------------------------------------
  // Replay
  // --------------------------------------------------------------------------

  replay(toSequence?: number): Snapshot {
    const events = this.eventStore.replay(toSequence);
    const state = this.materializer.materialize(events);

    // Reconstruct snapshot from materialized state
    const snapshot: Snapshot = {
      ...this.currentSnapshot,
      snapshot_id: generateUUID(),
      timestamp: Date.now(),
      event_sequence: toSequence ?? events.length - 1,
      queue_state: {
        tasks: Object.fromEntries(state.tasks),
        completed_count: Array.from(state.tasks.values()).filter(t => t.status === 'done').length,
        failed_count: Array.from(state.tasks.values()).filter(t => t.status === 'failed').length,
        total_count: state.tasks.size,
      },
      budget_state: {
        ...this.currentSnapshot.budget_state,
        consumed: state.budgetConsumed,
      },
    };

    return snapshot;
  }

  // --------------------------------------------------------------------------
  // Export
  // --------------------------------------------------------------------------

  export(): ReturnType<EventStore['export']> {
    return this.eventStore.export();
  }

  // --------------------------------------------------------------------------
  // Subscription
  // --------------------------------------------------------------------------

  subscribe(callback: (state: KernelState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    const state = this.getState();
    this.subscribers.forEach(cb => cb(state));
  }

  // --------------------------------------------------------------------------
  // Set Execution Hook
  // --------------------------------------------------------------------------

  setExecuteAction(fn: typeof this.executeAction): void {
    this.executeAction = fn;
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createKernel(config?: Partial<RunConfig>): OrchestrationKernel {
  const defaultConfig: RunConfig = {
    mode: config?.mode ?? 'supervised',
    budgets: config?.budgets ?? {
      max_wall_time_ms: 5 * 60 * 1000,
      max_output_tokens: 50000,
      max_tool_calls: 100,
      max_iterations: 50,
      max_llm_calls: 30,
      risk_budget: 100,
      checkpoint_interval: 5,
    },
    risk_policy: config?.risk_policy ?? {
      require_approval: ['delete_artifact', 'external_api_call', 'database_write'],
      auto_approve: ['file_write'],
      deny: [],
      risk_costs: {
        delete_artifact: 20,
        overwrite_artifact: 10,
        external_api_call: 15,
        file_write: 5,
        file_delete: 25,
        database_write: 15,
        send_notification: 10,
        execute_code: 30,
      },
    },
    verification_policy: config?.verification_policy ?? {
      verify_before_complete: true,
      retry_on_failure: true,
      max_verification_retries: 2,
      spawn_fix_task_on_failure: true,
      require_all_criteria: false,
    },
    context_policy: config?.context_policy ?? {
      max_pinned_tokens: 4000,
      max_working_tokens: 8000,
      summarize_after_actions: 10,
      drift_detection_enabled: true,
      drift_threshold: 0.3,
    },
  };

  return new OrchestrationKernel(defaultConfig);
}
