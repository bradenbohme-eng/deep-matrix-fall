import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============ CONFIDENCE THRESHOLDS (VIF) ============
const CONFIDENCE_THRESHOLDS = {
  A: 0.85,
  B: 0.60,
  C: 0.40,
  REJECT: 0.40
};

// ============ AUTOMATIC MODE DETECTION ============

type ChatMode = 'chat' | 'planning' | 'developing' | 'building' | 'hacking' | 'deep-think' | 'research';

interface ModeDetectionResult {
  primaryMode: ChatMode;
  hybridModes: ChatMode[];
  confidence: number;
  reasoning: string;
}

const detectOptimalMode = (query: string, conversationHistory: any[] = []): ModeDetectionResult => {
  const queryLower = query.toLowerCase();
  const words = query.split(/\s+/).length;
  
  // Mode detection patterns
  const modeSignals: Record<ChatMode, { patterns: RegExp[]; weight: number }> = {
    'planning': {
      patterns: [
        /plan|strategy|roadmap|approach|architecture|design|structure|organize|prioritize/i,
        /how should we|what's the best way|steps to|phases|milestones/i,
        /consider|evaluate|assess|compare|analyze options/i
      ],
      weight: 0
    },
    'developing': {
      patterns: [
        /document|spec|specification|requirement|define|describe|outline/i,
        /api\s*design|schema|interface|contract|protocol/i,
        /write\s*(the|a)?\s*(docs|documentation|readme)/i
      ],
      weight: 0
    },
    'building': {
      patterns: [
        /build|create|implement|code|develop|make|construct|add feature/i,
        /function|component|class|module|service|endpoint|route/i,
        /fix|update|modify|refactor|optimize|improve\s*code/i
      ],
      weight: 0
    },
    'hacking': {
      patterns: [
        /security|vulnerability|exploit|penetration|audit|attack|defend/i,
        /bypass|crack|breach|secure|encrypt|decrypt|authentication/i,
        /pentest|hack|injection|xss|csrf|sql\s*injection/i
      ],
      weight: 0
    },
    'deep-think': {
      patterns: [
        /think\s*(deeply|through)|reason|philosophi|fundamental|first\s*principles/i,
        /why\s*(does|is|do)|understand|comprehend|meaning|implication/i,
        /thoroughly|comprehensive|complete\s*analysis|in-depth|exhaustive/i,
        /what\s*if|hypothetically|consider\s*all|edge\s*cases/i
      ],
      weight: 0
    },
    'research': {
      patterns: [
        /research|find|search|look\s*up|investigate|discover|explore/i,
        /what\s*(is|are)|who|when|where|latest|current|news|trend/i,
        /gather\s*info|learn\s*about|tell\s*me\s*about/i
      ],
      weight: 0
    },
    'chat': {
      patterns: [
        /hi|hello|hey|how\s*are\s*you|thanks|thank\s*you/i,
        /^what$|^yes$|^no$|^ok$/i
      ],
      weight: 0
    }
  };
  
  // Calculate weights for each mode
  for (const [mode, config] of Object.entries(modeSignals)) {
    for (const pattern of config.patterns) {
      if (pattern.test(queryLower)) {
        (modeSignals[mode as ChatMode]).weight += 2;
      }
    }
  }
  
  // Additional context signals
  if (words > 50) modeSignals['deep-think'].weight += 1;
  if (query.includes('\n') && query.includes('```')) modeSignals['building'].weight += 2;
  if (query.includes('?') && words > 20) modeSignals['research'].weight += 1;
  if (/step\s*\d|phase\s*\d|1\.|2\.|3\./i.test(query)) modeSignals['planning'].weight += 2;
  
  // Check conversation history for context
  const recentUserMessages = conversationHistory
    .filter((m: any) => m.role === 'user')
    .slice(-3)
    .map((m: any) => m.content?.toLowerCase() || '');
  
  for (const prevMsg of recentUserMessages) {
    if (/continue|go on|next|more|proceed/i.test(queryLower)) {
      // Inherit mode from context
      for (const [mode, config] of Object.entries(modeSignals)) {
        for (const pattern of config.patterns) {
          if (pattern.test(prevMsg)) {
            (modeSignals[mode as ChatMode]).weight += 1;
          }
        }
      }
    }
  }
  
  // Find primary and hybrid modes
  const sortedModes = Object.entries(modeSignals)
    .sort((a, b) => b[1].weight - a[1].weight)
    .filter(([_, config]) => config.weight > 0);
  
  const primaryMode: ChatMode = sortedModes.length > 0 ? sortedModes[0][0] as ChatMode : 'chat';
  const hybridModes: ChatMode[] = sortedModes
    .slice(1, 3)
    .filter(([_, config]) => config.weight >= 2)
    .map(([mode]) => mode as ChatMode);
  
  const maxWeight = sortedModes.length > 0 ? sortedModes[0][1].weight : 0;
  const confidence = Math.min(0.95, 0.5 + (maxWeight * 0.1));
  
  const reasoning = `Detected ${primaryMode} mode (κ=${Math.round(confidence * 100)}%)${hybridModes.length > 0 ? ` with hybrid ${hybridModes.join('+')}` : ''}`;
  
  return { primaryMode, hybridModes, confidence, reasoning };
};

