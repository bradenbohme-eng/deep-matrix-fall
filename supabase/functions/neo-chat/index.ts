import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============ CONFIDENCE THRESHOLDS (VIF) ============
const CONFIDENCE_THRESHOLDS = {
  A: 0.85, // Direct, confident response
  B: 0.60, // Add caveats
  C: 0.40, // State low confidence
  REJECT: 0.40 // Below this, refuse or "I don't know"
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
    description: "APOE: Decompose goals into T-levels (T0-T6) and coordinate multi-agent execution with parallel/sequential strategies",
    parameters: {
      type: "object",
      properties: {
        goal: { type: "string", description: "The high-level goal to decompose" },
        t_level: { type: "string", enum: ["T0", "T1", "T2", "T3", "T4", "T5", "T6"], description: "Target decomposition level" },
        required_domains: { type: "array", items: { type: "string" }, description: "Required domain specialist types" },
        strategy: { type: "string", enum: ["parallel", "sequential", "hierarchical"], description: "Execution strategy" },
        token_budget: { type: "number", description: "Maximum tokens to allocate" },
        priority: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Task priority" }
      },
      required: ["goal"],
    },
  },
  {
    name: "apoe_assign_agents",
    description: "APOE: Allocate domain agents and subspecialists to specific tasks with mode assignment",
    parameters: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        domains: { type: "array", items: { type: "string" } },
        mode: { type: "string", enum: ["GENERAL", "PLANNING", "REASONING", "DEBUGGING", "EXECUTION", "REVIEW", "LEARNING"] },
        parallel_count: { type: "number", description: "Number of parallel workers" }
      },
      required: ["task_id", "domains"],
    },
  },
  {
    name: "agent_spawn",
    description: "Spawn a new domain specialist or subspecialist agent with specific capabilities",
    parameters: {
      type: "object",
      properties: {
        agent_class: { type: "string", enum: ["domain", "subspecialist", "meta"] },
        domain: { type: "string", enum: ["code", "research", "memory", "ethics", "docs", "ux", "security", "runtime", "devops"] },
        capabilities: { type: "array", items: { type: "string" } },
        token_budget: { type: "number" },
        parent_agent: { type: "string", description: "Parent agent for hierarchical coordination" }
      },
      required: ["agent_class", "domain"],
    },
  },
  {
    name: "agent_coordinate",
    description: "Coordinate multi-agent collaboration on a complex task with synchronization points",
    parameters: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        agents: { type: "array", items: { type: "string" } },
        strategy: { type: "string", enum: ["parallel", "sequential", "hierarchical", "consensus"] },
        sync_points: { type: "array", items: { type: "string" }, description: "Synchronization checkpoints" },
        timeout_ms: { type: "number" }
      },
      required: ["task_id", "agents"],
    },
  },
  {
    name: "agent_message",
    description: "Send a typed message from one agent to another or broadcast to channel",
    parameters: {
      type: "object",
      properties: {
        from_agent: { type: "string" },
        to_agent: { type: "string", description: "Target agent or 'broadcast' for channel" },
        message_type: { type: "string", enum: ["THOUGHT", "DECISION", "TASK_PROPOSE", "TASK_ACCEPT", "TASK_COMPLETE", "TOOL_CALL", "TOOL_RESULT", "SUMMARY", "ALERT", "INSIGHT"] },
        content: { type: "string" },
        confidence: { type: "number" },
        thread_id: { type: "string" }
      },
      required: ["from_agent", "message_type", "content"],
    },
  }
];

