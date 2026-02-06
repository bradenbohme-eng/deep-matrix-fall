// Test Log Store - Persistent storage for test results with full execution traces
// Enables AI to analyze test history and make improvement decisions

import type {
  TestResult,
  Event,
  UUID,
  Timestamp,
  BudgetState,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface TestRun {
  run_id: UUID;
  test_id: string;
  started_at: Timestamp;
  completed_at?: Timestamp;
  result?: TestResult;
  events: Event[];
  reasoning_trace: ReasoningStep[];
  budget_snapshots: BudgetSnapshot[];
  internal_state_log: InternalStateEntry[];
  improvements_suggested: ImprovementSuggestion[];
  metadata: Record<string, unknown>;
}

export interface ReasoningStep {
  step_id: UUID;
  timestamp: Timestamp;
  phase: 'planning' | 'execution' | 'verification' | 'audit' | 'decision';
  thought: string;
  reasoning: string;
  confidence: number;
  alternatives_considered: string[];
  decision_made: string;
  evidence: string[];
  parent_step_id?: UUID;
}

export interface BudgetSnapshot {
  timestamp: Timestamp;
  iteration: number;
  consumed: BudgetState['consumed'];
  remaining: BudgetState['remaining'];
  warnings: string[];
}

export interface InternalStateEntry {
  timestamp: Timestamp;
  component: 'kernel' | 'queue' | 'context' | 'verifier' | 'governor';
  state_type: string;
  state_summary: string;
  details: Record<string, unknown>;
}

export interface ImprovementSuggestion {
  id: UUID;
  source: 'self_analysis' | 'pattern_detection' | 'failure_analysis';
  category: 'performance' | 'accuracy' | 'efficiency' | 'reliability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  proposed_action: string;
  estimated_impact: number; // 0-1
  created_at: Timestamp;
  applied: boolean;
}

export interface TestSession {
  session_id: UUID;
  started_at: Timestamp;
  completed_at?: Timestamp;
  runs: TestRun[];
  aggregate_stats: AggregateStats;
  cross_test_insights: CrossTestInsight[];
}

export interface AggregateStats {
  total_tests: number;
  passed: number;
  failed: number;
  average_score: number;
  average_duration_ms: number;
  total_events: number;
  total_reasoning_steps: number;
  improvement_suggestions_generated: number;
  categories_tested: Record<string, { passed: number; failed: number }>;
}

export interface CrossTestInsight {
  id: UUID;
  type: 'pattern' | 'correlation' | 'regression' | 'improvement';
  title: string;
  description: string;
  affected_tests: string[];
  confidence: number;
  created_at: Timestamp;
}

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'orchestration_test_logs';
const MAX_SESSIONS = 20;
const MAX_RUNS_PER_SESSION = 50;

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
// TEST LOG STORE CLASS
// ============================================================================

export class TestLogStore {
  private sessions: TestSession[] = [];
  private currentSession: TestSession | null = null;
  private listeners: Set<(session: TestSession) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  // --------------------------------------------------------------------------
  // Session Management
  // --------------------------------------------------------------------------

  startSession(): TestSession {
    const session: TestSession = {
      session_id: generateUUID(),
      started_at: Date.now(),
      runs: [],
      aggregate_stats: this.createEmptyStats(),
      cross_test_insights: [],
    };

    this.currentSession = session;
    this.sessions.push(session);

    // Trim old sessions
    while (this.sessions.length > MAX_SESSIONS) {
      this.sessions.shift();
    }

    this.saveToStorage();
    return session;
  }

  endSession(): TestSession | null {
    if (!this.currentSession) return null;

    this.currentSession.completed_at = Date.now();
    this.updateAggregateStats();
    this.generateCrossTestInsights();
    this.saveToStorage();
    this.notifyListeners();

    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  getCurrentSession(): TestSession | null {
    return this.currentSession;
  }

  getAllSessions(): TestSession[] {
    return [...this.sessions];
  }

  getSession(sessionId: UUID): TestSession | undefined {
    return this.sessions.find(s => s.session_id === sessionId);
  }

  // --------------------------------------------------------------------------
  // Test Run Management
  // --------------------------------------------------------------------------

  startTestRun(testId: string): TestRun {
    if (!this.currentSession) {
      this.startSession();
    }

    const run: TestRun = {
      run_id: generateUUID(),
      test_id: testId,
      started_at: Date.now(),
      events: [],
      reasoning_trace: [],
      budget_snapshots: [],
      internal_state_log: [],
      improvements_suggested: [],
      metadata: {},
    };

    this.currentSession!.runs.push(run);

    // Trim old runs
    while (this.currentSession!.runs.length > MAX_RUNS_PER_SESSION) {
      this.currentSession!.runs.shift();
    }

    this.saveToStorage();
    return run;
  }

  completeTestRun(runId: UUID, result: TestResult): void {
    const run = this.findRun(runId);
    if (!run) return;

    run.completed_at = Date.now();
    run.result = result;

    // Analyze and generate improvements
    this.analyzeRunForImprovements(run);
    this.updateAggregateStats();
    this.saveToStorage();
    this.notifyListeners();
  }

  findRun(runId: UUID): TestRun | undefined {
    for (const session of this.sessions) {
      const run = session.runs.find(r => r.run_id === runId);
      if (run) return run;
    }
    return undefined;
  }

  getRunsForTest(testId: string): TestRun[] {
    const runs: TestRun[] = [];
    for (const session of this.sessions) {
      runs.push(...session.runs.filter(r => r.test_id === testId));
    }
    return runs.sort((a, b) => b.started_at - a.started_at);
  }

  // --------------------------------------------------------------------------
  // Reasoning Trace
  // --------------------------------------------------------------------------

  addReasoningStep(runId: UUID, step: Omit<ReasoningStep, 'step_id' | 'timestamp'>): ReasoningStep {
    const run = this.findRun(runId);
    if (!run) throw new Error(`Run not found: ${runId}`);

    const fullStep: ReasoningStep = {
      step_id: generateUUID(),
      timestamp: Date.now(),
      ...step,
    };

    run.reasoning_trace.push(fullStep);
    this.saveToStorage();
    return fullStep;
  }

  getReasoningTrace(runId: UUID): ReasoningStep[] {
    const run = this.findRun(runId);
    return run?.reasoning_trace ?? [];
  }

  // --------------------------------------------------------------------------
  // Budget Snapshots
  // --------------------------------------------------------------------------

  addBudgetSnapshot(runId: UUID, iteration: number, state: BudgetState): void {
    const run = this.findRun(runId);
    if (!run) return;

    run.budget_snapshots.push({
      timestamp: Date.now(),
      iteration,
      consumed: { ...state.consumed },
      remaining: { ...state.remaining },
      warnings: [...state.warnings_issued],
    });
  }

  // --------------------------------------------------------------------------
  // Internal State Logging
  // --------------------------------------------------------------------------

  logInternalState(
    runId: UUID,
    component: InternalStateEntry['component'],
    stateType: string,
    summary: string,
    details: Record<string, unknown>
  ): void {
    const run = this.findRun(runId);
    if (!run) return;

    run.internal_state_log.push({
      timestamp: Date.now(),
      component,
      state_type: stateType,
      state_summary: summary,
      details,
    });
  }

  // --------------------------------------------------------------------------
  // Events
  // --------------------------------------------------------------------------

  addEvents(runId: UUID, events: Event[]): void {
    const run = this.findRun(runId);
    if (!run) return;

    run.events.push(...events);
  }

  // --------------------------------------------------------------------------
  // Improvement Analysis
  // --------------------------------------------------------------------------

  private analyzeRunForImprovements(run: TestRun): void {
    if (!run.result) return;

    const suggestions: ImprovementSuggestion[] = [];

    // Check for budget efficiency
    const lastBudget = run.budget_snapshots[run.budget_snapshots.length - 1];
    if (lastBudget) {
      const tokenEfficiency = lastBudget.consumed.output_tokens / (run.result.duration_ms + 1);
      if (tokenEfficiency > 10) {
        suggestions.push({
          id: generateUUID(),
          source: 'self_analysis',
          category: 'efficiency',
          priority: 'medium',
          title: 'High token consumption rate',
          description: `Token consumption rate of ${tokenEfficiency.toFixed(2)} tokens/ms detected`,
          evidence: [`Consumed ${lastBudget.consumed.output_tokens} tokens in ${run.result.duration_ms}ms`],
          proposed_action: 'Consider more concise prompts or early stopping',
          estimated_impact: 0.3,
          created_at: Date.now(),
          applied: false,
        });
      }
    }

    // Check for verification failures
    const failedCriteria = run.result.criteria_results.filter(c => !c.passed);
    if (failedCriteria.length > 0) {
      suggestions.push({
        id: generateUUID(),
        source: 'failure_analysis',
        category: 'accuracy',
        priority: 'high',
        title: 'Verification criteria failures',
        description: `${failedCriteria.length} verification criteria failed`,
        evidence: failedCriteria.map(c => `${c.criterion.id}: ${c.criterion.description}`),
        proposed_action: 'Review and adjust task execution or acceptance criteria',
        estimated_impact: 0.5,
        created_at: Date.now(),
        applied: false,
      });
    }

    // Check reasoning depth
    const reasoningSteps = run.reasoning_trace.length;
    if (reasoningSteps < 3 && !run.result.passed) {
      suggestions.push({
        id: generateUUID(),
        source: 'pattern_detection',
        category: 'reliability',
        priority: 'medium',
        title: 'Shallow reasoning on failed test',
        description: `Only ${reasoningSteps} reasoning steps before failure`,
        evidence: run.reasoning_trace.map(s => s.thought),
        proposed_action: 'Increase reasoning depth for complex tasks',
        estimated_impact: 0.4,
        created_at: Date.now(),
        applied: false,
      });
    }

    run.improvements_suggested = suggestions;
  }

  getAllImprovements(): ImprovementSuggestion[] {
    const all: ImprovementSuggestion[] = [];
    for (const session of this.sessions) {
      for (const run of session.runs) {
        all.push(...run.improvements_suggested);
      }
    }
    return all.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // --------------------------------------------------------------------------
  // Cross-Test Analysis
  // --------------------------------------------------------------------------

  private generateCrossTestInsights(): void {
    if (!this.currentSession) return;

    const insights: CrossTestInsight[] = [];
    const runs = this.currentSession.runs;

    // Pattern: Same category failures
    const categoryFailures = new Map<string, string[]>();
    for (const run of runs) {
      if (!run.result?.passed) {
        const category = run.test_id.split('-')[0];
        if (!categoryFailures.has(category)) {
          categoryFailures.set(category, []);
        }
        categoryFailures.get(category)!.push(run.test_id);
      }
    }

    for (const [category, tests] of categoryFailures.entries()) {
      if (tests.length >= 2) {
        insights.push({
          id: generateUUID(),
          type: 'pattern',
          title: `Recurring failures in ${category}`,
          description: `Multiple tests in the ${category} category are failing, suggesting a systemic issue`,
          affected_tests: tests,
          confidence: 0.8,
          created_at: Date.now(),
        });
      }
    }

    // Pattern: Duration outliers
    const durations = runs.filter(r => r.result).map(r => r.result!.duration_ms);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const outliers = runs.filter(r => r.result && r.result.duration_ms > avgDuration * 2);
    
    if (outliers.length > 0) {
      insights.push({
        id: generateUUID(),
        type: 'pattern',
        title: 'Duration outliers detected',
        description: `${outliers.length} tests took significantly longer than average`,
        affected_tests: outliers.map(r => r.test_id),
        confidence: 0.7,
        created_at: Date.now(),
      });
    }

    this.currentSession.cross_test_insights = insights;
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  private createEmptyStats(): AggregateStats {
    return {
      total_tests: 0,
      passed: 0,
      failed: 0,
      average_score: 0,
      average_duration_ms: 0,
      total_events: 0,
      total_reasoning_steps: 0,
      improvement_suggestions_generated: 0,
      categories_tested: {},
    };
  }

  private updateAggregateStats(): void {
    if (!this.currentSession) return;

    const runs = this.currentSession.runs.filter(r => r.result);
    const stats = this.createEmptyStats();

    stats.total_tests = runs.length;
    stats.passed = runs.filter(r => r.result?.passed).length;
    stats.failed = runs.filter(r => !r.result?.passed).length;
    stats.average_score = runs.length > 0
      ? runs.reduce((sum, r) => sum + (r.result?.score ?? 0), 0) / runs.length
      : 0;
    stats.average_duration_ms = runs.length > 0
      ? runs.reduce((sum, r) => sum + (r.result?.duration_ms ?? 0), 0) / runs.length
      : 0;
    stats.total_events = runs.reduce((sum, r) => sum + r.events.length, 0);
    stats.total_reasoning_steps = runs.reduce((sum, r) => sum + r.reasoning_trace.length, 0);
    stats.improvement_suggestions_generated = runs.reduce((sum, r) => sum + r.improvements_suggested.length, 0);

    // Category breakdown
    for (const run of runs) {
      const category = run.test_id.split('-')[0];
      if (!stats.categories_tested[category]) {
        stats.categories_tested[category] = { passed: 0, failed: 0 };
      }
      if (run.result?.passed) {
        stats.categories_tested[category].passed++;
      } else {
        stats.categories_tested[category].failed++;
      }
    }

    this.currentSession.aggregate_stats = stats;
  }

  getLatestStats(): AggregateStats | null {
    return this.currentSession?.aggregate_stats ?? null;
  }

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.sessions = data.sessions ?? [];
      }
    } catch (e) {
      console.warn('Failed to load test logs from storage:', e);
      this.sessions = [];
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        sessions: this.sessions,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save test logs to storage:', e);
    }
  }

  clearAll(): void {
    this.sessions = [];
    this.currentSession = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  // --------------------------------------------------------------------------
  // Export
  // --------------------------------------------------------------------------

  exportSession(sessionId: UUID): string {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    return JSON.stringify(session, null, 2);
  }

  exportAllSessions(): string {
    return JSON.stringify({
      sessions: this.sessions,
      exportedAt: Date.now(),
    }, null, 2);
  }

  // --------------------------------------------------------------------------
  // Subscription
  // --------------------------------------------------------------------------

  subscribe(callback: (session: TestSession) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    if (this.currentSession) {
      this.listeners.forEach(cb => cb(this.currentSession!));
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let globalTestLogStore: TestLogStore | null = null;

export function getTestLogStore(): TestLogStore {
  if (!globalTestLogStore) {
    globalTestLogStore = new TestLogStore();
  }
  return globalTestLogStore;
}
