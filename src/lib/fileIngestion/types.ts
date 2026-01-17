// File Ingestion System Types
// Production-grade file/folder/zip ingestion for IDE

export interface IngestionFile {
  path: string;
  name: string;
  content: string;
  size: number;
  type: 'file' | 'folder';
  mimeType?: string;
  lastModified?: Date;
}

export interface IngestionProgress {
  phase: 'reading' | 'extracting' | 'processing' | 'indexing' | 'complete' | 'error';
  current: number;
  total: number;
  currentFile?: string;
  bytesProcessed: number;
  totalBytes: number;
  filesProcessed: number;
  totalFiles: number;
  errors: IngestionError[];
}

export interface IngestionError {
  file: string;
  error: string;
  recoverable: boolean;
}

export interface IngestionResult {
  success: boolean;
  files: IngestionFile[];
  stats: {
    totalFiles: number;
    totalFolders: number;
    totalBytes: number;
    processingTime: number;
    skippedFiles: number;
  };
  errors: IngestionError[];
  rootPath: string;
}

export interface IngestionOptions {
  maxFileSize: number; // bytes
  maxTotalSize: number; // bytes
  maxFiles: number;
  allowedExtensions?: string[];
  excludePatterns: string[];
  includeHidden: boolean;
  extractZip: boolean;
  preserveStructure: boolean;
  rootFolder?: string;
}

export const DEFAULT_INGESTION_OPTIONS: IngestionOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB per file
  maxTotalSize: 500 * 1024 * 1024, // 500MB total
  maxFiles: 5000,
  excludePatterns: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '.next/**',
    '__pycache__/**',
    '*.pyc',
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '*.lock',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.env.local',
    '.env.*.local',
  ],
  includeHidden: false,
  extractZip: true,
  preserveStructure: true,
};

// Binary file extensions that should be skipped
export const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'svg',
  'mp3', 'mp4', 'wav', 'avi', 'mov', 'webm', 'ogg',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'tar', 'gz', 'rar', '7z',
  'exe', 'dll', 'so', 'dylib',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'db', 'sqlite', 'sqlite3',
]);

// Text file extensions
export const TEXT_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'json', 'jsonc', 'json5',
  'md', 'mdx', 'markdown',
  'html', 'htm', 'xhtml',
  'css', 'scss', 'sass', 'less', 'styl',
  'xml', 'yaml', 'yml', 'toml',
  'py', 'pyw', 'pyi',
  'java', 'kt', 'kts', 'scala', 'groovy',
  'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx',
  'cs', 'fs', 'fsx',
  'go', 'rs', 'rb', 'php', 'pl', 'pm',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'sql', 'graphql', 'gql',
  'vue', 'svelte', 'astro',
  'dockerfile', 'makefile', 'rakefile',
  'env', 'env.example', 'env.sample',
  'gitignore', 'gitattributes', 'editorconfig',
  'eslintrc', 'prettierrc', 'babelrc',
  'txt', 'text', 'log', 'csv', 'tsv',
  'ini', 'cfg', 'conf', 'config',
  'lock', 'sum',
]);