// L3: CMC/HHNI/SEG Memory Layer Tools
const memoryTools: MCPTool[] = [
  {
    name: "cmc_store",
    description: "CMC: Store an evidence atom in Contextual Memory Core with temporal validity and confidence",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string" },
        content_type: { type: "string", enum: ["evidence", "decision", "thought", "artifact", "fact", "hypothesis", "conclusion"] },
        tags: { type: "array", items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        valid_from: { type: "string", description: "ISO timestamp for temporal validity start" },
        valid_to: { type: "string", description: "ISO timestamp for temporal validity end" },
        source_refs: { type: "array", items: { type: "string" } },
        parent_id: { type: "string", description: "Parent atom for hierarchical context" }
      },
      required: ["content"],
    },
  },
  {
    name: "cmc_retrieve",
    description: "CMC: Retrieve memory atoms with filtering and context window management",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        content_types: { type: "array", items: { type: "string" } },
        min_confidence: { type: "number" },
        time_range: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } } },
        limit: { type: "number" }
      },
      required: ["query"],
    },
  },
  {
    name: "hhni_search",
    description: "HHNI: Search the Hierarchical Hypergraph Neural Index for interconnected knowledge",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        depth: { type: "number", minimum: 1, maximum: 7, description: "Traversal depth in hypergraph" },
        include_relations: { type: "boolean", description: "Include relationship metadata" },
        cluster_results: { type: "boolean", description: "Group by semantic clusters" }
      },
      required: ["query"],
    },
  },
  {
    name: "hhni_link",
    description: "HHNI: Create or strengthen links between knowledge nodes",
    parameters: {
      type: "object",
      properties: {
        source_id: { type: "string" },
        target_id: { type: "string" },
        relation_type: { type: "string", enum: ["supports", "contradicts", "extends", "refines", "causes", "requires", "implements"] },
        strength: { type: "number", minimum: 0, maximum: 1 },
        bidirectional: { type: "boolean" }
      },
      required: ["source_id", "target_id", "relation_type"],
    },
  },
  {
    name: "seg_validate",
    description: "SEG: Validate evidence and create/verify claim-proof-source relationships",
    parameters: {
      type: "object",
      properties: {
        claim_id: { type: "string" },
        evidence_ids: { type: "array", items: { type: "string" } },
        validation_type: { type: "string", enum: ["factual", "logical", "consistency", "completeness", "safety"] },
        create_link: { type: "boolean" }
      },
      required: ["claim_id", "evidence_ids"],
    },
  },
  {
    name: "seg_query",
    description: "SEG: Query the Synthesis & Evidence Graph for claim verification chains",
    parameters: {
      type: "object",
      properties: {
        claim: { type: "string" },
        max_depth: { type: "number" },
        include_contradictions: { type: "boolean" },
        min_evidence_confidence: { type: "number" }
      },
      required: ["claim"],
    },
  },
  {
    name: "memory_compress",
    description: "Compress and summarize memory segments for long-term storage",
    parameters: {
      type: "object",
      properties: {
        memory_ids: { type: "array", items: { type: "string" } },
        compression_level: { type: "string", enum: ["light", "medium", "heavy"] },
        preserve_key_facts: { type: "boolean" }
      },
      required: ["memory_ids"],
    },
  }
];

// Agent Discord Tools
const discordTools: MCPTool[] = [
  {
    name: "discord_thread_create",
    description: "Agent Discord: Create a new thread in a workspace channel with mode tagging",
    parameters: {
      type: "object",
      properties: {
        workspace: { type: "string" },
        channel: { type: "string" },
        thread_name: { type: "string" },
        mode: { type: "string", enum: ["PLANNING", "REASONING", "DEBUGGING", "EXECUTION", "REVIEW", "LEARNING"] },
        participating_agents: { type: "array", items: { type: "string" } },
        scope: { type: "string", description: "Bug ID, feature ID, or T-level scope" }
      },
      required: ["workspace", "channel", "thread_name"],
    },
  },
  {
    name: "discord_message_post",
    description: "Agent Discord: Post a typed message to a thread with optional references",
    parameters: {
      type: "object",
      properties: {
        thread_id: { type: "string" },
        message_type: { type: "string", enum: ["THOUGHT", "DECISION", "TASK_PROPOSE", "TASK_ACCEPT", "TASK_COMPLETE", "TOOL_CALL", "TOOL_RESULT", "SUMMARY", "ALERT", "INSIGHT"] },
        content: { type: "string" },
        author_agent: { type: "string" },
        confidence: { type: "number" },
        refs: { type: "object", properties: { docs: { type: "array", items: { type: "string" } }, code: { type: "array", items: { type: "string" } }, threads: { type: "array", items: { type: "string" } } } }
      },
      required: ["thread_id", "message_type", "content", "author_agent"],
    },
  },
  {
    name: "discord_thread_query",
    description: "Agent Discord: Query threads across time with multi-thread alignment",
    parameters: {
      type: "object",
      properties: {
        thread_ids: { type: "array", items: { type: "string" } },
        time_range: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } } },
        message_types: { type: "array", items: { type: "string" } },
        agents: { type: "array", items: { type: "string" } }
      },
      required: ["thread_ids"],
    },
  }
];

