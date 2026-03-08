// ContextSyncDashboard — Bitemporal Contract Index Observability
// Canon §9: Full visibility into BCI state, gates, contradictions, remediation

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Network,
  Database,
  Zap,
  Eye,
  GitCompare,
  Layers,
  Target,
  Clock,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface BCIEntity {
  entity_id: string;
  kind: string;
  path: string;
  sync_status: string;
  parity_score: number;
  confidence_score: number;
  blast_radius: number;
  stale_reasons: string[];
  contradiction_refs: string[];
  created_at: string;
  updated_at: string;
  weights: any;
  contract: any;
}

interface SyncEvaluation {
  id: string;
  target_entities: string[];
  event: string;
  recommended_action: string;
  scores: any;
  detected_failures: string[];
  tx_time: string;
  status_before: string;
  status_after: string;
}

interface SyncContradiction {
  id: string;
  subject: string;
  object: string;
  relation: string;
  reason: string;
  severity: string;
  status: string;
  tx_time: string;
}

interface RemediationAtom {
  id: string;
  target_entity: string;
  failure_class: string;
  missing_dimensions: string[];
  retry_budget_remaining: number;
  status: string;
  narrowed_task: string;
  tx_time: string;
}

interface PolicyProfile {
  id: string;
  name: string;
  min_confidence: number;
  min_parity: number;
  min_witness_coverage: number;
  max_blast_radius_auto: number;
  is_active: boolean;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const ContextSyncDashboard: React.FC = () => {
  const [entities, setEntities] = useState<BCIEntity[]>([]);
  const [evaluations, setEvaluations] = useState<SyncEvaluation[]>([]);
  const [contradictions, setContradictions] = useState<SyncContradiction[]>([]);
  const [remediations, setRemediations] = useState<RemediationAtom[]>([]);
  const [policies, setPolicies] = useState<PolicyProfile[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [entRes, evalRes, contraRes, remRes, polRes] = await Promise.all([
        supabase.from('bci_entities').select('*').is('valid_time_end', null).order('updated_at', { ascending: false }).limit(100),
        supabase.from('sync_evaluations').select('*').order('tx_time', { ascending: false }).limit(30),
        supabase.from('sync_contradictions').select('*').eq('status', 'open').order('tx_time', { ascending: false }),
        supabase.from('sync_remediation_atoms').select('*').neq('status', 'completed').order('tx_time', { ascending: false }),
        supabase.from('sync_policy_profiles').select('*').order('name'),
      ]);

      setEntities((entRes.data || []) as BCIEntity[]);
      setEvaluations((evalRes.data || []) as SyncEvaluation[]);
      setContradictions((contraRes.data || []) as SyncContradiction[]);
      setRemediations((remRes.data || []) as RemediationAtom[]);
      setPolicies((polRes.data || []) as PolicyProfile[]);

      // Health check via edge function
      const { data: hData } = await supabase.functions.invoke('context-sync', {
        body: { action: 'health' },
      });
      setHealth(hData);
    } catch (e) {
      toast.error('Failed to load context sync data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Status distribution
  const statusCounts: Record<string, number> = {};
  const kindCounts: Record<string, number> = {};
  entities.forEach(e => {
    statusCounts[e.sync_status] = (statusCounts[e.sync_status] || 0) + 1;
    kindCounts[e.kind] = (kindCounts[e.kind] || 0) + 1;
  });

  const statusColors: Record<string, string> = {
    SYNCED: 'bg-primary/60',
    INDEXED: 'bg-info/60',
    STALE: 'bg-warning/60',
    DRIFTED: 'bg-warning/80',
    BLOCKED: 'bg-destructive/60',
    REMEDIATING: 'bg-destructive/40',
    PENDING_VALIDATION: 'bg-muted-foreground/40',
    UNINDEXED: 'bg-muted/40',
    SUPERSEDED: 'bg-muted/20',
    ARCHIVED: 'bg-muted/10',
  };

  const badgeVariant = (status: string) => {
    if (status === 'SYNCED' || status === 'PROCEED') return 'default';
    if (status === 'STALE' || status === 'WARN' || status === 'DRIFTED') return 'secondary';
    if (status === 'BLOCKED' || status === 'REMEDIATE' || status === 'ABSTAIN') return 'destructive';
    return 'outline';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
            Contextual Sync — BCI Dashboard
          </span>
          {health && (
            <Badge variant="outline" className="text-[10px] font-mono ml-2">
              {health.entity_count} entities
            </Badge>
          )}
        </div>
        <Button onClick={refresh} disabled={loading} size="sm" variant="outline" className="text-xs">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* ── BCI Overview ── */}
          <div className="grid grid-cols-6 gap-2">
            {[
              { label: 'Entities', value: entities.length, icon: Database },
              { label: 'Evaluations', value: evaluations.length, icon: Shield },
              { label: 'Contradictions', value: contradictions.length, icon: AlertTriangle },
              { label: 'Remediations', value: remediations.length, icon: Target },
              { label: 'Witnesses', value: health?.witness_count || 0, icon: Eye },
              { label: 'Policies', value: policies.length, icon: Zap },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="p-2.5 rounded-md bg-muted/30 border border-border/30 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xl font-mono text-foreground">{value}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Sync Status Distribution ── */}
          <Card className="border-border/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-primary" /> Sync Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              {entities.length > 0 ? (
                <>
                  <div className="flex h-5 rounded overflow-hidden border border-border/50 mb-2">
                    {Object.entries(statusCounts).map(([status, count]) => {
                      const pct = (count / entities.length) * 100;
                      return pct > 0 ? (
                        <div
                          key={status}
                          className={`${statusColors[status] || 'bg-muted/40'} flex items-center justify-center text-[8px] font-mono text-foreground transition-all`}
                          style={{ width: `${pct}%` }}
                          title={`${status}: ${count}`}
                        >
                          {pct > 12 && `${status.slice(0, 4)} ${count}`}
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <span key={status} className="text-[10px] font-mono text-muted-foreground">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${statusColors[status] || 'bg-muted'}`} />
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">No entities indexed yet</p>
              )}
            </CardContent>
          </Card>

          {/* ── Entity Heatmap Grid ── */}
          {entities.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 text-primary" /> Entity Sync Heatmap
                  <span className="text-[10px] text-muted-foreground ml-auto">click to inspect</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="flex flex-wrap gap-1">
                  {entities.slice(0, 60).map(ent => (
                    <button
                      key={ent.entity_id}
                      onClick={() => setSelectedEntity(selectedEntity === ent.entity_id ? null : ent.entity_id)}
                      className={`w-7 h-7 rounded text-[7px] font-mono border transition-all
                        ${statusColors[ent.sync_status] || 'bg-muted/30'}
                        ${selectedEntity === ent.entity_id ? 'ring-2 ring-primary scale-110' : 'border-border/20 hover:scale-105'}
                      `}
                      title={`${ent.entity_id} (${ent.sync_status})`}
                    >
                      {ent.kind[0]?.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Selected entity detail */}
                {selectedEntity && (() => {
                  const ent = entities.find(e => e.entity_id === selectedEntity);
                  if (!ent) return null;
                  return (
                    <div className="mt-3 p-3 rounded bg-surface-2 border border-border/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-foreground">{ent.entity_id}</span>
                        <Badge variant={badgeVariant(ent.sync_status)} className="text-[10px]">{ent.sync_status}</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-[10px]">
                        <div><span className="text-muted-foreground">Kind:</span> {ent.kind}</div>
                        <div><span className="text-muted-foreground">Path:</span> {ent.path || '—'}</div>
                        <div><span className="text-muted-foreground">Parity:</span> {(ent.parity_score * 100).toFixed(0)}%</div>
                        <div><span className="text-muted-foreground">Confidence:</span> {(ent.confidence_score * 100).toFixed(0)}%</div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">Blast Radius:</span>
                        <span className="font-mono text-foreground">{ent.blast_radius}</span>
                        {ent.stale_reasons?.length > 0 && (
                          <Badge variant="secondary" className="text-[9px]">{ent.stale_reasons.length} stale reasons</Badge>
                        )}
                        {ent.contradiction_refs?.length > 0 && (
                          <Badge variant="destructive" className="text-[9px]">{ent.contradiction_refs.length} contradictions</Badge>
                        )}
                      </div>
                      {ent.contract?.summary && (
                        <p className="text-[10px] text-muted-foreground border-t border-border/30 pt-1">{ent.contract.summary}</p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* ── Gate History ── */}
          <Card className="border-border/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary" /> Gate History
                <span className="text-[10px] text-muted-foreground ml-auto">{evaluations.length} evaluations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 space-y-1">
              {evaluations.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No evaluations yet</p>
              ) : (
                evaluations.slice(0, 10).map(ev => (
                  <div key={ev.id} className="flex items-center gap-2 p-2 rounded bg-muted/20 text-xs hover:bg-muted/30 transition-colors">
                    <Badge variant={badgeVariant(ev.recommended_action)} className="text-[10px] shrink-0">
                      {ev.recommended_action}
                    </Badge>
                    <span className="text-muted-foreground shrink-0">
                      κ={ev.scores?.kappa?.toFixed(3) || '?'}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      P={ev.scores?.parity?.toFixed(2) || '?'}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground">{ev.event || ev.target_entities?.join(', ')}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                      {new Date(ev.tx_time).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* ── Active Contradictions ── */}
          {contradictions.length > 0 && (
            <Card className="border-destructive/20">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5" /> Active Contradictions
                  <Badge variant="destructive" className="text-[10px] ml-auto">{contradictions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-1">
                {contradictions.map(c => (
                  <div key={c.id} className="p-2 rounded bg-destructive/5 border border-destructive/10 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-[9px]">{c.severity}</Badge>
                      <span className="font-mono text-foreground">{c.subject}</span>
                      <span className="text-muted-foreground">↔</span>
                      <span className="font-mono text-foreground">{c.object}</span>
                    </div>
                    <p className="text-muted-foreground">{c.reason || c.relation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Remediation Queue ── */}
          {remediations.length > 0 && (
            <Card className="border-warning/20">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2 text-warning">
                  <Target className="w-3.5 h-3.5" /> Remediation Queue
                  <Badge variant="secondary" className="text-[10px] ml-auto">{remediations.length} active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-1">
                {remediations.map(r => (
                  <div key={r.id} className="flex items-center gap-2 p-2 rounded bg-muted/20 text-xs">
                    <Badge variant="outline" className="text-[9px] shrink-0">{r.status}</Badge>
                    <span className="font-mono text-foreground truncate">{r.target_entity}</span>
                    <span className="text-muted-foreground shrink-0">retries: {r.retry_budget_remaining}</span>
                    {r.missing_dimensions?.length > 0 && (
                      <span className="text-[9px] text-muted-foreground">missing: {r.missing_dimensions.join(', ')}</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Policy Profiles ── */}
          <Card className="border-border/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary" /> Policy Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="grid grid-cols-3 gap-2">
                {policies.map(p => (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded border text-xs ${
                      p.is_active ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono font-bold text-foreground">{p.name}</span>
                      {p.is_active && <Badge className="text-[9px]">ACTIVE</Badge>}
                    </div>
                    <div className="space-y-0.5 text-[10px] text-muted-foreground">
                      <div>min κ: {p.min_confidence}</div>
                      <div>min parity: {p.min_parity}</div>
                      <div>min witness: {p.min_witness_coverage}</div>
                      <div>max blast: {p.max_blast_radius_auto}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Kind Distribution ── */}
          {Object.keys(kindCounts).length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <GitCompare className="w-3.5 h-3.5 text-primary" /> Entity Types
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(kindCounts).map(([kind, count]) => (
                    <Badge key={kind} variant="outline" className="text-[10px] font-mono">
                      {kind}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ContextSyncDashboard;
