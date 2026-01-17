import { useState, useCallback } from 'react';
import { 
  FileNode, IDEState, EditorTab, Terminal, TerminalLine, 
  GitStatus, GitCommit, GitBranch, Clipboard, AgentTask,
  generateId, getLanguageFromPath 
} from './types';

const STORAGE_KEY = 'aimos-production-ide';

const defaultFiles: FileNode[] = [
  {
    id: 'root',
    name: 'workspace',
    type: 'folder',
    path: '/workspace',
    children: [
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        path: '/workspace/src',
        children: [
          {
            id: 'app',
            name: 'App.tsx',
            type: 'file',
            path: '/workspace/src/App.tsx',
            content: `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">Hello, AI-MOS!</h1>
    </div>
  );
}

export default App;`,
            language: 'typescript',
          },
          {
            id: 'index',
            name: 'index.tsx',
            type: 'file',
            path: '/workspace/src/index.tsx',
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
            language: 'typescript',
          },
          {
            id: 'components',
            name: 'components',
            type: 'folder',
            path: '/workspace/src/components',
            children: [],
          },
        ],
      },
      {
        id: 'package',
        name: 'package.json',
        type: 'file',
        path: '/workspace/package.json',
        content: `{
  "name": "aimos-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  }
}`,
        language: 'json',
      },
      {
        id: 'readme',
        name: 'README.md',
        type: 'file',
        path: '/workspace/README.md',
        content: `# AI-MOS Project

Built with the AI-MOS Production IDE.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Full file/folder management
- Git integration
- Live preview
- Agent tools
`,
        language: 'markdown',
      },
    ],
  },
];

const defaultGitStatus: GitStatus = {
  branch: 'main',
  ahead: 0,
  behind: 0,
  staged: [],
  unstaged: [],
  untracked: [],
};