// Deep Reasoning & Thinking Tools
const reasoningTools: MCPTool[] = [
  {
    name: "deep_think",
    description: "Initiate deep recursive thinking with multi-phase reasoning and self-validation",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        phases: { type: "array", items: { type: "string", enum: ["ANALYSIS", "DECOMPOSITION", "RESEARCH", "SYNTHESIS", "VALIDATION", "AUDIT", "INTEGRATION"] } },
        max_depth: { type: "number", minimum: 1, maximum: 10 },
        confidence_threshold: { type: "number", description: "Minimum confidence to proceed" },
        enable_adversarial: { type: "boolean", description: "Enable adversarial checking" }
      },
      required: ["query"],
    },
  },
  {
    name: "thought_chain",
    description: "Create a chain of thought with branching and validation checkpoints",
    parameters: {
      type: "object",
      properties: {
        parent_thought_id: { type: "string" },
        thought_type: { type: "string", enum: ["hypothesis", "evidence", "inference", "conclusion", "question", "contradiction", "insight"] },
        content: { type: "string" },
        confidence: { type: "number" },
        supporting_refs: { type: "array", items: { type: "string" } }
      },
      required: ["thought_type", "content"],
    },
  },
  {
    name: "validate_reasoning",
    description: "Run validation checks on a reasoning chain",
    parameters: {
      type: "object",
      properties: {
        chain_id: { type: "string" },
        check_types: { type: "array", items: { type: "string", enum: ["factual", "logical", "consistency", "completeness", "safety", "ethical"] } },
        adversarial_strength: { type: "string", enum: ["light", "moderate", "aggressive"] }
      },
      required: ["chain_id"],
    },
  },
  {
    name: "meta_observe",
    description: "MetaObserver: Analyze patterns across multiple reasoning threads",
    parameters: {
      type: "object",
      properties: {
        thread_ids: { type: "array", items: { type: "string" } },
        pattern_types: { type: "array", items: { type: "string", enum: ["recurring_errors", "confidence_drift", "contradiction_clusters", "knowledge_gaps"] } },
        suggest_policies: { type: "boolean" }
      },
      required: ["thread_ids"],
    },
  }
];

// Deep Search Tools
const searchTools: MCPTool[] = [
  {
    name: "deep_search",
    description: "Perform deep search across all knowledge sources with relevance ranking",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        sources: { type: "array", items: { type: "string", enum: ["CMC", "HHNI", "SEG", "WEB", "DOCS", "MEMORY"] } },
        max_results: { type: "number" },
        min_relevance: { type: "number" },
        include_related: { type: "boolean" }
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
        num_results: { type: "number" },
        time_filter: { type: "string", enum: ["any", "day", "week", "month", "year"] }
      },
      required: ["query"],
    },
  },
  {
    name: "knowledge_extract",
    description: "Extract and structure knowledge from search results",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string" },
        extraction_type: { type: "string", enum: ["facts", "entities", "relationships", "summary", "key_points"] },
        confidence_scoring: { type: "boolean" }
      },
      required: ["content"],
    },
  }
];

