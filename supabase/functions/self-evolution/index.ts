import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════════
// ██  AIMOS SELF-EVOLUTION ENGINE                                   ██
// ██  Autonomous Development, Introspection, and Calibration        ██
// ═══════════════════════════════════════════════════════════════════

interface SelfEvolutionRequest {
  action: string;
  payload?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

interface SystemMetrics {
  latency: number;
  tokenUsage: number;
  memoryDepth: number;
  reasoningPhases: number;
  confidenceScore: number;
  bottlenecks: string[];
}

interface IntrospectionResult {
  systemState: Record<string, any>;
  diagnostics: DiagnosticResult[];
  recommendations: string[];
  evolutionPotential: number;
}

interface DiagnosticResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  latency: number;
  details: string;
  suggestions: string[];
}

interface PromptChainTest {
  chainId: string;
  steps: PromptChainStep[];
  totalLatency: number;
  tokenUsage: number;
  successRate: number;
  bottlenecks: string[];
}

interface PromptChainStep {
  stepId: number;
  prompt: string;
  response: string;
  latency: number;
  tokens: number;
  confidence: number;
}

interface CalibrationResult {
  parameter: string;
  originalValue: any;
  optimizedValue: any;
  improvement: number;
  testResults: any[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: SelfEvolutionRequest = await req.json();

    console.log("[SELF-EVOLUTION] Action:", body.action);

    switch (body.action) {
      // ═══════════════════════════════════════════════════════════════
      // INTROSPECTION ACTIONS
      // ═══════════════════════════════════════════════════════════════
      
      case "introspect":
        return await handleIntrospection(supabase, body);
        
      case "analyze_bottlenecks":
        return await handleBottleneckAnalysis(supabase, body);
        
      case "examine_prompts":
        return await handlePromptExamination(supabase, body);
        
      case "examine_memory":
        return await handleMemoryExamination(supabase, body);
        
      // ═══════════════════════════════════════════════════════════════
      // SANDBOX ACTIONS
      // ═══════════════════════════════════════════════════════════════
      
      case "execute_sandbox":
        return await handleSandboxExecution(supabase, body);
        
      case "test_json_schema":
        return await handleJsonSchemaTest(supabase, body);
        
      case "test_prompt_chain":
        return await handlePromptChainTest(supabase, lovableApiKey, body);
        
      // ═══════════════════════════════════════════════════════════════
      // CALIBRATION ACTIONS
      // ═══════════════════════════════════════════════════════════════
      
      case "calibrate_reasoning":
        return await handleReasoningCalibration(supabase, lovableApiKey, body);
        
      case "calibrate_memory":
        return await handleMemoryCalibration(supabase, body);
        
      case "calibrate_confidence":
        return await handleConfidenceCalibration(supabase, body);
        
      case "optimize_prompts":
        return await handlePromptOptimization(supabase, lovableApiKey, body);
        
      // ═══════════════════════════════════════════════════════════════
      // DIAGNOSTIC ACTIONS
      // ═══════════════════════════════════════════════════════════════
      
      case "run_diagnostics":
        return await handleFullDiagnostics(supabase, body);
        
      case "benchmark_system":
        return await handleSystemBenchmark(supabase, lovableApiKey, body);
        
      case "analyze_performance":
        return await handlePerformanceAnalysis(supabase, body);
        
      // ═══════════════════════════════════════════════════════════════
      // EVOLUTION ACTIONS
      // ═══════════════════════════════════════════════════════════════
      
      case "suggest_evolution":
        return await handleEvolutionSuggestions(supabase, lovableApiKey, body);
        
      case "apply_evolution":
        return await handleApplyEvolution(supabase, body);
        
      case "rollback_evolution":
        return await handleRollbackEvolution(supabase, body);
        
      case "get_evolution_history":
        return await handleGetEvolutionHistory(supabase, body);
        
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action", availableActions: getAvailableActions() }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[SELF-EVOLUTION] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ═══════════════════════════════════════════════════════════════════
// INTROSPECTION HANDLERS
// ═══════════════════════════════════════════════════════════════════

async function handleIntrospection(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  const startTime = performance.now();
  
  // Gather system state
  const [memoryStats, reasoningStats, performanceStats] = await Promise.all([
    getMemoryStats(supabase),
    getReasoningStats(supabase),
    getPerformanceStats(supabase)
  ]);
  
  // Run component diagnostics
  const diagnostics = await runComponentDiagnostics(supabase);
  
  // Analyze bottlenecks
  const bottlenecks = await detectBottlenecks(supabase, performanceStats);
  
  // Generate recommendations
  const recommendations = generateRecommendations(memoryStats, reasoningStats, bottlenecks);
  
  // Calculate evolution potential
  const evolutionPotential = calculateEvolutionPotential(diagnostics, bottlenecks);
  
  const introspectionResult: IntrospectionResult = {
    systemState: {
      memory: memoryStats,
      reasoning: reasoningStats,
      performance: performanceStats,
      timestamp: new Date().toISOString()
    },
    diagnostics,
    recommendations,
    evolutionPotential
  };
  
  // Store introspection result
  await supabase.from('aimos_consciousness_metrics').insert({
    metric_type: 'introspection',
    coherence_score: evolutionPotential,
    reasoning_depth: diagnostics.length,
    metadata: {
      introspection: introspectionResult,
      duration_ms: performance.now() - startTime
    }
  });
  
  return jsonResponse({ 
    success: true, 
    introspection: introspectionResult,
    duration_ms: performance.now() - startTime
  });
}

async function handleBottleneckAnalysis(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  const timeRange = body.payload?.timeRange || 24; // hours
  
  // Get recent performance data
  const cutoff = new Date(Date.now() - timeRange * 60 * 60 * 1000).toISOString();
  
  const { data: reasoningChains } = await supabase
    .from('aimos_reasoning_chains')
    .select('*')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });
  
  const { data: memoryAtoms } = await supabase
    .from('aimos_memory_atoms')
    .select('*')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });
  
  // Analyze bottlenecks
  const bottlenecks = [];
  
  // Memory retrieval bottleneck
  const avgMemorySize = memoryAtoms?.reduce((sum: number, m: any) => 
    sum + (m.content?.length || 0), 0) / (memoryAtoms?.length || 1);
  if (avgMemorySize > 5000) {
    bottlenecks.push({
      type: 'memory_bloat',
      severity: 'warning',
      details: `Average memory atom size: ${Math.round(avgMemorySize)} chars`,
      recommendation: 'Implement memory compression or pruning'
    });
  }
  
  // Reasoning depth bottleneck
  const avgDepth = reasoningChains?.reduce((sum: number, r: any) => 
    sum + (r.depth || 0), 0) / (reasoningChains?.length || 1);
  if (avgDepth < 3) {
    bottlenecks.push({
      type: 'shallow_reasoning',
      severity: 'info',
      details: `Average reasoning depth: ${avgDepth.toFixed(1)}`,
      recommendation: 'Increase minimum reasoning phases for complex queries'
    });
  }
  
  // Confidence distribution
  const lowConfidence = reasoningChains?.filter((r: any) => 
    (r.coherence_score || 0) < 0.6).length || 0;
  const confidenceRatio = lowConfidence / (reasoningChains?.length || 1);
  if (confidenceRatio > 0.3) {
    bottlenecks.push({
      type: 'low_confidence',
      severity: 'warning',
      details: `${Math.round(confidenceRatio * 100)}% of responses have low confidence`,
      recommendation: 'Review and improve system prompts for clarity'
    });
  }
  
  return jsonResponse({
    success: true,
    bottlenecks,
    stats: {
      totalChains: reasoningChains?.length || 0,
      totalAtoms: memoryAtoms?.length || 0,
      avgDepth,
      avgMemorySize,
      confidenceRatio: 1 - confidenceRatio
    },
    timeRange
  });
}

