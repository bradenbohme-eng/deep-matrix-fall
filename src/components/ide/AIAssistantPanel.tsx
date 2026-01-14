import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot, Send, Sparkles, Code, Zap, Bug, FileCode, RefreshCw,
  Wand2, CheckCircle, Loader2, Copy, Plus, Shield, TestTube
} from 'lucide-react';
import { aiCodeAction, aiProjectAnalysis, aiGenerateComponent, AIAction, extractCodeFromResponse } from '@/lib/ideAIService';
import { FileNode } from './types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: AIAction;
  timestamp: Date;
}

interface AIAssistantPanelProps {
  files: FileNode[];
  activeFileContent?: string;
  activeFileLanguage?: string;
  activeFilePath?: string;
  onInsertCode?: (code: string) => void;
  onCreateFile?: (path: string, content: string) => void;
}

const quickActions: Array<{ id: AIAction; label: string; icon: React.ElementType; description: string }> = [
  { id: 'explain', label: 'Explain', icon: Sparkles, description: 'Explain the code' },
  { id: 'optimize', label: 'Optimize', icon: Zap, description: 'Optimize for performance' },
  { id: 'refactor', label: 'Refactor', icon: RefreshCw, description: 'Improve code structure' },
  { id: 'debug', label: 'Debug', icon: Bug, description: 'Find and fix bugs' },
  { id: 'test', label: 'Tests', icon: TestTube, description: 'Generate unit tests' },
  { id: 'complete', label: 'Complete', icon: Wand2, description: 'Complete the code' },
];

