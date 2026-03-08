// MetricsPanel — Phase D+F: Per-scenario trend charts, scenario selector, quick health check
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3, TrendingUp, TrendingDown, RefreshCw, Download,
  Activity, Shield, Timer, CheckCircle, XCircle, HeartPulse,
  Loader2, AlertTriangle, Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Area, AreaChart,
} from 'recharts';

interface TestRunRow {
  id: string;
  status: string;
  steps: any;
  metrics: any;
  started_at: string;
  completed_at: string | null;
  scenario_id: string | null;
}

interface MetricSummary {
  totalRuns: number;
  passRate: number;
  avgLatency: number;
  avgKappa: number;
  latencyTrend: 'up' | 'down' | 'stable';
  kappaTrend: 'up' | 'down' | 'stable';
}

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  latency: number;
  details: string;
}

interface ScenarioTrendPoint {
  index: number;
  date: string;
  latency: number;
  passRate: number;
  status: string;
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY CARDS
// ═══════════════════════════════════════════════════════════════

const SummaryCards: React.FC<{ summary: MetricSummary }> = ({ summary }) => (
  <div className="grid grid-cols-4 gap-2">
    <Card className="border-border/50">
      <CardContent className="py-3 px-3 text-center">
        <Activity className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
        <div className="text-lg font-mono text-foreground">{summary.totalRuns}</div>
        <div className="text-[10px] text-muted-foreground">Total Runs</div>
      </CardContent>
    </Card>
    <Card className="border-border/50">
      <CardContent className="py-3 px-3 text-center">
        <CheckCircle className="w-4 h-4 mx-auto mb-1 text-primary" />
        <div className="text-lg font-mono text-foreground">{(summary.passRate * 100).toFixed(0)}%</div>
        <div className="text-[10px] text-muted-foreground">Pass Rate</div>
      </CardContent>
    </Card>
    <Card className="border-border/50">
      <CardContent className="py-3 px-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Timer className="w-4 h-4 text-muted-foreground" />
          {summary.latencyTrend === 'up' && <TrendingUp className="w-3 h-3 text-destructive" />}
          {summary.latencyTrend === 'down' && <TrendingDown className="w-3 h-3 text-primary" />}
        </div>
        <div className="text-lg font-mono text-foreground">{Math.round(summary.avgLatency)}ms</div>
        <div className="text-[10px] text-muted-foreground">Avg Latency</div>
      </CardContent>
    </Card>
    <Card className="border-border/50">
      <CardContent className="py-3 px-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Shield className="w-4 h-4 text-muted-foreground" />
          {summary.kappaTrend === 'up' && <TrendingUp className="w-3 h-3 text-primary" />}
          {summary.kappaTrend === 'down' && <TrendingDown className="w-3 h-3 text-destructive" />}
        </div>
        <div className="text-lg font-mono text-foreground">{(summary.avgKappa * 100).toFixed(0)}%</div>
        <div className="text-[10px] text-muted-foreground">Avg Pass Rate</div>
      </CardContent>
    </Card>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK RESULTS PANEL
// ═══════════════════════════════════════════════════════════════

const HealthCheckResults: React.FC<{
  results: HealthCheckResult[];
  score: number;
  summary: string;
}> = ({ results, score, summary: summaryText }) => {
  const statusIcon = (s: string) => {
    if (s === 'healthy') return <CheckCircle className="w-3.5 h-3.5 text-primary" />;
    if (s === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
    return <XCircle className="w-3.5 h-3.5 text-destructive" />;
  };

  const scoreColor = score > 0.7 ? 'text-primary' : score > 0.4 ? 'text-yellow-500' : 'text-destructive';

  return (
    <Card className="border-border/50">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-2">
            <HeartPulse className="w-3.5 h-3.5" /> Quick Health Check
          </span>
          <span className={`text-base font-bold ${scoreColor}`}>
            {(score * 100).toFixed(0)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-2">
        <p className="text-[10px] text-muted-foreground font-mono">{summaryText}</p>
        <div className="space-y-1">
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-1 px-2 rounded bg-muted/20 text-[11px]">
              <div className="flex items-center gap-2">
                {statusIcon(r.status)}
                <span className="font-mono text-foreground">{r.component}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground font-mono">{r.latency}ms</span>
                <Badge
                  variant={r.status === 'healthy' ? 'default' : r.status === 'warning' ? 'outline' : 'destructive'}
                  className="text-[8px]"
                >
                  {r.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// PER-SCENARIO TREND CHART
// ═══════════════════════════════════════════════════════════════

const ScenarioTrendChart: React.FC<{
  data: ScenarioTrendPoint[];
  scenario: string;
}> = ({ data, scenario }) => {
  if (data.length < 2) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-xs font-mono flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          {scenario.replace(/_/g, ' ')} — Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3">
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${scenario}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="index" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis yAxisId="left" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" label={{ value: 'ms', angle: -90, position: 'insideLeft', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} label={{ value: '%', angle: 90, position: 'insideRight', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                fontSize: 10,
                fontFamily: 'monospace',
              }}
              formatter={(value: any, name: string) => [
                name === 'latency' ? `${value}ms` : `${value}%`,
                name === 'latency' ? 'Latency' : 'Pass Rate',
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="latency"
              stroke="hsl(var(--primary))"
              fill={`url(#grad-${scenario})`}
              strokeWidth={2}
              dot={{ r: 2 }}
              name="Latency"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="passRate"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ r: 2 }}
              name="Pass Rate"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PANEL
// ═══════════════════════════════════════════════════════════════

const MetricsPanel: React.FC = () => {
  const [runs, setRuns] = useState<TestRunRow[]>([]);
  const [allRuns, setAllRuns] = useState<TestRunRow[]>([]);
  const [summary, setSummary] = useState<MetricSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const [availableScenarios, setAvailableScenarios] = useState<string[]>([]);
  const [healthResults, setHealthResults] = useState<{
    checks: HealthCheckResult[];
    score: number;
    summary: string;
  } | null>(null);

  // Build per-scenario trend data
  const scenarioTrendData = useCallback((): Map<string, ScenarioTrendPoint[]> => {
    const grouped = new Map<string, ScenarioTrendPoint[]>();
    for (const r of allRuns) {
      const m = typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics;
      const scenario = m?.scenario || 'unknown';
      if (!grouped.has(scenario)) grouped.set(scenario, []);
      grouped.get(scenario)!.push({
        index: 0,
        date: r.started_at,
        latency: Math.round(m?.totalLatency || 0),
        passRate: Math.round((m?.passRate || 0) * 100),
        status: r.status,
      });
    }
    // Sort each scenario chronologically and assign indices
    for (const [, points] of grouped) {
      points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      points.forEach((p, i) => (p.index = i + 1));
    }
    return grouped;
  }, [allRuns]);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('aimos_test_runs' as any)
        .select('*')
        .order('started_at', { ascending: false })
        .limit(200);

      const allRows = (data || []) as unknown as TestRunRow[];
      setAllRuns(allRows);

      // Extract available scenarios
      const scenarioSet = new Set<string>();
      for (const r of allRows) {
        const m = typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics;
        if (m?.scenario) scenarioSet.add(m.scenario);
      }
      setAvailableScenarios(Array.from(scenarioSet));

      // Filter by scenario
      const rows = scenarioFilter === 'all'
        ? allRows
        : allRows.filter(r => {
            const m = typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics;
            return m?.scenario === scenarioFilter;
          });

      setRuns(rows);

      if (rows.length > 0) {
        const passCount = rows.filter(r => r.status === 'pass').length;
        const latencies = rows.map(r => {
          const m = typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics;
          return m?.totalLatency || 0;
        }).filter(l => l > 0);
        const kappas = rows.map(r => {
          const m = typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics;
          return m?.passRate || 0;
        });

        const avgLatency = latencies.length > 0 ? latencies.reduce((s, l) => s + l, 0) / latencies.length : 0;
        const avgKappa = kappas.length > 0 ? kappas.reduce((s, k) => s + k, 0) / kappas.length : 0;

        const recent = latencies.slice(0, 5);
        const previous = latencies.slice(5, 10);
        const recentAvg = recent.length > 0 ? recent.reduce((s, l) => s + l, 0) / recent.length : 0;
        const prevAvg = previous.length > 0 ? previous.reduce((s, l) => s + l, 0) / previous.length : avgLatency;
        const latencyTrend = recentAvg > prevAvg * 1.1 ? 'up' : recentAvg < prevAvg * 0.9 ? 'down' : 'stable';

        const recentK = kappas.slice(0, 5);
        const prevK = kappas.slice(5, 10);
        const recentKAvg = recentK.length > 0 ? recentK.reduce((s, k) => s + k, 0) / recentK.length : 0;
        const prevKAvg = prevK.length > 0 ? prevK.reduce((s, k) => s + k, 0) / prevK.length : avgKappa;
        const kappaTrend = recentKAvg > prevKAvg * 1.05 ? 'up' : recentKAvg < prevKAvg * 0.95 ? 'down' : 'stable';

        setSummary({
          totalRuns: rows.length,
          passRate: passCount / rows.length,
          avgLatency,
          avgKappa,
          latencyTrend: latencyTrend as any,
          kappaTrend: kappaTrend as any,
        });
      } else {
        setSummary(null);
      }
    } catch (e) {
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [scenarioFilter]);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  const runHealthCheck = useCallback(async () => {
    setHealthLoading(true);
    setHealthResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('self-evolution', {
        body: { action: 'quick_health_check' },
      });
      if (error) throw error;

      const score = data?.healthScore || 0;
      const checks: HealthCheckResult[] = Array.isArray(data?.checks)
        ? data.checks.map((c: any) => ({
            component: c.component || c.name || 'Unknown',
            status: c.status || 'warning',
            latency: c.latency || 0,
            details: c.details || c.message || '',
          }))
        : [];

      const summaryText = data?.summary || `System health: ${(score * 100).toFixed(0)}%`;

      setHealthResults({ checks, score, summary: summaryText });
      toast[score > 0.7 ? 'success' : 'warning'](
        `Health: ${(score * 100).toFixed(0)}% — ${summaryText}`
      );
    } catch (e: any) {
      toast.error(`Health check failed: ${e.message}`);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Aggregate chart data for currently filtered runs
  const chartData = runs
    .slice(0, 20)
    .reverse()
    .map((r, i) => {
      const m = typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics;
      return {
        run: i + 1,
        latency: Math.round(m?.totalLatency || 0),
        passRate: Math.round((m?.passRate || 0) * 100),
        status: r.status,
      };
    });

  const trendMap = scenarioTrendData();
  const scenariosToChart = scenarioFilter === 'all'
    ? Array.from(trendMap.keys()).slice(0, 5)
    : [scenarioFilter];

  const exportReport = () => {
    const report = {
      generated: new Date().toISOString(),
      scenarioFilter,
      summary,
      healthCheck: healthResults,
      runs: runs.map(r => ({
        id: r.id,
        status: r.status,
        metrics: typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics,
        started_at: r.started_at,
        completed_at: r.completed_at,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aimos-test-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
            Metrics & Regression
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button onClick={runHealthCheck} disabled={healthLoading} size="sm" variant="outline" className="text-xs">
            {healthLoading
              ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              : <HeartPulse className="w-3 h-3 mr-1" />}
            Health
          </Button>
          <Button onClick={loadMetrics} disabled={loading} size="sm" variant="outline" className="text-xs">
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={exportReport} size="sm" variant="outline" className="text-xs">
            <Download className="w-3 h-3 mr-1" /> Export
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Scenario Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">SCENARIO:</span>
            <Select value={scenarioFilter} onValueChange={setScenarioFilter}>
              <SelectTrigger className="h-7 text-[11px] w-44 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scenarios</SelectItem>
                {availableScenarios.map(s => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableScenarios.length > 0 && (
              <span className="text-[9px] text-muted-foreground font-mono">
                {availableScenarios.length} scenario{availableScenarios.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {summary && <SummaryCards summary={summary} />}

          {/* Health Check Results */}
          {healthResults && (
            <HealthCheckResults
              results={healthResults.checks}
              score={healthResults.score}
              summary={healthResults.summary}
            />
          )}

          {/* Per-Scenario Trend Charts */}
          {scenariosToChart.map(scenario => {
            const points = trendMap.get(scenario);
            if (!points || points.length < 2) return null;
            return <ScenarioTrendChart key={scenario} data={points} scenario={scenario} />;
          })}

          {/* Aggregate Latency Trend */}
          {chartData.length > 1 && (
            <Card className="border-border/50">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5" /> Aggregate Latency (ms)
                  {scenarioFilter !== 'all' && <Badge variant="outline" className="text-[9px]">{scenarioFilter}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="run" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        fontSize: 11,
                      }}
                    />
                    <Line type="monotone" dataKey="latency" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Aggregate Pass Rate */}
          {chartData.length > 1 && (
            <Card className="border-border/50">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" /> Aggregate Pass Rate (%)
                  {scenarioFilter !== 'all' && <Badge variant="outline" className="text-[9px]">{scenarioFilter}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="run" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="passRate" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Regression Alerts */}
          {summary && summary.latencyTrend === 'up' && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <div className="text-xs font-mono font-medium text-destructive">REGRESSION DETECTED</div>
                  <div className="text-[10px] text-muted-foreground">
                    Average latency trending upward. Recent runs &gt;10% slower than baseline.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {summary && summary.kappaTrend === 'down' && (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-yellow-500 shrink-0" />
                <div>
                  <div className="text-xs font-mono font-medium text-yellow-500">QUALITY REGRESSION</div>
                  <div className="text-[10px] text-muted-foreground">
                    Pass rate is declining. Recent runs show &gt;5% drop vs baseline.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Runs Table */}
          <Card className="border-border/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-mono">Recent Test Runs</CardTitle>
            </CardHeader>
            <CardContent className="py-1 px-3">
              {runs.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  No test runs yet. Run scenarios to populate metrics.
                </div>
              ) : (
                <div className="space-y-1">
                  {runs.slice(0, 15).map(run => {
                    const m = typeof run.metrics === 'string' ? JSON.parse(run.metrics) : run.metrics;
                    return (
                      <div key={run.id} className="flex items-center justify-between text-xs py-1.5 px-1 rounded hover:bg-muted/10">
                        <div className="flex items-center gap-2">
                          {run.status === 'pass' ? <CheckCircle className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-destructive" />}
                          <span className="font-mono text-muted-foreground">
                            {new Date(run.started_at).toLocaleString()}
                          </span>
                          {m?.scenario && <Badge variant="outline" className="text-[8px]">{m.scenario.replace(/_/g, ' ')}</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                          <span>{Math.round(m?.totalLatency || 0)}ms</span>
                          <span>{Math.round((m?.passRate || 0) * 100)}%</span>
                          <Badge variant={run.status === 'pass' ? 'default' : 'destructive'} className="text-[9px]">
                            {run.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MetricsPanel;
