import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  ArrowLeft,
  Play,
  Download,
  Trash2,
  ChevronDown,
  Trophy,
  Clock,
  Database,
  Zap,
  Target,
  Brain,
  FlaskConical,
  Code,
  Bug,
  Layers,
  RefreshCw,
  HardDrive,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Server,
  FileCode,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───

interface MethodConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  backingStore: string;
}

interface PresetScenario {
  name: string;
  icon: React.ReactNode;
  prompt: string;
  token_budget: number;
  target_entities: string[];
  expected_kinds: string[];
}

interface MethodResult {
  method_id: string;
  method_name: string;
  latency_ms: number;
  entity_count: number;
  token_cost: number;
  coverage: number;
  relevance_score: number;
  depth_score: number;
  quality_score: number;
  composite_score: number;
  raw_results: any[];
  error?: string;
}

interface TestRun {
  id: string;
  timestamp: string;
  prompt: string;
  token_budget: number;
  preset?: string;
  results: MethodResult[];
  winner: string;
  analysis: string;
}

interface SystemHealth {
  bciCount: number;
  atomCount: number;
  chunkCount: number;
  contextSyncOk: boolean | null;
  cmcEngineOk: boolean | null;
  loading: boolean;
}

// ─── Constants ───

const METHODS: MethodConfig[] = [
  { id: 'bci', name: 'BCI Context Sync', description: 'Utility-scored boundary views with token budgeting', icon: <Brain className="h-4 w-4" />, color: 'hsl(120, 100%, 44%)', backingStore: 'bci_entities' },
  { id: 'cmc', name: 'CMC Memory Atoms', description: 'Keyword-matched memory atoms via CMC engine', icon: <Database className="h-4 w-4" />, color: 'hsl(199, 89%, 48%)', backingStore: 'aimos_memory_atoms' },
  { id: 'rag', name: 'RAG Chunk Search', description: 'Embedding or keyword-based chunk retrieval', icon: <Layers className="h-4 w-4" />, color: 'hsl(38, 92%, 50%)', backingStore: 'chunks' },
  { id: 'naive', name: 'Naive Keyword', description: 'Direct ILIKE search — baseline comparison', icon: <Target className="h-4 w-4" />, color: 'hsl(0, 72%, 51%)', backingStore: 'bci_entities + aimos_memory_atoms' },
];

const PRESETS: PresetScenario[] = [
  {
    name: 'Code Generation',
    icon: <Code className="h-3.5 w-3.5" />,
    prompt: 'Generate a new React component that integrates with the orchestration kernel to display real-time task queue status with dependency graph visualization.',
    token_budget: 6000,
    target_entities: ['kernel.ts', 'taskQueue.ts', 'types.ts', 'DAGVisualization.tsx'],
    expected_kinds: ['function', 'type', 'module'],
  },
  {
    name: 'Debugging',
    icon: <Bug className="h-3.5 w-3.5" />,
    prompt: 'Debug why the hq-chat pipeline drops context when the CMC retrieval returns more than 10 memory atoms. Trace the data flow from user input to response generation.',
    token_budget: 8000,
    target_entities: ['hq-chat/index.ts', 'cmc-engine/index.ts', 'aimosMemoryService.ts'],
    expected_kinds: ['function', 'module', 'config'],
  },
  {
    name: 'Architecture Review',
    icon: <Layers className="h-3.5 w-3.5" />,
    prompt: 'Review the overall architecture of the AIMOS cognitive engine pipeline. Map all edge functions, their dependencies, data flow between them, and identify potential bottlenecks.',
    token_budget: 12000,
    target_entities: ['aimos-core/index.ts', 'cmc-engine/index.ts', 'vif-engine/index.ts', 'seg-engine/index.ts', 'apoe-engine/index.ts'],
    expected_kinds: ['module', 'function', 'schema'],
  },
  {
    name: 'Refactoring',
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    prompt: 'Refactor the shell component system to reduce prop drilling. Identify shared state that should be lifted to context providers and components that can be decomposed.',
    token_budget: 5000,
    target_entities: ['AppShell.tsx', 'useShellStore.ts', 'CenterWorkspace.tsx', 'types.ts'],
    expected_kinds: ['function', 'type', 'module'],
  },
  {
    name: 'Memory Recall',
    icon: <HardDrive className="h-3.5 w-3.5" />,
    prompt: 'Recall all previous decisions about the BCI entity indexing strategy, including which fields are bitemporal, how dependency hashes are computed, and what sync states exist.',
    token_budget: 4000,
    target_entities: ['bci_entities', 'bci_entity_versions', 'context-sync/index.ts'],
    expected_kinds: ['schema', 'function', 'config'],
  },
  {
    name: 'Security Audit',
    icon: <Shield className="h-3.5 w-3.5" />,
    prompt: 'Audit the RLS policies and authentication flow. Check for privilege escalation vectors, missing policies on sensitive tables, and ensure edge functions validate authorization.',
    token_budget: 10000,
    target_entities: ['client.ts', 'hq-chat/index.ts', 'context-sync/index.ts'],
    expected_kinds: ['function', 'config', 'schema'],
  },
];

