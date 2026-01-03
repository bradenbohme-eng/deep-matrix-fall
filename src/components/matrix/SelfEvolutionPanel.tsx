import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Cpu, 
  Activity, 
  Zap, 
  Settings, 
  Play, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Code,
  FileJson,
  Link,
  Sparkles,
  History,
  Eye,
  Target,
  Gauge,
  Layers
} from 'lucide-react';
import { useSelfEvolution, IntrospectionResult, DiagnosticResult, EvolutionSuggestion } from '@/lib/selfEvolutionClient';

const SelfEvolutionPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('introspection');
  const [introspection, setIntrospection] = useState<IntrospectionResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[] | null>(null);
  const [bottlenecks, setBottlenecks] = useState<any>(null);
  const [evolutions, setEvolutions] = useState<EvolutionSuggestion[] | null>(null);
  const [sandboxCode, setSandboxCode] = useState('// Enter JavaScript code to test\nconsole.log("Hello, Evolution!");');
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [promptChain, setPromptChain] = useState('');
  const [chainResult, setChainResult] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);

  const {
    isLoading,
    error,
    introspect,
    analyzeBottlenecks,
    runDiagnostics,
    benchmarkSystem,
    suggestEvolutions,
    executeSandbox,
    testPromptChain,
    calibrateReasoning,
    calibrateMemory,
    calibrateConfidence
  } = useSelfEvolution();

  const handleIntrospect = async () => {
    const result = await introspect();
    if (result) setIntrospection(result);
  };

  const handleDiagnostics = async () => {
    const result = await runDiagnostics();
    if (result) setDiagnostics(result.diagnostics);
  };

  const handleBottlenecks = async () => {
    const result = await analyzeBottlenecks(24);
    if (result) setBottlenecks(result);
  };

  const handleEvolutions = async () => {
    const result = await suggestEvolutions();
    if (result) setEvolutions(result.suggestions);
  };

  const handleSandbox = async () => {
    const result = await executeSandbox(sandboxCode);
    if (result) setSandboxResult(result);
  };

  const handlePromptChainTest = async () => {
    const chains = promptChain.split('\n---\n').filter(c => c.trim());
    if (chains.length > 0) {
      const result = await testPromptChain(chains);
      if (result) setChainResult(result);
    }
  };

  const handleBenchmark = async () => {
    const result = await benchmarkSystem();
    if (result) setBenchmarks(result.benchmarks);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background/50">
      <div className="p-3 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-mono font-bold text-primary">SELF-EVOLUTION ENGINE</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {isLoading ? 'PROCESSING...' : 'AUTONOMOUS MODE'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-primary/20 bg-transparent px-2">
          <TabsTrigger value="introspection" className="text-xs data-[state=active]:bg-primary/20">
            <Eye className="w-3 h-3 mr-1" /> Introspect
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs data-[state=active]:bg-primary/20">
            <Activity className="w-3 h-3 mr-1" /> Diagnostics
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="text-xs data-[state=active]:bg-primary/20">
            <Code className="w-3 h-3 mr-1" /> Sandbox
          </TabsTrigger>
          <TabsTrigger value="calibration" className="text-xs data-[state=active]:bg-primary/20">
            <Target className="w-3 h-3 mr-1" /> Calibrate
          </TabsTrigger>
          <TabsTrigger value="evolution" className="text-xs data-[state=active]:bg-primary/20">
            <Sparkles className="w-3 h-3 mr-1" /> Evolve
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* INTROSPECTION TAB */}
          <TabsContent value="introspection" className="p-4 space-y-4 m-0">
            <div className="flex gap-2">
              <Button onClick={handleIntrospect} disabled={isLoading} size="sm" className="flex-1">
                <Brain className="w-4 h-4 mr-2" /> Full Introspection
              </Button>
              <Button onClick={handleBottlenecks} disabled={isLoading} size="sm" variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" /> Bottlenecks
              </Button>
            </div>

            {introspection && (
              <div className="space-y-4">
                <Card className="border-primary/20">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Gauge className="w-4 h-4" /> Evolution Potential
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    <div className="flex items-center gap-3">
                      <Progress value={introspection.evolutionPotential * 100} className="flex-1" />
                      <span className="text-lg font-mono text-primary">
                        {Math.round(introspection.evolutionPotential * 100)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4" /> System State
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-muted-foreground">Memory Atoms</div>
                        <div className="text-lg font-mono">{introspection.systemState.memory.atomCount}</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-muted-foreground">Reasoning Chains</div>
                        <div className="text-lg font-mono">{introspection.systemState.memory.chainCount}</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-muted-foreground">Active Plans</div>
                        <div className="text-lg font-mono">{introspection.systemState.memory.planCount}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-muted-foreground">Avg Reasoning Depth</div>
                        <div className="text-lg font-mono">{introspection.systemState.reasoning.avgDepth.toFixed(1)}</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-muted-foreground">Avg Coherence</div>
                        <div className="text-lg font-mono">{Math.round(introspection.systemState.reasoning.avgCoherence * 100)}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {introspection.recommendations.length > 0 && (
                  <Card className="border-yellow-500/20">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-yellow-400">
                        <TrendingUp className="w-4 h-4" /> Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <ul className="space-y-1 text-xs">
                        {introspection.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Zap className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {bottlenecks && (
              <Card className="border-orange-500/20">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-orange-400">
                    <AlertTriangle className="w-4 h-4" /> Detected Bottlenecks
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3 space-y-2">
                  {bottlenecks.bottlenecks?.map((b: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-muted/50 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{b.type}</span>
                        <Badge variant="outline" className={
                          b.severity === 'critical' ? 'border-red-500 text-red-400' :
                          b.severity === 'warning' ? 'border-yellow-500 text-yellow-400' :
                          'border-blue-500 text-blue-400'
                        }>{b.severity}</Badge>
                      </div>
                      <p className="text-muted-foreground">{b.details}</p>
                      <p className="text-primary mt-1">→ {b.recommendation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* DIAGNOSTICS TAB */}
          <TabsContent value="diagnostics" className="p-4 space-y-4 m-0">
            <div className="flex gap-2">
              <Button onClick={handleDiagnostics} disabled={isLoading} size="sm" className="flex-1">
                <Activity className="w-4 h-4 mr-2" /> Run Diagnostics
              </Button>
              <Button onClick={handleBenchmark} disabled={isLoading} size="sm" variant="outline">
                <Gauge className="w-4 h-4 mr-2" /> Benchmark
              </Button>
            </div>

            {diagnostics && (
              <div className="space-y-2">
                {diagnostics.map((d, i) => (
                  <Card key={i} className="border-primary/20">
                    <CardContent className="py-2 px-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(d.status)}
                          <span className="text-sm font-medium">{d.component}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{d.latency.toFixed(1)}ms</span>
                          <Badge variant="outline" className={
                            d.status === 'healthy' ? 'border-green-500 text-green-400' :
                            d.status === 'warning' ? 'border-yellow-500 text-yellow-400' :
                            'border-red-500 text-red-400'
                          }>{d.status}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{d.details}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {benchmarks && (
              <Card className="border-blue-500/20">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-400">
                    <Gauge className="w-4 h-4" /> Benchmarks
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3 space-y-2">
                  {benchmarks.map((b: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                      <span>{b.name}</span>
                      <span className="font-mono text-primary">{b.latency.toFixed(1)}{b.unit}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SANDBOX TAB */}
          <TabsContent value="sandbox" className="p-4 space-y-4 m-0">
            <Card className="border-primary/20">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code className="w-4 h-4" /> Code Sandbox
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-2">
                <Textarea
                  value={sandboxCode}
                  onChange={(e) => setSandboxCode(e.target.value)}
                  className="font-mono text-xs min-h-[150px] bg-background/50"
                  placeholder="Enter JavaScript, JSON, or prompt template..."
                />
                <Button onClick={handleSandbox} disabled={isLoading} size="sm" className="w-full">
                  <Play className="w-4 h-4 mr-2" /> Execute
                </Button>
                {sandboxResult && (
                  <div className="p-2 rounded bg-muted/50 text-xs font-mono">
                    <div className="text-muted-foreground mb-1">Result ({sandboxResult.executionTime.toFixed(1)}ms):</div>
                    {sandboxResult.error ? (
                      <div className="text-red-400">{sandboxResult.error}</div>
                    ) : (
                      <>
                        {sandboxResult.output?.map((line: string, i: number) => (
                          <div key={i} className="text-green-400">{line}</div>
                        ))}
                        <div className="text-primary mt-1">
                          {JSON.stringify(sandboxResult.result, null, 2)}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Link className="w-4 h-4" /> Prompt Chain Lab
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-2">
                <Textarea
                  value={promptChain}
                  onChange={(e) => setPromptChain(e.target.value)}
                  className="font-mono text-xs min-h-[100px] bg-background/50"
                  placeholder="Enter prompts separated by ---&#10;Use {{input}} for previous output&#10;---&#10;Next prompt here..."
                />
                <Button onClick={handlePromptChainTest} disabled={isLoading} size="sm" className="w-full">
                  <Zap className="w-4 h-4 mr-2" /> Test Chain
                </Button>
                {chainResult && (
                  <div className="p-2 rounded bg-muted/50 text-xs space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Success Rate: {Math.round(chainResult.successRate * 100)}%</span>
                      <span>Total: {chainResult.totalLatency.toFixed(0)}ms</span>
                    </div>
                    {chainResult.steps?.map((step: any, i: number) => (
                      <div key={i} className="p-2 rounded bg-background/50">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-primary">Step {step.stepId}</span>
                          <span>{step.latency.toFixed(0)}ms | κ={Math.round(step.confidence * 100)}%</span>
                        </div>
                        <div className="text-muted-foreground line-clamp-2">{step.response.slice(0, 150)}...</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CALIBRATION TAB */}
          <TabsContent value="calibration" className="p-4 space-y-4 m-0">
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={() => calibrateReasoning('depth')} disabled={isLoading} size="sm" variant="outline">
                <Brain className="w-4 h-4 mr-2" /> Calibrate Reasoning
              </Button>
              <Button onClick={calibrateMemory} disabled={isLoading} size="sm" variant="outline">
                <Layers className="w-4 h-4 mr-2" /> Calibrate Memory
              </Button>
              <Button onClick={calibrateConfidence} disabled={isLoading} size="sm" variant="outline">
                <Target className="w-4 h-4 mr-2" /> Calibrate Confidence
              </Button>
            </div>

            <Card className="border-primary/20">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Calibration Guide</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 text-xs text-muted-foreground space-y-2">
                <p><strong>Reasoning:</strong> Adjusts depth thresholds and phase requirements</p>
                <p><strong>Memory:</strong> Optimizes memory pruning and retrieval parameters</p>
                <p><strong>Confidence:</strong> Tunes VIF thresholds for response gating</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EVOLUTION TAB */}
          <TabsContent value="evolution" className="p-4 space-y-4 m-0">
            <Button onClick={handleEvolutions} disabled={isLoading} size="sm" className="w-full">
              <Sparkles className="w-4 h-4 mr-2" /> Generate Evolution Suggestions
            </Button>

            {evolutions && (
              <div className="space-y-2">
                {evolutions.map((evo, i) => (
                  <Card key={i} className="border-primary/20">
                    <CardContent className="py-3 px-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{evo.type.replace(/_/g, ' ')}</span>
                        <Badge className={getPriorityColor(evo.priority)}>{evo.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{evo.description}</p>
                      <Separator className="bg-primary/10" />
                      <div className="text-xs">
                        <p className="text-muted-foreground">Implementation:</p>
                        <p className="text-primary">{evo.implementation}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-green-400">Expected: {evo.expectedImpact}</span>
                        <Button size="sm" variant="ghost" className="h-6 text-xs">
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {error && (
        <div className="p-2 bg-red-500/20 border-t border-red-500/30">
          <p className="text-xs text-red-400">{error.message}</p>
        </div>
      )}
    </div>
  );
};

export default SelfEvolutionPanel;
