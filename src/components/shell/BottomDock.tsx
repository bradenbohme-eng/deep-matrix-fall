// BottomDock — Canon §11: Time, Process, History, and Becoming
// "The bottom dock is one of the most powerful pieces of the entire system."

import React, { useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Terminal,
  History,
  Workflow,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Minus,
} from 'lucide-react';
import type { BottomDockTab } from './types';

interface BottomDockProps {
  activeTab: BottomDockTab;
  onTabChange: (tab: BottomDockTab) => void;
  height: number;
  onHeightChange: (h: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const TABS: { id: BottomDockTab; icon: React.ElementType; label: string }[] = [
  { id: 'timeline', icon: Clock, label: 'Timeline' },
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'history', icon: History, label: 'History' },
  { id: 'jobs', icon: Workflow, label: 'Jobs' },
  { id: 'tests', icon: FlaskConical, label: 'Tests' },
];

const BottomDock: React.FC<BottomDockProps> = ({
  activeTab,
  onTabChange,
  height,
  onHeightChange,
  isOpen,
  onToggle,
}) => {
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLines, setTerminalLines] = useState<{ text: string; type: string }[]>([
    { text: '[SYS] HQ Terminal v5.0 — Canon Architecture', type: 'success' },
    { text: '[SYS] Orchestration kernel online. All systems nominal.', type: 'info' },
  ]);

  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
    const move = (e: MouseEvent) => {
      if (!isDragging.current) return;
      onHeightChange(window.innerHeight - e.clientY);
    };
    const up = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    setTerminalLines(prev => [...prev, { text: `$ ${terminalInput}`, type: 'command' }]);
    const cmd = terminalInput.trim();
    setTerminalInput('');

    setTimeout(() => {
      if (cmd === 'clear') { setTerminalLines([]); return; }
      if (cmd === 'status') {
        setTerminalLines(prev => [...prev,
          { text: 'System: OPERATIONAL | Agents: 4 active | Budget: 36% used', type: 'success' },
        ]);
      } else if (cmd === 'help') {
        setTerminalLines(prev => [...prev,
          { text: 'Commands: status, clear, help, tasks, budget, stop', type: 'info' },
        ]);
      } else {
        setTerminalLines(prev => [...prev,
          { text: `Unknown: ${cmd}. Type 'help' for commands.`, type: 'error' },
        ]);
      }
    }, 200);
  };

  if (!isOpen) {
    return (
      <div className="surface-dock flex items-center px-3 cursor-pointer select-none"
           style={{ height: 'var(--statusbar-height)' }}
           onClick={onToggle}>
        <ChevronUp className="w-3 h-3 text-muted-foreground mr-2" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {activeTab}
        </span>
      </div>
    );
  }

  return (
    <div className="surface-dock flex flex-col" style={{ height: `${height}px` }}>
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="h-1 cursor-ns-resize hover:bg-primary/20 transition-colors"
      />

      {/* Tab Bar */}
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-border">
        <div className="flex items-center gap-0.5">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`tab-button ${activeTab === id ? 'active' : ''}`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="rail-icon w-6 h-6">
            <Minus className="w-3 h-3" />
          </button>
          <button onClick={onToggle} className="rail-icon w-6 h-6">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'terminal' && (
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1 p-2 custom-scrollbar font-mono text-xs">
              {terminalLines.map((line, i) => (
                <div key={i} className={`mb-0.5 ${
                  line.type === 'error' ? 'text-destructive' :
                  line.type === 'success' ? 'text-primary' :
                  line.type === 'command' ? 'text-info' :
                  'text-muted-foreground'
                }`}>
                  {line.text}
                </div>
              ))}
            </ScrollArea>
            <form onSubmit={handleTerminalSubmit} className="px-2 py-1.5 border-t border-border flex items-center">
              <span className="text-primary font-mono text-xs mr-2">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={e => setTerminalInput(e.target.value)}
                className="flex-1 bg-transparent outline-none text-xs font-mono text-foreground"
                placeholder="Enter command..."
              />
            </form>
          </div>
        )}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'jobs' && <JobsView />}
        {activeTab === 'tests' && <TestsView />}
      </div>
    </div>
  );
};

// ─── Timeline (Canon §16: Temporal Continuity) ───
const TimelineView: React.FC = () => {
  const events = [
    { time: '00:00.0', type: 'RUN_STARTED', detail: 'Kernel initialized' },
    { time: '00:01.2', type: 'PLAN_CREATED', detail: '5 tasks queued' },
    { time: '00:03.8', type: 'ACTION_EXECUTED', detail: 'Constraint extraction' },
    { time: '00:08.1', type: 'VERIFICATION_PASSED', detail: 'Schema valid' },
    { time: '00:12.4', type: 'TOOL_CALLED', detail: 'search_memory()' },
    { time: '00:15.7', type: 'CHECKPOINT_CREATED', detail: 'Snapshot #1' },
  ];

  const typeColors: Record<string, string> = {
    RUN_STARTED: 'text-info',
    PLAN_CREATED: 'text-primary',
    ACTION_EXECUTED: 'text-foreground',
    VERIFICATION_PASSED: 'text-success',
    VERIFICATION_FAILED: 'text-destructive',
    TOOL_CALLED: 'text-warning',
    CHECKPOINT_CREATED: 'text-info',
  };

  return (
    <ScrollArea className="h-full p-3 custom-scrollbar">
      <div className="space-y-1">
        {events.map((e, i) => (
          <div key={i} className="flex items-start gap-3 py-1 group interactive-ghost rounded px-2">
            <span className="text-[10px] font-mono text-muted-foreground w-14 shrink-0">
              {e.time}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 shadow-glow" />
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-mono ${typeColors[e.type] || 'text-foreground'}`}>
                {e.type}
              </span>
              <p className="text-xs text-muted-foreground truncate">{e.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

// ─── History (Canon §16.2) ───
const HistoryView: React.FC = () => (
  <ScrollArea className="h-full p-3 custom-scrollbar">
    <div className="text-xs text-muted-foreground text-center py-6 font-mono">
      <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
      Snapshot history and branching view
    </div>
  </ScrollArea>
);

// ─── Jobs ───
const JobsView: React.FC = () => (
  <ScrollArea className="h-full p-3 custom-scrollbar">
    <div className="space-y-2">
      {[
        { name: 'Orchestration Run #1', status: 'running', progress: 36 },
        { name: 'Test Suite: Budget Compliance', status: 'queued', progress: 0 },
      ].map((j, i) => (
        <div key={i} className="surface-raised rounded-md p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono text-foreground">{j.name}</span>
            <span className={`badge-live ${j.status === 'running' ? '' : 'opacity-50'}`}>
              {j.status}
            </span>
          </div>
          <div className="h-1 bg-surface-1 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${j.progress}%` }} />
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
);

// ─── Tests ───
const TestsView: React.FC = () => (
  <ScrollArea className="h-full p-3 custom-scrollbar">
    <div className="grid grid-cols-4 gap-2">
      {['Budget Compliance', 'STOP Semantics', 'Contradiction', 'Drift Detection',
        'Partial Completion', 'Verification First', 'Regression', 'Tool Discipline',
        'Context Overload', 'Queue Repriority', 'Self-Improve', 'Fix Spawning'].map(name => (
        <div key={name} className="surface-raised rounded-md p-2 text-center">
          <div className="text-[9px] font-mono text-muted-foreground mb-1 truncate">{name}</div>
          <div className="text-xs font-mono text-primary">—</div>
        </div>
      ))}
    </div>
  </ScrollArea>
);

export default BottomDock;
