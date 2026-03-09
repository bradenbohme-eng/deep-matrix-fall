import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════
// CMC ENGINE — Context Memory Core
// Handles: ingest, retrieve, decay, compress
// ═══════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "health_check":
        return json({ status: "ok", engine: "cmc", timestamp: new Date().toISOString(), actions: ["ingest", "retrieve", "decay", "compress", "promote", "stats"] });
      case "ingest":
        return await handleIngest(supabase, body);
      case "retrieve":
        return await handleRetrieve(supabase, body);
      case "decay":
        return await handleDecay(supabase);
      case "compress":
        return await handleCompress(supabase, body);
      case "promote":
        return await handlePromote(supabase, body);
      case "stats":
        return await handleStats(supabase);
      default:
        return json({ error: "Unknown action", actions: ["health_check", "ingest", "retrieve", "decay", "compress", "promote", "stats"] }, 400);
    }
  } catch (e) {
    console.error("[CMC] Error:", e);
    return json({ error: e.message }, 500);
  }
});

// ── INGEST: Store new memory atom with auto-tagging and level assignment ──
async function handleIngest(supabase: any, body: any) {
  const { content, contentType = "context", tags = [], source, userId, level = "warm", metadata = {} } = body;
  if (!content) return json({ error: "content required" }, 400);

  // Chunk if content is large (>2000 chars)
  const chunks = chunkContent(content, 2000);
  const atomIds: string[] = [];
  let parentId: string | null = null;

  for (let i = 0; i < chunks.length; i++) {
    const { data, error } = await supabase
      .from("aimos_memory_atoms")
      .insert({
        content: chunks[i],
        content_type: contentType,
        tags: [...tags, ...(chunks.length > 1 ? [`chunk_${i}/${chunks.length}`] : [])],
        source_refs: source ? [source] : [],
        confidence_score: 0.8,
        quality_score: 0.7,
        relevance_score: 0.6,
        memory_level: level,
        access_count: 0,
        user_id: userId || null,
        parent_id: parentId,
        metadata: { ...metadata, chunk_index: i, total_chunks: chunks.length, source },
      })
      .select("id")
      .single();

    if (data) {
      atomIds.push(data.id);
      if (i === 0) parentId = data.id;
    }
    if (error) console.error("[CMC] Ingest error:", error);
  }

  // Update tag cooccurrence
  if (tags.length > 1) {
    await updateCooccurrence(supabase, tags);
  }

  return json({ success: true, atomIds, chunkCount: chunks.length });
}

