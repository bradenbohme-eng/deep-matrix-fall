// RightPanel — Canon §10: Persistent Intelligence and Contextual Inspection
// Strategy C: Toggled domain separation (AI / Inspect / Analyze / Memory)

import React, { useState } from 'react';
import MatrixSidebarRain from '@/components/matrix/MatrixSidebarRain';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MessageCircle,
  Search as SearchIcon,
  BarChart3,
  Brain,
  Send,
  Sparkles,
} from 'lucide-react';
import type { RightPanelMode } from './types';

interface RightPanelProps {
  mode: RightPanelMode;
  onModeChange: (mode: RightPanelMode) => void;
  isOpen: boolean;
  width: number;
}

const MODE_TABS: { id: RightPanelMode; icon: React.ElementType; label: string }[] = [
  { id: 'ai', icon: MessageCircle, label: 'AI' },
  { id: 'inspect', icon: SearchIcon, label: 'Inspect' },
  { id: 'analyze', icon: BarChart3, label: 'Analyze' },
  { id: 'memory', icon: Brain, label: 'Memory' },
];

const RightPanel: React.FC<RightPanelProps> = ({ mode, onModeChange, isOpen, width }) => {
  if (!isOpen) return null;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Content Panel */}
      <div
        className="h-full bg-surface-2 border-l border-border flex flex-col overflow-hidden"
        style={{ width: `${width}px` }}
      >
        {/* Mode Header */}
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {MODE_TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onModeChange(id)}
                className={`tab-button ${mode === id ? 'active' : ''}`}
              >
                <Icon className="w-3 h-3" />
                <span className="capitalize">{id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Content */}
        <div className="flex-1 overflow-hidden">
          {mode === 'ai' && <AIChatPanel />}
          {mode === 'inspect' && <InspectPanel />}
          {mode === 'analyze' && <AnalyzePanel />}
          {mode === 'memory' && <MemoryPanel />}
        </div>
      </div>

      {/* Right Rail with Matrix Rain */}
      <div
        className="relative surface-rail flex flex-col items-center py-2 gap-1 overflow-hidden border-l border-border"
        style={{ width: 'var(--rail-width)' }}
      >
        <MatrixSidebarRain />
        <div className="relative z-10 flex flex-col items-center gap-0.5 flex-1">
          {MODE_TABS.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onModeChange(id)}
                  className={`rail-icon ${mode === id ? 'active right-active' : ''}`}
                  aria-label={label}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs font-mono">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── AI Chat (Canon §15: Persistent Intelligence) ───
const AIChatPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'ai'; content: string }[]>([
    { id: '1', role: 'ai', content: 'HQ Intelligence ready. I have full context of your current task queue, active agents, and orchestration state. How can I assist?' },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: input }]);
    const userInput = input;
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Analyzing: "${userInput}"\n\nI can see your orchestration pipeline has 3 queued tasks and 1 active. The current budget utilization is at 36%. What would you like me to focus on?`,
      }]);
    }, 600);
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-3 custom-scrollbar">
        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`rounded-lg p-3 text-sm ${
                msg.role === 'user'
                  ? 'ml-6 surface-active'
                  : 'mr-4 surface-raised'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                {msg.role === 'ai' && <Sparkles className="w-3 h-3 text-primary" />}
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  {msg.role === 'user' ? 'You' : 'HQ AI'}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 surface-inset rounded-lg px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask HQ AI..."
            className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            className="rail-icon w-7 h-7"
            disabled={!input.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Inspect Panel (Canon §10.2: Contextual Inspection) ───
const InspectPanel: React.FC = () => (
  <ScrollArea className="h-full p-3 custom-scrollbar">
    <div className="space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Selected: Task #2
      </div>
      <DetailRow label="Title" value="Generate response draft" />
      <DetailRow label="Status" value="Active" highlight />
      <DetailRow label="Priority" value="90" />
      <DetailRow label="Dependencies" value="Task #1 (done)" />
      <DetailRow label="Acceptance" value="Schema valid + word limit ≤ 500" />
      <div className="divider-h my-3" />
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Last Event
      </div>
      <DetailRow label="Type" value="ACTION_EXECUTED" />
      <DetailRow label="Time" value="2.3s ago" />
      <DetailRow label="Hash" value="7f3a...e2b1" mono />
    </div>
  </ScrollArea>
);

// ─── Analyze Panel (Reasoning Traces) ───
const AnalyzePanel: React.FC = () => (
  <ScrollArea className="h-full p-3 custom-scrollbar">
    <div className="space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Reasoning Trace
      </div>
      {[
        { step: 1, thought: 'Extracted 4 pinned constraints from context', confidence: 0.95 },
        { step: 2, thought: 'Identified schema requirement: JSON output with "result" key', confidence: 0.92 },
        { step: 3, thought: 'Planned verification: schema check + word count + contradiction scan', confidence: 0.88 },
      ].map(s => (
        <div key={s.step} className="surface-raised rounded-md p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono text-muted-foreground">Step {s.step}</span>
            <span className={`text-[9px] font-mono ${s.confidence > 0.9 ? 'text-success' : 'text-warning'}`}>
              {(s.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{s.thought}</p>
        </div>
      ))}

      <div className="divider-h my-3" />
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Improvement Suggestions
      </div>
      <div className="surface-raised rounded-md p-2.5 border-l-2 border-warning">
        <p className="text-xs text-foreground">Consider adding drift detection before step 3 to catch constraint violations earlier.</p>
      </div>
    </div>
  </ScrollArea>
);

// ─── Memory Panel (AIMOS) ───
const MemoryPanel: React.FC = () => (
  <ScrollArea className="h-full p-3 custom-scrollbar">
    <div className="space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        AIMOS Memory Core
      </div>
      {[
        { name: 'Context Memory Core', items: 12, status: 'active' },
        { name: 'Evidence Graph', items: 47, status: 'active' },
        { name: 'Reasoning Chains', items: 3, status: 'processing' },
        { name: 'Tag Hierarchy', items: 128, status: 'indexed' },
      ].map(m => (
        <div key={m.name} className="surface-raised rounded-md p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-foreground">{m.name}</span>
            <span className="badge-live">{m.items}</span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">{m.status}</span>
        </div>
      ))}
    </div>
  </ScrollArea>
);

// ─── Helper ───
const DetailRow: React.FC<{ label: string; value: string; highlight?: boolean; mono?: boolean }> = ({
  label, value, highlight, mono,
}) => (
  <div className="flex items-start justify-between">
    <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
    <span className={`text-xs text-right ${mono ? 'font-mono text-muted-foreground' : ''} ${highlight ? 'text-primary font-mono' : 'text-foreground'}`}>
      {value}
    </span>
  </div>
);

export default RightPanel;
