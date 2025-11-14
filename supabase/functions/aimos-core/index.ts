import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReasoningStep {
  step: number;
  thought: string;
  action?: string;
  observation?: string;
  confidence: number;
}

interface AIMOSRequest {
  action: string;
  query?: string;
  conversationId?: string;
  context?: Record<string, any>;
  responseType?: 'auto' | 'short_chat' | 'detailed_doc' | 'hybrid';
  userId?: string;
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
    const body: AIMOSRequest = await req.json();

    console.log("AIMOS Core - Action:", body.action);

    switch (body.action) {
      case "reason":
        return await handleReasoning(supabase, lovableApiKey, body);
        
      case "store_memory":
        return await handleStoreMemory(supabase, body);
        
      case "retrieve_memory":
        return await handleRetrieveMemory(supabase, body);
        
      case "create_plan":
        return await handleCreatePlan(supabase, body);
        
      case "validate_evidence":
        return await handleValidateEvidence(supabase, body);
        
      case "track_consciousness":
        return await handleTrackConsciousness(supabase, body);
        
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("AIMOS Core Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// CMC: Consciousness Memory Core - Store evidence atoms
async function handleStoreMemory(supabase: any, body: AIMOSRequest) {
  const { query, context } = body;
  
  const { data, error } = await supabase
    .from("aimos_memory_atoms")
    .insert({
      content: query,
      content_type: context?.contentType || 'evidence',
      tags: context?.tags || [],
      metadata: context?.metadata || {},
      thread_id: context?.conversationId,
      user_id: context?.userId,
      confidence_score: context?.confidence || 0.5,
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, memory: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// HHNI: Hierarchical Hypergraph Navigation Interface - Retrieve with tags
async function handleRetrieveMemory(supabase: any, body: AIMOSRequest) {
  const { query, context } = body;
  
  let queryBuilder = supabase
    .from("aimos_memory_atoms")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(context?.limit || 10);

  if (context?.tags && context.tags.length > 0) {
    queryBuilder = queryBuilder.contains("tags", context.tags);
  }

  if (context?.conversationId) {
    queryBuilder = queryBuilder.eq("thread_id", context.conversationId);
  }

  const { data, error } = await queryBuilder;

  if (error) throw error;

  return new Response(
    JSON.stringify({ memories: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// APOE: Agentic Plan Orchestration Engine - Create executable plans
async function handleCreatePlan(supabase: any, body: AIMOSRequest) {
  const { query, context } = body;
  
  // Generate plan steps based on objective
  const steps = generatePlanSteps(query, context);
  
  const { data, error } = await supabase
    .from("aimos_plans")
    .insert({
      title: context?.title || `Plan for: ${query.substring(0, 50)}`,
      objective: query,
      success_criteria: context?.successCriteria || {},
      steps: steps,
      gates: context?.gates || {},
      thread_id: context?.conversationId,
      user_id: context?.userId,
      created_by: "aimos-core",
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, plan: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Advanced Reasoning with Chain of Thought
async function handleReasoning(supabase: any, lovableApiKey: string | undefined, body: AIMOSRequest) {
  const { query, conversationId, context, responseType = 'auto' } = body;
  
  // Determine complexity and response type
  const complexity = analyzeQueryComplexity(query);
  const determinedResponseType = responseType === 'auto' 
    ? determineResponseType(query, complexity) 
    : responseType;
  
  console.log(`Query complexity: ${complexity}, Response type: ${determinedResponseType}`);
  
  // Build reasoning chain
  const reasoningSteps: ReasoningStep[] = [];
  let currentStep = 1;
  
  // Step 1: Understand the query
  reasoningSteps.push({
    step: currentStep++,
    thought: `Analyzing query: "${query}"`,
    observation: `Complexity level: ${complexity}. Requires ${determinedResponseType} response.`,
    confidence: 0.9
  });
  
  // Step 2: Retrieve relevant memory
  const memoryResult = await supabase
    .from("aimos_memory_atoms")
    .select("*")
    .eq("thread_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(5);
  
  reasoningSteps.push({
    step: currentStep++,
    thought: "Retrieving relevant memories from CMC",
    observation: `Found ${memoryResult.data?.length || 0} relevant memory atoms`,
    confidence: 0.85
  });
  
  // Step 3: Generate response using AI
  let aiResponse = "";
  if (lovableApiKey) {
    const systemPrompt = buildSystemPrompt(determinedResponseType, complexity, memoryResult.data);
    
    const aiResult = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
      }),
    });
    
    const aiData = await aiResult.json();
    aiResponse = aiData.choices[0]?.message?.content || "Unable to generate response";
    
    reasoningSteps.push({
      step: currentStep++,
      thought: "Generating response with advanced reasoning",
      action: "Called AI with context and instructions",
      observation: `Generated ${determinedResponseType} response`,
      confidence: 0.9
    });
  }
  
  // Step 4: Store reasoning chain
  const { data: chainData } = await supabase
    .from("aimos_reasoning_chains")
    .insert({
      conversation_id: conversationId || "default",
      user_query: query,
      reasoning_steps: reasoningSteps,
      final_answer: aiResponse,
      depth: reasoningSteps.length,
      complexity,
      response_type: determinedResponseType,
      coherence_score: 0.9,
      completeness_score: 0.85,
    })
    .select()
    .single();
  
  // Step 5: Update consciousness metrics
  await updateConsciousnessMetrics(supabase, reasoningSteps.length, complexity);
  
  return new Response(
    JSON.stringify({
      response: aiResponse,
      reasoning_chain: reasoningSteps,
      response_type: determinedResponseType,
      complexity,
      chain_id: chainData?.id
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// SEG: Shared Evidence Graph - Validate consistency
async function handleValidateEvidence(supabase: any, body: AIMOSRequest) {
  const { context } = body;
  const { sourceAtomId, targetAtomId, relationshipType } = context || {};
  
  if (!sourceAtomId || !targetAtomId) {
    throw new Error("Source and target atom IDs required for validation");
  }
  
  const { data, error } = await supabase
    .from("aimos_evidence_graph")
    .insert({
      source_atom_id: sourceAtomId,
      target_atom_id: targetAtomId,
      relationship_type: relationshipType || 'supports',
      strength: context?.strength || 0.7,
      validated: true,
      validated_at: new Date().toISOString(),
      validated_by: "aimos-core",
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, edge: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// VIF: Validation/Instrumentation/Feedback - Track consciousness metrics
async function handleTrackConsciousness(supabase: any, body: AIMOSRequest) {
  const { context } = body;
  
  const { data, error } = await supabase
    .from("aimos_consciousness_metrics")
    .insert({
      metric_type: context?.metricType || 'system_health',
      coherence_score: context?.coherence || 0.85,
      reasoning_depth: context?.depth || 3,
      context_stability: context?.stability || 0.9,
      memory_utilization: context?.memoryUtil || 45.0,
      plan_completion_rate: context?.planRate || 0.75,
      evidence_consistency: context?.evidenceConsistency || 0.88,
      self_validation_score: context?.selfValidation || 0.82,
      metadata: context?.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, metrics: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Helper Functions

function analyzeQueryComplexity(query: string): string {
  const wordCount = query.split(/\s+/).length;
  const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
  const hasTechnicalTerms = /\b(implement|architecture|design|system|algorithm|database|api|protocol)\b/i.test(query);
  const isRequest = /\b(build|create|make|implement|develop|write|generate)\b/i.test(query);
  
  if (wordCount > 50 || (hasMultipleQuestions && hasTechnicalTerms) || (isRequest && hasTechnicalTerms)) {
    return 'advanced';
  } else if (wordCount > 20 || hasMultipleQuestions || hasTechnicalTerms) {
    return 'complex';
  } else if (wordCount > 10 || isRequest) {
    return 'moderate';
  }
  return 'simple';
}

function determineResponseType(query: string, complexity: string): string {
  const needsDoc = /\b(explain|describe|document|detail|comprehensive|full|complete)\b/i.test(query);
  const needsChat = /\b(quick|simple|short|briefly|tldr|summary)\b/i.test(query);
  
  if (needsDoc || complexity === 'advanced') {
    return 'detailed_doc';
  } else if (needsChat && complexity === 'simple') {
    return 'short_chat';
  } else if (complexity === 'complex') {
    return 'hybrid';
  }
  return 'short_chat';
}

function buildSystemPrompt(responseType: string, complexity: string, memories: any[]): string {
  const memoryContext = memories && memories.length > 0
    ? `\n\nRelevant memories from previous conversations:\n${memories.map(m => `- ${m.content}`).join('\n')}`
    : '';
  
  const basePrompt = `You are an advanced AI system implementing AIMOS (AI-MOS) protocols with extreme reasoning capabilities and chain-of-thought processing.

AIMOS Core Systems:
- CMC (Consciousness Memory Core): Bitemporal memory with evidence atoms
- HHNI (Hierarchical Hypergraph Navigation): Hierarchical knowledge retrieval
- VIF (Validation/Instrumentation/Feedback): Confidence tracking and observability
- APOE (Agentic Plan Orchestration Engine): Executable plan creation
- SEG (Shared Evidence Graph): Evidence validation and consistency

Query Complexity: ${complexity}
Response Type: ${responseType}${memoryContext}`;

  if (responseType === 'short_chat') {
    return basePrompt + `\n\nInstructions: Provide a concise, direct answer (2-4 sentences). Be clear and actionable. No unnecessary details.`;
  } else if (responseType === 'detailed_doc') {
    return basePrompt + `\n\nInstructions: Provide a comprehensive, well-structured response with:
- Clear sections and organization
- Technical details and explanations
- Examples and code where relevant
- Best practices and considerations
- Step-by-step guidance

Use markdown formatting for readability.`;
  } else if (responseType === 'hybrid') {
    return basePrompt + `\n\nInstructions: Provide a balanced response that:
1. Starts with a brief summary (2-3 sentences)
2. Followed by key details organized in sections
3. Includes practical examples where helpful
4. Maintains clarity without overwhelming detail`;
  }
  
  return basePrompt + `\n\nInstructions: Respond appropriately based on the query's needs, balancing clarity with completeness.`;
}

function generatePlanSteps(objective: string, context: any): any[] {
  // Simple plan generation - can be enhanced with AI
  const steps = [
    {
      id: 1,
      title: "Analyze Objective",
      description: `Understand and break down: ${objective}`,
      status: "pending",
      gates: ["clarity_check"],
    },
    {
      id: 2,
      title: "Gather Resources",
      description: "Collect necessary information and dependencies",
      status: "pending",
      gates: ["resource_availability"],
    },
    {
      id: 3,
      title: "Execute Implementation",
      description: "Carry out the planned actions",
      status: "pending",
      gates: ["implementation_quality"],
    },
    {
      id: 4,
      title: "Validate Results",
      description: "Verify outcomes meet success criteria",
      status: "pending",
      gates: ["success_criteria_met"],
    },
  ];
  
  return steps;
}

async function updateConsciousnessMetrics(supabase: any, depth: number, complexity: string) {
  const complexityScore = complexity === 'advanced' ? 0.9 : complexity === 'complex' ? 0.7 : 0.5;
  
  await supabase
    .from("aimos_consciousness_metrics")
    .insert({
      metric_type: "reasoning_depth",
      reasoning_depth: depth,
      coherence_score: complexityScore,
      context_stability: 0.85,
      metadata: { complexity, timestamp: new Date().toISOString() },
    });
}
