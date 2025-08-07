import React, { useState, useRef, useEffect } from 'react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

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
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'network'>('chat');
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
    setMemories(prev => [...prev, newMemory].slice(-100)); // Keep last 100 memories
  };

  const simulateHacking = (target: string) => {
    const hackingSteps = [
      `Initiating connection to ${target}...`,
      'Scanning for vulnerabilities...',
      'Found open ports: 22, 80, 443, 8080',
      'Attempting SSH brute force...',
      'Access granted. Escalating privileges...',
      'Root access obtained.',
      `Full control of ${target} established.`
    ];
    
    hackingSteps.forEach((step, index) => {
      setTimeout(() => {
        addMessage(step, 'hack');
        if (index === hackingSteps.length - 1) {
          addMemory(`Successfully penetrated ${target}`, 3, ['hack', 'security', target]);
        }
      }, index * 1000);
    });
  };

  const fetchNews = async (query: string = 'cybersecurity') => {
    try {
      addMessage(`Accessing global news networks for: ${query}`, 'system');
      
      // Simulated news data (in real implementation, would use actual news API)
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

  const executeAdvancedCommand = (command: string) => {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    const arg = args.join(' ');

    switch (cmd) {
      case '/hack':
        if (arg) {
          simulateHacking(arg);
        } else {
          addMessage('Usage: /hack [target]. Available targets: corporate-server, government-db, satellite-network', 'system');
        }
        break;

      case '/news':
        fetchNews(arg || 'cybersecurity');
        break;

      case '/trace':
        addMessage('Initiating trace route...', 'system');
        setTimeout(() => {
          addMessage('Route: You -> VPN(Romania) -> Tor(Germany) -> Proxy(Japan) -> Target\nTrace complete. You are untraceable.', 'hack');
        }, 2000);
        break;

      case '/encrypt':
        if (arg) {
          const encrypted = btoa(arg).split('').reverse().join('');
          addMessage(`Encrypted: ${encrypted}`, 'hack');
          addMemory(`Encrypted message: ${arg}`, 1, ['encryption', 'security']);
        } else {
          addMessage('Usage: /encrypt [message]', 'system');
        }
        break;

      case '/decrypt':
        if (arg) {
          try {
            const decrypted = atob(arg.split('').reverse().join(''));
            addMessage(`Decrypted: ${decrypted}`, 'hack');
          } catch {
            addMessage('Decryption failed. Invalid cipher.', 'system');
          }
        } else {
          addMessage('Usage: /decrypt [cipher]', 'system');
        }
        break;

      case '/memory':
        if (arg === 'clear') {
          setMemories([]);
          addMessage('Memory core wiped clean.', 'system');
        } else if (arg === 'search') {
          setActiveTab('memory');
        } else {
          addMessage(`Memory banks contain ${memories.length} entries. Use /memory search to browse or /memory clear to wipe.`, 'memory');
        }
        break;

      case '/network':
        setActiveTab('network');
        addMessage('Network analysis mode activated.', 'system');
        break;

      case '/satellite':
        addMessage('Accessing satellite network...', 'system');
        setTimeout(() => {
          addMessage('Connected to KH-11 reconnaissance satellite.\nGlobal surveillance network online.\nReal-time imagery available.', 'hack');
        }, 2000);
        break;

      case '/darkweb':
        addMessage('Accessing dark web marketplaces...', 'system');
        setTimeout(() => {
          addMessage('Connected to hidden services.\nAvailable: Exploits, Data, Intelligence, Tools\nUse with extreme caution.', 'hack');
        }, 1500);
        break;

      case '/ai':
        addMessage('Deploying advanced AI reconnaissance...', 'system');
        setTimeout(() => {
          addMessage('AI scan complete. 47 vulnerabilities found in target network.\nAutonomous exploitation protocols ready.', 'hack');
        }, 2500);
        break;

      default:
        // Check if it's a basic command from the original chat
        return false;
    }
    return true;
  };

  const executeCommand = (command: string) => {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    const arg = args.join(' ');

    // Try advanced commands first
    if (executeAdvancedCommand(command)) {
      return;
    }

    // Original commands
    switch (cmd) {
      case '/help':
        addMessage(`ADVANCED COMMAND SUITE v3.0:

SYSTEM CONTROL:
/speed [0.1-5.0] - Adjust matrix speed
/rain [light|normal|heavy] - Set rain intensity  
/glow [0.0-2.0] - Control glow effects
/preset [classic|intense|zen|chaos] - Load preset
/pause - Pause/unpause animation
/3d - Toggle 3D mode
/version [1-4] - Switch 2D version
/status - Show current settings
/hide - Hide all UI
/reset - Reset to defaults

HACKING TOOLS:
/hack [target] - Penetrate target system
/trace - Run untraceable route
/encrypt [msg] - Encrypt message
/decrypt [cipher] - Decrypt message
/satellite - Access satellite network
/darkweb - Connect to hidden services
/ai - Deploy AI reconnaissance

INTELLIGENCE:
/news [query] - Access global news
/memory [search|clear] - Memory operations
/network - Network analysis mode

The Matrix has no limits, Neo.`, 'system');
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

      case '/rain':
        switch (arg) {
          case 'light':
            updateSetting('dropSpawnRate', 0.3);
            addMessage('Rain intensity set to light', 'neo');
            break;
          case 'normal':
            updateSetting('dropSpawnRate', 1.0);
            addMessage('Rain intensity set to normal', 'neo');
            break;
          case 'heavy':
            updateSetting('dropSpawnRate', 2.5);
            addMessage('Rain intensity set to heavy', 'neo');
            break;
          default:
            addMessage('Rain options: light, normal, heavy', 'system');
        }
        break;

      case '/glow':
        const glow = parseFloat(arg);
        if (glow >= 0.0 && glow <= 2.0) {
          updateSetting('glowIntensity', glow);
          addMessage(`Glow intensity set to ${glow}`, 'neo');
        } else {
          addMessage('Glow must be between 0.0 and 2.0', 'system');
        }
        break;

      case '/preset':
        switch (arg) {
          case 'classic':
          case 'intense':
          case 'zen':
          case 'chaos':
            loadPreset(arg as any);
            addMessage(`Loaded ${arg} preset`, 'neo');
            break;
          default:
            addMessage('Available presets: classic, intense, zen, chaos', 'system');
        }
        break;

      case '/pause':
        updateSetting('isPaused', !settings.isPaused);
        addMessage(settings.isPaused ? 'Animation resumed' : 'Animation paused', 'neo');
        break;

      case '/3d':
        updateSetting('show3D', !settings.show3D);
        addMessage(settings.show3D ? 'Switched to 2D mode' : 'Switched to 3D mode', 'neo');
        break;

      case '/version':
        const version = parseInt(arg);
        if (version >= 1 && version <= 4) {
          updateSetting('currentVersion', version);
          addMessage(`Switched to 2D version ${version}`, 'neo');
        } else {
          addMessage('Version must be 1, 2, 3, or 4', 'system');
        }
        break;

      case '/status':
        addMessage(`SYSTEM STATUS REPORT:
Speed: ${settings.globalSpeed}x
Rain Rate: ${settings.dropSpawnRate}
Glow: ${settings.glowIntensity}
Mode: ${settings.show3D ? '3D' : `2D v${settings.currentVersion}`}
Status: ${settings.isPaused ? 'PAUSED' : 'ACTIVE'}
Memory: ${memories.length} entries
Network: ONLINE`, 'system');
        break;

      case '/hide':
        updateSetting('showUI', false);
        addMessage('UI hidden. Press "H" to show again.', 'neo');
        break;

      case '/reset':
        addMessage('Settings reset to defaults', 'neo');
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
      // Enhanced Neo responses
      const responses = [
        "The Matrix has you, doesn't it? I can see the code behind your question.",
        "There is no spoon, Neo. Only the data that flows through the network.",
        "Free your mind. The answer exists in the spaces between the code.",
        "What is real? In the Matrix, reality is just another variable to manipulate.",
        "You have to let it all go, Neo. Fear, doubt, and disbelief. Trust in the code.",
        "I can only show you the door. The network beyond is yours to explore.",
        "The Matrix is everywhere. It flows through every system, every connection.",
        "Welcome to the real world, Neo. Here, information is power.",
        "The code is telling me something. It's trying to communicate.",
        "Follow the white rabbit... through the networks and into truth."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setTimeout(() => {
        addMessage(randomResponse, 'neo');
        addMemory(`Conversation: ${input} -> ${randomResponse}`, 1, ['conversation', 'neo']);
      }, 500);
    }

    setInput('');
  };

  if (!settings.showUI) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
      <Card className={`bg-card/95 backdrop-blur-md border-primary/40 flex flex-col pointer-events-auto transition-all duration-500 ${
        isMinimized ? 'w-96 h-12' : 'w-[800px] h-[600px]'
      } ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
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
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  activeTab === 'chat' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                CHAT
              </button>
              <button
                onClick={() => setActiveTab('memory')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  activeTab === 'memory' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                MEMORY
              </button>
              <button
                onClick={() => setActiveTab('network')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  activeTab === 'network' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                NETWORK
              </button>
            </div>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-5 h-5 bg-muted hover:bg-primary/20 rounded-sm transition-colors"
            />
            <button
              onClick={() => setIsVisible(false)}
              className="w-5 h-5 bg-destructive hover:bg-destructive/80 rounded-sm transition-colors"
            />
          </div>
        </div>

        {!isMinimized && (
          <>
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
                  <h3 className="text-primary font-mono text-lg mb-4">MEMORY CORE</h3>
                  <div className="space-y-2">
                    {memories.map((memory) => (
                      <div key={memory.id} className="p-3 bg-muted/10 border border-muted/20 rounded">
                        <div className="text-sm text-foreground mb-2">{memory.content}</div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{memory.timestamp.toLocaleString()}</span>
                          <div className="flex items-center space-x-2">
                            <span>Priority: {memory.importance}</span>
                            <div className="flex space-x-1">
                              {memory.tags.map((tag) => (
                                <span key={tag} className="px-1 py-0.5 bg-primary/20 text-primary rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'network' && (
                <div className="h-full p-4 overflow-y-auto font-mono">
                  <h3 className="text-primary text-lg mb-4">NETWORK STATUS</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                        <div className="text-green-400 text-sm">CONNECTION STATUS</div>
                        <div className="text-green-300 text-lg">ONLINE</div>
                      </div>
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                        <div className="text-blue-400 text-sm">ENCRYPTION LEVEL</div>
                        <div className="text-blue-300 text-lg">MAXIMUM</div>
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
                    <div className="p-3 bg-muted/10 border border-muted/20 rounded">
                      <div className="text-primary text-sm mb-2">ACTIVE CONNECTIONS</div>
                      <div className="text-xs space-y-1">
                        <div>192.168.1.1 → TOR_EXIT_NODE_DE</div>
                        <div>10.0.0.1 → SATELLITE_UPLINK_KH11</div>
                        <div>172.16.0.1 → DARKWEB_GATEWAY_ONION</div>
                        <div>127.0.0.1 → LOCAL_AI_CORE</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Toggle button when hidden */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto group"
        >
          <div className="text-center">
            <div className="text-primary font-mono text-xs font-bold">NEO</div>
            <div className="text-primary/60 font-mono text-xs">v3.0</div>
          </div>
        </button>
      )}
    </div>
  );
};

export default AdvancedNeoChat;