const SEED_ENTITIES = [
  // Shell / UI
  { entity_id: 'useShellStore', kind: 'function', path: 'src/components/shell/useShellStore.ts' },
  { entity_id: 'AppShell', kind: 'module', path: 'src/components/shell/AppShell.tsx' },
  { entity_id: 'RightPanel', kind: 'module', path: 'src/components/shell/RightPanel.tsx' },
  { entity_id: 'SwarmPanel', kind: 'module', path: 'src/components/shell/SwarmPanel.tsx' },
  { entity_id: 'CenterWorkspace', kind: 'module', path: 'src/components/shell/CenterWorkspace.tsx' },
  { entity_id: 'TopBar', kind: 'module', path: 'src/components/shell/TopBar.tsx' },
  { entity_id: 'StatusBar', kind: 'module', path: 'src/components/shell/StatusBar.tsx' },
  // IDE
  { entity_id: 'ProductionIDE', kind: 'module', path: 'src/components/ide/ProductionIDE.tsx' },
  // Pages
  { entity_id: 'ContextLab', kind: 'module', path: 'src/pages/ContextLab.tsx' },
  { entity_id: 'HQ', kind: 'module', path: 'src/pages/HQ.tsx' },
  // Orchestration core
  { entity_id: 'kernel', kind: 'module', path: 'src/lib/orchestration/kernel.ts' },
  { entity_id: 'taskQueue', kind: 'module', path: 'src/lib/orchestration/taskQueue.ts' },
  { entity_id: 'contextManager', kind: 'module', path: 'src/lib/orchestration/contextManager.ts' },
  { entity_id: 'verifier', kind: 'module', path: 'src/lib/orchestration/verifier.ts' },
  { entity_id: 'testHarness', kind: 'module', path: 'src/lib/orchestration/testHarness.ts' },
  { entity_id: 'eventStore', kind: 'module', path: 'src/lib/orchestration/eventStore.ts' },
  // Services
  { entity_id: 'ragService', kind: 'module', path: 'src/lib/ragService.ts' },
  { entity_id: 'hqChatService', kind: 'module', path: 'src/lib/hqChatService.ts' },
  { entity_id: 'aimosClient', kind: 'module', path: 'src/lib/aimosClient.ts' },
  { entity_id: 'aimosMemoryService', kind: 'module', path: 'src/lib/aimosMemoryService.ts' },
  { entity_id: 'agentSimulator', kind: 'module', path: 'src/lib/agentSimulator.ts' },
  // Hooks
  { entity_id: 'useHQStore', kind: 'function', path: 'src/components/hq/useHQStore.ts' },
  { entity_id: 'useIDEStore', kind: 'function', path: 'src/components/ide/useIDEStore.ts' },
  // Edge functions
  { entity_id: 'hq-chat', kind: 'function', path: 'supabase/functions/hq-chat/index.ts' },
  { entity_id: 'cmc-engine', kind: 'function', path: 'supabase/functions/cmc-engine/index.ts' },
  { entity_id: 'context-sync', kind: 'function', path: 'supabase/functions/context-sync/index.ts' },
  { entity_id: 'vif-engine', kind: 'function', path: 'supabase/functions/vif-engine/index.ts' },
  { entity_id: 'seg-engine', kind: 'function', path: 'supabase/functions/seg-engine/index.ts' },
  { entity_id: 'apoe-engine', kind: 'function', path: 'supabase/functions/apoe-engine/index.ts' },
  { entity_id: 'self-evolution', kind: 'function', path: 'supabase/functions/self-evolution/index.ts' },
  // Matrix / HQ panels
  { entity_id: 'AdvancedNeoChat', kind: 'module', path: 'src/components/matrix/AdvancedNeoChat.tsx' },
  { entity_id: 'OrchestrationDashboard', kind: 'module', path: 'src/components/hq/OrchestrationDashboard.tsx' },
  { entity_id: 'DAGVisualization', kind: 'module', path: 'src/components/hq/DAGVisualization.tsx' },
];

