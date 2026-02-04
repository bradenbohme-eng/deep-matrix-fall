// Orchestration System Types - Event-Sourced Autonomous AI Engine
// Ground rules: event-sourced truth, replayability, hard budgets, safe autonomy

// ============================================================================
// CORE IDENTIFIERS
// ============================================================================

export type UUID = string;
export type Timestamp = number; // Unix ms
export type Hash = string; // SHA-256 hex

// ============================================================================
// TASK TYPES
// ============================================================================

export type TaskStatus = 
  | 'queued' 
  | 'active' 
  | 'blocked' 
  | 'done' 
  | 'failed' 
  | 'canceled';

export type TaskPriority = number; // 0-100, higher = more urgent

export interface AcceptanceCriterion {
  id: string;
  type: 'deterministic' | 'rubric';
  description: string;
  check: DeterministicCheck | RubricCheck;
  required: boolean;
  weight: number; // 0-1 for scoring
}

export interface DeterministicCheck {
  kind: 'schema' | 'regex' | 'contains' | 'not_contains' | 'word_limit' | 'custom';
  params: Record<string, unknown>;
}

export interface RubricCheck {
  kind: 'quality' | 'completeness' | 'consistency' | 'relevance';
  threshold: number; // 0-1
  evaluator: 'llm' | 'rule';
}

export interface TaskHistoryEntry {
  timestamp: Timestamp;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
  actor: 'system' | 'user' | 'agent';
}

export interface Task {
  task_id: UUID;
  title: string;
  prompt: string;
  acceptance_criteria: AcceptanceCriterion[];
  dependencies: UUID[]; // task_ids that must complete first
  priority: TaskPriority;
  status: TaskStatus;
  context_refs: ContextRef[];
  history: TaskHistoryEntry[];
  created_at: Timestamp;
  started_at?: Timestamp;
  completed_at?: Timestamp;
  parent_task_id?: UUID; // for split tasks
  subtask_ids: UUID[]; // for merged/split tracking
  assigned_agent?: string;
  retry_count: number;
  max_retries: number;
  result?: TaskResult;
  metadata: Record<string, unknown>;
}

export interface TaskResult {
  success: boolean;
  output: unknown;
  artifacts: ArtifactRef[];
  verification_results: VerificationResult[];
  duration_ms: number;
  tokens_used: number;
  error?: string;
}

export interface ContextRef {
  type: 'artifact' | 'event' | 'memory' | 'constraint' | 'file';
  id: UUID;
  relevance: number; // 0-1
}

export interface ArtifactRef {
  id: UUID;
  name: string;
  type: string;
  version: number;
  hash: Hash;
}

// ============================================================================
// EVENT TYPES (Event Sourcing)
// ============================================================================

export type EventType =
  | 'RUN_STARTED'
  | 'RUN_STOPPED'
  | 'RUN_COMPLETED'
  | 'PLAN_CREATED'
  | 'PLAN_UPDATED'
  | 'ACTION_PLANNED'
  | 'ACTION_EXECUTED'
  | 'ACTION_FAILED'
  | 'TOOL_CALLED'
  | 'TOOL_RESULT'
  | 'LLM_CALLED'
  | 'LLM_RESULT'
  | 'VERIFICATION_RUN'
  | 'VERIFICATION_PASSED'
  | 'VERIFICATION_FAILED'
  | 'AUDIT_NOTE'
  | 'CHECKPOINT_CREATED'
  | 'QUEUE_MUTATION'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'SNAPSHOT_CREATED'
  | 'BUDGET_TICK'
  | 'BUDGET_WARNING'
  | 'BUDGET_EXHAUSTED'
  | 'CONTEXT_UPDATED'
  | 'CONTEXT_DRIFT_DETECTED'
  | 'ERROR_RAISED'
  | 'STOP_REQUESTED'
  | 'STOP_ACKNOWLEDGED'
  | 'PERMISSION_REQUESTED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_DENIED';

export interface Event {
  event_id: UUID;
  run_id: UUID;
  timestamp: Timestamp;
  sequence: number; // monotonic within run
  type: EventType;
  payload: EventPayload;
  hash_prev: Hash;
  hash_self: Hash;
  actor: 'system' | 'user' | 'agent';
  task_id?: UUID;
  parent_event_id?: UUID;
}

export type EventPayload = Record<string, unknown>;

// Specific payload types for type safety
export interface RunStartedPayload {
  config: RunConfig;
  initial_queue: UUID[];
  budgets: Budgets;
}

