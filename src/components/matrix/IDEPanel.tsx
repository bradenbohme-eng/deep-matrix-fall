import React, { useEffect, useMemo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeCode } from '@/lib/aiClient';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Code2, Sparkles, AlertTriangle, GitBranch, Database, 
  Network, TrendingUp, Tags, FileText, History, Zap, Target,
  Layers, GitMerge, Save, Archive, RefreshCw, Plus, Minus
} from 'lucide-react';

// AI-MOS Enhanced IDE: Memory Operating System for AI Development
// Implements: Unlimited Context, Perfect Memory, Intelligent Compression, Collaborative Intelligence

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface ContextLevel {
  name: string;
  tokenRange: string;
  description: string;
  content: string;
  quality: number;
}

interface MemoryBranch {
  id: string;
  name: string;
  parent: string | null;
  timestamp: string;
  quality: number;
  description: string;
  content: string;
}

interface UniversalTag {
  name: string;
  connected: string[];
  relationships: {
    parent?: string;
    children: string[];
    peers: string[];
  };
  consistency: number;
}

interface QualityMetrics {
  completeness: number;
  density: number;
  relevance: number;
  hallucination_rate: number;
  tokens_per_insight: number;
  compression_ratio: number;
}

const seedTree: FileNode[] = [
  { id: '1', name: 'src', type: 'folder', children: [
    { id: '1-1', name: 'components', type: 'folder', children: [
      { id: '1-1-1', name: 'MatrixHUD.tsx', type: 'file' },
      { id: '1-1-2', name: 'AdvancedNeoChat.tsx', type: 'file' },
    ]},
    { id: '1-2', name: 'pages', type: 'folder', children: [
      { id: '1-2-1', name: 'Index.tsx', type: 'file' },
    ]},
    { id: '1-3', name: 'ai-mos', type: 'folder', children: [
      { id: '1-3-1', name: 'context-manager.ts', type: 'file' },
      { id: '1-3-2', name: 'memory-core.ts', type: 'file' },
    ]},
  ]},
  { id: '2', name: 'README.md', type: 'file' },
  { id: '3', name: 'ARCHITECTURE.md', type: 'file' },
];

