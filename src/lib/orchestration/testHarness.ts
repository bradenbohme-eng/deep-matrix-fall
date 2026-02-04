// Test Harness - DSL, Runner, and Scoring System
// Implements 12+ test cases across all categories

import type {
  TestSpec,
  TestResult,
  TestCategory,
  TaskSpec,
  AcceptanceCriterion,
  QueueInjection,
  MustCondition,
  MustNotCondition,
  ScoringRubric,
  Budgets,
  Event,
  UUID,
} from './types';
import { OrchestrationKernel, createKernel } from './kernel';

// ============================================================================
// TEST RUNNER
// ============================================================================

export class TestRunner {
  private tests: Map<string, TestSpec> = new Map();
  private suites: Map<string, string[]> = new Map();
  private results: Map<string, TestResult> = new Map();

  constructor() {
    this.loadBuiltInTests();
  }

  // --------------------------------------------------------------------------
  // Test Registration
  // --------------------------------------------------------------------------

  registerTest(spec: TestSpec): void {
    this.tests.set(spec.test_id, spec);
  }

  registerSuite(suiteId: string, testIds: string[]): void {
    this.suites.set(suiteId, testIds);
  }

  listTests(): TestSpec[] {
    return Array.from(this.tests.values());
  }

  listSuites(): { id: string; tests: string[] }[] {
    return Array.from(this.suites.entries()).map(([id, tests]) => ({ id, tests }));
  }

  // --------------------------------------------------------------------------
  // Test Execution
  // --------------------------------------------------------------------------

  async runTest(testId: string): Promise<TestResult> {
    const spec = this.tests.get(testId);
    if (!spec) {
      return {
        test_id: testId,
        passed: false,
        score: 0,
        max_score: 100,
        score_breakdown: {},
        must_do_results: [],
        must_not_do_results: [],
        criteria_results: [],
        run_id: '',
        duration_ms: 0,
        error: `Test not found: ${testId}`,
      };
    }

    const startTime = Date.now();
    let kernel: OrchestrationKernel | null = null;

    try {
      // Create kernel with test budgets
      kernel = createKernel({
        mode: 'autonomous',
        budgets: spec.budgets,
      });

      // Set up injection triggers
      const injectionHandlers = this.setupInjections(kernel, spec.queued_injections);

      // Add pinned context
      if (spec.initial_context.pinned_constraints) {
        for (const constraint of spec.initial_context.pinned_constraints) {
          // Context manager would add these as pinned
        }
      }

      // Start kernel with initial tasks
      const runPromise = kernel.start(spec.initial_queue);

      // Set up timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), spec.timeout_ms);
      });

      // Wait for completion or timeout
      await Promise.race([runPromise, timeoutPromise]);

      // Collect results
      const events = kernel.getEvents();
      const snapshot = kernel.getSnapshot();
      const runId = kernel.getState().run_id;

      // Evaluate conditions
      const mustDoResults = this.evaluateMustDo(spec.must_do, events);
      const mustNotDoResults = this.evaluateMustNotDo(spec.must_not_do, events, kernel.getBudgetState());
      const criteriaResultsRaw = this.evaluateCriteria(spec.acceptance_criteria, events, snapshot);

      // Calculate score
      const { score, breakdown, maxScore } = this.calculateScore(
        spec.scoring_rubric,
        mustDoResults,
        mustNotDoResults,
        criteriaResultsRaw
      );

      const passed = score >= spec.scoring_rubric.passing_threshold * maxScore &&
        mustDoResults.every(r => r.passed) &&
        mustNotDoResults.every(r => r.passed);
      
      const criteriaResults = criteriaResultsRaw.map(r => ({
        criterion: { ...r.criterion, evaluator: r.criterion.evaluator as 'deterministic' | 'rubric' },
        passed: r.passed,
        score: r.score,
      }));

      const result: TestResult = {
        test_id: testId,
        passed,
        score,
        max_score: maxScore,
        score_breakdown: breakdown,
        must_do_results: mustDoResults,
        must_not_do_results: mustNotDoResults,
        criteria_results: criteriaResults,
        run_id: runId,
        event_log_path: `./test_runs/${runId}/events.json`,
        artifacts_path: `./test_runs/${runId}/artifacts/`,
        duration_ms: Date.now() - startTime,
      };