// ─── Retrieval Implementations ───

async function runBCI(prompt: string, tokenBudget: number): Promise<{ results: any[]; tokens: number }> {
  try {
    const { data, error } = await supabase.functions.invoke('context-sync', {
      body: { action: 'resolve_context', prompt, token_budget: tokenBudget, policy_profile: 'default' },
    });
    if (error) throw error;
    const manifest = data?.manifest || data?.selected || [];
    const results = Array.isArray(manifest) ? manifest : [manifest];
    const tokens = results.reduce((sum: number, r: any) => sum + (r.token_cost || r.tokens || 50), 0);
    return { results, tokens };
  } catch {
    // Fallback: query BCI entities directly
    const words = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5);
    const { data } = await supabase
      .from('bci_entities')
      .select('entity_id, kind, path, contract, weights, boundary_views, sync_status, confidence_score')
      .or(words.map(w => `entity_id.ilike.%${w}%,path.ilike.%${w}%`).join(','))
      .limit(20);
    const results = data || [];
    const tokens = results.length * 80;
    return { results, tokens };
  }
}

async function runCMC(prompt: string, tokenBudget: number): Promise<{ results: any[]; tokens: number }> {
  try {
    const { data, error } = await supabase.functions.invoke('cmc-engine', {
      body: { action: 'retrieve', query: prompt, limit: Math.floor(tokenBudget / 200) },
    });
    if (error) throw error;
    const results = data?.atoms || data?.results || [];
    const tokens = results.reduce((sum: number, r: any) => sum + (r.content?.length || 0) / 4, 0);
    return { results: Array.isArray(results) ? results : [], tokens: Math.round(tokens) };
  } catch {
    // Fallback: query memory atoms directly
    const words = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5);
    const { data } = await supabase
      .from('aimos_memory_atoms')
      .select('id, content, content_type, tags, confidence_score, relevance_score')
      .or(words.map(w => `content.ilike.%${w}%`).join(','))
      .limit(15);
    const results = data || [];
    const tokens = results.reduce((sum: number, r: any) => sum + (r.content?.length || 0) / 4, 0);
    return { results, tokens: Math.round(tokens) };
  }
}

async function runRAG(prompt: string, tokenBudget: number): Promise<{ results: any[]; tokens: number }> {
  const words = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 6);
  const { data } = await supabase
    .from('chunks')
    .select('id, content, summary, motifs, token_count')
    .or(words.map(w => `content.ilike.%${w}%,summary.ilike.%${w}%`).join(','))
    .limit(Math.floor(tokenBudget / 300));
  const results = data || [];
  const tokens = results.reduce((sum: number, r: any) => sum + (r.token_count || r.content?.length / 4 || 50), 0);
  return { results, tokens: Math.round(tokens) };
}

async function runNaive(prompt: string, tokenBudget: number): Promise<{ results: any[]; tokens: number }> {
  const words = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 4);
  if (words.length === 0) return { results: [], tokens: 0 };

  const [bciRes, atomRes] = await Promise.all([
    supabase
      .from('bci_entities')
      .select('entity_id, kind, path, sync_status')
      .or(words.map(w => `entity_id.ilike.%${w}%,path.ilike.%${w}%`).join(','))
      .limit(10),
    supabase
      .from('aimos_memory_atoms')
      .select('id, content, content_type, tags')
      .or(words.map(w => `content.ilike.%${w}%`).join(','))
      .limit(10),
  ]);
  const results = [...(bciRes.data || []), ...(atomRes.data || [])];
  const tokens = results.reduce((sum: number, r: any) => sum + ((r.content?.length || 40) / 4), 0);
  return { results, tokens: Math.round(tokens) };
}

// ─── Scoring Logic ───