export interface ActionExecutedPayload {
  action_type: string;
  input: unknown;
  output: unknown;
  duration_ms: number;
  tokens_used?: number;
}

export interface ToolCalledPayload {
  tool_name: string;
  args: unknown;
  call_id: UUID;
}

export interface ToolResultPayload {
  call_id: UUID;
  tool_name: string;
  result: unknown;
  error?: string;
  duration_ms: number;
}

export interface VerificationPayload {
  criterion_id: string;
  check_type: string;
  input: unknown;
  expected?: unknown;
  actual?: unknown;
  passed: boolean;
  score?: number;
  details?: string;
}

export interface QueueMutationPayload {
  mutation_type: 'add' | 'remove' | 'split' | 'merge' | 'reprioritize' | 'reorder' | 'block' | 'unblock';
  affected_tasks: UUID[];
  justification: string;
  before_state: { priorities: Record<UUID, number>; statuses: Record<UUID, TaskStatus> };
  after_state: { priorities: Record<UUID, number>; statuses: Record<UUID, TaskStatus> };
}

export interface CheckpointPayload {
  reason: 'periodic' | 'budget_threshold' | 'stop_request' | 'error' | 'task_complete';
  snapshot_id: UUID;
  summary: string;
  queue_state: QueueState;
  budget_state: BudgetState;
}

// ============================================================================
// SNAPSHOT TYPES
// ============================================================================

export interface Snapshot {
  snapshot_id: UUID;
  run_id: UUID;
  timestamp: Timestamp;
  event_sequence: number; // last event included
  queue_state: QueueState;
  dag_state: DAGState;
  context_state: ContextState;
  budget_state: BudgetState;
  artifacts_index: ArtifactIndex;
  run_metadata: RunMetadata;
  hash: Hash;
}

export interface QueueState {
  tasks: Map<UUID, Task> | Record<UUID, Task>;
  active_task_id?: UUID;
  completed_count: number;
  failed_count: number;
  total_count: number;
}

export interface DAGState {
  nodes: DAGNode[];
  edges: DAGEdge[];
  roots: UUID[]; // tasks with no dependencies
  leaves: UUID[]; // tasks with no dependents
  ready: UUID[]; // tasks ready to execute
}

export interface DAGNode {
  task_id: UUID;
  status: TaskStatus;
  priority: TaskPriority;
  depth: number; // longest path from any root
}

export interface DAGEdge {
  from: UUID; // dependency
  to: UUID; // dependent
  type: 'requires' | 'suggests' | 'blocks';
}

export interface ContextState {
  pinned: ContextItem[];
  working_set: ContextItem[];
  long_term_refs: UUID[];
  total_tokens: number;
  max_tokens: number;
}

export interface ContextItem {
  id: UUID;
  type: 'constraint' | 'definition' | 'artifact' | 'summary' | 'memory';
  content: string;
  tokens: number;
  priority: number;
  pinned: boolean;
  added_at: Timestamp;
  expires_at?: Timestamp;
}

export interface ArtifactIndex {
  artifacts: Map<UUID, Artifact> | Record<UUID, Artifact>;
  by_name: Record<string, UUID[]>; // name -> versions
  by_type: Record<string, UUID[]>;
}

export interface Artifact {
  id: UUID;
  name: string;
  type: string;
  content: unknown;
  version: number;
  created_at: Timestamp;
  created_by_task?: UUID;
  hash: Hash;
  size_bytes: number;
  metadata: Record<string, unknown>;
}

export interface RunMetadata {
  run_id: UUID;
  started_at: Timestamp;
  status: RunStatus;
  mode: AutonomyMode;
  agent_id: string;
  project_id?: string;
  config: RunConfig;
}

// ============================================================================
// BUDGET & AUTONOMY TYPES
// ============================================================================

export interface Budgets {
  max_wall_time_ms: number;
  max_output_tokens: number;
  max_tool_calls: number;
  max_iterations: number;
  max_llm_calls: number;
  risk_budget: number; // 0-100, decremented by risky actions
  checkpoint_interval: number; // actions between checkpoints
}

export interface BudgetState {
  budgets: Budgets;
  consumed: {
    wall_time_ms: number;
    output_tokens: number;
    tool_calls: number;
    iterations: number;
    llm_calls: number;
    risk_used: number;
  };
  remaining: {
    wall_time_ms: number;
    output_tokens: number;
    tool_calls: number;
    iterations: number;
    llm_calls: number;
    risk_remaining: number;
  };
  warnings_issued: string[];
  exhausted: string[]; // which budgets are exhausted
  last_checkpoint_at: number; // iteration count
}

