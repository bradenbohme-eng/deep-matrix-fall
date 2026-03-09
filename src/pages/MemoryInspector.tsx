import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Brain, BookCheck, AlertTriangle, FileCheck, RefreshCw,
  CheckCircle2, XCircle, Clock, Loader2, ChevronRight, Shield,
  Layers, Database, Sparkles, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  listProposals, resolveProposal, listCanonEntries, demoteCanonEntry,
  reportContradiction, listContradictions,
  type ProposalRecord,
} from '@/lib/kernel/memoryProposals';

// ─── Types ───

interface CanonEntry {
  id: string;
  memory_id: string;
  canonical_domain: string;
  status: string;
  promotion_reason: string | null;
  demotion_reason: string | null;
  evidence_ids: string[] | null;
  contradiction_count: number;
  created_at: string;
  updated_at: string;
}

interface ContradictionRecord {
  id: string;
  left_memory_id: string;
  right_memory_id: string;
  contradiction_type: string;
  severity: string;
  resolution_status: string;
  recommended_resolution: string | null;
  created_at: string;
}

// ─── Proposals Tab ───

const ProposalsTab: React.FC = () => {
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [filter, setFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listProposals(filter === 'all' ? undefined : filter as any, 100);
    setProposals(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleResolve = async (id: string, resolution: 'approved' | 'rejected') => {
    setResolving(id);
    const ok = await resolveProposal(id, resolution, 'inspector-user');
    if (ok) {
      toast.success(`Proposal ${resolution}`);
      refresh();
    } else {
      toast.error('Failed to resolve proposal');
    }
    setResolving(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/30 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px]">{proposals.length} results</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        {proposals.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Brain className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">No proposals found</p>
            <p className="text-xs mt-1">Memory write proposals will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {proposals.map(p => (
              <Card key={p.id} className="border-border bg-card/60 hover:bg-card/80 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-mono">{p.target_memory_type}</Badge>
                        <Badge
                          variant={p.resolution_status === 'approved' ? 'default' : p.resolution_status === 'rejected' ? 'destructive' : 'secondary'}
                          className="text-[10px]"
                        >
                          {p.resolution_status}
                        </Badge>
                        {p.proposed_canonicality === 'canonical' && (
                          <Badge className="text-[10px] bg-accent/20 text-accent border-accent/30">CANON</Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground/90 line-clamp-2 mb-1">{p.candidate_content}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        <span className="text-muted-foreground/70">Rationale:</span> {p.rationale}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">κ</span>
                          <Progress value={p.confidence * 100} className="w-16 h-1.5" />
                          <span className="text-[10px] font-mono text-muted-foreground">{p.confidence.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">imp</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{p.importance.toFixed(2)}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/50">
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {p.resolution_status === 'pending' && (
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          className="h-6 text-[10px] px-2 bg-success/20 text-success hover:bg-success/30 border border-success/30"
                          onClick={() => handleResolve(p.id, 'approved')}
                          disabled={resolving === p.id}
                        >
                          {resolving === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] px-2 text-destructive hover:bg-destructive/10"
                          onClick={() => handleResolve(p.id, 'rejected')}
                          disabled={resolving === p.id}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.tags.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border/50">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// ─── Canon Tab ───

const CanonTab: React.FC = () => {
  const [entries, setEntries] = useState<CanonEntry[]>([]);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listCanonEntries(domainFilter === 'all' ? undefined : domainFilter);
    setEntries(data as CanonEntry[]);
    setLoading(false);
  }, [domainFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDemote = async (id: string) => {
    const ok = await demoteCanonEntry(id, 'Demoted via Memory Inspector review');
    if (ok) {
      toast.success('Canon entry demoted');
      refresh();
    } else {
      toast.error('Failed to demote');
    }
  };

  const domains = [...new Set(entries.map(e => e.canonical_domain))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-muted/30 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px]">{entries.length} canonical</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        {entries.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BookCheck className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">No canon entries</p>
            <p className="text-xs mt-1">Approved proposals promoted to canonical will appear here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Domain</TableHead>
                <TableHead className="text-[10px]">Memory ID</TableHead>
                <TableHead className="text-[10px]">Reason</TableHead>
                <TableHead className="text-[10px]">Contradictions</TableHead>
                <TableHead className="text-[10px]">Date</TableHead>
                <TableHead className="text-[10px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">{e.canonical_domain}</Badge>
                  </TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground max-w-[120px] truncate">
                    {e.memory_id}
                  </TableCell>
                  <TableCell className="text-[10px] text-foreground/80 max-w-[200px] truncate">
                    {e.promotion_reason || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={e.contradiction_count > 0 ? 'destructive' : 'secondary'}
                      className="text-[10px]"
                    >
                      {e.contradiction_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                      onClick={() => handleDemote(e.id)}
                    >
                      Demote
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
};

// ─── Contradictions Tab ───

const ContradictionsTab: React.FC = () => {
  const [contradictions, setContradictions] = useState<ContradictionRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState('open');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listContradictions(statusFilter);
    setContradictions(data as ContradictionRecord[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'high': return 'bg-warning/20 text-warning border-warning/30';
      case 'medium': return 'bg-info/20 text-info border-info/30';
      default: return 'bg-muted/30 text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-muted/30 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px]">{contradictions.length} records</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        {contradictions.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">No contradictions</p>
            <p className="text-xs mt-1">Memory conflicts detected by VIF will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contradictions.map(c => (
              <Card key={c.id} className="border-border bg-card/60">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="text-[10px] font-mono">{c.contradiction_type}</Badge>
                        <Badge className={`text-[10px] border ${severityColor(c.severity)}`}>
                          {c.severity}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">{c.resolution_status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                        <span className="truncate max-w-[160px]">{c.left_memory_id}</span>
                        <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                        <span className="truncate max-w-[160px]">{c.right_memory_id}</span>
                      </div>
                      {c.recommended_resolution && (
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          <span className="text-accent">Recommendation:</span> {c.recommended_resolution}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// ─── Memory Atoms Overview Tab ───

const MemoryAtomsTab: React.FC = () => {
  const [atoms, setAtoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('aimos_memory_atoms')
      .select('id, content, content_type, memory_level, memory_class, confidence_score, quality_score, tags, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (levelFilter !== 'all') {
      query = query.eq('memory_level', levelFilter);
    }

    const { data } = await query;
    setAtoms(data || []);
    setLoading(false);
  }, [levelFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const levelColor = (l: string) => {
    switch (l) {
      case 'hot': return 'bg-destructive/20 text-destructive';
      case 'warm': return 'bg-warning/20 text-warning';
      case 'cool': return 'bg-info/20 text-info';
      case 'cold': return 'bg-muted/40 text-muted-foreground';
      default: return 'bg-muted/30 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/30 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cool">Cool</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px]">{atoms.length} atoms</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        {atoms.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Database className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">No memory atoms</p>
          </div>
        ) : (
          <div className="space-y-2">
            {atoms.map((a: any) => (
              <Card key={a.id} className="border-border bg-card/60 hover:bg-card/80 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-[10px] ${levelColor(a.memory_level)}`}>{a.memory_level}</Badge>
                    <Badge variant="outline" className="text-[10px] font-mono">{a.content_type}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{a.memory_class}</Badge>
                  </div>
                  <p className="text-xs text-foreground/90 line-clamp-2 mb-1.5">{a.content}</p>
                  <div className="flex items-center gap-3">
                    {a.confidence_score != null && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">κ</span>
                        <Progress value={a.confidence_score * 100} className="w-12 h-1" />
                        <span className="text-[10px] font-mono text-muted-foreground">{a.confidence_score.toFixed(2)}</span>
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground/50">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {a.tags && a.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {a.tags.slice(0, 6).map((t: string) => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border/50">{t}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// ─── Main Page ───

const MemoryInspector: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-bold tracking-wide">Memory Inspector</h1>
            <Badge variant="outline" className="text-[10px] tracking-widest">STAGE 2</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>§45 Memory Governance</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        <Tabs defaultValue="proposals" className="h-full flex flex-col">
          <TabsList className="bg-muted/30 border border-border">
            <TabsTrigger value="proposals" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <FileCheck className="h-3.5 w-3.5" />
              Write Proposals
            </TabsTrigger>
            <TabsTrigger value="canon" className="text-xs gap-1.5 data-[state=active]:bg-accent/10 data-[state=active]:text-accent">
              <BookCheck className="h-3.5 w-3.5" />
              Canon Registry
            </TabsTrigger>
            <TabsTrigger value="contradictions" className="text-xs gap-1.5 data-[state=active]:bg-warning/10 data-[state=active]:text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              Contradictions
            </TabsTrigger>
            <TabsTrigger value="atoms" className="text-xs gap-1.5 data-[state=active]:bg-info/10 data-[state=active]:text-info">
              <Database className="h-3.5 w-3.5" />
              Memory Atoms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="flex-1 mt-3 overflow-hidden">
            <ProposalsTab />
          </TabsContent>
          <TabsContent value="canon" className="flex-1 mt-3 overflow-hidden">
            <CanonTab />
          </TabsContent>
          <TabsContent value="contradictions" className="flex-1 mt-3 overflow-hidden">
            <ContradictionsTab />
          </TabsContent>
          <TabsContent value="atoms" className="flex-1 mt-3 overflow-hidden">
            <MemoryAtomsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MemoryInspector;
