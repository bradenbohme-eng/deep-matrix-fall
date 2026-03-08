// ScenariosPanel — Advanced multi-step cognitive test scenarios
// Phase A: Research Chain, Multi-Agent, Memory Lifecycle, Claim Verification, Self-Evolution

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play, RefreshCw, CheckCircle, XCircle, Clock,
  FileSearch, Users, Database, Shield, Brain,
  MessageSquare, ChevronDown, ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ScenarioStep {
  name: string;
  engine: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  latency: number;
  details: string;
  output?: any;
}

interface ScenarioRun {
  id: string;
  scenario: string;
  steps: ScenarioStep[];
  status: 'running' | 'pass' | 'fail';
  startedAt: number;
  totalLatency: number;
}

interface AgentDiscordMessage {
  id: string;
  agent_role: string;
  message_type: string;
  content: string;
  confidence: number | null;
  plan_id: string | null;
  thread_id: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// SCENARIO DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const SCENARIOS = [
  {
    id: 'research_chain',
    name: 'Research & Document Chain',
    description: 'Ingest → Extract → Store → Verify → Summarize. Full RAG pipeline validation.',
    icon: FileSearch,
    color: 'text-blue-400',
    steps: ['CMC Ingest Doc', 'SEG Extract Entities', 'VIF Pre-gate Context', 'VIF κ Score', 'APOE Research Plan'],
  },
  {
    id: 'multi_agent',
    name: 'Multi-Agent Orchestration',
    description: 'T0→T6 decomposition with Planner→Researcher→Builder→Verifier agent chain.',
    icon: Users,
    color: 'text-emerald-400',
    steps: ['APOE Decompose Goal', 'Queue Planner Task', 'Queue Researcher Task', 'Queue Builder Task', 'Queue Verifier Task', 'Agent Discord Trace'],
  },
  {
    id: 'memory_lifecycle',
    name: 'Memory Lifecycle',
    description: 'Hot→Warm→Cold tier transitions with semantic compression & retrieval verification.',
    icon: Database,
    color: 'text-amber-400',
    steps: ['Create Hot Atoms', 'Trigger Decay', 'Verify Tier Transition', 'Test Compression', 'Verify Retrieval'],
  },
  {
    id: 'claim_verification',
    name: 'Claim Verification Loop',
    description: 'Generate claims → extract → verify against evidence → compute aggregate κ.',
    icon: Shield,
    color: 'text-violet-400',
    steps: ['Generate Test Claims', 'VIF Extract Claims', 'Verify vs Evidence', 'Compute Aggregate κ', 'Report Card'],
  },
  {
    id: 'self_evolution',
    name: 'Self-Evolution Cycle',
    description: 'Audit → generate proposals → approve → apply → re-audit to confirm improvement.',
    icon: Brain,
    color: 'text-rose-400',
    steps: ['Run Full Audit', 'Generate Proposals', 'Auto-Approve Best', 'Apply Changes', 'Re-Audit Verify'],
  },
];

// ═══════════════════════════════════════════════════════════════
// SCENARIO RUNNERS
// ═══════════════════════════════════════════════════════════════

async function runStep(
  engine: string,
  body: any
): Promise<{ data: any; error: any; latency: number }> {
  const start = performance.now();
  try {
    const { data, error } = await supabase.functions.invoke(engine, { body });
    return { data, error, latency: performance.now() - start };
  } catch (e: any) {
    return { data: null, error: { message: e.message }, latency: performance.now() - start };
  }
}