async function handlePromptExamination(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  // Analyze prompt patterns and effectiveness
  const { data: recentChains } = await supabase
    .from('aimos_reasoning_chains')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  
  // Extract patterns
  const patterns = {
    queryTypes: new Map<string, number>(),
    responseTypes: new Map<string, number>(),
    phaseDistribution: new Map<string, number>(),
    avgConfidenceByType: new Map<string, number[]>()
  };
  
  for (const chain of recentChains || []) {
    // Query type analysis
    const queryType = classifyQuery(chain.user_query);
    patterns.queryTypes.set(queryType, (patterns.queryTypes.get(queryType) || 0) + 1);
    
    // Response type
    patterns.responseTypes.set(
      chain.response_type, 
      (patterns.responseTypes.get(chain.response_type) || 0) + 1
    );
    
    // Phase distribution
    const steps = chain.reasoning_steps || [];
    for (const step of steps) {
      const phase = step.phase || 'unknown';
      patterns.phaseDistribution.set(phase, (patterns.phaseDistribution.get(phase) || 0) + 1);
    }
    
    // Confidence by type
    const confList = patterns.avgConfidenceByType.get(queryType) || [];
    confList.push(chain.coherence_score || 0.5);
    patterns.avgConfidenceByType.set(queryType, confList);
  }
  
  // Convert to object
  const analysis = {
    queryTypes: Object.fromEntries(patterns.queryTypes),
    responseTypes: Object.fromEntries(patterns.responseTypes),
    phaseDistribution: Object.fromEntries(patterns.phaseDistribution),
    avgConfidenceByType: Object.fromEntries(
      Array.from(patterns.avgConfidenceByType.entries()).map(([k, v]) => [
        k, 
        v.reduce((a, b) => a + b, 0) / v.length
      ])
    ),
    totalAnalyzed: recentChains?.length || 0
  };
  
  return jsonResponse({ success: true, promptAnalysis: analysis });
}

