import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Code2, Terminal as TerminalIcon, Play, Save, FileCode, 
  FolderOpen, Plus, Trash2, Download, Upload, Zap, Bot
} from 'lucide-react';
import { toast } from 'sonner';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
}

interface TerminalMessage {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'system';
  timestamp: Date;
}

const EnhancedIDEPanel: React.FC = () => {
  const [mode, setMode] = useState<'ide' | 'terminal'>('ide');
  const [activeFile, setActiveFile] = useState<string>('/workspace/main.ts');
  const [code, setCode] = useState<string>('// AI-MOS Enhanced IDE\n// Start coding...\n\nconsole.log("Hello, AI-MOS!");');
  const [files, setFiles] = useState<FileNode[]>([
    {
      name: 'workspace',
      type: 'folder',
      path: '/workspace',
      children: [
        { name: 'main.ts', type: 'file', path: '/workspace/main.ts', content: '// AI-MOS Enhanced IDE\n// Start coding...\n\nconsole.log("Hello, AI-MOS!");' },
        { name: 'utils.ts', type: 'file', path: '/workspace/utils.ts', content: '// Utility functions\n' },
        { name: 'api.ts', type: 'file', path: '/workspace/api.ts', content: '// API functions\n' },
      ]
    }
  ]);
  
  const [terminalMessages, setTerminalMessages] = useState<TerminalMessage[]>([
    {
      id: '1',
      text: 'AI-MOS Enhanced Terminal v2.0.0',
      type: 'system',
      timestamp: new Date(),
    },
    {
      id: '2',
      text: 'Type "help" for available commands or switch to IDE mode',
      type: 'system',
      timestamp: new Date(),
    }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalMessages]);

  useEffect(() => {
    // Load workspace from localStorage
    const saved = localStorage.getItem('aimos-workspace');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setFiles(data.files || files);
        setActiveFile(data.activeFile || activeFile);
        setCode(data.code || code);
      } catch (e) {
        console.error('Failed to load workspace', e);
      }
    }
  }, []);

  const saveWorkspace = () => {
    const workspace = {
      files,
      activeFile,
      code,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('aimos-workspace', JSON.stringify(workspace));
    toast.success('Workspace saved successfully');
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      // Update file content
      const updateFileContent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === activeFile) {
            return { ...node, content: value };
          }
          if (node.children) {
            return { ...node, children: updateFileContent(node.children) };
          }
          return node;
        });
      };
      setFiles(updateFileContent(files));
    }
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  const openFile = (path: string) => {
    const findFile = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.path === path && node.type === 'file') {
          return node;
        }
        if (node.children) {
          const found = findFile(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const file = findFile(files);
    if (file) {
      setActiveFile(path);
      setCode(file.content || '');
    }
  };

  const executeCode = () => {
    addTerminalMessage('> Executing code...', 'system');
    try {
      // In a real implementation, this would send to backend
      const result = eval(code);
      addTerminalMessage(String(result), 'output');
      toast.success('Code executed successfully');
    } catch (error: any) {
      addTerminalMessage(`Error: ${error.message}`, 'error');
      toast.error('Execution failed');
    }
  };

  const addTerminalMessage = (text: string, type: TerminalMessage['type']) => {
    const msg: TerminalMessage = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
    };
    setTerminalMessages(prev => [...prev, msg]);
  };

  const handleTerminalCommand = (cmd: string) => {
    addTerminalMessage(`$ ${cmd}`, 'input');
    
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        addTerminalMessage('Available commands:\n  help - Show this help\n  clear - Clear terminal\n  run - Execute current file\n  ls - List files\n  cat [file] - Show file content\n  ai [prompt] - Ask AI for help\n  mode [ide|terminal] - Switch mode', 'system');
        break;
      case 'clear':
        setTerminalMessages([]);
        break;
      case 'run':
        executeCode();
        break;
      case 'ls':
        const listFiles = (nodes: FileNode[], indent = ''): string => {
          return nodes.map(n => `${indent}${n.type === 'folder' ? '📁' : '📄'} ${n.name}`).join('\n');
        };
        addTerminalMessage(listFiles(files), 'output');
        break;
      case 'cat':
        if (args[0]) {
          const path = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
          const findFile = (nodes: FileNode[]): FileNode | null => {
            for (const node of nodes) {
              if (node.path === path && node.type === 'file') return node;
              if (node.children) {
                const found = findFile(node.children);
                if (found) return found;
              }
            }
            return null;
          };
          const file = findFile(files);
          if (file) {
            addTerminalMessage(file.content || '', 'output');
          } else {
            addTerminalMessage(`File not found: ${args[0]}`, 'error');
          }
        } else {
          addTerminalMessage('Usage: cat [filename]', 'error');
        }
        break;
      case 'ai':
        if (args.length > 0) {
          addTerminalMessage('AI is thinking...', 'system');
          setTimeout(() => {
            addTerminalMessage(`AI Response: This is a simulated response. In production, this would connect to your AI service.`, 'output');
          }, 1000);
        } else {
          addTerminalMessage('Usage: ai [your question]', 'error');
        }
        break;
      case 'mode':
        if (args[0] === 'ide' || args[0] === 'terminal') {
          setMode(args[0]);
          addTerminalMessage(`Switched to ${args[0]} mode`, 'system');
        } else {
          addTerminalMessage('Usage: mode [ide|terminal]', 'error');
        }
        break;
      default:
        addTerminalMessage(`Unknown command: ${command}. Type "help" for available commands.`, 'error');
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    
    handleTerminalCommand(terminalInput);
    setTerminalInput('');
  };

  const FileTree: React.FC<{ nodes: FileNode[]; level?: number }> = ({ nodes, level = 0 }) => {
    return (
      <div className="space-y-1">
        {nodes.map((node) => (
          <div key={node.path} style={{ paddingLeft: `${level * 12}px` }}>
            <button
              onClick={() => node.type === 'file' && openFile(node.path)}
              className={`flex items-center gap-2 text-xs hover:bg-primary/10 w-full px-2 py-1 rounded ${
                activeFile === node.path ? 'bg-primary/20 text-primary' : 'text-foreground'
              }`}
            >
              {node.type === 'folder' ? (
                <FolderOpen className="w-3 h-3" />
              ) : (
                <FileCode className="w-3 h-3" />
              )}
              <span className="font-mono">{node.name}</span>
            </button>
            {node.children && <FileTree nodes={node.children} level={level + 1} />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm font-bold text-primary">AI-MOS IDE</span>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={mode === 'ide' ? 'default' : 'outline'}
              onClick={() => setMode('ide')}
              className="h-7 text-xs"
            >
              <Code2 className="w-3 h-3 mr-1" />
              IDE
            </Button>
            <Button
              size="sm"
              variant={mode === 'terminal' ? 'default' : 'outline'}
              onClick={() => setMode('terminal')}
              className="h-7 text-xs"
            >
              <TerminalIcon className="w-3 h-3 mr-1" />
              Terminal
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={aiMode ? 'default' : 'outline'}
            onClick={() => setAiMode(!aiMode)}
            className="h-7 text-xs"
          >
            <Bot className="w-3 h-3 mr-1" />
            AI {aiMode ? 'ON' : 'OFF'}
          </Button>
          <Button size="sm" variant="outline" onClick={saveWorkspace} className="h-7 text-xs">
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
          {mode === 'ide' && (
            <Button size="sm" variant="default" onClick={executeCode} className="h-7 text-xs">
              <Play className="w-3 h-3 mr-1" />
              Run
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {mode === 'ide' ? (
          <>
            {/* File Explorer */}
            <div className="w-64 border-r border-primary/20 overflow-y-auto">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">EXPLORER</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <FileTree nodes={files} />
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-primary/20 bg-muted/30">
                <FileCode className="w-3 h-3 text-primary" />
                <span className="text-xs font-mono">{activeFile}</span>
                {aiMode && (
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    <Bot className="w-3 h-3 mr-1" />
                    AI Active
                  </Badge>
                )}
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorMount}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          /* Terminal Mode */
          <div className="flex-1 flex flex-col bg-black/80">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2 font-mono text-sm">
                {terminalMessages.map((msg) => (
                  <div key={msg.id} className={`${
                    msg.type === 'input' ? 'text-primary' :
                    msg.type === 'error' ? 'text-red-400' :
                    msg.type === 'system' ? 'text-accent' :
                    'text-foreground'
                  }`}>
                    {msg.text}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </ScrollArea>
            
            <form onSubmit={handleTerminalSubmit} className="p-4 border-t border-primary/20 flex items-center gap-2">
              <span className="text-primary font-mono">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Enter command..."
                className="flex-1 bg-transparent text-foreground font-mono outline-none"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedIDEPanel;