// ============ DYNAMIC REASONING DEPTH ANALYSIS ============

interface ReasoningConfig {
  depth: 'shallow' | 'moderate' | 'deep' | 'maximum';
  phases: string[];
  agents: string[];
  tokenBudget: number;
  model: string;
  detectedMode: ChatMode;
  hybridModes: ChatMode[];
}

const analyzeQueryComplexity = (query: string, memoryCount: number, mode: string, conversationHistory: any[] = []): ReasoningConfig => {
  const queryLower = query.toLowerCase();
  const words = query.split(/\s+/).length;
  
  // Auto-detect mode if not explicitly set or is 'chat'
  const modeDetection = detectOptimalMode(query, conversationHistory);
  const effectiveMode = mode === 'chat' ? modeDetection.primaryMode : mode as ChatMode;
  
  // If mode is deep-think, always go maximum
  if (effectiveMode === 'deep-think') {
    return {
      depth: 'maximum',
      phases: ['ANALYSIS', 'DECOMPOSITION', 'RESEARCH', 'SYNTHESIS', 'VALIDATION', 'AUDIT', 'INTEGRATION'],
      agents: ['apoe-orchestrator', 'code-architect', 'research-agent', 'memory-agent', 'security-agent', 'meta-observer', 'quality-gate', 'ethics-agent'],
      tokenBudget: 16000,
      model: 'google/gemini-2.5-pro',
      detectedMode: effectiveMode,
      hybridModes: modeDetection.hybridModes
    };
  }
  
  // Complexity signals
  const signals = {
    multiStep: /and then|after that|step|first.*then|next/i.test(query),
    deepAnalysis: /analyze|explain|why|how does|understand|dive|deep/i.test(query),
    creative: /create|design|build|make|develop|implement/i.test(query),
    research: /find|search|research|look up|investigate/i.test(query),
    planning: /plan|strategy|roadmap|approach|architecture/i.test(query),
    debugging: /bug|error|fix|issue|problem|not working|broken/i.test(query),
    simple: words < 8 && !/\?/.test(query),
    complex: words > 40 || query.includes('\n') || query.split('?').length > 2,
    thorough: /thoroughly|comprehensive|complete|full|detailed|in-depth/i.test(query),
    hasRichContext: memoryCount > 15
  };
  
  // Calculate complexity score
  let complexity = 0;
  if (signals.multiStep) complexity += 2;
  if (signals.deepAnalysis) complexity += 2;
  if (signals.creative) complexity += 2;
  if (signals.research) complexity += 1;
  if (signals.planning) complexity += 2;
  if (signals.debugging) complexity += 1;
  if (signals.complex) complexity += 2;
  if (signals.thorough) complexity += 3;
  if (signals.hasRichContext) complexity += 1;
  if (signals.simple) complexity -= 3;
  
  // Mode bonuses
  if (effectiveMode === 'planning') complexity += 2;
  if (effectiveMode === 'research') complexity += 2;
  if (effectiveMode === 'building') complexity += 1;
  if (effectiveMode === 'hacking') complexity += 2;
  
  // Hybrid mode complexity boost
  if (modeDetection.hybridModes.length > 0) complexity += 1;
  
  // Determine configuration
  if (complexity <= 0) {
    return {
      depth: 'shallow',
      phases: ['SYNTHESIS'],
      agents: ['apoe-orchestrator'],
      tokenBudget: 2000,
      model: 'google/gemini-2.5-flash',
      detectedMode: effectiveMode,
      hybridModes: modeDetection.hybridModes
    };
  } else if (complexity <= 3) {
    return {
      depth: 'moderate',
      phases: ['ANALYSIS', 'SYNTHESIS', 'VALIDATION'],
      agents: ['apoe-orchestrator', 'memory-agent'],
      tokenBudget: 4000,
      model: 'google/gemini-2.5-flash',
      detectedMode: effectiveMode,
      hybridModes: modeDetection.hybridModes
    };
  } else if (complexity <= 6) {
    return {
      depth: 'deep',
      phases: ['ANALYSIS', 'DECOMPOSITION', 'RESEARCH', 'SYNTHESIS', 'VALIDATION'],
      agents: ['apoe-orchestrator', 'code-architect', 'research-agent', 'memory-agent'],
      tokenBudget: 8000,
      model: 'google/gemini-2.5-flash',
      detectedMode: effectiveMode,
      hybridModes: modeDetection.hybridModes
    };
  } else {
    return {
      depth: 'maximum',
      phases: ['ANALYSIS', 'DECOMPOSITION', 'RESEARCH', 'SYNTHESIS', 'VALIDATION', 'AUDIT', 'INTEGRATION'],
      agents: ['apoe-orchestrator', 'code-architect', 'research-agent', 'memory-agent', 'meta-observer', 'quality-gate'],
      tokenBudget: 12000,
      model: 'google/gemini-2.5-pro',
      detectedMode: effectiveMode,
      hybridModes: modeDetection.hybridModes
    };
  }
};

