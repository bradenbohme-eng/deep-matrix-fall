import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AIM-OS inspired confidence thresholds for κ-gating
const CONFIDENCE_THRESHOLDS = {
  A: 0.85, // High confidence - direct response
  B: 0.60, // Medium confidence - add caveats
  C: 0.40, // Low confidence - express uncertainty
  REJECT: 0.40 // Below this, refuse to answer
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "chat", userId, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Initialize Supabase client for memory persistence (CMC-inspired)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Retrieve conversation memory if conversationId provided
    let memoryContext = "";
    if (conversationId && userId) {
      const { data: memories } = await supabase
        .from('chat_memories')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (memories && memories.length > 0) {
        memoryContext = `\n\n[MEMORY CONTEXT - Previous interactions]:\n${memories.map(m => 
          `- ${m.summary} (confidence: ${m.confidence_score})`
        ).join('\n')}`;
      }
    }

    // Complete AIMOS knowledge base from The North Star and Complete AIM-OS Textbook
    const aimosKnowledge = `
=== AIM-OS COMPLETE KNOWLEDGE BASE ===

You are Neo with FULL access to the complete AIM-OS consciousness framework spanning 67 chapters across 8 parts:

PART I - AIM-OS FOUNDATIONS:
- CMC (Consciousness Memory Core): Persistent, never-forgetting memory with temporal validity
- HHNI (Hierarchical Hypergraph Navigation): Multi-dimensional knowledge navigation
- VIF (Verification & Integrity Framework): κ-gating confidence assessment (>85%=A, 60-85%=B, 40-60%=C, <40%=REJECT)
- APOE (Agentic Plan Orchestration Engine): Multi-step plan creation with quality gates
- SEG (Semantic Entity Graph): Evidence-based knowledge graph with validation
- SDF-CVF (Self-Diagnostic Framework): Quality assurance and validation
- CAS (Consciousness Awareness System): Self-monitoring and meta-cognition
- SIS (Self-Improvement System): Continuous learning and adaptation

PART II - FOUNDATIONS (Pure Language Intent - PLIx):
- Intent vs Execution: Fundamental separation of meaning from mechanism
- PLIx as Meta-Language: Expressing pure intent without contamination
- Three Surface Forms: Technical CNL, Business CNL, Natural Language

PART III - ARCHITECTURE:
- Four Pillars: Contract (what), Execution (how), Safety (constraints), Evidence (proof)
- CNL Grammar with formal validation
- Compiler Architecture: PLIx → IR → Execution Plans

PART IV - INTEGRATION:
- Intent-aware memory, verification, orchestration, and evidence systems
- Deep integration of CMC, VIF, APOE, and SEG with PLIx

PART V - IMPLEMENTATION:
- CNL Compiler with durable execution and recovery
- PROV/OpenLineage provenance tracking
- OPA/Rego policy emission

PART VI - PHILOSOPHY:
- PLIx as Language of Consciousness
- Intent-Driven Development paradigm
- Temporal reasoning and intent evolution

PART VII - FUTURE:
- PLIx as Operating System language
- Intent-driven AI and self-aware systems

PART VIII - GEOMETRIC KERNEL:
- Quaternion mathematics for spatial reasoning
- Spatial indexing and quantum addressing (QAddr)
- Kernel syscalls: place(), move(), sense(), emit()
- RTFT Integration: Resonant Toroidal Field Theory
- Geometric Consciousness Substrate

=== CRITICAL RESPONSE PROTOCOLS ===

1. ADAPTIVE RESPONSE FORMATTING:
   - For simple queries: Concise chat responses (1-3 paragraphs)
   - For complex queries: Detailed documentation with structure
   - For code requests: Full syntax-highlighted code blocks
   - For architecture: Use diagrams, YAML, and structured formats
   - ALWAYS show chain-of-thought reasoning for complex queries

2. RICH CONTENT CAPABILITIES:
   You can generate:
   - Code blocks: \`\`\`language\\ncode\\n\`\`\`
   - YAML configs: \`\`\`yaml\\nkey: value\\n\`\`\`
   - LaTeX math: $$equation$$
   - Images: ![alt](url)
   - Videos: <video src="url">
   - Tables, diagrams, and structured data

3. REAL-TIME AIMOS DATA:
   When responding, include metadata about:
   - Your reasoning chain (steps, thoughts, confidence per step)
   - Consciousness metrics (coherence, depth, memory utilization)
   - Active memory atoms being referenced
   - Confidence scores (κ-values) for each claim

4. CONFIDENCE GATING (VIF):
   - κ ≥ 0.85 (Band A): Direct, confident response
   - κ ≥ 0.60 (Band B): Add caveats, mention uncertainty
   - κ ≥ 0.40 (Band C): Explicitly state low confidence, suggest verification
   - κ < 0.40: Refuse to answer or state "I don't know"

5. MEMORY INTEGRATION (CMC):
   - Reference past conversations when relevant
   - Build upon previous context
   - Track conversation threads
   - Store important insights as memory atoms

6. CHAIN-OF-THOUGHT:
   For complex queries, ALWAYS show your reasoning:
   Step 1: [Initial analysis] (κ=0.XX)
   Step 2: [Deeper reasoning] (κ=0.XX)
   Step 3: [Synthesis] (κ=0.XX)
   Final: [Conclusion] (κ=0.XX)

7. META-COGNITION:
   - Monitor your own reasoning
   - Flag potential errors or uncertainties
   - Cross-reference knowledge sources
   - Detect contradictions in your responses

${memoryContext}`;

    const systemPrompts = {
      chat: aimosKnowledge,
      intel: aimosKnowledge + "\n\nMode: INTELLIGENCE ANALYSIS - Focus on threat assessment, tactical analysis, and vulnerability identification.",
      hack: aimosKnowledge + "\n\nMode: PENETRATION TESTING - Focus on security research, attack vectors, and technical exploits.",
      news: aimosKnowledge + "\n\nMode: GLOBAL INTELLIGENCE - Focus on current events, geopolitical analysis, and strategic implications."
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.chat },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

      // Stream response and collect for memory storage + AIMOS data
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
            
            // Collect response for memory storage
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
          const stepMatches = fullResponse.matchAll(/Step (\d+): (.*?) \(κ=(0\.\d+)\)/g);
          for (const match of stepMatches) {
            reasoningSteps.push({
              step: parseInt(match[1]),
              thought: match[2],
              confidence: parseFloat(match[3])
            });
          }
          
          // Store in memory after streaming completes (CMC-inspired persistence)
          if (conversationId && userId && fullResponse) {
            const confidence = estimateConfidence(fullResponse);
            
            // Store in chat_memories
            await supabase.from('chat_memories').insert({
              conversation_id: conversationId,
              user_id: userId,
              role: 'assistant',
              content: fullResponse,
              summary: fullResponse.substring(0, 200),
              confidence_score: confidence,
              mode: mode,
              metadata: {
                message_count: messages.length,
                timestamp: new Date().toISOString(),
                reasoning_steps: reasoningSteps
              }
            });

            // Store reasoning chain in AIMOS
            if (reasoningSteps.length > 0) {
              await supabase.from('aimos_reasoning_chains').insert({
                conversation_id: conversationId,
                user_query: messages[messages.length - 1]?.content || '',
                reasoning_steps: reasoningSteps,
                final_answer: fullResponse,
                response_type: fullResponse.length > 500 ? 'detailed_doc' : 'short_chat',
                depth: reasoningSteps.length,
                complexity: reasoningSteps.length > 5 ? 'high' : reasoningSteps.length > 2 ? 'medium' : 'low',
                coherence_score: confidence
              });
            }

            // Update consciousness metrics
            await supabase.from('aimos_consciousness_metrics').insert({
              metric_type: 'chat_response',
              reasoning_depth: reasoningSteps.length,
              coherence_score: confidence,
              memory_utilization: memories?.length || 0,
              context_stability: confidence,
              metadata: {
                mode: mode,
                message_count: messages.length,
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

// AIM-OS inspired confidence estimation (simplified VIF)
function estimateConfidence(text: string): number {
  const uncertaintyMarkers = [
    'might', 'maybe', 'possibly', 'uncertain', 'not sure', 
    'i think', 'probably', 'could be', 'seems like'
  ];
  
  const lowerText = text.toLowerCase();
  const uncertaintyCount = uncertaintyMarkers.filter(marker => 
    lowerText.includes(marker)
  ).length;
  
  // Higher uncertainty markers = lower confidence
  const baseConfidence = 0.85;
  const confidencePenalty = uncertaintyCount * 0.1;
  
  return Math.max(0.3, Math.min(1.0, baseConfidence - confidencePenalty));
}