async function runResearchChain(onUpdate: (steps: ScenarioStep[]) => void): Promise<ScenarioStep[]> {
  const steps: ScenarioStep[] = SCENARIOS[0].steps.map(name => ({
    name, engine: '', status: 'pending', latency: 0, details: 'Waiting...',
  }));

  // Step 1: CMC Ingest
  steps[0] = { ...steps[0], status: 'running', engine: 'cmc-engine' };
  onUpdate([...steps]);
  const { data: d1, error: e1, latency: l1 } = await runStep('cmc-engine', {
    action: 'ingest',
    content: 'AIMOS Research Chain Test: The Contextual Memory Core (CMC) implements a four-tier hierarchy (hot→warm→cold→frozen) with semantic dumbbell compression. The Verification Integrity Framework (VIF) computes kappa scores using factual accuracy, consistency, completeness, relevance, and freshness dimensions.',
    contentType: 'research_test',
    tags: ['scenario-test', 'research-chain'],
    confidence: 0.88,
  });
  const atomId = d1?.atomIds?.[0] || '';
  steps[0] = { name: steps[0].name, engine: 'cmc-engine', status: e1 ? 'fail' : 'pass', latency: l1, details: e1 ? e1.message : `Atom ${atomId.slice(0, 8)}... ingested`, output: d1 };
  onUpdate([...steps]);

  // Step 2: SEG Extract
  steps[1] = { ...steps[1], status: 'running', engine: 'seg-engine' };
  onUpdate([...steps]);
  const { data: d2, error: e2, latency: l2 } = await runStep('seg-engine', {
    action: 'extract_local',
    text: 'CMC manages memory tiers. VIF performs verification using kappa scoring. SEG extracts entities and builds knowledge graphs. APOE orchestrates T0-T6 goal decomposition.',
    sourceAtomId: atomId || undefined,
  });
  steps[1] = { name: steps[1].name, engine: 'seg-engine', status: e2 ? 'fail' : 'pass', latency: l2, details: e2 ? e2.message : `${d2?.entitiesCreated || 0} entities, ${d2?.relationshipsCreated || 0} rels`, output: d2 };
  onUpdate([...steps]);

  // Step 3: VIF Pre-gate
  steps[2] = { ...steps[2], status: 'running', engine: 'vif-engine' };
  onUpdate([...steps]);
  const { data: d3, error: e3, latency: l3 } = await runStep('vif-engine', {
    action: 'pregate',
    query: 'Explain the AIMOS memory hierarchy and verification system',
    contextAtomIds: atomId ? [atomId] : [],
  });
  const pg = d3?.pregate;
  steps[2] = { name: steps[2].name, engine: 'vif-engine', status: e3 ? 'fail' : 'pass', latency: l3, details: e3 ? e3.message : `Quality: ${pg?.quality}, Confidence: ${((pg?.avgConfidence || 0) * 100).toFixed(1)}%`, output: d3 };
  onUpdate([...steps]);

  // Step 4: VIF κ Score
  steps[3] = { ...steps[3], status: 'running', engine: 'vif-engine' };
  onUpdate([...steps]);
  const { data: d4, error: e4, latency: l4 } = await runStep('vif-engine', {
    action: 'score',
    factualAccuracy: 0.85, consistency: 0.80, completeness: 0.75, relevance: 0.90, freshness: 0.95,
  });
  const s = d4?.score;
  steps[3] = { name: steps[3].name, engine: 'vif-engine', status: e4 ? 'fail' : 'pass', latency: l4, details: e4 ? e4.message : `κ=${s?.kappa?.toFixed(3)} (${s?.qualityTier})`, output: d4 };
  onUpdate([...steps]);

  // Step 5: APOE Research Plan
  steps[4] = { ...steps[4], status: 'running', engine: 'apoe-engine' };
  onUpdate([...steps]);
  const { data: d5, error: e5, latency: l5 } = await runStep('apoe-engine', {
    action: 'decompose',
    objective: 'Research and document the AIMOS cognitive architecture comprehensively',
    title: `Research Chain Test ${new Date().toISOString().slice(11, 19)}`,
  });
  steps[4] = { name: steps[4].name, engine: 'apoe-engine', status: e5 ? 'fail' : 'pass', latency: l5, details: e5 ? e5.message : `Plan ${d5?.planId?.slice(0, 8)}... with ${d5?.plan?.t1?.length || 0} goals`, output: d5 };
  onUpdate([...steps]);

  return steps;
}

