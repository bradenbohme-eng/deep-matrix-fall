import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { documentId, content, operation, section, instruction, context } = body;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract text content if URL provided
    let documentContent = content || "";
    if (typeof content === "string" && content.startsWith("http")) {
      const fileResponse = await fetch(content);
      if (!fileResponse.ok) throw new Error("Failed to download document from storage");
      const blob = await fileResponse.blob();
      const arrayBuffer = await blob.arrayBuffer();

      if (content.includes(".docx") || content.includes(".pdf")) {
        documentContent = await extractTextWithAI(arrayBuffer, content, LOVABLE_API_KEY);
      } else {
        documentContent = new TextDecoder().decode(arrayBuffer);
      }
      console.log("Extracted content length:", documentContent.length);
    }

    // ─── CHUNK: Hierarchical chunking with AI ───
    if (operation === "chunk") {
      const chunks = await aiCall(LOVABLE_API_KEY,
        `You are a document analysis engine. Break this document into logical, hierarchical chunks.
For each chunk provide: content, summary, tags (array), tokenCount (estimate), level (0=master,1=chapter,2=section).
Return ONLY a JSON array: [{content,summary,tags,tokenCount,level}]`,
        `Document to chunk:\n${documentContent.slice(0, 50000)}`
      );

      const parsed = safeParseJSON(chunks, []);
      // Store chunks as memory atoms for RAG
      for (const chunk of parsed) {
        await supabase.from("aimos_memory_atoms").insert({
          content: chunk.content || chunk.summary || "",
          content_type: "context",
          tags: chunk.tags || [],
          source_refs: [documentId || "upload"],
          confidence_score: 0.8,
          quality_score: 0.7,
          relevance_score: (chunk.level === 0 ? 0.9 : chunk.level === 1 ? 0.7 : 0.5),
          metadata: { chunk_level: chunk.level, token_count: chunk.tokenCount, summary: chunk.summary },
        });
      }

      // Also store in chunks table for backward compat
      for (const chunk of parsed) {
        await supabase.from("chunks").insert({
          file_id: documentId,
          content: chunk.content || "",
          token_count: chunk.tokenCount,
          summary: chunk.summary,
          motifs: chunk.tags,
        });
      }

      return json({ success: true, chunks: parsed.length, storedAsMemoryAtoms: true });
    }

    // ─── SUMMARIZE: Multi-level summaries ───
    if (operation === "summarize") {
      const result = await aiCall(LOVABLE_API_KEY,
        `Create hierarchical summaries at 4 levels:
1. SHORT (50 words): Overview
2. MEDIUM (200 words): Key points
3. LARGE (500 words): Detailed analysis
4. MASTER: Comprehensive index with themes, concepts, navigation map
Return ONLY JSON: {short,medium,large,master:{themes[],concepts[],navigation{}}}`,
        `Document:\n${documentContent.slice(0, 50000)}`
      );
      return json({ success: true, summaries: safeParseJSON(result, {}) });
    }

    // ─── CREATE_INDEX: Master index ───
    if (operation === "create_index") {
      const result = await aiCall(LOVABLE_API_KEY,
        `Create a comprehensive master index following AI-MOS principles:
1. Hierarchical structure tree
2. Key insights and concepts
3. Thematic map
4. Navigation graph with interconnections
5. Quality metrics (completeness, density, relevance)
Return ONLY JSON: {structure{},keyInsights[],thematicMap{},navigationGraph{},qualityMetrics{}}`,
        `Document:\n${documentContent.slice(0, 50000)}`
      );
      return json({ success: true, masterIndex: safeParseJSON(result, {}) });
    }

    // ─── RAG_QUERY: Retrieve context for a query ───
    if (operation === "rag_query") {
      const { query, maxResults = 10 } = body;
      
      // Keyword search against memory atoms
      const keywords = (query || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      let results: any[] = [];
      
      if (keywords.length > 0) {
        const { data } = await supabase
          .from("aimos_memory_atoms")
          .select("id, content, content_type, tags, source_refs, confidence_score")
          .or(keywords.slice(0, 5).map((k: string) => `content.ilike.%${k}%`).join(","))
          .order("confidence_score", { ascending: false })
          .limit(maxResults);
        results = data || [];
      }

      // Build context block
      const contextBlock = results.map((r: any) =>
        `[Source: ${(r.source_refs || ["memory"])[0]} | Confidence: ${Math.round((r.confidence_score || 0.5) * 100)}%]\n${r.content?.slice(0, 500)}`
      ).join("\n\n---\n\n");

      return json({ success: true, results: results.length, context: contextBlock });
    }

    // ─── EDIT_ASSIST: Contextual editing ───
    if (operation === "edit_assist") {
      const result = await aiCall(LOVABLE_API_KEY,
        `You are an AI writing assistant. Provide editing suggestions.
Return ONLY JSON: {edits[],rationale,alternatives[],coherenceImpact}`,
        `Section to edit:\n${section}\n\nInstruction: ${instruction}\n\nContext: ${JSON.stringify(context)}`
      );
      return json({ success: true, suggestion: safeParseJSON(result, {}) });
    }

    // ─── INGEST: Direct text ingestion into RAG ───
    if (operation === "ingest") {
      const { source, tags: ingestTags, userId } = body;
      const chunks = chunkText(documentContent);
      let rootId: string | null = null;

      for (let i = 0; i < chunks.length; i++) {
        const { data } = await supabase
          .from("aimos_memory_atoms")
          .insert({
            content: chunks[i],
            content_type: "context",
            tags: [...(ingestTags || []), `chunk_${i}`],
            source_refs: [source || "direct_ingest"],
            confidence_score: 0.8,
            quality_score: 0.7,
            relevance_score: 0.6,
            user_id: userId,
            parent_id: rootId,
            metadata: { source, chunk_index: i, total_chunks: chunks.length },
          })
          .select("id")
          .single();
        if (data && i === 0) rootId = data.id;
      }

      return json({ success: true, atomId: rootId, chunkCount: chunks.length });
    }

    throw new Error("Invalid operation. Valid: chunk, summarize, create_index, rag_query, edit_assist, ingest");

  } catch (error) {
    console.error("Document processor error:", error);
    const status = error.message?.includes("Rate limit") ? 429 : error.message?.includes("Payment") ? 402 : 500;
    return new Response(
      JSON.stringify({ error: error.message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Helpers ───

function json(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeParseJSON(text: string, fallback: any) {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

function chunkText(content: string, maxSize = 1500): string[] {
  const paragraphs = content.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";
  for (const para of paragraphs) {
    if (current.length + para.length > maxSize && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += para + "\n\n";
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [content.slice(0, maxSize)];
}

async function aiCall(apiKey: string, systemPrompt: string, userContent: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (response.status === 402) throw new Error("Payment required. Please add credits.");
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function extractTextWithAI(arrayBuffer: ArrayBuffer, url: string, apiKey: string): Promise<string> {
  // For binary docs, use Gemini directly since it supports file processing
  const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_KEY) {
    // Fallback: try to decode as text
    return new TextDecoder().decode(arrayBuffer);
  }

  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let base64 = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    base64 += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
  }

  const mimeType = url.includes(".pdf")
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: "Extract ALL text content from this document. Include headers, body text, tables, lists. Return complete plain text preserving structure. Do not summarize." },
          ],
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 100000 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Text extraction failed: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
