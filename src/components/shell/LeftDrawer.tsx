// LeftDrawer — Canon §12: "Drawers are latent fields of power"
// Expands from left rail to show page ontology content

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WorldPage, LeftTab } from './types';

interface LeftDrawerProps {
  activeWorld: WorldPage;
  activeTab: LeftTab;
  width: number;
  isOpen: boolean;
}

const LeftDrawer: React.FC<LeftDrawerProps> = ({ activeWorld, activeTab, width, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div
      className="h-full bg-surface-2 border-r border-border flex flex-col overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {/* Drawer Header */}
      <div className="px-3 py-2 border-b border-border flex items-center">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          {activeTab}
        </span>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-3">
          {renderDrawerContent(activeWorld, activeTab)}
        </div>
      </ScrollArea>
    </div>
  );
};

function renderDrawerContent(world: WorldPage, tab: LeftTab): React.ReactNode {
  if (world === 'orchestration') {
    switch (tab) {
      case 'tasks':
        return <TasksList />;
      case 'agents':
        return <AgentsList />;
      case 'context':
        return <ContextTiers />;
      case 'budgets':
        return <BudgetMeters />;
      case 'policies':
        return <PoliciesList />;
      default:
        return <PlaceholderContent label={tab} />;
    }
  }
  return <PlaceholderContent label={tab} />;
}

// ─── Orchestration Drawer Content ───

const TasksList: React.FC = () => {
  const tasks = [
    { id: 1, title: 'Analyze input constraints', status: 'done', priority: 80 },
    { id: 2, title: 'Generate response draft', status: 'active', priority: 90 },
    { id: 3, title: 'Verify output schema', status: 'queued', priority: 70 },
    { id: 4, title: 'Run acceptance checks', status: 'queued', priority: 60 },
    { id: 5, title: 'Emit checkpoint', status: 'blocked', priority: 50 },
  ];

  const statusColors: Record<string, string> = {
    done: 'bg-success/20 text-success',
    active: 'bg-primary/20 text-primary',
    queued: 'bg-muted text-muted-foreground',
    blocked: 'bg-warning/20 text-warning',
    failed: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="space-y-1.5">
      {tasks.map(task => (
        <div
          key={task.id}
          className="surface-raised rounded-md p-2.5 cursor-pointer interactive-ghost group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-foreground truncate flex-1">
              {task.title}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground ml-2">
              P{task.priority}
            </span>
          </div>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${statusColors[task.status]}`}>
            {task.status}
          </span>
        </div>
      ))}
    </div>
  );
};

const AgentsList: React.FC = () => {
  const [agents, setAgents] = React.useState<any[]>([]);
  React.useEffect(() => {
    import('@/lib/agentGenomeService').then(({ fetchAllGenomes }) =>
      fetchAllGenomes().then(setAgents).catch(() => {})
    );
  }, []);

  return (
    <div className="space-y-2">
      {agents.map(agent => (
        <div key={agent.agent_role} className="surface-raised rounded-md p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono text-foreground">{agent.display_name}</span>
            <span className="text-[9px] font-mono text-muted-foreground">
              κ {(agent.avg_kappa * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>{agent.total_tasks_completed} tasks</span>
            <span>{(agent.capabilities || []).length} caps</span>
          </div>
          <div className="h-1 bg-surface-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${agent.avg_confidence * 100}%` }}
            />
          </div>
        </div>
      ))}
      {agents.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-2">Loading genomes...</p>
      )}
    </div>
  );
};

const ContextTiers: React.FC = () => {
  const tiers = [
    { name: 'Pinned', count: 4, tokens: 1200 },
    { name: 'Working Set', count: 8, tokens: 3400 },
    { name: 'Long-term', count: 47, tokens: 12800 },
  ];

  return (
    <div className="space-y-2">
      {tiers.map(tier => (
        <div key={tier.name} className="surface-raised rounded-md p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-foreground">{tier.name}</span>
            <span className="text-[9px] font-mono text-muted-foreground">
              {tier.count} items
            </span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">
            ~{tier.tokens.toLocaleString()} tokens
          </span>
        </div>
      ))}
    </div>
  );
};

const BudgetMeters: React.FC = () => {
  const budgets = [
    { name: 'Iterations', used: 34, max: 100, unit: '' },
    { name: 'Tokens', used: 18200, max: 50000, unit: '' },
    { name: 'Tool Calls', used: 7, max: 20, unit: '' },
    { name: 'Wall Time', used: 45, max: 120, unit: 's' },
  ];

  return (
    <div className="space-y-3">
      {budgets.map(b => {
        const pct = (b.used / b.max) * 100;
        const isHigh = pct > 80;
        const isMid = pct > 50;
        return (
          <div key={b.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {b.name}
              </span>
              <span className={`text-[10px] font-mono ${isHigh ? 'text-destructive' : isMid ? 'text-warning' : 'text-foreground'}`}>
                {b.used.toLocaleString()}{b.unit} / {b.max.toLocaleString()}{b.unit}
              </span>
            </div>
            <div className="h-1.5 bg-surface-1 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isHigh ? 'bg-destructive' : isMid ? 'bg-warning' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PoliciesList: React.FC = () => {
  const policies = [
    { name: 'Autonomy Mode', value: 'Supervised', active: true },
    { name: 'Delete Policy', value: 'Require Approval', active: true },
    { name: 'External Calls', value: 'Blocked', active: false },
    { name: 'Risk Budget', value: '3 / 5 remaining', active: true },
  ];

  return (
    <div className="space-y-2">
      {policies.map(p => (
        <div key={p.name} className="surface-raised rounded-md p-2.5">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            {p.name}
          </div>
          <div className={`text-xs font-mono ${p.active ? 'text-foreground' : 'text-muted-foreground'}`}>
            {p.value}
          </div>
        </div>
      ))}
    </div>
  );
};

const PlaceholderContent: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-xs text-muted-foreground text-center py-8 font-mono">
    {label} content
  </div>
);

export default LeftDrawer;
