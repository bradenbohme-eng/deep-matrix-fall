// Bottom Panel - Terminal, Problems, Output, Diagnostics, Tests

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Terminal, 
  AlertCircle, 
  FileOutput, 
  Activity,
  Bug,
  X,
  Minus,
  Maximize2,
  FlaskConical
} from 'lucide-react';
import type { BottomPanelTab } from './types';
import TestHarnessPanel from './TestHarnessPanel';

interface BottomPanelProps {
  activeTab: BottomPanelTab;
  onTabChange: (tab: BottomPanelTab) => void;
  height: number;
  onHeightChange: (height: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'warn' | 'error' | 'success' | 'command';
  message: string;
}

const tabs: { id: BottomPanelTab; icon: React.ElementType; label: string }[] = [
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'problems', icon: AlertCircle, label: 'Problems' },
  { id: 'output', icon: FileOutput, label: 'Output' },
  { id: 'diagnostics', icon: Activity, label: 'Diagnostics' },
  { id: 'debug', icon: Bug, label: 'Debug' },
  { id: 'tests', icon: FlaskConical, label: 'Tests' },
];

const BottomPanel: React.FC<BottomPanelProps> = ({
  activeTab,
  onTabChange,
  height,
  onHeightChange,
  isOpen,
  onClose,
}) => {
  const [terminalHistory, setTerminalHistory] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date(), type: 'success', message: 'HQ Terminal v4.0 initialized' },
    { id: '2', timestamp: new Date(), type: 'info', message: 'Connecting to secure command center...' },
    { id: '3', timestamp: new Date(), type: 'success', message: 'Connection established. Ready for operations.' },
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [problems] = useState([
    { id: 1, severity: 'error', file: 'src/App.tsx', line: 42, message: 'Type error: Expected string, got number' },
    { id: 2, severity: 'warning', file: 'src/utils.ts', line: 15, message: 'Unused variable: tempData' },
  ]);
  
  const resizeRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const newHeight = window.innerHeight - e.clientY;
    onHeightChange(newHeight);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const executeCommand = (cmd: string) => {
    const entry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'command',
      message: `$ ${cmd}`,
    };
    setTerminalHistory(prev => [...prev, entry]);

    // Simulate command execution
    setTimeout(() => {
      let response: LogEntry;
      
      if (cmd.startsWith('nmap') || cmd.startsWith('scan')) {
        response = {
          id: (Date.now() + 1).toString(),
          timestamp: new Date(),
          type: 'info',
          message: `Starting scan on ${cmd.split(' ')[1] || 'localhost'}...\nPort 22/tcp   open  ssh\nPort 80/tcp   open  http\nPort 443/tcp  open  https\nPort 3306/tcp open  mysql`,
        };
      } else if (cmd === 'help') {
        response = {
          id: (Date.now() + 1).toString(),
          timestamp: new Date(),
          type: 'info',
          message: `Available commands:\n  nmap <target>  - Port scan\n  scan <target>  - Vulnerability scan\n  clear          - Clear terminal\n  status         - System status\n  agents         - List active agents`,
        };
      } else if (cmd === 'clear') {
        setTerminalHistory([]);
        return;
      } else if (cmd === 'status') {
        response = {
          id: (Date.now() + 1).toString(),
          timestamp: new Date(),
          type: 'success',
          message: `System Status: OPERATIONAL\nAgents: 5 active\nAlerts: 3 pending\nNetwork Nodes: 12 discovered\nLast Scan: ${new Date().toLocaleTimeString()}`,
        };
      } else {
        response = {
          id: (Date.now() + 1).toString(),
          timestamp: new Date(),
          type: 'error',
          message: `Command not found: ${cmd}. Type 'help' for available commands.`,
        };
      }
      
      setTerminalHistory(prev => [...prev, response]);
    }, 300);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    executeCommand(terminalInput.trim());
    setTerminalInput('');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="bg-card border-t border-primary/20 flex flex-col"
      style={{ height: `${height}px` }}
    >
      {/* Resize Handle */}
      <div 
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className="h-1 bg-transparent hover:bg-primary/30 cursor-ns-resize"
      />
      
      {/* Tab Bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-muted/30 border-b border-border">
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                variant="ghost"
                size="sm"
                className={`h-7 px-3 text-xs font-mono ${
                  isActive 
                    ? 'bg-primary/20 text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <IconComponent className="w-3 h-3 mr-1" />
                {tab.label}
                {tab.id === 'problems' && problems.length > 0 && (
                  <span className="ml-1 px-1 bg-destructive text-destructive-foreground rounded text-[10px]">
                    {problems.length}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
            <Minus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
            <Maximize2 className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'terminal' && (
          <div className="h-full flex flex-col bg-black/50">
            <ScrollArea className="flex-1 p-2 font-mono text-xs">
              {terminalHistory.map((entry) => (
                <div 
                  key={entry.id}
                  className={`mb-1 ${
                    entry.type === 'error' ? 'text-destructive' :
                    entry.type === 'warn' ? 'text-yellow-500' :
                    entry.type === 'success' ? 'text-primary' :
                    entry.type === 'command' ? 'text-cyan-400' :
                    'text-muted-foreground'
                  }`}
                >
                  <span className="text-muted-foreground/50 mr-2">
                    [{entry.timestamp.toLocaleTimeString()}]
                  </span>
                  <span className="whitespace-pre-wrap">{entry.message}</span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </ScrollArea>
            
            <form onSubmit={handleTerminalSubmit} className="p-2 border-t border-border">
              <div className="flex items-center">
                <span className="text-primary mr-2 font-mono text-xs">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-xs"
                  placeholder="Enter command..."
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}

        {activeTab === 'problems' && (
          <ScrollArea className="h-full p-2">
            {problems.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No problems detected
              </div>
            ) : (
              <div className="space-y-1">
                {problems.map((problem) => (
                  <div 
                    key={problem.id}
                    className="flex items-center space-x-2 p-2 rounded bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs"
                  >
                    <AlertCircle className={`w-4 h-4 ${
                      problem.severity === 'error' ? 'text-destructive' : 'text-yellow-500'
                    }`} />
                    <span className="text-muted-foreground">{problem.file}:{problem.line}</span>
                    <span className="flex-1">{problem.message}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}

        {activeTab === 'output' && (
          <ScrollArea className="h-full p-2 font-mono text-xs text-muted-foreground">
            <div>[{new Date().toLocaleTimeString()}] Build started...</div>
            <div>[{new Date().toLocaleTimeString()}] Compiling TypeScript...</div>
            <div className="text-primary">[{new Date().toLocaleTimeString()}] Build completed successfully</div>
          </ScrollArea>
        )}

        {activeTab === 'diagnostics' && (
          <div className="h-full p-4 grid grid-cols-4 gap-4">
            <div className="bg-muted/20 rounded p-3">
              <div className="text-xs text-muted-foreground mb-1">CPU</div>
              <div className="text-lg font-mono text-primary">23%</div>
            </div>
            <div className="bg-muted/20 rounded p-3">
              <div className="text-xs text-muted-foreground mb-1">Memory</div>
              <div className="text-lg font-mono text-primary">1.2 GB</div>
            </div>
            <div className="bg-muted/20 rounded p-3">
              <div className="text-xs text-muted-foreground mb-1">Network</div>
              <div className="text-lg font-mono text-primary">42 MB/s</div>
            </div>
            <div className="bg-muted/20 rounded p-3">
              <div className="text-xs text-muted-foreground mb-1">Agents</div>
              <div className="text-lg font-mono text-primary">5 Active</div>
            </div>
          </div>
        )}

        {activeTab === 'debug' && (
          <ScrollArea className="h-full p-2 font-mono text-xs">
            <div className="text-muted-foreground">Debug console ready. Set breakpoints in code to begin debugging.</div>
          </ScrollArea>
        )}

        {activeTab === 'tests' && (
          <div className="h-full">
            <TestHarnessPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomPanel;
