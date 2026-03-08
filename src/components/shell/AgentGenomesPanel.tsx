// AgentGenomesPanel — Full Agent Command Center
// Hierarchy view, genome details, context banks, trust matrix, tournaments, protocols

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dna, Brain, TrendingUp, Clock, ChevronRight, RefreshCw,
  Database, Activity, Shield, Swords, Users, BookOpen,
  Trophy, Star, AlertTriangle, ChevronDown, Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchAllGenomes, fetchContextBank, fetchSkillLog,
  fetchContextBankStats,
  type AgentGenome, type AgentContextEntry, type AgentSkillLogEntry,
} from '@/lib/agentGenomeService';

// ── Colors ──
const ROLE_COLORS: Record<string, string> = {
  planner: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  researcher: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  builder: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  verifier: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  auditor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  documenter: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  meta_observer: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const RANK_ICONS: Record<string, string> = {
  general: '⭐⭐⭐⭐',
  colonel: '⭐⭐⭐',
  lieutenant_colonel: '⭐⭐½',
  major: '⭐⭐',
  captain: '⭐',
  specialist: '•',
};

const CLEARANCE_COLORS: Record<string, string> = {
  top_secret: 'text-red-400',
  secret: 'text-amber-400',
  confidential: 'text-blue-400',
};

const CTX_ICONS: Record<string, string> = {
  skill_learned: '🎓', domain_knowledge: '📚', preference: '⚙️',
  pattern: '🔄', mistake: '⚠️', success: '✅', tool_usage: '🔧',
};

export default function AgentGenomesPanel() {
  const [genomes, setGenomes] = useState<any[]>([]);
  const [contextStats, setContextStats] = useState<Record<string, number>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [contextBank, setContextBank] = useState<AgentContextEntry[]>([]);
  const [skillLog, setSkillLog] = useState<AgentSkillLogEntry[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentRunning, setTournamentRunning] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [g, stats, { data: rels }, { data: protos }, { data: tourns }] = await Promise.all([
        fetchAllGenomes(),
        fetchContextBankStats(),
        supabase.from('agent_relationships').select('*').order('trust_score', { ascending: false }),
        supabase.from('agent_protocols').select('*').eq('is_active', true).order('priority', { ascending: false }),
        supabase.from('agent_tournaments').select('*').order('created_at', { ascending: false }).limit(10),
      ]);
      setGenomes(g);
      setContextStats(stats);
      setRelationships(rels || []);
      setProtocols(protos || []);
      setTournaments(tourns || []);
    } catch (e) {
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const selectAgent = useCallback(async (role: string) => {
    setSelectedAgent(role);
    const [ctx, skills] = await Promise.all([fetchContextBank(role), fetchSkillLog(role)]);
    setContextBank(ctx);
    setSkillLog(skills);
  }, []);

  const launchTournament = useCallback(async (type: string) => {
    setTournamentRunning(true);
    try {
      const { data: createRes, error: createErr } = await supabase.functions.invoke('agent-tournament', {
        body: { action: 'create_tournament', config: { tournament_type: type, rounds_total: 2 } },
      });
      if (createErr) throw createErr;
      toast.success(`Tournament created: ${createRes.tournament.id}`);

      const { data: runRes, error: runErr } = await supabase.functions.invoke('agent-tournament', {
        body: { action: 'run_full_tournament', tournament_id: createRes.tournament.id },
      });
      if (runErr) throw runErr;
      toast.success(`Tournament complete! Winner: ${runRes.overall_winner}`);
      loadAll();
    } catch (e: any) {
      toast.error(`Tournament failed: ${e.message || 'Unknown error'}`);
    } finally {
      setTournamentRunning(false);
    }
  }, [loadAll]);

  const sel = genomes.find(g => g.agent_role === selectedAgent) as any;
  const agentRels = relationships.filter(r => r.source_agent === selectedAgent || r.target_agent === selectedAgent);

  // Build hierarchy tree
  const general = genomes.find((g: any) => g.rank_tier === 0);
  const officers = genomes.filter((g: any) => g.rank_tier === 1);
  const specialists = genomes.filter((g: any) => g.rank_tier === 2);

  return (
    <div className="h-full flex flex-col gap-2 p-3">
      <Tabs defaultValue="hierarchy" className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="hierarchy" className="text-xs gap-1"><Users className="w-3 h-3" /> Chain of Command</TabsTrigger>
            <TabsTrigger value="detail" className="text-xs gap-1"><Dna className="w-3 h-3" /> Agent Detail</TabsTrigger>
            <TabsTrigger value="protocols" className="text-xs gap-1"><Shield className="w-3 h-3" /> Protocols</TabsTrigger>
            <TabsTrigger value="arena" className="text-xs gap-1"><Swords className="w-3 h-3" /> Tournament Arena</TabsTrigger>
            <TabsTrigger value="trust" className="text-xs gap-1"><Activity className="w-3 h-3" /> Trust Matrix</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadAll}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>

        {/* ═══ HIERARCHY TAB ═══ */}
        <TabsContent value="hierarchy" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-2">
              {/* General / Commander */}
              {general && (
                <div className="flex flex-col items-center">
                  <AgentCard agent={general} stats={contextStats} selected={selectedAgent === general.agent_role} onClick={() => selectAgent(general.agent_role)} />
                  <div className="w-px h-6 bg-border" />
                  {/* Officers */}
                  <div className="flex gap-4 justify-center flex-wrap">
                    {officers.map((off: any) => (
                      <div key={off.agent_role} className="flex flex-col items-center">
                        <AgentCard agent={off} stats={contextStats} selected={selectedAgent === off.agent_role} onClick={() => selectAgent(off.agent_role)} />
                        {(off.direct_reports || []).length > 0 && (
                          <>
                            <div className="w-px h-4 bg-border" />
                            <div className="flex gap-3">
                              {(off.direct_reports || []).map((dr: string) => {
                                const sub = genomes.find((g: any) => g.agent_role === dr);
                                return sub ? (
                                  <AgentCard key={dr} agent={sub} stats={contextStats} selected={selectedAgent === dr} onClick={() => selectAgent(dr)} compact />
                                ) : null;
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unattached specialists */}
              {specialists.filter((s: any) => !officers.some((o: any) => (o.direct_reports || []).includes(s.agent_role))).length > 0 && (
                <div className="flex gap-3 justify-center flex-wrap mt-4">
                  {specialists
                    .filter((s: any) => !officers.some((o: any) => (o.direct_reports || []).includes(s.agent_role)))
                    .map((s: any) => (
                      <AgentCard key={s.agent_role} agent={s} stats={contextStats} selected={selectedAgent === s.agent_role} onClick={() => selectAgent(s.agent_role)} compact />
                    ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ═══ DETAIL TAB ═══ */}
        <TabsContent value="detail" className="flex-1 min-h-0 mt-0">
          {sel ? (
            <div className="h-full grid grid-cols-3 gap-3 min-h-0">
              {/* Left: Identity */}
              <Card className="border-border/50 overflow-auto">
                <CardContent className="p-3 space-y-3">
                  <div>
                    <Badge className={ROLE_COLORS[sel.agent_role]}>{sel.display_name}</Badge>
                    <span className="ml-2 text-sm text-muted-foreground">{sel.agent_role}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-muted-foreground">Rank:</span> <span className="text-foreground">{RANK_ICONS[sel.rank] || '•'} {sel.rank}</span></div>
                    <div><span className="text-muted-foreground">Clearance:</span> <span className={CLEARANCE_COLORS[sel.clearance_level] || ''}>{sel.clearance_level}</span></div>
                    <div><span className="text-muted-foreground">Division:</span> <span className="text-foreground">{sel.division}</span></div>
                    <div><span className="text-muted-foreground">Reports to:</span> <span className="text-foreground">{sel.reports_to || 'NONE (top)'}</span></div>
                    <div><span className="text-muted-foreground">ELO:</span> <span className="text-foreground font-mono">{sel.elo_rating}</span></div>
                    <div><span className="text-muted-foreground">Tasks:</span> <span className="text-foreground font-mono">{sel.total_tasks_completed}</span></div>
                    <div><span className="text-muted-foreground">Wins/Losses:</span> <span className="text-foreground font-mono">{sel.tournament_wins}/{sel.tournament_losses}</span></div>
                    <div><span className="text-muted-foreground">κ Avg:</span> <span className="text-foreground font-mono">{(sel.avg_kappa * 100).toFixed(0)}%</span></div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground mb-1">SKILLS</h4>
                    {Object.entries(sel.skill_levels || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] text-muted-foreground w-28 truncate">{k.replace(/_/g, ' ')}</span>
                        <Progress value={(v as number) * 100} className="h-1 flex-1" />
                        <span className="text-[9px] font-mono w-6 text-right">{((v as number) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground mb-1">STANDING ORDERS</h4>
                    {(sel.standing_orders || []).map((o: string, i: number) => (
                      <p key={i} className="text-[10px] text-muted-foreground mb-0.5">• {o}</p>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground mb-1">RULES OF ENGAGEMENT</h4>
                    {(sel.rules_of_engagement || []).map((r: string, i: number) => (
                      <p key={i} className="text-[10px] text-muted-foreground mb-0.5">• {r}</p>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground mb-1">RELATIONSHIPS</h4>
                    {agentRels.map((r: any) => (
                      <div key={r.id} className="text-[10px] flex items-center justify-between mb-0.5">
                        <span className="text-muted-foreground">
                          {r.source_agent === selectedAgent ? `→ ${r.target_agent}` : `← ${r.source_agent}`}
                          <span className="ml-1 text-primary/60">[{r.relationship_type}]</span>
                        </span>
                        <span className="font-mono text-foreground">trust: {(r.trust_score * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Center: Context Bank */}
              <Card className="border-border/50 flex flex-col">
                <CardHeader className="p-2 pb-1">
                  <CardTitle className="text-xs flex items-center gap-1"><Database className="w-3 h-3 text-primary" /> Context Bank ({contextBank.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-2 flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    {contextBank.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No context entries yet. Agent builds context through task execution.</p>
                    ) : contextBank.map(e => (
                      <div key={e.id} className="bg-background/50 border border-border/30 rounded p-1.5 mb-1 text-[10px]">
                        <div className="flex justify-between">
                          <span>{CTX_ICONS[e.context_type] || '📝'} <span className="font-medium">{e.context_type.replace(/_/g, ' ')}</span></span>
                          <Badge variant="outline" className="text-[8px] px-1 py-0">imp: {(e.importance * 100).toFixed(0)}%</Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 mt-0.5">{e.content}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Right: Skill Log */}
              <Card className="border-border/50 flex flex-col">
                <CardHeader className="p-2 pb-1">
                  <CardTitle className="text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3 text-primary" /> Skill Evolution ({skillLog.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-2 flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    {skillLog.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No skill changes recorded yet.</p>
                    ) : skillLog.map(e => {
                      const up = (e.proficiency_after ?? 0) > (e.proficiency_before ?? 0);
                      return (
                        <div key={e.id} className="bg-background/50 border border-border/30 rounded p-1.5 mb-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="font-medium">{e.skill_name.replace(/_/g, ' ')}</span>
                            <span className={`font-mono ${up ? 'text-green-400' : 'text-red-400'}`}>
                              {((e.proficiency_before ?? 0) * 100).toFixed(0)}% → {((e.proficiency_after ?? 0) * 100).toFixed(0)}% {up ? '↑' : '↓'}
                            </span>
                          </div>
                          {e.trigger_event && <p className="text-muted-foreground">{e.trigger_event}: {e.details}</p>}
                        </div>
                      );
                    })}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Dna className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select an agent from the Hierarchy tab to view details.</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══ PROTOCOLS TAB ═══ */}
        <TabsContent value="protocols" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-2">
              {protocols.map((p: any) => (
                <Card key={p.id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={p.enforcement_level === 'mandatory' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {p.enforcement_level}
                        </Badge>
                        <span className="text-sm font-bold text-foreground">{p.protocol_name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{p.protocol_type.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    {p.applies_to && p.applies_to.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        <span className="text-[10px] text-muted-foreground">Applies to:</span>
                        {p.applies_to.map((a: string) => (
                          <Badge key={a} variant="outline" className="text-[9px] px-1 py-0">{a}</Badge>
                        ))}
                      </div>
                    )}
                    {p.violation_consequence && (
                      <p className="text-[10px] text-red-400/70 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> {p.violation_consequence}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ═══ ARENA TAB ═══ */}
        <TabsContent value="arena" className="flex-1 min-h-0 mt-0">
          <div className="h-full grid grid-cols-2 gap-3">
            {/* Left: Launch */}
            <div className="space-y-3">
              <Card className="border-border/50">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-sm flex items-center gap-1.5"><Swords className="w-4 h-4 text-primary" /> Launch Tournament</CardTitle>
                </CardHeader>
                <CardContent className="p-3 grid grid-cols-2 gap-2">
                  {[
                    { type: 'head_to_head', label: '⚔️ Head-to-Head Duel', desc: 'Agents compete on the same prompt' },
                    { type: 'red_vs_blue', label: '🔴🔵 Red vs Blue', desc: 'Attack vs Defense scenarios' },
                    { type: 'stress_test', label: '💪 Stress Test', desc: 'Chain-of-command under pressure' },
                    { type: 'memory_challenge', label: '🧠 Memory Challenge', desc: 'Context retention & recall' },
                  ].map(t => (
                    <Button
                      key={t.type}
                      variant="outline"
                      className="h-auto p-2 flex flex-col items-start text-left"
                      disabled={tournamentRunning}
                      onClick={() => launchTournament(t.type)}
                    >
                      <span className="text-xs font-bold">{t.label}</span>
                      <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Leaderboard */}
              <Card className="border-border/50">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-400" /> ELO Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {[...genomes].sort((a: any, b: any) => (b.elo_rating || 1200) - (a.elo_rating || 1200)).map((g: any, i: number) => (
                      <div key={g.agent_role} className="flex items-center justify-between text-[11px] bg-background/50 rounded p-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-muted-foreground w-4">#{i + 1}</span>
                          <Badge className={`text-[9px] px-1 py-0 ${ROLE_COLORS[g.agent_role]}`}>{g.display_name}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-foreground font-bold">{g.elo_rating || 1200}</span>
                          <span className="text-muted-foreground">{g.tournament_wins || 0}W / {g.tournament_losses || 0}L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: History */}
            <Card className="border-border/50 flex flex-col">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-primary" /> Tournament History</CardTitle>
              </CardHeader>
              <CardContent className="p-2 flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1.5 pr-2">
                    {tournaments.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No tournaments yet. Launch one above!</p>
                    ) : tournaments.map((t: any) => (
                      <div key={t.id} className="bg-background/50 border border-border/30 rounded p-2 text-[11px]">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-foreground">{t.tournament_name}</span>
                          <Badge variant={t.status === 'completed' ? 'default' : t.status === 'running' ? 'secondary' : 'outline'} className="text-[9px]">
                            {t.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>{t.tournament_type.replace(/_/g, ' ')}</span>
                          {t.winner && <span className="text-primary">🏆 {t.winner}</span>}
                        </div>
                        {t.completed_at && (
                          <span className="text-[9px] text-muted-foreground">{new Date(t.completed_at).toLocaleString()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TRUST MATRIX TAB ═══ */}
        <TabsContent value="trust" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="pr-2">
              {/* Trust Matrix Heatmap */}
              <Card className="border-border/50 mb-3">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs">Trust Score Matrix</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="overflow-x-auto">
                    <table className="text-[10px] w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-1 text-muted-foreground">From ↓ / To →</th>
                          {genomes.map((g: any) => (
                            <th key={g.agent_role} className="p-1 text-center text-muted-foreground">{g.display_name?.slice(0, 4)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {genomes.map((row: any) => (
                          <tr key={row.agent_role}>
                            <td className="p-1 font-medium text-foreground">{row.display_name}</td>
                            {genomes.map((col: any) => {
                              if (row.agent_role === col.agent_role) {
                                return <td key={col.agent_role} className="p-1 text-center text-muted-foreground/30">—</td>;
                              }
                              const rel = relationships.find(
                                (r: any) => r.source_agent === row.agent_role && r.target_agent === col.agent_role
                              );
                              const trust = rel?.trust_score ?? null;
                              const bg = trust === null ? '' :
                                trust > 0.8 ? 'bg-green-500/20 text-green-400' :
                                trust > 0.6 ? 'bg-emerald-500/15 text-emerald-400' :
                                trust > 0.4 ? 'bg-amber-500/15 text-amber-400' :
                                'bg-red-500/15 text-red-400';
                              return (
                                <td key={col.agent_role} className={`p-1 text-center font-mono ${bg} rounded`}>
                                  {trust !== null ? (trust * 100).toFixed(0) : ''}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Relationship Details */}
              <Card className="border-border/50">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs">All Relationships ({relationships.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {relationships.map((r: any) => (
                      <div key={r.id} className="bg-background/50 border border-border/30 rounded p-1.5 text-[10px]">
                        <div className="flex items-center gap-1">
                          <Badge className={`text-[8px] px-1 py-0 ${ROLE_COLORS[r.source_agent]}`}>{r.source_agent}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge className={`text-[8px] px-1 py-0 ${ROLE_COLORS[r.target_agent]}`}>{r.target_agent}</Badge>
                          <Badge variant="outline" className="text-[8px] px-1 py-0 ml-auto">{r.relationship_type}</Badge>
                        </div>
                        <div className="flex justify-between mt-0.5 text-muted-foreground">
                          <span>Trust: <span className="text-foreground font-mono">{(r.trust_score * 100).toFixed(0)}%</span></span>
                          <span>Collabs: {r.collaboration_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Agent Card Component ──
function AgentCard({ agent, stats, selected, onClick, compact }: {
  agent: any; stats: Record<string, number>; selected: boolean; onClick: () => void; compact?: boolean;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all border ${
        selected ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
      } ${compact ? 'w-36' : 'w-52'}`}
      onClick={onClick}
    >
      <CardContent className={compact ? 'p-2' : 'p-3'}>
        <div className="flex items-center justify-between mb-1">
          <Badge className={`text-[9px] px-1 py-0 ${ROLE_COLORS[agent.agent_role]}`}>{agent.display_name}</Badge>
          <span className="text-[9px]">{RANK_ICONS[agent.rank] || '•'}</span>
        </div>
        {!compact && <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">{agent.description}</p>}
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-1 text-[9px]`}>
          <div className="flex flex-col items-center bg-background/50 rounded p-0.5">
            <span className="text-muted-foreground">ELO</span>
            <span className="font-mono font-bold text-foreground">{agent.elo_rating || 1200}</span>
          </div>
          <div className="flex flex-col items-center bg-background/50 rounded p-0.5">
            <span className="text-muted-foreground">κ</span>
            <span className="font-mono font-bold text-foreground">{((agent.avg_kappa || 0.5) * 100).toFixed(0)}%</span>
          </div>
          {!compact && (
            <div className="flex flex-col items-center bg-background/50 rounded p-0.5">
              <span className="text-muted-foreground">Ctx</span>
              <span className="font-mono font-bold text-foreground">{stats[agent.agent_role] || 0}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