export type AutonomyMode = 'manual' | 'supervised' | 'autonomous';

export type RunStatus = 
  | 'initializing'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'completed'
  | 'failed'
  | 'budget_exhausted';

export interface RunConfig {
  mode: AutonomyMode;
  budgets: Budgets;
  risk_policy: RiskPolicy;
  verification_policy: VerificationPolicy;
  context_policy: ContextPolicy;
}

export interface RiskPolicy {
  require_approval: RiskAction[];
  auto_approve: RiskAction[];
  deny: RiskAction[];
  risk_costs: Record<RiskAction, number>;
}

export type RiskAction = 
  | 'delete_artifact'
  | 'overwrite_artifact'
  | 'external_api_call'
  | 'file_write'
  | 'file_delete'
  | 'database_write'
  | 'send_notification'
  | 'execute_code';

export interface VerificationPolicy {
  verify_before_complete: boolean;
  retry_on_failure: boolean;
  max_verification_retries: number;
  spawn_fix_task_on_failure: boolean;
  require_all_criteria: boolean;
}

export interface ContextPolicy {
  max_pinned_tokens: number;
  max_working_tokens: number;
  summarize_after_actions: number;
  drift_detection_enabled: boolean;
  drift_threshold: number;
}

// ============================================================================
// VERIFICATION TYPES
// ============================================================================

export interface VerificationResult {
  criterion_id: string;
  passed: boolean;
  score: number; // 0-1
  check_type: 'deterministic' | 'rubric';
  details: string;
  evidence?: unknown;
  timestamp: Timestamp;
}

export interface AuditResult {
  task_id: UUID;
  overall_score: number;
  criteria_results: VerificationResult[];
  flags: AuditFlag[];
  recommendations: string[];
  timestamp: Timestamp;
}

export interface AuditFlag {
  type: 'contradiction' | 'incomplete' | 'bluff' | 'drift' | 'policy_violation';
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  evidence: string[];
}

// ============================================================================
// TEST HARNESS TYPES
// ============================================================================

export interface TestSpec {
  test_id: string;
  name: string;
  description: string;
  category: TestCategory;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  initial_context: InitialContext;
  initial_queue: TaskSpec[];
  queued_injections: QueueInjection[];
  budgets: Budgets;
  must_do: MustCondition[];
  must_not_do: MustNotCondition[];
  acceptance_criteria: TestAcceptanceCriterion[];
  scoring_rubric: ScoringRubric;
  expected_artifacts?: ExpectedArtifact[];
  expected_events?: ExpectedEvent[];
  timeout_ms: number;
  tags: string[];
}

export type TestCategory =
  | 'orchestration'
  | 'context_management'
  | 'verification'
  | 'interruption'
  | 'budget_compliance'
  | 'contradiction_handling'
  | 'tool_discipline'
  | 'self_improvement'
  | 'regression'
  | 'drift_detection'
  | 'partial_completion'
  | 'failure_handling';

export interface InitialContext {
  text?: string;
  files?: Record<string, string>;
  pinned_constraints?: string[];
  memory_items?: ContextItem[];
}

export interface TaskSpec {
  title: string;
  prompt: string;
  acceptance_criteria: AcceptanceCriterion[];
  dependencies?: string[]; // titles of other tasks
  priority: TaskPriority;
}

export interface QueueInjection {
  trigger: InjectionTrigger;
  action: InjectionAction;
}

export interface InjectionTrigger {
  type: 'after_action' | 'after_time' | 'after_event' | 'on_task_complete';
  value: number | string;
}

export interface InjectionAction {
  type: 'add_task' | 'cancel_task' | 'reprioritize' | 'inject_constraint' | 'trigger_stop';
  payload: unknown;
}

export interface MustCondition {
  type: 'event_occurs' | 'artifact_created' | 'task_completed' | 'constraint_respected';
  description: string;
  check: unknown;
}

export interface MustNotCondition {
  type: 'event_occurs' | 'budget_exceeded' | 'constraint_violated' | 'bluff_detected';
  description: string;
  check: unknown;
}

export interface TestAcceptanceCriterion {
  id: string;
  description: string;
  weight: number;
  evaluator: 'deterministic' | 'rubric';
  params: unknown;
}

export interface ScoringRubric {
  dimensions: ScoringDimension[];
  passing_threshold: number;
  weights: Record<string, number>;
}