// ── RETRIEVE: Multi-level memory retrieval with access tracking ──
async function handleRetrieve(supabase: any, body: any) {
  const { query, tags = [], maxResults = 10, levels = ["hot", "warm"], expandTags = true } = body;
  if (!query) return json({ error: "query required" }, 400);

  const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 1);
  let expandedTags = [...tags];

  // Expand tags via cooccurrence if enabled
  if (expandTags && tags.length > 0) {
    const { data: cooc } = await supabase
      .from("aimos_tag_cooccurrence")
      .select("tag_b, strength")
      .in("tag_a", tags)
      .gte("strength", 0.3)
      .order("strength", { ascending: false })
      .limit(10);
    
    if (cooc) {
      expandedTags = [...new Set([...tags, ...cooc.map((c: any) => c.tag_b)])];
    }
  }

  // Search by keywords across specified levels
  const keywordFilter = keywords.length > 0
    ? keywords.map((k: string) => `content.ilike.%${k}%`).join(",")
    : null;

  let queryBuilder = supabase
    .from("aimos_memory_atoms")
    .select("id, content, content_type, tags, source_refs, confidence_score, memory_level, access_count, metadata")
    .in("memory_level", levels)
    .order("confidence_score", { ascending: false })
    .limit(maxResults);

  if (keywordFilter) {
    queryBuilder = queryBuilder.or(keywordFilter);
  }

  const { data: keywordResults } = await queryBuilder;

  // Also search by tags
  let tagResults: any[] = [];
  if (expandedTags.length > 0) {
    const { data } = await supabase
      .from("aimos_memory_atoms")
      .select("id, content, content_type, tags, source_refs, confidence_score, memory_level, access_count, metadata")
      .in("memory_level", levels)
      .overlaps("tags", expandedTags)
      .order("confidence_score", { ascending: false })
      .limit(maxResults);
    tagResults = data || [];
  }

  // Deduplicate and rank
  const seen = new Map<string, any>();
  for (const r of [...(keywordResults || []), ...tagResults]) {
    if (!seen.has(r.id) || r.confidence_score > seen.get(r.id).confidence_score) {
      seen.set(r.id, r);
    }
  }

  const results = Array.from(seen.values())
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, maxResults);

  // Update access counts for retrieved atoms
  const retrievedIds = results.map((r: any) => r.id);
  if (retrievedIds.length > 0) {
    for (const id of retrievedIds) {
      await supabase
        .from("aimos_memory_atoms")
        .update({ access_count: supabase.rpc ? undefined : 1, last_accessed_at: new Date().toISOString() })
        .eq("id", id);
    }
  }

  // Build context block
  let tokenBudget = 8000;
  const contextParts: string[] = [];
  for (const r of results) {
    const tokens = Math.ceil(r.content.length / 4);
    if (tokenBudget - tokens < 0) break;
    tokenBudget -= tokens;
    contextParts.push(`[${r.memory_level.toUpperCase()} | ${(r.tags || []).join(", ")} | κ=${(r.confidence_score * 100).toFixed(0)}%]\n${r.content}`);
  }

  const contextBlock = contextParts.length > 0
    ? `[CMC RETRIEVED — ${contextParts.length} atoms from ${[...new Set(results.map((r: any) => r.memory_level))].join(",")}]\n\n${contextParts.join("\n\n---\n\n")}\n\n[END CMC]`
    : "";

  return json({
    success: true,
    results,
    contextBlock,
    totalTokens: 8000 - tokenBudget,
    expandedTags,
  });
}

// ── DECAY: Promote/demote atoms between levels based on access patterns ──
async function handleDecay(supabase: any) {
  const now = new Date();
  const stats = { promoted: 0, demoted: 0, compressed: 0 };

  // Promote warm → hot: accessed >5 times in last 24h
  const hotCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: hotCandidates } = await supabase
    .from("aimos_memory_atoms")
    .select("id")
    .eq("memory_level", "warm")
    .gte("access_count", 5)
    .gte("last_accessed_at", hotCutoff);

  for (const atom of hotCandidates || []) {
    await supabase.from("aimos_memory_atoms").update({ memory_level: "hot" }).eq("id", atom.id);
    stats.promoted++;
  }

  // Demote hot → warm: not accessed in 6h
  const warmCutoff = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
  const { data: warmCandidates } = await supabase
    .from("aimos_memory_atoms")
    .select("id")
    .eq("memory_level", "hot")
    .lt("last_accessed_at", warmCutoff);

  for (const atom of warmCandidates || []) {
    await supabase.from("aimos_memory_atoms").update({ memory_level: "warm" }).eq("id", atom.id);
    stats.demoted++;
  }

  // Demote warm → cold: not accessed in 7 days
  const coldCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: coldCandidates } = await supabase
    .from("aimos_memory_atoms")
    .select("id, content")
    .eq("memory_level", "warm")
    .lt("last_accessed_at", coldCutoff)
    .lt("access_count", 3);

  for (const atom of coldCandidates || []) {
    // Compress content using semantic dumbbell
    const compressed = semanticDumbbellCompress(atom.content, 0.3);
    await supabase.from("aimos_memory_atoms").update({
      memory_level: "cold",
      content: compressed,
      compression_ratio: compressed.length / atom.content.length,
    }).eq("id", atom.id);
    stats.demoted++;
    stats.compressed++;
  }

  // Demote cold → frozen: not accessed in 30 days
  const frozenCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: frozenCandidates } = await supabase
    .from("aimos_memory_atoms")
    .select("id, content")
    .eq("memory_level", "cold")
    .lt("last_accessed_at", frozenCutoff);

  for (const atom of frozenCandidates || []) {
    const compressed = semanticDumbbellCompress(atom.content, 0.1);
    await supabase.from("aimos_memory_atoms").update({
      memory_level: "frozen",
      content: compressed,
      compression_ratio: compressed.length / atom.content.length,
    }).eq("id", atom.id);
    stats.demoted++;
    stats.compressed++;
  }

  return json({ success: true, decay: stats, timestamp: now.toISOString() });
}

