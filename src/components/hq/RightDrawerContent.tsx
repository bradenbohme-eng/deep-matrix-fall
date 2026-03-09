// Right Drawer Content - AI Chat (LIVE), Memory (LIVE), Docs, Surveillance, Evolution, Settings, Approvals

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { streamHQChat, type ChatMessage } from '@/lib/hqChatService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SurveillancePanel from '@/components/matrix/SurveillancePanel';
import SelfEvolutionPanel from '@/components/matrix/SelfEvolutionPanel';
import MatrixSettingsPanel from '@/components/matrix/MatrixSettingsPanel';
import { ProductionDocIDE } from '@/components/docide/ProductionDocIDE';
import ApprovalPanel from './ApprovalPanel';
import { 
  Brain, MessageCircle, FileText, Eye, Sparkles, Settings, 
  Send, Bot, Loader2, Database, Network, Layers, CheckCircle2,
  Shield,
} from 'lucide-react';
import type { RightDrawerTab } from './types';

interface RightDrawerContentProps {
  activeTab: RightDrawerTab;
  width: number;
}

// ─── LIVE AI Chat Panel (replaces fake chat) ───
const LiveChatPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([
    { id: '1', role: 'assistant', content: 'HQ Intelligence online. Full cognitive pipeline active — memory, reasoning, planning, and autonomous actions are all available.\n\nI can **remember** things, **create plans**, **assign tasks** to agents, **propose improvements**, and **search** my own knowledge graph. How can I assist?', timestamp: new Date() },
  ]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput('');

    const userEntry = { id: Date.now().toString(), role: 'user' as const, content: userMsg, timestamp: new Date() };
    setMessages(prev => [...prev, userEntry]);
    setIsStreaming(true);

    const apiMessages: ChatMessage[] = [
      ...messages.filter(m => m.id !== '1').map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMsg },
    ];

    let assistantSoFar = '';
    const assistantId = (Date.now() + 1).toString();

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === assistantId) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { id: assistantId, role: 'assistant' as const, content: assistantSoFar, timestamp: new Date() }];
      });
    };

    const controller = new AbortController();
    abortRef.current = controller;

    await streamHQChat({
      messages: apiMessages,
      onDelta: upsertAssistant,
      onDone: () => { setIsStreaming(false); abortRef.current = null; },
      onError: (err) => {
        setIsStreaming(false);
        abortRef.current = null;
        toast.error(err);
        setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), role: 'assistant', timestamp: new Date(), content: `⚠️ **Error:** ${err}` }]);
      },
      signal: controller.signal,
    });
  }, [input, isStreaming, messages]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border flex items-center space-x-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <span className="font-mono text-sm font-bold">HQ INTELLIGENCE</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-success/20 text-success">LIVE</span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`${msg.role === 'user' ? 'ml-6' : 'mr-2'}`}>
              <div className={`rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20 border border-border'}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  {msg.role === 'assistant' && <Bot className="w-3 h-3 text-primary" />}
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{msg.role === 'user' ? 'You' : 'HQ Intelligence'}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-xs prose-invert max-w-none text-xs leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_code]:text-primary [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted/50 [&_pre]:p-2 [&_pre]:rounded-md [&_strong]:text-foreground [&_hr]:border-border [&_hr]:my-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex items-center gap-2 px-3 py-2">
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
              <span className="text-[10px] font-mono text-muted-foreground">Reasoning...</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-border">
        {isStreaming && (
          <button
            onClick={() => abortRef.current?.abort()}
            className="w-full mb-2 text-[10px] font-mono text-muted-foreground hover:text-foreground py-1 rounded bg-muted/20 hover:bg-muted/40"
          >
            ■ Stop generating
          </button>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask HQ Intelligence..."
            className="flex-1 bg-muted/20 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary border border-border"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-mono hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── LIVE Memory Panel ───
const LiveMemoryPanel: React.FC = () => {
  const [stats, setStats] = useState<{ hot: number; warm: number; cold: number; frozen: number; total: number; entities: number; chains: number; avgKappa: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [hot, warm, cold, frozen, entities, chains] = await Promise.all([
          supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }).eq('memory_level', 'hot'),
          supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }).eq('memory_level', 'warm'),
          supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }).eq('memory_level', 'cold'),
          supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }).eq('memory_level', 'frozen'),
          supabase.from('aimos_entities').select('*', { count: 'exact', head: true }),
          supabase.from('aimos_reasoning_chains').select('confidence_kappa').order('created_at', { ascending: false }).limit(10),
        ]);
        const ks = (chains.data || []).filter((c: any) => c.confidence_kappa).map((c: any) => c.confidence_kappa as number);
        const avgK = ks.length > 0 ? ks.reduce((a, b) => a + b, 0) / ks.length : 0;
        setStats({
          hot: hot.count || 0, warm: warm.count || 0, cold: cold.count || 0, frozen: frozen.count || 0,
          total: (hot.count || 0) + (warm.count || 0) + (cold.count || 0) + (frozen.count || 0),
          entities: entities.count || 0, chains: ks.length, avgKappa: avgK,
        });
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border flex items-center space-x-2">
        <Brain className="w-5 h-5 text-primary" />
        <span className="font-mono text-sm font-bold">AIMOS MEMORY</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-success/20 text-success">LIVE</span>
      </div>
      <ScrollArea className="flex-1 p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : stats && (
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Memory Tiers</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'HOT', value: stats.hot, color: 'text-destructive' },
                { label: 'WARM', value: stats.warm, color: 'text-warning' },
                { label: 'COLD', value: stats.cold, color: 'text-info' },
                { label: 'FROZEN', value: stats.frozen, color: 'text-muted-foreground' },
              ].map(tier => (
                <div key={tier.label} className="bg-muted/20 rounded p-2.5 border border-border">
                  <div className={`text-[9px] font-mono uppercase ${tier.color}`}>{tier.label}</div>
                  <div className="text-lg font-mono font-bold text-foreground">{tier.value}</div>
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-3">Systems</div>
            <div className="space-y-2">
              <div className="bg-muted/20 rounded p-2.5 flex items-center gap-2 border border-border">
                <Database className="w-4 h-4 text-primary/70" />
                <span className="text-xs font-mono flex-1">CMC — {stats.total} atoms</span>
              </div>
              <div className="bg-muted/20 rounded p-2.5 flex items-center gap-2 border border-border">
                <Network className="w-4 h-4 text-primary/70" />
                <span className="text-xs font-mono flex-1">SEG — {stats.entities} entities</span>
              </div>
              <div className="bg-muted/20 rounded p-2.5 flex items-center gap-2 border border-border">
                <Layers className="w-4 h-4 text-primary/70" />
                <span className="text-xs font-mono flex-1">VIF — κ {(stats.avgKappa * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-muted/20 rounded p-2.5 flex items-center gap-2 border border-border">
                <CheckCircle2 className="w-4 h-4 text-primary/70" />
                <span className="text-xs font-mono flex-1">Chains — {stats.chains} recent</span>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

const RightDrawerContent: React.FC<RightDrawerContentProps> = ({ activeTab, width }) => {
  return (
    <div className="h-full bg-card/95 border-l border-border" style={{ width: `${width}px` }}>
      {activeTab === 'chat' && <LiveChatPanel />}
      {activeTab === 'memory' && <LiveMemoryPanel />}
      {activeTab === 'docs' && (
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-border flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm font-bold">DOCUMENTATION</span>
          </div>
          <div className="flex-1 overflow-hidden"><ProductionDocIDE /></div>
        </div>
      )}
      {activeTab === 'surveillance' && <div className="h-full overflow-hidden"><SurveillancePanel /></div>}
      {activeTab === 'evolve' && <div className="h-full overflow-hidden"><SelfEvolutionPanel /></div>}
      {activeTab === 'settings' && (
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-border flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm font-bold">SETTINGS</span>
          </div>
          <div className="flex-1 overflow-hidden"><MatrixSettingsPanel /></div>
        </div>
      )}
    </div>
  );
};

export default RightDrawerContent;