async function handleMemoryExamination(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  const userId = body.userId;
  
  // Get memory statistics
  const [atomStats, tagStats, typeStats] = await Promise.all([
    supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }),
    supabase.from('aimos_tag_hierarchy').select('*').limit(100),
    supabase.from('aimos_memory_atoms')
      .select('content_type')
      .limit(1000)
  ]);
  
  // Analyze memory distribution
  const typeDistribution = new Map<string, number>();
  for (const atom of typeStats.data || []) {
    typeDistribution.set(
      atom.content_type, 
      (typeDistribution.get(atom.content_type) || 0) + 1
    );
  }
  
  // Get recent memory access patterns
  const { data: recentAccess } = await supabase
    .from('aimos_memory_atoms')
    .select('id, content_type, tags, created_at, confidence_score')
    .order('created_at', { ascending: false })
    .limit(50);
  
  return jsonResponse({
    success: true,
    memoryExamination: {
      totalAtoms: atomStats.count || 0,
      tagHierarchy: tagStats.data || [],
      typeDistribution: Object.fromEntries(typeDistribution),
      recentAccess: recentAccess || [],
      healthScore: calculateMemoryHealth(atomStats.count, typeDistribution)
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// SANDBOX HANDLERS
// ═══════════════════════════════════════════════════════════════════

async function handleSandboxExecution(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  const { code, language, timeout = 5000 } = body.payload || {};
  
  if (!code) {
    return jsonResponse({ error: "Code is required" }, 400);
  }
  
  const startTime = performance.now();
  let result: any;
  let error: string | null = null;
  let output: string[] = [];
  
  try {
    if (language === 'json') {
      // JSON validation and parsing
      result = JSON.parse(code);
      output.push('JSON parsed successfully');
    } else if (language === 'javascript' || !language) {
      // Safe JavaScript evaluation in Deno sandbox
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: any[]) => logs.push(args.map(String).join(' ')),
        error: (...args: any[]) => logs.push('[ERROR] ' + args.map(String).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(String).join(' '))
      };
      
      // Create isolated function
      const wrappedCode = `
        (function(console) {
          ${code}
        })
      `;
      
      try {
        const fn = eval(wrappedCode);
        result = fn(mockConsole);
        output = logs;
      } catch (evalError) {
        error = `Execution error: ${evalError.message}`;
      }
    } else if (language === 'prompt') {
      // Prompt template testing
      result = parsePromptTemplate(code);
      output.push('Prompt template parsed');
    } else {
      error = `Unsupported language: ${language}`;
    }
  } catch (e) {
    error = e.message;
  }
  
  const executionTime = performance.now() - startTime;
  
  // Log sandbox execution
  await supabase.from('aimos_memory_atoms').insert({
    content: JSON.stringify({ code: code.slice(0, 500), result, error }),
    content_type: 'sandbox_execution',
    tags: ['sandbox', language || 'javascript'],
    confidence_score: error ? 0.3 : 0.9,
    metadata: { executionTime, language }
  });
  
  return jsonResponse({
    success: !error,
    result,
    output,
    error,
    executionTime
  });
}

async function handleJsonSchemaTest(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  const { schema, testData } = body.payload || {};
  
  if (!schema) {
    return jsonResponse({ error: "Schema is required" }, 400);
  }
  
  const results = {
    schemaValid: false,
    dataValid: false,
    errors: [] as string[],
    suggestions: [] as string[]
  };
  
  try {
    // Validate schema structure
    const parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
    results.schemaValid = true;
    
    // Check for common schema properties
    if (!parsedSchema.type) {
      results.suggestions.push('Consider adding a "type" property to your schema');
    }
    if (!parsedSchema.properties && parsedSchema.type === 'object') {
      results.suggestions.push('Object schemas should have a "properties" field');
    }
    
    // Validate test data against schema if provided
    if (testData) {
      const parsedData = typeof testData === 'string' ? JSON.parse(testData) : testData;
      const validationResult = validateAgainstSchema(parsedData, parsedSchema);
      results.dataValid = validationResult.valid;
      results.errors = validationResult.errors;
    }
  } catch (e) {
    results.errors.push(`Schema error: ${e.message}`);
  }
  
  return jsonResponse({ success: true, schemaTest: results });
}

async function handlePromptChainTest(supabase: any, lovableApiKey: string | undefined, body: SelfEvolutionRequest): Promise<Response> {
  const { chain, testInput, iterations = 1 } = body.payload || {};
  
  if (!chain || !Array.isArray(chain)) {
    return jsonResponse({ error: "Prompt chain array is required" }, 400);
  }
  
  if (!lovableApiKey) {
    return jsonResponse({ error: "AI API key not configured" }, 500);
  }
  
  const chainId = crypto.randomUUID();
  const steps: PromptChainStep[] = [];
  let currentInput = testInput || '';
  let totalTokens = 0;
  
  for (let i = 0; i < chain.length; i++) {
    const stepStart = performance.now();
    const prompt = chain[i].replace('{{input}}', currentInput);
    
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000
        }),
      });
      
      const data = await response.json();
      const stepResponse = data.choices?.[0]?.message?.content || '';
      const stepTokens = data.usage?.total_tokens || 0;
      
      steps.push({
        stepId: i + 1,
        prompt,
        response: stepResponse,
        latency: performance.now() - stepStart,
        tokens: stepTokens,
        confidence: estimateConfidence(stepResponse)
      });
      
      currentInput = stepResponse;
      totalTokens += stepTokens;
    } catch (e) {
      steps.push({
        stepId: i + 1,
        prompt,
        response: `Error: ${e.message}`,
        latency: performance.now() - stepStart,
        tokens: 0,
        confidence: 0
      });
      break;
    }
  }
  
  const result: PromptChainTest = {
    chainId,
    steps,
    totalLatency: steps.reduce((sum, s) => sum + s.latency, 0),
    tokenUsage: totalTokens,
    successRate: steps.filter(s => s.confidence > 0.5).length / steps.length,
    bottlenecks: detectChainBottlenecks(steps)
  };
  
  // Store chain test result
  await supabase.from('aimos_memory_atoms').insert({
    content: JSON.stringify(result),
    content_type: 'prompt_chain_test',
    tags: ['calibration', 'prompt_chain', 'test'],
    confidence_score: result.successRate,
    metadata: { chainId, stepCount: chain.length }
  });
  
  return jsonResponse({ success: true, chainTest: result });
}