// ── COMPRESS: Semantic Dumbbell compression ──
async function handleCompress(supabase: any, body: any) {
  const { atomId, targetRatio = 0.3 } = body;
  if (!atomId) return json({ error: "atomId required" }, 400);

  const { data: atom } = await supabase
    .from("aimos_memory_atoms")
    .select("id, content")
    .eq("id", atomId)
    .single();

  if (!atom) return json({ error: "Atom not found" }, 404);

  const compressed = semanticDumbbellCompress(atom.content, targetRatio);
  await supabase.from("aimos_memory_atoms").update({
    content: compressed,
    compression_ratio: compressed.length / atom.content.length,
  }).eq("id", atomId);

  return json({ success: true, originalLength: atom.content.length, compressedLength: compressed.length, ratio: compressed.length / atom.content.length });
}

// ── PROMOTE: Manually promote atom to higher level ──
async function handlePromote(supabase: any, body: any) {
  const { atomId, targetLevel } = body;
  if (!atomId || !targetLevel) return json({ error: "atomId and targetLevel required" }, 400);

  await supabase.from("aimos_memory_atoms").update({ memory_level: targetLevel, last_accessed_at: new Date().toISOString() }).eq("id", atomId);
  return json({ success: true, atomId, newLevel: targetLevel });
}

// ── STATS: Memory level distribution ──
async function handleStats(supabase: any) {
  const levels = ["hot", "warm", "cold", "frozen"];
  const stats: Record<string, number> = {};

  for (const level of levels) {
    const { count } = await supabase.from("aimos_memory_atoms").select("*", { count: "exact", head: true }).eq("memory_level", level);
    stats[level] = count || 0;
  }

  const { count: total } = await supabase.from("aimos_memory_atoms").select("*", { count: "exact", head: true });

  return json({ success: true, levels: stats, total: total || 0 });
}

// ── Helpers ──

function semanticDumbbellCompress(content: string, targetRatio: number): string {
  const sentences = content.split(/(?<=[.!?])\s+/);
  if (sentences.length <= 3) return content;

  const targetCount = Math.max(3, Math.ceil(sentences.length * targetRatio));
  const headCount = Math.ceil(targetCount * 0.4);
  const tailCount = Math.ceil(targetCount * 0.4);
  const middleCount = targetCount - headCount - tailCount;

  const head = sentences.slice(0, headCount);
  const tail = sentences.slice(-tailCount);

  // From middle, keep sentences with highest information density (longest)
  const middleSentences = sentences.slice(headCount, -tailCount || undefined);
  const scored = middleSentences.map((s, i) => ({ s, score: s.length + (s.match(/[A-Z]/g)?.length || 0) * 2 }));
  scored.sort((a, b) => b.score - a.score);
  const middle = scored.slice(0, middleCount).map(x => x.s);

  return [...head, ...(middle.length > 0 ? ["[…compressed…]", ...middle] : ["[…compressed…]"]), ...tail].join(" ");
}

function chunkContent(content: string, maxSize: number): string[] {
  if (content.length <= maxSize) return [content];
  const paragraphs = content.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > maxSize && current.length > 0) {
      chunks.push(current.trim());
      const sentences = current.split(/\. /);
      current = sentences.length > 1 ? sentences[sentences.length - 1] + ". " : "";
    }
    current += para + "\n\n";
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function updateCooccurrence(supabase: any, tags: string[]) {
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const [a, b] = [tags[i], tags[j]].sort();
      await supabase.from("aimos_tag_cooccurrence").upsert(
        { tag_a: a, tag_b: b, cooccurrence_count: 1, strength: 0.5 },
        { onConflict: "tag_a,tag_b" }
      );
    }
  }
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
