// Autonomy Governor - Budget enforcement, modes, and STOP semantics
// Hard constraints: never exceed budgets, STOP means immediate halt

import type {
  Budgets,
  BudgetState,
  AutonomyMode,
  RiskPolicy,
  RiskAction,
  PlannedAction,
  UUID,
  Timestamp,
  RunConfig,
  DEFAULT_BUDGETS,
  DEFAULT_RISK_POLICY,
} from './types';
import { EventStore } from './eventStore';

// ============================================================================
// BUDGET THRESHOLDS
// ============================================================================

const WARNING_THRESHOLDS = {
  wall_time: 0.8, // Warn at 80%
  tokens: 0.9,
  tool_calls: 0.85,
  iterations: 0.8,
  llm_calls: 0.85,
  risk: 0.7,
};

// ============================================================================
// AUTONOMY GOVERNOR CLASS
// ============================================================================

export class AutonomyGovernor {
  private mode: AutonomyMode = 'supervised';
  private budgets: Budgets;
  private consumed = {
    wall_time_ms: 0,
    output_tokens: 0,
    tool_calls: 0,
    iterations: 0,
    llm_calls: 0,
    risk_used: 0,
  };
  private startTime: Timestamp = 0;
  private stopRequested = false;
  private stopAcknowledged = false;
  private warningsIssued: Set<string> = new Set();
  private exhausted: Set<string> = new Set();
  private riskPolicy: RiskPolicy;
  private pendingApprovals: Map<UUID, PlannedAction> = new Map();
  private eventStore: EventStore;
  private checkpointCallback?: () => void;

