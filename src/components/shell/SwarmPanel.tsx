// SwarmPanel — Agent Swarm Visualization with 4 tabs
// Canon: Cognitive transparency — expose the complete reasoning machinery

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot, Cpu, Network, Search, Database, CheckCircle2,
  AlertTriangle, Activity, TreeDeciduous, Brain, Zap,
  Clock, ArrowRight,
} from 'lucide-react';
import type { SwarmState, AgentRole, ReasoningPhase, GoalNode } from '@/lib/agentSimulator';

type SwarmTab = 'swarm' | 'reason' | 'think' | 'search';

interface SwarmPanelProps {
  state: SwarmState | null;
}

const TAB_DEFS: { id: SwarmTab; label: string; icon: React.ElementType }[] = [
  { id: 'swarm', label: 'Swarm', icon: Bot },
  { id: 'reason', label: 'Reason', icon: TreeDeciduous },
  { id: 'think', label: 'Think', icon: Brain },
  { id: 'search', label: 'Search', icon: Search },
];

const ROLE_COLORS: Record<AgentRole, string> = {
  planner: 'text-info',
  researcher: 'text-success',
  verifier: 'text-warning',
  auditor: 'text-destructive',
  executor: 'text-accent',
  inquisitor: 'text-destructive',
  forecaster: 'text-info',
};

const PHASE_ICONS: Record<ReasoningPhase, React.ElementType> = {
  analysis: Cpu,
  research: Search,
  synthesis: Network,
  validation: CheckCircle2,
  audit: AlertTriangle,
  crucible: Zap,
  forecast: Brain,
};

const PHASE_COLORS: Record<ReasoningPhase, string> = {
  analysis: 'text-info border-info/30',
  research: 'text-success border-success/30',
  synthesis: 'text-accent border-accent/30',
  validation: 'text-warning border-warning/30',
  audit: 'text-destructive border-destructive/30',
  crucible: 'text-destructive border-destructive/30',
  forecast: 'text-info border-info/30',
};

const SYS_COLORS: Record<string, string> = {
  CMC: 'text-info',
  SEG: 'text-success',
  HHNI: 'text-accent',
  VIF: 'text-warning',
};

