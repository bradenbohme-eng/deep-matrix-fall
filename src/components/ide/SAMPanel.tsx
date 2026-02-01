import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Brain, FileCode, Layers, Search,
  Zap, FileText, Play, Loader2,
  Network, Box, Database, Tag
} from 'lucide-react';
import { SAMEngine, SAMAnalysisResult, SAMIngestionJob } from '@/lib/sam';
import { MasterIndex, RAGRetriever, ScoredChunk } from '@/lib/docIndex';
import { FileNode } from './types';
import { cn } from '@/lib/utils';

interface SAMPanelProps {
  files: FileNode[];
  masterIndex: MasterIndex | null;
  isIndexing: boolean;
  onIndexFiles: () => Promise<MasterIndex | null>;
  onGenerateDocument?: (content: string, filename: string) => void;
}

export const SAMPanel: React.FC<SAMPanelProps> = ({ 
  files, masterIndex, isIndexing, onIndexFiles, onGenerateDocument 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [job, setJob] = useState<SAMIngestionJob | null>(null);
  const [result, setResult] = useState<SAMAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScoredChunk[]>([]);

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

  const handleSearch = useCallback(() => {
    if (!masterIndex || !searchQuery.trim()) return;
    const retriever = new RAGRetriever(masterIndex);
    const results = retriever.search(searchQuery, { maxResults: 10 });
    setSearchResults(results.chunks);
  }, [masterIndex, searchQuery]);

  const handleIndexAndAnalyze = useCallback(async () => {
    // First index, then analyze
    await onIndexFiles();
    await handleAnalyze();
  }, [onIndexFiles, handleAnalyze]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">S.A.M.</span>
            <Badge variant="outline" className="text-xs">v3.0</Badge>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={onIndexFiles} disabled={isIndexing} className="h-7">
              {isIndexing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
            </Button>
            <Button size="sm" onClick={handleIndexAndAnalyze} disabled={isAnalyzing || isIndexing} className="h-7">
              {isAnalyzing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </div>
        
        {(isAnalyzing || isIndexing) && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{isIndexing ? 'Indexing documents...' : job?.currentPhase}</span>
              <span>{job?.progress || 0}%</span>
            </div>
            <Progress value={job?.progress || (isIndexing ? 50 : 0)} className="h-1" />
          </div>
        )}

        {masterIndex && (
          <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-[10px]">
              <Database className="w-2.5 h-2.5 mr-1" />
              {masterIndex.stats.totalDocuments} docs
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              <Tag className="w-2.5 h-2.5 mr-1" />
              {masterIndex.stats.totalSymbols} symbols
            </Badge>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {result?.success && result.systemMap ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-3">
            <TabsList className="grid grid-cols-5 h-8">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="structure" className="text-xs">Structure</TabsTrigger>
              <TabsTrigger value="quality" className="text-xs">Quality</TabsTrigger>
              <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
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

            <TabsContent value="search" className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Search codebase..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-8 text-xs"
                />
                <Button size="sm" onClick={handleSearch} disabled={!masterIndex} className="h-8">
                  <Search className="w-3 h-3" />
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((r, i) => (
                    <div key={i} className="p-2 rounded bg-muted/30 border border-border text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-primary">{r.documentName}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {(r.score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="text-muted-foreground line-clamp-2">
                        {r.chunk.summary}
                      </div>
                      {r.matchedKeywords.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {r.matchedKeywords.slice(0, 3).map((k, j) => (
                            <Badge key={j} variant="secondary" className="text-[9px]">{k}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {!masterIndex && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Click the database icon to index files first
                </p>
              )}
            </TabsContent>

            <TabsContent value="index" className="mt-3">
              <pre className="text-xs font-mono p-3 rounded bg-muted/50 overflow-auto max-h-80">
                {JSON.stringify(masterIndex?.stats || result.systemMap.index?.metadata, null, 2)}
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