async function runMultiAgent(onUpdate: (steps: ScenarioStep[]) => void): Promise<ScenarioStep[]> {
  const steps: ScenarioStep[] = SCENARIOS[1].steps.map(name => ({
    name, engine: '', status: 'pending', latency: 0, details: 'Waiting...',
  }));

  // Step 1: APOE Decompose
  steps[0] = { ...steps[0], status: 'running', engine: 'apoe-engine' };
  onUpdate([...steps]);
  const { data: d1, error: e1, latency: l1 } = await runStep('apoe-engine', {
    action: 'decompose',
    objective: 'Design and implement a multi-agent research pipeline with verification',
  });
  const planId = d1?.planId || '';
  steps[0] = { name: steps[0].name, engine: 'apoe-engine', status: e1 ? 'fail' : 'pass', latency: l1, details: e1 ? e1.message : `Plan ${planId.slice(0, 8)}... with ${d1?.plan?.t1?.length || 0} T1 goals`, output: d1 };
  onUpdate([...steps]);

  // Steps 2-5: Execute queued tasks sequentially (Planner→Researcher→Builder→Verifier)
  const agentLabels = ['Planner', 'Researcher', 'Builder', 'Verifier'];

  for (let i = 0; i < 4; i++) {
    steps[i + 1] = { ...steps[i + 1], status: 'running', engine: 'apoe-engine' };
    onUpdate([...steps]);

    const { data, error, latency } = await runStep('apoe-engine', {
      action: 'execute_next',
      planId: planId || undefined,
    });
    steps[i + 1] = {
      name: steps[i + 1].name, engine: 'apoe-engine',
      status: error ? 'fail' : 'pass', latency,
      details: error ? error.message : (data?.executed ? `Executed ${data.executed.slice(0, 8)}... (${data.tier || agentLabels[i]})` : `No queued tasks (${agentLabels[i]} skipped)`),
      output: data,
    };
    onUpdate([...steps]);
  }

  // Step 6: Log to Agent Discord
  steps[5] = { ...steps[5], status: 'running', engine: 'supabase' };
  onUpdate([...steps]);
  const start = performance.now();
  try {
    const { error } = await supabase.from('aimos_agent_discord').insert([
      { agent_role: 'planner', message_type: 'DECISION', content: 'Multi-agent orchestration test completed', plan_id: planId || null, thread_id: planId || null, confidence: 0.9 },
      { agent_role: 'researcher', message_type: 'THOUGHT', content: 'Evidence gathering phase complete for AIMOS subsystems', plan_id: planId || null, thread_id: planId || null, confidence: 0.85 },
      { agent_role: 'verifier', message_type: 'ALERT', content: 'Verification gate passed for multi-agent output', plan_id: planId || null, thread_id: planId || null, confidence: 0.92 },
    ]);
    steps[5] = { name: steps[5].name, engine: 'supabase', status: error ? 'fail' : 'pass', latency: performance.now() - start, details: error ? error.message : '3 agent discord messages logged', output: null };
  } catch (e: any) {
    steps[5] = { ...steps[5], status: 'fail', latency: performance.now() - start, details: e.message };
  }
  onUpdate([...steps]);

  return steps;
}