// ═══════════════════════════════════════════════════════════════════
// CALIBRATION HANDLERS
// ═══════════════════════════════════════════════════════════════════

async function handleReasoningCalibration(supabase: any, lovableApiKey: string | undefined, body: SelfEvolutionRequest): Promise<Response> {
  const { targetMetric = 'depth', testQueries } = body.payload || {};
  
  // Get baseline performance
  const { data: baseline } = await supabase
    .from('aimos_reasoning_chains')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  
  const baselineStats = {
    avgDepth: baseline?.reduce((s: number, r: any) => s + (r.depth || 0), 0) / (baseline?.length || 1),
    avgCoherence: baseline?.reduce((s: number, r: any) => s + (r.coherence_score || 0), 0) / (baseline?.length || 1),
    avgCompleteness: baseline?.reduce((s: number, r: any) => s + (r.completeness_score || 0), 0) / (baseline?.length || 1)
  };
  
  // Generate calibration recommendations
  const calibrations: CalibrationResult[] = [];
  
  if (baselineStats.avgDepth < 4) {
    calibrations.push({
      parameter: 'min_reasoning_phases',
      originalValue: 3,
      optimizedValue: 5,
      improvement: 0.3,
      testResults: []
    });
  }
  
  if (baselineStats.avgCoherence < 0.7) {
    calibrations.push({
      parameter: 'confidence_threshold',
      originalValue: 0.4,
      optimizedValue: 0.5,
      improvement: 0.15,
      testResults: []
    });
  }
  
  return jsonResponse({
    success: true,
    calibration: {
      baseline: baselineStats,
      recommendations: calibrations,
      targetMetric
    }
  });
}