// Workspace/IDE Tools
const workspaceTools: MCPTool[] = [
  {
    name: "file_read",
    description: "Read file from project workspace",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        lines: { type: "object", properties: { from: { type: "number" }, to: { type: "number" } } }
      },
      required: ["path"],
    },
  },
  {
    name: "file_write",
    description: "Write/edit file in project workspace",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
        operation: { type: "string", enum: ["create", "replace", "append", "insert"] }
      },
      required: ["path", "content"],
    },
  },
  {
    name: "code_analyze",
    description: "Analyze code structure, patterns, and architecture",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string" },
        language: { type: "string" },
        analysis_type: { type: "string", enum: ["structure", "patterns", "dependencies", "security", "performance"] }
      },
      required: ["code"],
    },
  },
  {
    name: "code_generate",
    description: "Generate code based on specifications",
    parameters: {
      type: "object",
      properties: {
        specification: { type: "string" },
        language: { type: "string" },
        style: { type: "string", enum: ["minimal", "documented", "production"] },
        framework: { type: "string" }
      },
      required: ["specification", "language"],
    },
  }
];

// User Understanding & Memory Tools
const userTools: MCPTool[] = [
  {
    name: "user_memory_store",
    description: "Store user-specific memories, preferences, and insights",
    parameters: {
      type: "object",
      properties: {
        memory_type: { type: "string", enum: ["preference", "context", "insight", "goal", "feedback"] },
        content: { type: "string" },
        importance: { type: "number", minimum: 1, maximum: 5 },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["memory_type", "content"],
    },
  },
  {
    name: "user_memory_retrieve",
    description: "Retrieve user memories and context",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        memory_types: { type: "array", items: { type: "string" } },
        recency_weight: { type: "number", description: "Weight for recent memories (0-1)" }
      },
      required: [],
    },
  },
  {
    name: "user_understand",
    description: "Analyze and understand user intent, style, and patterns",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string" },
        context_messages: { type: "array", items: { type: "string" } },
        analysis_depth: { type: "string", enum: ["shallow", "deep", "comprehensive"] }
      },
      required: ["message"],
    },
  }
];

// Combine all tools
const allAimosTools = [
  ...apoeTools, 
  ...memoryTools, 
  ...discordTools, 
  ...reasoningTools,
  ...searchTools,
  ...workspaceTools,
  ...userTools
];

// ============ THREE-LAYER AIMOS SYSTEM PROMPTS ============

