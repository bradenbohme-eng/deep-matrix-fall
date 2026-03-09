import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Rocket, Plus, Play, Square, CheckCircle2, XCircle,
  Loader2, RefreshCw, Shield, Target, Layers, Clock, ChevronRight,
  AlertTriangle, Crosshair, Zap, FileCode,
} from 'lucide-react';
import { toast } from 'sonner';
import { getMissionManager, type WorkOrder } from '@/lib/orchestration/missionManager';
import type { AutonomyTier, MissionStatus, ToolClass } from '@/lib/contracts/enums';
import { AutonomyTierLabels } from '@/lib/contracts/enums';

// ─── Mission List ──────────────────────────────────────────────────────────

const MissionsList: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  const [missions, setMissions] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const mgr = getMissionManager();

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await mgr.listMissions(filter === 'all' ? undefined : filter as MissionStatus);
    setMissions(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { refresh(); }, [refresh]);

  const statusIcon = (s: string) => {
    switch (s) {
      case 'running': return <Play className="h-3 w-3 text-primary animate-pulse" />;
      case 'completed': return <CheckCircle2 className="h-3 w-3 text-success" />;
      case 'failed': case 'aborted': return <XCircle className="h-3 w-3 text-destructive" />;
      case 'approved': return <Shield className="h-3 w-3 text-accent" />;
      case 'paused': return <Square className="h-3 w-3 text-warning" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const tierBadge = (t: number) => {
    const colors = ['bg-muted/40', 'bg-info/20 text-info', 'bg-warning/20 text-warning', 'bg-primary/20 text-primary'];
    return <Badge className={`text-[10px] ${colors[t] || colors[0]}`}>T{t}</Badge>;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-muted/30 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="aborted">Aborted</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)]">
        {missions.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Rocket className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">No missions found</p>
            <p className="text-xs mt-1">Create a mission to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {missions.map((m: any) => {
              const steps = (m.steps || []) as any[];
              const completedSteps = steps.filter((s: any) => s.status === 'completed').length;
              const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

              return (
                <Card
                  key={m.id}
                  className="border-border bg-card/60 hover:bg-card/80 transition-colors cursor-pointer"
                  onClick={() => onSelect(m.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {statusIcon(m.status)}
                          <span className="text-xs font-medium truncate">{m.title}</span>
                          {tierBadge(m.autonomy_tier ?? 0)}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{m.objective}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 flex-1">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {completedSteps}/{steps.length}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/50">
                            {m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// ─── Mission Detail ────────────────────────────────────────────────────────

const MissionDetail: React.FC<{ missionId: string; onBack: () => void }> = ({ missionId, onBack }) => {
  const [mission, setMission] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const mgr = getMissionManager();

  const refresh = useCallback(async () => {
    setLoading(true);
    const [m, wo] = await Promise.all([
      mgr.getMission(missionId),
      mgr.getWorkOrders(missionId),
    ]);
    setMission(m);
    setWorkOrders(wo);
    setLoading(false);
  }, [missionId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleApprove = async () => {
    setActing(true);
    await mgr.approveMission(missionId);
    toast.success('Mission approved');
    refresh();
    setActing(false);
  };

  const handleStart = async () => {
    setActing(true);
    await mgr.startMission(missionId);
    toast.success('Mission started');
    refresh();
    setActing(false);
  };

  const handleAbort = async () => {
    setActing(true);
    await mgr.abortMission(missionId, 'Aborted by operator');
    toast.success('Mission aborted');
    refresh();
    setActing(false);
  };

  const handleGenerateWO = async () => {
    setActing(true);
    const wo = await mgr.generateWorkOrder(missionId, 'executor');
    if (wo) toast.success(`Work order ${wo.id.slice(0, 12)}... created`);
    else toast.error('Failed to generate work order');
    refresh();
    setActing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Mission not found</p>
        <Button variant="ghost" size="sm" onClick={onBack} className="mt-2">Back</Button>
      </div>
    );
  }

  const m = mission as any;
  const steps = (m.steps || []) as any[];
  const completedSteps = steps.filter((s: any) => s.status === 'completed').length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-bold truncate flex-1">{m.title}</h2>
        <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
        <Badge className="text-[10px] bg-muted/40">T{m.autonomy_tier ?? 0}</Badge>
      </div>

      <Card className="border-border bg-card/50">
        <CardContent className="p-3 space-y-2">
          <p className="text-xs text-foreground/80">{m.objective}</p>
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-[10px] font-mono text-muted-foreground">{completedSteps}/{steps.length} steps</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(m.allowed_tools || []).map((t: string) => (
              <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {m.status === 'draft' && (
              <Button size="sm" className="h-7 text-xs bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30" onClick={handleApprove} disabled={acting}>
                <Shield className="h-3 w-3 mr-1" /> Approve
              </Button>
            )}
            {m.status === 'approved' && (
              <Button size="sm" className="h-7 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30" onClick={handleStart} disabled={acting}>
                <Play className="h-3 w-3 mr-1" /> Start
              </Button>
            )}
            {m.status === 'running' && (
              <>
                <Button size="sm" className="h-7 text-xs bg-info/20 text-info hover:bg-info/30 border border-info/30" onClick={handleGenerateWO} disabled={acting}>
                  <Zap className="h-3 w-3 mr-1" /> Generate Work Order
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={handleAbort} disabled={acting}>
                  <Square className="h-3 w-3 mr-1" /> Abort
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Mission Steps</h3>
        <div className="space-y-1">
          {steps.map((s: any, i: number) => (
            <div key={s.id || i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/20 border border-border/50">
              <span className="text-[10px] font-mono text-muted-foreground w-5">{i + 1}</span>
              {s.status === 'completed' ? <CheckCircle2 className="h-3 w-3 text-success shrink-0" /> :
               s.status === 'active' ? <Play className="h-3 w-3 text-primary animate-pulse shrink-0" /> :
               s.status === 'failed' ? <XCircle className="h-3 w-3 text-destructive shrink-0" /> :
               <Clock className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
              <span className="text-[10px] text-foreground/80 truncate flex-1">{s.actionSummary}</span>
              {s.confidence != null && (
                <span className="text-[9px] font-mono text-muted-foreground">κ{s.confidence.toFixed(2)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Work Orders */}
      {workOrders.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Work Orders</h3>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1">
              {workOrders.map((wo) => (
                <Card key={wo.id} className="border-border bg-card/40">
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-3 w-3 text-info" />
                        <span className="text-[10px] font-mono truncate max-w-[120px]">{wo.id}</span>
                        <Badge variant="outline" className="text-[9px]">{wo.assignedAgent}</Badge>
                      </div>
                      <Badge
                        variant={wo.status === 'completed' ? 'default' : wo.status === 'failed' ? 'destructive' : 'secondary'}
                        className="text-[9px]"
                      >
                        {wo.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-1">{wo.objective}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Budget & Constraints */}
      <div className="grid grid-cols-2 gap-2">
        {m.budget_limits && Object.keys(m.budget_limits).length > 0 && (
          <Card className="border-border bg-card/40">
            <CardContent className="p-2">
              <h4 className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Budget</h4>
              {Object.entries(m.budget_limits).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono">{String(v)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {(m.stop_conditions || []).length > 0 && (
          <Card className="border-border bg-card/40">
            <CardContent className="p-2">
              <h4 className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Stop Conditions</h4>
              {(m.stop_conditions as string[]).map((c, i) => (
                <p key={i} className="text-[10px] text-destructive/80">• {c}</p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// ─── Create Mission Dialog ─────────────────────────────────────────────────

const CreateMissionDialog: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [tier, setTier] = useState<string>('0');
  const [stepsText, setStepsText] = useState('');
  const [tools, setTools] = useState<string>('read,compute');
  const mgr = getMissionManager();

  const handleCreate = async () => {
    if (!title || !objective) return;
    setCreating(true);

    const steps = stepsText.split('\n').filter(s => s.trim()).map(s => ({ actionSummary: s.trim() }));
    const allowedTools = tools.split(',').map(t => t.trim()).filter(Boolean) as ToolClass[];

    const id = await mgr.createMission({
      title,
      objective,
      autonomyTier: Number(tier) as AutonomyTier,
      allowedTools,
      forbiddenActions: [],
      budgetLimits: { maxTokens: 50000, maxToolCalls: 100, maxDurationMs: 300000 },
      stopConditions: ['Budget exhausted', 'Critical error detected'],
      escalationConditions: ['Confidence below 0.3', 'Destructive action requested'],
      successMetrics: ['All steps completed with κ > 0.7'],
      steps: steps.length > 0 ? steps : [{ actionSummary: 'Execute objective' }],
      rollbackPlan: 'Revert to last known good state',
    });

    if (id) {
      toast.success('Mission created');
      setOpen(false);
      setTitle(''); setObjective(''); setStepsText('');
      onCreated();
    } else {
      toast.error('Failed to create mission');
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1.5 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
          <Plus className="h-3 w-3" /> New Mission
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" /> Create Mission
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Mission title" className="h-8 text-xs mt-1 bg-muted/30" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Objective</label>
            <Textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="What should this mission accomplish?" className="text-xs mt-1 bg-muted/30 min-h-[60px]" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Autonomy Tier</label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="h-8 text-xs mt-1 bg-muted/30 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {([0, 1, 2, 3] as AutonomyTier[]).map(t => (
                  <SelectItem key={t} value={String(t)}>
                    <span className="text-xs">T{t}: {AutonomyTierLabels[t].split('—')[1]?.trim() || AutonomyTierLabels[t]}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Allowed Tools (comma-separated)</label>
            <Input value={tools} onChange={e => setTools(e.target.value)} placeholder="read,write,compute" className="h-8 text-xs mt-1 bg-muted/30" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Steps (one per line)</label>
            <Textarea value={stepsText} onChange={e => setStepsText(e.target.value)} placeholder={"Analyze codebase\nGenerate plan\nExecute changes\nVerify results"} className="text-xs mt-1 bg-muted/30 min-h-[80px] font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={creating || !title || !objective}>
            {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Rocket className="h-3 w-3 mr-1" />}
            Create Mission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Tool Routes Tab ───────────────────────────────────────────────────────

const ToolRoutesTab: React.FC = () => {
  const router = getMissionManager().getToolRouter();
  const routes = router.getAllRoutes();

  const riskColor = (r: string) => {
    switch (r) {
      case 'minimal': return 'bg-muted/30 text-muted-foreground';
      case 'low': return 'bg-success/20 text-success';
      case 'moderate': return 'bg-warning/20 text-warning';
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'critical': return 'bg-destructive/30 text-destructive';
      default: return 'bg-muted/30';
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-1">
        {routes.map(r => (
          <div key={r.toolName} className="flex items-center gap-3 px-3 py-2 rounded bg-muted/10 border border-border/50">
            <Crosshair className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-mono flex-1">{r.toolName}</span>
            <Badge variant="outline" className="text-[9px]">{r.toolClass}</Badge>
            <Badge className={`text-[9px] border ${riskColor(r.riskClass)}`}>{r.riskClass}</Badge>
            <span className="text-[9px] text-muted-foreground">max {r.maxCallsPerMission}</span>
            <div className="flex gap-0.5">
              {([0, 1, 2, 3] as AutonomyTier[]).map(t => (
                <span
                  key={t}
                  className={`text-[8px] w-4 h-4 rounded flex items-center justify-center ${
                    r.requiresApproval(t) ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                  }`}
                  title={`T${t}: ${r.requiresApproval(t) ? 'Requires approval' : 'Auto-approved'}`}
                >
                  T{t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────

const MissionControl: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-bold tracking-wide">Mission Control</h1>
            <Badge variant="outline" className="text-[10px] tracking-widest">STAGE 4</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CreateMissionDialog onCreated={() => setRefreshKey(k => k + 1)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        <Tabs defaultValue="missions" className="h-full flex flex-col">
          <TabsList className="bg-muted/30 border border-border">
            <TabsTrigger value="missions" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Target className="h-3.5 w-3.5" />
              Missions
            </TabsTrigger>
            <TabsTrigger value="routes" className="text-xs gap-1.5 data-[state=active]:bg-accent/10 data-[state=active]:text-accent">
              <Crosshair className="h-3.5 w-3.5" />
              Tool Routes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="missions" className="flex-1 mt-3 overflow-hidden">
            {selectedMission ? (
              <MissionDetail missionId={selectedMission} onBack={() => setSelectedMission(null)} />
            ) : (
              <MissionsList key={refreshKey} onSelect={setSelectedMission} />
            )}
          </TabsContent>
          <TabsContent value="routes" className="flex-1 mt-3 overflow-hidden">
            <ToolRoutesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MissionControl;
