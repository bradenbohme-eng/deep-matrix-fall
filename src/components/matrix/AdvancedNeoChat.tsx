import React, { useState, useRef, useEffect } from 'react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TeamSuite from '@/components/matrix/TeamSuite';
import LiveFeeds, { FeedItem as FeedItemType } from '@/components/matrix/LiveFeeds';
import IntelGraph from '@/components/matrix/IntelGraph';
import IDEPanel from '@/components/matrix/IDEPanel';
import { CodeEditor } from '@/components/matrix/CodeEditor';
import AgentsPanel from '@/components/matrix/AgentsPanel';
import ApiRegistryPanel from '@/components/matrix/ApiRegistryPanel';
import CloudOrchestratorPanel from '@/components/matrix/CloudOrchestratorPanel';
import BuilderABPPanel from '@/components/matrix/BuilderABPPanel';
import DiagramOrganizer from '@/components/matrix/DiagramOrganizer';
import MatrixSidebarRain from '@/components/matrix/MatrixSidebarRain';
import { HackerMap } from '@/components/warfare/HackerMap';
import { streamNeoChat, analyzeThreat, fetchIntelligence } from '@/lib/aiClient';
import { 
  MessageCircle, 
  Brain, 
  Network, 
  Users, 
  Rss, 
  Map, 
  FileCode2, 
  Bot, 
  Cloud, 
  Building, 
  Workflow,
  X,
  Minus,
  Settings,
  Database,
  Terminal
} from 'lucide-react';
import MatrixSettingsPanel from '@/components/matrix/MatrixSettingsPanel';

interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'system' | 'neo' | 'hack' | 'news' | 'memory';
  timestamp: Date;
  category?: string;
}

interface Memory {
  id: string;
  content: string;
  timestamp: Date;
  importance: number;
  tags: string[];
}

