// SystemProofDashboard — Live visual proof that all backend cognitive systems are operational
// Queries every AIMOS table in real-time and displays actual data, not toy pass/fail badges

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Activity, Database, Brain, Shield, Network, Eye, RefreshCw,
  Zap, Layers, Users, MessageSquare, Target, TrendingUp,
  CheckCircle, XCircle, Clock, Cpu, Search, GitCompare,
  AlertTriangle, BarChart3, Sparkles, HeartPulse,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SubsystemProof {
  name: string;
  table: string;
  icon: React.ElementType;
  count: number;
  recentItems: any[];
  status: 'healthy' | 'empty' | 'error' | 'loading';
  latencyMs: number;
  details: Record<string, any>;
}

interface FullSystemProof {
  timestamp: string;
  subsystems: SubsystemProof[];
  crossLinks: { from: string; to: string; count: number }[];
  overallHealth: number;
  totalLatency: number;
}

// ═══════════════════════════════════════════════════════════════
// SUBSYSTEM PROBES — Each queries a real table and returns proof
// ═══════════════════════════════════════════════════════════════

async function probeMemoryAtoms(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }, { data: tiers }] = await Promise.all([
      supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_memory_atoms').select('id, content, memory_level, confidence_score, content_type, tags, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('aimos_memory_atoms').select('memory_level').limit(500),
    ]);
    const tierCounts: Record<string, number> = {};
    (tiers || []).forEach((r: any) => { tierCounts[r.memory_level || 'unknown'] = (tierCounts[r.memory_level || 'unknown'] || 0) + 1; });
    return {
      name: 'CMC Memory Core', table: 'aimos_memory_atoms', icon: Database,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { tierDistribution: tierCounts, avgConfidence: recent?.length ? (recent.reduce((s: number, r: any) => s + (r.confidence_score || 0), 0) / recent.length).toFixed(3) : 0 },
    };
  } catch (e: any) {
    return { name: 'CMC Memory Core', table: 'aimos_memory_atoms', icon: Database, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probeReasoningChains(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }] = await Promise.all([
      supabase.from('aimos_reasoning_chains').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_reasoning_chains').select('id, user_query, final_answer, confidence_kappa, quality_tier, depth, response_type, created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    const avgKappa = recent?.length ? recent.reduce((s: number, r: any) => s + (r.confidence_kappa || 0), 0) / recent.length : 0;
    const tiers: Record<string, number> = {};
    (recent || []).forEach((r: any) => { tiers[r.quality_tier || 'unknown'] = (tiers[r.quality_tier || 'unknown'] || 0) + 1; });
    return {
      name: 'Reasoning Chains', table: 'aimos_reasoning_chains', icon: Brain,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { avgKappa: avgKappa.toFixed(3), qualityTiers: tiers, avgDepth: recent?.length ? (recent.reduce((s: number, r: any) => s + (r.depth || 0), 0) / recent.length).toFixed(1) : 0 },
    };
  } catch (e: any) {
    return { name: 'Reasoning Chains', table: 'aimos_reasoning_chains', icon: Brain, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probeEntities(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }, { count: relCount }] = await Promise.all([
      supabase.from('aimos_entities').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_entities').select('id, name, entity_type, confidence, description, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('aimos_entity_relationships').select('*', { count: 'exact', head: true }),
    ]);
    const types: Record<string, number> = {};
    (recent || []).forEach((r: any) => { types[r.entity_type || 'unknown'] = (types[r.entity_type || 'unknown'] || 0) + 1; });
    return {
      name: 'SEG Knowledge Graph', table: 'aimos_entities', icon: Network,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { entityTypes: types, relationshipCount: relCount || 0 },
    };
  } catch (e: any) {
    return { name: 'SEG Knowledge Graph', table: 'aimos_entities', icon: Network, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probePlans(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }, { count: taskCount }] = await Promise.all([
      supabase.from('aimos_plans').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_plans').select('id, title, objective, status, current_step, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('aimos_task_queue').select('*', { count: 'exact', head: true }),
    ]);
    const statuses: Record<string, number> = {};
    (recent || []).forEach((r: any) => { statuses[r.status || 'unknown'] = (statuses[r.status || 'unknown'] || 0) + 1; });
    return {
      name: 'APOE Plans & Tasks', table: 'aimos_plans', icon: Target,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { planStatuses: statuses, taskQueueSize: taskCount || 0 },
    };
  } catch (e: any) {
    return { name: 'APOE Plans & Tasks', table: 'aimos_plans', icon: Target, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probeClaimVerification(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }] = await Promise.all([
      supabase.from('aimos_claim_verification').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_claim_verification').select('id, claim_text, status, confidence, created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    const statuses: Record<string, number> = {};
    (recent || []).forEach((r: any) => { statuses[r.status || 'unknown'] = (statuses[r.status || 'unknown'] || 0) + 1; });
    return {
      name: 'VIF Claim Verification', table: 'aimos_claim_verification', icon: Shield,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { verificationStatuses: statuses },
    };
  } catch (e: any) {
    return { name: 'VIF Claim Verification', table: 'aimos_claim_verification', icon: Shield, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probeAgentDiscord(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }] = await Promise.all([
      supabase.from('aimos_agent_discord').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_agent_discord').select('id, agent_role, message_type, content, confidence, thread_id, created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    const roles: Record<string, number> = {};
    const types: Record<string, number> = {};
    (recent || []).forEach((r: any) => {
      roles[r.agent_role || 'unknown'] = (roles[r.agent_role || 'unknown'] || 0) + 1;
      types[r.message_type || 'unknown'] = (types[r.message_type || 'unknown'] || 0) + 1;
    });
    return {
      name: 'Agent Discord', table: 'aimos_agent_discord', icon: MessageSquare,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { agentRoles: roles, messageTypes: types },
    };
  } catch (e: any) {
    return { name: 'Agent Discord', table: 'aimos_agent_discord', icon: MessageSquare, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probeEvidenceGraph(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }] = await Promise.all([
      supabase.from('aimos_evidence_graph').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_evidence_graph').select('id, relationship_type, strength, validated, created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    const relTypes: Record<string, number> = {};
    let validatedCount = 0;
    (recent || []).forEach((r: any) => {
      relTypes[r.relationship_type || 'unknown'] = (relTypes[r.relationship_type || 'unknown'] || 0) + 1;
      if (r.validated) validatedCount++;
    });
    return {
      name: 'Evidence Graph', table: 'aimos_evidence_graph', icon: GitCompare,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { relationshipTypes: relTypes, validatedRatio: recent?.length ? (validatedCount / recent.length).toFixed(2) : 0 },
    };
  } catch (e: any) {
    return { name: 'Evidence Graph', table: 'aimos_evidence_graph', icon: GitCompare, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probeAgentGenomes(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }, { count: ctxCount }, { count: relCount }] = await Promise.all([
      supabase.from('agent_genomes').select('*', { count: 'exact', head: true }),
      supabase.from('agent_genomes').select('agent_role, display_name, rank, elo_rating, total_tasks_completed, avg_confidence, last_active_at').order('priority', { ascending: true }).limit(10),
      supabase.from('agent_context_bank').select('*', { count: 'exact', head: true }),
      supabase.from('agent_relationships').select('*', { count: 'exact', head: true }),
    ]);
    return {
      name: 'Agent Genomes & Identity', table: 'agent_genomes', icon: Users,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { contextBankEntries: ctxCount || 0, agentRelationships: relCount || 0, avgElo: recent?.length ? Math.round(recent.reduce((s: number, r: any) => s + (r.elo_rating || 1000), 0) / recent.length) : 0 },
    };
  } catch (e: any) {
    return { name: 'Agent Genomes & Identity', table: 'agent_genomes', icon: Users, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probeEvolutionProposals(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }, { count: auditCount }] = await Promise.all([
      supabase.from('evolution_proposals').select('*', { count: 'exact', head: true }),
      supabase.from('evolution_proposals').select('id, title, status, priority, confidence_score, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('self_audit_log' as any).select('*', { count: 'exact', head: true }),
    ]);
    const statuses: Record<string, number> = {};
    (recent || []).forEach((r: any) => { statuses[r.status || 'unknown'] = (statuses[r.status || 'unknown'] || 0) + 1; });
    return {
      name: 'Evolution & Self-Audit', table: 'evolution_proposals', icon: Sparkles,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { proposalStatuses: statuses, auditLogEntries: auditCount || 0 },
    };
  } catch (e: any) {
    return { name: 'Evolution & Self-Audit', table: 'evolution_proposals', icon: Sparkles, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probeConsciousnessMetrics(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }] = await Promise.all([
      supabase.from('aimos_consciousness_metrics').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_consciousness_metrics').select('id, metric_type, coherence_score, reasoning_depth, self_validation_score, measured_at').order('measured_at', { ascending: false }).limit(5),
    ]);
    return {
      name: 'Consciousness Metrics', table: 'aimos_consciousness_metrics', icon: Eye,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { avgCoherence: recent?.length ? (recent.reduce((s: number, r: any) => s + (r.coherence_score || 0), 0) / recent.length).toFixed(3) : 0 },
    };
  } catch (e: any) {
    return { name: 'Consciousness Metrics', table: 'aimos_consciousness_metrics', icon: Eye, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probeTagHierarchy(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }] = await Promise.all([
      supabase.from('aimos_tag_hierarchy').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_tag_hierarchy').select('id, tag_name, level, parent_tag, description, created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    const levels: Record<number, number> = {};
    (recent || []).forEach((r: any) => { levels[r.level || 0] = (levels[r.level || 0] || 0) + 1; });
    return {
      name: 'HHNI Tag Hierarchy', table: 'aimos_tag_hierarchy', icon: Layers,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { levelDistribution: levels },
    };
  } catch (e: any) {
    return { name: 'HHNI Tag Hierarchy', table: 'aimos_tag_hierarchy', icon: Layers, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

async function probeConfidenceMetrics(): Promise<SubsystemProof> {
  const start = performance.now();
  try {
    const [{ count }, { data: recent }] = await Promise.all([
      supabase.from('aimos_confidence_metrics').select('*', { count: 'exact', head: true }),
      supabase.from('aimos_confidence_metrics').select('id, entity_type, overall_confidence, factual_accuracy, consistency, completeness, relevance, validation_count, created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    return {
      name: 'VIF Confidence Scores', table: 'aimos_confidence_metrics', icon: BarChart3,
      count: count || 0, recentItems: recent || [], status: (count || 0) > 0 ? 'healthy' : 'empty',
      latencyMs: performance.now() - start,
      details: { avgConfidence: recent?.length ? (recent.reduce((s: number, r: any) => s + (r.overall_confidence || 0), 0) / recent.length).toFixed(3) : 0 },
    };
  } catch (e: any) {
    return { name: 'VIF Confidence Scores', table: 'aimos_confidence_metrics', icon: BarChart3, count: 0, recentItems: [], status: 'error', latencyMs: performance.now() - start, details: { error: e.message } };
  }
}

// ═══════════════════════════════════════════════════════════════
// LIVE PROOF RUNNER
// ═══════════════════════════════════════════════════════════════

async function runFullProof(): Promise<FullSystemProof> {
  const start = performance.now();
  const subsystems = await Promise.all([
    probeMemoryAtoms(),
    probeReasoningChains(),
    probeEntities(),
    probePlans(),
    probeClaimVerification(),
    probeAgentDiscord(),
    probeEvidenceGraph(),
    probeAgentGenomes(),
    probeEvolutionProposals(),
    probeConsciousnessMetrics(),
    probeTagHierarchy(),
    probeConfidenceMetrics(),
  ]);

  const healthy = subsystems.filter(s => s.status === 'healthy').length;
  const total = subsystems.length;

  return {
    timestamp: new Date().toISOString(),
    subsystems,
    crossLinks: [],
    overallHealth: total > 0 ? healthy / total : 0,
    totalLatency: performance.now() - start,
  };
}

// ═══════════════════════════════════════════════════════════════
// SUBSYSTEM CARD — Shows actual data from each backend table
// ═══════════════════════════════════════════════════════════════

const SubsystemCard: React.FC<{ proof: SubsystemProof; expanded: boolean; onToggle: () => void }> = ({ proof, expanded, onToggle }) => {
  const Icon = proof.icon;
  const statusColor = proof.status === 'healthy' ? 'text-emerald-400' : proof.status === 'empty' ? 'text-amber-400' : 'text-destructive';
  const borderColor = proof.status === 'healthy' ? 'border-emerald-500/20' : proof.status === 'empty' ? 'border-amber-500/20' : 'border-destructive/20';

  return (
    <Card className={`border ${borderColor} transition-all`}>
      <button onClick={onToggle} className="w-full text-left">
        <CardHeader className="py-2.5 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Icon className={`w-4 h-4 ${statusColor}`} />
              <span className="text-xs font-mono font-bold text-foreground">{proof.name}</span>
              <Badge variant="outline" className="text-[9px] font-mono">{proof.table}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-foreground font-bold">{proof.count.toLocaleString()}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{Math.round(proof.latencyMs)}ms</span>
              {proof.status === 'healthy' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              {proof.status === 'empty' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              {proof.status === 'error' && <XCircle className="w-3.5 h-3.5 text-destructive" />}
            </div>
          </div>
        </CardHeader>
      </button>

      {expanded && (
        <CardContent className="py-0 px-4 pb-3">
          {/* Details breakdown */}
          {Object.keys(proof.details).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.entries(proof.details).map(([key, val]) => (
                <div key={key} className="bg-muted/20 rounded px-2 py-1">
                  <span className="text-[9px] font-mono text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                  <span className="text-[10px] font-mono text-foreground font-medium">
                    {typeof val === 'object' ? Object.entries(val).map(([k, v]) => `${k}:${v}`).join(' ') : String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actual data rows */}
          {proof.recentItems.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Recent Data:</span>
              {proof.recentItems.map((item, i) => (
                <div key={i} className="bg-background/50 border border-border/30 rounded p-2 text-[10px] font-mono">
                  {renderDataRow(proof.table, item)}
                </div>
              ))}
            </div>
          )}

          {proof.recentItems.length === 0 && proof.status !== 'error' && (
            <div className="text-[10px] text-muted-foreground text-center py-3 font-mono">
              No data yet — run tests to populate this subsystem
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

function renderDataRow(table: string, item: any): React.ReactNode {
  switch (table) {
    case 'aimos_memory_atoms':
      return (
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[8px]">{item.memory_level || 'hot'}</Badge>
            <span className="text-muted-foreground">{item.content_type} · κ={((item.confidence_score || 0) * 100).toFixed(0)}%</span>
          </div>
          <p className="text-foreground leading-relaxed truncate">{(item.content || '').slice(0, 120)}</p>
          {item.tags?.length > 0 && <div className="flex gap-1">{item.tags.slice(0, 4).map((t: string, i: number) => <Badge key={i} variant="outline" className="text-[7px]">{t}</Badge>)}</div>}
        </div>
      );
    case 'aimos_reasoning_chains':
      return (
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[8px]">{item.quality_tier || '?'}</Badge>
            <span className="text-muted-foreground">κ={((item.confidence_kappa || 0)).toFixed(3)} · depth={item.depth}</span>
          </div>
          <p className="text-amber-300/80">Q: {(item.user_query || '').slice(0, 80)}</p>
          <p className="text-foreground truncate">A: {(item.final_answer || '').slice(0, 100)}</p>
        </div>
      );
    case 'aimos_entities':
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[8px]">{item.entity_type}</Badge>
            <span className="text-foreground font-medium">{item.name}</span>
          </div>
          <span className="text-muted-foreground">conf={((item.confidence || 0) * 100).toFixed(0)}%</span>
        </div>
      );
    case 'aimos_plans':
      return (
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <Badge variant={item.status === 'active' ? 'default' : 'outline'} className="text-[8px]">{item.status}</Badge>
            <span className="text-muted-foreground">step {item.current_step || 0}</span>
          </div>
          <p className="text-foreground">{item.title || item.objective?.slice(0, 80)}</p>
        </div>
      );
    case 'aimos_agent_discord':
      return (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[8px]">{item.agent_role}</Badge>
            <Badge variant="outline" className="text-[8px]">{item.message_type}</Badge>
            {item.confidence != null && <span className="text-muted-foreground">κ={((item.confidence) * 100).toFixed(0)}%</span>}
          </div>
          <p className="text-foreground truncate">{item.content?.slice(0, 100)}</p>
        </div>
      );
    case 'agent_genomes':
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-medium">{item.display_name}</span>
            <Badge variant="outline" className="text-[8px]">{item.rank || 'unranked'}</Badge>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>ELO: {item.elo_rating || 1000}</span>
            <span>Tasks: {item.total_tasks_completed || 0}</span>
            <span>κ={((item.avg_confidence || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>
      );
    case 'evolution_proposals':
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={item.status === 'approved' ? 'default' : item.status === 'pending' ? 'outline' : 'destructive'} className="text-[8px]">{item.status}</Badge>
            <span className="text-foreground">{item.title?.slice(0, 60)}</span>
          </div>
          <span className="text-muted-foreground">pri={item.priority} κ={((item.confidence_score || 0) * 100).toFixed(0)}%</span>
        </div>
      );
    default:
      return <pre className="text-foreground overflow-hidden">{JSON.stringify(item, null, 0).slice(0, 150)}</pre>;
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

const SystemProofDashboard: React.FC = () => {
  const [proof, setProof] = useState<FullSystemProof | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runProof = useCallback(async () => {
    setLoading(true);
    try {
      const result = await runFullProof();
      setProof(result);
      const healthy = result.subsystems.filter(s => s.status === 'healthy').length;
      const total = result.subsystems.length;
      if (!autoRefresh) {
        toast.success(`System Proof: ${healthy}/${total} subsystems active (${Math.round(result.totalLatency)}ms)`);
      }
    } catch (e: any) {
      toast.error(`Proof failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [autoRefresh]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      runProof();
      intervalRef.current = setInterval(runProof, 15000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, runProof]);

  // Initial load
  useEffect(() => { runProof(); }, []);

  const toggleExpanded = (name: string) => {
    setExpandedSystems(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const expandAll = () => {
    if (proof) setExpandedSystems(new Set(proof.subsystems.map(s => s.name)));
  };
  const collapseAll = () => setExpandedSystems(new Set());

  const healthyCount = proof?.subsystems.filter(s => s.status === 'healthy').length || 0;
  const totalCount = proof?.subsystems.length || 0;
  const emptyCount = proof?.subsystems.filter(s => s.status === 'empty').length || 0;
  const errorCount = proof?.subsystems.filter(s => s.status === 'error').length || 0;
  const totalRecords = proof?.subsystems.reduce((s, sub) => s + sub.count, 0) || 0;

  // Pie chart data
  const pieData = proof?.subsystems.filter(s => s.count > 0).map(s => ({ name: s.name.split(' ')[0], value: s.count })) || [];
  const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#84cc16', '#a855f7'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
            System Proof Dashboard
          </span>
          {proof && (
            <Badge variant={healthyCount === totalCount ? 'default' : 'outline'} className="text-[10px] font-mono">
              {healthyCount}/{totalCount} LIVE
            </Badge>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button onClick={() => setAutoRefresh(!autoRefresh)} size="sm" variant={autoRefresh ? 'default' : 'outline'} className="text-xs">
            <Activity className={`w-3 h-3 mr-1 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Live' : 'Auto'}
          </Button>
          <Button onClick={expandAll} size="sm" variant="outline" className="text-xs">
            <Eye className="w-3 h-3 mr-1" /> All
          </Button>
          <Button onClick={collapseAll} size="sm" variant="outline" className="text-xs">
            <Layers className="w-3 h-3 mr-1" /> Min
          </Button>
          <Button onClick={runProof} disabled={loading} size="sm" variant="default" className="text-xs">
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Probe All
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Health Overview */}
          {proof && (
            <>
              <div className="grid grid-cols-5 gap-2">
                <Card className="border-border/50">
                  <CardContent className="py-3 px-3 text-center">
                    <div className="text-lg font-mono font-bold text-emerald-400">{healthyCount}</div>
                    <div className="text-[9px] text-muted-foreground font-mono">HEALTHY</div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="py-3 px-3 text-center">
                    <div className="text-lg font-mono font-bold text-amber-400">{emptyCount}</div>
                    <div className="text-[9px] text-muted-foreground font-mono">EMPTY</div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="py-3 px-3 text-center">
                    <div className="text-lg font-mono font-bold text-destructive">{errorCount}</div>
                    <div className="text-[9px] text-muted-foreground font-mono">ERROR</div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="py-3 px-3 text-center">
                    <div className="text-lg font-mono font-bold text-foreground">{totalRecords.toLocaleString()}</div>
                    <div className="text-[9px] text-muted-foreground font-mono">TOTAL ROWS</div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="py-3 px-3 text-center">
                    <div className="text-lg font-mono font-bold text-foreground">{Math.round(proof.totalLatency)}ms</div>
                    <div className="text-[9px] text-muted-foreground font-mono">PROBE TIME</div>
                  </CardContent>
                </Card>
              </div>

              {/* Health bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span>SYSTEM HEALTH</span>
                  <span>{(proof.overallHealth * 100).toFixed(0)}%</span>
                </div>
                <Progress value={proof.overallHealth * 100} className="h-2" />
              </div>

              {/* Data Distribution Chart */}
              {pieData.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs font-mono flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5" /> Data Distribution Across Subsystems
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={pieData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            fontSize: 11,
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 2, 2, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Separator />
            </>
          )}

          {/* Subsystem Cards */}
          <div className="space-y-2">
            {proof?.subsystems.map(sub => (
              <SubsystemCard
                key={sub.name}
                proof={sub}
                expanded={expandedSystems.has(sub.name)}
                onToggle={() => toggleExpanded(sub.name)}
              />
            ))}
          </div>

          {!proof && !loading && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-sm font-mono text-muted-foreground">Click "Probe All" to scan every backend subsystem</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SystemProofDashboard;
