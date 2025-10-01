import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, category = "cybersecurity", limit = 5 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a global intelligence aggregator specialized in cybersecurity, geopolitical threats, and emerging technologies. 

Generate ${limit} realistic intelligence briefings about ${category} related to the query. Each briefing should:
- Have a compelling headline
- Include technical details and implications
- Assess threat level (LOW, MEDIUM, HIGH, CRITICAL)
- Provide strategic context
- Be based on realistic scenarios and current threat landscapes

Format each briefing as a JSON object with: title, summary, threat_level, source, timestamp, tags`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${limit} intelligence briefings about: ${query}` }
        ],
        stream: false,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to fetch intelligence" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Try to parse JSON from the response
    let briefings = [];
    try {
      // Extract JSON array from markdown code blocks if present
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        briefings = JSON.parse(jsonMatch[0]);
      } else {
        // If not in JSON format, create a single briefing from the response
        briefings = [{
          title: "Intelligence Briefing",
          summary: content,
          threat_level: "MEDIUM",
          source: "AI Analysis",
          timestamp: new Date().toISOString(),
          tags: [category, query]
        }];
      }
    } catch (parseError) {
      // Fallback if parsing fails
      briefings = [{
        title: `Intelligence on ${query}`,
        summary: content,
        threat_level: "MEDIUM",
        source: "AI Analysis",
        timestamp: new Date().toISOString(),
        tags: [category]
      }];
    }

    return new Response(JSON.stringify({ briefings, query, category }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("intel-aggregator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