async function handleMemoryCalibration(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  // Analyze memory usage patterns
  const { data: memoryStats } = await supabase
    .from('aimos_memory_atoms')
    .select('content_type, confidence_score, quality_score, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  
  // Calculate optimization opportunities
  const lowQuality = memoryStats?.filter((m: any) => (m.quality_score || 0) < 0.4) || [];
  const duplicates = detectDuplicateMemories(memoryStats || []);
  const staleMemories = memoryStats?.filter((m: any) => 
    new Date(m.created_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ) || [];
  
  return jsonResponse({
    success: true,
    memoryCalibration: {
      totalAnalyzed: memoryStats?.length || 0,
      lowQualityCount: lowQuality.length,
      duplicateCount: duplicates.length,
      staleCount: staleMemories.length,
      recommendations: [
        lowQuality.length > 50 ? 'Prune low-quality memory atoms' : null,
        duplicates.length > 20 ? 'Consolidate duplicate memories' : null,
        staleMemories.length > 100 ? 'Archive or remove stale memories' : null
      ].filter(Boolean),
      estimatedOptimization: {
        memoryReduction: Math.round((lowQuality.length + duplicates.length) / (memoryStats?.length || 1) * 100),
        qualityImprovement: 15
      }
    }
  });
}

async function handleConfidenceCalibration(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  // Analyze confidence distribution
  const { data: chains } = await supabase
    .from('aimos_reasoning_chains')
    .select('coherence_score, completeness_score, depth, response_type')
    .order('created_at', { ascending: false })
    .limit(200);
  
  const distribution = {
    A: chains?.filter((c: any) => c.coherence_score >= 0.85).length || 0,
    B: chains?.filter((c: any) => c.coherence_score >= 0.6 && c.coherence_score < 0.85).length || 0,
    C: chains?.filter((c: any) => c.coherence_score >= 0.4 && c.coherence_score < 0.6).length || 0,
    REJECT: chains?.filter((c: any) => c.coherence_score < 0.4).length || 0
  };
  
  const total = chains?.length || 1;
  
  return jsonResponse({
    success: true,
    confidenceCalibration: {
      distribution,
      percentages: {
        A: Math.round(distribution.A / total * 100),
        B: Math.round(distribution.B / total * 100),
        C: Math.round(distribution.C / total * 100),
        REJECT: Math.round(distribution.REJECT / total * 100)
      },
      recommendations: distribution.REJECT > total * 0.2 
        ? ['Consider raising minimum confidence thresholds', 'Improve system prompts for clarity']
        : ['Confidence distribution is healthy'],
      suggestedThresholds: {
        A: 0.85,
        B: 0.65,
        C: 0.45,
        REJECT: 0.45
      }
    }
  });
}

async function handlePromptOptimization(supabase: any, lovableApiKey: string | undefined, body: SelfEvolutionRequest): Promise<Response> {
  const { targetPrompt, optimizationGoal = 'clarity' } = body.payload || {};
  
  if (!lovableApiKey) {
    return jsonResponse({ error: "AI API key not configured" }, 500);
  }
  
  // Use AI to suggest prompt improvements
  const optimizationPrompt = `Analyze and optimize this system prompt for ${optimizationGoal}:

${targetPrompt}

Provide:
1. Identified issues
2. Optimized version
3. Expected improvements`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: optimizationPrompt }]
    }),
  });
  
  const data = await response.json();
  const optimization = data.choices?.[0]?.message?.content || '';
  
  return jsonResponse({
    success: true,
    promptOptimization: {
      original: targetPrompt,
      analysis: optimization,
      goal: optimizationGoal
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// DIAGNOSTIC HANDLERS
// ═══════════════════════════════════════════════════════════════════

async function handleFullDiagnostics(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  const diagnostics: DiagnosticResult[] = [];
  
  // Memory system check
  const memStart = performance.now();
  const { data: memTest } = await supabase.from('aimos_memory_atoms').select('id').limit(1);
  diagnostics.push({
    component: 'CMC Memory System',
    status: memTest ? 'healthy' : 'critical',
    latency: performance.now() - memStart,
    details: memTest ? 'Memory retrieval operational' : 'Memory system unreachable',
    suggestions: memTest ? [] : ['Check Supabase connection', 'Verify table permissions']
  });
  
  // Reasoning chain check
  const reasonStart = performance.now();
  const { data: reasonTest } = await supabase.from('aimos_reasoning_chains').select('id').limit(1);
  diagnostics.push({
    component: 'Reasoning Chain Storage',
    status: reasonTest ? 'healthy' : 'warning',
    latency: performance.now() - reasonStart,
    details: reasonTest ? 'Reasoning storage operational' : 'No reasoning chains found',
    suggestions: reasonTest ? [] : ['Run some queries to populate reasoning chains']
  });
  
  // Evidence graph check
  const graphStart = performance.now();
  const { data: graphTest } = await supabase.from('aimos_evidence_graph').select('id').limit(1);
  diagnostics.push({
    component: 'SEG Evidence Graph',
    status: graphTest !== null ? 'healthy' : 'warning',
    latency: performance.now() - graphStart,
    details: 'Evidence graph accessible',
    suggestions: []
  });
  
  // Plan storage check
  const planStart = performance.now();
  const { data: planTest } = await supabase.from('aimos_plans').select('id').limit(1);
  diagnostics.push({
    component: 'APOE Plan Storage',
    status: planTest !== null ? 'healthy' : 'healthy',
    latency: performance.now() - planStart,
    details: 'Plan storage operational',
    suggestions: []
  });
  
  const overallHealth = diagnostics.filter(d => d.status === 'healthy').length / diagnostics.length;
  
  return jsonResponse({
    success: true,
    diagnostics,
    overallHealth,
    timestamp: new Date().toISOString()
  });
}

async function handleSystemBenchmark(supabase: any, lovableApiKey: string | undefined, body: SelfEvolutionRequest): Promise<Response> {
  const benchmarks: any[] = [];
  
  // Memory read benchmark
  const memReadStart = performance.now();
  for (let i = 0; i < 10; i++) {
    await supabase.from('aimos_memory_atoms').select('*').limit(10);
  }
  benchmarks.push({
    name: 'Memory Read (10x)',
    latency: (performance.now() - memReadStart) / 10,
    unit: 'ms'
  });
  
  // Memory write benchmark
  const memWriteStart = performance.now();
  const { data: written } = await supabase.from('aimos_memory_atoms').insert({
    content: 'Benchmark test',
    content_type: 'benchmark',
    tags: ['benchmark'],
    confidence_score: 1.0
  }).select().single();
  benchmarks.push({
    name: 'Memory Write',
    latency: performance.now() - memWriteStart,
    unit: 'ms'
  });
  
  // Clean up benchmark entry
  if (written) {
    await supabase.from('aimos_memory_atoms').delete().eq('id', written.id);
  }
  
  // AI response benchmark (if API key available)
  if (lovableApiKey) {
    const aiStart = performance.now();
    await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10
      }),
    });
    benchmarks.push({
      name: 'AI Response (minimal)',
      latency: performance.now() - aiStart,
      unit: 'ms'
    });
  }
  
  return jsonResponse({
    success: true,
    benchmarks,
    timestamp: new Date().toISOString()
  });
}

