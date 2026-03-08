// RightPanel — Canon §10: Persistent Intelligence and Contextual Inspection
// Phase 4: Real AI streaming + rich inspector, reasoning viz, memory dashboard

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { streamHQChat, type ChatMessage } from '@/lib/hqChatService';
import { toast } from 'sonner';
import MatrixRainCanvas from './effects/MatrixRainCanvas';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MessageCircle, Search as SearchIcon, BarChart3, Brain,
  Send, Sparkles, Bot, Cpu, CheckCircle2, AlertTriangle,
  Database, Network, ArrowRight, Loader2, Layers, Users,
} from 'lucide-react';
import type { RightPanelMode } from './types';
import SwarmPanel from './SwarmPanel';
import { createSwarmSimulation, type SwarmState } from '@/lib/agentSimulator';

interface RightPanelProps {
  mode: RightPanelMode;
  onModeChange: (mode: RightPanelMode) => void;
  isOpen: boolean;
  width: number;
}

const MODE_TABS: { id: RightPanelMode; icon: React.ElementType; label: string }[] = [
  { id: 'ai', icon: MessageCircle, label: 'AI' },
  { id: 'swarm', icon: Users, label: 'Swarm' },
  { id: 'inspect', icon: SearchIcon, label: 'Inspect' },
  { id: 'analyze', icon: BarChart3, label: 'Analyze' },
  { id: 'memory', icon: Brain, label: 'Memory' },
];

