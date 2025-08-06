import React, { useState, useRef, useEffect } from 'react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';
import { Card } from '@/components/ui/card';

interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'system' | 'neo';
  timestamp: Date;
}

const NeoChat: React.FC = () => {
  const { settings, updateSetting, loadPreset } = useMatrixSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Welcome to the Matrix, Neo. I am your interface to the simulation.',
      type: 'neo',
      timestamp: new Date(),
    },
    {
      id: '2', 
      text: 'Type "/help" for available commands, or just talk to me.',
      type: 'system',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, type: 'user' | 'system' | 'neo') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const executeCommand = (command: string) => {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    const arg = args.join(' ');

    switch (cmd) {
      case '/help':
        addMessage('Available commands:\n/speed [0.1-5.0] - Adjust animation speed\n/rain [light|normal|heavy] - Set rain intensity\n/glow [0.0-2.0] - Control glow effects\n/preset [classic|intense|zen|chaos] - Load preset\n/pause - Pause/unpause animation\n/3d - Toggle 3D mode\n/version [1-4] - Switch 2D version\n/status - Show current settings\n/hide - Hide all UI\n/reset - Reset to defaults', 'system');
        break;
      
      case '/speed':
        const speed = parseFloat(arg);
        if (speed >= 0.1 && speed <= 5.0) {
          updateSetting('globalSpeed', speed);
          addMessage(`Speed set to ${speed}x`, 'neo');
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
        addMessage(`Current Settings:\nSpeed: ${settings.globalSpeed}x\nRain Rate: ${settings.dropSpawnRate}\nGlow: ${settings.glowIntensity}\nMode: ${settings.show3D ? '3D' : `2D v${settings.currentVersion}`}\nPaused: ${settings.isPaused}`, 'system');
        break;

      case '/hide':
        updateSetting('showUI', false);
        addMessage('UI hidden. Press "H" to show again.', 'neo');
        break;

      case '/reset':
        // resetToDefaults();
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
      // Neo responses to general conversation
      const responses = [
        "The Matrix has you, doesn't it?",
        "There is no spoon, Neo.",
        "Free your mind.",
        "What is real? How do you define real?",
        "You have to let it all go, Neo. Fear, doubt, and disbelief.",
        "I can only show you the door. You're the one that has to walk through it.",
        "The Matrix is everywhere. It is all around us.",
        "Unfortunately, no one can be told what the Matrix is. You have to see it for yourself.",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setTimeout(() => addMessage(randomResponse, 'neo'), 500);
    }

    setInput('');
  };

  if (!settings.showUI) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
      <Card className={`w-96 h-80 bg-card/90 backdrop-blur-sm border-primary/30 flex flex-col pointer-events-auto transition-all duration-300 ${
        isMinimized ? 'h-12' : 'h-80'
      } ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-primary/20">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-primary font-mono text-sm">NEO TERMINAL</span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-4 h-4 bg-muted hover:bg-primary/20 rounded-sm transition-colors"
            />
            <button
              onClick={() => setIsVisible(false)}
              className="w-4 h-4 bg-destructive hover:bg-destructive/80 rounded-sm transition-colors"
            />
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-sm">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-2 rounded ${
                    message.type === 'user' 
                      ? 'bg-primary/20 text-primary-foreground' 
                      : message.type === 'neo'
                      ? 'bg-accent/20 text-accent-foreground'
                      : 'bg-muted/20 text-muted-foreground'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.text}</div>
                    <div className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-primary/20">
              <div className="flex space-x-2">
                <span className="text-primary font-mono">{">"}</span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a command or message..."
                  className="flex-1 bg-transparent text-primary font-mono outline-none placeholder-muted-foreground"
                />
              </div>
            </form>
          </>
        )}
      </Card>

      {/* Toggle button when hidden */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto"
        >
          <span className="text-primary font-mono text-xs">NEO</span>
        </button>
      )}
    </div>
  );
};

export default NeoChat;