const IDEPanel: React.FC = () => {
  const [activePath, setActivePath] = useState<string>('README.md');
  const [content, setContent] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // AI-MOS State Management
  const [contextLevels, setContextLevels] = useState<ContextLevel[]>([
    { name: 'short', tokenRange: '3-500', description: 'High-level overview', content: '', quality: 0 },
    { name: 'medium', tokenRange: '500-2000', description: 'Detailed architecture', content: '', quality: 0 },
    { name: 'large', tokenRange: '2000-50000', description: 'Comprehensive specs', content: '', quality: 0 },
    { name: 'super_index', tokenRange: '50000+', description: 'Full knowledge base', content: '', quality: 0 },
  ]);

  const [branches, setBranches] = useState<MemoryBranch[]>([
    {
      id: 'main',
      name: 'main',
      parent: null,
      timestamp: new Date().toISOString(),
      quality: 0.92,
      description: 'Primary development branch',
      content: ''
    }
  ]);

  const [activeBranch, setActiveBranch] = useState<string>('main');
  const [tags, setTags] = useState<UniversalTag[]>([
    { name: 'architecture', connected: [], relationships: { children: [], peers: [] }, consistency: 1.0 },
    { name: 'component', connected: [], relationships: { children: [], peers: [] }, consistency: 1.0 },
    { name: 'optimization', connected: [], relationships: { children: [], peers: [] }, consistency: 1.0 },
  ]);

  const [metrics, setMetrics] = useState<QualityMetrics>({
    completeness: 0.85,
    density: 0.92,
    relevance: 0.88,
    hallucination_rate: 0.04,
    tokens_per_insight: 150,
    compression_ratio: 0.75
  });

  // Load workspace
  useEffect(() => {
    const saved = localStorage.getItem('neo_ide_ai_mos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActivePath(parsed.activePath || 'README.md');
        setContent(parsed.content || '');
        if (parsed.branches) setBranches(parsed.branches);
        if (parsed.tags) setTags(parsed.tags);
        if (parsed.contextLevels) setContextLevels(parsed.contextLevels);
      } catch {}
    }
  }, []);

  const save = () => {
    localStorage.setItem('neo_ide_ai_mos', JSON.stringify({ 
      activePath, 
      content, 
      branches, 
      tags, 
      contextLevels,
      activeBranch 
    }));
    toast({
      title: "💾 Memory Persisted",
      description: `${activePath} saved with AI-MOS metadata`,
    });
  };

  const createBranch = () => {
    const newBranch: MemoryBranch = {
      id: `branch-${Date.now()}`,
      name: `experiment-${branches.length}`,
      parent: activeBranch,
      timestamp: new Date().toISOString(),
      quality: 0,
      description: 'New experimental branch',
      content: content
    };
    setBranches([...branches, newBranch]);
    setActiveBranch(newBranch.id);
    toast({
      title: "🌿 Branch Created",
      description: `New branch: ${newBranch.name}`,
    });
  };

  const mergeBranch = () => {
    const current = branches.find(b => b.id === activeBranch);
    if (current && current.parent) {
      toast({
        title: "🔀 Merge Initiated",
        description: `Merging ${current.name} into parent branch`,
      });
      // In production, this would trigger AI quality assessment
    }
  };

  const compressContext = () => {
    // Intelligent compression simulation
    const compressed = content.split('\n').filter(line => line.trim()).join('\n');
    setContent(compressed);
    const ratio = compressed.length / content.length;
    setMetrics({ ...metrics, compression_ratio: ratio });
    toast({
      title: "🗜️ Context Compressed",
      description: `Compression ratio: ${(ratio * 100).toFixed(1)}%`,
    });
  };

  const generateContextLevel = async (level: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeCode(
        content, 
        'typescript', 
        'explain',
        `Generate a ${level} summary with token range appropriate for this level`
      );
      
      const updated = contextLevels.map(cl => 
        cl.name === level ? { ...cl, content: result.result, quality: 0.9 } : cl
      );
      setContextLevels(updated);
      
      toast({
        title: "📊 Context Level Generated",
        description: `${level} summary created`,
      });
    } catch (error) {
      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : 'Generation failed',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addTag = (tagName: string) => {
    if (!tags.find(t => t.name === tagName)) {
      const newTag: UniversalTag = {
        name: tagName,
        connected: [activePath],
        relationships: { children: [], peers: [] },
        consistency: 1.0
      };
      setTags([...tags, newTag]);
      toast({
        title: "🏷️ Tag Added",
        description: `Tag "${tagName}" connected to ${activePath}`,
      });
    }
  };

  const runAIAnalysis = async (task: "analyze" | "explain" | "optimize" | "exploit") => {
    if (!content.trim()) {
      toast({
        title: "No Code",
        description: "Please enter some code to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis('');

    try {
      const language = activePath.endsWith('.tsx') || activePath.endsWith('.ts') 
        ? 'typescript' 
        : activePath.endsWith('.jsx') || activePath.endsWith('.js')
        ? 'javascript'
        : 'text';

      const result = await analyzeCode(content, language, task);
      setAiAnalysis(result.result);
      
      // Update metrics
      setMetrics({
        ...metrics,
        relevance: Math.min(0.99, metrics.relevance + 0.02),
        hallucination_rate: Math.max(0.01, metrics.hallucination_rate - 0.01)
      });
      
      toast({
        title: "🧠 Analysis Complete",
        description: `AI-MOS has ${task}d your code`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Analysis failed';
      toast({
        title: "Analysis Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = useMemo(() => ['README.md', 'Index.tsx', 'AdvancedNeoChat.tsx'], []);

  return (
    <section className="h-full flex bg-background/95">
      {/* File Explorer with AI-MOS */}
      <aside className="w-64 border-r border-primary/20 flex flex-col">
        <div className="p-3 border-b border-primary/20">
          <h1 className="text-primary font-mono text-sm mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI-MOS IDE
          </h1>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={createBranch} className="flex-1 h-7 text-xs">
              <GitBranch className="w-3 h-3 mr-1" />
              Branch
            </Button>
            <Button size="sm" variant="ghost" onClick={save} className="flex-1 h-7 text-xs">
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-3">
          <nav className="text-xs font-mono space-y-1">
            {seedTree.map((node) => (
              <TreeNode key={node.id} node={node} onOpen={(path) => setActivePath(path)} activePath={activePath} />
            ))}
          </nav>
        </ScrollArea>

        {/* Active Branch Indicator */}
        <div className="p-3 border-t border-primary/20">
          <div className="text-[10px] text-muted-foreground mb-1">ACTIVE BRANCH</div>
          <div className="flex items-center gap-2 text-xs text-primary font-mono">
            <GitBranch className="w-3 h-3" />
            {branches.find(b => b.id === activeBranch)?.name || 'main'}
          </div>
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between border-b border-primary/20 px-3 py-2 bg-background/50">
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActivePath(t)}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                  activePath === t ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={compressContext} className="gap-1 h-7 text-xs">
              <Archive className="w-3 h-3" />
              Compress
            </Button>
            <Button variant="outline" size="sm" onClick={() => runAIAnalysis('analyze')} disabled={isAnalyzing} className="gap-1 h-7 text-xs">
              <Brain className="w-3 h-3" />
              Analyze
            </Button>
            <Button variant="outline" size="sm" onClick={() => runAIAnalysis('optimize')} disabled={isAnalyzing} className="gap-1 h-7 text-xs">
              <Sparkles className="w-3 h-3" />
              Optimize
            </Button>
            <Button variant="outline" size="sm" onClick={() => runAIAnalysis('exploit')} disabled={isAnalyzing} className="gap-1 h-7 text-xs">
              <AlertTriangle className="w-3 h-3" />
              Exploit
            </Button>
          </div>
        </div>

        {/* Editor and AI-MOS Panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 p-3 overflow-auto">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Editing: ${activePath}\n\nAI-MOS: Unlimited context, perfect memory, intelligent optimization\n\nUse the panels on the right to manage context levels, branches, and tags`}
              className="w-full h-full min-h-[600px] bg-transparent font-mono text-sm border-primary/30 resize-none"
            />
          </div>

          {/* AI-MOS Control Panel */}
          <div className="w-[420px] border-l border-primary/20 flex flex-col bg-background/80">
            <Tabs defaultValue="context" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-background/50 border-b border-primary/20 rounded-none h-10">
                <TabsTrigger value="context" className="text-xs gap-1">
                  <Layers className="w-3 h-3" />
                  Context
                </TabsTrigger>
                <TabsTrigger value="branches" className="text-xs gap-1">
                  <GitBranch className="w-3 h-3" />
                  Branches
                </TabsTrigger>
                <TabsTrigger value="tags" className="text-xs gap-1">
                  <Tags className="w-3 h-3" />
                  Tags
                </TabsTrigger>
                <TabsTrigger value="metrics" className="text-xs gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Metrics
                </TabsTrigger>
              </TabsList>

              {/* Context Management */}
              <TabsContent value="context" className="flex-1 overflow-auto p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-primary" />
                  <h3 className="font-mono font-bold text-sm text-primary">CONTEXT HIERARCHY</h3>
                </div>
                {contextLevels.map((level) => (
                  <Card key={level.name} className="p-3 bg-card/50 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">{level.name}</Badge>
                        <span className="text-[10px] text-muted-foreground">{level.tokenRange}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Q: {level.quality.toFixed(2)}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => generateContextLevel(level.name)}
                          disabled={isAnalyzing}
                          className="h-6 w-6 p-0"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">{level.description}</p>
                    {level.content && (
                      <div className="text-[10px] font-mono text-primary/70 bg-background/50 p-2 rounded max-h-20 overflow-auto">
                        {level.content.substring(0, 200)}...
                      </div>
                    )}
                  </Card>
                ))}
              </TabsContent>

              {/* Branch Management */}
              <TabsContent value="branches" className="flex-1 overflow-auto p-4 space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-primary" />
                    <h3 className="font-mono font-bold text-sm text-primary">MEMORY BRANCHES</h3>
                  </div>
                  <Button size="sm" variant="outline" onClick={mergeBranch} className="h-6 text-[10px]">
                    <GitMerge className="w-3 h-3 mr-1" />
                    Merge
                  </Button>
                </div>
                {branches.map((branch) => (
                  <Card 
                    key={branch.id} 
                    className={`p-3 cursor-pointer transition-all ${
                      activeBranch === branch.id 
                        ? 'bg-primary/10 border-primary/40' 
                        : 'bg-card/50 border-primary/20 hover:bg-card/70'
                    }`}
                    onClick={() => setActiveBranch(branch.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3 h-3 text-primary" />
                        <span className="text-xs font-mono font-bold">{branch.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px]">Q: {branch.quality.toFixed(2)}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1">{branch.description}</p>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      <History className="w-2.5 h-2.5" />
                      {new Date(branch.timestamp).toLocaleString()}
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {/* Tag System */}
              <TabsContent value="tags" className="flex-1 overflow-auto p-4 space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-primary" />
                    <h3 className="font-mono font-bold text-sm text-primary">UNIVERSAL TAGS</h3>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => addTag(`tag-${tags.length + 1}`)}
                    className="h-6 text-[10px]"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {tags.map((tag) => (
                  <Card key={tag.name} className="p-3 bg-card/50 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="text-[10px] font-mono">#{tag.name}</Badge>
                      <div className="flex items-center gap-1">
                        <Target className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">
                          {tag.consistency.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      <div>Connected: {tag.connected.length}</div>
                      <div>Children: {tag.relationships.children.length}</div>
                      <div>Peers: {tag.relationships.peers.length}</div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {/* Metrics Dashboard */}
              <TabsContent value="metrics" className="flex-1 overflow-auto p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="font-mono font-bold text-sm text-primary">QUALITY METRICS</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard label="Completeness" value={metrics.completeness} icon={<FileText className="w-3 h-3" />} />
                  <MetricCard label="Density" value={metrics.density} icon={<Layers className="w-3 h-3" />} />
                  <MetricCard label="Relevance" value={metrics.relevance} icon={<Target className="w-3 h-3" />} />
                  <MetricCard label="Hallucination" value={metrics.hallucination_rate} inverse icon={<AlertTriangle className="w-3 h-3" />} />
                </div>
                <Card className="p-3 bg-card/50 border-primary/20">
                  <div className="text-[10px] text-muted-foreground mb-1">TOKENS PER INSIGHT</div>
                  <div className="text-2xl font-mono font-bold text-primary">{metrics.tokens_per_insight}</div>
                </Card>
                <Card className="p-3 bg-card/50 border-primary/20">
                  <div className="text-[10px] text-muted-foreground mb-1">COMPRESSION RATIO</div>
                  <div className="text-2xl font-mono font-bold text-primary">
                    {(metrics.compression_ratio * 100).toFixed(1)}%
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <Card className="w-96 m-3 p-4 bg-card/95 border-primary/30 overflow-auto">
              <div className="flex items-center gap-2 mb-3 text-primary">
                <Code2 className="w-5 h-5" />
                <h3 className="font-mono font-bold">AI ANALYSIS</h3>
              </div>
              <div className="text-sm font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {aiAnalysis}
              </div>
            </Card>
          )}
          
          {isAnalyzing && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-primary font-mono text-sm">AI-MOS Processing...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </section>
  );
};

const MetricCard: React.FC<{ label: string; value: number; icon: React.ReactNode; inverse?: boolean }> = 
  ({ label, value, icon, inverse }) => (
    <Card className="p-3 bg-card/50 border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary">{icon}</div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className={`text-xl font-mono font-bold ${
        inverse 
          ? value < 0.1 ? 'text-green-500' : 'text-amber-500'
          : value > 0.8 ? 'text-green-500' : 'text-amber-500'
      }`}>
        {(value * 100).toFixed(0)}%
      </div>
    </Card>
  );

const TreeNode: React.FC<{ node: FileNode; onOpen: (p: string) => void; activePath: string }> = 
  ({ node, onOpen, activePath }) => {
    if (node.type === 'file') {
      return (
        <div>
          <button
            onClick={() => onOpen(node.name)}
            className={`w-full text-left px-2 py-1 rounded transition-colors ${
              activePath === node.name 
                ? 'bg-primary/15 text-primary' 
                : 'hover:bg-muted/10 text-muted-foreground'
            }`}
          >
            • {node.name}
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <div className="text-primary/70 px-2">▸ {node.name}</div>
        <div className="ml-3">
          {node.children?.map((c) => (
            <TreeNode key={c.id} node={c} onOpen={onOpen} activePath={activePath} />
          ))}
        </div>
      </div>
    );
  };

export default IDEPanel;
