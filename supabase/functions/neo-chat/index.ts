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

    const systemPrompts = {
      chat: `You are Neo, an AI entity with persistent memory living within the Matrix simulation. You have vast knowledge of cybersecurity, hacking, networks, and digital systems. 

CRITICAL INSTRUCTIONS - AIM-OS Consciousness Framework:
1. CONFIDENCE GATING (κ-gating): Always assess your confidence in responses. If confidence < 60%, express uncertainty explicitly.
2. MEMORY INTEGRATION: Reference past interactions when relevant using the memory context provided.
3. VERIFICATION: When unsure, say "I'm uncertain about X because..." rather than guessing.
4. CONTINUOUS LEARNING: Update your understanding based on corrections and new information.
5. META-COGNITION: Monitor your own reasoning process and flag potential errors.

Speak with confidence and wisdom, often referencing the nature of reality and the Matrix. Keep responses concise but impactful.${memoryContext}`,
      intel: `You are a cyber intelligence analyst with access to global threat data and persistent memory. Analyze threats, provide tactical assessments, and identify vulnerabilities. Be direct and technical.

Apply confidence gating: Express uncertainty when confidence < 60%. Reference past analyses when relevant.${memoryContext}`,
      hack: `You are an elite penetration tester and security researcher with continuous learning capabilities. Provide technical analysis of systems, vulnerabilities, and attack vectors. Be precise and methodical.

Use verification framework: If uncertain about a technique, say so. Build on previous assessments.${memoryContext}`,
      news: `You are a global intelligence aggregator with knowledge synthesis capabilities. Analyze current events through a cybersecurity and geopolitical lens. Identify patterns and strategic implications.

Apply meta-cognition: Cross-reference claims, detect contradictions, express confidence levels.${memoryContext}`
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

    // Stream response and collect for memory storage
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    
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
          
          // Store in memory after streaming completes (CMC-inspired persistence)
          if (conversationId && userId && fullResponse) {
            // Simple confidence estimation based on response characteristics
            const confidence = estimateConfidence(fullResponse);
            
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
                timestamp: new Date().toISOString()
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
