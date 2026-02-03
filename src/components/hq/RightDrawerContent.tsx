// Right Drawer Content - AI Chat, Memory, Docs, Surveillance, Evolution, Settings

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SurveillancePanel from '@/components/matrix/SurveillancePanel';
import SelfEvolutionPanel from '@/components/matrix/SelfEvolutionPanel';
import MatrixSettingsPanel from '@/components/matrix/MatrixSettingsPanel';
import { ProductionDocIDE } from '@/components/docide/ProductionDocIDE';
import AdvancedNeoChat from '@/components/matrix/AdvancedNeoChat';
import { Brain, MessageCircle, FileText, Eye, Sparkles, Settings } from 'lucide-react';
import type { RightDrawerTab } from './types';

interface RightDrawerContentProps {
  activeTab: RightDrawerTab;
  width: number;
}

// Simplified chat component for right panel
const RightPanelChat: React.FC = () => {
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<{id: string; role: 'user' | 'assistant'; content: string}[]>([
    { id: '1', role: 'assistant', content: 'HQ AI Assistant ready. How can I help with your security operations?' }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: input }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: `Processing your request: "${input}"\n\nI can help with:\n• Red team operations\n• Blue team defense\n• Network analysis\n• Code review\n• Threat intelligence` 
      }]);
    }, 500);
    
    setInput('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border flex items-center space-x-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <span className="font-mono text-sm font-bold">AI ASSISTANT</span>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`${
                msg.role === 'user' 
                  ? 'ml-8 bg-primary/20 rounded-lg p-3' 
                  : 'mr-8 bg-muted/30 rounded-lg p-3'
              }`}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {msg.role === 'user' ? 'You' : 'HQ AI'}
              </div>
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask HQ AI..."
            className="flex-1 bg-muted/30 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-mono hover:bg-primary/90"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

// Memory panel 
const MemoryPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border flex items-center space-x-2">
        <Brain className="w-5 h-5 text-primary" />
        <span className="font-mono text-sm font-bold">AIMOS MEMORY</span>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          <div className="bg-muted/20 rounded p-3">
            <div className="text-xs text-muted-foreground mb-1">Context Memory Core</div>
            <div className="text-sm">12 active memory atoms</div>
          </div>
          <div className="bg-muted/20 rounded p-3">
            <div className="text-xs text-muted-foreground mb-1">Evidence Graph</div>
            <div className="text-sm">47 linked entities</div>
          </div>
          <div className="bg-muted/20 rounded p-3">
            <div className="text-xs text-muted-foreground mb-1">Reasoning Chains</div>
            <div className="text-sm">3 active chains</div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

const RightDrawerContent: React.FC<RightDrawerContentProps> = ({
  activeTab,
  width,
}) => {
  return (
    <div className="h-full bg-card/95 border-l border-border" style={{ width: `${width}px` }}>
      {activeTab === 'chat' && <RightPanelChat />}
      
      {activeTab === 'memory' && <MemoryPanel />}
      
      {activeTab === 'docs' && (
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-border flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm font-bold">DOCUMENTATION</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ProductionDocIDE />
          </div>
        </div>
      )}
      
      {activeTab === 'surveillance' && (
        <div className="h-full overflow-hidden">
          <SurveillancePanel />
        </div>
      )}
      
      {activeTab === 'evolve' && (
        <div className="h-full overflow-hidden">
          <SelfEvolutionPanel />
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-border flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm font-bold">SETTINGS</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <MatrixSettingsPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default RightDrawerContent;