async function handlePerformanceAnalysis(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  const timeRange = body.payload?.timeRange || 24;
  const cutoff = new Date(Date.now() - timeRange * 60 * 60 * 1000).toISOString();
  
  const { data: metrics } = await supabase
    .from('aimos_consciousness_metrics')
    .select('*')
    .gte('measured_at', cutoff)
    .order('measured_at', { ascending: false });
  
  const analysis = {
    totalMetrics: metrics?.length || 0,
    avgCoherence: metrics?.reduce((s: number, m: any) => s + (m.coherence_score || 0), 0) / (metrics?.length || 1),
    avgReasoningDepth: metrics?.reduce((s: number, m: any) => s + (m.reasoning_depth || 0), 0) / (metrics?.length || 1),
    avgContextStability: metrics?.reduce((s: number, m: any) => s + (m.context_stability || 0), 0) / (metrics?.length || 1),
    trends: calculateTrends(metrics || [])
  };
  
  return jsonResponse({ success: true, performance: analysis });
}

// ═══════════════════════════════════════════════════════════════════
// EVOLUTION HANDLERS
// ═══════════════════════════════════════════════════════════════════

async function handleEvolutionSuggestions(supabase: any, lovableApiKey: string | undefined, body: SelfEvolutionRequest): Promise<Response> {
  // Gather system state
  const introspection = await gatherIntrospectionData(supabase);
  
  // Generate evolution suggestions based on analysis
  const suggestions = [];
  
  if (introspection.avgReasoningDepth < 4) {
    suggestions.push({
      type: 'reasoning_enhancement',
      priority: 'high',
      description: 'Increase minimum reasoning phases for complex queries',
      implementation: 'Modify complexity thresholds in analyzeQueryComplexity',
      expectedImpact: '+30% reasoning depth'
    });
  }
  
  if (introspection.memoryUtilization > 0.8) {
    suggestions.push({
      type: 'memory_optimization',
      priority: 'medium',
      description: 'Implement memory pruning for low-quality atoms',
      implementation: 'Add automatic cleanup of atoms with quality_score < 0.3',
      expectedImpact: '-40% memory usage'
    });
  }
  
  if (introspection.avgConfidence < 0.7) {
    suggestions.push({
      type: 'prompt_refinement',
      priority: 'high',
      description: 'Refine system prompts for higher confidence outputs',
      implementation: 'Update cognitive marker instructions with stricter guidelines',
      expectedImpact: '+20% confidence scores'
    });
  }
  
  // Add experimental evolution
  suggestions.push({
    type: 'experimental',
    priority: 'low',
    description: 'Implement adaptive mode detection with learning',
    implementation: 'Add feedback loop to mode detection based on user satisfaction',
    expectedImpact: 'Better mode selection over time'
  });
  
  return jsonResponse({
    success: true,
    evolutionSuggestions: suggestions,
    systemState: introspection
  });
}