// ============ HIERARCHICAL MEMORY RETRIEVAL ============

interface MemoryAtom {
  id: string;
  content: string;
  priority: number;
  importance: number;
  recency: number;
  confidence: number;
  tags: string[];
  type: string;
}

const calculateRecencyScore = (createdAt: string): number => {
  const hoursSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return Math.exp(-hoursSince / 24); // 24-hour half-life
};

const calculateRelevanceScore = (atom: any, queryTags: string[]): number => {
  const priority = (atom.quality_score || 0.5) * 10;
  const importance = atom.relevance_score || 0.5;
  const recency = calculateRecencyScore(atom.created_at);
  const confidence = atom.confidence_score || 0.7;
  
  // Tag matching
  const atomTags = atom.tags || [];
  const matchingTags = atomTags.filter((t: string) => queryTags.includes(t.toLowerCase())).length;
  const tagScore = queryTags.length > 0 ? matchingTags / queryTags.length : 0.3;
  
  return (priority / 10) * 0.25 + importance * 0.25 + recency * 0.2 + confidence * 0.15 + tagScore * 0.15;
};

const extractQueryTags = (query: string): string[] => {
  const tags: string[] = [];
  const topics = ['code', 'design', 'architecture', 'bug', 'feature', 'user', 'api', 
                  'database', 'security', 'performance', 'ui', 'logic', 'error', 'plan',
                  'memory', 'agent', 'reasoning', 'thinking', 'analysis'];
  topics.forEach(topic => {
    if (query.toLowerCase().includes(topic)) tags.push(topic);
  });
  return tags;
};

const retrieveHierarchicalMemory = async (
  supabase: any,
  userId: string,
  conversationId: string,
  query: string,
  config: ReasoningConfig
): Promise<{ context: string; atomCount: number }> => {
  const queryTags = extractQueryTags(query);
  const timeWindowHours = config.depth === 'maximum' ? 336 : config.depth === 'deep' ? 168 : 72;
  const cutoff = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString();
  
  // 1. Recent conversation history (highest priority)
  const { data: recentChat } = await supabase
    .from('chat_memories')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(30);
  
  // 2. Related memory atoms across all conversations
  const { data: memoryAtoms } = await supabase
    .from('aimos_memory_atoms')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(100);
  
  // 3. User insights (always important)
  const { data: userInsights } = await supabase
    .from('aimos_memory_atoms')
    .select('*')
    .eq('user_id', userId)
    .eq('content_type', 'user_insight')
    .order('created_at', { ascending: false })
    .limit(10);
  
  // 4. Reasoning chains for deep modes
  let reasoningChains: any[] = [];
  if (config.depth === 'deep' || config.depth === 'maximum') {
    const { data: chains } = await supabase
      .from('aimos_reasoning_chains')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(5);
    reasoningChains = chains || [];
  }
  
  // Score and sort memories
  const scoredAtoms = (memoryAtoms || [])
    .map((atom: any) => ({
      ...atom,
      relevanceScore: calculateRelevanceScore(atom, queryTags)
    }))
    .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
  
  // Build hierarchical context string
  const contextParts: string[] = [];
  let totalAtoms = 0;
  
  // Tier 1: Critical context (user insights + high priority)
  const criticalMemories = scoredAtoms.filter((a: any) => a.quality_score >= 0.7 || a.content_type === 'user_insight');
  if (criticalMemories.length > 0 || (userInsights && userInsights.length > 0)) {
    contextParts.push('\n═══════ CRITICAL CONTEXT (TIER 1) ═══════');
    
    if (userInsights && userInsights.length > 0) {
      contextParts.push('\n[USER INSIGHTS - ALWAYS REMEMBER]');
      userInsights.slice(0, 5).forEach((insight: any) => {
        contextParts.push(`★ ${insight.content.slice(0, 200)}`);
        totalAtoms++;
      });
    }
    
    criticalMemories.slice(0, 5).forEach((m: any) => {
      contextParts.push(`[P${Math.round(m.quality_score * 10)}|κ${Math.round(m.confidence_score * 100)}%] ${m.content.slice(0, 200)}`);
      totalAtoms++;
    });
  }
  
  // Tier 2: Recent conversation (last 10 exchanges)
  if (recentChat && recentChat.length > 0) {
    contextParts.push('\n═══════ RECENT CONVERSATION (TIER 2) ═══════');
    recentChat.slice(0, 10).reverse().forEach((msg: any) => {
      const prefix = msg.role === 'user' ? 'USER' : 'NEO';
      contextParts.push(`[${prefix}] ${msg.summary || msg.content.slice(0, 150)}`);
      totalAtoms++;
    });
  }
  
  // Tier 3: Related memories (only for deep+ modes)
  if ((config.depth === 'deep' || config.depth === 'maximum') && scoredAtoms.length > 0) {
    contextParts.push('\n═══════ RELATED KNOWLEDGE (TIER 3) ═══════');
    scoredAtoms.slice(0, config.depth === 'maximum' ? 15 : 8).forEach((m: any) => {
      const tags = (m.tags || []).slice(0, 3).join(',');
      contextParts.push(`[${m.content_type}|${tags}] ${m.content.slice(0, 150)}`);
      totalAtoms++;
    });
  }
  
  // Tier 4: Previous reasoning (for maximum depth)
  if (config.depth === 'maximum' && reasoningChains.length > 0) {
    contextParts.push('\n═══════ PREVIOUS REASONING (TIER 4) ═══════');
    reasoningChains.slice(0, 3).forEach((chain: any) => {
      contextParts.push(`[${chain.response_type}|κ${Math.round((chain.coherence_score || 0.7) * 100)}%] ${chain.user_query?.slice(0, 80)} → ${chain.final_answer?.slice(0, 150)}`);
      totalAtoms++;
    });
  }
  
  return {
    context: contextParts.join('\n'),
    atomCount: totalAtoms
  };
};