const RightPanel: React.FC<RightPanelProps> = ({ mode, onModeChange, isOpen, width }) => {
  const [swarmState, setSwarmState] = useState<SwarmState | null>(null);

  // Expose swarm state setter for the chat panel to trigger
  const triggerSwarm = useCallback((query: string) => {
    const sim = createSwarmSimulation(query);
    const interval = setInterval(() => {
      const active = sim.tick();
      setSwarmState(sim.getState());
      if (!active) clearInterval(interval);
    }, 180);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Content Panel */}
      <div className="h-full bg-surface-2 border-l border-border flex flex-col overflow-hidden" style={{ width: `${width}px` }}>
        {/* Mode Header */}
        <div className="px-3 py-2 border-b border-border flex items-center gap-1 flex-wrap">
          {MODE_TABS.map(({ id, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => onModeChange(id)}
              className={`tab-button ${mode === id ? 'active' : ''}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Icon className="w-3 h-3" />
              <span className="capitalize">{id}</span>
            </motion.button>
          ))}
        </div>

        {/* Mode Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {mode === 'ai' && <AIChatPanel onSwarmTrigger={triggerSwarm} />}
              {mode === 'swarm' && <SwarmPanel state={swarmState} />}
              {mode === 'inspect' && <InspectPanel />}
              {mode === 'analyze' && <AnalyzePanel />}
              {mode === 'memory' && <MemoryPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Rail */}
      <div
        className="relative surface-rail flex flex-col items-center py-2 gap-1 overflow-hidden border-l border-border"
        style={{ width: 'var(--rail-width)' }}
      >
        <MatrixRainCanvas variant="sidebar" density={10} opacity={0.3} speed={0.5} />
        <div className="relative z-10 flex flex-col items-center gap-0.5 flex-1">
          {MODE_TABS.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => onModeChange(id)}
                  className={`rail-icon ${mode === id ? 'active right-active' : ''}`}
                  aria-label={label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs font-mono">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── AI Chat ───
const AIChatPanel: React.FC<{ onSwarmTrigger?: (query: string) => void }> = ({ onSwarmTrigger }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([
    { id: '1', role: 'assistant', content: 'HQ Intelligence online. Full orchestration context loaded — task queue, agent states, budget allocation, and reasoning chains are all available.\n\nHow can I assist?', timestamp: new Date() },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput('');

    const userEntry = { id: Date.now().toString(), role: 'user' as const, content: userMsg, timestamp: new Date() };
    setMessages(prev => [...prev, userEntry]);
    setIsStreaming(true);

    // Build history for API (exclude initial greeting for cleaner context)
    const apiMessages: ChatMessage[] = [
      ...messages.filter(m => m.id !== '1').map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMsg },
    ];

    let assistantSoFar = '';
    const assistantId = (Date.now() + 1).toString();

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === assistantId) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { id: assistantId, role: 'assistant' as const, content: assistantSoFar, timestamp: new Date() }];
      });
    };

    const controller = new AbortController();
    abortRef.current = controller;

    await streamHQChat({
      messages: apiMessages,
      onDelta: upsertAssistant,
      onDone: () => {
        setIsStreaming(false);
        abortRef.current = null;
      },
      onError: (err) => {
        setIsStreaming(false);
        abortRef.current = null;
        toast.error(err);
        // Add error message to chat
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(), role: 'assistant', timestamp: new Date(),
          content: `⚠️ **Error:** ${err}`,
        }]);
      },
      signal: controller.signal,
    });
  }, [input, isStreaming, messages]);

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg ${msg.role === 'user' ? 'ml-6' : 'mr-2'}`}
            >
              <div className={`rounded-lg p-3 text-sm ${msg.role === 'user' ? 'surface-active' : 'surface-raised'}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  {msg.role === 'assistant' ? (
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  ) : null}
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    {msg.role === 'user' ? 'You' : 'HQ Intelligence'}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-xs prose-invert max-w-none text-xs leading-relaxed text-foreground/90 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_code]:text-primary [&_code]:bg-surface-4 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-surface-4 [&_pre]:p-2 [&_pre]:rounded-md [&_strong]:text-foreground [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-3 py-2"
            >
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
              <span className="text-[10px] font-mono text-muted-foreground">HQ is reasoning...</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-border">
        {isStreaming && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleCancel}
            className="w-full mb-2 text-[10px] font-mono text-muted-foreground hover:text-foreground py-1 rounded bg-surface-3 hover:bg-surface-4 transition-colors"
          >
            ■ Stop generating
          </motion.button>
        )}
        <div className="flex items-center gap-2 surface-inset rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask HQ Intelligence..."
            className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-foreground placeholder:text-muted-foreground"
            disabled={isStreaming}
          />
          <motion.button
            onClick={handleSend}
            className={`rail-icon w-7 h-7 ${input.trim() && !isStreaming ? 'text-primary' : ''}`}
            disabled={!input.trim() || isStreaming}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Send className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// ─── Inspect ───
const InspectPanel: React.FC = () => (
  <ScrollArea className="h-full custom-scrollbar">
    <div className="p-3 space-y-4">
      <SectionLabel>Selected Entity</SectionLabel>
      <div className="surface-raised rounded-lg p-3 space-y-2.5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span className="text-xs font-mono text-foreground font-medium">Task #2: Generate Draft</span>
        </div>
        <DetailRow label="Status" value="Active" highlight />
        <DetailRow label="Priority" value="P90" />
        <DetailRow label="Agent" value="Planner" />
        <DetailRow label="Dependencies" value="Task #1 ✓" />
        <DetailRow label="Acceptance" value="Schema + ≤500 words" />
        <div className="h-1 bg-surface-1 rounded-full overflow-hidden mt-2">
          <motion.div className="h-full bg-warning rounded-full" initial={{ width: 0 }} animate={{ width: '62%' }} transition={{ duration: 1 }} />
        </div>
        <span className="text-[9px] font-mono text-muted-foreground">Progress: 62%</span>
      </div>

      <SectionLabel>Last Event</SectionLabel>
      <div className="surface-raised rounded-lg p-3 space-y-2">
        <DetailRow label="Type" value="ACTION_EXECUTED" />
        <DetailRow label="Time" value="2.3s ago" />
        <DetailRow label="Hash" value="7f3a...e2b1" mono />
        <DetailRow label="Sequence" value="#42" />
      </div>

      <SectionLabel>Context Refs</SectionLabel>
      <div className="space-y-1">
        {['pinned:constraints', 'memory:schema-spec', 'evidence:e-graph-47'].map(ref => (
          <div key={ref} className="flex items-center gap-2 surface-raised rounded-md px-2.5 py-1.5 interactive-ghost cursor-pointer">
            <ArrowRight className="w-3 h-3 text-primary/50" />
            <span className="text-[10px] font-mono text-foreground">{ref}</span>
          </div>
        ))}
      </div>
    </div>
  </ScrollArea>
);

// ─── Analyze ───
const AnalyzePanel: React.FC = () => {
  const steps = [
    { step: 1, phase: 'analysis', thought: 'Extracted 4 pinned constraints from context memory. Cross-referenced with schema requirements.', confidence: 0.95, agents: ['Planner', 'Researcher'] },
    { step: 2, phase: 'research', thought: 'Queried evidence graph for schema specification. Found JSON output requirement with "result" key.', confidence: 0.92, agents: ['Researcher'] },
    { step: 3, phase: 'synthesis', thought: 'Planned 3-phase verification: schema check → word count → contradiction scan.', confidence: 0.88, agents: ['Verifier', 'Auditor'] },
    { step: 4, phase: 'validation', thought: 'Pre-flight check passed. No constraint violations detected in current plan.', confidence: 0.94, agents: ['Verifier'] },
  ];

  const phaseColors: Record<string, string> = {
    analysis: 'text-info border-info/30',
    research: 'text-success border-success/30',
    synthesis: 'text-accent border-accent/30',
    validation: 'text-warning border-warning/30',
    audit: 'text-destructive border-destructive/30',
  };

  const phaseIcons: Record<string, React.ElementType> = {
    analysis: Cpu,
    research: SearchIcon,
    synthesis: Network,
    validation: CheckCircle2,
    audit: AlertTriangle,
  };

  return (
    <ScrollArea className="h-full custom-scrollbar">
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Reasoning Trace</SectionLabel>
          <span className="badge-live">κ = 92.3%</span>
        </div>

        {steps.map((s, i) => {
          const PhaseIcon = phaseIcons[s.phase] || Cpu;
          return (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="surface-raised rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <PhaseIcon className={`w-3.5 h-3.5 ${phaseColors[s.phase]?.split(' ')[0]}`} />
                <span className="text-[9px] font-mono text-muted-foreground">Step {s.step}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${phaseColors[s.phase] || ''}`}>
                  {s.phase.toUpperCase()}
                </span>
                <span className={`text-[9px] font-mono ml-auto ${s.confidence > 0.9 ? 'text-success' : 'text-warning'}`}>
                  κ={Math.round(s.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">{s.thought}</p>
              {s.agents.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <Bot className="w-3 h-3 text-muted-foreground/50" />
                  {s.agents.map(a => (
                    <span key={a} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-4 text-muted-foreground">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        <div className="divider-h my-3" />
        <SectionLabel>Suggestion</SectionLabel>
        <div className="surface-raised rounded-lg p-3 border-l-2 border-warning">
          <p className="text-xs text-foreground/90 leading-relaxed">
            Consider adding drift detection before synthesis to catch constraint violations earlier. This would improve κ by ~3%.
          </p>
        </div>
      </div>
    </ScrollArea>
  );
};

// ─── Memory ───
const MemoryPanel: React.FC = () => {
  const systems = [
    { name: 'CMC', fullName: 'Context Memory Core', items: 12, tokens: 4200, status: 'active', icon: Database },
    { name: 'SEG', fullName: 'Evidence Graph', items: 47, edges: 128, status: 'active', icon: Network },
    { name: 'HHNI', fullName: 'Tag Hierarchy', items: 128, depth: 4, status: 'indexed', icon: Layers },
    { name: 'VIF', fullName: 'Verification Framework', checks: 3, passed: 3, status: 'passing', icon: CheckCircle2 },
  ];

  return (
    <ScrollArea className="h-full custom-scrollbar">
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>AIMOS Memory Systems</SectionLabel>
          <motion.div
            className="w-2 h-2 rounded-full bg-success"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {systems.map((sys, i) => {
          const SysIcon = sys.icon;
          return (
            <motion.div
              key={sys.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="surface-raised rounded-lg p-3 interactive-ghost cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <SysIcon className="w-4 h-4 text-primary/70" />
                <div className="flex-1">
                  <span className="text-xs font-mono text-foreground font-medium">{sys.name}</span>
                  <span className="text-[9px] font-mono text-muted-foreground ml-2">{sys.fullName}</span>
                </div>
                <span className="badge-live">{sys.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {'items' in sys && <MiniStat label="Items" value={String(sys.items)} />}
                {'tokens' in sys && <MiniStat label="Tokens" value={sys.tokens!.toLocaleString()} />}
                {'edges' in sys && <MiniStat label="Edges" value={String(sys.edges)} />}
                {'depth' in sys && <MiniStat label="Depth" value={String(sys.depth)} />}
                {'checks' in sys && <MiniStat label="Checks" value={`${sys.passed}/${sys.checks}`} />}
              </div>
            </motion.div>
          );
        })}

        <div className="divider-h my-3" />
        <SectionLabel>Recent Memory Ops</SectionLabel>
        {[
          { op: 'STORE', target: 'constraint:schema-json', ago: '12s' },
          { op: 'QUERY', target: 'evidence:word-limit', ago: '28s' },
          { op: 'LINK', target: 'e-graph:47→48', ago: '1m' },
        ].map((op, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="flex items-center gap-2 text-[10px] font-mono py-1"
          >
            <span className="text-primary w-12">{op.op}</span>
            <span className="text-foreground/70 flex-1 truncate">{op.target}</span>
            <span className="text-muted-foreground">{op.ago}</span>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
};

// ─── Shared Helpers ───
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">{children}</div>
);

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

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-surface-4/50 rounded px-2 py-1">
    <div className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">{label}</div>
    <div className="text-[11px] font-mono text-foreground">{value}</div>
  </div>
);

export default RightPanel;