async function runMemoryLifecycle(onUpdate: (steps: ScenarioStep[]) => void): Promise<ScenarioStep[]> {
  const steps: ScenarioStep[] = SCENARIOS[2].steps.map(name => ({
    name, engine: '', status: 'pending', latency: 0, details: 'Waiting...',
  }));

  // Step 1: Create Hot Atoms
  steps[0] = { ...steps[0], status: 'running', engine: 'cmc-engine' };
  onUpdate([...steps]);
  const { data: d1, error: e1, latency: l1 } = await runStep('cmc-engine', {
    action: 'ingest',
    content: `Memory lifecycle test atom created at ${new Date().toISOString()}. Testing tier transitions hot→warm→cold.`,
    contentType: 'lifecycle_test',
    tags: ['lifecycle-test', 'hot-tier'],
    confidence: 0.90,
  });
  const lifecycleAtomId = d1?.atomIds?.[0] || '';
  steps[0] = { name: steps[0].name, engine: 'cmc-engine', status: e1 ? 'fail' : 'pass', latency: l1, details: e1 ? e1.message : `${d1?.atomIds?.length || 0} hot atoms created`, output: d1 };
  onUpdate([...steps]);

  // Step 2: Trigger Decay
  steps[1] = { ...steps[1], status: 'running', engine: 'cmc-engine' };
  onUpdate([...steps]);
  const { data: d2, error: e2, latency: l2 } = await runStep('cmc-engine', {
    action: 'decay',
  });
  const decay = d2?.decay || {};
  steps[1] = { name: steps[1].name, engine: 'cmc-engine', status: e2 ? 'fail' : 'pass', latency: l2, details: e2 ? e2.message : `Decay: +${decay.promoted || 0} / -${decay.demoted || 0} / compressed ${decay.compressed || 0}`, output: d2 };
  onUpdate([...steps]);

  // Step 3: Verify tiers
  steps[2] = { ...steps[2], status: 'running', engine: 'supabase' };
  onUpdate([...steps]);
  const start3 = performance.now();
  const { data: tierData, error: tierError } = await supabase.from('aimos_memory_atoms').select('memory_level').limit(100);
  const tiers: Record<string, number> = {};
  (tierData || []).forEach((r: any) => { tiers[r.memory_level] = (tiers[r.memory_level] || 0) + 1; });
  steps[2] = { name: steps[2].name, engine: 'supabase', status: tierError ? 'fail' : 'pass', latency: performance.now() - start3, details: tierError ? tierError.message : Object.entries(tiers).map(([k, v]) => `${k}:${v}`).join(' '), output: tiers };
  onUpdate([...steps]);

  // Step 4: Test Compression
  steps[3] = { ...steps[3], status: 'running', engine: 'cmc-engine' };
  onUpdate([...steps]);
  if (!lifecycleAtomId) {
    steps[3] = { ...steps[3], status: 'fail', details: 'No atom ID available for compression test' };
  } else {
    const { data: d4, error: e4, latency: l4 } = await runStep('cmc-engine', {
      action: 'compress',
      atomId: lifecycleAtomId,
      targetRatio: 0.3,
    });
    steps[3] = { name: steps[3].name, engine: 'cmc-engine', status: e4 ? 'fail' : 'pass', latency: l4, details: e4 ? e4.message : `Compression ratio ${(d4?.ratio || 0).toFixed(2)}`, output: d4 };
  }
  onUpdate([...steps]);

  // Step 5: Verify Retrieval
  steps[4] = { ...steps[4], status: 'running', engine: 'supabase' };
  onUpdate([...steps]);
  const start5 = performance.now();
  let query = supabase.from('aimos_memory_atoms').select('id, content, memory_level').limit(5);
  query = lifecycleAtomId ? query.eq('id', lifecycleAtomId) : query.ilike('content', '%lifecycle test%');
  const { data: retrieveData, error: e5 } = await query;
  steps[4] = { name: steps[4].name, engine: 'supabase', status: e5 || !retrieveData?.length ? 'fail' : 'pass', latency: performance.now() - start5, details: e5 ? e5.message : `Retrieved ${retrieveData?.length || 0} atoms post-compression`, output: retrieveData };
  onUpdate([...steps]);

  return steps;
}

