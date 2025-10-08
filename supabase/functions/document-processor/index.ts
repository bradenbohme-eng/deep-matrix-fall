import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, content, operation } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract text content if URL provided
    let documentContent = content;
    if (content.startsWith('http')) {
      console.log('Extracting text from URL:', content);
      
      // Download file from storage
      const fileResponse = await fetch(content);
      if (!fileResponse.ok) {
        throw new Error('Failed to download document from storage');
      }
      
      const blob = await fileResponse.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // For .docx files, extract text (basic extraction)
      if (content.includes('.docx')) {
        // Use Gemini's file processing capability
        documentContent = await extractTextWithGemini(arrayBuffer, GEMINI_API_KEY);
      } else {
        // For other files, try to decode as text
        documentContent = new TextDecoder().decode(arrayBuffer);
      }
      
      console.log('Extracted content length:', documentContent.length);
    }

    // Hierarchical chunking with AI
    if (operation === "chunk") {
      const chunks = await chunkDocument(documentContent, GEMINI_API_KEY);
      
      // Store chunks in database
      for (const chunk of chunks) {
        await supabase.from("chunks").insert({
          file_id: documentId,
          content: chunk.content,
          token_count: chunk.tokenCount,
          summary: chunk.summary,
          motifs: chunk.tags
        });
      }

      return new Response(
        JSON.stringify({ success: true, chunks: chunks.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Multi-level summarization
    if (operation === "summarize") {
      const summaries = await generateHierarchicalSummaries(documentContent, GEMINI_API_KEY);
      
      return new Response(
        JSON.stringify({ success: true, summaries }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Master index creation
    if (operation === "create_index") {
      const masterIndex = await createMasterIndex(documentContent, GEMINI_API_KEY);
      
      return new Response(
        JSON.stringify({ success: true, masterIndex }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Contextual editing assistance
    if (operation === "edit_assist") {
      const { section, instruction, context } = await req.json();
      const suggestion = await getEditSuggestion(section, instruction, context, GEMINI_API_KEY);
      
      return new Response(
        JSON.stringify({ success: true, suggestion }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid operation");

  } catch (error) {
    console.error("Document processor error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function chunkDocument(content: string, apiKey: string) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this document and break it into logical, hierarchical chunks. For each chunk, provide:
1. The chunk content
2. A brief summary
3. Key concepts/tags
4. Token count estimate
5. Hierarchical level (0=master, 1=chapter, 2=section, etc.)

Document:
${content}

Return as JSON array with structure: [{content, summary, tags[], tokenCount, level}]`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
        }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  return JSON.parse(text.replace(/```json\n?|\n?```/g, ""));
}

async function generateHierarchicalSummaries(content: string, apiKey: string) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a hierarchical summary system for this document with 4 levels:
1. SHORT (50 words): High-level overview
2. MEDIUM (200 words): Key points and structure
3. LARGE (500 words): Detailed analysis
4. MASTER: Comprehensive index with all major themes, concepts, and navigation map

Document:
${content}

Return as JSON: {short, medium, large, master: {themes[], concepts[], navigation{}}}`
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
        }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text.replace(/```json\n?|\n?```/g, ""));
}

async function createMasterIndex(content: string, apiKey: string) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a comprehensive master index for this document following AI-MOS principles:
1. Hierarchical structure tree
2. Key insights and concepts
3. Thematic map
4. Navigation graph with interconnections
5. Quality metrics (completeness, density, relevance)

Document:
${content}

Return as JSON: {structure{}, keyInsights[], thematicMap{}, navigationGraph{}, qualityMetrics{}}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
        }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text.replace(/```json\n?|\n?```/g, ""));
}

async function extractTextWithGemini(arrayBuffer: ArrayBuffer, apiKey: string): Promise<string> {
  // Convert to base64 for Gemini
  const bytes = new Uint8Array(arrayBuffer);
  const base64 = btoa(String.fromCharCode(...bytes));
  
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                data: base64
              }
            },
            {
              text: "Extract all text content from this document. Return only the plain text content, preserving structure and paragraphs but removing all formatting."
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
        }
      })
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function getEditSuggestion(
  section: string,
  instruction: string,
  context: any,
  apiKey: string
) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI writing assistant with deep contextual understanding.

Section to edit:
${section}

User instruction:
${instruction}

Document context:
${JSON.stringify(context, null, 2)}

Provide:
1. Suggested edits with track changes
2. Rationale for each change
3. Alternative options
4. Impact on overall document coherence

Return as JSON: {edits[], rationale, alternatives[], coherenceImpact}`
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          topK: 40,
          topP: 0.95,
        }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text.replace(/```json\n?|\n?```/g, ""));
}