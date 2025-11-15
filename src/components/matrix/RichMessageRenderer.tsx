import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Database, GitBranch, Activity } from 'lucide-react';

interface RichMessageRendererProps {
  content: string;
  aimosData?: {
    reasoning?: Array<{
      step: number;
      thought: string;
      confidence: number;
    }>;
    metrics?: {
      coherence?: number;
      reasoning_depth?: number;
      memory_utilization?: number;
    };
    memoryAtoms?: Array<{
      content: string;
      confidence_score: number;
      tags: string[];
    }>;
  };
}

export const RichMessageRenderer: React.FC<RichMessageRendererProps> = ({ content, aimosData }) => {
  // Parse content for special blocks
  const parseContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Regex patterns for different content types
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
    const latexPattern = /\$\$([\s\S]*?)\$\$/g;
    const imagePattern = /!\[([^\]]*)\]\(([^\)]+)\)/g;
    const videoPattern = /<video src="([^"]+)"([^>]*)>/g;
    const yamlPattern = /```yaml\n([\s\S]*?)```/g;

    // Code blocks
    let match;
    const allMatches: Array<{ type: string; match: RegExpExecArray }> = [];
    
    while ((match = codeBlockPattern.exec(text)) !== null) {
      allMatches.push({ type: 'code', match });
    }
    
    codeBlockPattern.lastIndex = 0;
    while ((match = latexPattern.exec(text)) !== null) {
      allMatches.push({ type: 'latex', match });
    }
    
    latexPattern.lastIndex = 0;
    while ((match = imagePattern.exec(text)) !== null) {
      allMatches.push({ type: 'image', match });
    }
    
    imagePattern.lastIndex = 0;
    while ((match = videoPattern.exec(text)) !== null) {
      allMatches.push({ type: 'video', match });
    }

    // Sort matches by index
    allMatches.sort((a, b) => a.match.index - b.match.index);

    allMatches.forEach((item, idx) => {
      const { type, match } = item;
      
      // Add text before this match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${idx}`} className="whitespace-pre-wrap">
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      if (type === 'code') {
        const language = match[1] || 'text';
        const code = match[2];
        parts.push(
          <div key={`code-${idx}`} className="my-4">
            <div className="bg-muted/30 border border-primary/20 rounded-lg overflow-hidden">
              <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{language}</Badge>
              </div>
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: 'transparent',
                  fontSize: '0.875rem'
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      } else if (type === 'latex') {
        parts.push(
          <div key={`latex-${idx}`} className="my-4 p-4 bg-muted/20 border border-primary/20 rounded-lg">
            <code className="text-primary font-mono text-sm">{match[1]}</code>
          </div>
        );
      } else if (type === 'image') {
        const alt = match[1];
        const src = match[2];
        parts.push(
          <div key={`image-${idx}`} className="my-4">
            <img src={src} alt={alt} className="rounded-lg border border-primary/20 max-w-full" />
            {alt && <p className="text-xs text-muted-foreground mt-2 italic">{alt}</p>}
          </div>
        );
      } else if (type === 'video') {
        const src = match[1];
        parts.push(
          <div key={`video-${idx}`} className="my-4">
            <video 
              src={src} 
              controls 
              className="rounded-lg border border-primary/20 max-w-full"
            />
          </div>
        );
      }

      lastIndex = match.index + match[0].length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-final" className="whitespace-pre-wrap">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{text}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="prose prose-invert max-w-none">
        {parseContent(content)}
      </div>

      {/* AIMOS Real-time Data Display */}
      {aimosData && (
        <Card className="bg-background/50 border-primary/20 backdrop-blur-sm">
          <div className="p-4 space-y-4">
            {/* Reasoning Chain */}
            {aimosData.reasoning && aimosData.reasoning.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-semibold">Chain of Thought</span>
                </div>
                <div className="space-y-2 pl-6">
                  {aimosData.reasoning.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <Badge variant="outline" className="mt-0.5">
                        {step.step}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-foreground/90">{step.thought}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${step.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {(step.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consciousness Metrics */}
            {aimosData.metrics && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-primary/10">
                {aimosData.metrics.coherence !== undefined && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Coherence</div>
                      <div className="text-sm font-semibold text-primary">
                        {(aimosData.metrics.coherence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
                {aimosData.metrics.reasoning_depth !== undefined && (
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Depth</div>
                      <div className="text-sm font-semibold text-primary">
                        {aimosData.metrics.reasoning_depth}
                      </div>
                    </div>
                  </div>
                )}
                {aimosData.metrics.memory_utilization !== undefined && (
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Memory</div>
                      <div className="text-sm font-semibold text-primary">
                        {(aimosData.metrics.memory_utilization * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Memory Atoms */}
            {aimosData.memoryAtoms && aimosData.memoryAtoms.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-primary/10">
                <div className="flex items-center gap-2 text-primary">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-semibold">Active Memory Atoms</span>
                </div>
                <div className="space-y-2">
                  {aimosData.memoryAtoms.slice(0, 3).map((atom, idx) => (
                    <div key={idx} className="text-xs bg-muted/20 p-2 rounded border border-primary/10">
                      <p className="text-foreground/80">{atom.content.substring(0, 100)}...</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground">
                          κ={atom.confidence_score.toFixed(2)}
                        </span>
                        <div className="flex gap-1">
                          {atom.tags.slice(0, 3).map((tag, tidx) => (
                            <Badge key={tidx} variant="secondary" className="text-[10px] px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