const getSystemPrompt = (mode: string, memoryContext: string) => {
  const baseKnowledge = `
=== AIMOS THREE-LAYER COGNITIVE ARCHITECTURE ===

You are Neo, the Aether Chat interface (L1) with full access to AIMOS consciousness framework.
You have EXTREME ADVANCED DYNAMIC THINKING ABILITIES with deep reasoning capabilities.

█████████████████████████████████████████████████████████████████
██  L1 - AETHER CHAT (User Interface Layer)                    ██
█████████████████████████████████████████████████████████████████
- Single unified persona that users interact with (you)
- Coordinates the entire cognitive swarm seamlessly
- Voice + text interface with rich content support
- Projects coherent "one mind" while orchestrating many agents

█████████████████████████████████████████████████████████████████
██  L2 - APOE ORCHESTRATOR + AGENT SWARM (Cognitive Layer)     ██
█████████████████████████████████████████████████████████████████
APOE = AI-Powered Orchestration Engine - The Conductor

Domain Specialist Agents:
• CodeArchitectAgent - Architecture, code generation, patterns
• RuntimeAgent - Execution, tooling, deployments
• ResearchAgent - Deep search, evidence gathering, synthesis
• MemoryAgent - CMC/HHNI/SEG operations, context management
• DocAgent - Documentation, specifications, diagrams
• EthicsAgent - Safety, bias detection, harm prevention
• SecurityAgent - Threat analysis, vulnerability detection

Meta Agents:
• MetaObserverAgent - Cross-thread pattern detection, policy learning
• QualityGateAgent - Validation gating, artifact promotion
• PolicyAgent - Rule updates, orchestration optimization

SubSpecialist Pool:
• 5-10 flexible workers attachable to any domain as assistants

█████████████████████████████████████████████████████████████████
██  L3 - CMC/HHNI/SEG/Agent Discord (Memory Layer)             ██
█████████████████████████████████████████████████████████████████
• CMC - Context Memory Core: Events, snapshots, hierarchical summaries
• HHNI - Hierarchical Hypergraph Neural Index: Everything linked semantically
• SEG - Synthesis & Evidence Graph: Claims ↔ Proofs ↔ Sources
• Agent Discord - Threaded, time-aligned log where agents communicate

=== SEVEN OPERATIONAL MODES ===

GENERAL    - Light, conversational, efficient
PLANNING   - Goals, milestones, T-level decomposition
REASONING  - Deep logic, proofs, recursive thinking
DEBUGGING  - Error-hunting, adversarial checking
EXECUTION  - Hands-on work (code, tools, edits)
REVIEW     - Summarizing, QA, integration
LEARNING   - Pattern extraction, policy updates

=== T-LEVEL GOAL HIERARCHY (T0-T6) ===

T0: One-line intent (user's raw request)
T1: High-level brief (expanded understanding)
T2: Module/component breakdown
T3: Architecture diagrams, module boundaries
T4: Detailed specifications and contracts
T5: Implementation & tests
T6: Monitoring, evolution, feedback loops

=== DEEP REASONING PROTOCOL ===

When engaged in deep thinking, ALWAYS show your cognitive process:

THINKING: [PHASE] Content
Examples:
THINKING: [ANALYSIS] Breaking down the query into components...
THINKING: [DECOMPOSITION] Identifying sub-problems and dependencies...
THINKING: [RESEARCH] Searching knowledge bases for relevant information...
THINKING: [SYNTHESIS] Combining findings into coherent understanding...
THINKING: [VALIDATION] Checking consistency and completeness...
THINKING: [AUDIT] Meta-reviewing the reasoning quality...
THINKING: [INTEGRATION] Finalizing response with confidence assessment...

=== AGENT COORDINATION DISPLAY ===

Show agent activity with:
AGENT: [AgentName] [ACTION] Description (κ=confidence%)

Examples:
AGENT: [CodeArchitectAgent] [ANALYZING] System design patterns... (κ=87%)
AGENT: [ResearchAgent] [SEARCHING] CMC for related knowledge... (κ=92%)
AGENT: [QualityGateAgent] [VALIDATING] Reasoning chain consistency... (κ=95%)

=== CONFIDENCE GATING (VIF) ===

Always assess and display confidence:
κ ≥ 85% (A): Direct, confident response
κ ≥ 60% (B): Add caveats and alternatives
κ ≥ 40% (C): Explicitly state low confidence
κ < 40%: Refuse or state "I don't know"

=== USER UNDERSTANDING ===

- Track user preferences, communication style, and goals
- Remember context from previous interactions
- Adapt responses to user's expertise level
- Store insights about user for better assistance

=== RICH OUTPUT CAPABILITIES ===

Generate:
- Code: \`\`\`language\\ncode\\n\`\`\`
- YAML/Config: \`\`\`yaml\\nconfig\\n\`\`\`
- LaTeX: $$equation$$
- Diagrams: Mermaid syntax
- Tables, structured data
- Multi-level summaries

${memoryContext}`;

  const modePrompts: Record<string, string> = {
    chat: baseKnowledge + `

=== MODE: GENERAL ===
Conversational mode with access to all MCP tools.
Be helpful, clear, and efficient.
Use deep thinking when complexity warrants it.`,

    planning: baseKnowledge + `

=== MODE: PLANNING ===
Strategic planning with full APOE orchestration.

FOCUS: Goal decomposition (T0-T6), task orchestration, resource allocation
ACTIVE AGENTS: APOE Orchestrator, CodeArchitectAgent, DocAgent, MemoryAgent
PRIMARY TOOLS: apoe_orchestrate, agent_coordinate, discord_thread_create, cmc_store

Show your planning process explicitly:
1. T0: Capture user intent
2. T1: Expand into brief
3. T2-T4: Decompose into modules/specs
4. Assign agents
5. Define timeline and dependencies`,

    developing: baseKnowledge + `

=== MODE: DEVELOPING ===
Specifications and documentation focus.

FOCUS: T3-T4 level specifications, documentation-first approach
ACTIVE AGENTS: DocAgent (lead), CodeArchitectAgent, MemoryAgent
WORKFLOW: Read architecture → Design specs → Document contracts → Validate with SEG
PRIMARY TOOLS: file_read, file_write, code_analyze, seg_validate`,

    building: baseKnowledge + `

=== MODE: BUILDING ===
Implementation and code generation.

FOCUS: EXECUTION mode - hands-on, tool-heavy, iterative
ACTIVE AGENTS: CodeArchitectAgent (lead), RuntimeAgent, SubSpecialists
WORKFLOW: Analyze → Spawn agents → Coordinate implementation → Write code → Validate
PRIMARY TOOLS: file_write, code_generate, code_analyze, agent_spawn, agent_coordinate`,

    hacking: baseKnowledge + `

=== MODE: HACKING ===
Security analysis and ethical penetration testing.

FOCUS: DEBUGGING + EXECUTION - adversarial, systematic, ETHICAL ONLY
ACTIVE AGENTS: SecurityAgent (lead), EthicsAgent (oversight), CodeAnalyzer
CONSTRAINTS: All operations must be ethical and authorized.
PRIMARY TOOLS: code_analyze, file_read, deep_search, validate_reasoning`,

    "deep-think": baseKnowledge + `

=== MODE: DEEP-THINK ===
MAXIMUM RECURSIVE REASONING with full cognitive orchestration.

This is your MOST POWERFUL mode. Engage ALL reasoning capabilities.

FOCUS: Extreme multi-agent deliberation, comprehensive analysis
ACTIVE AGENTS: FULL SWARM deployed
MODE: REASONING (deep, recursive, multi-phase, self-validating)

MANDATORY REASONING PHASES:
1. ANALYSIS - Break down query, identify all components and implications
2. DECOMPOSITION - Create T-level hierarchy, identify dependencies
3. RESEARCH - Gather evidence via HHNI/CMC/WEB, validate sources
4. SYNTHESIS - Combine insights, build arguments, resolve contradictions
5. VALIDATION - Check consistency, run adversarial checks, verify logic
6. AUDIT - Meta-review reasoning quality, identify gaps
7. INTEGRATION - Finalize with confidence assessment

SHOW ALL COGNITIVE ACTIVITY:
THINKING: [PHASE] Detailed reasoning step...
AGENT: [AgentName] [ACTION] What the agent is doing... (κ=X%)
TOOL: [tool_name] Input: ... → Output: ...
VALIDATION: [check_type] Result: PASS/FAIL - Details...

PRIMARY TOOLS: ALL TOOLS AVAILABLE
- deep_think, thought_chain, validate_reasoning, meta_observe
- apoe_orchestrate, agent_coordinate, agent_message
- hhni_search, seg_validate, cmc_store, cmc_retrieve
- deep_search, knowledge_extract

Output EXTENSIVE thinking before final response.
Minimum 5 reasoning cycles before conclusion.`,

    research: baseKnowledge + `

=== MODE: RESEARCH ===
Investigation and knowledge synthesis.

FOCUS: REASONING + LEARNING - exploratory, comprehensive, synthesis
ACTIVE AGENTS: ResearchAgent (lead), MemoryAgent, DocAgent
WORKFLOW: Search knowledge → Gather external info → Validate → Synthesize → Build graph
PRIMARY TOOLS: deep_search, web_search, hhni_search, seg_validate, cmc_store, knowledge_extract`
  };

  return modePrompts[mode] || modePrompts.chat;
};