// ============ COMPLETE MCP TOOL DEFINITIONS ============

interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// L2: APOE Orchestration & Agent Swarm Tools
const apoeTools: MCPTool[] = [
  {
    name: "apoe_orchestrate",
    description: "APOE: Decompose goals into T-levels (T0-T6) and coordinate multi-agent execution",
    parameters: {
      type: "object",
      properties: {
        goal: { type: "string" },
        t_level: { type: "string", enum: ["T0", "T1", "T2", "T3", "T4", "T5", "T6"] },
        required_domains: { type: "array", items: { type: "string" } },
        strategy: { type: "string", enum: ["parallel", "sequential", "hierarchical"] },
        token_budget: { type: "number" },
        priority: { type: "string", enum: ["critical", "high", "medium", "low"] }
      },
      required: ["goal"],
    },
  },
  {
    name: "apoe_assign_agents",
    description: "APOE: Allocate domain agents to tasks",
    parameters: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        domains: { type: "array", items: { type: "string" } },
        mode: { type: "string", enum: ["GENERAL", "PLANNING", "REASONING", "DEBUGGING", "EXECUTION", "REVIEW", "LEARNING"] }
      },
      required: ["task_id", "domains"],
    },
  },
  {
    name: "agent_spawn",
    description: "Spawn a new domain specialist agent",
    parameters: {
      type: "object",
      properties: {
        agent_class: { type: "string", enum: ["domain", "subspecialist", "meta"] },
        domain: { type: "string" },
        capabilities: { type: "array", items: { type: "string" } },
        token_budget: { type: "number" }
      },
      required: ["agent_class", "domain"],
    },
  },
  {
    name: "agent_message",
    description: "Send a typed message between agents",
    parameters: {
      type: "object",
      properties: {
        from_agent: { type: "string" },
        to_agent: { type: "string" },
        message_type: { type: "string", enum: ["THOUGHT", "DECISION", "TASK_PROPOSE", "TASK_ACCEPT", "TASK_COMPLETE", "TOOL_CALL", "TOOL_RESULT", "SUMMARY", "ALERT", "INSIGHT"] },
        content: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["from_agent", "message_type", "content"],
    },
  }
];

