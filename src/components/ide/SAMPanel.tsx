import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, FileCode, GitBranch, Layers, Activity, Shield, 
  Zap, CheckCircle, AlertTriangle, FileText, Play, Loader2,
  Network, Box, ArrowRight
} from 'lucide-react';
import { SAMEngine, SAMAnalysisResult, SAMIngestionJob, SAMSystemMap } from '@/lib/sam';
import { FileNode } from './types';
import { cn } from '@/lib/utils';

interface SAMPanelProps {
  files: FileNode[];
  onGenerateDocument?: (content: string, filename: string) => void;
}

export const SAMPanel: React.FC<SAMPanelProps> = ({ files, onGenerateDocument }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [job, setJob] = useState<SAMIngestionJob | null>(null);
  const [result, setResult] = useState<SAMAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const collectFiles = useCallback((nodes: FileNode[]): Array<{ path: string; content: string }> => {
    const collected: Array<{ path: string; content: string }> = [];
    const traverse = (node: FileNode) => {
      if (node.type === 'file' && node.content) {
        collected.push({ path: node.path, content: node.content });
      }
      node.children?.forEach(traverse);
    };
    nodes.forEach(traverse);
    return collected;
  }, []);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setResult(null);

    const engine = new SAMEngine({}, {}, (j) => setJob({ ...j }));
    const fileData = collectFiles(files);

    try {
      const analysisResult = await engine.ingest(fileData);
      setResult(analysisResult);
    } catch (error) {
      console.error('SAM analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [files, collectFiles]);

  const handleExportMap = useCallback(() => {
    if (!result?.systemMap) return;
    const map = result.systemMap;
    const content = `# SAM SYSTEM MAP\n\n## Components: ${map.structure.components.length}\n## Relationships: ${map.structure.relationships.length}\n\n${JSON.stringify(map.index, null, 2)}`;
    onGenerateDocument?.(content, 'SAM_SYSTEM_MAP.md');
  }, [result, onGenerateDocument]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">S.A.M.</span>
            <Badge variant="outline" className="text-xs">v3.0</Badge>
          </div>
          <Button size="sm" onClick={handleAnalyze} disabled={isAnalyzing} className="h-7">
            {isAnalyzing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
        
        {isAnalyzing && job && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{job.currentPhase}</span>
              <span>{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="h-1" />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {result?.success && result.systemMap ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-3">
            <TabsList className="grid grid-cols-4 h-8">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="structure" className="text-xs">Structure</TabsTrigger>
              <TabsTrigger value="quality" className="text-xs">Quality</TabsTrigger>
              <TabsTrigger value="index" className="text-xs">Index</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <StatCard icon={FileCode} label="Files" value={result.stats.filesAnalyzed} />
                <StatCard icon={Box} label="Components" value={result.stats.componentsFound} />
                <StatCard icon={Network} label="Relations" value={result.stats.relationshipsFound} />
                <StatCard icon={Layers} label="Lines" value={result.stats.linesProcessed} />
              </div>

              {result.systemMap.qualityMetrics && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Perfection Score</span>
                    <span className={cn("text-lg font-bold", 
                      result.systemMap.qualityMetrics.perfectionScore >= 80 ? "text-green-500" : "text-yellow-500"
                    )}>
                      {result.systemMap.qualityMetrics.perfectionScore.toFixed(0)}/100
                    </span>
                  </div>
                  <Progress value={result.systemMap.qualityMetrics.perfectionScore} className="h-2" />
                </div>
              )}

              {result.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" /> Suggestions
                  </h4>
                  {result.suggestions.slice(0, 3).map((s, i) => (
                    <div key={i} className="p-2 rounded bg-muted/30 border border-border text-xs">
                      <div className="font-medium">{s.title}</div>
                      <div className="text-muted-foreground mt-1">{s.description}</div>
                    </div>
                  ))}
                </div>
              )}

              <Button size="sm" variant="outline" onClick={handleExportMap} className="w-full">
                <FileText className="w-3 h-3 mr-2" /> Export System Map
              </Button>
            </TabsContent>

            <TabsContent value="structure" className="mt-3 space-y-3">
              <h4 className="text-sm font-medium">Components ({result.systemMap.structure.components.length})</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {result.systemMap.structure.components.slice(0, 30).map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                      <span className="font-mono">{c.name}</span>
                    </div>
                    <span className="text-muted-foreground">C:{c.complexity}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quality" className="mt-3 space-y-3">
              {result.systemMap.qualityMetrics && (
                <>
                  <MetricBar label="Completeness" value={result.systemMap.qualityMetrics.completeness.score} />
                  <MetricBar label="Consistency" value={result.systemMap.qualityMetrics.consistency.score} />
                  <MetricBar label="Evidence" value={result.systemMap.qualityMetrics.evidence.score} />
                  <MetricBar label="Readability" value={result.systemMap.qualityMetrics.readability.score} />
                  <MetricBar label="Maintenance" value={result.systemMap.qualityMetrics.maintenance.score} />
                </>
              )}
            </TabsContent>

            <TabsContent value="index" className="mt-3">
              <pre className="text-xs font-mono p-3 rounded bg-muted/50 overflow-auto max-h-80">
                {JSON.stringify(result.systemMap.index?.metadata, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Click Analyze to map your codebase</p>
            <p className="text-xs mt-1">S.A.M. will extract structure, behavior, interfaces, constraints & evidence</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

const StatCard: React.FC<{ icon: any; label: string; value: number }> = ({ icon: Icon, label, value }) => (
  <div className="p-3 rounded-lg bg-muted/50 border border-border">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      <Icon className="w-3 h-3" />
      <span className="text-xs">{label}</span>
    </div>
    <div className="text-lg font-bold">{value.toLocaleString()}</div>
  </div>
);

const MetricBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span>{label}</span>
      <span className={cn(value >= 80 ? "text-green-500" : value >= 50 ? "text-yellow-500" : "text-red-500")}>
        {value.toFixed(0)}%
      </span>
    </div>
    <Progress value={value} className="h-1.5" />
  </div>
);

export default SAMPanel;