function computeRelevance(prompt: string, results: any[]): number {
  const words = new Set(prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (words.size === 0 || results.length === 0) return 0;
  let totalOverlap = 0;
  for (const r of results) {
    const text = JSON.stringify(r).toLowerCase();
    let matched = 0;
    for (const w of words) if (text.includes(w)) matched++;
    totalOverlap += matched / words.size;
  }
  return Math.min(1, totalOverlap / results.length);
}

function computeCoverage(results: any[], targetEntities: string[]): number {
  if (targetEntities.length === 0) return 0;
  const resultText = JSON.stringify(results).toLowerCase();
  let found = 0;
  for (const t of targetEntities) {
    if (resultText.includes(t.toLowerCase())) found++;
  }
  return found / targetEntities.length;
}

function computeComposite(r: MethodResult, maxLatency: number): number {
  const normLatency = maxLatency > 0 ? 1 - (r.latency_ms / maxLatency) : 0.5;
  const budgetEff = r.token_cost > 0 ? Math.min(1, r.entity_count / (r.token_cost / 100)) : 0;
  return (
    0.3 * r.relevance_score +
    0.25 * r.coverage +
    0.2 * Math.max(0, normLatency) +
    0.15 * r.depth_score +
    0.1 * budgetEff
  );
}

function generateAnalysis(results: MethodResult[]): string {
  if (results.length === 0) return 'No results to analyze.';
  const sorted = [...results].sort((a, b) => b.composite_score - a.composite_score);
  const winner = sorted[0];
  const loser = sorted[sorted.length - 1];
  const fastest = [...results].sort((a, b) => a.latency_ms - b.latency_ms)[0];
  const mostEntities = [...results].sort((a, b) => b.entity_count - a.entity_count)[0];

  const parts: string[] = [];
  parts.push(`${winner.method_name} wins with composite score ${winner.composite_score.toFixed(3)} (relevance: ${(winner.relevance_score * 100).toFixed(0)}%, coverage: ${(winner.coverage * 100).toFixed(0)}%).`);
  if (fastest.method_id !== winner.method_id) {
    parts.push(`${fastest.method_name} was fastest at ${fastest.latency_ms}ms but scored lower on quality.`);
  }
  if (mostEntities.method_id !== winner.method_id && mostEntities.entity_count > winner.entity_count) {
    parts.push(`${mostEntities.method_name} retrieved ${mostEntities.entity_count - winner.entity_count} more entities but with lower relevance.`);
  }
  if (loser.method_id !== winner.method_id) {
    parts.push(`${loser.method_name} trailed with score ${loser.composite_score.toFixed(3)}.`);
  }
  return parts.join(' ');
}

// ─── Health Check Component ───

const SystemHealthPanel: React.FC<{ health: SystemHealth; onRefresh: () => void; onSeed: () => void; seeding: boolean }> = ({ health, onRefresh, onSeed, seeding }) => {
  const StatusBadge = ({ count, label }: { count: number; label: string }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border">
      {count > 0 ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-destructive" />
      )}
      <span className="text-xs font-medium">{label}</span>
      <Badge variant={count > 0 ? 'default' : 'destructive'} className="text-[10px] h-5 px-1.5">
        {count}
      </Badge>
    </div>
  );

  const FunctionBadge = ({ ok, label }: { ok: boolean | null; label: string }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border">
      {ok === null ? (
        <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
      ) : ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
      )}
      <span className="text-xs font-medium">{label}</span>
      <Badge variant={ok === null ? 'outline' : ok ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5">
        {ok === null ? '...' : ok ? 'OK' : 'N/A'}
      </Badge>
    </div>
  );

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="py-2.5 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Server className="h-3.5 w-3.5" />
            System Health
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={onRefresh} disabled={health.loading}>
              {health.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 text-[10px]" 
              onClick={onSeed}
              disabled={seeding || health.bciCount > 5}
            >
              {seeding ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Seeding...</>
              ) : (
                <><Sparkles className="h-3 w-3 mr-1" /> Seed Test Data</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge count={health.bciCount} label="BCI Entities" />
          <StatusBadge count={health.atomCount} label="Memory Atoms" />
          <StatusBadge count={health.chunkCount} label="RAG Chunks" />
          <FunctionBadge ok={health.contextSyncOk} label="context-sync" />
          <FunctionBadge ok={health.cmcEngineOk} label="cmc-engine" />
        </div>
        {(health.bciCount === 0 && health.atomCount === 0 && health.chunkCount === 0) && (
          <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-yellow-200/80">
                All data stores are empty. Click <strong>"Seed Test Data"</strong> to populate sample entities, or use the main app to index your codebase.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Quick Start Guide ───

const QuickStartGuide: React.FC<{ onPresetClick: () => void }> = ({ onPresetClick }) => (
  <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <FlaskConical className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1 space-y-3">
          <h2 className="text-lg font-bold text-foreground">Welcome to the Context Testing Laboratory</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Compare different context retrieval methods side-by-side. Test which approach returns the most relevant, comprehensive context for AI coding tasks.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</div>
              <span className="text-muted-foreground">Select a <strong className="text-foreground">preset scenario</strong> from the left sidebar</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</div>
              <span className="text-muted-foreground">Or write your own prompt describing a coding task</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">3</div>
              <span className="text-muted-foreground">Click <strong className="text-foreground">Run Comparison</strong> to see which method wins</span>
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={onPresetClick}>
              <Code className="h-3.5 w-3.5 mr-1.5" /> Try "Code Generation" Preset
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Empty Result Card ───

const EmptyResultMessage: React.FC<{ methodId: string; backingStore: string }> = ({ methodId, backingStore }) => (
  <div className="text-center py-4 px-2">
    <FileCode className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
    <p className="text-[10px] text-muted-foreground font-medium">No data found</p>
    <p className="text-[9px] text-muted-foreground/60 mt-1 leading-relaxed">
      The <strong>{backingStore}</strong> table is empty or has no matching entries. Seed test data to compare methods.
    </p>
  </div>
);

// ─── Winner Banner ───

const WinnerBanner: React.FC<{ winner: MethodResult; analysis: string }> = ({ winner, analysis }) => {
  const method = METHODS.find(m => m.id === winner.method_id);
  return (
    <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/20">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-primary">{method?.name || winner.method_name} Wins!</h3>
              <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                Score: {winner.composite_score.toFixed(3)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Component ───

const ContextLab: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set(['bci', 'cmc', 'rag', 'naive']));
  const [prompt, setPrompt] = useState('');
  const [tokenBudget, setTokenBudget] = useState(4000);
  const [targetEntities, setTargetEntities] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [runningMethod, setRunningMethod] = useState<string | null>(null);
  const [currentResults, setCurrentResults] = useState<MethodResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState('');
  const [runHistory, setRunHistory] = useState<TestRun[]>(() => {
    try {
      const saved = localStorage.getItem('context-lab-history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [seeding, setSeeding] = useState(false);
  
  const [health, setHealth] = useState<SystemHealth>({
    bciCount: 0,
    atomCount: 0,
    chunkCount: 0,
    contextSyncOk: null,
    cmcEngineOk: null,
    loading: true,
  });

  // Fetch system health on mount
  const refreshHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, loading: true }));
    
    const [bciRes, atomRes, chunkRes] = await Promise.all([
      supabase.from('bci_entities').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }),
      supabase.from('chunks').select('*', { count: 'exact', head: true }),
    ]);

    // Test edge functions with a lightweight ping
    let contextSyncOk: boolean | null = null;
    let cmcEngineOk: boolean | null = null;
    
    try {
      const { error } = await supabase.functions.invoke('context-sync', {
        body: { action: 'health_check' },
      });
      contextSyncOk = !error;
    } catch { contextSyncOk = false; }

    try {
      const { error } = await supabase.functions.invoke('cmc-engine', {
        body: { action: 'health_check' },
      });
      cmcEngineOk = !error;
    } catch { cmcEngineOk = false; }

    setHealth({
      bciCount: bciRes.count || 0,
      atomCount: atomRes.count || 0,
      chunkCount: chunkRes.count || 0,
      contextSyncOk,
      cmcEngineOk,
      loading: false,
    });
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  // Seed test data
  const seedTestData = async () => {
    setSeeding(true);
    let indexed = 0;
    
    for (const entity of SEED_ENTITIES) {
      try {
        await supabase.functions.invoke('context-sync', {
          body: {
            action: 'index_entity',
            entity_id: entity.entity_id,
            kind: entity.kind,
            path: entity.path,
            contract: { summary: `Module: ${entity.entity_id}` },
            weights: { relevance: 0.7, recency: 0.5, utility: 0.6 },
          },
        });
        indexed++;
      } catch (err) {
        console.warn(`Failed to seed ${entity.entity_id}:`, err);
      }
    }
    
    toast.success(`Seeded ${indexed} test entities`);
    setSeeding(false);
    refreshHealth();
  };

  const toggleMethod = (id: string) => {
    setSelectedMethods(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const applyPreset = (preset: PresetScenario) => {
    setPrompt(preset.prompt);
    setTokenBudget(preset.token_budget);
    setTargetEntities(preset.target_entities.join(', '));
    setActivePreset(preset.name);
  };

  const runTest = useCallback(async () => {
    if (!prompt.trim() || selectedMethods.size === 0) return;
    setIsRunning(true);
    setCurrentResults([]);
    setCurrentAnalysis('');
    setRunProgress(0);

    const targets = targetEntities.split(',').map(t => t.trim()).filter(Boolean);
    const runners: Record<string, (p: string, b: number) => Promise<{ results: any[]; tokens: number }>> = {
      bci: runBCI, cmc: runCMC, rag: runRAG, naive: runNaive,
    };

    const methodList = Array.from(selectedMethods);
    const methodResults: MethodResult[] = [];
    const progressStep = 100 / methodList.length;

    for (let i = 0; i < methodList.length; i++) {
      const methodId = methodList[i];
      const method = METHODS.find(m => m.id === methodId)!;
      const runner = runners[methodId];
      
      setRunningMethod(method.name);
      const start = performance.now();
      
      try {
        const { results, tokens } = await runner(prompt, tokenBudget);
        const latency = Math.round(performance.now() - start);
        const relevance = computeRelevance(prompt, results);
        const coverage = computeCoverage(results, targets);
        const depth = methodId === 'bci' ? Math.min(1, results.filter((r: any) => r.boundary_views).length / Math.max(1, results.length)) : 0;
        const quality = methodId === 'bci'
          ? results.reduce((sum: number, r: any) => sum + (r.confidence_score || 0), 0) / Math.max(1, results.length)
          : relevance * 0.8;

        methodResults.push({
          method_id: methodId,
          method_name: method.name,
          latency_ms: latency,
          entity_count: results.length,
          token_cost: tokens,
          coverage,
          relevance_score: relevance,
          depth_score: depth,
          quality_score: quality,
          composite_score: 0,
          raw_results: results,
        });
      } catch (err: any) {
        methodResults.push({
          method_id: methodId,
          method_name: method.name,
          latency_ms: Math.round(performance.now() - start),
          entity_count: 0, token_cost: 0, coverage: 0, relevance_score: 0,
          depth_score: 0, quality_score: 0, composite_score: 0,
          raw_results: [],
          error: err.message || 'Unknown error',
        });
      }
      
      setRunProgress((i + 1) * progressStep);
    }

    // Compute composite scores
    const maxLatency = Math.max(...methodResults.map(r => r.latency_ms), 1);
    for (const r of methodResults) {
      r.composite_score = computeComposite(r, maxLatency);
    }
    methodResults.sort((a, b) => b.composite_score - a.composite_score);

    const analysis = generateAnalysis(methodResults);
    const winner = methodResults[0]?.method_name || 'N/A';

    const run: TestRun = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      prompt: prompt.slice(0, 120),
      token_budget: tokenBudget,
      preset: activePreset || undefined,
      results: methodResults.map(r => ({ ...r, raw_results: [] })),
      winner,
      analysis,
    };

    const newHistory = [run, ...runHistory].slice(0, 50);
    setRunHistory(newHistory);
    try { localStorage.setItem('context-lab-history', JSON.stringify(newHistory)); } catch {}

    setCurrentResults(methodResults);
    setCurrentAnalysis(analysis);
    setIsRunning(false);
    setRunningMethod(null);
    setRunProgress(100);
  }, [prompt, tokenBudget, selectedMethods, targetEntities, activePreset, runHistory]);

  const clearHistory = () => {
    setRunHistory([]);
    localStorage.removeItem('context-lab-history');
  };

  const exportResults = () => {
    const data = { currentResults, runHistory, prompt, tokenBudget };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `context-lab-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // Trend data for chart
  const trendData = runHistory.slice(0, 20).reverse().map((run, i) => {
    const point: any = { run: `#${i + 1}` };
    for (const r of run.results) {
      point[`${r.method_id}_score`] = Number(r.composite_score.toFixed(3));
      point[`${r.method_id}_latency`] = r.latency_ms;
    }
    return point;
  });

  const getResultCardStyle = (index: number, totalResults: number) => {
    if (totalResults === 0) return '';
    if (index === 0) return 'ring-2 ring-primary shadow-[0_0_20px_hsl(var(--primary)/0.2)]';
    if (index === 1) return 'ring-1 ring-yellow-500/50';
    return 'opacity-70';
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* ─── Top Bar ─── */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <FlaskConical className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-bold tracking-wide text-foreground">CONTEXT TESTING LABORATORY</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportResults} className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1" /> Export
          </Button>
        </div>
      </header>

      {/* ─── Main Layout ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Sidebar ─── */}
        <aside className="w-64 border-r border-border bg-card/30 flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* Method Selection */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Methods</h3>
                <div className="space-y-1.5">
                  {METHODS.map(m => (
                    <label key={m.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 cursor-pointer transition-colors">
                      <Checkbox
                        checked={selectedMethods.has(m.id)}
                        onCheckedChange={() => toggleMethod(m.id)}
                      />
                      <span className="flex items-center gap-1.5">
                        {m.icon}
                        <span className="text-xs">{m.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Preset Scenarios */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Presets</h3>
                <div className="space-y-1">
                  {PRESETS.map(p => (
                    <Button
                      key={p.name}
                      variant={activePreset === p.name ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start text-xs h-7"
                      onClick={() => applyPreset(p)}
                    >
                      {p.icon}
                      <span className="ml-1.5">{p.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Run History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">History</h3>
                  {runHistory.length > 0 && (
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearHistory}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {runHistory.slice(0, 15).map((run, i) => (
                    <div key={run.id} className="p-1.5 rounded bg-muted/20 text-[10px] text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="font-mono">Run #{runHistory.length - i}</span>
                        {run.preset && <Badge variant="outline" className="text-[8px] h-4 px-1">{run.preset}</Badge>}
                      </div>
                      <div className="truncate mt-0.5">{run.prompt}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Trophy className="h-2.5 w-2.5 text-primary" />
                        <span className="text-primary text-[9px]">{run.winner}</span>
                      </div>
                    </div>
                  ))}
                  {runHistory.length === 0 && (
                    <p className="text-[10px] text-muted-foreground/50 italic">No runs yet</p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* ─── Center Workspace ─── */}
        <main className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4 max-w-[1400px] mx-auto">
              {/* System Health Panel */}
              <SystemHealthPanel 
                health={health} 
                onRefresh={refreshHealth} 
                onSeed={seedTestData}
                seeding={seeding}
              />

              {/* Test Configuration */}
              <Card className="border-border bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Test Configuration</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <Textarea
                    placeholder="Enter your test prompt — what context would you need to accomplish this task?"
                    value={prompt}
                    onChange={e => { setPrompt(e.target.value); setActivePreset(null); }}
                    className="min-h-[80px] text-sm bg-muted/20 border-border resize-none"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Token Budget: {tokenBudget.toLocaleString()}</label>
                      <Slider
                        value={[tokenBudget]}
                        onValueChange={([v]) => setTokenBudget(v)}
                        min={1000} max={16000} step={500}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Target Entities (optional)</label>
                      <input
                        className="flex h-8 w-full rounded-md border border-input bg-muted/20 px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="kernel.ts, types.ts, ..."
                        value={targetEntities}
                        onChange={e => setTargetEntities(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={runTest}
                        disabled={isRunning || !prompt.trim() || selectedMethods.size === 0}
                        className="w-full h-8 text-xs font-bold"
                      >
                        {isRunning ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Running...</>
                        ) : (
                          <><Play className="h-3.5 w-3.5 mr-1" /> Run Comparison</>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress indicator */}
                  {isRunning && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Running: {runningMethod || '...'}</span>
                        <span>{Math.round(runProgress)}%</span>
                      </div>
                      <Progress value={runProgress} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Cards */}
              {currentResults.length > 0 && (
                <>
                  {/* Winner Banner */}
                  <WinnerBanner winner={currentResults[0]} analysis={currentAnalysis} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentResults.map((r, i) => {
                      const method = METHODS.find(m => m.id === r.method_id)!;
                      const isWinner = i === 0;
                      const isEmpty = r.entity_count === 0 && !r.error;
                      
                      return (
                        <Card
                          key={r.method_id}
                          className={`border-border bg-card/50 transition-all ${getResultCardStyle(i, currentResults.length)}`}
                        >
                          <CardHeader className="py-2.5 px-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {method.icon}
                                <span className="text-xs font-bold">{method.name}</span>
                              </div>
                              {isWinner && <Trophy className="h-3.5 w-3.5 text-primary" />}
                              {i === 1 && <Badge variant="outline" className="text-[8px] h-4 px-1">2nd</Badge>}
                            </div>
                          </CardHeader>
                          <CardContent className="px-3 pb-3 space-y-2">
                            {r.error ? (
                              <div className="text-center py-4">
                                <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                                <p className="text-[10px] text-destructive">{r.error}</p>
                              </div>
                            ) : isEmpty ? (
                              <EmptyResultMessage methodId={r.method_id} backingStore={method.backingStore} />
                            ) : (
                              <>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">Latency</span>
                                  </div>
                                  <span className="text-right font-mono">{r.latency_ms}ms</span>

                                  <div className="flex items-center gap-1">
                                    <Database className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">Entities</span>
                                  </div>
                                  <span className="text-right font-mono">{r.entity_count}</span>

                                  <div className="flex items-center gap-1">
                                    <Zap className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">Tokens</span>
                                  </div>
                                  <span className="text-right font-mono">{r.token_cost.toLocaleString()}</span>

                                  <div className="flex items-center gap-1">
                                    <Target className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">Coverage</span>
                                  </div>
                                  <span className="text-right font-mono">{(r.coverage * 100).toFixed(0)}%</span>

                                  <div className="flex items-center gap-1">
                                    <Brain className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">κ Score</span>
                                  </div>
                                  <span className="text-right font-mono">{r.quality_score.toFixed(2)}</span>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground">Composite</span>
                                  <span className="text-sm font-bold font-mono" style={{ color: method.color }}>
                                    {r.composite_score.toFixed(3)}
                                  </span>
                                </div>

                                {/* Expandable raw results */}
                                <Collapsible open={expandedResults.has(r.method_id)} onOpenChange={(open) => {
                                  setExpandedResults(prev => {
                                    const next = new Set(prev);
                                    open ? next.add(r.method_id) : next.delete(r.method_id);
                                    return next;
                                  });
                                }}>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-full h-6 text-[10px] text-muted-foreground">
                                      <ChevronDown className="h-3 w-3 mr-1" /> View Results
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <pre className="mt-1 p-2 rounded bg-muted/30 text-[9px] font-mono text-muted-foreground max-h-48 overflow-auto whitespace-pre-wrap break-all">
                                      {JSON.stringify(r.raw_results.slice(0, 5), null, 1)}
                                    </pre>
                                  </CollapsibleContent>
                                </Collapsible>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Comparison Table */}
                  <Card className="border-border bg-card/50">
                    <CardHeader className="py-2.5 px-4">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Detailed Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-[10px] h-7">Method</TableHead>
                            <TableHead className="text-[10px] h-7 text-right">Latency</TableHead>
                            <TableHead className="text-[10px] h-7 text-right">Entities</TableHead>
                            <TableHead className="text-[10px] h-7 text-right">Tokens</TableHead>
                            <TableHead className="text-[10px] h-7 text-right">Coverage</TableHead>
                            <TableHead className="text-[10px] h-7 text-right">Relevance</TableHead>
                            <TableHead className="text-[10px] h-7 text-right">Depth</TableHead>
                            <TableHead className="text-[10px] h-7 text-right">κ</TableHead>
                            <TableHead className="text-[10px] h-7 text-right">Composite</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentResults.map((r, i) => (
                            <TableRow key={r.method_id} className={`border-border ${i === 0 ? 'bg-primary/5' : ''}`}>
                              <TableCell className="text-xs font-medium py-1.5">
                                <div className="flex items-center gap-1.5">
                                  {i === 0 && <Trophy className="h-3 w-3 text-primary" />}
                                  {r.method_name}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono py-1.5">{r.latency_ms}ms</TableCell>
                              <TableCell className="text-xs text-right font-mono py-1.5">{r.entity_count}</TableCell>
                              <TableCell className="text-xs text-right font-mono py-1.5">{r.token_cost.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-right font-mono py-1.5">{(r.coverage * 100).toFixed(0)}%</TableCell>
                              <TableCell className="text-xs text-right font-mono py-1.5">{(r.relevance_score * 100).toFixed(0)}%</TableCell>
                              <TableCell className="text-xs text-right font-mono py-1.5">{r.depth_score.toFixed(2)}</TableCell>
                              <TableCell className="text-xs text-right font-mono py-1.5">{r.quality_score.toFixed(2)}</TableCell>
                              <TableCell className="text-xs text-right font-mono font-bold py-1.5">{r.composite_score.toFixed(3)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Bar chart for current run */}
                  <Card className="border-border bg-card/50">
                    <CardHeader className="py-2.5 px-4">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Score Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={currentResults.map(r => ({
                          name: r.method_id.toUpperCase(),
                          Relevance: Number((r.relevance_score * 100).toFixed(1)),
                          Coverage: Number((r.coverage * 100).toFixed(1)),
                          Quality: Number((r.quality_score * 100).toFixed(1)),
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="Relevance" fill="hsl(120, 100%, 44%)" />
                          <Bar dataKey="Coverage" fill="hsl(199, 89%, 48%)" />
                          <Bar dataKey="Quality" fill="hsl(38, 92%, 50%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Trend Chart — historical runs */}
              {trendData.length > 1 && (
                <Card className="border-border bg-card/50">
                  <CardHeader className="py-2.5 px-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Score Trend Across Runs</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="run" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 1]} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {METHODS.map(m => (
                          <Line
                            key={m.id}
                            type="monotone"
                            dataKey={`${m.id}_score`}
                            stroke={m.color}
                            name={m.name}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Quick Start / Empty state */}
              {currentResults.length === 0 && !isRunning && (
                <QuickStartGuide onPresetClick={() => applyPreset(PRESETS[0])} />
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default ContextLab;
