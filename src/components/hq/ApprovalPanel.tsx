// ApprovalPanel — AI Action Queue with approval gates and autonomy controls
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Check, X, Shield, ShieldCheck, ShieldAlert, Zap, Clock,
  Brain, Database, Workflow, Settings, ChevronDown, ChevronUp,
  CheckCheck, XCircle, Loader2,
} from 'lucide-react';
import {
  fetchPendingActions, fetchAllActions, approveAction, rejectAction,
  approveAllPending, fetchAutonomySettings, updateAutonomySetting,
  subscribeToActions, type AIAction, type AutonomySettings,
} from '@/lib/autonomyService';

const ACTION_ICONS: Record<string, React.ElementType> = {
  memory_write: Database,
  evolution_proposal: Zap,
  task_create: Workflow,
  config_change: Settings,
  plan_create: Workflow,
  entity_create: Brain,
};

const ACTION_COLORS: Record<string, string> = {
  memory_write: 'text-info',
  evolution_proposal: 'text-warning',
  task_create: 'text-primary',
  config_change: 'text-accent',
  plan_create: 'text-success',
  entity_create: 'text-muted-foreground',
};

const ApprovalPanel: React.FC = () => {
  const [pendingActions, setPendingActions] = useState<AIAction[]>([]);
  const [allActions, setAllActions] = useState<AIAction[]>([]);
  const [settings, setSettings] = useState<AutonomySettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const [pending, all, s] = await Promise.all([
      fetchPendingActions(),
      fetchAllActions(30),
      fetchAutonomySettings(),
    ]);
    setPendingActions(pending);
    setAllActions(all);
    setSettings(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribeToActions(refresh);
    const interval = setInterval(refresh, 10000);
    return () => { unsub(); clearInterval(interval); };
  }, [refresh]);

  const handleApprove = async (id: string) => {
    setProcessingIds(p => new Set(p).add(id));
    const ok = await approveAction(id);
    if (ok) toast.success('Action approved & executed');
    else toast.error('Failed to approve action');
    setProcessingIds(p => { const n = new Set(p); n.delete(id); return n; });
    refresh();
  };

  const handleReject = async (id: string) => {
    setProcessingIds(p => new Set(p).add(id));
    const ok = await rejectAction(id);
    if (ok) toast.info('Action rejected');
    setProcessingIds(p => { const n = new Set(p); n.delete(id); return n; });
    refresh();
  };

  const handleApproveAll = async () => {
    const count = await approveAllPending();
    toast.success(`Approved ${count} actions`);
    refresh();
  };

  const handleToggleSetting = async (key: string, currentValue: any) => {
    const newValue = { ...currentValue, enabled: !currentValue.enabled };
    await updateAutonomySetting(key, newValue);
    refresh();
  };

  const handleSetAutonomyLevel = async (level: string) => {
    if (!settings) return;
    await updateAutonomySetting('global_autonomy_level', {
      ...settings.global_autonomy_level,
      level,
    });
    refresh();
  };

  const autonomyLevel = settings?.global_autonomy_level?.level || 'supervised';
  const AutonomyIcon = autonomyLevel === 'autonomous' ? ShieldCheck : autonomyLevel === 'locked' ? ShieldAlert : Shield;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AutonomyIcon className={`w-5 h-5 ${
            autonomyLevel === 'autonomous' ? 'text-success' : autonomyLevel === 'locked' ? 'text-destructive' : 'text-warning'
          }`} />
          <span className="font-mono text-sm font-bold">AUTONOMY GATE</span>
          {pendingActions.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-warning/20 text-warning text-[10px] font-mono">
              {pendingActions.length} pending
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="h-7 px-2"
        >
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Autonomy Level Selector */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-muted/20 rounded-lg p-3 space-y-3 border border-border">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Global Autonomy Level</div>
                  <div className="flex gap-1">
                    {['locked', 'supervised', 'autonomous'].map(level => (
                      <Button
                        key={level}
                        size="sm"
                        variant={autonomyLevel === level ? 'default' : 'outline'}
                        onClick={() => handleSetAutonomyLevel(level)}
                        className="flex-1 text-xs capitalize h-8"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>

                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-3">Auto-Approve Rules</div>
                  {settings && Object.entries(settings).filter(([k]) => k.startsWith('auto_approve')).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-xs font-mono text-foreground/80">
                        {key.replace('auto_approve_', '').replace(/_/g, ' ')}
                      </span>
                      <Switch
                        checked={(value as any).enabled}
                        onCheckedChange={() => handleToggleSetting(key, value)}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending Actions */}
          {pendingActions.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Pending Approvals
                </span>
                <Button size="sm" variant="outline" onClick={handleApproveAll} className="h-6 text-[10px] px-2">
                  <CheckCheck className="w-3 h-3 mr-1" /> Approve All
                </Button>
              </div>

              <AnimatePresence>
                {pendingActions.map((action, i) => {
                  const Icon = ACTION_ICONS[action.action_type] || Brain;
                  const isProcessing = processingIds.has(action.id);
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-muted/20 rounded-lg p-3 border border-border space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`w-4 h-4 mt-0.5 ${ACTION_COLORS[action.action_type] || 'text-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-mono font-medium text-foreground truncate">{action.title}</div>
                          {action.description && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{action.description}</div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">
                              {action.action_type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground/60">
                              {action.agent_role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(action.id)}
                          disabled={isProcessing}
                          className="flex-1 h-7 text-xs bg-success/20 hover:bg-success/30 text-success border border-success/30"
                        >
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(action.id)}
                          disabled={isProcessing}
                          className="flex-1 h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                        >
                          <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </>
          )}

          {pendingActions.length === 0 && !loading && (
            <div className="text-center py-8">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-success/50" />
              <div className="text-xs font-mono text-muted-foreground">No pending actions</div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">AI actions will appear here for approval</div>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
            </div>
          )}

          {/* History Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full h-7 text-[10px] font-mono text-muted-foreground"
          >
            {showHistory ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            {showHistory ? 'Hide' : 'Show'} History ({allActions.filter(a => a.status !== 'pending').length})
          </Button>

          {showHistory && (
            <div className="space-y-1.5">
              {allActions.filter(a => a.status !== 'pending').slice(0, 20).map(action => {
                const Icon = ACTION_ICONS[action.action_type] || Brain;
                return (
                  <div key={action.id} className="flex items-center gap-2 py-1.5 px-2 rounded bg-muted/10 text-[10px] font-mono">
                    <Icon className="w-3 h-3 text-muted-foreground/60" />
                    <span className="flex-1 truncate text-foreground/70">{action.title}</span>
                    {action.status === 'approved' && <Check className="w-3 h-3 text-success" />}
                    {action.status === 'rejected' && <XCircle className="w-3 h-3 text-destructive" />}
                    {action.status === 'auto_approved' && <Zap className="w-3 h-3 text-warning" />}
                    {action.status === 'executed' && <CheckCheck className="w-3 h-3 text-success" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ApprovalPanel;
