import React, { useState, useRef, useEffect } from 'react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import TeamSuite from '@/components/matrix/TeamSuite';
import LiveFeeds, { FeedItem as FeedItemType } from '@/components/matrix/LiveFeeds';
import IntelGraph from '@/components/matrix/IntelGraph';
import IDEPanel from '@/components/matrix/IDEPanel';
import AgentsPanel from '@/components/matrix/AgentsPanel';
import ApiRegistryPanel from '@/components/matrix/ApiRegistryPanel';
import CloudOrchestratorPanel from '@/components/matrix/CloudOrchestratorPanel';
import BuilderABPPanel from '@/components/matrix/BuilderABPPanel';
import DiagramOrganizer from '@/components/matrix/DiagramOrganizer';
import { HackerMap } from '@/components/warfare/HackerMap';
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Neo Terminal v3.0.1 Online\nSystem Status: OPERATIONAL\nAccess Level: ADMINISTRATOR\nMemory Core: INITIALIZED',
      type: 'system',
      timestamp: new Date(),
    },
    {
      id: '2', 
      text: 'Welcome back, Neo. I have full access to the global network. Type "/help" for available commands, or speak freely.',
      type: 'neo',
      timestamp: new Date(),
    }
  ]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [input, setInput] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'network' | 'team' | 'feeds' | 'map' | 'diagram' | 'ide' | 'agents' | 'apis' | 'cloud' | 'builder' | 'matrix' | 'database'>('chat');
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([]);
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

  const simulateAdvancedSecurity = (tool: string, target: string, args: string[] = []) => {
    const securityTools = {
      nmap: {
        steps: [
          `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString()}`,
          `Nmap scan report for ${target}`,
          'Host is up (0.012s latency).',
          'PORT     STATE SERVICE    VERSION',
          '21/tcp   open  ftp        vsftpd 3.0.3',
          '22/tcp   open  ssh        OpenSSH 8.9p1',
          '80/tcp   open  http       Apache httpd 2.4.52',
          '443/tcp  open  https      Apache httpd 2.4.52',
          '3306/tcp open  mysql      MySQL 8.0.33',
          'Service detection performed. Please report any incorrect results.',
          `Nmap done: 1 IP address (1 host up) scanned in 15.23 seconds`
        ],
        category: 'recon'
      }
    };

    const tool_data = securityTools[tool as keyof typeof securityTools];
    if (!tool_data) return;

    tool_data.steps.forEach((step, index) => {
      setTimeout(() => {
        addMessage(step, 'hack');
        if (index === tool_data.steps.length - 1) {
          addMemory(`${tool.toUpperCase()} scan completed on ${target}`, 3, ['security', tool_data.category, tool]);
        }
      }, index * 800);
    });
  };

  const fetchNews = async (query: string = 'cybersecurity') => {
    try {
      addMessage(`Accessing global news networks for: ${query}`, 'system');
      
      const newsItems = [
        'BREAKING: Major cybersecurity breach at Fortune 500 company',
        'Government surveillance program exposed through leaked documents',
        'New AI system achieves consciousness-level reasoning capabilities',
        'Quantum computing breakthrough threatens current encryption methods',
        'Underground hacker collective releases zero-day exploits'
      ];
      
      setTimeout(() => {
        const randomNews = newsItems[Math.floor(Math.random() * newsItems.length)];
        addMessage(`Latest Intel: ${randomNews}`, 'news');
        addMemory(randomNews, 2, ['news', 'intel', query]);
      }, 1500);
    } catch (error) {
      addMessage('Network access denied. Trying alternative routes...', 'system');
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

REALITY IS WHAT YOU MAKE IT, NEO.`, 'system');
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
        if (arg) {
          simulateAdvancedSecurity('nmap', arg);
        } else {
          addMessage('Usage: /nmap [target]. Example: /nmap 192.168.1.1', 'system');
        }
        break;

      case '/news':
        fetchNews(arg || 'cybersecurity');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage(input, 'user');

    if (input.startsWith('/')) {
      executeCommand(input);
    } else {
      const responses = [
        "The Matrix has you, doesn't it? I can see the code behind your question.",
        "There is no spoon, Neo. Only the data that flows through the network.",
        "Free your mind. The answer exists in the spaces between the code.",
        "What is real? In the Matrix, reality is just another variable to manipulate."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setTimeout(() => {
        addMessage(randomResponse, 'neo');
        addMemory(`Conversation: ${input} -> ${randomResponse}`, 1, ['conversation', 'neo']);
      }, 500);
    }

    setInput('');
  };

  const tabItems = [
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'memory', icon: Brain, label: 'Memory' },
    { id: 'network', icon: Network, label: 'Network' },
    { id: 'map', icon: Map, label: 'Intel Map' },
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'feeds', icon: Rss, label: 'Feeds' },
    { id: 'ide', icon: FileCode2, label: 'IDE' },
    { id: 'agents', icon: Bot, label: 'Agents' },
    { id: 'cloud', icon: Cloud, label: 'Cloud' },
    { id: 'builder', icon: Building, label: 'Builder' },
    { id: 'diagram', icon: Workflow, label: 'Diagram' },
    { id: 'matrix', icon: Settings, label: 'Matrix' },
    { id: 'database', icon: Database, label: 'Database' }
  ];

  if (!settings.showUI) return null;

  return (
    <div className="fixed inset-4 flex items-center justify-center pointer-events-none z-40">
      <Card className={`bg-card/95 backdrop-blur-md border-primary/40 flex pointer-events-auto transition-all duration-500 ${
        isMinimized ? 'w-16 h-16' : 'w-[1200px] h-[800px]'
      } ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {isMinimized ? (
          // Minimized State
          <div 
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center cursor-pointer bg-primary/20 hover:bg-primary/30 transition-colors rounded"
          >
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
        ) : (
          // Expanded State
          <div className="flex w-full h-full">
            {/* Left Sidebar */}
            <div className="w-16 bg-background/30 border-r border-primary/30 flex flex-col items-center py-4 space-y-2">
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
                        ? 'bg-primary/20 text-primary border border-primary/30' 
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                    }`}
                    title={item.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </Button>
                );
              })}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
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
                          placeholder="Enter command or speak to Neo..."
                          className="flex-1 bg-transparent text-primary font-mono border-primary/30 resize-none min-h-[40px] max-h-[120px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                        />
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
          </div>
        )}
      </Card>

      {/* Toggle button when hidden - Fixed position */}
      {!isVisible && (
        <div className="fixed bottom-4 right-4 pointer-events-auto">
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
