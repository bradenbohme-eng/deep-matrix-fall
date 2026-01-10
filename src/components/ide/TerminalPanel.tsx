import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, X, Terminal as TerminalIcon, Trash2 } from 'lucide-react';
import { Terminal, TerminalLine, FileNode } from './types';
import { cn } from '@/lib/utils';
import { analyzeCode } from '@/lib/aiClient';

interface TerminalPanelProps {
  terminals: Terminal[];
  activeTerminalId: string;
  files: FileNode[];
  onAddLine: (terminalId: string, line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  onCreateTerminal: () => void;
  onClearTerminal: (terminalId: string) => void;
  onSetActiveTerminal: (terminalId: string) => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  terminals,
  activeTerminalId,
  files,
  onAddLine,
  onCreateTerminal,
  onClearTerminal,
  onSetActiveTerminal,
}) => {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeTerminal = terminals.find(t => t.id === activeTerminalId);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTerminal?.history]);

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

  const listDir = useCallback((nodes: FileNode[], path: string): string[] => {
    const node = findNode(nodes, path);
    if (node?.children) {
      return node.children.map(n => `${n.type === 'folder' ? '📁' : '📄'} ${n.name}`);
    }
    return [];
  }, [findNode]);

  const executeCommand = async (cmd: string) => {
    const terminalId = activeTerminalId;
    onAddLine(terminalId, { type: 'input', content: `$ ${cmd}` });
    
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        onAddLine(terminalId, { 
          type: 'system', 
          content: `Available commands:
  help              Show this help message
  clear             Clear terminal
  ls [path]         List directory contents
  cat <file>        Display file contents
  pwd               Print working directory
  cd <path>         Change directory
  mkdir <name>      Create directory
  touch <name>      Create file
  rm <path>         Remove file/directory
  echo <text>       Print text
  ai <prompt>       Ask AI for assistance
  analyze <file>    Analyze code with AI
  run <file>        Execute JavaScript/TypeScript
  git <command>     Git operations
  npm <command>     NPM operations (simulated)
  env               Show environment variables
  date              Show current date/time
  whoami            Show current user` 
        });
        break;

      case 'clear':
        onClearTerminal(terminalId);
        break;

      case 'ls':
        const lsPath = args[0] || activeTerminal?.cwd || '/workspace';
        const items = listDir(files, lsPath);
        if (items.length > 0) {
          onAddLine(terminalId, { type: 'output', content: items.join('\n') });
        } else {
          onAddLine(terminalId, { type: 'error', content: `ls: cannot access '${lsPath}': No such directory` });
        }
        break;

      case 'cat':
        if (!args[0]) {
          onAddLine(terminalId, { type: 'error', content: 'cat: missing operand' });
          break;
        }
        const catPath = args[0].startsWith('/') ? args[0] : `${activeTerminal?.cwd}/${args[0]}`;
        const file = findNode(files, catPath);
        if (file?.type === 'file' && file.content !== undefined) {
          onAddLine(terminalId, { type: 'output', content: file.content });
        } else {
          onAddLine(terminalId, { type: 'error', content: `cat: ${args[0]}: No such file` });
        }
        break;

      case 'pwd':
        onAddLine(terminalId, { type: 'output', content: activeTerminal?.cwd || '/workspace' });
        break;

      case 'echo':
        onAddLine(terminalId, { type: 'output', content: args.join(' ') });
        break;

      case 'date':
        onAddLine(terminalId, { type: 'output', content: new Date().toString() });
        break;

      case 'whoami':
        onAddLine(terminalId, { type: 'output', content: 'aimos-agent' });
        break;

      case 'env':
        onAddLine(terminalId, { 
          type: 'output', 
          content: `NODE_ENV=development
AIMOS_VERSION=1.0.0
SHELL=/bin/bash
USER=aimos-agent
HOME=/workspace` 
        });
        break;

      case 'git':
        const gitCmd = args[0];
        switch (gitCmd) {
          case 'status':
            onAddLine(terminalId, { type: 'output', content: 'On branch main\nnothing to commit, working tree clean' });
            break;
          case 'log':
            onAddLine(terminalId, { type: 'output', content: 'commit abc1234 (HEAD -> main)\nAuthor: AI-MOS <ai@aimos.dev>\nDate: Now\n\n    Initial commit' });
            break;
          case 'branch':
            onAddLine(terminalId, { type: 'output', content: '* main\n  develop' });
            break;
          default:
            onAddLine(terminalId, { type: 'system', content: `git ${gitCmd || ''}: simulated in IDE` });
        }
        break;

      case 'npm':
        const npmCmd = args[0];
        onAddLine(terminalId, { type: 'system', content: `npm ${npmCmd || 'help'}: simulated in IDE` });
        if (npmCmd === 'install' || npmCmd === 'i') {
          onAddLine(terminalId, { type: 'success', content: '✓ Packages installed successfully' });
        }
        break;

      case 'ai':
        if (!args.length) {
          onAddLine(terminalId, { type: 'error', content: 'ai: provide a prompt' });
          break;
        }
        onAddLine(terminalId, { type: 'system', content: '🤖 AI is thinking...' });
        try {
          const result = await analyzeCode(args.join(' '), 'text', 'explain');
          onAddLine(terminalId, { type: 'output', content: result.result });
        } catch (e) {
          onAddLine(terminalId, { type: 'error', content: `AI error: ${e instanceof Error ? e.message : 'Unknown error'}` });
        }
        break;

      case 'analyze':
        if (!args[0]) {
          onAddLine(terminalId, { type: 'error', content: 'analyze: specify a file' });
          break;
        }
        const analyzePath = args[0].startsWith('/') ? args[0] : `${activeTerminal?.cwd}/${args[0]}`;
        const analyzeFile = findNode(files, analyzePath);
        if (analyzeFile?.type === 'file' && analyzeFile.content) {
          onAddLine(terminalId, { type: 'system', content: '🔍 Analyzing code...' });
          try {
            const result = await analyzeCode(analyzeFile.content, analyzeFile.language || 'typescript', 'analyze');
            onAddLine(terminalId, { type: 'output', content: result.result });
          } catch (e) {
            onAddLine(terminalId, { type: 'error', content: `Analysis error: ${e instanceof Error ? e.message : 'Unknown error'}` });
          }
        } else {
          onAddLine(terminalId, { type: 'error', content: `analyze: ${args[0]}: File not found` });
        }
        break;

      case 'run':
        if (!args[0]) {
          onAddLine(terminalId, { type: 'error', content: 'run: specify a file' });
          break;
        }
        const runPath = args[0].startsWith('/') ? args[0] : `${activeTerminal?.cwd}/${args[0]}`;
        const runFile = findNode(files, runPath);
        if (runFile?.type === 'file' && runFile.content) {
          onAddLine(terminalId, { type: 'system', content: `▶ Running ${args[0]}...` });
          try {
            const result = eval(runFile.content);
            onAddLine(terminalId, { type: 'output', content: String(result) });
            onAddLine(terminalId, { type: 'success', content: '✓ Execution completed' });
          } catch (e) {
            onAddLine(terminalId, { type: 'error', content: `Runtime error: ${e instanceof Error ? e.message : 'Unknown error'}` });
          }
        } else {
          onAddLine(terminalId, { type: 'error', content: `run: ${args[0]}: File not found` });
        }
        break;

      default:
        onAddLine(terminalId, { type: 'error', content: `${command}: command not found. Type 'help' for available commands.` });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);
    executeCommand(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-primary';
      case 'output': return 'text-foreground';
      case 'error': return 'text-destructive';
      case 'system': return 'text-muted-foreground';
      case 'success': return 'text-green-400';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/80">
      {/* Terminal tabs */}
      <div className="flex items-center border-b border-border bg-muted/30">
        <div className="flex-1 flex overflow-x-auto">
          {terminals.map(terminal => (
            <button
              key={terminal.id}
              onClick={() => onSetActiveTerminal(terminal.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-mono border-r border-border",
                terminal.id === activeTerminalId
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TerminalIcon className="w-3 h-3" />
              {terminal.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 px-2">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateTerminal}>
            <Plus className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => onClearTerminal(activeTerminalId)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Terminal output */}
      <ScrollArea className="flex-1 p-3">
        <div className="font-mono text-sm space-y-0.5">
          {activeTerminal?.history.map((line) => (
            <div key={line.id} className={cn("whitespace-pre-wrap", getLineColor(line.type))}>
              {line.content}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 border-t border-border">
        <span className="text-primary font-mono text-sm">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          className="flex-1 bg-transparent text-foreground font-mono text-sm outline-none"
          autoFocus
        />
      </form>
    </div>
  );
};