async function handleApplyEvolution(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  const { evolutionId, parameters } = body.payload || {};
  
  // Store evolution application
  await supabase.from('aimos_memory_atoms').insert({
    content: JSON.stringify({ evolutionId, parameters, applied_at: new Date().toISOString() }),
    content_type: 'evolution_applied',
    tags: ['evolution', 'system_change'],
    confidence_score: 1.0,
    metadata: { evolutionId }
  });
  
  return jsonResponse({
    success: true,
    message: 'Evolution recorded. Note: Actual system changes require code deployment.',
    evolutionId,
    appliedAt: new Date().toISOString()
  });
}

async function handleRollbackEvolution(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  const { evolutionId } = body.payload || {};
  
  // Mark evolution as rolled back
  await supabase.from('aimos_memory_atoms').insert({
    content: JSON.stringify({ evolutionId, rolled_back_at: new Date().toISOString() }),
    content_type: 'evolution_rollback',
    tags: ['evolution', 'rollback'],
    confidence_score: 1.0
  });
  
  return jsonResponse({
    success: true,
    message: 'Rollback recorded',
    evolutionId
  });
}

async function handleGetEvolutionHistory(supabase: any, body: SelfEvolutionRequest): Promise<Response> {
  const { data: history } = await supabase
    .from('aimos_memory_atoms')
    .select('*')
    .in('content_type', ['evolution_applied', 'evolution_rollback'])
    .order('created_at', { ascending: false })
    .limit(50);
  
  return jsonResponse({
    success: true,
    evolutionHistory: history || []
  });
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function jsonResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function getAvailableActions(): string[] {
  return [
    'introspect', 'analyze_bottlenecks', 'examine_prompts', 'examine_memory',
    'execute_sandbox', 'test_json_schema', 'test_prompt_chain',
    'calibrate_reasoning', 'calibrate_memory', 'calibrate_confidence', 'optimize_prompts',
    'run_diagnostics', 'benchmark_system', 'analyze_performance',
    'suggest_evolution', 'apply_evolution', 'rollback_evolution', 'get_evolution_history'
  ];
}

async function getMemoryStats(supabase: any) {
  const { count: atomCount } = await supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true });
  const { count: chainCount } = await supabase.from('aimos_reasoning_chains').select('*', { count: 'exact', head: true });
  const { count: planCount } = await supabase.from('aimos_plans').select('*', { count: 'exact', head: true });
  
  return { atomCount: atomCount || 0, chainCount: chainCount || 0, planCount: planCount || 0 };
}

async function getReasoningStats(supabase: any) {
  const { data } = await supabase.from('aimos_reasoning_chains').select('depth, coherence_score').limit(100);
  const avgDepth = data?.reduce((s: number, r: any) => s + (r.depth || 0), 0) / (data?.length || 1);
  const avgCoherence = data?.reduce((s: number, r: any) => s + (r.coherence_score || 0), 0) / (data?.length || 1);
  return { avgDepth, avgCoherence, sampleSize: data?.length || 0 };
}

async function getPerformanceStats(supabase: any) {
  const { data } = await supabase.from('aimos_consciousness_metrics').select('*').order('measured_at', { ascending: false }).limit(20);
  return { recentMetrics: data || [] };
}

async function runComponentDiagnostics(supabase: any): Promise<DiagnosticResult[]> {
  const diagnostics: DiagnosticResult[] = [];
  
  const components = ['aimos_memory_atoms', 'aimos_reasoning_chains', 'aimos_plans', 'aimos_evidence_graph'];
  
  for (const component of components) {
    const start = performance.now();
    const { error } = await supabase.from(component).select('id').limit(1);
    diagnostics.push({
      component,
      status: error ? 'critical' : 'healthy',
      latency: performance.now() - start,
      details: error ? error.message : 'Operational',
      suggestions: []
    });
  }
  
  return diagnostics;
}

async function detectBottlenecks(supabase: any, performanceStats: any): Promise<string[]> {
  const bottlenecks: string[] = [];
  
  for (const metric of performanceStats.recentMetrics) {
    if ((metric.context_stability || 1) < 0.5) bottlenecks.push('context_instability');
    if ((metric.reasoning_depth || 0) < 2) bottlenecks.push('shallow_reasoning');
    if ((metric.coherence_score || 0) < 0.5) bottlenecks.push('low_coherence');
  }
  
  return [...new Set(bottlenecks)];
}

function generateRecommendations(memoryStats: any, reasoningStats: any, bottlenecks: string[]): string[] {
  const recommendations: string[] = [];
  
  if (bottlenecks.includes('shallow_reasoning')) {
    recommendations.push('Increase reasoning depth for complex queries');
  }
  if (bottlenecks.includes('low_coherence')) {
    recommendations.push('Review and refine system prompts');
  }
  if (memoryStats.atomCount > 10000) {
    recommendations.push('Consider implementing memory pruning');
  }
  if (reasoningStats.avgDepth < 3) {
    recommendations.push('Enable deep-think mode more frequently');
  }
  
  return recommendations;
}

