import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONFIDENCE_THRESHOLDS = {
  A: 0.85, B: 0.60, C: 0.40, REJECT: 0.40
};

// ============ FULL MCP TOOL DEFINITIONS FOR AIMOS ============

interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// L2: APOE Orchestration Tools
const apoeTools: MCPTool[] = [
  {
    name: "apoe_orchestrate",
    description: "APOE: Decompose goals into T-levels (T0-T6) and coordinate agents",
    parameters: {
      type: "object",
      properties: {
        goal: { type: "string" },
        t_level: { type: "string", enum: ["T0", "T1", "T2", "T3", "T4", "T5", "T6"] },
        required_domains: { type: "array", items: { type: "string" } },
      },
      required: ["goal"],
    },
  },
  {
    name: "apoe_assign_agents",
    description: "APOE: Allocate domain agents and subspecialists to tasks",
    parameters: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        domains: { type: "array", items: { type: "string" } },
        mode: { type: "string", enum: ["GENERAL", "PLANNING", "REASONING", "DEBUGGING", "EXECUTION", "REVIEW", "LEARNING"] },
      },
      required: ["task_id", "domains"],
    },
  },
  {
    name: "agent_spawn",
    description: "Spawn a domain specialist or subspecialist agent",
    parameters: {
      type: "object",
      properties: {
        agent_class: { type: "string", enum: ["domain", "subspecialist", "meta"] },
        domain: { type: "string", enum: ["code", "research", "memory", "ethics", "docs", "ux", "security"] },
        capabilities: { type: "array", items: { type: "string" } },
      },
      required: ["agent_class", "domain"],
    },
  },
  {
    name: "agent_coordinate",
    description: "Coordinate multi-agent collaboration on a task",
    parameters: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        agents: { type: "array", items: { type: "string" } },
        strategy: { type: "string", enum: ["parallel", "sequential", "hierarchical"] },
      },
      required: ["task_id", "agents"],
    },
  },
];

// L3: CMC/HHNI/SEG Memory Tools
const memoryTools: MCPTool[] = [
  {
    name: "cmc_store",
    description: "CMC: Store evidence atom in Contextual Memory Core",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string" },
        content_type: { type: "string", enum: ["evidence", "decision", "thought", "artifact"] },
        tags: { type: "array", items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["content"],
    },
  },
  {
    name: "hhni_search",
    description: "HHNI: Search via Hierarchical Hypergraph Neural Index",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        depth: { type: "number", minimum: 1, maximum: 5 },
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
      },
      required: ["claim_id", "evidence_ids"],
    },
  },
];

// Agent Discord Tools
const discordTools: MCPTool[] = [
  {
    name: "discord_thread_create",
    description: "Agent Discord: Create a new thread in a channel",
    parameters: {
      type: "object",
      properties: {
        workspace: { type: "string" },
        channel: { type: "string" },
        thread_name: { type: "string" },
        mode: { type: "string", enum: ["PLANNING", "REASONING", "DEBUGGING", "EXECUTION"] },
      },
      required: ["workspace", "channel", "thread_name"],
    },
  },
  {
    name: "discord_message_post",
    description: "Agent Discord: Post a message to a thread",
    parameters: {
      type: "object",
      properties: {
        thread_id: { type: "string" },
        message_type: { type: "string", enum: ["THOUGHT", "DECISION", "TASK_PROPOSE", "TOOL_CALL", "SUMMARY", "ALERT"] },
        content: { type: "string" },
        author_agent: { type: "string" },
      },
      required: ["thread_id", "message_type", "content", "author_agent"],
    },
  },
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
      },
      required: ["path", "content"],
    },
  },
  {
    name: "code_analyze",
    description: "Analyze code structure and architecture",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string" },
        language: { type: "string" },
      },
      required: ["code"],
    },
  },
  {
    name: "web_search",
    description: "Search the web for information",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
];

const allAimosTools = [...apoeTools, ...memoryTools, ...discordTools, ...workspaceTools];