export const useIDEStore = () => {
  const [files, setFiles] = useState<FileNode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.files || defaultFiles;
      } catch { }
    }
    return defaultFiles;
  });

  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [terminals, setTerminals] = useState<Terminal[]>([
    {
      id: 'main',
      name: 'Terminal 1',
      history: [
        { id: '1', type: 'system', content: 'AI-MOS Production IDE Terminal v1.0.0', timestamp: new Date() },
        { id: '2', type: 'system', content: 'Type "help" for available commands', timestamp: new Date() },
      ],
      cwd: '/workspace',
    },
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('main');
  const [gitStatus, setGitStatus] = useState<GitStatus>(defaultGitStatus);
  const [gitCommits, setGitCommits] = useState<GitCommit[]>([]);
  const [gitBranches, setGitBranches] = useState<GitBranch[]>([
    { name: 'main', current: true },
    { name: 'develop', current: false },
  ]);
  const [clipboard, setClipboard] = useState<Clipboard | null>(null);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);

  // Save state
  const saveState = useCallback(() => {
    const state = {
      files,
      openTabs,
      activeTabId,
      gitStatus,
      gitCommits,
      gitBranches,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [files, openTabs, activeTabId, gitStatus, gitCommits, gitBranches]);

  // File operations
  const findNode = useCallback((nodes: FileNode[], path: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findNode(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const findParentNode = useCallback((nodes: FileNode[], path: string): FileNode | null => {
    const parentPath = path.split('/').slice(0, -1).join('/');
    return findNode(nodes, parentPath);
  }, [findNode]);

  const updateNode = useCallback((nodes: FileNode[], path: string, updates: Partial<FileNode>): FileNode[] => {
    return nodes.map(node => {
      if (node.path === path) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: updateNode(node.children, path, updates) };
      }
      return node;
    });
  }, []);

  const createFile = useCallback((parentPath: string, name: string, type: 'file' | 'folder') => {
    const newPath = `${parentPath}/${name}`;
    const newNode: FileNode = {
      id: generateId(),
      name,
      type,
      path: newPath,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
      language: type === 'file' ? getLanguageFromPath(name) : undefined,
      modified: false,
      lastModified: new Date(),
    };

    setFiles(prev => {
      const addToParent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === parentPath && node.children) {
            return { ...node, children: [...node.children, newNode] };
          }
          if (node.children) {
            return { ...node, children: addToParent(node.children) };
          }
          return node;
        });
      };
      return addToParent(prev);
    });

    // Track as untracked
    setGitStatus(prev => ({
      ...prev,
      untracked: [...prev.untracked, newPath],
    }));

    return newNode;
  }, []);

  const deleteNode = useCallback((path: string) => {
    setFiles(prev => {
      const removeNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter(node => {
          if (node.path === path) return false;
          if (node.children) {
            node.children = removeNode(node.children);
          }
          return true;
        });
      };
      return removeNode(prev);
    });

    // Close any open tabs
    setOpenTabs(prev => prev.filter(tab => !tab.path.startsWith(path)));
  }, []);

  const renameNode = useCallback((oldPath: string, newName: string) => {
    const parentPath = oldPath.split('/').slice(0, -1).join('/');
    const newPath = `${parentPath}/${newName}`;

    setFiles(prev => {
      const rename = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === oldPath) {
            return { 
              ...node, 
              name: newName, 
              path: newPath,
              language: node.type === 'file' ? getLanguageFromPath(newName) : undefined,
            };
          }
          if (node.children) {
            return { ...node, children: rename(node.children) };
          }
          return node;
        });
      };
      return rename(prev);
    });

    // Update tabs
    setOpenTabs(prev => prev.map(tab => 
      tab.path === oldPath 
        ? { ...tab, path: newPath, name: newName, language: getLanguageFromPath(newName) }
        : tab
    ));
  }, []);

  const copyNodes = useCallback((paths: string[]) => {
    const nodes = paths.map(p => findNode(files, p)).filter(Boolean) as FileNode[];
    setClipboard({ type: 'copy', nodes });
  }, [files, findNode]);

  const cutNodes = useCallback((paths: string[]) => {
    const nodes = paths.map(p => findNode(files, p)).filter(Boolean) as FileNode[];
    setClipboard({ type: 'cut', nodes });
  }, [files, findNode]);

  const pasteNodes = useCallback((targetPath: string) => {
    if (!clipboard) return;

    const cloneNode = (node: FileNode, newParentPath: string): FileNode => {
      const newPath = `${newParentPath}/${node.name}`;
      return {
        ...node,
        id: generateId(),
        path: newPath,
        children: node.children?.map(child => cloneNode(child, newPath)),
      };
    };

    setFiles(prev => {
      const addToParent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === targetPath && node.children) {
            const newNodes = clipboard.nodes.map(n => cloneNode(n, targetPath));
            return { ...node, children: [...node.children, ...newNodes] };
          }
          if (node.children) {
            return { ...node, children: addToParent(node.children) };
          }
          return node;
        });
      };
      return addToParent(prev);
    });

    if (clipboard.type === 'cut') {
      clipboard.nodes.forEach(node => deleteNode(node.path));
      setClipboard(null);
    }
  }, [clipboard, deleteNode]);

  // Tab operations
  const openFile = useCallback((node: FileNode) => {
    if (node.type !== 'file') return;

    const existingTab = openTabs.find(tab => tab.path === node.path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTab: EditorTab = {
      id: generateId(),
      path: node.path,
      name: node.name,
      content: node.content || '',
      language: node.language || getLanguageFromPath(node.path),
      modified: false,
    };

    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [openTabs]);

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }
      return newTabs;
    });
  }, [activeTabId]);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, content, modified: true } : tab
    ));
  }, []);

  const saveTab = useCallback((tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;

    setFiles(prev => updateNode(prev, tab.path, { content: tab.content, lastModified: new Date() }));
    setOpenTabs(prev => prev.map(t => t.id === tabId ? { ...t, modified: false } : t));

    // Update git status
    setGitStatus(prev => ({
      ...prev,
      unstaged: prev.unstaged.includes(tab.path) ? prev.unstaged : [...prev.unstaged, tab.path],
    }));

    saveState();
  }, [openTabs, updateNode, saveState]);

  // Terminal operations
  const addTerminalLine = useCallback((terminalId: string, line: Omit<TerminalLine, 'id' | 'timestamp'>) => {
    setTerminals(prev => prev.map(t => 
      t.id === terminalId 
        ? { ...t, history: [...t.history, { ...line, id: generateId(), timestamp: new Date() }] }
        : t
    ));
  }, []);

  const createTerminal = useCallback(() => {
    const newTerminal: Terminal = {
      id: generateId(),
      name: `Terminal ${terminals.length + 1}`,
      history: [
        { id: generateId(), type: 'system', content: 'New terminal session', timestamp: new Date() },
      ],
      cwd: '/workspace',
    };
    setTerminals(prev => [...prev, newTerminal]);
    setActiveTerminalId(newTerminal.id);
    return newTerminal;
  }, [terminals.length]);

  const clearTerminal = useCallback((terminalId: string) => {
    setTerminals(prev => prev.map(t => 
      t.id === terminalId ? { ...t, history: [] } : t
    ));
  }, []);

  // Git operations
  const gitStage = useCallback((paths: string[]) => {
    setGitStatus(prev => ({
      ...prev,
      staged: [...new Set([...prev.staged, ...paths])],
      unstaged: prev.unstaged.filter(p => !paths.includes(p)),
      untracked: prev.untracked.filter(p => !paths.includes(p)),
    }));
  }, []);

  const gitUnstage = useCallback((paths: string[]) => {
    setGitStatus(prev => ({
      ...prev,
      unstaged: [...new Set([...prev.unstaged, ...paths])],
      staged: prev.staged.filter(p => !paths.includes(p)),
    }));
  }, []);

  const gitCommit = useCallback((message: string) => {
    const newCommit: GitCommit = {
      id: generateId(),
      hash: Math.random().toString(36).substr(2, 7),
      message,
      author: 'AI-MOS Agent',
      date: new Date(),
      branch: gitStatus.branch,
    };
    setGitCommits(prev => [newCommit, ...prev]);
    setGitStatus(prev => ({
      ...prev,
      staged: [],
      ahead: prev.ahead + 1,
    }));
    return newCommit;
  }, [gitStatus.branch]);

  const gitCheckout = useCallback((branchName: string) => {
    setGitBranches(prev => prev.map(b => ({ ...b, current: b.name === branchName })));
    setGitStatus(prev => ({ ...prev, branch: branchName }));
  }, []);

  const gitCreateBranch = useCallback((name: string) => {
    const newBranch: GitBranch = { name, current: false };
    setGitBranches(prev => [...prev, newBranch]);
    return newBranch;
  }, []);

  // Bulk create files/folders from ingestion
  const bulkCreate = useCallback((items: Array<{ path: string; name: string; content: string; type: 'file' | 'folder' }>) => {
    setFiles(prev => {
      let newFiles = [...prev];
      const createdPaths = new Set<string>();

      for (const item of items) {
        if (createdPaths.has(item.path)) continue;
        createdPaths.add(item.path);

        const parentPath = item.path.split('/').slice(0, -1).join('/') || '/workspace';
        const newNode: FileNode = {
          id: generateId(),
          name: item.name,
          type: item.type,
          path: item.type === 'folder' ? item.path : item.path,
          content: item.type === 'file' ? item.content : undefined,
          children: item.type === 'folder' ? [] : undefined,
          language: item.type === 'file' ? getLanguageFromPath(item.name) : undefined,
          modified: false,
          lastModified: new Date(),
        };

        const addToParent = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.path === parentPath && node.children) {
              const exists = node.children.some(c => c.path === item.path);
              if (!exists) {
                return { ...node, children: [...node.children, newNode] };
              }
            }
            if (node.children) {
              return { ...node, children: addToParent(node.children) };
            }
            return node;
          });
        };

        // If parent is root, add to workspace
        if (parentPath === '' || parentPath === '/') {
          const workspace = newFiles.find(n => n.name === 'workspace');
          if (workspace && workspace.children) {
            const exists = workspace.children.some(c => c.path === item.path);
            if (!exists) {
              workspace.children = [...workspace.children, newNode];
            }
          }
        } else {
          newFiles = addToParent(newFiles);
        }
      }

      return newFiles;
    });
  }, []);

  // Agent tasks
  const addAgentTask = useCallback((task: Omit<AgentTask, 'id'>) => {
    const newTask: AgentTask = { ...task, id: generateId() };
    setAgentTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateAgentTask = useCallback((taskId: string, updates: Partial<AgentTask>) => {
    setAgentTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    ));
  }, []);

  return {
    // State
    files,
    openTabs,
    activeTabId,
    terminals,
    activeTerminalId,
    gitStatus,
    gitCommits,
    gitBranches,
    clipboard,
    agentTasks,

    // File operations
    findNode,
    createFile,
    deleteNode,
    renameNode,
    copyNodes,
    cutNodes,
    pasteNodes,
    setFiles,

    // Tab operations
    openFile,
    closeTab,
    setActiveTabId,
    updateTabContent,
    saveTab,

    // Terminal operations
    addTerminalLine,
    createTerminal,
    clearTerminal,
    setActiveTerminalId,

    // Git operations
    gitStage,
    gitUnstage,
    gitCommit,
    gitCheckout,
    gitCreateBranch,

    // Agent tasks
    addAgentTask,
    updateAgentTask,

    // Bulk operations
    bulkCreate,

    // Persist
    saveState,
  };
};
