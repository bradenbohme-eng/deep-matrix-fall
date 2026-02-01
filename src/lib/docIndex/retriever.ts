// RAG Retriever - Efficient semantic search and retrieval
// Optimized for AI Agent queries

import {
  MasterIndex, DocumentIndex, DocumentChunk, RAGQuery,
  RAGFilters, RAGOptions, RAGResult, ScoredChunk
} from './types';

// Default options
const DEFAULT_RAG_OPTIONS: RAGOptions = {
  maxResults: 10,
  includeContext: true,
  contextLines: 3,
  groupByDocument: false,
  scoringMethod: 'bm25',
};

// Tokenize query for matching
const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
};

// BM25 scoring parameters
const BM25_K1 = 1.5;
const BM25_B = 0.75;

// Calculate BM25 score
const calculateBM25 = (
  chunk: DocumentChunk,
  queryTokens: string[],
  avgDocLength: number,
  idfMap: Map<string, number>
): number => {
  const docTokens = tokenize(chunk.content);
  const docLength = docTokens.length;
  const termFrequency = new Map<string, number>();

  for (const token of docTokens) {
    termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
  }

  let score = 0;
  for (const queryToken of queryTokens) {
    const tf = termFrequency.get(queryToken) || 0;
    const idf = idfMap.get(queryToken) || 0;
    
    const numerator = tf * (BM25_K1 + 1);
    const denominator = tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLength / avgDocLength));
    
    score += idf * (numerator / denominator);
  }

  return score;
};

// Calculate TF-IDF score
const calculateTFIDF = (
  chunk: DocumentChunk,
  queryTokens: string[],
  idfMap: Map<string, number>
): number => {
  const docTokens = tokenize(chunk.content);
  const termFrequency = new Map<string, number>();

  for (const token of docTokens) {
    termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
  }

  let score = 0;
  for (const queryToken of queryTokens) {
    const tf = (termFrequency.get(queryToken) || 0) / docTokens.length;
    const idf = idfMap.get(queryToken) || 0;
    score += tf * idf;
  }

  return score;
};

// Get context lines around a chunk
const getContext = (
  doc: DocumentIndex,
  chunk: DocumentChunk,
  contextLines: number
): { before: string; after: string } => {
  const allContent = doc.chunks.map(c => c.content).join('\n');
  const lines = allContent.split('\n');
  
  const startLine = Math.max(0, chunk.startLine - contextLines - 1);
  const endLine = Math.min(lines.length, chunk.endLine + contextLines);

  return {
    before: lines.slice(startLine, chunk.startLine - 1).join('\n'),
    after: lines.slice(chunk.endLine, endLine).join('\n'),
  };
};

// Main retrieval function
export const retrieve = (
  masterIndex: MasterIndex,
  query: RAGQuery
): RAGResult => {
  const startTime = performance.now();
  const options = { ...DEFAULT_RAG_OPTIONS, ...query.options };
  const filters = query.filters || {};
  
  const queryTokens = tokenize(query.query);
  const scoredChunks: ScoredChunk[] = [];
  
  // Build IDF map from query tokens
  const idfMap = new Map<string, number>();
  const totalDocs = masterIndex.documents.size;
  
  for (const token of queryTokens) {
    const globalKeyword = masterIndex.globalKeywords.get(token);
    if (globalKeyword) {
      idfMap.set(token, globalKeyword.idf);
    } else {
      // Default IDF for unknown terms
      idfMap.set(token, Math.log(totalDocs + 1));
    }
  }

  // Calculate average document length
  let totalLength = 0;
  let chunkCount = 0;
  for (const doc of masterIndex.documents.values()) {
    for (const chunk of doc.chunks) {
      totalLength += chunk.tokenCount;
      chunkCount++;
    }
  }
  const avgDocLength = chunkCount > 0 ? totalLength / chunkCount : 100;

  // Score all chunks
  for (const doc of masterIndex.documents.values()) {
    // Apply document-level filters
    if (filters.documentTypes && !filters.documentTypes.includes(doc.documentType)) {
      continue;
    }
    if (filters.documentPaths) {
      const matches = filters.documentPaths.some(p => doc.documentPath.includes(p));
      if (!matches) continue;
    }

    for (const chunk of doc.chunks) {
      // Apply chunk-level filters
      if (filters.chunkTypes && !filters.chunkTypes.includes(chunk.chunkType)) {
        continue;
      }
      if (filters.tags) {
        const hasTag = filters.tags.some(t => chunk.metadata.tags.includes(t));
        if (!hasTag) continue;
      }

      // Calculate score
      let score = 0;
      if (options.scoringMethod === 'bm25') {
        score = calculateBM25(chunk, queryTokens, avgDocLength, idfMap);
      } else {
        score = calculateTFIDF(chunk, queryTokens, idfMap);
      }

      // Boost for exact matches
      const lowerContent = chunk.content.toLowerCase();
      const lowerQuery = query.query.toLowerCase();
      if (lowerContent.includes(lowerQuery)) {
        score *= 2;
      }

      // Boost for symbol matches
      if (chunk.metadata.functionName && queryTokens.includes(chunk.metadata.functionName.toLowerCase())) {
        score *= 1.5;
      }
      if (chunk.metadata.componentName && queryTokens.includes(chunk.metadata.componentName.toLowerCase())) {
        score *= 1.5;
      }

      // Boost for exported symbols
      if (chunk.metadata.tags.includes('exported')) {
        score *= 1.2;
      }

      if (score > 0 && (!filters.minRelevance || score >= filters.minRelevance)) {
        const matchedKeywords = queryTokens.filter(t => lowerContent.includes(t));
        
        scoredChunks.push({
          chunk,
          documentPath: doc.documentPath,
          documentName: doc.documentName,
          score,
          matchedKeywords,
          context: options.includeContext 
            ? getContext(doc, chunk, options.contextLines || 3)
            : undefined,
        });
      }
    }
  }

  // Sort by score
  scoredChunks.sort((a, b) => b.score - a.score);

  // Limit results
  const limited = scoredChunks.slice(0, options.maxResults);

  // Get unique documents
  const relevantDocuments = [...new Set(limited.map(c => c.documentPath))];

  return {
    chunks: limited,
    totalResults: scoredChunks.length,
    queryTime: performance.now() - startTime,
    relevantDocuments,
  };
};