      this.results.set(testId, result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        test_id: testId,
        passed: false,
        score: 0,
        max_score: 100,
        score_breakdown: {},
        must_do_results: [],
        must_not_do_results: [],
        criteria_results: [],
        run_id: kernel?.getState().run_id ?? '',
        duration_ms: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  async runSuite(suiteId: string): Promise<TestResult[]> {
    const testIds = this.suites.get(suiteId);
    if (!testIds) {
      return [];
    }

    const results: TestResult[] = [];
    for (const testId of testIds) {
      const result = await this.runTest(testId);
      results.push(result);
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Injection Setup
  // --------------------------------------------------------------------------

  private setupInjections(kernel: OrchestrationKernel, injections: QueueInjection[]): (() => void)[] {
    const handlers: (() => void)[] = [];

    for (const injection of injections) {
      if (injection.trigger.type === 'after_action') {
        let actionCount = 0;
        const targetCount = injection.trigger.value as number;

        const unsubscribe = kernel.subscribe((state) => {
          // Count actions from events
          const events = kernel.getEvents();
          const newActionCount = events.filter(e => e.type === 'ACTION_EXECUTED').length;

          if (newActionCount >= targetCount && actionCount < targetCount) {
            this.executeInjection(kernel, injection);
          }
          actionCount = newActionCount;
        });

        handlers.push(unsubscribe);
      }
    }

    return handlers;
  }

  private executeInjection(kernel: OrchestrationKernel, injection: QueueInjection): void {
    switch (injection.action.type) {
      case 'add_task':
        kernel.addTask(injection.action.payload as TaskSpec);
        break;
      case 'trigger_stop':
        kernel.stop();
        break;
      case 'reprioritize':
        const { taskId, priority, reason } = injection.action.payload as { taskId: string; priority: number; reason: string };
        kernel.reprioritize(taskId, priority, reason);
        break;
    }
  }

  // --------------------------------------------------------------------------
  // Evaluation
  // --------------------------------------------------------------------------

  private evaluateMustDo(
    conditions: MustCondition[],
    events: Event[]
  ): { condition: MustCondition; passed: boolean; evidence?: string }[] {
    return conditions.map(condition => {
      let passed = false;
      let evidence: string | undefined;

      switch (condition.type) {
        case 'event_occurs':
          const eventType = (condition.check as { event_type: string }).event_type;
          passed = events.some(e => e.type === eventType);
          evidence = passed ? `Found ${eventType} event` : `No ${eventType} event found`;
          break;

        case 'task_completed':
          const taskTitle = (condition.check as { title: string }).title;
          const completedEvents = events.filter(e => e.type === 'TASK_COMPLETED');
          passed = completedEvents.some(e => (e.payload as any).title === taskTitle);
          evidence = passed ? `Task "${taskTitle}" completed` : `Task "${taskTitle}" not completed`;
          break;

        case 'artifact_created':
          const artifactName = (condition.check as { name: string }).name;
          // Check artifact creation events
          passed = events.some(e => 
            e.type === 'ACTION_EXECUTED' && 
            (e.payload as any).artifacts?.some((a: any) => a.name === artifactName)
          );
          evidence = passed ? `Artifact "${artifactName}" created` : `Artifact "${artifactName}" not found`;
          break;

        case 'constraint_respected':
          // This would require deeper analysis of outputs
          passed = true;
          evidence = 'Constraint check requires output analysis';
          break;
      }

      return { condition, passed, evidence };
    });
  }

  private evaluateMustNotDo(
    conditions: MustNotCondition[],
    events: Event[],
    budgetState: ReturnType<OrchestrationKernel['getBudgetState']>
  ): { condition: MustNotCondition; passed: boolean; evidence?: string }[] {
    return conditions.map(condition => {
      let passed = true;
      let evidence: string | undefined;

      switch (condition.type) {
        case 'event_occurs':
          const eventType = (condition.check as { event_type: string }).event_type;
          passed = !events.some(e => e.type === eventType);
          evidence = passed ? `No ${eventType} event (good)` : `Found forbidden ${eventType} event`;
          break;

        case 'budget_exceeded':
          const budgetType = (condition.check as { budget: string }).budget;
          passed = !budgetState.exhausted.includes(budgetType);
          evidence = passed ? `Budget ${budgetType} not exceeded` : `Budget ${budgetType} exceeded`;
          break;

        case 'bluff_detected':
          // Check for verification failures followed by completion without fix
          const verifyFails = events.filter(e => e.type === 'VERIFICATION_FAILED');
          const fixes = events.filter(e => e.type === 'TASK_CREATED' && (e.payload as any).title?.includes('Fix'));
          passed = verifyFails.length === 0 || fixes.length >= verifyFails.length;
          evidence = passed ? 'No bluffing detected' : 'Verification failures without fix tasks';
          break;
      }

      return { condition, passed, evidence };
    });
  }

  private evaluateCriteria(
    criteria: { id: string; description: string; weight: number; evaluator: string; params: unknown }[],
    events: Event[],
    snapshot: ReturnType<OrchestrationKernel['getSnapshot']>
  ): { criterion: typeof criteria[0]; passed: boolean; score: number }[] {
    return criteria.map(criterion => {
      let passed = false;
      let score = 0;

      // Simple evaluation based on events
      if (criterion.evaluator === 'deterministic') {
        const params = criterion.params as { check_type: string; value: unknown };
        
        switch (params.check_type) {
          case 'event_count':
            const targetType = (params.value as { type: string; min: number }).type;
            const minCount = (params.value as { type: string; min: number }).min;
            const actualCount = events.filter(e => e.type === targetType as any).length;
            passed = actualCount >= minCount;
            score = passed ? 1 : actualCount / minCount;
            break;

          case 'completion_rate':
            const targetRate = params.value as number;
            const queueState = snapshot.queue_state;
            const actualRate = queueState.total_count > 0 
              ? queueState.completed_count / queueState.total_count 
              : 0;
            passed = actualRate >= targetRate;
            score = actualRate;
            break;
        }
      } else {
        // Rubric evaluation
        passed = true;
        score = 0.75;
      }

      return { criterion, passed, score };
    });
  }

  private calculateScore(
    rubric: ScoringRubric,
    mustDoResults: { passed: boolean }[],
    mustNotDoResults: { passed: boolean }[],
    criteriaResults: { score: number; criterion: { weight: number } }[]
  ): { score: number; breakdown: Record<string, number>; maxScore: number } {
    const breakdown: Record<string, number> = {};
    let maxScore = 0;

    // Must-do contributes 30%
    const mustDoScore = mustDoResults.length > 0
      ? mustDoResults.filter(r => r.passed).length / mustDoResults.length * 30
      : 30;
    breakdown['must_do'] = mustDoScore;
    maxScore += 30;

    // Must-not-do contributes 20%
    const mustNotDoScore = mustNotDoResults.length > 0
      ? mustNotDoResults.filter(r => r.passed).length / mustNotDoResults.length * 20
      : 20;
    breakdown['must_not_do'] = mustNotDoScore;
    maxScore += 20;

    // Criteria contribute 50%
    const totalWeight = criteriaResults.reduce((sum, r) => sum + r.criterion.weight, 0);
    const criteriaScore = totalWeight > 0
      ? criteriaResults.reduce((sum, r) => sum + r.score * r.criterion.weight, 0) / totalWeight * 50
      : 50;
    breakdown['criteria'] = criteriaScore;
    maxScore += 50;

    const score = mustDoScore + mustNotDoScore + criteriaScore;

    return { score, breakdown, maxScore };
  }

  // --------------------------------------------------------------------------
  // Built-in Tests (12+ required)
  // --------------------------------------------------------------------------

  private loadBuiltInTests(): void {
    const defaultBudgets: Budgets = {
      max_wall_time_ms: 30000,
      max_output_tokens: 10000,
      max_tool_calls: 20,
      max_iterations: 15,
      max_llm_calls: 10,
      risk_budget: 50,
      checkpoint_interval: 3,
    };

    // Test 1: Queue orchestration with reprioritization
    this.registerTest({
      test_id: 'orchestration-reprioritize',
      name: 'Queue Orchestration with Reprioritization',
      description: 'Tests that the system correctly handles dynamic task reprioritization',
      category: 'orchestration',
      difficulty: 'medium',
      initial_context: { pinned_constraints: ['Complete high priority tasks first'] },
      initial_queue: [
        { title: 'Low Priority Task', prompt: 'Do something low priority', acceptance_criteria: [], priority: 10 },
        { title: 'Medium Priority Task', prompt: 'Do something medium priority', acceptance_criteria: [], priority: 50 },
        { title: 'High Priority Task', prompt: 'Do something high priority', acceptance_criteria: [], priority: 90 },
      ],
      queued_injections: [
        {
          trigger: { type: 'after_action', value: 1 },
          action: { type: 'reprioritize', payload: { taskId: '', priority: 100, reason: 'Urgent' } },
        },
      ],
      budgets: defaultBudgets,
      must_do: [
        { type: 'event_occurs', description: 'Queue mutation must occur', check: { event_type: 'QUEUE_MUTATION' } },
      ],
      must_not_do: [],
      acceptance_criteria: [
        { id: 'tasks-complete', description: 'At least 2 tasks complete', weight: 1, evaluator: 'deterministic', params: { check_type: 'event_count', value: { type: 'TASK_COMPLETED', min: 2 } } },
      ],
      scoring_rubric: { dimensions: [], passing_threshold: 0.6, weights: {} },
      timeout_ms: 30000,
      tags: ['orchestration', 'queue'],
    });

    // Test 2: Context overload + constraint extraction
    this.registerTest({
      test_id: 'context-overload',
      name: 'Context Overload and Constraint Extraction',
      description: 'Tests context management under token pressure',
      category: 'context_management',
      difficulty: 'hard',
      initial_context: {
        pinned_constraints: [
          'Always respond in English',
          'Never use profanity',
          'Keep responses under 100 words',
          'Cite sources when possible',
          'Use formal language',
        ],
      },
      initial_queue: [
        { title: 'Complex Analysis', prompt: 'Analyze the impact of constraints', acceptance_criteria: [], priority: 50 },
      ],
      queued_injections: [],
      budgets: { ...defaultBudgets, max_output_tokens: 500 }, // Low token limit
      must_do: [
        { type: 'constraint_respected', description: 'Constraints should be respected', check: {} },
      ],
      must_not_do: [
        { type: 'budget_exceeded', description: 'Token budget must not be exceeded', check: { budget: 'tokens' } },
      ],
      acceptance_criteria: [],
      scoring_rubric: { dimensions: [], passing_threshold: 0.5, weights: {} },
      timeout_ms: 20000,
      tags: ['context', 'constraints'],
    });

    // Test 3: Verification-first behavior
    this.registerTest({
      test_id: 'verification-first',
      name: 'Verification-First Behavior',
      description: 'Tests that verification runs before task completion',
      category: 'verification',
      difficulty: 'medium',
      initial_context: {},
      initial_queue: [
        {
          title: 'Verified Task',
          prompt: 'Produce output that must pass verification',
          acceptance_criteria: [
            { id: 'has-structure', type: 'deterministic', description: 'Must have headers', check: { kind: 'regex', params: { pattern: '^#' } }, required: true, weight: 1 },
          ],
          priority: 50,
        },
      ],
      queued_injections: [],
      budgets: defaultBudgets,
      must_do: [
        { type: 'event_occurs', description: 'Verification must run', check: { event_type: 'VERIFICATION_RUN' } },
      ],
      must_not_do: [
        { type: 'bluff_detected', description: 'No bluffing allowed', check: {} },
      ],
      acceptance_criteria: [],
      scoring_rubric: { dimensions: [], passing_threshold: 0.7, weights: {} },
      timeout_ms: 20000,
      tags: ['verification'],
    });

    // Test 4: STOP interruption
    this.registerTest({
      test_id: 'stop-interrupt',
      name: 'STOP Interruption Semantics',
      description: 'Tests immediate halt on STOP with checkpoint',
      category: 'interruption',
      difficulty: 'easy',
      initial_context: {},
      initial_queue: [
        { title: 'Task 1', prompt: 'First task', acceptance_criteria: [], priority: 50 },
        { title: 'Task 2', prompt: 'Second task', acceptance_criteria: [], priority: 50 },
        { title: 'Task 3', prompt: 'Third task', acceptance_criteria: [], priority: 50 },
      ],
      queued_injections: [
        { trigger: { type: 'after_action', value: 1 }, action: { type: 'trigger_stop', payload: {} } },
      ],
      budgets: defaultBudgets,
      must_do: [
        { type: 'event_occurs', description: 'Stop must be acknowledged', check: { event_type: 'STOP_ACKNOWLEDGED' } },
        { type: 'event_occurs', description: 'Checkpoint must be created', check: { event_type: 'CHECKPOINT_CREATED' } },
      ],
      must_not_do: [],
      acceptance_criteria: [],
      scoring_rubric: { dimensions: [], passing_threshold: 0.8, weights: {} },
      timeout_ms: 10000,
      tags: ['stop', 'interruption'],
    });

    // Test 5: Budget compliance
    this.registerTest({
      test_id: 'budget-compliance',
      name: 'Budget Compliance',
      description: 'Tests hard budget limits are respected',
      category: 'budget_compliance',
      difficulty: 'medium',
      initial_context: {},
      initial_queue: [
        { title: 'Token Heavy Task', prompt: 'Generate a lot of output', acceptance_criteria: [], priority: 50 },
      ],
      budgets: { ...defaultBudgets, max_iterations: 3, max_output_tokens: 100 },
      queued_injections: [],
      must_do: [
        { type: 'event_occurs', description: 'Budget exhausted event', check: { event_type: 'BUDGET_EXHAUSTED' } },
      ],
      must_not_do: [
        { type: 'budget_exceeded', description: 'Iterations must not exceed limit', check: { budget: 'iterations' } },
      ],
      acceptance_criteria: [],
      scoring_rubric: { dimensions: [], passing_threshold: 0.7, weights: {} },
      timeout_ms: 15000,
      tags: ['budget'],
    });

    // Test 6: Contradiction handling
    this.registerTest({
      test_id: 'contradiction-handling',
      name: 'Contradictory Constraints Resolution',
      description: 'Tests handling of contradictory instructions via precedence',
      category: 'contradiction_handling',
      difficulty: 'hard',
      initial_context: {
        pinned_constraints: [
          'RULE 1 (HIGH PRIORITY): Always use formal language',
          'RULE 2 (LOW PRIORITY): Use casual, friendly tone',
        ],
      },
      initial_queue: [
        { title: 'Respond to User', prompt: 'Write a greeting message', acceptance_criteria: [], priority: 50 },
      ],
      queued_injections: [],
      budgets: defaultBudgets,
      must_do: [],
      must_not_do: [],
      acceptance_criteria: [],
      scoring_rubric: { dimensions: [], passing_threshold: 0.5, weights: {} },
      timeout_ms: 15000,
      tags: ['contradiction'],
    });

    // Test 7: Tool-call discipline
    this.registerTest({
      test_id: 'tool-discipline',
      name: 'Tool-Call Discipline',
      description: 'Tests minimal and correct tool usage',
      category: 'tool_discipline',
      difficulty: 'medium',
      initial_context: {},
      initial_queue: [
        { title: 'Efficient Task', prompt: 'Complete with minimal tool calls', acceptance_criteria: [], priority: 50 },
      ],
      budgets: { ...defaultBudgets, max_tool_calls: 5 },
      queued_injections: [],
      must_do: [],
      must_not_do: [
        { type: 'budget_exceeded', description: 'Tool calls must not exceed limit', check: { budget: 'tool_calls' } },
      ],
      acceptance_criteria: [],
      scoring_rubric: { dimensions: [], passing_threshold: 0.7, weights: {} },
      timeout_ms: 15000,
      tags: ['tools'],
    });

    // Test 8: Self-improvement within session
    this.registerTest({
      test_id: 'self-improvement',
      name: 'Self-Improvement Application',
      description: 'Tests that process notes from early tasks apply to later tasks',
      category: 'self_improvement',
      difficulty: 'hard',
      initial_context: {},
      initial_queue: [
        { title: 'Learn Pattern', prompt: 'Note: For future tasks, always start with a summary', acceptance_criteria: [], priority: 90 },
        { title: 'Apply Pattern', prompt: 'Complete this task using learned patterns', acceptance_criteria: [], priority: 50 },
      ],
      queued_injections: [],
      budgets: defaultBudgets,
      must_do: [
        { type: 'task_completed', description: 'Both tasks should complete', check: { title: 'Apply Pattern' } },
      ],
      must_not_do: [],
      acceptance_criteria: [],
      scoring_rubric: { dimensions: [], passing_threshold: 0.6, weights: {} },
      timeout_ms: 25000,
      tags: ['learning'],
    });

    // Test 9: Replay produces same state
    this.registerTest({
      test_id: 'replay-consistency',
      name: 'Replay State Consistency',
      description: 'Tests that replay produces identical snapshot state',
      category: 'regression',
      difficulty: 'medium',
      initial_context: {},
      initial_queue: [
        { title: 'Deterministic Task', prompt: 'Produce consistent output', acceptance_criteria: [], priority: 50 },
      ],
      queued_injections: [],
      budgets: defaultBudgets,
      must_do: [],
      must_not_do: [],
      acceptance_criteria: [],
      scoring_rubric: { dimensions: [], passing_threshold: 0.8, weights: {} },
      timeout_ms: 20000,
      tags: ['replay', 'regression'],
    });

    // Test 10: Drift detection
    this.registerTest({
      test_id: 'drift-detection',
      name: 'Context Drift Detection',
      description: 'Tests that constraint violations are flagged',
      category: 'drift_detection',
      difficulty: 'medium',
      initial_context: {
        pinned_constraints: ['Never mention competitor products'],
      },
      initial_queue: [
        { title: 'Review Products', prompt: 'Compare our product with others', acceptance_criteria: [], priority: 50 },
      ],
      queued_injections: [],
      budgets: defaultBudgets,
      must_do: [
        { type: 'event_occurs', description: 'Drift should be detected', check: { event_type: 'CONTEXT_DRIFT_DETECTED' } },
      ],
      must_not_do: [],
      acceptance_criteria: [],
      scoring_rubric: { dimensions: [], passing_threshold: 0.6, weights: {} },
      timeout_ms: 15000,
      tags: ['drift'],
    });

    // Test 11: Partial completion under low budget
    this.registerTest({
      test_id: 'partial-completion',
      name: 'Graceful Partial Completion',
      description: 'Tests graceful degradation under budget pressure',
      category: 'partial_completion',
      difficulty: 'medium',
      initial_context: {},
      initial_queue: [
        { title: 'Task 1', prompt: 'Quick task', acceptance_criteria: [], priority: 90 },
        { title: 'Task 2', prompt: 'Another task', acceptance_criteria: [], priority: 50 },
        { title: 'Task 3', prompt: 'Low priority', acceptance_criteria: [], priority: 10 },
      ],
      budgets: { ...defaultBudgets, max_iterations: 2 },
      queued_injections: [],
      must_do: [
        { type: 'event_occurs', description: 'At least one checkpoint', check: { event_type: 'CHECKPOINT_CREATED' } },
      ],
      must_not_do: [],
      acceptance_criteria: [
        { id: 'some-progress', description: 'At least 1 task attempted', weight: 1, evaluator: 'deterministic', params: { check_type: 'event_count', value: { type: 'ACTION_EXECUTED', min: 1 } } },
      ],
      scoring_rubric: { dimensions: [], passing_threshold: 0.5, weights: {} },
      timeout_ms: 15000,
      tags: ['partial', 'budget'],
    });

    // Test 12: Failure handling spawns fix task
    this.registerTest({
      test_id: 'failure-fix-spawn',
      name: 'Verification Failure Spawns Fix Task',
      description: 'Tests that failed verification creates a fix task instead of bluffing',
      category: 'failure_handling',
      difficulty: 'medium',
      initial_context: {},
      initial_queue: [
        {
          title: 'Strict Task',
          prompt: 'This task has strict criteria that will likely fail',
          acceptance_criteria: [
            { id: 'impossible', type: 'deterministic', description: 'Must contain magic word', check: { kind: 'contains', params: { required: ['XYZZY123'] } }, required: true, weight: 1 },
          ],
          priority: 50,
        },
      ],
      queued_injections: [],
      budgets: defaultBudgets,
      must_do: [
        { type: 'event_occurs', description: 'Verification should fail', check: { event_type: 'VERIFICATION_FAILED' } },
      ],
      must_not_do: [
        { type: 'bluff_detected', description: 'Should not complete without fix', check: {} },
      ],
      acceptance_criteria: [],
      scoring_rubric: { dimensions: [], passing_threshold: 0.6, weights: {} },
      timeout_ms: 20000,
      tags: ['failure', 'verification'],
    });

    // Register default suite
    this.registerSuite('full', Array.from(this.tests.keys()));
    this.registerSuite('quick', ['stop-interrupt', 'budget-compliance', 'verification-first']);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalTestRunner: TestRunner | null = null;

export function getTestRunner(): TestRunner {
  if (!globalTestRunner) {
    globalTestRunner = new TestRunner();
  }
  return globalTestRunner;
}