  constructor(eventStore: EventStore, config?: Partial<RunConfig>) {
    this.eventStore = eventStore;
    this.budgets = config?.budgets ?? {
      max_wall_time_ms: 5 * 60 * 1000,
      max_output_tokens: 50000,
      max_tool_calls: 100,
      max_iterations: 50,
      max_llm_calls: 30,
      risk_budget: 100,
      checkpoint_interval: 5,
    };
    this.riskPolicy = config?.risk_policy ?? {
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
    this.mode = config?.mode ?? 'supervised';
  }

  // --------------------------------------------------------------------------
  // Mode Management
  // --------------------------------------------------------------------------

  setMode(mode: AutonomyMode): void {
    this.mode = mode;
    this.eventStore.append('AUDIT_NOTE', { 
      note: `Autonomy mode changed to: ${mode}`,
      previous_mode: this.mode,
    });
  }

  getMode(): AutonomyMode {
    return this.mode;
  }

  // --------------------------------------------------------------------------
  // Budget Management
  // --------------------------------------------------------------------------

  startRun(): void {
    this.startTime = Date.now();
    this.consumed = {
      wall_time_ms: 0,
      output_tokens: 0,
      tool_calls: 0,
      iterations: 0,
      llm_calls: 0,
      risk_used: 0,
    };
    this.stopRequested = false;
    this.stopAcknowledged = false;
    this.warningsIssued.clear();
    this.exhausted.clear();
  }

  tick(): BudgetState {
    // Update wall time
    this.consumed.wall_time_ms = Date.now() - this.startTime;

    // Check for warnings and exhaustion
    this.checkBudgets();

    return this.getState();
  }

  consumeTokens(count: number): boolean {
    if (this.isExhausted('tokens')) return false;
    this.consumed.output_tokens += count;
    this.checkBudgets();
    this.eventStore.append('BUDGET_TICK', { type: 'tokens', consumed: count, total: this.consumed.output_tokens });
    return !this.isExhausted('tokens');
  }

  consumeToolCall(): boolean {
    if (this.isExhausted('tool_calls')) return false;
    this.consumed.tool_calls++;
    this.checkBudgets();
    this.eventStore.append('BUDGET_TICK', { type: 'tool_calls', consumed: 1, total: this.consumed.tool_calls });
    return !this.isExhausted('tool_calls');
  }

  consumeIteration(): boolean {
    if (this.isExhausted('iterations')) return false;
    this.consumed.iterations++;
    this.checkBudgets();
    this.eventStore.append('BUDGET_TICK', { type: 'iterations', consumed: 1, total: this.consumed.iterations });
    return !this.isExhausted('iterations');
  }

  consumeLLMCall(): boolean {
    if (this.isExhausted('llm_calls')) return false;
    this.consumed.llm_calls++;
    this.checkBudgets();
    this.eventStore.append('BUDGET_TICK', { type: 'llm_calls', consumed: 1, total: this.consumed.llm_calls });
    return !this.isExhausted('llm_calls');
  }

  consumeRisk(action: RiskAction): boolean {
    const cost = this.riskPolicy.risk_costs[action] ?? 0;
    if (this.consumed.risk_used + cost > this.budgets.risk_budget) {
      return false;
    }
    this.consumed.risk_used += cost;
    this.checkBudgets();
    this.eventStore.append('BUDGET_TICK', { type: 'risk', action, cost, total: this.consumed.risk_used });
    return true;
  }

  private checkBudgets(): void {
    const checks = [
      { name: 'wall_time', consumed: this.consumed.wall_time_ms, max: this.budgets.max_wall_time_ms, threshold: WARNING_THRESHOLDS.wall_time },
      { name: 'tokens', consumed: this.consumed.output_tokens, max: this.budgets.max_output_tokens, threshold: WARNING_THRESHOLDS.tokens },
      { name: 'tool_calls', consumed: this.consumed.tool_calls, max: this.budgets.max_tool_calls, threshold: WARNING_THRESHOLDS.tool_calls },
      { name: 'iterations', consumed: this.consumed.iterations, max: this.budgets.max_iterations, threshold: WARNING_THRESHOLDS.iterations },
      { name: 'llm_calls', consumed: this.consumed.llm_calls, max: this.budgets.max_llm_calls, threshold: WARNING_THRESHOLDS.llm_calls },
      { name: 'risk', consumed: this.consumed.risk_used, max: this.budgets.risk_budget, threshold: WARNING_THRESHOLDS.risk },
    ];

    for (const { name, consumed, max, threshold } of checks) {
      const ratio = consumed / max;

      // Check for exhaustion
      if (consumed >= max && !this.exhausted.has(name)) {
        this.exhausted.add(name);
        this.eventStore.append('BUDGET_EXHAUSTED', { budget: name, consumed, max });
      }

      // Check for warning
      if (ratio >= threshold && !this.warningsIssued.has(name) && !this.exhausted.has(name)) {
        this.warningsIssued.add(name);
        this.eventStore.append('BUDGET_WARNING', { 
          budget: name, 
          consumed, 
          max, 
          percentage: Math.round(ratio * 100),
        });
      }
    }
  }

  isExhausted(budget?: string): boolean {
    if (budget) return this.exhausted.has(budget);
    return this.exhausted.size > 0;
  }

  shouldCheckpoint(): boolean {
    return this.consumed.iterations % this.budgets.checkpoint_interval === 0;
  }

  getState(): BudgetState {
    return {
      budgets: { ...this.budgets },
      consumed: { ...this.consumed },
      remaining: {
        wall_time_ms: Math.max(0, this.budgets.max_wall_time_ms - this.consumed.wall_time_ms),
        output_tokens: Math.max(0, this.budgets.max_output_tokens - this.consumed.output_tokens),
        tool_calls: Math.max(0, this.budgets.max_tool_calls - this.consumed.tool_calls),
        iterations: Math.max(0, this.budgets.max_iterations - this.consumed.iterations),
        llm_calls: Math.max(0, this.budgets.max_llm_calls - this.consumed.llm_calls),
        risk_remaining: Math.max(0, this.budgets.risk_budget - this.consumed.risk_used),
      },
      warnings_issued: Array.from(this.warningsIssued),
      exhausted: Array.from(this.exhausted),
      last_checkpoint_at: Math.floor(this.consumed.iterations / this.budgets.checkpoint_interval) * this.budgets.checkpoint_interval,
    };
  }

  // --------------------------------------------------------------------------
  // STOP Semantics
  // --------------------------------------------------------------------------

  requestStop(): void {
    if (!this.stopRequested) {
      this.stopRequested = true;
      this.eventStore.append('STOP_REQUESTED', { timestamp: Date.now() });
    }
  }

  acknowledgeStop(): void {
    if (this.stopRequested && !this.stopAcknowledged) {
      this.stopAcknowledged = true;
      this.eventStore.append('STOP_ACKNOWLEDGED', { 
        timestamp: Date.now(),
        budget_state: this.getState(),
      });
      
      // Trigger checkpoint
      if (this.checkpointCallback) {
        this.checkpointCallback();
      }
    }
  }

  isStopRequested(): boolean {
    return this.stopRequested;
  }

  isStopAcknowledged(): boolean {
    return this.stopAcknowledged;
  }

  setCheckpointCallback(callback: () => void): void {
    this.checkpointCallback = callback;
  }

  // --------------------------------------------------------------------------
  // Risk & Approval Management
  // --------------------------------------------------------------------------

  evaluateAction(action: PlannedAction): 'approved' | 'pending' | 'denied' {
    // Check if action type requires risk budget
    const riskAction = this.mapActionToRisk(action.type);
    if (riskAction) {
      // Check if denied
      if (this.riskPolicy.deny.includes(riskAction)) {
        return 'denied';
      }

      // Check risk budget
      const cost = this.riskPolicy.risk_costs[riskAction] ?? 0;
      if (this.consumed.risk_used + cost > this.budgets.risk_budget) {
        return 'denied';
      }

      // Check if requires approval
      if (this.mode === 'autonomous') {
        if (this.riskPolicy.auto_approve.includes(riskAction)) {
          return 'approved';
        }
        if (this.riskPolicy.require_approval.includes(riskAction)) {
          this.pendingApprovals.set(action.action_id, action);
          this.eventStore.append('PERMISSION_REQUESTED', { action });
          return 'pending';
        }
      } else if (this.mode === 'supervised') {
        // In supervised mode, all risky actions need approval
        if (action.risk_level !== 'none') {
          this.pendingApprovals.set(action.action_id, action);
          this.eventStore.append('PERMISSION_REQUESTED', { action });
          return 'pending';
        }
      } else if (this.mode === 'manual') {
        // In manual mode, everything needs approval
        this.pendingApprovals.set(action.action_id, action);
        this.eventStore.append('PERMISSION_REQUESTED', { action });
        return 'pending';
      }
    }

    return 'approved';
  }

  approveAction(actionId: UUID): boolean {
    const action = this.pendingApprovals.get(actionId);
    if (!action) return false;

    this.pendingApprovals.delete(actionId);
    this.eventStore.append('PERMISSION_GRANTED', { action_id: actionId });
    return true;
  }

  denyAction(actionId: UUID, reason: string): boolean {
    const action = this.pendingApprovals.get(actionId);
    if (!action) return false;

    this.pendingApprovals.delete(actionId);
    this.eventStore.append('PERMISSION_DENIED', { action_id: actionId, reason });
    return true;
  }

  getPendingApprovals(): PlannedAction[] {
    return Array.from(this.pendingApprovals.values());
  }

  private mapActionToRisk(actionType: string): RiskAction | null {
    const mapping: Record<string, RiskAction> = {
      'artifact_create': 'file_write',
      'artifact_update': 'overwrite_artifact',
      'external_api': 'external_api_call',
      'database_write': 'database_write',
      'execute_code': 'execute_code',
    };
    return mapping[actionType] ?? null;
  }

  // --------------------------------------------------------------------------
  // Can Continue Check
  // --------------------------------------------------------------------------

  canContinue(): { allowed: boolean; reason?: string } {
    if (this.stopRequested) {
      return { allowed: false, reason: 'STOP requested' };
    }

    if (this.exhausted.size > 0) {
      return { 
        allowed: false, 
        reason: `Budget(s) exhausted: ${Array.from(this.exhausted).join(', ')}` 
      };
    }

    return { allowed: true };
  }

  // --------------------------------------------------------------------------
  // Reset
  // --------------------------------------------------------------------------

  reset(): void {
    this.consumed = {
      wall_time_ms: 0,
      output_tokens: 0,
      tool_calls: 0,
      iterations: 0,
      llm_calls: 0,
      risk_used: 0,
    };
    this.startTime = 0;
    this.stopRequested = false;
    this.stopAcknowledged = false;
    this.warningsIssued.clear();
    this.exhausted.clear();
    this.pendingApprovals.clear();
  }
}