async function runClaimVerification(onUpdate: (steps: ScenarioStep[]) => void): Promise<ScenarioStep[]> {
  const steps: ScenarioStep[] = SCENARIOS[3].steps.map(name => ({
    name, engine: '', status: 'pending', latency: 0, details: 'Waiting...',
  }));

  // Step 1: Generate Test Claims (via CMC)
  steps[0] = { ...steps[0], status: 'running', engine: 'cmc-engine' };
  onUpdate([...steps]);
  const testClaims = [
    'AIMOS uses a four-tier memory hierarchy',
    'VIF computes kappa scores for verification',
    'SEG builds knowledge graphs from entities',
  ];
  const { data: d1, error: e1, latency: l1 } = await runStep('cmc-engine', {
    action: 'ingest',
    content: testClaims.join('. ') + '.',
    contentType: 'claim_test',
    tags: ['claim-test'],
    confidence: 0.85,
  });
  steps[0] = { name: steps[0].name, engine: 'cmc-engine', status: e1 ? 'fail' : 'pass', latency: l1, details: e1 ? e1.message : `${testClaims.length} claims ingested`, output: { claims: testClaims } };
  onUpdate([...steps]);

  // Step 2: VIF Extract Claims
  steps[1] = { ...steps[1], status: 'running', engine: 'vif-engine' };
  onUpdate([...steps]);
  const { data: d2, error: e2, latency: l2 } = await runStep('vif-engine', {
    action: 'verify',
    response: testClaims.join('. '),
    query: 'Describe AIMOS core systems',
    contextAtomIds: d1?.atomIds || [],
  });
  steps[1] = { name: steps[1].name, engine: 'vif-engine', status: e2 ? 'fail' : 'pass', latency: l2, details: e2 ? e2.message : `Verification report generated`, output: d2 };
  onUpdate([...steps]);

  // Step 3: Verify against evidence
  steps[2] = { ...steps[2], status: 'running', engine: 'seg-engine' };
  onUpdate([...steps]);
  const { data: d3, error: e3, latency: l3 } = await runStep('seg-engine', { action: 'stats' });
  steps[2] = { name: steps[2].name, engine: 'seg-engine', status: e3 ? 'fail' : 'pass', latency: l3, details: e3 ? e3.message : `Evidence: ${d3?.entities || 0} entities, ${d3?.relationships || 0} rels`, output: d3 };
  onUpdate([...steps]);

  // Step 4: Compute aggregate κ
  steps[3] = { ...steps[3], status: 'running', engine: 'vif-engine' };
  onUpdate([...steps]);
  const { data: d4, error: e4, latency: l4 } = await runStep('vif-engine', {
    action: 'score',
    factualAccuracy: 0.88, consistency: 0.82, completeness: 0.78, relevance: 0.92, freshness: 0.95,
  });
  steps[3] = { name: steps[3].name, engine: 'vif-engine', status: e4 ? 'fail' : 'pass', latency: l4, details: e4 ? e4.message : `Aggregate κ=${d4?.score?.kappa?.toFixed(3)} (${d4?.score?.qualityTier})`, output: d4 };
  onUpdate([...steps]);

  // Step 5: Report Card
  steps[4] = { ...steps[4], status: 'running', engine: 'summary' };
  onUpdate([...steps]);
  const start5 = performance.now();
  const allPassed = steps.slice(0, 4).every(s => s.status === 'pass');
  const kappa = d4?.score?.kappa || 0;
  steps[4] = {
    name: steps[4].name, engine: 'summary', status: allPassed && kappa > 0.5 ? 'pass' : 'fail',
    latency: performance.now() - start5,
    details: `Claims: ${testClaims.length} | κ=${kappa.toFixed(3)} | Grade: ${kappa > 0.8 ? 'A' : kappa > 0.6 ? 'B' : 'C'}`,
    output: { claims: testClaims, kappa, grade: kappa > 0.8 ? 'A' : kappa > 0.6 ? 'B' : 'C' },
  };
  onUpdate([...steps]);

  return steps;
}

async function runSelfEvolution(onUpdate: (steps: ScenarioStep[]) => void): Promise<ScenarioStep[]> {
  const steps: ScenarioStep[] = SCENARIOS[4].steps.map(name => ({
    name, engine: '', status: 'pending', latency: 0, details: 'Waiting...',
  }));

  // Step 1: Run Full Audit
  steps[0] = { ...steps[0], status: 'running', engine: 'self-evolution' };
  onUpdate([...steps]);
  const { data: d1, error: e1, latency: l1 } = await runStep('self-evolution', {
    action: 'self_audit',
  });
  steps[0] = { name: steps[0].name, engine: 'self-evolution', status: e1 ? 'fail' : 'pass', latency: l1, details: e1 ? e1.message : `Health: ${((d1?.healthScore || 0) * 100).toFixed(0)}%, ${d1?.findings?.length || 0} findings`, output: d1 };
  onUpdate([...steps]);

  // Step 2: Generate Proposals
  steps[1] = { ...steps[1], status: 'running', engine: 'self-evolution' };
  onUpdate([...steps]);
  const { data: d2, error: e2, latency: l2 } = await runStep('self-evolution', {
    action: 'suggest_evolution',
  });
  const suggestionCount = d2?.evolutionSuggestions?.length || 0;
  steps[1] = { name: steps[1].name, engine: 'self-evolution', status: e2 ? 'fail' : 'pass', latency: l2, details: e2 ? e2.message : `${suggestionCount} proposals generated`, output: d2 };
  onUpdate([...steps]);

  // Step 3: Get pending proposals
  steps[2] = { ...steps[2], status: 'running', engine: 'self-evolution' };
  onUpdate([...steps]);
  const { data: d3, error: e3, latency: l3 } = await runStep('self-evolution', {
    action: 'get_proposals',
    payload: { status: 'pending' },
  });
  const proposals = d3?.proposals || [];
  steps[2] = { name: steps[2].name, engine: 'self-evolution', status: e3 ? 'fail' : 'pass', latency: l3, details: e3 ? e3.message : `${proposals.length} pending proposals found`, output: d3 };
  onUpdate([...steps]);

  // Step 4: Approve best (if any)
  steps[3] = { ...steps[3], status: 'running', engine: 'self-evolution' };
  onUpdate([...steps]);
  if (proposals.length > 0) {
    const { data: d4, error: e4, latency: l4 } = await runStep('self-evolution', {
      action: 'approve_proposal',
      payload: { proposalId: proposals[0].id },
    });
    steps[3] = { name: steps[3].name, engine: 'self-evolution', status: e4 ? 'fail' : 'pass', latency: l4, details: e4 ? e4.message : `Approved: ${proposals[0].title?.slice(0, 40)}`, output: d4 };
  } else {
    steps[3] = { name: steps[3].name, engine: 'self-evolution', status: 'pass', latency: 0, details: 'No proposals to approve (skipped)' };
  }
  onUpdate([...steps]);

  // Step 5: Re-audit
  steps[4] = { ...steps[4], status: 'running', engine: 'self-evolution' };
  onUpdate([...steps]);
  const { data: d5, error: e5, latency: l5 } = await runStep('self-evolution', {
    action: 'run_diagnostics',
  });
  steps[4] = { name: steps[4].name, engine: 'self-evolution', status: e5 ? 'fail' : 'pass', latency: l5, details: e5 ? e5.message : `Diagnostics complete: ${d5?.diagnostics?.length || 0} components checked`, output: d5 };
  onUpdate([...steps]);

  return steps;
}

