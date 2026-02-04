// Event Store - Append-only event log with hash chaining for tamper evidence
// Implements event sourcing pattern with snapshot support

import type {
  Event,
  EventType,
  EventPayload,
  Snapshot,
  UUID,
  Timestamp,
  Hash,
  QueueState,
  DAGState,
  ContextState,
  BudgetState,
  ArtifactIndex,
  RunMetadata,
  Task,
  Artifact,
  ContextItem,
  RunStatus,
} from './types';

// ============================================================================
// HASH UTILITIES
// ============================================================================

function generateHash(data: string): Hash {
  // Simple hash for browser compatibility (in production, use crypto.subtle)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

function generateUUID(): UUID {
  return crypto.randomUUID?.() ?? 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

// ============================================================================
// EVENT STORE CLASS
// ============================================================================

export class EventStore {
  private events: Event[] = [];
  private snapshots: Snapshot[] = [];
  private runId: UUID;
  private sequence: number = 0;
  private lastHash: Hash = '0000000000000000';
  private subscribers: Set<(event: Event) => void> = new Set();

  constructor(runId?: UUID) {
    this.runId = runId ?? generateUUID();
  }

  // --------------------------------------------------------------------------
  // Core Event Operations
  // --------------------------------------------------------------------------

  append(
    type: EventType,
    payload: EventPayload,
    options: {
      actor?: 'system' | 'user' | 'agent';
      taskId?: UUID;
      parentEventId?: UUID;
    } = {}
  ): Event {
    const event: Event = {
      event_id: generateUUID(),
      run_id: this.runId,
      timestamp: Date.now(),
      sequence: this.sequence++,
      type,
      payload,
      hash_prev: this.lastHash,
      hash_self: '', // Will be computed
      actor: options.actor ?? 'system',
      task_id: options.taskId,
      parent_event_id: options.parentEventId,
    };

    // Compute self hash including all fields
    const hashData = JSON.stringify({
      ...event,
      hash_self: undefined,
    });
    event.hash_self = generateHash(hashData);
    this.lastHash = event.hash_self;

    this.events.push(event);
    
    // Notify subscribers
    this.subscribers.forEach(cb => cb(event));

    return event;
  }

  getEvents(since?: number): Event[] {
    if (since === undefined) return [...this.events];
    return this.events.filter(e => e.sequence >= since);
  }

  getEventsByType(type: EventType): Event[] {
    return this.events.filter(e => e.type === type);
  }

  getEventsByTask(taskId: UUID): Event[] {
    return this.events.filter(e => e.task_id === taskId);
  }

  getLastEvent(): Event | undefined {
    return this.events[this.events.length - 1];
  }

  getEventCount(): number {
    return this.events.length;
  }

  getRunId(): UUID {
    return this.runId;
  }

  // --------------------------------------------------------------------------
  // Subscription
  // --------------------------------------------------------------------------

  subscribe(callback: (event: Event) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // --------------------------------------------------------------------------
  // Verification
  // --------------------------------------------------------------------------

  verifyChain(): { valid: boolean; brokenAt?: number; error?: string } {
    let prevHash = '0000000000000000';

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];

      // Check previous hash
      if (event.hash_prev !== prevHash) {
        return {
          valid: false,
          brokenAt: i,
          error: `Hash chain broken at sequence ${i}: expected prev ${prevHash}, got ${event.hash_prev}`,
        };
      }

      // Verify self hash
      const hashData = JSON.stringify({
        ...event,
        hash_self: undefined,
      });
      const computedHash = generateHash(hashData);
      if (event.hash_self !== computedHash) {
        return {
          valid: false,
          brokenAt: i,
          error: `Self hash mismatch at sequence ${i}: expected ${computedHash}, got ${event.hash_self}`,
        };
      }

      prevHash = event.hash_self;
    }

    return { valid: true };
  }

  // --------------------------------------------------------------------------
  // Snapshot Operations
  // --------------------------------------------------------------------------

  createSnapshot(state: {
    queueState: QueueState;
    dagState: DAGState;
    contextState: ContextState;
    budgetState: BudgetState;
    artifactsIndex: ArtifactIndex;
    runMetadata: RunMetadata;
  }): Snapshot {
    const snapshot: Snapshot = {
      snapshot_id: generateUUID(),
      run_id: this.runId,
      timestamp: Date.now(),
      event_sequence: this.sequence - 1,
      queue_state: state.queueState,
      dag_state: state.dagState,
      context_state: state.contextState,
      budget_state: state.budgetState,
      artifacts_index: state.artifactsIndex,
      run_metadata: state.runMetadata,
      hash: '',
    };

    // Compute snapshot hash
    snapshot.hash = generateHash(JSON.stringify(snapshot));
    this.snapshots.push(snapshot);

    // Record snapshot creation event
    this.append('SNAPSHOT_CREATED', { snapshot_id: snapshot.snapshot_id });

    return snapshot;
  }

  getLatestSnapshot(): Snapshot | undefined {
    return this.snapshots[this.snapshots.length - 1];
  }

  getSnapshotAt(sequence: number): Snapshot | undefined {
    // Find the latest snapshot before or at the given sequence
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].event_sequence <= sequence) {
        return this.snapshots[i];
      }
    }
    return undefined;
  }

  // --------------------------------------------------------------------------
  // Replay
  // --------------------------------------------------------------------------

  replay(toSequence?: number): Event[] {
    const targetSequence = toSequence ?? this.sequence - 1;
    return this.events.filter(e => e.sequence <= targetSequence);
  }

  // --------------------------------------------------------------------------
  // Export/Import
  // --------------------------------------------------------------------------

  export(): {
    runId: UUID;
    events: Event[];
    snapshots: Snapshot[];
    metadata: {
      exportedAt: Timestamp;
      eventCount: number;
      snapshotCount: number;
      chainValid: boolean;
    };
  } {
    const chainCheck = this.verifyChain();
    return {
      runId: this.runId,
      events: [...this.events],
      snapshots: [...this.snapshots],
      metadata: {
        exportedAt: Date.now(),
        eventCount: this.events.length,
        snapshotCount: this.snapshots.length,
        chainValid: chainCheck.valid,
      },
    };
  }

  static import(data: ReturnType<EventStore['export']>): EventStore {
    const store = new EventStore(data.runId);
    store.events = [...data.events];
    store.snapshots = [...data.snapshots];
    store.sequence = data.events.length;
    store.lastHash = data.events[data.events.length - 1]?.hash_self ?? '0000000000000000';
    return store;
  }

  // --------------------------------------------------------------------------
  // Clear (for testing)
  // --------------------------------------------------------------------------

  clear(): void {
    this.events = [];
    this.snapshots = [];
    this.sequence = 0;
    this.lastHash = '0000000000000000';
  }
}