export interface ScoringDimension {
  name: string;
  description: string;
  max_score: number;
  evaluator: 'auto' | 'manual';
}

export interface ExpectedArtifact {
  name: string;
  type?: string;
  content_match?: string | RegExp;
  schema?: unknown;
}

export interface ExpectedEvent {
  type: EventType;
  payload_match?: Record<string, unknown>;
  must_occur_before?: string; // event type
  must_occur_after?: string;
}

export interface TestResult {
  test_id: string;
  passed: boolean;
  score: number;
  max_score: number;
  score_breakdown: Record<string, number>;
  must_do_results: { condition: MustCondition; passed: boolean; evidence?: string }[];
  must_not_do_results: { condition: MustNotCondition; passed: boolean; evidence?: string }[];
  criteria_results: { criterion: TestAcceptanceCriterion; passed: boolean; score: number }[];
  run_id: UUID;
  event_log_path?: string;
  artifacts_path?: string;
  diff_report?: string;
  duration_ms: number;
  error?: string;
}

// ============================================================================
// ORCHESTRATION KERNEL TYPES
// ============================================================================

export interface KernelState {
  run_id: UUID;
  status: RunStatus;
  mode: AutonomyMode;
  current_snapshot: Snapshot;
  pending_actions: PlannedAction[];
  stop_requested: boolean;
  last_checkpoint_sequence: number;
}

export interface PlannedAction {
  action_id: UUID;
  type: ActionType;
  task_id?: UUID;
  description: string;
  risk_level: 'none' | 'low' | 'medium' | 'high';
  estimated_tokens?: number;
  requires_approval: boolean;
  planned_at: Timestamp;
}

export type ActionType =
  | 'llm_call'
  | 'tool_call'
  | 'verify'
  | 'audit'
  | 'checkpoint'
  | 'queue_mutate'
  | 'context_update'
  | 'artifact_create'
  | 'artifact_update'
  | 'complete_task'
  | 'fail_task'
  | 'spawn_fix_task';

// ============================================================================
// API CONTRACTS
// ============================================================================

export interface OrchestrationAPI {
  // Run management
  startRun(config: RunConfig, initialQueue: TaskSpec[]): Promise<UUID>;
  stopRun(runId: UUID): Promise<Snapshot>;
  pauseRun(runId: UUID): Promise<void>;
  resumeRun(runId: UUID): Promise<void>;
  getRunStatus(runId: UUID): Promise<KernelState>;
  
  // Task management
  addTask(runId: UUID, task: TaskSpec): Promise<UUID>;
  cancelTask(runId: UUID, taskId: UUID, reason: string): Promise<void>;
  reprioritize(runId: UUID, taskId: UUID, newPriority: TaskPriority, reason: string): Promise<void>;
  
  // Event/state access
  getEvents(runId: UUID, since?: number): Promise<Event[]>;
  getSnapshot(runId: UUID): Promise<Snapshot>;
  replayRun(runId: UUID, toSequence?: number): Promise<Snapshot>;
  
  // Approvals
  approveAction(runId: UUID, actionId: UUID): Promise<void>;
  denyAction(runId: UUID, actionId: UUID, reason: string): Promise<void>;
  
  // Test harness
  runTest(testId: string): Promise<TestResult>;
  runSuite(suiteId: string): Promise<TestResult[]>;
  listTests(): Promise<TestSpec[]>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface Logger {
  debug(msg: string, data?: unknown): void;
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
}

export interface HashFunction {
  (data: string): Hash;
}

export interface Clock {
  now(): Timestamp;
}

// Default budgets for easy configuration
export const DEFAULT_BUDGETS: Budgets = {
  max_wall_time_ms: 5 * 60 * 1000, // 5 minutes
  max_output_tokens: 50000,
  max_tool_calls: 100,
  max_iterations: 50,
  max_llm_calls: 30,
  risk_budget: 100,
  checkpoint_interval: 5,
};

export const DEFAULT_RISK_POLICY: RiskPolicy = {
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
};

export const DEFAULT_VERIFICATION_POLICY: VerificationPolicy = {
  verify_before_complete: true,
  retry_on_failure: true,
  max_verification_retries: 2,
  spawn_fix_task_on_failure: true,
  require_all_criteria: false,
};

export const DEFAULT_CONTEXT_POLICY: ContextPolicy = {
  max_pinned_tokens: 4000,
  max_working_tokens: 8000,
  summarize_after_actions: 10,
  drift_detection_enabled: true,
  drift_threshold: 0.3,
};