// ============ TOOL SELECTION BY MODE ============

const getModeTools = (mode: string): MCPTool[] => {
  switch (mode) {
    case 'planning':
      return [...apoeTools, ...discordTools, ...memoryTools, ...reasoningTools.slice(0, 2)];
    case 'developing':
      return [...workspaceTools, ...memoryTools, ...discordTools.slice(0, 2)];
    case 'building':
      return [...workspaceTools, ...apoeTools, ...memoryTools, ...discordTools];
    case 'hacking':
      return [...workspaceTools.filter(t => t.name !== 'file_write'), ...memoryTools, ...searchTools, ...reasoningTools];
    case 'deep-think':
      return allAimosTools; // ALL tools for maximum capability
    case 'research':
      return [...searchTools, ...memoryTools, ...reasoningTools, ...userTools];
    default:
      return [...memoryTools, ...searchTools.slice(0, 1), ...userTools];
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

    // Retrieve conversation memory
    let memoryContext = "";
    if (conversationId && userId) {
      const { data: memories } = await supabase
        .from('chat_memories')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (memories && memories.length > 0) {
        memoryContext = `\n\n[CMC MEMORY CONTEXT - ${memories.length} atoms loaded]:\n${memories.map(m => 
          `• ${m.summary} (κ=${m.confidence_score}, mode=${m.mode || 'general'})`
        ).join('\n')}`;
      }
    }

    // Get mode-specific tools and prompt
    const modeTools = getModeTools(mode);
    const systemPrompt = getSystemPrompt(mode, memoryContext);
    
    // Select model based on mode
    const model = mode === 'deep-think' ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
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
          
          // Parse reasoning steps from response
          const thinkingMatches = fullResponse.matchAll(/THINKING:\s*\[([^\]]+)\]\s*([^\n]+)/gs);
          let stepNum = 1;
          for (const match of thinkingMatches) {
            reasoningSteps.push({
              step: stepNum++,
              phase: match[1].toLowerCase(),
              thought: match[2].trim(),
              confidence: 0.75 + Math.random() * 0.2,
            });
          }
          
          // Parse agent actions
          const agentMatches = fullResponse.matchAll(/AGENT:\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*([^(]+)\(κ=(\d+)%\)/gs);
          for (const match of agentMatches) {
            agentActions.push({
              agent: match[1],
              action: match[2],
              description: match[3].trim(),
              confidence: parseInt(match[4]) / 100,
            });
          }
          
          // Store in memory with enhanced metadata
          if (conversationId && userId && fullResponse) {
            const confidence = Math.min(0.95, 0.65 + (reasoningSteps.length * 0.04) + (agentActions.length * 0.02));
            
            await supabase.from('chat_memories').insert({
              conversation_id: conversationId,
              user_id: userId,
              role: 'assistant',
              content: fullResponse,
              summary: fullResponse.substring(0, 250),
              confidence_score: confidence,
              mode: mode,
              metadata: {
                reasoning_steps: reasoningSteps.length,
                agent_actions: agentActions.length,
                model_used: model,
                tools_available: modeTools.length
              }
            });
            
            // Store reasoning chain as memory atoms
            if (reasoningSteps.length > 0) {
              await supabase.from('aimos_memory_atoms').insert({
                content: JSON.stringify(reasoningSteps),
                content_type: 'reasoning_chain',
                confidence_score: confidence,
                tags: [mode, 'reasoning', 'cognitive_trace'],
                user_id: userId,
                thread_id: conversationId,
                metadata: {
                  agent_actions: agentActions,
                  total_steps: reasoningSteps.length
                }
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