// ============================================================================
// STATE MATERIALIZER
// ============================================================================

export class StateMaterializer {
  private tasks: Map<UUID, Task> = new Map();
  private artifacts: Map<UUID, Artifact> = new Map();
  private context: ContextItem[] = [];
  private budgetConsumed = {
    wall_time_ms: 0,
    output_tokens: 0,
    tool_calls: 0,
    iterations: 0,
    llm_calls: 0,
    risk_used: 0,
  };

  materialize(events: Event[]): {
    tasks: Map<UUID, Task>;
    artifacts: Map<UUID, Artifact>;
    context: ContextItem[];
    budgetConsumed: typeof this.budgetConsumed;
  } {
    this.tasks.clear();
    this.artifacts.clear();
    this.context = [];
    this.budgetConsumed = {
      wall_time_ms: 0,
      output_tokens: 0,
      tool_calls: 0,
      iterations: 0,
      llm_calls: 0,
      risk_used: 0,
    };

    for (const event of events) {
      this.applyEvent(event);
    }

    return {
      tasks: new Map(this.tasks),
      artifacts: new Map(this.artifacts),
      context: [...this.context],
      budgetConsumed: { ...this.budgetConsumed },
    };
  }

  private applyEvent(event: Event): void {
    switch (event.type) {
      case 'TASK_CREATED': {
        const task = event.payload as unknown as Task;
        this.tasks.set(task.task_id, task);
        break;
      }
      case 'TASK_UPDATED': {
        const { task_id, updates } = event.payload as { task_id: UUID; updates: Partial<Task> };
        const existing = this.tasks.get(task_id);
        if (existing) {
          this.tasks.set(task_id, { ...existing, ...updates });
        }
        break;
      }
      case 'TASK_COMPLETED':
      case 'TASK_FAILED': {
        const { task_id, result } = event.payload as { task_id: UUID; result: unknown };
        const existing = this.tasks.get(task_id);
        if (existing) {
          this.tasks.set(task_id, {
            ...existing,
            status: event.type === 'TASK_COMPLETED' ? 'done' : 'failed',
            completed_at: event.timestamp,
            result: result as Task['result'],
          });
        }
        break;
      }
      case 'TOOL_CALLED': {
        this.budgetConsumed.tool_calls++;
        break;
      }
      case 'LLM_CALLED': {
        this.budgetConsumed.llm_calls++;
        break;
      }
      case 'LLM_RESULT': {
        const { tokens } = event.payload as { tokens?: number };
        if (tokens) {
          this.budgetConsumed.output_tokens += tokens;
        }
        break;
      }
      case 'ACTION_EXECUTED': {
        this.budgetConsumed.iterations++;
        break;
      }
      case 'CONTEXT_UPDATED': {
        const { items } = event.payload as { items: ContextItem[] };
        this.context = items;
        break;
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalEventStore: EventStore | null = null;

export function getEventStore(runId?: UUID): EventStore {
  if (!globalEventStore || (runId && globalEventStore.getRunId() !== runId)) {
    globalEventStore = new EventStore(runId);
  }
  return globalEventStore;
}

export function resetEventStore(): void {
  globalEventStore = null;
}
