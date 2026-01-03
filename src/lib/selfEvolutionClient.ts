// Self-Evolution Client for AIMOS
// Provides frontend access to autonomous development, introspection, and calibration capabilities

import { supabase } from '@/integrations/supabase/client';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface DiagnosticResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  latency: number;
  details: string;
  suggestions: string[];
}

export interface IntrospectionResult {
  systemState: {
    memory: { atomCount: number; chainCount: number; planCount: number };
    reasoning: { avgDepth: number; avgCoherence: number; sampleSize: number };
    performance: { recentMetrics: any[] };
    timestamp: string;
  };
  diagnostics: DiagnosticResult[];
  recommendations: string[];
  evolutionPotential: number;
}

export interface BottleneckAnalysis {
  bottlenecks: Array<{
    type: string;
    severity: 'info' | 'warning' | 'critical';
    details: string;
    recommendation: string;
  }>;
  stats: {
    totalChains: number;
    totalAtoms: number;
    avgDepth: number;
    avgMemorySize: number;
    confidenceRatio: number;
  };
  timeRange: number;
}

export interface SandboxResult {
  success: boolean;
  result?: any;
  output?: string[];
  error?: string;
  executionTime: number;
}

export interface PromptChainTest {
  chainId: string;
  steps: Array<{
    stepId: number;
    prompt: string;
    response: string;
    latency: number;
    tokens: number;
    confidence: number;
  }>;
  totalLatency: number;
  tokenUsage: number;
  successRate: number;
  bottlenecks: string[];
}

export interface CalibrationResult {
  parameter: string;
  originalValue: any;
  optimizedValue: any;
  improvement: number;
  testResults: any[];
}

export interface EvolutionSuggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  implementation: string;
  expectedImpact: string;
}

export interface BenchmarkResult {
  name: string;
  latency: number;
  unit: string;
}

// ═══════════════════════════════════════════════════════════════════
// SELF-EVOLUTION CLIENT CLASS
// ═══════════════════════════════════════════════════════════════════

export class SelfEvolutionClient {
  private userId?: string;
  private sessionId: string;

  constructor(userId?: string) {
    this.userId = userId;
    this.sessionId = crypto.randomUUID();
  }

  private async invoke(action: string, payload?: Record<string, any>): Promise<any> {
    const { data, error } = await supabase.functions.invoke('self-evolution', {
      body: {
        action,
        payload,
        userId: this.userId,
        sessionId: this.sessionId
      }
    });

    if (error) throw error;
    return data;
  }

  // ═══════════════════════════════════════════════════════════════
  // INTROSPECTION METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Full system introspection - examines all AIMOS components
   */
  async introspect(): Promise<IntrospectionResult> {
    const result = await this.invoke('introspect');
    return result.introspection;
  }

  /**
   * Analyze system bottlenecks over a time period
   */
  async analyzeBottlenecks(timeRangeHours: number = 24): Promise<BottleneckAnalysis> {
    const result = await this.invoke('analyze_bottlenecks', { timeRange: timeRangeHours });
    return result;
  }

  /**
   * Examine prompt patterns and effectiveness
   */
  async examinePrompts(): Promise<any> {
    const result = await this.invoke('examine_prompts');
    return result.promptAnalysis;
  }

  /**
   * Examine memory system state
   */
  async examineMemory(): Promise<any> {
    const result = await this.invoke('examine_memory');
    return result.memoryExamination;
  }

  // ═══════════════════════════════════════════════════════════════
  // SANDBOX METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Execute code in isolated sandbox
   */
  async executeSandbox(code: string, language: 'javascript' | 'json' | 'prompt' = 'javascript'): Promise<SandboxResult> {
    const result = await this.invoke('execute_sandbox', { code, language });
    return result;
  }

  /**
   * Test JSON schema validation
   */
  async testJsonSchema(schema: any, testData?: any): Promise<any> {
    const result = await this.invoke('test_json_schema', { schema, testData });
    return result.schemaTest;
  }

  /**
   * Test a prompt chain with optional input
   */
  async testPromptChain(chain: string[], testInput?: string): Promise<PromptChainTest> {
    const result = await this.invoke('test_prompt_chain', { chain, testInput });
    return result.chainTest;
  }

  // ═══════════════════════════════════════════════════════════════
  // CALIBRATION METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calibrate reasoning parameters
   */
  async calibrateReasoning(targetMetric: 'depth' | 'coherence' | 'completeness' = 'depth'): Promise<any> {
    const result = await this.invoke('calibrate_reasoning', { targetMetric });
    return result.calibration;
  }

  /**
   * Calibrate memory system
   */
  async calibrateMemory(): Promise<any> {
    const result = await this.invoke('calibrate_memory');
    return result.memoryCalibration;
  }

  /**
   * Calibrate confidence thresholds
   */
  async calibrateConfidence(): Promise<any> {
    const result = await this.invoke('calibrate_confidence');
    return result.confidenceCalibration;
  }

