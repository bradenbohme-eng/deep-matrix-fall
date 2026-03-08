// AgentGenomesPanel — Persistent Agent Identity, Context Banks, and Skill Tracking UI

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dna, Brain, BookOpen, TrendingUp, Clock, Zap,
  ChevronRight, RefreshCw, Database, Star, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAllGenomes,
  fetchContextBank,
  fetchSkillLog,
  fetchContextBankStats,
  type AgentGenome,
  type AgentContextEntry,
  type AgentSkillLogEntry,
} from '@/lib/agentGenomeService';

const ROLE_COLORS: Record<string, string> = {
  planner: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  researcher: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  builder: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  verifier: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  auditor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  documenter: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  meta_observer: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const CONTEXT_TYPE_ICONS: Record<string, string> = {
  skill_learned: '🎓',
  domain_knowledge: '📚',
  preference: '⚙️',
  pattern: '🔄',
  mistake: '⚠️',
  success: '✅',
  tool_usage: '🔧',
};

export default function AgentGenomesPanel() {
  const [genomes, setGenomes] = useState<AgentGenome[]>([]);
  const [contextStats, setContextStats] = useState<Record<string, number>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [contextBank, setContextBank] = useState<AgentContextEntry[]>([]);
  const [skillLog, setSkillLog] = useState<AgentSkillLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGenomes = useCallback(async () => {
    setLoading(true);
    try {
      const [g, stats] = await Promise.all([fetchAllGenomes(), fetchContextBankStats()]);
      setGenomes(g);
      setContextStats(stats);
    } catch (e) {
      toast.error('Failed to load agent genomes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGenomes(); }, [loadGenomes]);

  const selectAgent = useCallback(async (role: string) => {
    setSelectedAgent(role);
    try {
      const [ctx, skills] = await Promise.all([fetchContextBank(role), fetchSkillLog(role)]);
      setContextBank(ctx);
      setSkillLog(skills);
    } catch (e) {
      toast.error('Failed to load agent details');
    }
  }, []);

  const selectedGenome = genomes.find(g => g.agent_role === selectedAgent);

  return (
    <div className="h-full flex gap-3 p-3">
      {/* Left: Agent Roster */}
      <div className="w-80 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Dna className="w-4 h-4 text-primary" /> Agent Genomes
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadGenomes}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2">
            {genomes.map(g => (
              <Card
                key={g.agent_role}
                className={`cursor-pointer transition-all border ${
                  selectedAgent === g.agent_role
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-border'
                }`}
                onClick={() => selectAgent(g.agent_role)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[g.agent_role] || 'bg-muted text-muted-foreground'}`}>
                        {g.display_name}
                      </Badge>
                      {g.last_active_at && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(g.last_active_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{g.description}</p>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <div className="flex flex-col items-center bg-background/50 rounded p-1">
                      <span className="text-muted-foreground">Tasks</span>
                      <span className="font-mono font-bold text-foreground">{g.total_tasks_completed}</span>
                    </div>
                    <div className="flex flex-col items-center bg-background/50 rounded p-1">
                      <span className="text-muted-foreground">κ Avg</span>
                      <span className="font-mono font-bold text-foreground">{(g.avg_kappa * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex flex-col items-center bg-background/50 rounded p-1">
                      <span className="text-muted-foreground">Context</span>
                      <span className="font-mono font-bold text-foreground">{contextStats[g.agent_role] || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Agent Detail */}
      <div className="flex-1 flex flex-col gap-3">
        {selectedGenome ? (
          <>
            {/* Header */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Badge className={`${ROLE_COLORS[selectedGenome.agent_role]}`}>
                        {selectedGenome.display_name}
                      </Badge>
                      <span className="text-muted-foreground text-sm font-normal">
                        ({selectedGenome.agent_role})
                      </span>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedGenome.description}</p>
                  </div>
                  <div className="text-right text-xs space-y-0.5">
                    <div className="text-muted-foreground">
                      Tokens: <span className="text-foreground font-mono">{selectedGenome.total_tokens_used.toLocaleString()}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Tasks: <span className="text-foreground font-mono">{selectedGenome.total_tasks_completed}</span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Skill Levels
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {Object.entries(selectedGenome.skill_levels || {}).map(([skill, level]) => (
                      <div key={skill} className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground w-32 truncate">
                          {skill.replace(/_/g, ' ')}
                        </span>
                        <Progress value={(level as number) * 100} className="h-1.5 flex-1" />
                        <span className="text-[10px] font-mono text-foreground w-8 text-right">
                          {((level as number) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capabilities */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(selectedGenome.capabilities || []).map(cap => (
                    <Badge key={cap} variant="outline" className="text-[10px] px-1.5 py-0">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Context Bank + Skill Log */}
            <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
              {/* Context Bank */}
              <Card className="border-border/50 flex flex-col">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-primary" />
                    Context Bank ({contextBank.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-1.5 pr-2">
                      {contextBank.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No context entries yet. Agent builds context through task execution.
                        </p>
                      )}
                      {contextBank.map(entry => (
                        <div
                          key={entry.id}
                          className="bg-background/50 border border-border/30 rounded p-2 text-[11px]"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span>
                              {CONTEXT_TYPE_ICONS[entry.context_type] || '📝'}{' '}
                              <span className="font-medium text-foreground">{entry.context_type.replace(/_/g, ' ')}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                imp: {(entry.importance * 100).toFixed(0)}%
                              </Badge>
                              <span className="text-muted-foreground">×{entry.access_count}</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">{entry.content}</p>
                          {entry.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {entry.tags.slice(0, 3).map(t => (
                                <span key={t} className="text-[9px] text-primary/70">#{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Skill Log */}
              <Card className="border-border/50 flex flex-col">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    Skill Evolution Log ({skillLog.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-1.5 pr-2">
                      {skillLog.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No skill changes recorded yet. Skills evolve after task execution.
                        </p>
                      )}
                      {skillLog.map(entry => {
                        const improved = (entry.proficiency_after ?? 0) > (entry.proficiency_before ?? 0);
                        return (
                          <div
                            key={entry.id}
                            className="bg-background/50 border border-border/30 rounded p-2 text-[11px]"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-foreground">
                                {entry.skill_name.replace(/_/g, ' ')}
                              </span>
                              <span className={`font-mono text-[10px] ${improved ? 'text-green-400' : 'text-red-400'}`}>
                                {((entry.proficiency_before ?? 0) * 100).toFixed(0)}%
                                → {((entry.proficiency_after ?? 0) * 100).toFixed(0)}%
                                {improved ? ' ↑' : ' ↓'}
                              </span>
                            </div>
                            {entry.trigger_event && (
                              <p className="text-muted-foreground text-[10px]">
                                Trigger: {entry.trigger_event}
                              </p>
                            )}
                            {entry.details && (
                              <p className="text-muted-foreground line-clamp-1">{entry.details}</p>
                            )}
                            <span className="text-[9px] text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Dna className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select an agent to view its genome, context bank, and skill evolution.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
