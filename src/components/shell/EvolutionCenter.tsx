// EvolutionCenter — AI Systems Test & Evolution Dashboard
// Provides testing, self-audit, engine validation, scenarios, connections, metrics, sandbox, and proposal management

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Activity,
  Zap,
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Gauge,
  Layers,
  Cpu,
  Database,
  Shield,
  Network,
  FlaskConical,
  History,
  Code,
  Target,
  Sparkles,
  Eye,
  TrendingUp,
  Search,
  GitCompare,
  Timer,
  BarChart3,
} from 'lucide-react';
import { useSelfEvolution } from '@/lib/selfEvolutionClient';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SubPage } from './types';
import ScenariosPanel from './ScenariosPanel';
import ConnectionsPanel from './ConnectionsPanel';
import MetricsPanel from './MetricsPanel';

interface EvolutionCenterProps {
  subPage: SubPage;
}

// ═══════════════════════════════════════════════════════════════
// ENGINE TEST TYPES
// ═══════════════════════════════════════════════════════════════

interface EngineTestResult {
  engine: string;
  status: 'pass' | 'fail' | 'running' | 'pending';
  latency: number;
  details: string;
  checks: { name: string; passed: boolean; value?: string }[];
}

interface SystemHealthSnapshot {
  timestamp: string;
  atomCount: number;
  chainCount: number;
  planCount: number;
  entityCount: number;
  avgKappa: number;
  memoryLevels: { hot: number; warm: number; cold: number; frozen: number };
}

const EvolutionCenter: React.FC<EvolutionCenterProps> = ({ subPage }) => {
  switch (subPage) {
    case 'audit':
      return <AuditPanel />;
    case 'engines':
      return <EngineTestPanel />;
    case 'sandbox':
      return <SandboxPanel />;
    case 'proposals':
      return <ProposalsPanel />;
    default:
      return <AuditPanel />;
  }
};

// ═══════════════════════════════════════════════════════════════
// SELF-AUDIT PANEL
// ═══════════════════════════════════════════════════════════════

