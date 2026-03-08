// RAG Service — Phase 3: Document Retrieval-Augmented Generation
// Semantic search + keyword fallback + context window management

import { supabase } from "@/integrations/supabase/client";

export interface RAGResult {
  id: string;
  content: string;
  similarity: number;
  source: string;
  tags: string[];
  contentType: string;
}

export interface RAGContext {
  results: RAGResult[];
  contextBlock: string;
  totalTokens: number;
  sources: string[];
}

const MAX_CONTEXT_TOKENS = 8000;
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

// BM25-style keyword search against memory atoms
export const keywordSearch = async (
  query: string,
  limit = 10
): Promise<RAGResult[]> => {
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (keywords.length === 0) return [];

  // Use ilike for keyword matching across memory atoms
  const { data, error } = await supabase
    .from('aimos_memory_atoms')
    .select('id, content, content_type, tags, source_refs, confidence_score')
    .or(keywords.map(k => `content.ilike.%${k}%`).join(','))
    .order('confidence_score', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map(item => ({
    id: item.id,
    content: item.content,
    similarity: item.confidence_score || 0.5,
    source: (item.source_refs as string[])?.[0] || 'memory',
    tags: (item.tags as string[]) || [],
    contentType: item.content_type,
  }));
};

// Tag-based retrieval from HHNI
export const tagSearch = async (
  tags: string[],
  limit = 10
): Promise<RAGResult[]> => {
  if (tags.length === 0) return [];

  const { data, error } = await supabase
    .from('aimos_memory_atoms')
    .select('id, content, content_type, tags, source_refs, confidence_score')
    .overlaps('tags', tags)
    .order('confidence_score', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map(item => ({
    id: item.id,
    content: item.content,
    similarity: item.confidence_score || 0.5,
    source: (item.source_refs as string[])?.[0] || 'memory',
    tags: (item.tags as string[]) || [],
    contentType: item.content_type,
  }));
};

// Hybrid retrieval: keyword + tag search with deduplication and ranking
export const hybridRetrieve = async (
  query: string,
  options: { maxResults?: number; tags?: string[] } = {}
): Promise<RAGContext> => {
  const maxResults = options.maxResults || 10;

  // Run keyword and tag search in parallel
  const queryTags = extractQueryTags(query);
  const allTags = [...queryTags, ...(options.tags || [])];

  const [keywordResults, tagResults] = await Promise.all([
    keywordSearch(query, maxResults),
    allTags.length > 0 ? tagSearch(allTags, maxResults) : Promise.resolve([]),
  ]);

  // Deduplicate by ID, keeping highest similarity
  const seen = new Map<string, RAGResult>();
  [...keywordResults, ...tagResults].forEach(r => {
    const existing = seen.get(r.id);
    if (!existing || r.similarity > existing.similarity) {
      seen.set(r.id, r);
    }
  });

  // Sort by similarity descending
  const results = Array.from(seen.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);

  // Build context block with token budget
  let tokenBudget = MAX_CONTEXT_TOKENS;
  const contextParts: string[] = [];
  const sources = new Set<string>();

  for (const r of results) {
    const tokens = estimateTokens(r.content);
    if (tokenBudget - tokens < 0) break;
    tokenBudget -= tokens;
    contextParts.push(`[Source: ${r.source} | Tags: ${r.tags.join(', ')} | Confidence: ${Math.round(r.similarity * 100)}%]\n${r.content}`);
    sources.add(r.source);
  }

  const contextBlock = contextParts.length > 0
    ? `[RETRIEVED CONTEXT — ${contextParts.length} documents]\n\n${contextParts.join('\n\n---\n\n')}\n\n[END CONTEXT]`
    : '';

  return {
    results,
    contextBlock,
    totalTokens: MAX_CONTEXT_TOKENS - tokenBudget,
    sources: Array.from(sources),
  };
};

// Ingest content into memory atoms for RAG
export const ingestDocument = async (
  content: string,
  metadata: {
    source: string;
    tags?: string[];
    contentType?: string;
    userId?: string;
  }
): Promise<{ atomId: string | null; chunkCount: number }> => {
  // Chunk content by paragraphs / sections
  const chunks = chunkContent(content);
  let rootId: string | null = null;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const { data, error } = await supabase
      .from('aimos_memory_atoms')
      .insert({
        content: chunk,
        content_type: metadata.contentType || 'context',
        tags: [...(metadata.tags || []), `chunk_${i}`],
        source_refs: [metadata.source],
        confidence_score: 0.8,
        quality_score: 0.7,
        relevance_score: 0.6,
        user_id: metadata.userId,
        parent_id: rootId,
        metadata: { source: metadata.source, chunk_index: i, total_chunks: chunks.length },
      })
      .select('id')
      .single();

    if (!error && data) {
      if (i === 0) rootId = data.id;
    }
  }

  return { atomId: rootId, chunkCount: chunks.length };
};

// Simple content chunking by paragraphs with overlap
function chunkContent(content: string, maxChunkSize = 1500): string[] {
  const paragraphs = content.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Keep last sentence for overlap
      const sentences = current.split(/\. /);
      current = sentences.length > 1 ? sentences[sentences.length - 1] + '. ' : '';
    }
    current += para + '\n\n';
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Extract tags from query
function extractQueryTags(query: string): string[] {
  const tags: string[] = [];
  const topics = ['code', 'design', 'architecture', 'api', 'database', 'security',
    'performance', 'ui', 'plan', 'document', 'config', 'deploy', 'test'];
  topics.forEach(t => {
    if (query.toLowerCase().includes(t)) tags.push(t);
  });
  return tags;
}

// Get RAG stats for memory panel
export const getRAGStats = async (): Promise<{
  totalAtoms: number;
  totalSources: number;
  recentOps: { op: string; target: string; ago: string }[];
}> => {
  const { count: totalAtoms } = await supabase
    .from('aimos_memory_atoms')
    .select('*', { count: 'exact', head: true });

  const { data: recentAtoms } = await supabase
    .from('aimos_memory_atoms')
    .select('id, content_type, source_refs, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const sources = new Set<string>();
  (recentAtoms || []).forEach(a => {
    ((a.source_refs as string[]) || []).forEach(s => sources.add(s));
  });

  const now = Date.now();
  const recentOps = (recentAtoms || []).map(a => {
    const diff = now - new Date(a.created_at).getTime();
    const ago = diff < 60000 ? `${Math.round(diff / 1000)}s` : diff < 3600000 ? `${Math.round(diff / 60000)}m` : `${Math.round(diff / 3600000)}h`;
    return {
      op: a.content_type === 'context' ? 'STORE' : a.content_type === 'reasoning_chain' ? 'REASON' : 'INDEX',
      target: ((a.source_refs as string[]) || ['memory'])[0]?.slice(0, 30) || a.id.slice(0, 8),
      ago,
    };
  });

  return {
    totalAtoms: totalAtoms || 0,
    totalSources: sources.size,
    recentOps,
  };
};
