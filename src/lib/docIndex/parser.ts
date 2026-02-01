// Document Parser - Intelligent content extraction and chunking
// Optimized for code and documentation

import {
  DocumentChunk, ChunkType, ChunkMetadata, OutlineNode,
  SymbolEntry, KeywordEntry, DocumentType, IndexingOptions,
  DEFAULT_INDEXING_OPTIONS
} from './types';

// Generate unique ID
const generateId = (): string => 
  `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

// Estimate token count (rough approximation)
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

// Detect document type from extension
export const detectDocumentType = (filename: string): DocumentType => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const typeMap: Record<string, DocumentType> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript',
    md: 'markdown', mdx: 'markdown',
    json: 'json', jsonc: 'json',
    yaml: 'yaml', yml: 'yaml',
    css: 'css', scss: 'css', less: 'css',
    html: 'html', htm: 'html',
    py: 'python',
  };
  return typeMap[ext] || 'other';
};

// Extract keywords from content
export const extractKeywords = (
  content: string,
  docType: DocumentType
): KeywordEntry[] => {
  const keywords: Map<string, KeywordEntry> = new Map();
  
  // Common stop words to filter
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when',
    'why', 'how', 'if', 'then', 'else', 'true', 'false', 'null', 'undefined',
    'return', 'const', 'let', 'var', 'function', 'class', 'import', 'export',
    'default', 'from', 'async', 'await', 'new', 'typeof', 'instanceof',
  ]);

  // Extract identifiers (camelCase, PascalCase, snake_case)
  const identifierRegex = /\b([A-Z][a-zA-Z0-9]*|[a-z][a-zA-Z0-9]*(?:_[a-z][a-zA-Z0-9]*)*)\b/g;
  let match;
  while ((match = identifierRegex.exec(content)) !== null) {
    const word = match[1];
    if (word.length < 2 || word.length > 50 || stopWords.has(word.toLowerCase())) continue;
    
    const existing = keywords.get(word.toLowerCase());
    if (existing) {
      existing.frequency++;
    } else {
      keywords.set(word.toLowerCase(), {
        keyword: word,
        frequency: 1,
        chunkIds: [],
        importance: 0,
        category: word[0] === word[0].toUpperCase() ? 'type' : 'identifier',
      });
    }
  }

  // Extract imports/exports for code
  if (docType === 'typescript' || docType === 'javascript') {
    const importRegex = /import\s+(?:\{[^}]+\}|[^;]+)\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(content)) !== null) {
      const module = match[1].split('/').pop() || match[1];
      const existing = keywords.get(`import:${module}`);
      if (existing) {
        existing.frequency++;
      } else {
        keywords.set(`import:${module}`, {
          keyword: module,
          frequency: 1,
          chunkIds: [],
          importance: 0.8,
          category: 'import',
        });
      }
    }
  }

  // Calculate importance based on frequency and position
  const maxFreq = Math.max(...Array.from(keywords.values()).map(k => k.frequency));
  for (const entry of keywords.values()) {
    entry.importance = Math.min(1, (entry.frequency / maxFreq) * 0.5 + 
      (entry.category === 'type' ? 0.3 : 0) +
      (entry.category === 'import' ? 0.2 : 0));
  }

  return Array.from(keywords.values())
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 200);
};

// Extract symbols from TypeScript/JavaScript
export const extractSymbols = (
  content: string,
  docType: DocumentType
): SymbolEntry[] => {
  const symbols: SymbolEntry[] = [];
  if (docType !== 'typescript' && docType !== 'javascript') return symbols;

  const lines = content.split('\n');
  
  // Function declarations
  const funcRegex = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
  const arrowRegex = /^(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/;
  const classRegex = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/;
  const interfaceRegex = /^(?:export\s+)?interface\s+(\w+)/;
  const typeRegex = /^(?:export\s+)?type\s+(\w+)\s*=/;
  const constRegex = /^(?:export\s+)?const\s+(\w+)\s*(?::\s*[^=]+)?\s*=/;
  const componentRegex = /^(?:export\s+)?(?:const|function)\s+([A-Z]\w+).*?(?:React\.FC|JSX\.Element|\(\s*\{|\(\s*props)/;
  const hookRegex = /^(?:export\s+)?(?:const|function)\s+(use[A-Z]\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const exported = line.startsWith('export');
    const isAsync = line.includes('async');

    let match;

    // React hooks
    if ((match = hookRegex.exec(line))) {
      symbols.push({
        name: match[1],
        type: 'hook',
        location: { line: i + 1, column: 0 },
        chunkId: '',
        exported,
        async: isAsync,
      });
      continue;
    }

    // React components
    if ((match = componentRegex.exec(line))) {
      symbols.push({
        name: match[1],
        type: 'component',
        location: { line: i + 1, column: 0 },
        chunkId: '',
        exported,
      });
      continue;
    }

    // Functions
    if ((match = funcRegex.exec(line)) || (match = arrowRegex.exec(line))) {
      symbols.push({
        name: match[1],
        type: 'function',
        location: { line: i + 1, column: 0 },
        chunkId: '',
        exported,
        async: isAsync,
      });
      continue;
    }

    // Classes
    if ((match = classRegex.exec(line))) {
      symbols.push({
        name: match[1],
        type: 'class',
        location: { line: i + 1, column: 0 },
        chunkId: '',
        exported,
      });
      continue;
    }

    // Interfaces
    if ((match = interfaceRegex.exec(line))) {
      symbols.push({
        name: match[1],
        type: 'interface',
        location: { line: i + 1, column: 0 },
        chunkId: '',
        exported,
      });
      continue;
    }

    // Type aliases
    if ((match = typeRegex.exec(line))) {
      symbols.push({
        name: match[1],
        type: 'type',
        location: { line: i + 1, column: 0 },
        chunkId: '',
        exported,
      });
      continue;
    }

    // Constants (only exported or uppercase)
    if ((match = constRegex.exec(line))) {
      const name = match[1];
      if (exported || name === name.toUpperCase()) {
        symbols.push({
          name,
          type: 'const',
          location: { line: i + 1, column: 0 },
          chunkId: '',
          exported,
        });
      }
    }
  }

  return symbols;
};

// Extract outline from document
export const extractOutline = (
  content: string,
  docType: DocumentType
): OutlineNode[] => {
  const outline: OutlineNode[] = [];
  const lines = content.split('\n');

  if (docType === 'markdown') {
    const stack: OutlineNode[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const node: OutlineNode = {
          id: generateId(),
          title: match[2],
          level,
          type: 'heading',
          startLine: i + 1,
          endLine: i + 1,
          children: [],
          chunkIds: [],
        };

        // Find parent
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        } else {
          outline.push(node);
        }
        stack.push(node);
      }
    }
  } else if (docType === 'typescript' || docType === 'javascript') {
    // Extract functions, classes, components as outline
    const symbols = extractSymbols(content, docType);
    for (const sym of symbols) {
      outline.push({
        id: generateId(),
        title: sym.name,
        level: sym.type === 'class' ? 1 : 2,
        type: sym.type === 'component' ? 'component' : 
              sym.type === 'class' ? 'class' : 'function',
        startLine: sym.location.line,
        endLine: sym.location.line,
        children: [],
        chunkIds: [],
      });
    }
  }

  return outline;
};

// Smart chunking based on document structure
export const chunkDocument = (
  content: string,
  docType: DocumentType,
  options: IndexingOptions = DEFAULT_INDEXING_OPTIONS
): DocumentChunk[] => {
  const chunks: DocumentChunk[] = [];
  const lines = content.split('\n');
  
  if (docType === 'typescript' || docType === 'javascript') {
    // Code-aware chunking
    chunks.push(...chunkCode(content, lines, docType, options));
  } else if (docType === 'markdown') {
    // Markdown section-based chunking
    chunks.push(...chunkMarkdown(content, lines, options));
  } else {
    // Generic line-based chunking
    chunks.push(...chunkGeneric(content, lines, docType, options));
  }

  return chunks;
};

// Chunk code files intelligently
const chunkCode = (
  content: string,
  lines: string[],
  docType: DocumentType,
  options: IndexingOptions
): DocumentChunk[] => {
  const chunks: DocumentChunk[] = [];
  let currentChunk: string[] = [];
  let currentStartLine = 0;
  let currentType: ChunkType = 'code_block';
  let currentMeta: Partial<ChunkMetadata> = {};
  let braceDepth = 0;
  let inBlockComment = false;

  const flushChunk = (endLine: number) => {
    if (currentChunk.length === 0) return;
    
    const chunkContent = currentChunk.join('\n');
    const tokens = estimateTokens(chunkContent);
    
    if (tokens >= options.minChunkSize) {
      const keywords = extractKeywords(chunkContent, docType);
      chunks.push({
        id: generateId(),
        documentId: '',
        content: chunkContent,
        summary: generateChunkSummary(chunkContent, currentType),
        startLine: currentStartLine + 1,
        endLine,
        startChar: 0,
        endChar: 0,
        tokenCount: tokens,
        chunkType: currentType,
        metadata: {
          language: docType,
          tags: currentMeta.tags || [],
          keywords: keywords.slice(0, 10).map(k => k.keyword),
          ...currentMeta,
        },
      });
    }
    
    currentChunk = [];
    currentMeta = {};
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track block comments
    if (trimmed.startsWith('/*')) inBlockComment = true;
    if (trimmed.endsWith('*/')) {
      inBlockComment = false;
      continue;
    }
    if (inBlockComment) continue;

    // Detect chunk boundaries
    const isImport = /^import\s+/.test(trimmed);
    const isExport = /^export\s+/.test(trimmed);
    const isFunction = /^(?:export\s+)?(?:async\s+)?function\s+\w+/.test(trimmed);
    const isArrowFunc = /^(?:export\s+)?(?:const|let)\s+\w+\s*=\s*(?:async\s+)?\(/.test(trimmed);
    const isClass = /^(?:export\s+)?(?:abstract\s+)?class\s+\w+/.test(trimmed);
    const isInterface = /^(?:export\s+)?interface\s+\w+/.test(trimmed);
    const isType = /^(?:export\s+)?type\s+\w+/.test(trimmed);
    const isComponent = /^(?:export\s+)?(?:const|function)\s+[A-Z]\w+/.test(trimmed);
    const isHook = /^(?:export\s+)?(?:const|function)\s+use[A-Z]\w+/.test(trimmed);
    const isConst = /^(?:export\s+)?const\s+[A-Z_]+\s*=/.test(trimmed);

    // Count braces
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;

    // Start new chunk for significant declarations
    if (braceDepth === 0 && (isFunction || isArrowFunc || isClass || isInterface || isType || isComponent || isHook)) {
      flushChunk(i);
      currentStartLine = i;
      
      // Determine type
      if (isHook) {
        currentType = 'hook';
        currentMeta.functionName = trimmed.match(/(?:const|function)\s+(use\w+)/)?.[1];
      } else if (isComponent) {
        currentType = 'jsx_component';
        currentMeta.componentName = trimmed.match(/(?:const|function)\s+([A-Z]\w+)/)?.[1];
        currentMeta.hasJSX = true;
      } else if (isClass) {
        currentType = 'class';
        currentMeta.className = trimmed.match(/class\s+(\w+)/)?.[1];
      } else if (isInterface) {
        currentType = 'interface';
      } else if (isType) {
        currentType = 'type_alias';
      } else if (isFunction || isArrowFunc) {
        currentType = 'function';
        currentMeta.functionName = trimmed.match(/(?:function|const|let)\s+(\w+)/)?.[1];
        currentMeta.isAsync = /async/.test(trimmed);
      }
      
      currentMeta.tags = [currentType];
      if (isExport) currentMeta.tags.push('exported');
    }

    // Handle imports as separate chunk
    if (isImport && braceDepth === 0) {
      if (currentType !== 'import') {
        flushChunk(i);
        currentStartLine = i;
        currentType = 'import';
        currentMeta.tags = ['import'];
      }
    }

    // Handle constants
    if (isConst && braceDepth === 0) {
      flushChunk(i);
      currentStartLine = i;
      currentType = 'constant';
      currentMeta.tags = ['constant'];
    }

    currentChunk.push(line);
    braceDepth += openBraces - closeBraces;

    // Flush at end of block
    if (braceDepth === 0 && currentChunk.length > 0 && 
        (closeBraces > 0 || trimmed.endsWith(';'))) {
      const tokens = estimateTokens(currentChunk.join('\n'));
      if (tokens >= options.minChunkSize) {
        flushChunk(i + 1);
      }
    }

    // Force flush if chunk too large
    if (estimateTokens(currentChunk.join('\n')) > options.maxChunkSize) {
      flushChunk(i + 1);
      currentStartLine = i + 1;
    }
  }

  // Flush remaining
  flushChunk(lines.length);

  return chunks;
};

// Chunk markdown by sections
const chunkMarkdown = (
  content: string,
  lines: string[],
  options: IndexingOptions
): DocumentChunk[] => {
  const chunks: DocumentChunk[] = [];
  let currentChunk: string[] = [];
  let currentStartLine = 0;
  let currentHeading = '';
  let headingLevel = 0;

  const flushChunk = (endLine: number) => {
    if (currentChunk.length === 0) return;
    
    const chunkContent = currentChunk.join('\n');
    const tokens = estimateTokens(chunkContent);
    
    if (tokens >= options.minChunkSize) {
      chunks.push({
        id: generateId(),
        documentId: '',
        content: chunkContent,
        summary: currentHeading || chunkContent.substring(0, 100),
        startLine: currentStartLine + 1,
        endLine,
        startChar: 0,
        endChar: 0,
        tokenCount: tokens,
        chunkType: 'heading',
        metadata: {
          heading: currentHeading,
          headingLevel,
          tags: ['markdown', `h${headingLevel}`],
          keywords: [],
        },
      });
    }
    
    currentChunk = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // New section
      flushChunk(i);
      currentStartLine = i;
      currentHeading = headingMatch[2];
      headingLevel = headingMatch[1].length;
    }

    currentChunk.push(line);

    // Force flush if chunk too large
    if (estimateTokens(currentChunk.join('\n')) > options.maxChunkSize) {
      flushChunk(i + 1);
      currentStartLine = i + 1;
      currentHeading = `${currentHeading} (continued)`;
    }
  }

  flushChunk(lines.length);
  return chunks;
};

// Generic chunking for other file types
const chunkGeneric = (
  content: string,
  lines: string[],
  docType: DocumentType,
  options: IndexingOptions
): DocumentChunk[] => {
  const chunks: DocumentChunk[] = [];
  const targetTokens = options.chunkSize;
  let currentChunk: string[] = [];
  let currentStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    currentChunk.push(lines[i]);
    
    const tokens = estimateTokens(currentChunk.join('\n'));
    if (tokens >= targetTokens) {
      chunks.push({
        id: generateId(),
        documentId: '',
        content: currentChunk.join('\n'),
        summary: currentChunk[0]?.substring(0, 100) || '',
        startLine: currentStartLine + 1,
        endLine: i + 1,
        startChar: 0,
        endChar: 0,
        tokenCount: tokens,
        chunkType: 'paragraph',
        metadata: {
          language: docType,
          tags: [docType],
          keywords: [],
        },
      });
      
      currentChunk = [];
      currentStartLine = i + 1;
    }
  }

  // Remaining content
  if (currentChunk.length > 0) {
    const tokens = estimateTokens(currentChunk.join('\n'));
    if (tokens >= options.minChunkSize) {
      chunks.push({
        id: generateId(),
        documentId: '',
        content: currentChunk.join('\n'),
        summary: currentChunk[0]?.substring(0, 100) || '',
        startLine: currentStartLine + 1,
        endLine: lines.length,
        startChar: 0,
        endChar: 0,
        tokenCount: tokens,
        chunkType: 'paragraph',
        metadata: {
          language: docType,
          tags: [docType],
          keywords: [],
        },
      });
    }
  }

  return chunks;
};

// Generate summary for a chunk
const generateChunkSummary = (content: string, type: ChunkType): string => {
  const lines = content.split('\n').filter(l => l.trim());
  
  switch (type) {
    case 'function':
    case 'hook':
      return lines[0]?.replace(/\{$/, '').trim() || '';
    case 'class':
    case 'interface':
    case 'type_alias':
      return lines[0]?.trim() || '';
    case 'jsx_component':
      return `React Component: ${lines[0]?.match(/(?:const|function)\s+(\w+)/)?.[1] || 'Unknown'}`;
    case 'import':
      return `Imports: ${lines.length} statements`;
    case 'constant':
      return lines[0]?.trim() || '';
    default:
      return lines[0]?.substring(0, 100) || '';
  }
};