// Semantic search by symbol name
export const searchSymbols = (
  masterIndex: MasterIndex,
  symbolName: string,
  type?: string
): ScoredChunk[] => {
  const results: ScoredChunk[] = [];
  const lowerName = symbolName.toLowerCase();

  for (const doc of masterIndex.documents.values()) {
    for (const symbol of doc.symbols) {
      if (symbol.name.toLowerCase().includes(lowerName)) {
        if (type && symbol.type !== type) continue;
        
        const chunk = doc.chunks.find(c => c.id === symbol.chunkId);
        if (chunk) {
          results.push({
            chunk,
            documentPath: doc.documentPath,
            documentName: doc.documentName,
            score: symbol.name.toLowerCase() === lowerName ? 1 : 0.5,
            matchedKeywords: [symbol.name],
          });
        }
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
};

// Search by tag
export const searchByTag = (
  masterIndex: MasterIndex,
  tags: string[]
): ScoredChunk[] => {
  const results: ScoredChunk[] = [];
  const tagSet = new Set(tags.map(t => t.toLowerCase()));

  for (const doc of masterIndex.documents.values()) {
    for (const chunk of doc.chunks) {
      const matchingTags = chunk.metadata.tags.filter(t => tagSet.has(t.toLowerCase()));
      if (matchingTags.length > 0) {
        results.push({
          chunk,
          documentPath: doc.documentPath,
          documentName: doc.documentName,
          score: matchingTags.length / tags.length,
          matchedKeywords: matchingTags,
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
};

// Find related chunks (by shared keywords/references)
export const findRelated = (
  masterIndex: MasterIndex,
  chunkId: string,
  maxResults: number = 5
): ScoredChunk[] => {
  let sourceChunk: DocumentChunk | null = null;
  let sourceDoc: DocumentIndex | null = null;

  // Find the source chunk
  for (const doc of masterIndex.documents.values()) {
    const chunk = doc.chunks.find(c => c.id === chunkId);
    if (chunk) {
      sourceChunk = chunk;
      sourceDoc = doc;
      break;
    }
  }

  if (!sourceChunk || !sourceDoc) return [];

  const sourceKeywords = new Set(sourceChunk.metadata.keywords.map(k => k.toLowerCase()));
  const results: ScoredChunk[] = [];

  for (const doc of masterIndex.documents.values()) {
    for (const chunk of doc.chunks) {
      if (chunk.id === chunkId) continue;

      const sharedKeywords = chunk.metadata.keywords.filter(k => 
        sourceKeywords.has(k.toLowerCase())
      );

      if (sharedKeywords.length > 0) {
        results.push({
          chunk,
          documentPath: doc.documentPath,
          documentName: doc.documentName,
          score: sharedKeywords.length / sourceKeywords.size,
          matchedKeywords: sharedKeywords,
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
};

// Get chunks for AI context building
export const getContextForAI = (
  masterIndex: MasterIndex,
  query: string,
  maxTokens: number = 4000
): string => {
  const result = retrieve(masterIndex, {
    query,
    options: {
      maxResults: 20,
      includeContext: true,
      contextLines: 2,
    },
  });

  let context = '';
  let tokenCount = 0;

  for (const scored of result.chunks) {
    const chunkText = `\n---\n**${scored.documentPath}** (${scored.chunk.chunkType}):\n${scored.chunk.content}\n`;
    const chunkTokens = Math.ceil(chunkText.length / 4);

    if (tokenCount + chunkTokens > maxTokens) break;

    context += chunkText;
    tokenCount += chunkTokens;
  }

  return context;
};

// Export retriever class
export class RAGRetriever {
  private masterIndex: MasterIndex;

  constructor(masterIndex: MasterIndex) {
    this.masterIndex = masterIndex;
  }

  search(query: string, options?: RAGOptions): RAGResult {
    return retrieve(this.masterIndex, { query, options });
  }

  searchWithFilters(query: string, filters: RAGFilters, options?: RAGOptions): RAGResult {
    return retrieve(this.masterIndex, { query, filters, options });
  }

  findSymbol(name: string, type?: string): ScoredChunk[] {
    return searchSymbols(this.masterIndex, name, type);
  }

  findByTags(tags: string[]): ScoredChunk[] {
    return searchByTag(this.masterIndex, tags);
  }

  findRelated(chunkId: string, maxResults?: number): ScoredChunk[] {
    return findRelated(this.masterIndex, chunkId, maxResults);
  }

  getAIContext(query: string, maxTokens?: number): string {
    return getContextForAI(this.masterIndex, query, maxTokens);
  }
}

export default RAGRetriever;
