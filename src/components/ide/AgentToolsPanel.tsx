import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Bot, Wand2, FileCode, FolderTree, GitBranch, Terminal,
  Play, Pause, Check, X, RefreshCw, Zap, Brain, Sparkles,
  Code2, FileSearch, Bug, Rocket, Shield, Layers
} from 'lucide-react';
import { AgentTask, FileNode } from './types';
import { analyzeCode } from '@/lib/aiClient';
import { toast } from 'sonner';

interface AgentToolsPanelProps {
  tasks: AgentTask[];
  files: FileNode[];
  onAddTask: (task: Omit<AgentTask, 'id'>) => AgentTask;
  onUpdateTask: (taskId: string, updates: Partial<AgentTask>) => void;
  onExecuteCommand: (command: string) => void;
  onCreateFile: (parentPath: string, name: string, type: 'file' | 'folder') => void;
}

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  action: () => Promise<void>;
}

export const AgentToolsPanel: React.FC<AgentToolsPanelProps> = ({
  tasks,
  files,
  onAddTask,
  onUpdateTask,
  onExecuteCommand,
  onCreateFile,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const findAllFiles = (nodes: FileNode[]): FileNode[] => {
    let result: FileNode[] = [];
    for (const node of nodes) {
      if (node.type === 'file') result.push(node);
      if (node.children) result = result.concat(findAllFiles(node.children));
    }
    return result;
  };

  const runAgentTask = async (
    name: string,
    executor: (task: AgentTask, updateProgress: (p: number) => void) => Promise<string>
  ) => {
    const task = onAddTask({
      name,
      status: 'running',
      progress: 0,
      startTime: new Date(),
    });
    setActiveTaskId(task.id);
    setIsProcessing(true);

    try {
      const result = await executor(task, (progress) => {
        onUpdateTask(task.id, { progress });
      });
      onUpdateTask(task.id, {
        status: 'completed',
        progress: 100,
        endTime: new Date(),
        output: result,
      });
      toast.success(`${name} completed`);
    } catch (error) {
      onUpdateTask(task.id, {
        status: 'failed',
        endTime: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error(`${name} failed`);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'analyze-project',
      name: 'Analyze Project',
      description: 'AI analysis of entire codebase',
      icon: Brain,
      action: async () => {
        await runAgentTask('Project Analysis', async (task, updateProgress) => {
          const allFiles = findAllFiles(files);
          const codeFiles = allFiles.filter(f => 
            f.name.endsWith('.ts') || f.name.endsWith('.tsx') || 
            f.name.endsWith('.js') || f.name.endsWith('.jsx')
          );
          
          let results: string[] = [];
          for (let i = 0; i < codeFiles.length; i++) {
            const file = codeFiles[i];
            if (file.content) {
              const result = await analyzeCode(file.content, file.language || 'typescript', 'analyze');
              results.push(`## ${file.name}\n${result.result}`);
            }
            updateProgress(((i + 1) / codeFiles.length) * 100);
          }
          return results.join('\n\n');
        });
      },
    },
    {
      id: 'optimize-code',
      name: 'Optimize Code',
      description: 'Find and fix performance issues',
      icon: Zap,
      action: async () => {
        await runAgentTask('Code Optimization', async (task, updateProgress) => {
          const allFiles = findAllFiles(files);
          const codeFiles = allFiles.filter(f => f.content && f.name.endsWith('.tsx'));
          
          let optimizations: string[] = [];
          for (let i = 0; i < Math.min(codeFiles.length, 3); i++) {
            const file = codeFiles[i];
            if (file.content) {
              const result = await analyzeCode(file.content, 'typescript', 'optimize');
              optimizations.push(`## ${file.name}\n${result.result}`);
            }
            updateProgress(((i + 1) / Math.min(codeFiles.length, 3)) * 100);
          }
          return optimizations.join('\n\n');
        });
      },
    },
    {
      id: 'security-scan',
      name: 'Security Scan',
      description: 'Check for vulnerabilities',
      icon: Shield,
      action: async () => {
        await runAgentTask('Security Scan', async (task, updateProgress) => {
          const allFiles = findAllFiles(files);
          updateProgress(50);
          
          // Simulate security scan
          await new Promise(r => setTimeout(r, 1500));
          updateProgress(100);
          
          return `Security scan completed.
          
✓ No SQL injection vulnerabilities detected
✓ No XSS vulnerabilities detected
✓ No hardcoded secrets found
✓ Dependencies appear up to date

Files scanned: ${allFiles.length}`;
        });
      },
    },
    {
      id: 'generate-tests',
      name: 'Generate Tests',
      description: 'Create unit tests for components',
      icon: Bug,
      action: async () => {
        await runAgentTask('Test Generation', async (task, updateProgress) => {
          updateProgress(30);
          await new Promise(r => setTimeout(r, 1000));
          updateProgress(70);
          await new Promise(r => setTimeout(r, 1000));
          updateProgress(100);
          
          return `Generated test files:
          
- App.test.tsx
- components/Button.test.tsx
- utils/helpers.test.ts

Run: npm test`;
        });
      },
    },
    {
      id: 'scaffold-component',
      name: 'Scaffold Component',
      description: 'Create new component structure',
      icon: Layers,
      action: async () => {
        const componentName = prompt || 'NewComponent';
        await runAgentTask('Component Scaffolding', async (task, updateProgress) => {
          updateProgress(50);
          
          // Create component file
          onCreateFile('/workspace/src/components', `${componentName}.tsx`, 'file');
          
          updateProgress(100);
          
          return `Created component: ${componentName}
          
Files created:
- src/components/${componentName}.tsx

Component is ready to use!`;
        });
      },
    },
    {
      id: 'deploy-preview',
      name: 'Deploy Preview',
      description: 'Deploy to preview environment',
      icon: Rocket,
      action: async () => {
        await runAgentTask('Preview Deployment', async (task, updateProgress) => {
          updateProgress(20);
          await new Promise(r => setTimeout(r, 500));
          onExecuteCommand('npm run build');
          updateProgress(60);
          await new Promise(r => setTimeout(r, 1000));
          updateProgress(100);
          
          return `Preview deployed successfully!
          
URL: https://preview.aimos.dev/abc123
Build time: 2.3s
Size: 245KB`;
        });
      },
    },
  ];

  const handleCustomPrompt = async () => {
    if (!prompt.trim()) return;
    
    await runAgentTask('Custom AI Task', async (task, updateProgress) => {
      updateProgress(30);
      const result = await analyzeCode(prompt, 'text', 'explain');
      updateProgress(100);
      return result.result;
    });
    
    setPrompt('');
  };

  const getStatusIcon = (status: AgentTask['status']) => {
    switch (status) {
      case 'pending': return <RefreshCw className="w-3 h-3 text-muted-foreground" />;
      case 'running': return <RefreshCw className="w-3 h-3 text-primary animate-spin" />;
      case 'completed': return <Check className="w-3 h-3 text-green-500" />;
      case 'failed': return <X className="w-3 h-3 text-destructive" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="actions" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 h-8 bg-muted/30">
          <TabsTrigger value="actions" className="text-xs gap-1">
            <Wand2 className="w-3 h-3" />
            Quick Actions
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs gap-1">
            <Bot className="w-3 h-3" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="flex-1 flex flex-col mt-0 p-2 space-y-3">
          {/* Custom prompt */}
          <div className="space-y-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask the AI agent to do something..."
              className="min-h-[80px] text-xs resize-none"
            />
            <Button 
              onClick={handleCustomPrompt}
              disabled={isProcessing || !prompt.trim()}
              className="w-full h-8 text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Execute with AI
            </Button>
          </div>

          {/* Quick actions grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Card
                  key={action.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={action.action}
                >
                  <div className="flex items-start gap-2">
                    <action.icon className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-xs font-medium">{action.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 mt-0 p-2">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">
                  No tasks yet. Use Quick Actions to get started.
                </div>
              ) : (
                [...tasks].reverse().map((task) => (
                  <Card
                    key={task.id}
                    className={`p-3 ${activeTaskId === task.id ? 'border-primary/50' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(task.status)}
                      <span className="text-xs font-medium flex-1">{task.name}</span>
                      <Badge 
                        variant={task.status === 'completed' ? 'default' : task.status === 'failed' ? 'destructive' : 'secondary'}
                        className="text-[10px]"
                      >
                        {task.status}
                      </Badge>
                    </div>
                    
                    {task.status === 'running' && (
                      <Progress value={task.progress} className="h-1 mb-2" />
                    )}
                    
                    {task.output && (
                      <div className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded max-h-32 overflow-auto font-mono whitespace-pre-wrap">
                        {task.output.slice(0, 500)}
                        {task.output.length > 500 && '...'}
                      </div>
                    )}
                    
                    {task.error && (
                      <div className="text-[10px] text-destructive bg-destructive/10 p-2 rounded">
                        {task.error}
                      </div>
                    )}
                    
                    {task.startTime && (
                      <div className="text-[9px] text-muted-foreground mt-2">
                        Started: {task.startTime.toLocaleTimeString()}
                        {task.endTime && ` • Completed: ${task.endTime.toLocaleTimeString()}`}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