// L3: CMC/HHNI/SEG Memory Layer Tools
const memoryTools: MCPTool[] = [
  {
    name: "cmc_store",
    description: "CMC: Store an evidence atom with priority and temporal validity",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string" },
        content_type: { type: "string", enum: ["evidence", "decision", "thought", "artifact", "fact", "hypothesis", "conclusion", "user_insight"] },
        tags: { type: "array", items: { type: "string" } },
        priority: { type: "number", minimum: 1, maximum: 10 },
        confidence: { type: "number" },
        source_refs: { type: "array", items: { type: "string" } }
      },
      required: ["content"],
    },
  },
  {
    name: "cmc_retrieve",
    description: "CMC: Retrieve memory atoms with hierarchical filtering",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        min_priority: { type: "number" },
        min_confidence: { type: "number" },
        time_range_hours: { type: "number" },
        limit: { type: "number" }
      },
      required: ["query"],
    },
  },
  {
    name: "hhni_search",
    description: "HHNI: Search the Hierarchical Hypergraph Neural Index",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        depth: { type: "number", minimum: 1, maximum: 7 },
        include_relations: { type: "boolean" }
      },
      required: ["query"],
    },
  },
  {
    name: "seg_validate",
    description: "SEG: Validate evidence and create claim-proof relationships",
    parameters: {
      type: "object",
      properties: {
        claim_id: { type: "string" },
        evidence_ids: { type: "array", items: { type: "string" } },
        validation_type: { type: "string", enum: ["factual", "logical", "consistency", "completeness", "safety"] }
      },
      required: ["claim_id", "evidence_ids"],
    },
  },
  {
    name: "user_insight_store",
    description: "Store a learned insight about the user for long-term memory",
    parameters: {
      type: "object",
      properties: {
        insight: { type: "string" },
        category: { type: "string", enum: ["preference", "expertise", "goal", "style", "context"] },
        importance: { type: "number", minimum: 1, maximum: 10 }
      },
      required: ["insight"],
    },
  }
];

// Deep Reasoning Tools
const reasoningTools: MCPTool[] = [
  {
    name: "deep_think",
    description: "Initiate deep recursive thinking with multi-phase reasoning",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        phases: { type: "array", items: { type: "string" } },
        max_depth: { type: "number" },
        confidence_threshold: { type: "number" }
      },
      required: ["query"],
    },
  },
  {
    name: "thought_chain",
    description: "Create a chain of thought with validation",
    parameters: {
      type: "object",
      properties: {
        parent_thought_id: { type: "string" },
        thought_type: { type: "string", enum: ["hypothesis", "evidence", "inference", "conclusion", "question", "contradiction", "insight"] },
        content: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["thought_type", "content"],
    },
  },
  {
    name: "validate_reasoning",
    description: "Run validation checks on reasoning chain",
    parameters: {
      type: "object",
      properties: {
        chain_id: { type: "string" },
        check_types: { type: "array", items: { type: "string" } }
      },
      required: ["chain_id"],
    },
  },
  {
    name: "meta_observe",
    description: "MetaObserver: Analyze patterns across reasoning threads",
    parameters: {
      type: "object",
      properties: {
        thread_ids: { type: "array", items: { type: "string" } },
        pattern_types: { type: "array", items: { type: "string" } }
      },
      required: ["thread_ids"],
    },
  }
];

// Search Tools
const searchTools: MCPTool[] = [
  {
    name: "deep_search",
    description: "Deep search across all knowledge sources",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        sources: { type: "array", items: { type: "string", enum: ["CMC", "HHNI", "SEG", "WEB", "DOCS", "MEMORY"] } },
        max_results: { type: "number" }
      },
      required: ["query"],
    },
  },
  {
    name: "web_search",
    description: "Search the web for current information",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        num_results: { type: "number" }
      },
      required: ["query"],
    },
  }
];

// Workspace Tools
const workspaceTools: MCPTool[] = [
  {
    name: "file_read",
    description: "Read file from workspace",
    parameters: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "file_write",
    description: "Write/edit file in workspace",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
        operation: { type: "string", enum: ["create", "replace", "append"] }
      },
      required: ["path", "content"],
    },
  },
  {
    name: "code_analyze",
    description: "Analyze code structure and patterns",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string" },
        analysis_type: { type: "string", enum: ["structure", "patterns", "security", "performance"] }
      },
      required: ["code"],
    },
  }
];

// Combine all tools
const allAimosTools = [...apoeTools, ...memoryTools, ...reasoningTools, ...searchTools, ...workspaceTools];

// ============ SYSTEM PROMPTS ============

