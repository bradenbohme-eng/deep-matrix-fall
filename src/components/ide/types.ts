// Production IDE Type Definitions

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
  language?: string;
  modified?: boolean;
  lastModified?: Date;
  size?: number;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: Date;
  branch: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  lastCommit?: string;
  remote?: boolean;
}

export interface Clipboard {
  type: 'cut' | 'copy';
  nodes: FileNode[];
}

export interface SearchResult {
  file: FileNode;
  line: number;
  column: number;
  match: string;
  context: string;
}

export interface Terminal {
  id: string;
  name: string;
  history: TerminalLine[];
  cwd: string;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  content: string;
  timestamp: Date;
}

export interface AgentTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  output?: string;
  error?: string;
}

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  modified: boolean;
  cursorPosition?: { line: number; column: number };
}

export interface IDEState {
  files: FileNode[];
  openTabs: EditorTab[];
  activeTabId: string | null;
  terminals: Terminal[];
  activeTerminalId: string | null;
  git: GitStatus;
  clipboard: Clipboard | null;
  searchResults: SearchResult[];
  agentTasks: AgentTask[];
}

export const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    json: 'json',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    html: 'html',
    yaml: 'yaml',
    yml: 'yaml',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    toml: 'toml',
    xml: 'xml',
    svg: 'xml',
  };
  return langMap[ext || ''] || 'plaintext';
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