const SwarmPanel: React.FC<SwarmPanelProps> = ({ state }) => {
  const [tab, setTab] = useState<SwarmTab>('swarm');

  if (!state) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-mono">
        <div className="text-center space-y-2">
          <Bot className="w-6 h-6 mx-auto opacity-30" />
          <p>Agent swarm idle</p>
          <p className="text-[9px] text-muted-foreground/50">Send a message to activate cognitive visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border">
        {TAB_DEFS.map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            onClick={() => setTab(id)}
            className={`tab-button ${tab === id ? 'active' : ''}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Icon className="w-3 h-3" />
            <span>{label}</span>
          </motion.button>
        ))}
        {state.isActive && (
          <motion.div
            className="ml-auto flex items-center gap-1.5"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Activity className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-mono text-primary">LIVE</span>
          </motion.div>
        )}
      </div>

      {/* Confidence bar */}
      <div className="px-3 py-1.5 border-b border-border flex items-center gap-2">
        <span className="text-[9px] font-mono text-muted-foreground">κ</span>
        <div className="flex-1 h-1 bg-surface-4 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${state.overallConfidence * 100}%` }}
            transition={{ duration: 0.3 }}
            style={{ boxShadow: '0 0 6px hsl(120 100% 44% / 0.4)' }}
          />
        </div>
        <span className={`text-[10px] font-mono tabular-nums ${state.overallConfidence > 0.85 ? 'text-success' : 'text-warning'}`}>
          {Math.round(state.overallConfidence * 100)}%
        </span>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.12 }}
            className="h-full"
          >
            {tab === 'swarm' && <SwarmTab state={state} />}
            {tab === 'reason' && <ReasonTab state={state} />}
            {tab === 'think' && <ThinkTab state={state} />}
            {tab === 'search' && <SearchTab state={state} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Swarm Tab ───
const SwarmTab: React.FC<{ state: SwarmState }> = ({ state }) => (
  <ScrollArea className="h-full custom-scrollbar">
    <div className="p-3 space-y-2">
      <Label>Active Agents</Label>
      {state.agents.map((agent, i) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="surface-raised rounded-lg p-2.5 space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <StatusDot status={agent.status} />
            <span className={`text-xs font-mono font-medium ${ROLE_COLORS[agent.role]}`}>
              {agent.name}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground ml-auto uppercase">
              {agent.status}
            </span>
          </div>
          {agent.currentTask && (
            <p className="text-[10px] text-foreground/70 font-mono truncate pl-4">
              {agent.currentTask}
            </p>
          )}
          <div className="flex items-center gap-3 pl-4">
            <span className="text-[9px] font-mono text-muted-foreground">
              κ={Math.round(agent.confidence * 100)}%
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">
              {agent.tokensUsed.toLocaleString()} tok
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  </ScrollArea>
);

// ─── Reason Tab (Goal Hierarchy) ───
const ReasonTab: React.FC<{ state: SwarmState }> = ({ state }) => (
  <ScrollArea className="h-full custom-scrollbar">
    <div className="p-3 space-y-2">
      <Label>Goal Hierarchy (T0-T6)</Label>
      <GoalTreeView node={state.goalTree} depth={0} />
    </div>
  </ScrollArea>
);

const GoalTreeView: React.FC<{ node: GoalNode; depth: number }> = ({ node, depth }) => (
  <div style={{ paddingLeft: depth * 12 }}>
    <motion.div
      initial={{ opacity: 0, x: 4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: depth * 0.05 }}
      className="flex items-center gap-2 py-1"
    >
      <StatusDot status={node.status === 'complete' ? 'complete' : node.status === 'active' ? 'active' : 'idle'} />
      <span className="text-[9px] font-mono text-muted-foreground">T{node.level}</span>
      <span className={`text-[11px] font-mono ${node.status === 'active' ? 'text-primary' : node.status === 'complete' ? 'text-success' : 'text-muted-foreground'}`}>
        {node.label}
      </span>
      <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto">
        {Math.round(node.confidence * 100)}%
      </span>
    </motion.div>
    {node.children.map(c => (
      <GoalTreeView key={c.id} node={c} depth={depth + 1} />
    ))}
  </div>
);

// ─── Think Tab (Reasoning Steps) ───
const ThinkTab: React.FC<{ state: SwarmState }> = ({ state }) => (
  <ScrollArea className="h-full custom-scrollbar">
    <div className="p-3 space-y-2">
      <Label>Reasoning Chain</Label>
      {state.reasoningSteps.length === 0 ? (
        <p className="text-[10px] font-mono text-muted-foreground/50 text-center py-4">Awaiting first reasoning phase...</p>
      ) : (
        state.reasoningSteps.map((step, i) => {
          const PhaseIcon = PHASE_ICONS[step.phase] || Cpu;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="surface-raised rounded-lg p-2.5 space-y-1.5"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <PhaseIcon className={`w-3 h-3 ${PHASE_COLORS[step.phase]?.split(' ')[0]}`} />
                <span className="text-[9px] font-mono text-muted-foreground">#{i + 1}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${PHASE_COLORS[step.phase]}`}>
                  {step.phase.toUpperCase()}
                </span>
                <span className={`text-[9px] font-mono ml-auto ${step.confidence > 0.85 ? 'text-success' : 'text-warning'}`}>
                  κ={Math.round(step.confidence * 100)}%
                </span>
              </div>
              <p className="text-[10px] text-foreground/80 leading-relaxed pl-1">{step.thought}</p>
              <div className="flex items-center gap-1.5">
                {step.agents.map(a => (
                  <span key={a} className={`text-[8px] font-mono px-1 py-0.5 rounded bg-surface-4 ${ROLE_COLORS[a]}`}>
                    {a}
                  </span>
                ))}
                <span className="text-[8px] font-mono text-muted-foreground/40 ml-auto flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> {step.duration}ms
                </span>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  </ScrollArea>
);

// ─── Search Tab (Memory Operations) ───
const SearchTab: React.FC<{ state: SwarmState }> = ({ state }) => (
  <ScrollArea className="h-full custom-scrollbar">
    <div className="p-3 space-y-2">
      <Label>Memory Operations</Label>
      {state.memoryOps.length === 0 ? (
        <p className="text-[10px] font-mono text-muted-foreground/50 text-center py-4">No memory queries yet...</p>
      ) : (
        state.memoryOps.slice(-15).map((op, i) => (
          <motion.div
            key={op.id}
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-2 text-[10px] font-mono py-1 px-1 rounded hover:bg-surface-3 transition-colors"
          >
            <Database className={`w-3 h-3 shrink-0 ${SYS_COLORS[op.system] || 'text-muted-foreground'}`} />
            <span className={`w-8 shrink-0 ${SYS_COLORS[op.system]}`}>{op.system}</span>
            <span className="text-primary w-14 shrink-0">{op.operation}</span>
            <span className="text-foreground/70 flex-1 truncate">{op.target}</span>
            <span className="text-muted-foreground/50 shrink-0">{op.latencyMs}ms</span>
          </motion.div>
        ))
      )}
    </div>
  </ScrollArea>
);

// ─── Shared Components ───
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1">{children}</div>
);

const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  const color = status === 'active' ? 'bg-warning' :
                status === 'complete' ? 'bg-success' :
                status === 'waiting' ? 'bg-info' : 'bg-muted-foreground/30';
  return (
    <motion.span
      className={`w-2 h-2 rounded-full ${color} shrink-0`}
      animate={status === 'active' ? { opacity: [0.5, 1, 0.5] } : {}}
      transition={status === 'active' ? { duration: 1, repeat: Infinity } : {}}
    />
  );
};

export default SwarmPanel;