const AdvancedNeoChat: React.FC = () => {
  const { settings, updateSetting, loadPreset } = useMatrixSettings();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Neo Terminal v3.0.1 Online\nSystem Status: OPERATIONAL\nAccess Level: ADMINISTRATOR\nMemory Core: INITIALIZED\nGemini AI: INTEGRATED',
      type: 'system',
      timestamp: new Date(),
    },
    {
      id: '2', 
      text: 'Welcome back, Neo. I have full access to the global network and Gemini AI capabilities. Type "/help" for available commands, or speak freely.',
      type: 'neo',
      timestamp: new Date(),
    }
  ]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [input, setInput] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'network' | 'team' | 'feeds' | 'map' | 'diagram' | 'ide' | 'agents' | 'apis' | 'cloud' | 'builder' | 'matrix' | 'database' | 'code'>('chat');
  const [codeMode, setCodeMode] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, type: 'user' | 'system' | 'neo' | 'hack' | 'news' | 'memory', category?: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
      category,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addMemory = (content: string, importance: number = 1, tags: string[] = []) => {
    const newMemory: Memory = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      importance,
      tags,
    };
    setMemories(prev => [...prev, newMemory].slice(-100));
  };

  const performThreatAnalysis = async (target: string, scanType: string = "full") => {
    try {
      addMessage(`Initiating ${scanType} threat analysis on ${target}...`, 'system');
      addMessage('Deploying AI-powered reconnaissance...', 'hack');
      
      const result = await analyzeThreat(target, scanType);
      
      addMessage(result.analysis, 'hack');
      addMemory(`Threat analysis completed: ${target}`, 3, ['security', 'threat-analysis', scanType]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Analysis failed';
      addMessage(`Analysis error: ${errorMsg}`, 'system');
      toast({
        title: "Analysis Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const fetchAIIntelligence = async (query: string = 'cybersecurity') => {
    try {
      addMessage(`Accessing Gemini AI intelligence networks for: ${query}`, 'system');
      
      const result = await fetchIntelligence(query, 'cybersecurity', 5);
      
      if (result.briefings && result.briefings.length > 0) {
        result.briefings.forEach((briefing: any, index: number) => {
          setTimeout(() => {
            const briefingText = `[${briefing.threat_level}] ${briefing.title}\n\n${briefing.summary}\n\nSource: ${briefing.source}`;
            addMessage(briefingText, 'news');
            addMemory(briefing.title, briefing.threat_level === 'CRITICAL' ? 4 : 2, ['intel', 'ai-generated', query]);
          }, index * 1000);
        });
      } else {
        addMessage('No intelligence briefings available for this query.', 'system');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Intel fetch failed';
      addMessage(`Intelligence gathering failed: ${errorMsg}`, 'system');
      toast({
        title: "Intel Fetch Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleCodeExecution = (code: string, language: string) => {
    addMessage(`Executing ${language} code...`, 'system');
    try {
      addMessage(`Code executed successfully!\n\nLanguage: ${language}\nLines: ${code.split('\n').length}\n\nOutput:\n> Execution completed without errors`, 'neo');
    } catch (error) {
      addMessage(`Error executing code: ${error}`, 'system');
    }
  };

  const executeCommand = (command: string) => {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    const arg = args.join(' ');

    switch (cmd) {
      case '/help':
        addMessage(`NEO TERMINAL COMMAND SUITE v3.0:

SYSTEM CONTROL:
/speed [0.1-5.0] - Adjust matrix speed
/rain [light|normal|heavy] - Set rain intensity  
/glow [0.0-2.0] - Control glow effects
/preset [classic|intense|zen|chaos] - Load preset
/pause - Pause/unpause animation
/3d - Toggle 3D mode

HACKING TOOLS:
/nmap [target] - Advanced port scanner
/hack [target] - Multi-vector attack platform
/trace - Advanced anonymization routing
/encrypt [msg] - Military-grade encryption
/satellite - Military satellite network
/darkweb - Hidden services access

INTELLIGENCE:
/news [query] - Global intelligence feeds
/memory [search|clear] - Quantum memory core
/map - Open intel map interface
/network - Network analysis console

CODE OPERATIONS:
/code - Enter code editor mode
/blueprint [name] - Generate project blueprint
/file [path] - Create/edit file

REALITY IS WHAT YOU MAKE IT, NEO.`, 'system');
        break;

      case '/code':
        setCodeMode(true);
        setActiveTab('code');
        addMessage('Code mode activated. Full development environment loaded. Use /blueprint to generate project structure.', 'system');
        break;

      case '/blueprint':
        if (args.length === 0) {
          addMessage('Usage: /blueprint [project-name]\nExample: /blueprint my-dashboard', 'system');
          break;
        }
        addMessage(`Generating blueprint for "${args.join(' ')}"...`, 'system');
        setTimeout(() => {
          addMessage(
            `Blueprint Generated: ${args.join(' ')}\n\n` +
            '📁 src/\n' +
            '  ├─ components/\n' +
            '  │  ├─ ui/\n' +
            '  │  └─ layout/\n' +
            '  ├─ pages/\n' +
            '  ├─ hooks/\n' +
            '  ├─ lib/\n' +
            '  └─ types/\n\n' +
            'Files created:\n' +
            '✓ src/App.tsx\n' +
            '✓ src/main.tsx\n' +
            '✓ src/index.css\n' +
            '✓ package.json\n\n' +
            'Switch to Code tab to start editing.',
            'neo'
          );
        }, 1500);
        break;

      case '/file':
        if (args.length === 0) {
          addMessage('Usage: /file [filepath]\nExample: /file src/components/Button.tsx', 'system');
          break;
        }
        setCodeMode(true);
        setActiveTab('code');
        addMessage(`Opening file: ${args.join(' ')}\n\nSwitching to code editor...`, 'system');
        break;
        
      case '/speed':
        const speed = parseFloat(arg);
        if (speed >= 0.1 && speed <= 5.0) {
          updateSetting('globalSpeed', speed);
          addMessage(`Matrix speed set to ${speed}x`, 'neo');
        } else {
          addMessage('Speed must be between 0.1 and 5.0', 'system');
        }
        break;

      case '/nmap':
      case '/scan':
      case '/analyze':
        if (arg) {
          performThreatAnalysis(arg, cmd === '/nmap' ? 'nmap' : 'full');
        } else {
          addMessage('Usage: /scan [target]. Example: /scan 192.168.1.1', 'system');
        }
        break;

      case '/news':
      case '/intel':
        fetchAIIntelligence(arg || 'cybersecurity threats');
        break;

      case '/map':
        setActiveTab('map');
        addMessage('INTEL MAP interface activated.', 'system');
        break;

      case '/memory':
        if (arg === 'clear') {
          setMemories([]);
          addMessage('Memory core wiped clean.', 'system');
        } else {
          setActiveTab('memory');
        }
        break;

      case '/network':
        setActiveTab('network');
        addMessage('Network analysis mode activated.', 'system');
        break;

      default:
        addMessage(`Unknown command: ${cmd}. Type "/help" for available commands.`, 'system');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input;
    addMessage(userInput, 'user');
    setInput('');

    if (userInput.startsWith('/')) {
      executeCommand(userInput);
      return;
    }

    // Real AI conversation with Gemini
    setIsLoading(true);
    const newHistory = [...conversationHistory, { role: "user" as const, content: userInput }];
    
    let assistantResponse = "";
    const tempId = Date.now().toString();
    
    try {
      await streamNeoChat({
        messages: newHistory,
        mode: "chat",
        onDelta: (chunk) => {
          assistantResponse += chunk;
          
          // Update or create the assistant message
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.id === tempId) {
              return prev.map(msg => 
                msg.id === tempId 
                  ? { ...msg, text: assistantResponse }
                  : msg
              );
            }
            return [...prev, {
              id: tempId,
              text: assistantResponse,
              type: 'neo' as const,
              timestamp: new Date(),
            }];
          });
        },
        onDone: () => {
          setIsLoading(false);
          setConversationHistory([...newHistory, { role: "assistant", content: assistantResponse }]);
          addMemory(`AI Conversation: ${userInput}`, 1, ['conversation', 'gemini-ai', 'neo']);
        },
        onError: (error) => {
          setIsLoading(false);
          addMessage(`AI Error: ${error.message}`, 'system');
          toast({
            title: "AI Communication Error",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      setIsLoading(false);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addMessage(`Connection to Neo failed: ${errorMsg}`, 'system');
      toast({
        title: "Connection Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const tabItems = [
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'memory', icon: Brain, label: 'Memory' },
    { id: 'network', icon: Network, label: 'Network' },
    { id: 'map', icon: Map, label: 'Intel Map' },
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'feeds', icon: Rss, label: 'Feeds' },
    { id: 'code', icon: Terminal, label: 'Code' },
    { id: 'ide', icon: FileCode2, label: 'IDE' },
    { id: 'agents', icon: Bot, label: 'Agents' },
    { id: 'cloud', icon: Cloud, label: 'Cloud' },
    { id: 'builder', icon: Building, label: 'Builder' },
    { id: 'diagram', icon: Workflow, label: 'Diagram' },
    { id: 'matrix', icon: Settings, label: 'Matrix' },
    { id: 'database', icon: Database, label: 'Database' }
  ];

  return (
    <div className={`flex w-full h-screen transition-all duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {isMinimized ? (
        // Minimized State
        <div 
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-4 right-4 w-16 h-16 flex items-center justify-center cursor-pointer bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-full transition-colors z-50"
        >
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
      ) : (
        // Expanded State - Full Screen
        <>
          {/* Left Sidebar with Matrix Rain */}
          <div className="relative w-16 bg-black/90 border-r border-primary/30 flex flex-col items-center py-4 space-y-2 overflow-hidden">
            {/* Matrix Rain Background */}
            <MatrixSidebarRain />
            {/* Tab Buttons - Render on top of matrix rain */}
            <div className="relative z-10 flex flex-col items-center space-y-2 w-full">
              {tabItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    variant="ghost"
                    size="sm"
                    className={`w-12 h-12 p-0 ${
                      activeTab === item.id 
                        ? 'bg-primary/30 text-primary border border-primary/50 shadow-lg shadow-primary/20' 
                        : 'text-primary/60 hover:text-primary hover:bg-primary/20 border border-transparent'
                    }`}
                    title={item.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-background/95 backdrop-blur-md">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-primary/30">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-primary font-mono text-lg font-bold">NEO TERMINAL v3.0</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setIsMinimized(true)}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setIsVisible(false)}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'chat' && (
                  <div className="h-full flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-lg border ${
                            message.type === 'user' 
                              ? 'bg-primary/15 text-primary border-primary/30' 
                              : message.type === 'neo'
                              ? 'bg-accent/15 text-accent-foreground border-accent/30'
                              : message.type === 'hack'
                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : message.type === 'news'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : message.type === 'memory'
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                              : 'bg-muted/15 text-muted-foreground border-muted/30'
                          }`}>
                            <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
                            <div className="text-xs opacity-60 mt-2 flex items-center justify-between">
                              <span>{message.timestamp.toLocaleTimeString()}</span>
                              {message.type !== 'user' && (
                                <span className="text-xs px-2 py-0.5 rounded bg-current/10 uppercase">
                                  {message.type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-primary/30">
                      <div className="flex items-end space-x-3">
                        <span className="text-primary font-mono text-lg mb-2">{">"}</span>
                        <Textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={isLoading ? "Neo is thinking..." : "Enter command or speak to Neo (Gemini AI enabled)..."}
                          disabled={isLoading}
                          className="flex-1 bg-transparent text-primary font-mono border-primary/30 resize-none min-h-[40px] max-h-[120px] disabled:opacity-50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                        />
                        {isLoading && (
                          <div className="mb-2">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'memory' && (
                  <div className="h-full p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-primary font-mono text-lg">QUANTUM MEMORY CORE</h3>
                      <div className="flex space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => setMemories([])}>
                          Clear All
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const backup = JSON.stringify(memories);
                          navigator.clipboard.writeText(backup);
                          addMessage('Memory backup copied to clipboard', 'system');
                        }}>
                          Export
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-3 bg-primary/10 border border-primary/30 rounded">
                        <div className="text-primary text-sm">TOTAL MEMORIES</div>
                        <div className="text-primary text-lg font-bold">{memories.length}</div>
                      </div>
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                        <div className="text-green-400 text-sm">HIGH PRIORITY</div>
                        <div className="text-green-300 text-lg font-bold">{memories.filter(m => m.importance >= 3).length}</div>
                      </div>
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                        <div className="text-blue-400 text-sm">RECENT (24H)</div>
                        <div className="text-blue-300 text-lg font-bold">{memories.filter(m => 
                          Date.now() - m.timestamp.getTime() < 24 * 60 * 60 * 1000).length}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {memories.length === 0 ? (
                        <div className="text-center text-muted-foreground font-mono p-8">
                          No memories stored. Start interacting to build memory core.
                        </div>
                      ) : (
                        memories.map((memory) => (
                          <div key={memory.id} className={`p-3 border rounded transition-colors hover:bg-muted/5 ${
                            memory.importance >= 3 ? 'border-red-500/30 bg-red-500/5' :
                            memory.importance >= 2 ? 'border-yellow-500/30 bg-yellow-500/5' :
                            'border-muted/20 bg-muted/5'
                          }`}>
                            <div className="text-sm text-foreground mb-2 leading-relaxed">{memory.content}</div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="font-mono">{memory.timestamp.toLocaleString()}</span>
                              <div className="flex items-center space-x-2">
                                <span className={`font-mono ${
                                  memory.importance >= 3 ? 'text-red-400' :
                                  memory.importance >= 2 ? 'text-yellow-400' :
                                  'text-green-400'
                                }`}>
                                  Priority: {memory.importance}
                                </span>
                                <div className="flex space-x-1">
                                  {memory.tags.map((tag) => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-xs font-mono">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'network' && (
                  <div className="h-full p-4 overflow-y-auto font-mono">
                    <h3 className="text-primary text-lg mb-4">NETWORK OPERATIONS</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                          <div className="text-green-400 text-sm">CONNECTION STATUS</div>
                          <div className="text-green-300 text-lg">SECURE</div>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                          <div className="text-blue-400 text-sm">ENCRYPTION LEVEL</div>
                          <div className="text-blue-300 text-lg">AES-256</div>
                        </div>
                        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                          <div className="text-purple-400 text-sm">PROXY CHAINS</div>
                          <div className="text-purple-300 text-lg">7 ACTIVE</div>
                        </div>
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                          <div className="text-yellow-400 text-sm">TRACE DETECTION</div>
                          <div className="text-yellow-300 text-lg">BLOCKED</div>
                        </div>
                      </div>
                      
                      <div className="border border-primary/20 rounded p-4">
                        <h4 className="text-primary mb-3">Active Connections</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center p-2 bg-green-500/5 border border-green-500/20 rounded">
                            <span className="text-green-400">TOR Exit Node: 192.168.1.1</span>
                            <span className="text-green-300">ESTABLISHED</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-blue-500/5 border border-blue-500/20 rounded">
                            <span className="text-blue-400">VPN Gateway: 10.0.0.1</span>
                            <span className="text-blue-300">CONNECTED</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-purple-500/5 border border-purple-500/20 rounded">
                            <span className="text-purple-400">Proxy Chain: 172.16.0.1</span>
                            <span className="text-purple-300">ACTIVE</span>
                          </div>
                        </div>
                      </div>

                      <div className="border border-primary/20 rounded p-4">
                        <h4 className="text-primary mb-3">Traffic Analysis</h4>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div className="text-center">
                            <div className="text-green-400 text-lg">24.7 MB</div>
                            <div className="text-muted-foreground">Encrypted TX</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-400 text-lg">18.3 MB</div>
                            <div className="text-muted-foreground">Encrypted RX</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 text-lg">0</div>
                            <div className="text-muted-foreground">Blocked</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'map' && (
                  <div className="h-full">
                    <HackerMap />
                  </div>
                )}

                {activeTab === 'team' && (
                  <div className="h-full">
                    <TeamSuite onRun={(command) => {
                      addMessage(command, 'user');
                      setActiveTab('chat');
                      executeCommand(command);
                    }} />
                  </div>
                )}

                {activeTab === 'feeds' && (
                  <div className="h-full">
                    <LiveFeeds onData={(items) => setFeedItems(items)} />
                  </div>
                )}

                {activeTab === 'diagram' && (
                  <div className="h-full p-4">
                    <DiagramOrganizer />
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="h-full p-4">
                    <CodeEditor onCodeExecution={handleCodeExecution} />
                  </div>
                )}

                {activeTab === 'ide' && (
                  <div className="h-full">
                    <IDEPanel />
                  </div>
                )}

                {activeTab === 'agents' && (
                  <div className="h-full p-4">
                    <AgentsPanel />
                  </div>
                )}

                {activeTab === 'apis' && (
                  <div className="h-full p-4">
                    <ApiRegistryPanel />
                  </div>
                )}

                {activeTab === 'cloud' && (
                  <div className="h-full p-4">
                    <CloudOrchestratorPanel />
                  </div>
                )}

                {activeTab === 'builder' && (
                  <div className="h-full p-4 overflow-y-auto">
                    <BuilderABPPanel />
                  </div>
                )}

                {activeTab === 'matrix' && (
                  <div className="h-full p-4 overflow-y-auto">
                    <MatrixSettingsPanel />
                  </div>
                )}

                {activeTab === 'database' && (
                  <div className="h-full p-4 overflow-y-auto font-mono">
                    <h3 className="text-primary text-lg mb-4">DATABASE STATUS</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                          <div className="text-green-400 text-sm">CONNECTION</div>
                          <div className="text-green-300 text-lg">ACTIVE</div>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                          <div className="text-blue-400 text-sm">TABLES</div>
                          <div className="text-blue-300 text-lg">47 ACTIVE</div>
                        </div>
                        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                          <div className="text-purple-400 text-sm">QUERIES/SEC</div>
                          <div className="text-purple-300 text-lg">1,247</div>
                        </div>
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                          <div className="text-yellow-400 text-sm">STORAGE</div>
                          <div className="text-yellow-300 text-lg">2.3 TB</div>
                        </div>
                      </div>
                      <div className="border border-primary/20 rounded p-4">
                        <h4 className="text-primary mb-2">Recent Queries</h4>
                        <div className="space-y-1 text-xs">
                          <div className="text-green-400">SELECT * FROM classified_ops WHERE status='active'</div>
                          <div className="text-blue-400">UPDATE agent_locations SET last_seen=NOW()</div>
                          <div className="text-purple-400">INSERT INTO intel_reports VALUES (...)</div>
                          <div className="text-yellow-400">DELETE FROM temp_logs WHERE created &lt; NOW()-7</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Toggle button when hidden - Fixed position */}
        {!isVisible && (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setIsVisible(true)}
              className="w-16 h-16 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-full flex items-center justify-center transition-all duration-300 group"
            >
              <div className="text-center">
                <Terminal className="w-6 h-6 text-primary mb-1" />
                <div className="text-primary/60 font-mono text-xs">NEO</div>
              </div>
            </button>
          </div>
        )}
      </div>
  );
};

export default AdvancedNeoChat;