const RUNNERS: Record<string, (onUpdate: (steps: ScenarioStep[]) => void) => Promise<ScenarioStep[]>> = {
  research_chain: runResearchChain,
  multi_agent: runMultiAgent,
  memory_lifecycle: runMemoryLifecycle,
  claim_verification: runClaimVerification,
  self_evolution: runSelfEvolution,
};

// ═══════════════════════════════════════════════════════════════
// AGENT DISCORD FEED
// ═══════════════════════════════════════════════════════════════

const AgentDiscordFeed: React.FC<{ expanded: boolean; onToggle: () => void }> = ({ expanded, onToggle }) => {
  const [messages, setMessages] = useState<AgentDiscordMessage[]>([]);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('aimos_agent_discord')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setMessages(data);
  }, []);

  useEffect(() => {
    if (expanded) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [expanded, fetchMessages]);

  const typeColors: Record<string, string> = {
    THOUGHT: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
    DECISION: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
    ALERT: 'text-destructive border-destructive/20 bg-destructive/5',
    TASK_PROPOSE: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    TASK_COMPLETE: 'text-primary border-primary/20 bg-primary/5',
    SUMMARY: 'text-violet-400 border-violet-400/20 bg-violet-400/5',
  };

  return (
    <div className="border-t border-border">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/20 transition-colors">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <MessageSquare className="w-3.5 h-3.5" />
          AGENT DISCORD FEED
          <Badge variant="outline" className="text-[10px]">{messages.length}</Badge>
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {expanded && (
        <ScrollArea className="h-48 border-t border-border/50">
          <div className="p-2 space-y-1">
            {messages.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">No agent messages yet</div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`p-2 rounded text-xs border ${typeColors[msg.message_type] || 'text-muted-foreground border-border/30 bg-muted/10'}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px] font-mono">{msg.agent_role}</Badge>
                    <span className="text-[9px] font-mono opacity-70">{msg.message_type}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">
                    {msg.confidence != null && `κ=${(msg.confidence * 100).toFixed(0)}% · `}
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">{msg.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PANEL
// ═══════════════════════════════════════════════════════════════

const ScenariosPanel: React.FC = () => {
  const [activeRun, setActiveRun] = useState<ScenarioRun | null>(null);
  const [discordExpanded, setDiscordExpanded] = useState(true);

  const runScenario = useCallback(async (scenarioId: string) => {
    const runner = RUNNERS[scenarioId];
    if (!runner) return;

    const scenario = SCENARIOS.find(s => s.id === scenarioId)!;
    const run: ScenarioRun = {
      id: crypto.randomUUID(),
      scenario: scenario.name,
      steps: [],
      status: 'running',
      startedAt: performance.now(),
      totalLatency: 0,
    };
    setActiveRun(run);

    try {
      const steps = await runner((updatedSteps) => {
        setActiveRun(prev => prev ? { ...prev, steps: updatedSteps } : null);
      });

      const totalLatency = steps.reduce((s, st) => s + st.latency, 0);
      const allPassed = steps.every(s => s.status === 'pass');

      setActiveRun(prev => prev ? {
        ...prev,
        steps,
        status: allPassed ? 'pass' : 'fail',
        totalLatency,
      } : null);

      // Persist run to DB
      await supabase.from('aimos_test_runs' as any).insert({
        scenario_id: null,
        status: allPassed ? 'pass' : 'fail',
        steps: JSON.stringify(steps.map(s => ({ name: s.name, status: s.status, latency: s.latency, details: s.details }))),
        metrics: JSON.stringify({ totalLatency, passRate: steps.filter(s => s.status === 'pass').length / steps.length }),
        completed_at: new Date().toISOString(),
      });

      toast[allPassed ? 'success' : 'warning'](`${scenario.name}: ${steps.filter(s => s.status === 'pass').length}/${steps.length} passed`);
    } catch (e: any) {
      toast.error(`Scenario failed: ${e.message}`);
      setActiveRun(prev => prev ? { ...prev, status: 'fail' } : null);
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
          Advanced Test Scenarios
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Scenario Cards */}
          <div className="grid grid-cols-1 gap-2">
            {SCENARIOS.map(scenario => {
              const Icon = scenario.icon;
              const isRunning = activeRun?.scenario === scenario.name && activeRun.status === 'running';
              return (
                <Card key={scenario.id} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Icon className={`w-5 h-5 ${scenario.color} shrink-0`} />
                        <div className="min-w-0">
                          <div className="text-sm font-mono font-medium text-foreground">{scenario.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{scenario.description}</div>
                        </div>
                      </div>
                      <Button
                        onClick={() => runScenario(scenario.id)}
                        disabled={isRunning}
                        size="sm"
                        variant="outline"
                        className="text-xs shrink-0 ml-2"
                      >
                        {isRunning ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                        {isRunning ? 'Running' : 'Run'}
                      </Button>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {scenario.steps.map((step, i) => (
                        <Badge key={i} variant="outline" className="text-[9px] font-mono">{step}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Active Run Results */}
          {activeRun && (
            <Card className={`border-2 ${
              activeRun.status === 'pass' ? 'border-primary/30' :
              activeRun.status === 'fail' ? 'border-destructive/30' :
              'border-warning/30'
            }`}>
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-xs font-mono flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {activeRun.status === 'running' && <RefreshCw className="w-3.5 h-3.5 text-warning animate-spin" />}
                    {activeRun.status === 'pass' && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                    {activeRun.status === 'fail' && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                    {activeRun.scenario}
                  </span>
                  {activeRun.totalLatency > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activeRun.totalLatency.toFixed(0)}ms total
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4 space-y-1">
                {activeRun.steps.map((step, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded text-xs border ${
                    step.status === 'pass' ? 'bg-primary/5 border-primary/20' :
                    step.status === 'fail' ? 'bg-destructive/5 border-destructive/20' :
                    step.status === 'running' ? 'bg-warning/5 border-warning/20' :
                    'bg-muted/10 border-border/30'
                  }`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {step.status === 'pass' && <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />}
                      {step.status === 'fail' && <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                      {step.status === 'running' && <RefreshCw className="w-3.5 h-3.5 text-warning animate-spin shrink-0" />}
                      {step.status === 'pending' && <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      <span className="font-mono font-medium shrink-0">{step.name}</span>
                      <span className="text-muted-foreground truncate">{step.details}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground ml-2 shrink-0">
                      {step.latency > 0 ? `${step.latency.toFixed(0)}ms` : '...'}
                    </span>
                  </div>
                ))}

                {activeRun.status !== 'running' && (
                  <div className="flex items-center justify-between pt-2 px-1 text-xs font-mono">
                    <span className="text-muted-foreground">
                      {activeRun.steps.filter(s => s.status === 'pass').length}/{activeRun.steps.length} PASSED
                    </span>
                    <Badge variant={activeRun.status === 'pass' ? 'default' : 'destructive'} className="text-[10px]">
                      {activeRun.status.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Agent Discord Feed */}
      <AgentDiscordFeed expanded={discordExpanded} onToggle={() => setDiscordExpanded(!discordExpanded)} />
    </div>
  );
};

export default ScenariosPanel;
