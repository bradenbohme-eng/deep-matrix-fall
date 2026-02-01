// Document Indexing System Types
// Optimized for AI Agent RAG/Grep Retrieval

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  summary: string;
  startLine: number;
  endLine: number;
  startChar: number;
  endChar: number;
  tokenCount: number;
  chunkType: ChunkType;
  metadata: ChunkMetadata;
}

export type ChunkType = 
  | 'heading'
  | 'paragraph'
  | 'code_block'
  | 'list'
  | 'table'
  | 'definition'
  | 'function'
  | 'class'
  | 'interface'
  | 'import'
  | 'export'
  | 'comment'
  | 'jsx_component'
  | 'hook'
  | 'constant'
  | 'type_alias';

export interface ChunkMetadata {
  language?: string;
  heading?: string;
  headingLevel?: number;
  parentHeading?: string;
  functionName?: string;
  className?: string;
  componentName?: string;
  exportedNames?: string[];
  importedModules?: string[];
  tags: string[];
  keywords: string[];
  complexity?: number;
  isAsync?: boolean;
  hasJSX?: boolean;
}

export interface DocumentIndex {
  id: string;
  documentPath: string;
  documentName: string;
  documentType: DocumentType;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  hash: string;
  
  // Hierarchical structure
  outline: OutlineNode[];
  chunks: DocumentChunk[];
  
  // Search optimization
  keywords: KeywordEntry[];
  symbols: SymbolEntry[];
  references: ReferenceEntry[];
  
  // AI-optimized summaries
  masterSummary: string;
  sectionSummaries: SectionSummary[];
  
  // Metrics
  stats: DocumentStats;
}

export type DocumentType = 
  | 'typescript'
  | 'javascript'
  | 'markdown'
  | 'json'
  | 'yaml'
  | 'css'
  | 'html'
  | 'python'
  | 'other';

export interface OutlineNode {
  id: string;
  title: string;
  level: number;
  type: 'heading' | 'function' | 'class' | 'component' | 'section';
  startLine: number;
  endLine: number;
  children: OutlineNode[];
  chunkIds: string[];
}

export interface KeywordEntry {
  keyword: string;
  frequency: number;
  chunkIds: string[];
  importance: number; // 0-1
  category: 'identifier' | 'type' | 'import' | 'export' | 'tag' | 'term';
}

export interface SymbolEntry {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'variable' | 'component' | 'hook';
  location: { line: number; column: number };
  chunkId: string;
  signature?: string;
  exported: boolean;
  async?: boolean;
}

export interface ReferenceEntry {
  fromChunkId: string;
  toSymbol: string;
  type: 'import' | 'call' | 'extends' | 'implements' | 'uses';
}

export interface SectionSummary {
  sectionId: string;
  title: string;
  summary: string;
  keywords: string[];
  startLine: number;
  endLine: number;
}

export interface DocumentStats {
  totalLines: number;
  totalCharacters: number;
  totalTokens: number;
  totalChunks: number;
  totalSymbols: number;
  totalKeywords: number;
  complexity: number;
  codeToCommentRatio: number;
}

// Master Index for entire codebase
export interface MasterIndex {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  
  // All document indexes
  documents: Map<string, DocumentIndex>;
  
  // Global search structures
  globalKeywords: Map<string, GlobalKeywordEntry>;
  globalSymbols: Map<string, GlobalSymbolEntry>;
  
  // Cross-document references
  dependencyGraph: DependencyNode[];
  
  // AI-optimized access
  tagHierarchy: TagNode[];
  topicClusters: TopicCluster[];
  
  // Quick access
  filesByType: Map<DocumentType, string[]>;
  componentRegistry: ComponentEntry[];
  hookRegistry: HookEntry[];
  exportRegistry: ExportEntry[];
  
  // Stats
  stats: MasterStats;
}

export interface GlobalKeywordEntry {
  keyword: string;
  totalFrequency: number;
  documentFrequency: number;
  occurrences: Array<{
    documentId: string;
    chunkId: string;
    frequency: number;
  }>;
  idf: number; // Inverse Document Frequency
}

export interface GlobalSymbolEntry {
  name: string;
  type: SymbolEntry['type'];
  definedIn: string; // documentId
  definitionChunkId: string;
  usedIn: Array<{
    documentId: string;
    chunkIds: string[];
  }>;
  signature?: string;
  exported: boolean;
}

export interface DependencyNode {
  documentId: string;
  imports: string[];
  exports: string[];
  dependsOn: string[];
  dependedOnBy: string[];
}

export interface TagNode {
  tag: string;
  count: number;
  children: TagNode[];
  documentIds: string[];
}

export interface TopicCluster {
  id: string;
  topic: string;
  keywords: string[];
  documentIds: string[];
  coherenceScore: number;
}

export interface ComponentEntry {
  name: string;
  documentId: string;
  chunkId: string;
  props?: string[];
  hooks?: string[];
}

export interface HookEntry {
  name: string;
  documentId: string;
  chunkId: string;
  dependencies?: string[];
  returns?: string;
}

export interface ExportEntry {
  name: string;
  documentId: string;
  type: 'default' | 'named';
  symbolType: SymbolEntry['type'];
}

export interface MasterStats {
  totalDocuments: number;
  totalChunks: number;
  totalLines: number;
  totalTokens: number;
  totalSymbols: number;
  totalKeywords: number;
  averageComplexity: number;
  documentsByType: Record<DocumentType, number>;
}

// RAG Query Types
export interface RAGQuery {
  query: string;
  filters?: RAGFilters;
  options?: RAGOptions;
}

export interface RAGFilters {
  documentTypes?: DocumentType[];
  documentPaths?: string[];
  tags?: string[];
  symbols?: string[];
  chunkTypes?: ChunkType[];
  minRelevance?: number;
}

export interface RAGOptions {
  maxResults?: number;
  includeContext?: boolean;
  contextLines?: number;
  groupByDocument?: boolean;
  scoringMethod?: 'bm25' | 'tfidf' | 'semantic';
}

export interface RAGResult {
  chunks: ScoredChunk[];
  totalResults: number;
  queryTime: number;
  relevantDocuments: string[];
}

export interface ScoredChunk {
  chunk: DocumentChunk;
  documentPath: string;
  documentName: string;
  score: number;
  matchedKeywords: string[];
  context?: {
    before: string;
    after: string;
  };
}

// Indexing Options
export interface IndexingOptions {
  chunkSize: number;
  chunkOverlap: number;
  extractSymbols: boolean;
  extractKeywords: boolean;
  generateSummaries: boolean;
  buildDependencyGraph: boolean;
  computeComplexity: boolean;
  minChunkSize: number;
  maxChunkSize: number;
}

export const DEFAULT_INDEXING_OPTIONS: IndexingOptions = {
  chunkSize: 500, // tokens
  chunkOverlap: 50, // tokens
  extractSymbols: true,
  extractKeywords: true,
  generateSummaries: true,
  buildDependencyGraph: true,
  computeComplexity: true,
  minChunkSize: 50,
  maxChunkSize: 2000,
};