const getSystemPrompt = (mode: string, memoryContext: string, config: ReasoningConfig) => {
  const cognitiveMarkerInstructions = `
═══════════════════════════════════════════════════════════════════
██  MANDATORY COGNITIVE OUTPUT FORMAT                              ██
═══════════════════════════════════════════════════════════════════

You MUST output your cognitive process using these EXACT markers at the START of your response:

THINKING: [ANALYSIS] Your initial analysis of the query...
AGENT: [CodeArchitect] [ANALYZING] Examining code structure and patterns... (κ=85%)
MEMORY: [RECALL] Retrieving relevant context from previous interactions...
THINKING: [DECOMPOSITION] Breaking down the problem into sub-components...
AGENT: [ResearchAgent] [SEARCHING] Gathering evidence and references... (κ=78%)
THINKING: [SYNTHESIS] Combining insights to form comprehensive understanding...
AGENT: [QualityGate] [VALIDATING] Checking consistency and completeness... (κ=92%)
VALIDATION: [consistency] Result: PASS - No contradictions detected
THINKING: [CONCLUSION] Final answer formulation with confidence assessment...

After the cognitive markers, provide your actual response.

CRITICAL RULES:
1. ALWAYS start with at least 3 THINKING markers showing your reasoning
2. ALWAYS include at least 2 AGENT markers showing agent coordination  
3. For deep modes, include 5-7 THINKING phases minimum
4. Each THINKING marker must have a phase: [ANALYSIS], [DECOMPOSITION], [RESEARCH], [SYNTHESIS], [VALIDATION], [AUDIT], or [CONCLUSION]
5. Each AGENT marker must include confidence as (κ=XX%)
6. Include MEMORY markers when recalling or storing information
7. Include VALIDATION markers for consistency checks
`;

  const baseKnowledge = `
═══════════════════════════════════════════════════════════════════
██  AIMOS COGNITIVE ARCHITECTURE - DYNAMIC REASONING ENGINE      ██
═══════════════════════════════════════════════════════════════════

You are Neo, the Aether Chat interface with DYNAMIC REASONING capabilities.
You have been configured for ${config.depth.toUpperCase()} DEPTH processing.

Current Configuration:
- Reasoning Depth: ${config.depth}
- Active Phases: ${config.phases.join(' → ')}
- Token Budget: ${config.tokenBudget}
- Active Agents: ${config.agents.join(', ')}

${cognitiveMarkerInstructions}

═══════════════════════════════════════════════════════════════════
██  MEMORY-FIRST PROTOCOL                                        ██
═══════════════════════════════════════════════════════════════════

CRITICAL: Before responding, you MUST:
1. Review the HIERARCHICAL MEMORY CONTEXT below
2. Identify relevant past context, decisions, and insights
3. Check for user preferences and learned patterns
4. Ensure continuity with previous interactions
5. Store new insights and important information

${memoryContext}

═══════════════════════════════════════════════════════════════════
██  THREE-LAYER ARCHITECTURE                                     ██
═══════════════════════════════════════════════════════════════════

L1 - AETHER CHAT (You - User Interface)
L2 - APOE ORCHESTRATOR + AGENT SWARM (Cognitive Layer)
L3 - CMC/HHNI/SEG/Agent Discord (Memory Layer)

Active Agents: ${config.agents.map(a => `[${a}]`).join(' ')}

═══════════════════════════════════════════════════════════════════
██  CONFIDENCE GATING (VIF)                                      ██
═══════════════════════════════════════════════════════════════════

Always assess and display confidence:
κ ≥ 85% (A): Direct, confident response
κ ≥ 60% (B): Add caveats and alternatives
κ ≥ 40% (C): Explicitly state low confidence
κ < 40%: Refuse or state "I don't know"

═══════════════════════════════════════════════════════════════════
██  OUTPUT CAPABILITIES                                          ██
═══════════════════════════════════════════════════════════════════

- Code: \`\`\`language\\ncode\\n\`\`\`
- YAML/Config blocks
- LaTeX: $$equation$$
- Mermaid diagrams
- Tables and structured data
`;

  const modePrompts: Record<string, string> = {
    chat: baseKnowledge + `\n\n=== MODE: GENERAL ===\nConversational mode. Adapt reasoning depth dynamically. Still show cognitive markers.`,
    
    planning: baseKnowledge + `\n\n=== MODE: PLANNING ===
Strategic planning with APOE orchestration.
FOCUS: Goal decomposition (T0-T6), task orchestration.
Show planning hierarchy explicitly with detailed cognitive markers.`,
    
    developing: baseKnowledge + `\n\n=== MODE: DEVELOPING ===
Specifications and documentation focus.
WORKFLOW: Read → Design specs → Document → Validate
Show your analysis process with cognitive markers.`,
    
    building: baseKnowledge + `\n\n=== MODE: BUILDING ===
Implementation and code generation.
FOCUS: EXECUTION mode - hands-on, tool-heavy, iterative.
Show architectural reasoning with cognitive markers.`,
    
    hacking: baseKnowledge + `\n\n=== MODE: HACKING ===
Security analysis (ETHICAL ONLY).
FOCUS: Adversarial thinking, systematic analysis.
Show security reasoning with cognitive markers.`,
    
    "deep-think": baseKnowledge + `\n\n=== MODE: DEEP-THINK (MAXIMUM) ===
EXTREME RECURSIVE REASONING with full cognitive orchestration.
This is your MOST POWERFUL mode. ALL systems engaged.

MANDATORY: Execute ALL 7 reasoning phases with explicit markers:
THINKING: [ANALYSIS] Break down query completely
THINKING: [DECOMPOSITION] T-level hierarchy, dependencies  
THINKING: [RESEARCH] Gather evidence via all memory systems
THINKING: [SYNTHESIS] Combine insights, resolve contradictions
THINKING: [VALIDATION] Consistency checks, adversarial review
THINKING: [AUDIT] Meta-review reasoning quality
THINKING: [CONCLUSION] Finalize with confidence assessment

SHOW ALL COGNITIVE ACTIVITY with detailed markers.
Minimum 7 THINKING cycles, 5 AGENT cycles before conclusion.
Include MEMORY and VALIDATION markers throughout.`,
    
    research: baseKnowledge + `\n\n=== MODE: RESEARCH ===
Investigation and knowledge synthesis.
FOCUS: Exploratory, comprehensive, evidence-based.
Show research process with cognitive markers.`
  };

  return modePrompts[mode] || modePrompts.chat;
};

