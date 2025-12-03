import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, Brain, Cpu, Network, Database, Search, 
  Shield, Code, FileText, Zap, Activity, 
  ChevronDown, ChevronUp, Clock, CheckCircle2, 
  AlertCircle, Loader2, Cog
} from 'lucide-react';

export interface AgentState {
  id: string;
  name: string;
  type: 'domain' | 'meta' | 'subspecialist' | 'orchestrator';
  domain: string;
  status: 'active' | 'idle' | 'processing' | 'cooldown';
  currentMode: string;
  currentTask?: string;
  confidence: number;
  tokenBudget: number;
  tokensUsed: number;
  lastActive: Date;
}

export interface ToolCall {
  id: string;
  toolName: string;
  agentId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  input: Record<string, any>;
  output?: any;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export interface AgentMessage {
  id: string;
  type: 'THOUGHT' | 'DECISION' | 'TASK_PROPOSE' | 'TASK_COMPLETE' | 'TOOL_CALL' | 'TOOL_RESULT' | 'SUMMARY' | 'ALERT';
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  threadId?: string;
  mode?: string;
  confidence?: number;
}

interface AgentActivityPanelProps {
  agents: AgentState[];
  toolCalls: ToolCall[];
  messages: AgentMessage[];
  isActive: boolean;
}

const getAgentIcon = (domain: string) => {
  switch (domain) {
    case 'code': return Code;
    case 'memory': return Database;
    case 'research': return Search;
    case 'security': return Shield;
    case 'orchestrator': return Network;
    case 'meta': return Brain;
    default: return Bot;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'processing': return 'bg-yellow-500 animate-pulse';
    case 'idle': return 'bg-gray-500';
    case 'cooldown': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const getMessageTypeColor = (type: string) => {
  switch (type) {
    case 'THOUGHT': return 'text-blue-400 border-blue-400/30';
    case 'DECISION': return 'text-green-400 border-green-400/30';
    case 'TASK_PROPOSE': return 'text-yellow-400 border-yellow-400/30';
    case 'TASK_COMPLETE': return 'text-green-500 border-green-500/30';
    case 'TOOL_CALL': return 'text-purple-400 border-purple-400/30';
    case 'TOOL_RESULT': return 'text-cyan-400 border-cyan-400/30';
    case 'SUMMARY': return 'text-orange-400 border-orange-400/30';
    case 'ALERT': return 'text-red-400 border-red-400/30';
    default: return 'text-gray-400 border-gray-400/30';
  }
};

const getMessageIcon = (type: string) => {
  switch (type) {
    case 'THOUGHT': return Brain;
    case 'DECISION': return CheckCircle2;
    case 'TASK_PROPOSE': return FileText;
    case 'TASK_COMPLETE': return CheckCircle2;
    case 'TOOL_CALL': return Cog;
    case 'TOOL_RESULT': return Zap;
    case 'SUMMARY': return FileText;
    case 'ALERT': return AlertCircle;
    default: return Activity;
  }
};

export const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({
  agents,
  toolCalls,
  messages,
  isActive
}) => {
  const [expandedSection, setExpandedSection] = useState<'agents' | 'tools' | 'messages' | null>('agents');

  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'processing');
  const recentToolCalls = toolCalls.slice(-10);
  const recentMessages = messages.slice(-15);

  return (
    <Card className="bg-black/60 border-primary/20 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className={`w-5 h-5 ${isActive ? 'text-green-400 animate-pulse' : 'text-primary/60'}`} />
          <span className="text-sm font-mono text-primary">AGENT SWARM ACTIVITY</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono border-green-500/30 text-green-400">
            {activeAgents.length} ACTIVE
          </Badge>
          <Badge variant="outline" className="text-xs font-mono border-primary/30">
            {agents.length} TOTAL
          </Badge>
        </div>
      </div>

      <ScrollArea className="max-h-[500px]">
        {/* Agent Status Section */}
        <div className="border-b border-primary/10">
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-primary/5"
            onClick={() => setExpandedSection(expandedSection === 'agents' ? null : 'agents')}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-foreground/80">DOMAIN AGENTS ({agents.length})</span>
            </div>
            {expandedSection === 'agents' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          
          {expandedSection === 'agents' && (
            <div className="px-3 pb-3 space-y-2">
              {agents.map((agent) => {
                const IconComponent = getAgentIcon(agent.domain);
                return (
                  <div key={agent.id} className="p-2 rounded bg-black/40 border border-primary/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                        <IconComponent className="w-4 h-4 text-primary/70" />
                        <span className="text-xs font-mono text-foreground">{agent.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {agent.currentMode}
                      </Badge>
                    </div>
                    {agent.currentTask && (
                      <div className="text-[10px] text-muted-foreground font-mono mb-2 truncate">
                        → {agent.currentTask}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(agent.tokensUsed / agent.tokenBudget) * 100} 
                        className="h-1 flex-1"
                      />
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {agent.tokensUsed}/{agent.tokenBudget}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tool Calls Section */}
        <div className="border-b border-primary/10">
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-primary/5"
            onClick={() => setExpandedSection(expandedSection === 'tools' ? null : 'tools')}
          >
            <div className="flex items-center gap-2">
              <Cog className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono text-foreground/80">MCP TOOL CALLS ({recentToolCalls.length})</span>
            </div>
            {expandedSection === 'tools' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          
          {expandedSection === 'tools' && (
            <div className="px-3 pb-3 space-y-2">
              {recentToolCalls.map((call) => (
                <div key={call.id} className="p-2 rounded bg-black/40 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {call.status === 'executing' ? (
                        <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                      ) : call.status === 'completed' ? (
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                      ) : call.status === 'failed' ? (
                        <AlertCircle className="w-3 h-3 text-red-400" />
                      ) : (
                        <Clock className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="text-xs font-mono text-purple-300">{call.toolName}</span>
                    </div>
                    {call.duration && (
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {call.duration}ms
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">
                    Input: {JSON.stringify(call.input).slice(0, 50)}...
                  </div>
                  {call.output && (
                    <div className="text-[10px] text-cyan-400/70 font-mono truncate mt-1">
                      Output: {JSON.stringify(call.output).slice(0, 50)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Discord Messages Section */}
        <div>
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-primary/5"
            onClick={() => setExpandedSection(expandedSection === 'messages' ? null : 'messages')}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-foreground/80">AGENT DISCORD ({recentMessages.length})</span>
            </div>
            {expandedSection === 'messages' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          
          {expandedSection === 'messages' && (
            <div className="px-3 pb-3 space-y-2">
              {recentMessages.map((msg) => {
                const IconComponent = getMessageIcon(msg.type);
                return (
                  <div key={msg.id} className={`p-2 rounded bg-black/40 border ${getMessageTypeColor(msg.type)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="w-3 h-3" />
                      <Badge variant="outline" className={`text-[9px] font-mono ${getMessageTypeColor(msg.type)}`}>
                        {msg.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {msg.agentName}
                      </span>
                      {msg.confidence !== undefined && (
                        <span className="text-[9px] text-primary/60 font-mono ml-auto">
                          κ={Math.round(msg.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-foreground/80 font-mono">
                      {msg.content}
                    </div>
                    {msg.threadId && (
                      <div className="text-[9px] text-muted-foreground font-mono mt-1">
                        thread://{msg.threadId}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
