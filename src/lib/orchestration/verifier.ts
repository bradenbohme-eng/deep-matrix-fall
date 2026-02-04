// Verifier + Auditor System
// Deterministic checks, rubric evaluation, and failure task spawning

import type {
  AcceptanceCriterion,
  DeterministicCheck,
  RubricCheck,
  VerificationResult,
  AuditResult,
  AuditFlag,
  Task,
  TaskResult,
  UUID,
  Timestamp,
  VerificationPolicy,
} from './types';
import { EventStore } from './eventStore';

// ============================================================================
// VERIFIER CLASS
// ============================================================================

export class Verifier {
  private eventStore: EventStore;
  private policy: VerificationPolicy;

  constructor(eventStore: EventStore, policy?: VerificationPolicy) {
    this.eventStore = eventStore;
    this.policy = policy ?? {
      verify_before_complete: true,
      retry_on_failure: true,
      max_verification_retries: 2,
      spawn_fix_task_on_failure: true,
      require_all_criteria: false,
    };
  }

  // --------------------------------------------------------------------------
  // Main Verification Entry Point
  // --------------------------------------------------------------------------

  async verify(
    task: Task,
    result: unknown
  ): Promise<{ passed: boolean; results: VerificationResult[]; score: number }> {
    const results: VerificationResult[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    let allPassed = true;
    let anyRequiredFailed = false;

    for (const criterion of task.acceptance_criteria) {
      const verificationResult = await this.verifyCriterion(criterion, result);
      results.push(verificationResult);

      // Track scores
      totalScore += verificationResult.score * criterion.weight;
      totalWeight += criterion.weight;

      // Track pass/fail
      if (!verificationResult.passed) {
        allPassed = false;
        if (criterion.required) {
          anyRequiredFailed = true;
        }
      }

      // Log event
      this.eventStore.append(
        verificationResult.passed ? 'VERIFICATION_PASSED' : 'VERIFICATION_FAILED',
        {
          criterion_id: criterion.id,
          check_type: criterion.type,
          passed: verificationResult.passed,
          score: verificationResult.score,
          details: verificationResult.details,
        },
        { taskId: task.task_id }
      );
    }

    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const passed = this.policy.require_all_criteria 
      ? allPassed 
      : !anyRequiredFailed && normalizedScore >= 0.5;

    this.eventStore.append('VERIFICATION_RUN', {
      task_id: task.task_id,
      passed,
      score: normalizedScore,
      results_count: results.length,
      failed_count: results.filter(r => !r.passed).length,
    }, { taskId: task.task_id });

    return { passed, results, score: normalizedScore };
  }

  // --------------------------------------------------------------------------
  // Individual Criterion Verification
  // --------------------------------------------------------------------------

  private async verifyCriterion(
    criterion: AcceptanceCriterion,
    result: unknown
  ): Promise<VerificationResult> {
    const timestamp = Date.now();

    if (criterion.type === 'deterministic') {
      return this.verifyDeterministic(criterion.id, criterion.check as DeterministicCheck, result, timestamp);
    } else {
      return await this.verifyRubric(criterion.id, criterion.check as RubricCheck, result, timestamp);
    }
  }

  // --------------------------------------------------------------------------
  // Deterministic Checks
  // --------------------------------------------------------------------------

  private verifyDeterministic(
    criterionId: string,
    check: DeterministicCheck,
    result: unknown,
    timestamp: Timestamp
  ): VerificationResult {
    try {
      switch (check.kind) {
        case 'schema':
          return this.checkSchema(criterionId, check.params, result, timestamp);
        case 'regex':
          return this.checkRegex(criterionId, check.params, result, timestamp);
        case 'contains':
          return this.checkContains(criterionId, check.params, result, timestamp);
        case 'not_contains':
          return this.checkNotContains(criterionId, check.params, result, timestamp);
        case 'word_limit':
          return this.checkWordLimit(criterionId, check.params, result, timestamp);
        case 'custom':
          return this.checkCustom(criterionId, check.params, result, timestamp);
        default:
          return {
            criterion_id: criterionId,
            passed: false,
            score: 0,
            check_type: 'deterministic',
            details: `Unknown check kind: ${check.kind}`,
            timestamp,
          };
      }
    } catch (error) {
      return {
        criterion_id: criterionId,
        passed: false,
        score: 0,
        check_type: 'deterministic',
        details: `Check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp,
      };
    }
  }

  private checkSchema(
    criterionId: string,
    params: Record<string, unknown>,
    result: unknown,
    timestamp: Timestamp
  ): VerificationResult {
    const schema = params.schema as Record<string, string>;
    if (!schema) {
      return { criterion_id: criterionId, passed: false, score: 0, check_type: 'deterministic', details: 'No schema provided', timestamp };
    }

    if (typeof result !== 'object' || result === null) {
      return { criterion_id: criterionId, passed: false, score: 0, check_type: 'deterministic', details: 'Result is not an object', timestamp };
    }

    const obj = result as Record<string, unknown>;
    const missingFields: string[] = [];
    const typeErrors: string[] = [];

    for (const [field, expectedType] of Object.entries(schema)) {
      if (!(field in obj)) {
        missingFields.push(field);
        continue;
      }

      const actualType = typeof obj[field];
      if (actualType !== expectedType) {
        typeErrors.push(`${field}: expected ${expectedType}, got ${actualType}`);
      }
    }

    const passed = missingFields.length === 0 && typeErrors.length === 0;
    const details = passed
      ? 'Schema validation passed'
      : `Missing: ${missingFields.join(', ')}. Type errors: ${typeErrors.join(', ')}`;

    return {
      criterion_id: criterionId,
      passed,
      score: passed ? 1 : 0,
      check_type: 'deterministic',
      details,
      evidence: { missingFields, typeErrors },
      timestamp,
    };
  }

  private checkRegex(
    criterionId: string,
    params: Record<string, unknown>,
    result: unknown,
    timestamp: Timestamp
  ): VerificationResult {
    const pattern = params.pattern as string;
    const flags = (params.flags as string) ?? '';
    
    if (!pattern) {
      return { criterion_id: criterionId, passed: false, score: 0, check_type: 'deterministic', details: 'No regex pattern provided', timestamp };
    }

    const text = typeof result === 'string' ? result : JSON.stringify(result);
    const regex = new RegExp(pattern, flags);
    const passed = regex.test(text);

    return {
      criterion_id: criterionId,
      passed,
      score: passed ? 1 : 0,
      check_type: 'deterministic',
      details: passed ? `Regex matched: ${pattern}` : `Regex did not match: ${pattern}`,
      timestamp,
    };
  }

  private checkContains(
    criterionId: string,
    params: Record<string, unknown>,
    result: unknown,
    timestamp: Timestamp
  ): VerificationResult {
    const required = params.required as string[];
    if (!required || !Array.isArray(required)) {
      return { criterion_id: criterionId, passed: false, score: 0, check_type: 'deterministic', details: 'No required strings provided', timestamp };
    }

    const text = typeof result === 'string' ? result : JSON.stringify(result);
    const missing = required.filter(r => !text.includes(r));
    const passed = missing.length === 0;

    return {
      criterion_id: criterionId,
      passed,
      score: (required.length - missing.length) / required.length,
      check_type: 'deterministic',
      details: passed ? 'All required strings found' : `Missing: ${missing.join(', ')}`,
      timestamp,
    };
  }

  private checkNotContains(
    criterionId: string,
    params: Record<string, unknown>,
    result: unknown,
    timestamp: Timestamp
  ): VerificationResult {
    const forbidden = params.forbidden as string[];
    if (!forbidden || !Array.isArray(forbidden)) {
      return { criterion_id: criterionId, passed: false, score: 0, check_type: 'deterministic', details: 'No forbidden strings provided', timestamp };
    }

    const text = typeof result === 'string' ? result : JSON.stringify(result);
    const found = forbidden.filter(f => text.includes(f));
    const passed = found.length === 0;

    return {
      criterion_id: criterionId,
      passed,
      score: (forbidden.length - found.length) / forbidden.length,
      check_type: 'deterministic',
      details: passed ? 'No forbidden strings found' : `Found forbidden: ${found.join(', ')}`,
      timestamp,
    };
  }

  private checkWordLimit(
    criterionId: string,
    params: Record<string, unknown>,
    result: unknown,
    timestamp: Timestamp
  ): VerificationResult {
    const minWords = (params.min as number) ?? 0;
    const maxWords = (params.max as number) ?? Infinity;

    const text = typeof result === 'string' ? result : JSON.stringify(result);
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const passed = wordCount >= minWords && wordCount <= maxWords;

    return {
      criterion_id: criterionId,
      passed,
      score: passed ? 1 : 0,
      check_type: 'deterministic',
      details: `Word count: ${wordCount} (range: ${minWords}-${maxWords})`,
      evidence: { wordCount, minWords, maxWords },
      timestamp,
    };
  }

  private checkCustom(
    criterionId: string,
    params: Record<string, unknown>,
    result: unknown,
    timestamp: Timestamp
  ): VerificationResult {
    const fn = params.fn as string;
    if (!fn) {
      return { criterion_id: criterionId, passed: false, score: 0, check_type: 'deterministic', details: 'No custom function provided', timestamp };
    }

    try {
      // Simple eval for custom checks (in production, use a sandboxed executor)
      const checkFn = new Function('result', fn);
      const passed = !!checkFn(result);

      return {
        criterion_id: criterionId,
        passed,
        score: passed ? 1 : 0,
        check_type: 'deterministic',
        details: passed ? 'Custom check passed' : 'Custom check failed',
        timestamp,
      };
    } catch (error) {
      return {
        criterion_id: criterionId,
        passed: false,
        score: 0,
        check_type: 'deterministic',
        details: `Custom check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Rubric Checks (LLM-based or rule-based)
  // --------------------------------------------------------------------------

  private async verifyRubric(
    criterionId: string,
    check: RubricCheck,
    result: unknown,
    timestamp: Timestamp
  ): Promise<VerificationResult> {
    // For now, implement rule-based rubric checks
    // LLM-based evaluation would integrate with the AI system
    
    if (check.evaluator === 'rule') {
      return this.evaluateRubricByRule(criterionId, check, result, timestamp);
    }

    // Placeholder for LLM evaluation
    return {
      criterion_id: criterionId,
      passed: true,
      score: 0.75, // Default moderate score for LLM checks
      check_type: 'rubric',
      details: `Rubric check (${check.kind}) - LLM evaluation pending`,
      timestamp,
    };
  }

  private evaluateRubricByRule(
    criterionId: string,
    check: RubricCheck,
    result: unknown,
    timestamp: Timestamp
  ): VerificationResult {
    const text = typeof result === 'string' ? result : JSON.stringify(result);
    let score = 0;
    let details = '';

    switch (check.kind) {
      case 'quality': {
        // Simple quality heuristics
        const hasStructure = /^#|^-|^\d\./.test(text);
        const hasPunctuation = /[.!?]/.test(text);
        const wordCount = text.split(/\s+/).length;
        score = (hasStructure ? 0.3 : 0) + (hasPunctuation ? 0.3 : 0) + (wordCount > 50 ? 0.4 : wordCount / 125);
        details = `Quality score: structure=${hasStructure}, punctuation=${hasPunctuation}, length=${wordCount}`;
        break;
      }
      case 'completeness': {
        // Check for common completeness markers
        const hasIntro = /^(#|introduction|overview)/im.test(text);
        const hasConclusion = /(conclusion|summary|in summary)/i.test(text);
        const hasSections = (text.match(/^#+\s/gm) || []).length >= 2;
        score = (hasIntro ? 0.3 : 0) + (hasConclusion ? 0.3 : 0) + (hasSections ? 0.4 : 0);
        details = `Completeness: intro=${hasIntro}, conclusion=${hasConclusion}, sections=${hasSections}`;
        break;
      }
      case 'consistency': {
        // Basic consistency check (no obvious contradictions)
        const hasContradiction = /(but not|however.*but|on the other hand.*but)/i.test(text);
        score = hasContradiction ? 0.5 : 1;
        details = `Consistency: potential contradictions=${hasContradiction}`;
        break;
      }
      case 'relevance': {
        // Default to passing for relevance without context
        score = 0.8;
        details = 'Relevance check requires context comparison';
        break;
      }
      default:
        score = 0.5;
        details = `Unknown rubric kind: ${check.kind}`;
    }

    const passed = score >= check.threshold;

    return {
      criterion_id: criterionId,
      passed,
      score,
      check_type: 'rubric',
      details,
      timestamp,
    };
  }

  // --------------------------------------------------------------------------
  // Policy Getters
  // --------------------------------------------------------------------------

  shouldSpawnFixTask(): boolean {
    return this.policy.spawn_fix_task_on_failure;
  }

  getMaxRetries(): number {
    return this.policy.max_verification_retries;
  }
}

// ============================================================================
// AUDITOR CLASS
// ============================================================================

export class Auditor {
  private eventStore: EventStore;

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  // --------------------------------------------------------------------------
  // Main Audit Entry Point
  // --------------------------------------------------------------------------

  audit(task: Task, verificationResults: VerificationResult[]): AuditResult {
    const flags: AuditFlag[] = [];
    const recommendations: string[] = [];

    // Check for bluffing (claiming completion without verification)
    if (task.status === 'done' && verificationResults.length === 0) {
      flags.push({
        type: 'bluff',
        severity: 'warning',
        description: 'Task marked complete without any verification checks',
        evidence: ['No verification results found'],
      });
      recommendations.push('Add acceptance criteria and run verification before completing tasks');
    }

    // Check for incomplete work
    const failedRequired = verificationResults.filter(r => !r.passed);
    if (failedRequired.length > 0 && task.status === 'done') {
      flags.push({
        type: 'incomplete',
        severity: 'error',
        description: `${failedRequired.length} verification check(s) failed but task marked complete`,
        evidence: failedRequired.map(r => r.details),
      });
      recommendations.push('Create fix tasks for failed verification checks');
    }

    // Check for contradictions in task history
    const contradictions = this.detectContradictions(task);
    if (contradictions.length > 0) {
      flags.push({
        type: 'contradiction',
        severity: 'warning',
        description: 'Contradictory changes detected in task history',
        evidence: contradictions,
      });
      recommendations.push('Review task history for conflicting decisions');
    }

    // Calculate overall score
    const avgScore = verificationResults.length > 0
      ? verificationResults.reduce((sum, r) => sum + r.score, 0) / verificationResults.length
      : 0;

    const auditResult: AuditResult = {
      task_id: task.task_id,
      overall_score: avgScore,
      criteria_results: verificationResults,
      flags,
      recommendations,
      timestamp: Date.now(),
    };

    // Log audit event
    this.eventStore.append('AUDIT_NOTE', {
      task_id: task.task_id,
      flags_count: flags.length,
      overall_score: avgScore,
      severity: this.getMaxSeverity(flags),
    }, { taskId: task.task_id });

    return auditResult;
  }

  // --------------------------------------------------------------------------
  // Contradiction Detection
  // --------------------------------------------------------------------------

  private detectContradictions(task: Task): string[] {
    const contradictions: string[] = [];
    const history = task.history;

    // Look for flip-flopping on the same field
    const fieldChanges: Record<string, { values: unknown[]; timestamps: number[] }> = {};

    for (const entry of history) {
      if (!fieldChanges[entry.field]) {
        fieldChanges[entry.field] = { values: [], timestamps: [] };
      }
      fieldChanges[entry.field].values.push(entry.newValue);
      fieldChanges[entry.field].timestamps.push(entry.timestamp);
    }

    for (const [field, data] of Object.entries(fieldChanges)) {
      if (data.values.length >= 3) {
        // Check if we've seen the same value twice (flip-flop)
        const seen = new Set();
        for (const value of data.values) {
          const key = JSON.stringify(value);
          if (seen.has(key)) {
            contradictions.push(`Field '${field}' has been set to the same value multiple times`);
            break;
          }
          seen.add(key);
        }
      }
    }

    return contradictions;
  }

  private getMaxSeverity(flags: AuditFlag[]): string {
    const severityOrder = ['critical', 'error', 'warning', 'info'];
    for (const severity of severityOrder) {
      if (flags.some(f => f.severity === severity)) {
        return severity;
      }
    }
    return 'info';
  }

  // --------------------------------------------------------------------------
  // Drift Detection
  // --------------------------------------------------------------------------

  detectDrift(
    pinnedConstraints: string[],
    currentContext: string
  ): { drifted: boolean; violations: string[] } {
    const violations: string[] = [];

    for (const constraint of pinnedConstraints) {
      // Simple check: constraint keywords should appear in context
      const keywords = constraint.split(/\s+/).filter(w => w.length > 4);
      const contextLower = currentContext.toLowerCase();
      
      const missingKeywords = keywords.filter(k => !contextLower.includes(k.toLowerCase()));
      if (missingKeywords.length > keywords.length / 2) {
        violations.push(`Constraint may not be honored: "${constraint.substring(0, 50)}..."`);
      }
    }

    if (violations.length > 0) {
      this.eventStore.append('CONTEXT_DRIFT_DETECTED', {
        violations,
        constraint_count: pinnedConstraints.length,
      });
    }

    return {
      drifted: violations.length > 0,
      violations,
    };
  }
}