  /**
   * Optimize a prompt using AI
   */
  async optimizePrompt(prompt: string, goal: 'clarity' | 'conciseness' | 'effectiveness' = 'clarity'): Promise<any> {
    const result = await this.invoke('optimize_prompts', { targetPrompt: prompt, optimizationGoal: goal });
    return result.promptOptimization;
  }

  // ═══════════════════════════════════════════════════════════════
  // DIAGNOSTIC METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Run full system diagnostics
   */
  async runDiagnostics(): Promise<{ diagnostics: DiagnosticResult[]; overallHealth: number }> {
    const result = await this.invoke('run_diagnostics');
    return result;
  }

  /**
   * Benchmark system performance
   */
  async benchmarkSystem(): Promise<{ benchmarks: BenchmarkResult[] }> {
    const result = await this.invoke('benchmark_system');
    return result;
  }

  /**
   * Analyze performance trends
   */
  async analyzePerformance(timeRangeHours: number = 24): Promise<any> {
    const result = await this.invoke('analyze_performance', { timeRange: timeRangeHours });
    return result.performance;
  }

  // ═══════════════════════════════════════════════════════════════
  // EVOLUTION METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get AI-generated evolution suggestions
   */
  async suggestEvolutions(): Promise<{ suggestions: EvolutionSuggestion[]; systemState: any }> {
    const result = await this.invoke('suggest_evolution');
    return {
      suggestions: result.evolutionSuggestions,
      systemState: result.systemState
    };
  }

  /**
   * Apply an evolution (records the change)
   */
  async applyEvolution(evolutionId: string, parameters: Record<string, any>): Promise<any> {
    const result = await this.invoke('apply_evolution', { evolutionId, parameters });
    return result;
  }

  /**
   * Rollback an evolution
   */
  async rollbackEvolution(evolutionId: string): Promise<any> {
    const result = await this.invoke('rollback_evolution', { evolutionId });
    return result;
  }

  /**
   * Get evolution history
   */
  async getEvolutionHistory(): Promise<any[]> {
    const result = await this.invoke('get_evolution_history');
    return result.evolutionHistory;
  }
}

// ═══════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function createSelfEvolutionClient(userId?: string): SelfEvolutionClient {
  return new SelfEvolutionClient(userId);
}

// ═══════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';

export function useSelfEvolution(userId?: string) {
  const clientRef = useRef<SelfEvolutionClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  if (!clientRef.current) {
    clientRef.current = new SelfEvolutionClient(userId);
  }

  const execute = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    client: clientRef.current,
    isLoading,
    error,
    
    // Introspection
    introspect: useCallback(() => execute(() => clientRef.current!.introspect()), [execute]),
    analyzeBottlenecks: useCallback((hours?: number) => execute(() => clientRef.current!.analyzeBottlenecks(hours)), [execute]),
    examinePrompts: useCallback(() => execute(() => clientRef.current!.examinePrompts()), [execute]),
    examineMemory: useCallback(() => execute(() => clientRef.current!.examineMemory()), [execute]),
    
    // Sandbox
    executeSandbox: useCallback((code: string, lang?: 'javascript' | 'json' | 'prompt') => 
      execute(() => clientRef.current!.executeSandbox(code, lang)), [execute]),
    testJsonSchema: useCallback((schema: any, testData?: any) => 
      execute(() => clientRef.current!.testJsonSchema(schema, testData)), [execute]),
    testPromptChain: useCallback((chain: string[], input?: string) => 
      execute(() => clientRef.current!.testPromptChain(chain, input)), [execute]),
    
    // Calibration
    calibrateReasoning: useCallback((metric?: 'depth' | 'coherence' | 'completeness') => 
      execute(() => clientRef.current!.calibrateReasoning(metric)), [execute]),
    calibrateMemory: useCallback(() => execute(() => clientRef.current!.calibrateMemory()), [execute]),
    calibrateConfidence: useCallback(() => execute(() => clientRef.current!.calibrateConfidence()), [execute]),
    optimizePrompt: useCallback((prompt: string, goal?: 'clarity' | 'conciseness' | 'effectiveness') => 
      execute(() => clientRef.current!.optimizePrompt(prompt, goal)), [execute]),
    
    // Diagnostics
    runDiagnostics: useCallback(() => execute(() => clientRef.current!.runDiagnostics()), [execute]),
    benchmarkSystem: useCallback(() => execute(() => clientRef.current!.benchmarkSystem()), [execute]),
    analyzePerformance: useCallback((hours?: number) => execute(() => clientRef.current!.analyzePerformance(hours)), [execute]),
    
    // Evolution
    suggestEvolutions: useCallback(() => execute(() => clientRef.current!.suggestEvolutions()), [execute]),
    applyEvolution: useCallback((id: string, params: Record<string, any>) => 
      execute(() => clientRef.current!.applyEvolution(id, params)), [execute]),
    rollbackEvolution: useCallback((id: string) => execute(() => clientRef.current!.rollbackEvolution(id)), [execute]),
    getEvolutionHistory: useCallback(() => execute(() => clientRef.current!.getEvolutionHistory()), [execute])
  };
}
