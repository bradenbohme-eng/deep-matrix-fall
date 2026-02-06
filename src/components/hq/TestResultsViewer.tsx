// Test Results Viewer - Full execution trace and reasoning visualization
// Shows complete test run history with improvement suggestions

import React, { useState, useMemo, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle,
  XCircle,
  Clock,
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Download,
  Trash2,
  RefreshCw,
  Activity,
  Lightbulb,
  BarChart3,
  FileText,
  GitBranch,
} from 'lucide-react';
import {
  getTestLogStore,
  type TestSession,
  type TestRun,
  type ReasoningStep,
  type ImprovementSuggestion,
} from '@/lib/orchestration/testLogStore';

// ============================================================================
// TYPES
// ============================================================================

interface TestResultsViewerProps {
  className?: string;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ReasoningStepView: React.FC<{ step: ReasoningStep; isLast: boolean }> = ({ step, isLast }) => {
  const [expanded, setExpanded] = useState(false);

  const getPhaseIcon = () => {
    switch (step.phase) {
      case 'planning': return <Brain className="w-3 h-3" />;
      case 'execution': return <Zap className="w-3 h-3" />;
      case 'verification': return <CheckCircle className="w-3 h-3" />;
      case 'audit': return <FileText className="w-3 h-3" />;
      case 'decision': return <GitBranch className="w-3 h-3" />;
    }
  };

  const getPhaseColor = () => {
    switch (step.phase) {
      case 'planning': return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
      case 'execution': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'verification': return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'audit': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'decision': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30';
    }
  };

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-3 top-8 w-0.5 h-full bg-border" />
      )}

      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <div className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 ${getPhaseColor()}`}>
            <div className="mt-0.5">{getPhaseIcon()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase">{step.phase}</span>
                <Badge variant="outline" className="text-[9px]">
                  {(step.confidence * 100).toFixed(0)}% confidence
                </Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-xs mt-1">{step.thought}</div>
            </div>
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="ml-6 mt-2 p-2 bg-muted/30 rounded space-y-2 text-xs">
            <div>
              <div className="font-bold text-muted-foreground">Reasoning</div>
              <div className="bg-background/50 p-2 rounded">{step.reasoning}</div>
            </div>

            <div>
              <div className="font-bold text-muted-foreground">Decision Made</div>
              <div className="bg-background/50 p-2 rounded">{step.decision_made}</div>
            </div>

            {step.alternatives_considered.length > 0 && (
              <div>
                <div className="font-bold text-muted-foreground">Alternatives Considered</div>
                <ul className="list-disc list-inside bg-background/50 p-2 rounded">
                  {step.alternatives_considered.map((alt, i) => (
                    <li key={i} className="text-muted-foreground">{alt}</li>
                  ))}
                </ul>
              </div>
            )}

            {step.evidence.length > 0 && (
              <div>
                <div className="font-bold text-muted-foreground">Evidence</div>
                <ul className="list-disc list-inside bg-background/50 p-2 rounded">
                  {step.evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const ImprovementCard: React.FC<{ improvement: ImprovementSuggestion }> = ({ improvement }) => {
  const getPriorityColor = () => {
    switch (improvement.priority) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-green-500 bg-green-500/10';
    }
  };

  const getCategoryIcon = () => {
    switch (improvement.category) {
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'accuracy': return <CheckCircle className="w-4 h-4" />;
      case 'efficiency': return <TrendingUp className="w-4 h-4" />;
      case 'reliability': return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getPriorityColor()}`}>
      <div className="flex items-start gap-2">
        {getCategoryIcon()}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{improvement.title}</span>
            <Badge variant="outline" className="text-[9px]">
              {improvement.priority}
            </Badge>
            <Badge variant="secondary" className="text-[9px]">
              {improvement.category}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {improvement.description}
          </div>
          <div className="mt-2 p-2 bg-background/50 rounded text-xs">
            <div className="font-bold">Proposed Action:</div>
            <div>{improvement.proposed_action}</div>
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px]">
            <span>Impact: {(improvement.estimated_impact * 100).toFixed(0)}%</span>
            <span>Source: {improvement.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TestRunCard: React.FC<{ run: TestRun; onSelect: () => void; selected: boolean }> = ({
  run,
  onSelect,
  selected,
}) => {
  const duration = run.completed_at ? run.completed_at - run.started_at : 0;

  return (
    <div
      className={`p-2 rounded cursor-pointer transition-colors ${
        selected ? 'bg-primary/20 border border-primary' : 'bg-muted/20 hover:bg-muted/40'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        {run.result?.passed ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : run.result ? (
          <XCircle className="w-4 h-4 text-red-500" />
        ) : (
          <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
        )}
        <span className="text-xs font-mono flex-1 truncate">{run.test_id}</span>
        {run.result && (
          <Badge variant={run.result.passed ? 'default' : 'destructive'} className="text-[9px]">
            {(run.result.score * 100).toFixed(0)}%
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
        <span>{new Date(run.started_at).toLocaleTimeString()}</span>
        <span>{duration}ms</span>
        <span>{run.reasoning_trace.length} steps</span>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TestResultsViewer: React.FC<TestResultsViewerProps> = ({ className }) => {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [activeTab, setActiveTab] = useState('runs');

  const logStore = useMemo(() => getTestLogStore(), []);

  useEffect(() => {
    setSessions(logStore.getAllSessions());
    setSelectedSession(logStore.getCurrentSession() ?? logStore.getAllSessions()[0] ?? null);

    const unsubscribe = logStore.subscribe((session) => {
      setSessions(logStore.getAllSessions());
      setSelectedSession(session);
    });

    return unsubscribe;
  }, [logStore]);

  const handleExport = () => {
    if (!selectedSession) return;
    const data = logStore.exportSession(selectedSession.session_id);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-session-${selectedSession.session_id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    logStore.clearAll();
    setSessions([]);
    setSelectedSession(null);
    setSelectedRun(null);
  };

  const allImprovements = useMemo(() => logStore.getAllImprovements(), [sessions]);

  if (sessions.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <div className="text-sm">No test results yet</div>
          <div className="text-xs mt-1">Run tests to see execution traces</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold">TEST RESULTS</span>
          <Badge variant="secondary" className="text-[9px]">
            {sessions.length} sessions
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={handleExport} className="h-6 w-6 p-0">
            <Download className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear} className="h-6 w-6 p-0 text-destructive">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Session List */}
        <div className="w-48 border-r border-border bg-muted/10 flex flex-col">
          <div className="p-2 text-[10px] font-bold text-muted-foreground border-b border-border">
            SESSIONS
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1 space-y-1">
              {sessions.map(session => (
                <div
                  key={session.session_id}
                  className={`p-2 rounded cursor-pointer text-xs ${
                    selectedSession?.session_id === session.session_id
                      ? 'bg-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setSelectedSession(session);
                    setSelectedRun(null);
                  }}
                >
                  <div className="font-mono truncate">{session.session_id.slice(0, 8)}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {session.runs.length} runs • {session.aggregate_stats.passed}/{session.aggregate_stats.total_tests} passed
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        {selectedSession && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Stats Bar */}
            <div className="p-2 border-b border-border bg-muted/20 grid grid-cols-5 gap-2 text-center text-xs">
              <div>
                <div className="text-[10px] text-muted-foreground">Tests</div>
                <div className="font-bold">{selectedSession.aggregate_stats.total_tests}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Passed</div>
                <div className="font-bold text-green-500">{selectedSession.aggregate_stats.passed}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Failed</div>
                <div className="font-bold text-red-500">{selectedSession.aggregate_stats.failed}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Avg Score</div>
                <div className="font-bold">{(selectedSession.aggregate_stats.average_score * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Improvements</div>
                <div className="font-bold text-primary">{selectedSession.aggregate_stats.improvement_suggestions_generated}</div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-8">
                <TabsTrigger value="runs" className="text-xs h-7">
                  <Activity className="w-3 h-3 mr-1" />
                  Runs ({selectedSession.runs.length})
                </TabsTrigger>
                <TabsTrigger value="reasoning" className="text-xs h-7">
                  <Brain className="w-3 h-3 mr-1" />
                  Reasoning
                </TabsTrigger>
                <TabsTrigger value="improvements" className="text-xs h-7">
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Improvements ({allImprovements.length})
                </TabsTrigger>
                <TabsTrigger value="insights" className="text-xs h-7">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Insights
                </TabsTrigger>
              </TabsList>

              {/* Runs Tab */}
              <TabsContent value="runs" className="flex-1 flex overflow-hidden m-0">
                {/* Run List */}
                <div className="w-56 border-r border-border">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                      {selectedSession.runs.map(run => (
                        <TestRunCard
                          key={run.run_id}
                          run={run}
                          selected={selectedRun?.run_id === run.run_id}
                          onSelect={() => setSelectedRun(run)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Run Details */}
                <div className="flex-1">
                  {selectedRun ? (
                    <ScrollArea className="h-full">
                      <div className="p-3 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold">{selectedRun.test_id}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(selectedRun.started_at).toLocaleString()}
                            </div>
                          </div>
                          {selectedRun.result && (
                            <Badge
                              variant={selectedRun.result.passed ? 'default' : 'destructive'}
                              className="text-lg"
                            >
                              {(selectedRun.result.score * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>

                        {/* Score Breakdown */}
                        {selectedRun.result?.score_breakdown && (
                          <div>
                            <div className="text-xs font-bold text-muted-foreground mb-2">Score Breakdown</div>
                            <div className="space-y-1">
                              {Object.entries(selectedRun.result.score_breakdown).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-xs w-24">{key}</span>
                                  <Progress value={value as number} className="flex-1 h-2" />
                                  <span className="text-xs w-12 text-right">{(value as number).toFixed(1)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Events Summary */}
                        <div>
                          <div className="text-xs font-bold text-muted-foreground mb-2">
                            Events ({selectedRun.events.length})
                          </div>
                          <div className="bg-muted/20 rounded p-2 max-h-32 overflow-y-auto">
                            {selectedRun.events.slice(-10).map((event, i) => (
                              <div key={i} className="text-[10px] font-mono">
                                [{new Date(event.timestamp).toLocaleTimeString()}] {event.type}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Budget Timeline */}
                        {selectedRun.budget_snapshots.length > 0 && (
                          <div>
                            <div className="text-xs font-bold text-muted-foreground mb-2">
                              Budget Timeline ({selectedRun.budget_snapshots.length} snapshots)
                            </div>
                            <div className="space-y-1">
                              {selectedRun.budget_snapshots.slice(-5).map((snap, i) => (
                                <div key={i} className="text-[10px] bg-muted/20 p-1 rounded">
                                  <span className="font-mono">Iter {snap.iteration}:</span>
                                  <span className="ml-2">Tokens: {snap.consumed.output_tokens}</span>
                                  <span className="ml-2">Tools: {snap.consumed.tool_calls}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Improvements */}
                        {selectedRun.improvements_suggested.length > 0 && (
                          <div>
                            <div className="text-xs font-bold text-muted-foreground mb-2">
                              Suggested Improvements ({selectedRun.improvements_suggested.length})
                            </div>
                            <div className="space-y-2">
                              {selectedRun.improvements_suggested.map(imp => (
                                <ImprovementCard key={imp.id} improvement={imp} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Select a run to view details
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Reasoning Tab */}
              <TabsContent value="reasoning" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-3">
                    {selectedRun?.reasoning_trace.length ? (
                      <div className="space-y-2">
                        {selectedRun.reasoning_trace.map((step, i) => (
                          <ReasoningStepView
                            key={step.step_id}
                            step={step}
                            isLast={i === selectedRun.reasoning_trace.length - 1}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <div className="text-sm">No reasoning trace available</div>
                        <div className="text-xs">Select a run with recorded reasoning steps</div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Improvements Tab */}
              <TabsContent value="improvements" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    {allImprovements.length > 0 ? (
                      allImprovements.map(imp => (
                        <ImprovementCard key={imp.id} improvement={imp} />
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <div className="text-sm">No improvements suggested yet</div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-3">
                    {selectedSession.cross_test_insights.length > 0 ? (
                      selectedSession.cross_test_insights.map(insight => (
                        <div key={insight.id} className="border border-border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm">{insight.title}</span>
                            <Badge variant="outline" className="text-[9px]">
                              {insight.type}
                            </Badge>
                            <Badge variant="secondary" className="text-[9px]">
                              {(insight.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {insight.description}
                          </div>
                          <div className="mt-2 text-[10px]">
                            <span className="font-bold">Affected tests: </span>
                            {insight.affected_tests.join(', ')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <div className="text-sm">No cross-test insights yet</div>
                        <div className="text-xs">Run more tests to generate patterns</div>
                      </div>
                    )}

                    {/* Category Breakdown */}
                    {Object.keys(selectedSession.aggregate_stats.categories_tested).length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-bold text-muted-foreground mb-2">Category Performance</div>
                        <div className="space-y-2">
                          {Object.entries(selectedSession.aggregate_stats.categories_tested).map(([cat, data]) => (
                            <div key={cat} className="flex items-center gap-2">
                              <span className="text-xs w-32 capitalize">{cat}</span>
                              <Progress
                                value={(data.passed / (data.passed + data.failed)) * 100}
                                className="flex-1 h-2"
                              />
                              <span className="text-xs w-16 text-right">
                                {data.passed}/{data.passed + data.failed}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResultsViewer;