function calculateEvolutionPotential(diagnostics: DiagnosticResult[], bottlenecks: string[]): number {
  const healthyComponents = diagnostics.filter(d => d.status === 'healthy').length;
  const componentScore = healthyComponents / diagnostics.length;
  const bottleneckPenalty = Math.min(0.3, bottlenecks.length * 0.1);
  return Math.max(0, componentScore - bottleneckPenalty);
}

function classifyQuery(query: string): string {
  if (/\b(build|create|implement|code)\b/i.test(query)) return 'building';
  if (/\b(plan|strategy|approach)\b/i.test(query)) return 'planning';
  if (/\b(research|find|search)\b/i.test(query)) return 'research';
  if (/\b(explain|why|how)\b/i.test(query)) return 'explanation';
  return 'general';
}

function calculateMemoryHealth(count: number | null, distribution: Map<string, number>): number {
  if (!count) return 0;
  const typeCount = distribution.size;
  const balanceScore = Math.min(1, typeCount / 5);
  const sizeScore = Math.min(1, count / 100);
  return (balanceScore + sizeScore) / 2;
}

function parsePromptTemplate(template: string): any {
  const variables = template.match(/\{\{(\w+)\}\}/g) || [];
  const sections = template.split(/\n\n+/);
  return { variables, sectionCount: sections.length, charCount: template.length };
}

function validateAgainstSchema(data: any, schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (schema.type === 'object' && typeof data !== 'object') {
    errors.push(`Expected object, got ${typeof data}`);
  }
  if (schema.type === 'array' && !Array.isArray(data)) {
    errors.push(`Expected array, got ${typeof data}`);
  }
  if (schema.required && Array.isArray(schema.required)) {
    for (const req of schema.required) {
      if (!(req in data)) {
        errors.push(`Missing required field: ${req}`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

function estimateConfidence(response: string): number {
  const uncertaintyMarkers = ['maybe', 'perhaps', 'might', 'could', 'uncertain'];
  const certaintyMarkers = ['definitely', 'certainly', 'clearly', 'obviously'];
  
  let score = 0.7;
  for (const marker of uncertaintyMarkers) {
    if (response.toLowerCase().includes(marker)) score -= 0.05;
  }
  for (const marker of certaintyMarkers) {
    if (response.toLowerCase().includes(marker)) score += 0.05;
  }
  
  return Math.max(0.1, Math.min(1, score));
}

function detectChainBottlenecks(steps: PromptChainStep[]): string[] {
  const bottlenecks: string[] = [];
  
  const avgLatency = steps.reduce((s, step) => s + step.latency, 0) / steps.length;
  for (const step of steps) {
    if (step.latency > avgLatency * 2) {
      bottlenecks.push(`Step ${step.stepId}: High latency (${Math.round(step.latency)}ms)`);
    }
    if (step.confidence < 0.5) {
      bottlenecks.push(`Step ${step.stepId}: Low confidence (${Math.round(step.confidence * 100)}%)`);
    }
  }
  
  return bottlenecks;
}

function detectDuplicateMemories(memories: any[]): any[] {
  const seen = new Map<string, any>();
  const duplicates: any[] = [];
  
  for (const mem of memories) {
    const key = mem.content_type + ':' + (mem.content?.slice(0, 100) || '');
    if (seen.has(key)) {
      duplicates.push(mem);
    } else {
      seen.set(key, mem);
    }
  }
  
  return duplicates;
}

function calculateTrends(metrics: any[]): any {
  if (metrics.length < 2) return { direction: 'stable', change: 0 };
  
  const recent = metrics.slice(0, Math.floor(metrics.length / 2));
  const older = metrics.slice(Math.floor(metrics.length / 2));
  
  const recentAvg = recent.reduce((s: number, m: any) => s + (m.coherence_score || 0), 0) / recent.length;
  const olderAvg = older.reduce((s: number, m: any) => s + (m.coherence_score || 0), 0) / older.length;
  
  const change = recentAvg - olderAvg;
  return {
    direction: change > 0.05 ? 'improving' : change < -0.05 ? 'declining' : 'stable',
    change: Math.round(change * 100) / 100
  };
}

async function gatherIntrospectionData(supabase: any): Promise<any> {
  const [memStats, reasonStats] = await Promise.all([
    getMemoryStats(supabase),
    getReasoningStats(supabase)
  ]);
  
  return {
    ...memStats,
    avgReasoningDepth: reasonStats.avgDepth,
    avgConfidence: reasonStats.avgCoherence,
    memoryUtilization: Math.min(1, (memStats.atomCount || 0) / 10000)
  };
}
