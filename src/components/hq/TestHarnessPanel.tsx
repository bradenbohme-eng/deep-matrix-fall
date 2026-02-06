// Test Harness Panel - Run and visualize orchestration tests

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  FlaskConical,
  RefreshCw,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { getTestRunner, getTestLogStore, type TestResult, type TestSpec } from '@/lib/orchestration';

interface TestHarnessPanelProps {
  className?: string;
}

// Local type for display purposes since TestSpec structure is complex
interface DisplayTestSpec {
  test_id: string;
  name: string;
  category: string;
  difficulty: string;
  initial_context: string;
  must_do: string[];
  must_not_do: string[];
}

const TestHarnessPanel: React.FC<TestHarnessPanelProps> = ({ className }) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const testRunner = useMemo(() => getTestRunner(), []);
  const logStore = useMemo(() => getTestLogStore(), []);
  
  const testSpecs: DisplayTestSpec[] = useMemo(() => {
    const specs = testRunner.listTests();
    return specs.map(spec => ({
      test_id: spec.test_id,
      name: spec.name,
      category: spec.category,
      difficulty: spec.difficulty,
      initial_context: spec.initial_context.pinned_constraints?.join(', ') || 'No constraints',
      must_do: spec.must_do.map(m => m.description),
      must_not_do: spec.must_not_do.map(m => m.description),
    }));
  }, [testRunner]);

  // Group tests by category
  const categories = useMemo(() => {
    return testSpecs.reduce((acc, spec) => {
      if (!acc[spec.category]) {
        acc[spec.category] = [];
      }
      acc[spec.category].push(spec);
      return acc;
    }, {} as Record<string, DisplayTestSpec[]>);
  }, [testSpecs]);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);
    logStore.startSession();
    
    for (const spec of testSpecs) {
      setCurrentTest(spec.test_id);
      const run = logStore.startTestRun(spec.test_id);
      
      // Add reasoning trace
      logStore.addReasoningStep(run.run_id, {
        phase: 'planning',
        thought: `Executing test: ${spec.test_id}`,
        reasoning: `Testing ${spec.category} category with ${spec.must_do.length} must-do conditions`,
        confidence: 0.9,
        alternatives_considered: [],
        decision_made: 'Proceed with test execution',
        evidence: spec.must_do,
      });
      
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      const result = await testRunner.runTest(spec.test_id);
      logStore.completeTestRun(run.run_id, result);
      setTestResults(prev => [...prev, result]);
    }
    
    logStore.endSession();
    setCurrentTest(null);
    setIsRunning(false);
  }, [testRunner, testSpecs, logStore]);

  const runSingleTest = useCallback(async (testId: string) => {
    setIsRunning(true);
    setCurrentTest(testId);
    
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const result = await testRunner.runTest(testId);
    setTestResults(prev => {
      const existing = prev.findIndex(r => r.test_id === testId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });
    
    setCurrentTest(null);
    setIsRunning(false);
  }, [testRunner]);

  const runCategory = useCallback(async (category: string) => {
    setIsRunning(true);
    const specs = categories[category] || [];
    
    for (const spec of specs) {
      setCurrentTest(spec.test_id);
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      const result = await testRunner.runTest(spec.test_id);
      setTestResults(prev => {
        const existing = prev.findIndex(r => r.test_id === spec.test_id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = result;
          return updated;
        }
        return [...prev, result];
      });
    }
    
    setCurrentTest(null);
    setIsRunning(false);
  }, [testRunner, categories]);

  const toggleTestExpand = (testId: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };

  const getResultForTest = (testId: string) => {
    return testResults.find(r => r.test_id === testId);
  };

  const totalTests = testSpecs.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = testResults.filter(r => !r.passed).length;
  const overallScore = testResults.length > 0
    ? testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length
    : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'orchestration': return '🔄';
      case 'context': return '📚';
      case 'verification': return '✅';
      case 'interrupt': return '⏹️';
      case 'budget': return '💰';
      case 'contradiction': return '⚠️';
      case 'tool-use': return '🔧';
      case 'self-improvement': return '📈';
      case 'regression': return '🔁';
      case 'drift': return '🎯';
      case 'partial': return '⏸️';
      case 'failure': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center space-x-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <span className="font-mono text-sm font-bold">TEST HARNESS</span>
          <Badge variant="secondary" className="text-[10px]">
            {totalTests} tests
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="default"
            onClick={runAllTests}
            disabled={isRunning}
            className="h-7 text-xs"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                Run All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Score Summary */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-4 gap-2 p-3 border-b border-border bg-muted/10">
          <div className="bg-muted/20 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Tests Run</div>
            <div className="text-lg font-mono text-primary">{testResults.length}/{totalTests}</div>
          </div>
          <div className="bg-muted/20 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Passed</div>
            <div className="text-lg font-mono text-green-500">{passedTests}</div>
          </div>
          <div className="bg-muted/20 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Failed</div>
            <div className="text-lg font-mono text-red-500">{failedTests}</div>
          </div>
          <div className="bg-muted/20 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Avg Score</div>
            <div className={`text-lg font-mono ${overallScore >= 0.7 ? 'text-green-500' : overallScore >= 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>
              {(overallScore * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Test List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {Object.entries(categories).map(([category, specs]) => {
            const categoryResults = specs.map(s => getResultForTest(s.test_id)).filter(Boolean) as TestResult[];
            const categoryPassed = categoryResults.filter(r => r.passed).length;
            const categoryTotal = specs.length;
            
            return (
              <div key={category} className="border border-border rounded overflow-hidden">
                {/* Category Header */}
                <div 
                  className="flex items-center justify-between p-2 bg-muted/30 cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{getCategoryIcon(category)}</span>
                    <span className="font-mono text-sm font-bold capitalize">{category}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {categoryTotal} tests
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {categoryResults.length > 0 && (
                      <Badge 
                        variant={categoryPassed === categoryTotal ? 'default' : 'destructive'}
                        className="text-[10px]"
                      >
                        {categoryPassed}/{categoryTotal} passed
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        runCategory(category);
                      }}
                      disabled={isRunning}
                      className="h-6 w-6 p-0"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    {selectedCategory === category ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Category Tests */}
                {selectedCategory === category && (
                  <div className="divide-y divide-border">
                    {specs.map((spec) => {
                      const result = getResultForTest(spec.test_id);
                      const isExpanded = expandedTests.has(spec.test_id);
                      const isCurrentlyRunning = currentTest === spec.test_id;
                      
                      return (
                        <div key={spec.test_id} className="bg-background">
                          <div 
                            className="flex items-center p-2 cursor-pointer hover:bg-muted/20"
                            onClick={() => toggleTestExpand(spec.test_id)}
                          >
                            <div className="w-4 h-4 mr-2 flex items-center justify-center">
                              {isCurrentlyRunning ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                              ) : result ? (
                                result.passed ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-500" />
                                )
                              ) : (
                                <Clock className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="text-xs font-mono">{spec.test_id}</div>
                              <div className="text-[10px] text-muted-foreground">
                                Difficulty: {spec.difficulty}
                              </div>
                            </div>
                            
                            {result && (
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={result.passed ? 'default' : 'destructive'}
                                  className="text-[10px]"
                                >
                                  {(result.score * 100).toFixed(0)}%
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {result.duration_ms}ms
                                </span>
                              </div>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                runSingleTest(spec.test_id);
                              }}
                              disabled={isRunning}
                              className="h-6 w-6 p-0 ml-2"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {isExpanded && (
                            <div className="px-6 pb-2 text-xs">
                              <div className="text-muted-foreground mb-2">
                                {spec.initial_context}
                              </div>
                              
                              {spec.must_do.length > 0 && (
                                <div className="mb-2">
                                  <div className="font-bold text-green-500">Must Do:</div>
                                  <ul className="list-disc list-inside text-[10px]">
                                    {spec.must_do.map((item, i) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {spec.must_not_do.length > 0 && (
                                <div className="mb-2">
                                  <div className="font-bold text-red-500">Must Not Do:</div>
                                  <ul className="list-disc list-inside text-[10px]">
                                    {spec.must_not_do.map((item, i) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {result && result.score_breakdown && Object.keys(result.score_breakdown).length > 0 && (
                                <div className="mt-2 p-2 bg-muted/20 rounded">
                                  <div className="font-bold mb-1">Score Breakdown:</div>
                                  <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(result.score_breakdown, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TestHarnessPanel;