const analysisTypes = [
  { id: 'overview', label: 'Overview', icon: FileCode },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'architecture', label: 'Architecture', icon: Code },
] as const;

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  files,
  activeFileContent,
  activeFileLanguage = 'typescript',
  activeFilePath,
  onInsertCode,
  onCreateFile,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [componentName, setComponentName] = useState('');
  const [componentDesc, setComponentDesc] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const getAllFiles = (nodes: FileNode[]): Array<{ path: string; content: string }> => {
    const result: Array<{ path: string; content: string }> = [];
    const traverse = (items: FileNode[]) => {
      for (const item of items) {
        if (item.type === 'file' && item.content) {
          result.push({ path: item.path, content: item.content });
        }
        if (item.children) traverse(item.children);
      }
    };
    traverse(nodes);
    return result;
  };

  const handleQuickAction = async (action: AIAction) => {
    if (!activeFileContent) {
      toast.error('No active file to analyze');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[${action.toUpperCase()}] Analyzing current file...`,
      action,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      await aiCodeAction(
        action,
        activeFileContent,
        activeFileLanguage,
        undefined,
        (delta) => setStreamingContent(prev => prev + delta)
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: streamingContent || 'Analysis complete.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      toast.error('AI action failed');
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const context = activeFileContent ? `Current file (${activeFilePath}):\n\`\`\`${activeFileLanguage}\n${activeFileContent.slice(0, 2000)}\n\`\`\`\n\n` : '';
      
      await aiCodeAction(
        'generate',
        context + input,
        activeFileLanguage,
        input,
        (delta) => setStreamingContent(prev => prev + delta)
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: streamingContent || 'I apologize, but I could not generate a response.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleProjectAnalysis = async (type: 'overview' | 'security' | 'architecture') => {
    const allFiles = getAllFiles(files);
    if (allFiles.length === 0) {
      toast.error('No files to analyze');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[PROJECT ${type.toUpperCase()}] Analyzing ${allFiles.length} files...`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      await aiProjectAnalysis(
        allFiles,
        type,
        (delta) => setStreamingContent(prev => prev + delta)
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: streamingContent || 'Analysis complete.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      toast.error('Project analysis failed');
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleGenerateComponent = async () => {
    if (!componentName.trim() || !componentDesc.trim()) {
      toast.error('Please provide component name and description');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[GENERATE] Creating component: ${componentName}\n${componentDesc}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const result = await aiGenerateComponent(
        componentName,
        componentDesc,
        'react',
        (delta) => setStreamingContent(prev => prev + delta)
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content || streamingContent || 'Component generated.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setComponentName('');
      setComponentDesc('');
    } catch (error) {
      toast.error('Component generation failed');
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const copyCode = (content: string) => {
    const code = extractCodeFromResponse(content);
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const insertCode = (content: string) => {
    const code = extractCodeFromResponse(content);
    onInsertCode?.(code);
    toast.success('Code inserted');
  };

  const renderMessage = (msg: Message) => (
    <div
      key={msg.id}
      className={cn(
        "p-3 rounded-lg mb-2",
        msg.role === 'user' 
          ? "bg-primary/10 border border-primary/20 ml-8" 
          : "bg-muted/50 border border-border mr-4"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {msg.role === 'assistant' && <Bot className="w-4 h-4 text-primary" />}
        <span className="text-xs text-muted-foreground">
          {msg.role === 'user' ? 'You' : 'AI Assistant'}
        </span>
        {msg.action && (
          <Badge variant="outline" className="text-[10px] py-0">
            {msg.action}
          </Badge>
        )}
      </div>
      <div className="text-sm whitespace-pre-wrap font-mono">{msg.content}</div>
      {msg.role === 'assistant' && msg.content.includes('```') && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => copyCode(msg.content)}>
            <Copy className="w-3 h-3 mr-1" /> Copy Code
          </Button>
          {onInsertCode && (
            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => insertCode(msg.content)}>
              <Plus className="w-3 h-3 mr-1" /> Insert
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <Bot className="w-5 h-5 text-primary" />
        <span className="font-mono text-sm font-bold text-primary">AI Code Assistant</span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-8">
          <TabsTrigger value="chat" className="flex-1 text-xs">Chat</TabsTrigger>
          <TabsTrigger value="actions" className="flex-1 text-xs">Quick Actions</TabsTrigger>
          <TabsTrigger value="generate" className="flex-1 text-xs">Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1 p-2" ref={scrollRef}>
            {messages.length === 0 && !streamingContent && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask me anything about your code!</p>
              </div>
            )}
            {messages.map(renderMessage)}
            {streamingContent && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">AI Assistant</span>
                </div>
                <div className="text-sm whitespace-pre-wrap font-mono">{streamingContent}</div>
              </div>
            )}
          </ScrollArea>

          <div className="p-2 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about code, request changes, or describe what you need..."
                className="min-h-[60px] text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button onClick={handleSend} disabled={isLoading} className="h-auto">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="flex-1 m-0 overflow-auto p-2">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">FILE ACTIONS</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.id)}
                    disabled={isLoading || !activeFileContent}
                    className="h-auto py-2 flex-col items-start"
                  >
                    <div className="flex items-center gap-1 w-full">
                      <action.icon className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium">{action.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{action.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">PROJECT ANALYSIS</h4>
              <div className="flex flex-col gap-2">
                {analysisTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleProjectAnalysis(type.id)}
                    disabled={isLoading}
                    className="justify-start"
                  >
                    <type.icon className="w-3 h-3 mr-2 text-primary" />
                    <span className="text-xs">{type.label} Analysis</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="generate" className="flex-1 m-0 overflow-auto p-2">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">COMPONENT NAME</label>
              <input
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                placeholder="e.g., UserProfileCard"
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">DESCRIPTION</label>
              <Textarea
                value={componentDesc}
                onChange={(e) => setComponentDesc(e.target.value)}
                placeholder="Describe the component's functionality, props, and behavior..."
                className="mt-1 min-h-[80px] text-sm resize-none"
              />
            </div>
            <Button
              onClick={handleGenerateComponent}
              disabled={isLoading || !componentName.trim() || !componentDesc.trim()}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Generate Component
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAssistantPanel;