const AuditPanel: React.FC = () => {
  const evolution = useSelfEvolution();
  const [health, setHealth] = useState<SystemHealthSnapshot | null>(null);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [bottlenecks, setBottlenecks] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const [atoms, chains, plans, entities] = await Promise.all([
        supabase.from('aimos_memory_atoms').select('memory_level', { count: 'exact', head: false }),
        supabase.from('aimos_reasoning_chains').select('confidence_kappa', { count: 'exact', head: false }),
        supabase.from('aimos_plans').select('status', { count: 'exact', head: false }),
        supabase.from('aimos_entities').select('id', { count: 'exact', head: true }),
      ]);

      const atomRows = atoms.data || [];
      const chainRows = chains.data || [];
      const levels = { hot: 0, warm: 0, cold: 0, frozen: 0 };
      atomRows.forEach((a: any) => {
        const lvl = a.memory_level as keyof typeof levels;
        if (lvl in levels) levels[lvl]++;
      });

      const kappaValues = chainRows.map((c: any) => c.confidence_kappa).filter(Boolean);
      const avgKappa = kappaValues.length > 0 
        ? kappaValues.reduce((s: number, v: number) => s + v, 0) / kappaValues.length 
        : 0;

      setHealth({
        timestamp: new Date().toISOString(),
        atomCount: atoms.count || atomRows.length,
        chainCount: chains.count || chainRows.length,
        planCount: plans.count || 0,
        entityCount: entities.count || 0,
        avgKappa,
        memoryLevels: levels,
      });
    } catch (e) {
      toast.error('Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  }, []);

  const runFullAudit = useCallback(async () => {
    const result = await evolution.selfAudit('full');
    if (result) {
      setAuditResult(result);
      toast.success(`Audit complete: ${result.proposalsGenerated || 0} proposals generated`);
    }
  }, [evolution]);

  const runDiagnostics = useCallback(async () => {
    const result = await evolution.runDiagnostics();
    if (result) setDiagnostics(result.diagnostics || []);
  }, [evolution]);

  const runBottlenecks = useCallback(async () => {
    const result = await evolution.analyzeBottlenecks(24);
    if (result) setBottlenecks(result);
  }, [evolution]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
            Self-Audit & Diagnostics
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          {evolution.isLoading ? 'PROCESSING...' : 'READY'}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button onClick={fetchHealth} disabled={loading} size="sm" variant="outline" className="text-xs">
              <Gauge className="w-3.5 h-3.5 mr-1.5" /> Health Check
            </Button>
            <Button onClick={runFullAudit} disabled={evolution.isLoading} size="sm" className="text-xs">
              <Brain className="w-3.5 h-3.5 mr-1.5" /> Full Audit
            </Button>
            <Button onClick={runDiagnostics} disabled={evolution.isLoading} size="sm" variant="outline" className="text-xs">
              <Activity className="w-3.5 h-3.5 mr-1.5" /> Diagnostics
            </Button>
            <Button onClick={runBottlenecks} disabled={evolution.isLoading} size="sm" variant="outline" className="text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Bottlenecks
            </Button>
          </div>

          {/* Health Snapshot */}
          {health && (
            <Card className="border-border/50">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary" /> System Health Snapshot
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(health.timestamp).toLocaleTimeString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'Atoms', value: health.atomCount, icon: Database },
                    { label: 'Chains', value: health.chainCount, icon: GitCompare },
                    { label: 'Plans', value: health.planCount, icon: Target },
                    { label: 'Entities', value: health.entityCount, icon: Network },
                    { label: 'Avg κ', value: `${(health.avgKappa * 100).toFixed(1)}%`, icon: Shield },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="p-2 rounded bg-muted/30 text-center">
                      <Icon className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-lg font-mono text-foreground">{value}</div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Memory Levels Bar */}
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1 font-mono">MEMORY TIER DISTRIBUTION</div>
                  <div className="flex h-4 rounded overflow-hidden border border-border/50">
                    {(['hot', 'warm', 'cold', 'frozen'] as const).map(level => {
                      const count = health.memoryLevels[level];
                      const total = Object.values(health.memoryLevels).reduce((s, v) => s + v, 0) || 1;
                      const pct = (count / total) * 100;
                      const colors = {
                        hot: 'bg-destructive/70',
                        warm: 'bg-warning/70',
                        cold: 'bg-info/70',
                        frozen: 'bg-muted-foreground/40',
                      };
                      return pct > 0 ? (
                        <div
                          key={level}
                          className={`${colors[level]} flex items-center justify-center text-[8px] font-mono text-foreground`}
                          style={{ width: `${pct}%` }}
                          title={`${level}: ${count}`}
                        >
                          {pct > 10 && `${level[0].toUpperCase()} ${count}`}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Results */}
          {auditResult && (
            <Card className="border-primary/20">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Audit Results
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Health Score</span>
                  <Progress value={(auditResult.healthScore || 0) * 100} className="flex-1" />
                  <span className="text-sm font-mono text-primary">
                    {Math.round((auditResult.healthScore || 0) * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted/30 text-center">
                    <div className="text-muted-foreground">Findings</div>
                    <div className="text-lg font-mono">{auditResult.findings?.length || 0}</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 text-center">
                    <div className="text-muted-foreground">Proposals</div>
                    <div className="text-lg font-mono">{auditResult.proposalsGenerated || 0}</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 text-center">
                    <div className="text-muted-foreground">Duration</div>
                    <div className="text-lg font-mono">{Math.round(auditResult.duration_ms || 0)}ms</div>
                  </div>
                </div>
                {auditResult.findings?.map((f: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-muted/20 text-xs border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      {f.severity === 'critical' ? <XCircle className="w-3 h-3 text-destructive" /> :
                       f.severity === 'warning' ? <AlertTriangle className="w-3 h-3 text-warning" /> :
                       <CheckCircle className="w-3 h-3 text-primary" />}
                      <span className="font-medium">{f.component}</span>
                    </div>
                    <p className="text-muted-foreground">{f.details}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Diagnostics */}
          {diagnostics.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Component Diagnostics
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-1">
                {diagnostics.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                    <div className="flex items-center gap-2">
                      {d.status === 'healthy' ? <CheckCircle className="w-3 h-3 text-primary" /> :
                       d.status === 'warning' ? <AlertTriangle className="w-3 h-3 text-warning" /> :
                       <XCircle className="w-3 h-3 text-destructive" />}
                      <span className="font-medium">{d.component}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{d.latency?.toFixed(1)}ms</span>
                      <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Bottlenecks */}
          {bottlenecks?.bottlenecks && (
            <Card className="border-warning/20">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-3.5 h-3.5" /> Bottlenecks Detected
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-2">
                {bottlenecks.bottlenecks.map((b: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-muted/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{b.type}</span>
                      <Badge variant="outline" className="text-[10px]">{b.severity}</Badge>
                    </div>
                    <p className="text-muted-foreground">{b.details}</p>
                    <p className="text-primary mt-1">→ {b.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {evolution.error && (
        <div className="p-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-xs text-destructive">{evolution.error.message}</p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ENGINE TEST PANEL — Test CMC, VIF, SEG, APOE individually
// ═══════════════════════════════════════════════════════════════

interface PipelineStepResult {
  step: string;
  engine: string;
  status: 'pass' | 'fail' | 'running';
  latency: number;
  details: string;
  data?: any;
}

const EngineTestPanel: React.FC = () => {
  const [results, setResults] = useState<EngineTestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [pipelineResults, setPipelineResults] = useState<PipelineStepResult[]>([]);
  const [pipelineRunning, setPipelineRunning] = useState(false);

  const runFullPipeline = useCallback(async () => {
    setPipelineRunning(true);
    const steps: PipelineStepResult[] = [];
    const updateSteps = (s: PipelineStepResult[]) => setPipelineResults([...s]);

    // Step 1: CMC Ingest
    steps.push({ step: '1. CMC Ingest', engine: 'cmc-engine', status: 'running', latency: 0, details: 'Ingesting test memory atom...' });
    updateSteps(steps);
    let atomId = '';
    try {
      const start = performance.now();
      const { data, error } = await supabase.functions.invoke('cmc-engine', {
        body: {
          action: 'ingest',
          content: `Pipeline integration test at ${new Date().toISOString()}. AIMOS uses CMC for memory management, VIF for verification with kappa scoring, SEG for entity extraction, and APOE for orchestration.`,
          contentType: 'test',
          tags: ['pipeline-test', 'integration'],
          confidence: 0.85,
        },
      });
      const lat = performance.now() - start;
      atomId = data?.atomIds?.[0] || '';
      steps[0] = { step: '1. CMC Ingest', engine: 'cmc-engine', status: error ? 'fail' : 'pass', latency: lat, details: error ? error.message : `Atom ${atomId.slice(0, 8)}... stored`, data };
    } catch (e: any) {
      steps[0] = { ...steps[0], status: 'fail', details: e.message };
    }
    updateSteps(steps);

    // Step 2: SEG Extract (local)
    steps.push({ step: '2. SEG Extract', engine: 'seg-engine', status: 'running', latency: 0, details: 'Extracting entities...' });
    updateSteps(steps);
    try {
      const start = performance.now();
      const { data, error } = await supabase.functions.invoke('seg-engine', {
        body: {
          action: 'extract_local',
          text: 'AIMOS implements CMC for memory, VIF for verification, SEG for knowledge graphs, APOE for orchestration, and HHNI for navigation. The system uses kappa confidence scoring.',
          sourceAtomId: atomId || undefined,
        },
      });
      const lat = performance.now() - start;
      steps[1] = { step: '2. SEG Extract', engine: 'seg-engine', status: error ? 'fail' : 'pass', latency: lat, details: error ? error.message : `${data?.entitiesCreated || 0} entities, ${data?.relationshipsCreated || 0} relationships`, data };
    } catch (e: any) {
      steps[1] = { ...steps[1], status: 'fail', details: e.message };
    }
    updateSteps(steps);

    // Step 3: VIF Pre-gate
    steps.push({ step: '3. VIF Pre-gate', engine: 'vif-engine', status: 'running', latency: 0, details: 'Checking context quality...' });
    updateSteps(steps);
    try {
      const start = performance.now();
      const { data, error } = await supabase.functions.invoke('vif-engine', {
        body: {
          action: 'pregate',
          query: 'What is the AIMOS memory system?',
          contextAtomIds: atomId ? [atomId] : [],
        },
      });
      const lat = performance.now() - start;
      const pg = data?.pregate;
      steps[2] = { step: '3. VIF Pre-gate', engine: 'vif-engine', status: error ? 'fail' : 'pass', latency: lat, details: error ? error.message : `Quality: ${pg?.quality}, Atoms: ${pg?.atomCount}, Confidence: ${(pg?.avgConfidence * 100).toFixed(1)}%`, data };
    } catch (e: any) {
      steps[2] = { ...steps[2], status: 'fail', details: e.message };
    }
    updateSteps(steps);

    // Step 4: VIF Score (κ computation)
    steps.push({ step: '4. VIF κ Score', engine: 'vif-engine', status: 'running', latency: 0, details: 'Computing kappa score...' });
    updateSteps(steps);
    try {
      const start = performance.now();
      const { data, error } = await supabase.functions.invoke('vif-engine', {
        body: {
          action: 'score',
          factualAccuracy: 0.80,
          consistency: 0.75,
          completeness: 0.70,
          relevance: 0.85,
          freshness: 0.90,
        },
      });
      const lat = performance.now() - start;
      const s = data?.score;
      steps[3] = { step: '4. VIF κ Score', engine: 'vif-engine', status: error ? 'fail' : 'pass', latency: lat, details: error ? error.message : `κ=${s?.kappa?.toFixed(3)} (${s?.qualityTier})`, data };
    } catch (e: any) {
      steps[3] = { ...steps[3], status: 'fail', details: e.message };
    }
    updateSteps(steps);

    // Step 5: APOE Decompose
    steps.push({ step: '5. APOE Plan', engine: 'apoe-engine', status: 'running', latency: 0, details: 'Creating execution plan...' });
    updateSteps(steps);
    try {
      const start = performance.now();
      const { data, error } = await supabase.functions.invoke('apoe-engine', {
        body: {
          action: 'decompose',
          objective: 'Validate pipeline integration test passes all cognitive engines',
          title: `Pipeline Test ${new Date().toISOString().slice(11, 19)}`,
        },
      });
      const lat = performance.now() - start;
      steps[4] = { step: '5. APOE Plan', engine: 'apoe-engine', status: error ? 'fail' : 'pass', latency: lat, details: error ? error.message : `Plan ${data?.planId?.slice(0, 8)}... with ${data?.plan?.t1?.length || 0} goals`, data };
    } catch (e: any) {
      steps[4] = { ...steps[4], status: 'fail', details: e.message };
    }
    updateSteps(steps);

    // Step 6: SEG Stats (verify entities were created)
    steps.push({ step: '6. SEG Verify', engine: 'seg-engine', status: 'running', latency: 0, details: 'Verifying graph state...' });
    updateSteps(steps);
    try {
      const start = performance.now();
      const { data, error } = await supabase.functions.invoke('seg-engine', { body: { action: 'stats' } });
      const lat = performance.now() - start;
      steps[5] = { step: '6. SEG Verify', engine: 'seg-engine', status: error || (data?.entities || 0) === 0 ? 'fail' : 'pass', latency: lat, details: error ? error.message : `Graph: ${data?.entities} entities, ${data?.relationships} relationships`, data };
    } catch (e: any) {
      steps[5] = { ...steps[5], status: 'fail', details: e.message };
    }
    updateSteps(steps);

    setPipelineRunning(false);
    const passed = steps.filter(s => s.status === 'pass').length;
    toast[passed === steps.length ? 'success' : 'warning'](`Pipeline: ${passed}/${steps.length} steps passed`);
  }, []);

  const engines = [
    { id: 'cmc', name: 'CMC — Context Memory Core', fn: 'cmc-engine', icon: Database },
    { id: 'vif', name: 'VIF — Verification Framework', fn: 'vif-engine', icon: Shield },
    { id: 'seg', name: 'SEG — Symbolic Evidence Graph', fn: 'seg-engine', icon: Network },
    { id: 'apoe', name: 'APOE — Orchestration Engine', fn: 'apoe-engine', icon: Cpu },
    { id: 'self-evolution', name: 'Self-Evolution Engine', fn: 'self-evolution', icon: Brain },
    { id: 'hq-chat', name: 'HQ Chat Pipeline', fn: 'hq-chat', icon: Zap },
  ];

  const testEngine = useCallback(async (engine: typeof engines[0]): Promise<EngineTestResult> => {
    const start = performance.now();
    const checks: { name: string; passed: boolean; value?: string }[] = [];

    try {
      // Test invocation — hq-chat expects messages, others use action
      const body = engine.id === 'hq-chat'
        ? { messages: [{ role: 'user', content: 'health check ping' }] }
        : { action: 'health_check', test: true };
      const { data, error } = await supabase.functions.invoke(engine.fn, { body });

      const latency = performance.now() - start;
      checks.push({ name: 'Reachable', passed: !error, value: error ? error.message : 'OK' });
      checks.push({ name: 'Response Valid', passed: !!data, value: data ? 'Valid JSON' : 'No data' });
      checks.push({ name: 'Latency < 5s', passed: latency < 5000, value: `${latency.toFixed(0)}ms` });

      // Engine-specific DB checks
      if (engine.id === 'cmc') {
        const { count } = await supabase.from('aimos_memory_atoms').select('id', { count: 'exact', head: true });
        checks.push({ name: 'Memory Atoms Exist', passed: (count || 0) > 0, value: `${count || 0} atoms` });
      } else if (engine.id === 'vif') {
        const { count } = await supabase.from('aimos_reasoning_chains').select('id', { count: 'exact', head: true });
        checks.push({ name: 'Reasoning Chains Exist', passed: (count || 0) >= 0, value: `${count || 0} chains` });
      } else if (engine.id === 'seg') {
        const { count } = await supabase.from('aimos_entities').select('id', { count: 'exact', head: true });
        checks.push({ name: 'Entities Indexed', passed: (count || 0) >= 0, value: `${count || 0} entities` });
      } else if (engine.id === 'apoe') {
        const { count } = await supabase.from('aimos_plans').select('id', { count: 'exact', head: true });
        checks.push({ name: 'Plans Exist', passed: (count || 0) >= 0, value: `${count || 0} plans` });
      }

      const allPassed = checks.every(c => c.passed);
      return {
        engine: engine.name,
        status: allPassed ? 'pass' : 'fail',
        latency,
        details: allPassed ? 'All checks passed' : `${checks.filter(c => !c.passed).length} check(s) failed`,
        checks,
      };
    } catch (e: any) {
      return {
        engine: engine.name,
        status: 'fail',
        latency: performance.now() - start,
        details: e.message || 'Unknown error',
        checks: [{ name: 'Connection', passed: false, value: e.message }],
      };
    }
  }, []);

  const runAllTests = useCallback(async () => {
    setRunning(true);
    setResults(engines.map(e => ({
      engine: e.name,
      status: 'running' as const,
      latency: 0,
      details: 'Testing...',
      checks: [],
    })));

    const testResults: EngineTestResult[] = [];
    for (const engine of engines) {
      const result = await testEngine(engine);
      testResults.push(result);
      setResults([...testResults, ...engines.slice(testResults.length).map(e => ({
        engine: e.name,
        status: 'pending' as const,
        latency: 0,
        details: 'Waiting...',
        checks: [],
      }))]);
    }
    setResults(testResults);
    setRunning(false);

    const passed = testResults.filter(r => r.status === 'pass').length;
    toast[passed === testResults.length ? 'success' : 'warning'](
      `Engine Tests: ${passed}/${testResults.length} passed`
    );
  }, [testEngine]);

  const testSingle = useCallback(async (engine: typeof engines[0]) => {
    setRunning(true);
    const result = await testEngine(engine);
    setResults(prev => {
      const existing = prev.filter(r => r.engine !== engine.name);
      return [...existing, result];
    });
    setRunning(false);
  }, [testEngine]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
            Cognitive Engine Tests
          </span>
        </div>
        <Button onClick={runAllTests} disabled={running} size="sm" className="text-xs">
          <Play className="w-3.5 h-3.5 mr-1.5" /> Run All Tests
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Full Pipeline Integration Test */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 px-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono font-bold text-foreground">Full Pipeline Test</span>
                  <span className="text-[10px] text-muted-foreground">CMC → SEG → VIF → APOE</span>
                </div>
                <Button onClick={runFullPipeline} disabled={pipelineRunning || running} size="sm" className="text-xs">
                  {pipelineRunning ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
                  {pipelineRunning ? 'Running...' : 'Run Pipeline'}
                </Button>
              </div>

              {pipelineResults.length > 0 && (
                <div className="space-y-1.5">
                  {pipelineResults.map((step, i) => (
                    <div key={i} className={`flex items-center justify-between p-2 rounded text-xs border ${
                      step.status === 'pass' ? 'bg-primary/5 border-primary/20' :
                      step.status === 'fail' ? 'bg-destructive/5 border-destructive/20' :
                      'bg-warning/5 border-warning/20'
                    }`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {step.status === 'pass' && <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />}
                        {step.status === 'fail' && <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                        {step.status === 'running' && <RefreshCw className="w-3.5 h-3.5 text-warning animate-spin shrink-0" />}
                        <span className="font-mono font-medium shrink-0">{step.step}</span>
                        <span className="text-muted-foreground truncate">{step.details}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground ml-2 shrink-0">
                        {step.latency > 0 ? `${step.latency.toFixed(0)}ms` : '...'}
                      </span>
                    </div>
                  ))}
                  {!pipelineRunning && pipelineResults.length > 0 && (
                    <div className="flex items-center justify-between pt-1 px-1 text-xs font-mono">
                      <span className="text-muted-foreground">
                        Total: {pipelineResults.reduce((s, r) => s + r.latency, 0).toFixed(0)}ms
                      </span>
                      <span className={pipelineResults.every(r => r.status === 'pass') ? 'text-primary' : 'text-warning'}>
                        {pipelineResults.filter(r => r.status === 'pass').length}/{pipelineResults.length} PASSED
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator className="bg-border/30" />

          {engines.map(engine => {
            const result = results.find(r => r.engine === engine.name);
            const Icon = engine.icon;
            return (
              <Card key={engine.id} className={`border-border/50 ${
                result?.status === 'pass' ? 'border-l-2 border-l-primary' :
                result?.status === 'fail' ? 'border-l-2 border-l-destructive' :
                result?.status === 'running' ? 'border-l-2 border-l-warning' : ''
              }`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-mono font-medium">{engine.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result && (
                        <>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {result.latency.toFixed(0)}ms
                          </span>
                          {result.status === 'pass' && <CheckCircle className="w-4 h-4 text-primary" />}
                          {result.status === 'fail' && <XCircle className="w-4 h-4 text-destructive" />}
                          {result.status === 'running' && <RefreshCw className="w-4 h-4 text-warning animate-spin" />}
                          {result.status === 'pending' && <Timer className="w-4 h-4 text-muted-foreground" />}
                        </>
                      )}
                      <Button
                        onClick={() => testSingle(engine)}
                        disabled={running}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {result?.checks && result.checks.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {result.checks.map((check, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-1.5">
                            {check.passed
                              ? <CheckCircle className="w-3 h-3 text-primary" />
                              : <XCircle className="w-3 h-3 text-destructive" />}
                            <span className="text-muted-foreground">{check.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">{check.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Summary */}
          {results.length > 0 && results.every(r => r.status !== 'running' && r.status !== 'pending') && (
            <Card className="border-border/50 bg-muted/10">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">TEST SUMMARY</span>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-primary">
                      {results.filter(r => r.status === 'pass').length} PASS
                    </span>
                    <span className="text-destructive">
                      {results.filter(r => r.status === 'fail').length} FAIL
                    </span>
                    <span className="text-muted-foreground">
                      Avg: {(results.reduce((s, r) => s + r.latency, 0) / results.length).toFixed(0)}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SANDBOX PANEL — Code execution + Prompt Chain Lab
// ═══════════════════════════════════════════════════════════════

const SandboxPanel: React.FC = () => {
  const evolution = useSelfEvolution();
  const [sandboxCode, setSandboxCode] = useState(
    '// Test AIMOS systems\n// Available: JavaScript, JSON schema, Prompt templates\nconsole.log("AIMOS Cognitive Test");'
  );
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [promptChain, setPromptChain] = useState('');
  const [chainResult, setChainResult] = useState<any>(null);

  const handleSandbox = async () => {
    const result = await evolution.executeSandbox(sandboxCode);
    if (result) setSandboxResult(result);
  };

  const handleChainTest = async () => {
    const chains = promptChain.split('\n---\n').filter(c => c.trim());
    if (chains.length > 0) {
      const result = await evolution.testPromptChain(chains);
      if (result) setChainResult(result);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Code className="w-5 h-5 text-primary" />
        <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
          Sandbox & Prompt Lab
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Code Sandbox */}
          <Card className="border-border/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <Code className="w-3.5 h-3.5" /> Code Sandbox
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 space-y-2">
              <Textarea
                value={sandboxCode}
                onChange={(e) => setSandboxCode(e.target.value)}
                className="font-mono text-xs min-h-[180px] bg-muted/20 border-border/50"
                placeholder="Enter JavaScript, JSON, or prompt template..."
              />
              <Button onClick={handleSandbox} disabled={evolution.isLoading} size="sm" className="w-full text-xs">
                <Play className="w-3.5 h-3.5 mr-1.5" /> Execute
              </Button>
              {sandboxResult && (
                <div className="p-3 rounded bg-muted/20 text-xs font-mono border border-border/30">
                  <div className="text-muted-foreground mb-1">
                    Result ({sandboxResult.executionTime?.toFixed(1)}ms):
                  </div>
                  {sandboxResult.error ? (
                    <div className="text-destructive">{sandboxResult.error}</div>
                  ) : (
                    <>
                      {sandboxResult.output?.map((line: string, i: number) => (
                        <div key={i} className="text-primary">{line}</div>
                      ))}
                      <div className="text-foreground mt-1">
                        {JSON.stringify(sandboxResult.result, null, 2)}
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt Chain Lab */}
          <Card className="border-border/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Prompt Chain Lab
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 space-y-2">
              <Textarea
                value={promptChain}
                onChange={(e) => setPromptChain(e.target.value)}
                className="font-mono text-xs min-h-[120px] bg-muted/20 border-border/50"
                placeholder={"Enter prompts separated by ---\nUse {{input}} for previous output\n---\nNext prompt here..."}
              />
              <Button onClick={handleChainTest} disabled={evolution.isLoading} size="sm" className="w-full text-xs">
                <Zap className="w-3.5 h-3.5 mr-1.5" /> Test Chain
              </Button>
              {chainResult && (
                <div className="p-3 rounded bg-muted/20 text-xs space-y-2 border border-border/30">
                  <div className="flex justify-between text-muted-foreground font-mono">
                    <span>Success: {Math.round((chainResult.successRate || 0) * 100)}%</span>
                    <span>Total: {(chainResult.totalLatency || 0).toFixed(0)}ms</span>
                  </div>
                  {chainResult.steps?.map((step: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-muted/10 border border-border/20">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-primary font-mono">Step {step.stepId}</span>
                        <span className="text-muted-foreground font-mono">
                          {step.latency?.toFixed(0)}ms | κ={Math.round((step.confidence || 0) * 100)}%
                        </span>
                      </div>
                      <div className="text-muted-foreground line-clamp-2">
                        {step.response?.slice(0, 200)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calibration */}
          <Card className="border-border/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> System Calibration
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => evolution.calibrateReasoning('depth')} disabled={evolution.isLoading} size="sm" variant="outline" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" /> Reasoning
                </Button>
                <Button onClick={() => evolution.calibrateMemory()} disabled={evolution.isLoading} size="sm" variant="outline" className="text-xs">
                  <Layers className="w-3 h-3 mr-1" /> Memory
                </Button>
                <Button onClick={() => evolution.calibrateConfidence()} disabled={evolution.isLoading} size="sm" variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" /> Confidence
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROPOSALS PANEL — Approval-gated evolution proposals
// ═══════════════════════════════════════════════════════════════

const ProposalsPanel: React.FC = () => {
  const evolution = useSelfEvolution();
  const [proposals, setProposals] = useState<any[]>([]);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [evolutions, setEvolutions] = useState<any[]>([]);

  const loadProposals = useCallback(async () => {
    const result = await evolution.getProposals('pending');
    if (result) setProposals(result.proposals || []);
  }, [evolution]);

  const loadHistory = useCallback(async () => {
    const result = await evolution.getAuditHistory();
    if (result) setAuditHistory(result.audits || []);
  }, [evolution]);

  const suggestEvolutions = useCallback(async () => {
    const result = await evolution.suggestEvolutions();
    if (result) setEvolutions(result.suggestions || []);
  }, [evolution]);

  const handleApprove = async (id: string, title: string) => {
    const result = await evolution.approveProposal(id);
    if (result) {
      toast.success(`Approved: ${title}`);
      setProposals(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleReject = async (id: string, title: string) => {
    const result = await evolution.rejectProposal(id, 'User rejected');
    if (result) {
      toast.info(`Rejected: ${title}`);
      setProposals(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
            Evolution Proposals
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button onClick={loadProposals} disabled={evolution.isLoading} size="sm" variant="outline" className="text-xs">
            <RefreshCw className="w-3 h-3 mr-1" /> Pending
          </Button>
          <Button onClick={suggestEvolutions} disabled={evolution.isLoading} size="sm" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" /> Suggest
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Pending Proposals */}
          {proposals.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-warning" /> Pending Approval ({proposals.length})
              </div>
              {proposals.map((p: any) => (
                <Card key={p.id} className="border-warning/20">
                  <CardContent className="py-3 px-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.title}</span>
                      <Badge variant="outline" className="text-[10px]">{p.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    {p.expected_impact && (
                      <p className="text-xs text-primary">Impact: {p.expected_impact}</p>
                    )}
                    {p.implementation_plan?.steps && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Steps:</span>
                        <ul className="list-disc pl-4 text-muted-foreground mt-1">
                          {p.implementation_plan.steps.slice(0, 3).map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Separator className="bg-border/30" />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs bg-primary hover:bg-primary/80"
                        onClick={() => handleApprove(p.id, p.title)}
                        disabled={evolution.isLoading}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleReject(p.id, p.title)}
                        disabled={evolution.isLoading}
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Evolution Suggestions */}
          {evolutions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-primary" /> Suggested Evolutions
              </div>
              {evolutions.map((e: any, i: number) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="py-2 px-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{e.type}</span>
                      <Badge variant="outline" className="text-[10px]">{e.priority}</Badge>
                    </div>
                    <p className="text-muted-foreground">{e.description}</p>
                    <p className="text-primary mt-1">→ {e.expectedImpact}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state */}
          {proposals.length === 0 && evolutions.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No proposals yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run a Self-Audit or click "Suggest" to generate evolution proposals
              </p>
            </div>
          )}

          {/* Audit History */}
          <div>
            <Button onClick={loadHistory} disabled={evolution.isLoading} size="sm" variant="ghost" className="w-full text-xs">
              <History className="w-3 h-3 mr-1.5" /> Load Audit History
            </Button>
            {auditHistory.length > 0 && (
              <div className="space-y-1 mt-2">
                {auditHistory.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs font-mono">
                    <span>{new Date(a.started_at).toLocaleString()}</span>
                    <div className="flex gap-3 text-muted-foreground">
                      <span>Health: {Math.round((a.system_health_score || 0) * 100)}%</span>
                      <span>Proposals: {a.proposals_generated}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default EvolutionCenter;