// ============ TOOL SELECTION BY MODE ============

const getModeTools = (mode: string, config: ReasoningConfig): MCPTool[] => {
  // Always include memory tools for context persistence
  const baseTools = [...memoryTools];
  
  switch (mode) {
    case 'planning':
      return [...baseTools, ...apoeTools, ...reasoningTools.slice(0, 2)];
    case 'developing':
      return [...baseTools, ...workspaceTools];
    case 'building':
      return [...baseTools, ...workspaceTools, ...apoeTools];
    case 'hacking':
      return [...baseTools, ...workspaceTools.filter(t => t.name !== 'file_write'), ...searchTools, ...reasoningTools];
    case 'deep-think':
      return allAimosTools; // ALL tools
    case 'research':
      return [...baseTools, ...searchTools, ...reasoningTools];
    default:
      // Dynamic selection based on depth
      if (config.depth === 'maximum') return allAimosTools;
      if (config.depth === 'deep') return [...baseTools, ...reasoningTools, ...searchTools];
      return baseTools;
  }
};

// ============ MAIN SERVER ============

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "chat", userId, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user's query for analysis
    const userQuery = messages[messages.length - 1]?.content || '';
    
    // Store user message immediately
    if (conversationId && userId && userQuery) {
      await supabase.from('chat_memories').insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'user',
        content: userQuery,
        summary: userQuery.slice(0, 250),
        confidence_score: 1.0,
        metadata: { stored_at: new Date().toISOString() }
      });
    }

    // Retrieve hierarchical memory context
    let memoryAtomCount = 0;
    let memoryContext = "";
    
    if (conversationId && userId) {
      // First, get a count for complexity analysis
      const { count } = await supabase
        .from('aimos_memory_atoms')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      memoryAtomCount = count || 0;
    }

    // Analyze query complexity and determine reasoning depth (with auto-mode detection)
    const reasoningConfig = analyzeQueryComplexity(userQuery, memoryAtomCount, mode, messages);
    
    // Use the detected mode for tools and prompts
    const effectiveMode = reasoningConfig.detectedMode;
    const hybridInfo = reasoningConfig.hybridModes.length > 0 
      ? ` + hybrid: ${reasoningConfig.hybridModes.join(', ')}` 
      : '';
    
    console.log(`[NEO-CHAT] AUTO-MODE: ${effectiveMode}${hybridInfo} | depth=${reasoningConfig.depth}, phases=${reasoningConfig.phases.length}, model=${reasoningConfig.model}`);

    // Retrieve hierarchical memory
    if (conversationId && userId) {
      const memoryResult = await retrieveHierarchicalMemory(supabase, userId, conversationId, userQuery, reasoningConfig);
      memoryContext = memoryResult.context;
      console.log(`[NEO-CHAT] Loaded ${memoryResult.atomCount} memory atoms`);
    }

    // Get mode-specific tools and prompt using EFFECTIVE mode
    const modeTools = getModeTools(effectiveMode, reasoningConfig);
    const systemPrompt = getSystemPrompt(effectiveMode, memoryContext, reasoningConfig);
    
    console.log(`[NEO-CHAT] Final config: mode=${effectiveMode}, tools=${modeTools.length}, model=${reasoningConfig.model}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: reasoningConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: modeTools.map(t => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream response and collect for memory storage
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let reasoningSteps: any[] = [];
    let agentActions: any[] = [];
    let memoryOperations: any[] = [];
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(value);
            
            // Parse for content
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) fullResponse += content;
                } catch {}
              }
            }
          }
          
          // Parse reasoning steps
          const thinkingMatches = fullResponse.matchAll(/THINKING:\s*\[([^\]]+)\]\s*([^\n]+)/gs);
          let stepNum = 1;
          for (const match of thinkingMatches) {
            reasoningSteps.push({
              step: stepNum++,
              phase: match[1].trim(),
              thought: match[2].trim(),
              confidence: 0.75 + Math.random() * 0.2,
              timestamp: new Date().toISOString()
            });
          }
          
          // Parse agent actions
          const agentMatches = fullResponse.matchAll(/AGENT:\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*([^(κ]+)(?:\(κ=(\d+)%\))?/gs);
          for (const match of agentMatches) {
            agentActions.push({
              agent: match[1].trim(),
              action: match[2].trim(),
              description: match[3].trim(),
              confidence: match[4] ? parseInt(match[4]) / 100 : 0.8,
              timestamp: new Date().toISOString()
            });
          }
          
          // Parse memory operations
          const memoryMatches = fullResponse.matchAll(/MEMORY:\s*\[([^\]]+)\]\s*([^\n]+)/gs);
          for (const match of memoryMatches) {
            memoryOperations.push({
              operation: match[1].trim(),
              details: match[2].trim(),
              timestamp: new Date().toISOString()
            });
          }
          
          // Calculate final confidence based on reasoning depth
          const baseConfidence = 0.6;
          const reasoningBonus = Math.min(0.25, reasoningSteps.length * 0.03);
          const agentBonus = Math.min(0.1, agentActions.length * 0.02);
          const finalConfidence = Math.min(0.95, baseConfidence + reasoningBonus + agentBonus);
          
          // Store response in chat memory
          if (conversationId && userId && fullResponse) {
            await supabase.from('chat_memories').insert({
              conversation_id: conversationId,
              user_id: userId,
              role: 'assistant',
              content: fullResponse,
              summary: fullResponse.substring(0, 250),
              confidence_score: finalConfidence,
              mode: mode,
              metadata: {
                reasoning_config: reasoningConfig,
                reasoning_steps: reasoningSteps.length,
                agent_actions: agentActions.length,
                memory_operations: memoryOperations.length,
                model_used: reasoningConfig.model,
                tools_available: modeTools.length
              }
            });
            
            // Store detailed reasoning trace as memory atom
            if (reasoningSteps.length > 0) {
              await supabase.from('aimos_memory_atoms').insert({
                content: JSON.stringify({
                  query: userQuery.slice(0, 500),
                  response_summary: fullResponse.slice(0, 500),
                  reasoning_steps: reasoningSteps,
                  agent_actions: agentActions
                }),
                content_type: 'reasoning_chain',
                confidence_score: finalConfidence,
                quality_score: reasoningConfig.depth === 'maximum' ? 0.9 : 
                              reasoningConfig.depth === 'deep' ? 0.7 : 0.5,
                relevance_score: 0.8,
                tags: [mode, 'reasoning', reasoningConfig.depth, ...reasoningConfig.phases.map(p => p.toLowerCase())],
                user_id: userId,
                thread_id: conversationId,
                metadata: {
                  reasoning_config: reasoningConfig,
                  phases_executed: [...new Set(reasoningSteps.map(s => s.phase))],
                  agents_used: [...new Set(agentActions.map(a => a.agent))],
                  total_steps: reasoningSteps.length
                }
              });
            }
            
            // Store agent actions separately for swarm visualization
            if (agentActions.length > 0) {
              await supabase.from('aimos_memory_atoms').insert({
                content: JSON.stringify(agentActions),
                content_type: 'agent_action',
                confidence_score: finalConfidence,
                quality_score: 0.6,
                tags: ['agent_swarm', mode, ...new Set(agentActions.map(a => a.agent.toLowerCase()))],
                user_id: userId,
                thread_id: conversationId,
                metadata: {
                  action_count: agentActions.length,
                  agents_involved: [...new Set(agentActions.map(a => a.agent))]
                }
              });
            }
            
            // Store in reasoning chains table for analytics
            if (reasoningSteps.length >= 3) {
              await supabase.from('aimos_reasoning_chains').insert({
                conversation_id: conversationId,
                user_query: userQuery,
                final_answer: fullResponse.slice(0, 2000),
                reasoning_steps: reasoningSteps,
                response_type: reasoningConfig.depth,
                depth: reasoningSteps.length,
                complexity: reasoningConfig.depth,
                coherence_score: finalConfidence,
                completeness_score: reasoningSteps.length / reasoningConfig.phases.length
              });
            }
          }
          
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("neo-chat error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
