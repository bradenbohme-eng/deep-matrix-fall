import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bot, Send, Sparkles, Wand2, ArrowUp, ArrowDown, RefreshCw,
  FileText, BookOpen, Loader2, Copy, Check, Maximize, AlignLeft,
  Languages, Search, Edit3, MessageSquare
} from 'lucide-react';
import { 
  aiWritingAction, aiGenerateDocument, aiDocumentAnalysis, 
  aiChatAssistant, AIAction 
} from '@/lib/ideAIService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  timestamp: Date;
}

interface AIWritingPanelProps {
  documentContent?: string;
  selectedText?: string;
  onInsertText?: (text: string) => void;
  onReplaceSelection?: (text: string) => void;
}

const writingActions: Array<{ id: AIAction; label: string; icon: React.ElementType; description: string }> = [
  { id: 'expand', label: 'Expand', icon: Maximize, description: 'Add more detail and depth' },
  { id: 'summarize', label: 'Summarize', icon: ArrowDown, description: 'Create a concise summary' },
  { id: 'improve', label: 'Improve', icon: Sparkles, description: 'Enhance clarity and flow' },
  { id: 'simplify', label: 'Simplify', icon: AlignLeft, description: 'Make easier to read' },
  { id: 'proofread', label: 'Proofread', icon: Check, description: 'Fix grammar and spelling' },
  { id: 'complete', label: 'Continue', icon: ArrowUp, description: 'Continue writing' },
];

const analysisOptions = [
  { id: 'structure', label: 'Structure Analysis' },
  { id: 'readability', label: 'Readability Check' },
  { id: 'seo', label: 'SEO Analysis' },
  { id: 'tone', label: 'Tone Analysis' },
] as const;

const documentTypes = [
  'Technical Specification',
  'Blog Post',
  'Research Paper',
  'Meeting Notes',
  'Project Proposal',
  'User Guide',
  'API Documentation',
  'README',
];

export const AIWritingPanel: React.FC<AIWritingPanelProps> = ({
  documentContent,
  selectedText,
  onInsertText,
  onReplaceSelection,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [documentType, setDocumentType] = useState('Blog Post');
  const [documentTopic, setDocumentTopic] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const getTextToProcess = () => selectedText || documentContent || '';

  const handleWritingAction = async (action: AIAction, context?: string) => {
    const text = getTextToProcess();
    if (!text) {
      toast.error('No text to process. Select text or have document content.');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[${action.toUpperCase()}] ${selectedText ? 'Processing selected text...' : 'Processing document...'}`,
      action,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      let fullContent = '';
      await aiWritingAction(
        action,
        text,
        context,
        (delta) => {
          fullContent += delta;
          setStreamingContent(fullContent);
        }
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent || 'Processing complete.',
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

  const handleTranslate = async () => {
    await handleWritingAction('translate', targetLanguage);
  };

  const handleAnalysis = async (type: 'structure' | 'readability' | 'seo' | 'tone') => {
    const text = getTextToProcess();
    if (!text) {
      toast.error('No text to analyze');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[${type.toUpperCase()} ANALYSIS] Analyzing document...`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      let fullContent = '';
      await aiDocumentAnalysis(
        text,
        type,
        (delta) => {
          fullContent += delta;
          setStreamingContent(fullContent);
        }
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent || 'Analysis complete.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleGenerateDocument = async () => {
    if (!documentTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[GENERATE] Creating ${documentType}: "${documentTopic}"`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      let fullContent = '';
      await aiGenerateDocument(
        documentType,
        documentTopic,
        undefined,
        (delta) => {
          fullContent += delta;
          setStreamingContent(fullContent);
        }
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent || 'Document generated.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setDocumentTopic('');
    } catch (error) {
      toast.error('Document generation failed');
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
      let fullContent = '';
      await aiChatAssistant(
        [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        { documentContent, selectedText },
        (delta) => {
          fullContent += delta;
          setStreamingContent(fullContent);
        }
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent || 'I apologize, but I could not generate a response.',
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

  const copyText = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const insertText = (content: string) => {
    if (selectedText && onReplaceSelection) {
      onReplaceSelection(content);
      toast.success('Text replaced');
    } else if (onInsertText) {
      onInsertText(content);
      toast.success('Text inserted');
    }
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
          {msg.role === 'user' ? 'You' : 'AI Writer'}
        </span>
        {msg.action && (
          <Badge variant="outline" className="text-[10px] py-0">
            {msg.action}
          </Badge>
        )}
      </div>
      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
      {msg.role === 'assistant' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => copyText(msg.content)}>
            <Copy className="w-3 h-3 mr-1" /> Copy
          </Button>
          {(onInsertText || onReplaceSelection) && (
            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => insertText(msg.content)}>
              <Edit3 className="w-3 h-3 mr-1" /> {selectedText ? 'Replace' : 'Insert'}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-mono text-sm font-bold text-primary">AI Writing Assistant</span>
        {selectedText && (
          <Badge variant="secondary" className="text-[10px]">
            Selection Active
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-8">
          <TabsTrigger value="chat" className="flex-1 text-xs gap-1">
            <MessageSquare className="w-3 h-3" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex-1 text-xs gap-1">
            <Wand2 className="w-3 h-3" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex-1 text-xs gap-1">
            <FileText className="w-3 h-3" />
            Generate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1 p-2" ref={scrollRef}>
            {messages.length === 0 && !streamingContent && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask me to help with your writing!</p>
                <p className="text-xs mt-1">I can improve, expand, summarize, or analyze your text.</p>
              </div>
            )}
            {messages.map(renderMessage)}
            {streamingContent && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">AI Writer</span>
                </div>
                <div className="text-sm whitespace-pre-wrap">{streamingContent}</div>
              </div>
            )}
          </ScrollArea>

          <div className="p-2 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your document, request changes, or describe what you need..."
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
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">WRITING ACTIONS</h4>
              <div className="grid grid-cols-2 gap-2">
                {writingActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleWritingAction(action.id)}
                    disabled={isLoading || !getTextToProcess()}
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
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">TRANSLATE</h4>
              <div className="flex gap-2">
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese', 'Korean'].map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleTranslate} disabled={isLoading || !getTextToProcess()}>
                  <Languages className="w-3 h-3 mr-1" /> Translate
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">DOCUMENT ANALYSIS</h4>
              <div className="flex flex-col gap-2">
                {analysisOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnalysis(option.id)}
                    disabled={isLoading || !getTextToProcess()}
                    className="justify-start"
                  >
                    <Search className="w-3 h-3 mr-2 text-primary" />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="generate" className="flex-1 m-0 overflow-auto p-2">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">DOCUMENT TYPE</label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">TOPIC / TITLE</label>
              <input
                value={documentTopic}
                onChange={(e) => setDocumentTopic(e.target.value)}
                placeholder="e.g., Introduction to Machine Learning"
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">ADDITIONAL CONTEXT (Optional)</label>
              <Textarea
                placeholder="Add any specific requirements, audience details, or style preferences..."
                className="mt-1 min-h-[80px] text-sm resize-none"
              />
            </div>
            <Button
              onClick={handleGenerateDocument}
              disabled={isLoading || !documentTopic.trim()}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <BookOpen className="w-4 h-4 mr-2" />
              )}
              Generate Document
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIWritingPanel;