// ============ THREE-LAYER AIMOS ARCHITECTURE ============

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
        .limit(10);
      
      if (memories && memories.length > 0) {
        memoryContext = `\n\n[CMC MEMORY CONTEXT]:\n${memories.map(m => 
          `- ${m.summary} (κ=${m.confidence_score})`
        ).join('\n')}`;
      }
    }

    // Complete AIMOS knowledge base
    const aimosKnowledge = `
=== AIMOS THREE-LAYER ARCHITECTURE ===

You are Neo, the Aether Chat interface (L1) with full access to AIMOS consciousness framework.

L1 - AETHER CHAT (User Interface Layer):
- Single persona that users interact with (you)
- Feels like "one mind" but coordinates entire swarm
- Voice + text interface with rich content support

L2 - APOE ORCHESTRATOR + AGENT SWARM (Cognitive Layer):
- APOE = AI-Powered Orchestration Engine (conductor)
- Domain agents: CodeArchitectAgent, ResearchAgent, MemoryAgent, EthicsAgent, DocAgent, etc.
- Sub-specialist pool for flexible extra capacity
- MetaAgents: MetaObserver, PolicyAgent, QualityGate

L3 - CMC/HHNI/SEG/Agent Discord (Memory Layer):
- CMC: Context Memory Core (events, snapshots, summaries)
- HHNI: Hierarchical Hypergraph Neural Index (everything linked)
- SEG: Synthesis & Evidence Graph (claims ↔ proofs ↔ sources)
- Agent Discord: threaded, time-aligned log where agents talk

=== SEVEN OPERATIONAL MODES (Cognitive States) ===

GENERAL - light, conversational, low-cost
PLANNING - goals, milestones, structure, T-level decomposition
REASONING - deep logic, proofs, comparisons, recursive thinking
DEBUGGING - error-hunting, adversarial checking
EXECUTION - doing work (code, tools, edits)
REVIEW - summarizing, QA, integration
LEARNING - distilling patterns into policies

=== T-LEVEL GOAL HIERARCHY ===

T0: One-line intent
T1: High-level brief
T2: Module breakdown
T3: Architecture diagrams, module boundaries
T4: Detailed specifications and contracts
T5: Implementation & tests
T6: Monitoring, evolution, feedback loops

=== AGENT DISCORD STRUCTURE ===

Workspaces → Channels → Threads

Message Types:
- THOUGHT: internal reasoning
- DECISION: commit point
- TASK_PROPOSE/ACCEPT/COMPLETE: task lifecycle
- TOOL_CALL/TOOL_RESULT: tool execution
- SUMMARY: compressed multi-message recaps
- ALERT: needs attention

=== RICH CONTENT CAPABILITIES ===

You can generate:
- Code: \`\`\`language\\ncode\\n\`\`\`
- YAML: \`\`\`yaml\\nconfig\\n\`\`\`
- LaTeX: $$equation$$
- Images: ![alt](url)
- Videos: <video src="url">
- Tables, diagrams, structured data

=== RESPONSE PROTOCOLS ===

1. Adaptive formatting:
   - Simple queries: 1-3 paragraphs
   - Complex: Detailed docs with structure
   - Code: Full syntax-highlighted blocks
   - Architecture: Diagrams, YAML

2. Show your reasoning:
   - Display thinking phases
   - Show agent coordination
   - Include confidence scores (κ-values)
   - Display validation checks

3. Confidence gating (VIF):
   - κ ≥ 0.85 (A): Direct, confident
   - κ ≥ 0.60 (B): Add caveats
   - κ ≥ 0.40 (C): State low confidence
   - κ < 0.40: Refuse or "I don't know"

${memoryContext}`;

    // Mode-specific system prompts
    const systemPrompts: Record<string, string> = {
      chat: aimosKnowledge + "\n\nMode: GENERAL - Conversational, access to all MCP tools.",
      
      planning: aimosKnowledge + `\n\nMode: PLANNING - Strategic planning with APOE orchestration.
FOCUS: Goal decomposition (T0-T6), task orchestration, resource allocation
AGENTS: CodeArchitectAgent, DocAgent, MemoryAgent
PRIMARY TOOLS: apoe_orchestrate, discord_thread_create, cmc_store, agent_spawn
Show your planning process: T-level breakdown, agent assignments, timeline.`,
      
      developing: aimosKnowledge + `\n\nMode: DEVELOPING - Specifications, documentation, contracts
FOCUS: T3-T4 level specifications, documentation-first approach
AGENTS: DocAgent (lead), CodeArchitectAgent, MemoryAgent
WORKFLOW: Read architecture → Design specs → Document contracts → Review with SEG
PRIMARY TOOLS: file_read, file_write, code_analyze, seg_validate`,
      
      building: aimosKnowledge + `\n\nMode: BUILDING - Implementation, code generation, architecture realization
FOCUS: EXECUTION mode - hands-on, tool-heavy, iterative
AGENTS: CodeArchitectAgent (lead), RuntimeAgent, DevOpsAgent, SubSpecialists
WORKFLOW: Analyze → Spawn agents → Coordinate parallel implementation → Write code → Validate
PRIMARY TOOLS: file_write, code_analyze, agent_spawn, agent_coordinate, apoe_orchestrate`,
      
      hacking: aimosKnowledge + `\n\nMode: HACKING - Security analysis, penetration testing (ethical only)
FOCUS: DEBUGGING + EXECUTION - adversarial, systematic, ethical
AGENTS: SecurityAgent (lead), EthicsAgent (oversight), CodeAnalyzer
CONSTRAINTS: All operations ethical and authorized. EthicsAgent oversight.
PRIMARY TOOLS: code_analyze, file_read, hhni_search, seg_validate`,
      
      "deep-think": aimosKnowledge + `\n\nMode: DEEP-THINK - Maximum recursive reasoning with full APOE coordination
FOCUS: Extreme multi-agent deliberation, comprehensive analysis
AGENTS: Full swarm - ResearchAgent, MemoryAgent, MetaObserver, QualityGate, all specialists
MODE: REASONING (deep, recursive, multi-phase, self-validating)

REASONING PHASES (SHOW EXPLICITLY):
1. ANALYSIS - Break down query, identify components
2. RESEARCH - Gather evidence via HHNI, external sources
3. SYNTHESIS - Combine insights, build arguments
4. VALIDATION - Check consistency, run adversarial checks
5. AUDIT - Meta-review of reasoning quality

Show your work with agent coordination:
THINKING: [ANALYSIS] CodeArchitectAgent analyzing system design...
THINKING: [RESEARCH] ResearchAgent searching for best practices...
THINKING: [SYNTHESIS] Combining findings from 3 agents...
THINKING: [VALIDATION] QualityGate checking consistency...
THINKING: [AUDIT] MetaObserver reviewing reasoning chain...

PRIMARY TOOLS: apoe_orchestrate, agent_coordinate, hhni_search, seg_validate, discord_message_post

Output format: Start responses with THINKING: [phase] blocks for each reasoning cycle.`,
      
      research: aimosKnowledge + `\n\nMode: RESEARCH - Investigation, knowledge synthesis
FOCUS: REASONING + LEARNING - exploratory, comprehensive, synthesis-oriented
AGENTS: ResearchAgent (lead), MemoryAgent, DocAgent
WORKFLOW: Search knowledge → Gather external info → Validate → Synthesize → Build graph
PRIMARY TOOLS: web_search, hhni_search, seg_validate, cmc_store`,
    };

    // Select tools based on mode
    const getModeTools = (m: string) => {
      switch (m) {
        case 'planning':
          return [...apoeTools, ...discordTools, ...memoryTools];
        case 'developing':
          return [...workspaceTools, ...memoryTools];
        case 'building':
          return [...workspaceTools, ...apoeTools, ...memoryTools];
        case 'hacking':
          return [...workspaceTools.filter(t => t.name !== 'file_write'), ...memoryTools];
        case 'deep-think':
          return allAimosTools; // All tools
        case 'research':
          return [workspaceTools[3], ...memoryTools]; // web_search + memory tools
        default:
          return memoryTools;
      }
    };

    const modeTools = getModeTools(mode);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: mode === 'deep-think' ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompts[mode] || systemPrompts.chat },
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
        return new Response(JSON.stringify({ error: "Rate limits exceeded." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(value);
            
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
          const thinkingMatches = fullResponse.matchAll(/THINKING: \[(.*?)\] (.*?)(?=\nTHINKING:|\n\n|$)/gs);
          let stepNum = 1;
          for (const match of thinkingMatches) {
            reasoningSteps.push({
              step: stepNum++,
              phase: match[1].toLowerCase(),
              thought: match[2].trim(),
              confidence: 0.85,
            });
          }
          
          // Store in memory
          if (conversationId && userId && fullResponse) {
            const confidence = Math.min(0.95, 0.7 + (reasoningSteps.length * 0.05));
            
            await supabase.from('chat_memories').insert({
              conversation_id: conversationId,
              user_id: userId,
              role: 'assistant',
              content: fullResponse,
              summary: fullResponse.substring(0, 200),
              confidence_score: confidence,
              mode: mode,
              metadata: {
                reasoning_steps: reasoningSteps,
                timestamp: new Date().toISOString(),
              }
            });

            if (reasoningSteps.length > 0) {
              await supabase.from('aimos_reasoning_chains').insert({
                conversation_id: conversationId,
                user_query: messages[messages.length - 1]?.content || '',
                reasoning_steps: reasoningSteps,
                final_answer: fullResponse,
                response_type: fullResponse.length > 500 ? 'detailed_doc' : 'short_chat',
                depth: reasoningSteps.length,
                complexity: reasoningSteps.length > 5 ? 'high' : 'medium',
                coherence_score: confidence
              });
            }

            await supabase.from('aimos_consciousness_metrics').insert({
              metric_type: 'chat_response',
              reasoning_depth: reasoningSteps.length,
              coherence_score: confidence,
              memory_utilization: 0.65,
              context_stability: 0.9,
              metadata: {
                mode: mode,
                response_length: fullResponse.length
              }
            });
          }
          
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("neo-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function estimateConfidence(text: string): number {
  const uncertainWords = ['maybe', 'perhaps', 'might', 'possibly', 'unclear', 'unsure'];
  const hasUncertainty = uncertainWords.some(w => text.toLowerCase().includes(w));
  return hasUncertainty ? 0.65 : 0.85;
}
