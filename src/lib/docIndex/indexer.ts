// Document Indexer - Builds and maintains the master index
// Optimized for AI Agent RAG retrieval

import {
  DocumentIndex, MasterIndex, DocumentChunk, KeywordEntry,
  SymbolEntry, ReferenceEntry, SectionSummary, DocumentStats,
  GlobalKeywordEntry, GlobalSymbolEntry, DependencyNode,
  TagNode, TopicCluster, ComponentEntry, HookEntry, ExportEntry,
  MasterStats, IndexingOptions, DEFAULT_INDEXING_OPTIONS, DocumentType
} from './types';
import {
  detectDocumentType, extractKeywords, extractSymbols,
  extractOutline, chunkDocument
} from './parser';

// Generate unique ID
const generateId = (): string => 
  `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

// Hash content for change detection
const hashContent = async (content: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
};

// Estimate tokens
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

// Index a single document
export const indexDocument = async (
  path: string,
  content: string,
  options: IndexingOptions = DEFAULT_INDEXING_OPTIONS
): Promise<DocumentIndex> => {
  const docType = detectDocumentType(path);
  const hash = await hashContent(content);
  const lines = content.split('\n');
  
  // Extract all structural elements
  const chunks = chunkDocument(content, docType, options);
  const outline = extractOutline(content, docType);
  const keywords = options.extractKeywords ? extractKeywords(content, docType) : [];
  const symbols = options.extractSymbols ? extractSymbols(content, docType) : [];
  
  // Map symbols to chunks
  for (const symbol of symbols) {
    const chunk = chunks.find(c => 
      symbol.location.line >= c.startLine && 
      symbol.location.line <= c.endLine
    );
    if (chunk) {
      symbol.chunkId = chunk.id;
    }
  }

  // Map keywords to chunks
  for (const keyword of keywords) {
    keyword.chunkIds = chunks
      .filter(c => c.content.toLowerCase().includes(keyword.keyword.toLowerCase()))
      .map(c => c.id);
  }

  // Extract references
  const references: ReferenceEntry[] = [];
  if (docType === 'typescript' || docType === 'javascript') {
    for (const chunk of chunks) {
      // Extract import references
      const importMatches = chunk.content.matchAll(/import\s+(?:\{([^}]+)\}|(\w+))\s+from/g);
      for (const match of importMatches) {
        const imported = match[1]?.split(',').map(s => s.trim()) || [match[2]];
        for (const name of imported) {
          if (name) {
            references.push({
              fromChunkId: chunk.id,
              toSymbol: name,
              type: 'import',
            });
          }
        }
      }
    }
  }

  // Generate section summaries
  const sectionSummaries: SectionSummary[] = chunks
    .filter(c => c.chunkType !== 'import')
    .slice(0, 20)
    .map(c => ({
      sectionId: c.id,
      title: c.summary,
      summary: c.summary,
      keywords: c.metadata.keywords,
      startLine: c.startLine,
      endLine: c.endLine,
    }));

  // Calculate stats
  const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
  const commentLines = lines.filter(l => l.trim().startsWith('//')).length;
  
  const stats: DocumentStats = {
    totalLines: lines.length,
    totalCharacters: content.length,
    totalTokens: estimateTokens(content),
    totalChunks: chunks.length,
    totalSymbols: symbols.length,
    totalKeywords: keywords.length,
    complexity: chunks.reduce((sum, c) => sum + (c.metadata.complexity || 1), 0),
    codeToCommentRatio: commentLines > 0 ? codeLines / commentLines : codeLines,
  };

  // Generate master summary
  const masterSummary = generateDocumentSummary(path, docType, symbols, chunks);

  const docId = generateId();
  
  // Assign document ID to chunks
  for (const chunk of chunks) {
    chunk.documentId = docId;
  }

  return {
    id: docId,
    documentPath: path,
    documentName: path.split('/').pop() || path,
    documentType: docType,
    language: docType,
    createdAt: new Date(),
    updatedAt: new Date(),
    hash,
    outline,
    chunks,
    keywords,
    symbols,
    references,
    masterSummary,
    sectionSummaries,
    stats,
  };
};

// Generate document summary
const generateDocumentSummary = (
  path: string,
  docType: DocumentType,
  symbols: SymbolEntry[],
  chunks: DocumentChunk[]
): string => {
  const name = path.split('/').pop() || path;
  const components = symbols.filter(s => s.type === 'component');
  const hooks = symbols.filter(s => s.type === 'hook');
  const functions = symbols.filter(s => s.type === 'function');
  const classes = symbols.filter(s => s.type === 'class');
  const exports = symbols.filter(s => s.exported);

  let summary = `${name} (${docType})`;

  if (components.length > 0) {
    summary += ` - React Components: ${components.map(c => c.name).join(', ')}`;
  }
  if (hooks.length > 0) {
    summary += ` - Hooks: ${hooks.map(h => h.name).join(', ')}`;
  }
  if (classes.length > 0) {
    summary += ` - Classes: ${classes.map(c => c.name).join(', ')}`;
  }
  if (functions.length > 0 && !components.length) {
    summary += ` - Functions: ${functions.slice(0, 5).map(f => f.name).join(', ')}`;
    if (functions.length > 5) summary += ` (+${functions.length - 5} more)`;
  }
  if (exports.length > 0) {
    summary += ` - Exports: ${exports.length}`;
  }

  return summary;
};

// Build master index from multiple documents
export const buildMasterIndex = async (
  documents: DocumentIndex[]
): Promise<MasterIndex> => {
  const globalKeywords = new Map<string, GlobalKeywordEntry>();
  const globalSymbols = new Map<string, GlobalSymbolEntry>();
  const dependencyGraph: DependencyNode[] = [];
  const filesByType = new Map<DocumentType, string[]>();
  const componentRegistry: ComponentEntry[] = [];
  const hookRegistry: HookEntry[] = [];
  const exportRegistry: ExportEntry[] = [];

  // Process each document
  for (const doc of documents) {
    // Build global keywords (TF-IDF)
    for (const keyword of doc.keywords) {
      const existing = globalKeywords.get(keyword.keyword.toLowerCase());
      if (existing) {
        existing.totalFrequency += keyword.frequency;
        existing.documentFrequency++;
        existing.occurrences.push({
          documentId: doc.id,
          chunkId: keyword.chunkIds[0] || '',
          frequency: keyword.frequency,
        });
      } else {
        globalKeywords.set(keyword.keyword.toLowerCase(), {
          keyword: keyword.keyword,
          totalFrequency: keyword.frequency,
          documentFrequency: 1,
          occurrences: [{
            documentId: doc.id,
            chunkId: keyword.chunkIds[0] || '',
            frequency: keyword.frequency,
          }],
          idf: 0,
        });
      }
    }

    // Build global symbols
    for (const symbol of doc.symbols) {
      if (symbol.exported) {
        globalSymbols.set(`${doc.id}:${symbol.name}`, {
          name: symbol.name,
          type: symbol.type,
          definedIn: doc.id,
          definitionChunkId: symbol.chunkId,
          usedIn: [],
          signature: symbol.signature,
          exported: true,
        });
      }
    }

    // Build dependency graph
    const imports: string[] = [];
    const exports: string[] = [];
    
    for (const ref of doc.references) {
      if (ref.type === 'import') {
        imports.push(ref.toSymbol);
      }
    }
    
    for (const symbol of doc.symbols.filter(s => s.exported)) {
      exports.push(symbol.name);
    }

    dependencyGraph.push({
      documentId: doc.id,
      imports,
      exports,
      dependsOn: [],
      dependedOnBy: [],
    });

    // Files by type
    const existing = filesByType.get(doc.documentType) || [];
    existing.push(doc.id);
    filesByType.set(doc.documentType, existing);

    // Component registry
    for (const symbol of doc.symbols.filter(s => s.type === 'component')) {
      componentRegistry.push({
        name: symbol.name,
        documentId: doc.id,
        chunkId: symbol.chunkId,
      });
    }

    // Hook registry
    for (const symbol of doc.symbols.filter(s => s.type === 'hook')) {
      hookRegistry.push({
        name: symbol.name,
        documentId: doc.id,
        chunkId: symbol.chunkId,
      });
    }

    // Export registry
    for (const symbol of doc.symbols.filter(s => s.exported)) {
      exportRegistry.push({
        name: symbol.name,
        documentId: doc.id,
        type: symbol.name === 'default' ? 'default' : 'named',
        symbolType: symbol.type,
      });
    }
  }

  // Calculate IDF for keywords
  const totalDocs = documents.length;
  for (const entry of globalKeywords.values()) {
    entry.idf = Math.log(totalDocs / (entry.documentFrequency + 1)) + 1;
  }

  // Build tag hierarchy
  const tagHierarchy = buildTagHierarchy(documents);

  // Build topic clusters (simple keyword-based clustering)
  const topicClusters = buildTopicClusters(documents, globalKeywords);

  // Calculate stats
  const stats: MasterStats = {
    totalDocuments: documents.length,
    totalChunks: documents.reduce((sum, d) => sum + d.chunks.length, 0),
    totalLines: documents.reduce((sum, d) => sum + d.stats.totalLines, 0),
    totalTokens: documents.reduce((sum, d) => sum + d.stats.totalTokens, 0),
    totalSymbols: documents.reduce((sum, d) => sum + d.symbols.length, 0),
    totalKeywords: globalKeywords.size,
    averageComplexity: documents.reduce((sum, d) => sum + d.stats.complexity, 0) / documents.length,
    documentsByType: Object.fromEntries(
      Array.from(filesByType.entries()).map(([type, ids]) => [type, ids.length])
    ) as Record<DocumentType, number>,
  };

  return {
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    documents: new Map(documents.map(d => [d.id, d])),
    globalKeywords,
    globalSymbols,
    dependencyGraph,
    tagHierarchy,
    topicClusters,
    filesByType,
    componentRegistry,
    hookRegistry,
    exportRegistry,
    stats,
  };
};

// Build tag hierarchy from documents
const buildTagHierarchy = (documents: DocumentIndex[]): TagNode[] => {
  const tagCounts = new Map<string, { count: number; docIds: string[] }>();

  for (const doc of documents) {
    const docTags = new Set<string>();
    
    for (const chunk of doc.chunks) {
      for (const tag of chunk.metadata.tags) {
        docTags.add(tag);
      }
    }

    for (const tag of docTags) {
      const existing = tagCounts.get(tag) || { count: 0, docIds: [] };
      existing.count++;
      existing.docIds.push(doc.id);
      tagCounts.set(tag, existing);
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      children: [],
      documentIds: data.docIds,
    }));
};

// Build topic clusters
const buildTopicClusters = (
  documents: DocumentIndex[],
  globalKeywords: Map<string, GlobalKeywordEntry>
): TopicCluster[] => {
  // Simple clustering by high-IDF keywords
  const clusters: TopicCluster[] = [];
  const topKeywords = Array.from(globalKeywords.values())
    .filter(k => k.documentFrequency >= 2 && k.documentFrequency <= documents.length / 2)
    .sort((a, b) => b.idf - a.idf)
    .slice(0, 20);

  for (const keyword of topKeywords) {
    clusters.push({
      id: generateId(),
      topic: keyword.keyword,
      keywords: [keyword.keyword],
      documentIds: keyword.occurrences.map(o => o.documentId),
      coherenceScore: keyword.idf,
    });
  }

  return clusters;
};

// Export indexer
export class DocumentIndexer {
  private masterIndex: MasterIndex | null = null;
  private documents: Map<string, DocumentIndex> = new Map();
  private options: IndexingOptions;

  constructor(options: Partial<IndexingOptions> = {}) {
    this.options = { ...DEFAULT_INDEXING_OPTIONS, ...options };
  }

  async indexFile(path: string, content: string): Promise<DocumentIndex> {
    const index = await indexDocument(path, content, this.options);
    this.documents.set(path, index);
    return index;
  }

  async indexFiles(files: Array<{ path: string; content: string }>): Promise<MasterIndex> {
    const indexes: DocumentIndex[] = [];
    
    for (const file of files) {
      const index = await this.indexFile(file.path, file.content);
      indexes.push(index);
    }

    this.masterIndex = await buildMasterIndex(indexes);
    return this.masterIndex;
  }

  getMasterIndex(): MasterIndex | null {
    return this.masterIndex;
  }

  getDocument(path: string): DocumentIndex | undefined {
    return this.documents.get(path);
  }

  getAllDocuments(): DocumentIndex[] {
    return Array.from(this.documents.values());
  }
}

export default DocumentIndexer;
