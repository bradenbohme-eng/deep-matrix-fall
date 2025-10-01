import React, { useEffect, useMemo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeCode } from '@/lib/aiClient';
import { Card } from '@/components/ui/card';
import { Brain, Code2, Sparkles, AlertTriangle } from 'lucide-react';

// IDEPanel: Minimal, theme-aligned code workspace (simulated editor)
// Inputs: none
// Outputs: local state persisted to localStorage under "neo_ide_workspace"
// TODOs: Replace textarea with real editor, wire to Supabase Edge Functions for save/run

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
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
  ]},
  { id: '2', name: 'README.md', type: 'file' },
];

const IDEPanel: React.FC = () => {
  const [activePath, setActivePath] = useState<string>('README.md');
  const [content, setContent] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Load/save workspace
  useEffect(() => {
    const saved = localStorage.getItem('neo_ide_workspace');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActivePath(parsed.activePath || 'README.md');
        setContent(parsed.content || '');
      } catch {}
    }
  }, []);

  const save = () => {
    localStorage.setItem('neo_ide_workspace', JSON.stringify({ activePath, content }));
    toast({
      title: "Saved",
      description: `${activePath} saved to local workspace`,
    });
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
      
      toast({
        title: "Analysis Complete",
        description: `Gemini AI has ${task}d your code`,
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
    <section className="h-full flex">
      <aside className="w-56 border-r border-primary/20 p-3 overflow-auto">
        <h1 className="text-primary font-mono text-sm mb-2">NEO IDE</h1>
        <nav className="text-xs font-mono space-y-1">
          {seedTree.map((node) => (
            <TreeNode key={node.id} node={node} onOpen={(path) => setActivePath(path)} activePath={activePath} />
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-primary/20 px-3 py-2">
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActivePath(t)}
                className={`px-2 py-1 text-[11px] font-mono rounded ${
                  activePath === t ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={save}>Save</Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runAIAnalysis('analyze')}
              disabled={isAnalyzing}
              className="gap-1"
            >
              <Brain className="w-3 h-3" />
              Analyze
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runAIAnalysis('optimize')}
              disabled={isAnalyzing}
              className="gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Optimize
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runAIAnalysis('exploit')}
              disabled={isAnalyzing}
              className="gap-1"
            >
              <AlertTriangle className="w-3 h-3" />
              Exploit
            </Button>
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 p-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Editing: ${activePath}\n\nGemini AI code analysis available - click Analyze, Optimize, or Exploit`}
              className="w-full h-full min-h-[400px] bg-transparent font-mono text-sm border-primary/30"
            />
          </div>
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
            <div className="w-96 m-3 p-4 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-primary font-mono text-sm">Gemini AI analyzing...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </section>
  );
};

const TreeNode: React.FC<{ node: FileNode; onOpen: (p: string) => void; activePath: string }> = ({ node, onOpen, activePath }) => {
  if (node.type === 'file') {
    return (
      <div>
        <button
          onClick={() => onOpen(node.name)}
          className={`w-full text-left px-2 py-1 rounded ${activePath === node.name ? 'bg-primary/15 text-primary' : 'hover:bg-muted/10'}`}
        >
          • {node.name}
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="text-primary/70">▸ {node.name}</div>
      <div className="ml-3">
        {node.children?.map((c) => (
          <TreeNode key={c.id} node={c} onOpen={onOpen} activePath={activePath} />
        ))}
      </div>
    </div>
  );
};

export default IDEPanel;
