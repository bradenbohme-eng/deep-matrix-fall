import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, Brain, Cpu, Network, Database, Search, Shield, Code, FileText, 
  Zap, Activity, ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle, 
  Loader2, Cog, Eye, Target, GitBranch, Layers, Lightbulb, Scale, 
  Sparkles, Globe, MemoryStick, MessageSquare, TreePine, Telescope, 
  ArrowRight, Play, AlertTriangle, Users
} from 'lucide-react';

// ========== TYPE DEFINITIONS ==========

export interface CognitiveAgent {
  id: string;
  name: string;
  type: 'orchestrator' | 'domain' | 'meta' | 'subspecialist';
  domain: string;
  status: 'active' | 'idle' | 'processing' | 'cooldown' | 'spawning';
  currentMode: 'GENERAL' | 'PLANNING' | 'REASONING' | 'DEBUGGING' | 'EXECUTION' | 'REVIEW' | 'LEARNING';
  currentTask?: string;
  confidence: number;
  tokenBudget: number;
  tokensUsed: number;
  capabilities: string[];
  threads: string[];
  lastActive: Date;
  processingSteps?: ProcessingStep[];
}

export interface ProcessingStep {
  id: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  duration?: number;
  confidence?: number;
}

export interface ThinkingNode {
  id: string;
  type: 'hypothesis' | 'evidence' | 'inference' | 'conclusion' | 'question' | 'contradiction' | 'insight' | 'memory-recall';
  content: string;
  confidence: number;
  depth: number;
  sourceRefs?: string[];
  children?: ThinkingNode[];
  agentId?: string;
  agentName?: string;
  timestamp: Date;
  phase?: string;
}

export interface ReasoningChain {
  id: string;
  phase: 'ANALYSIS' | 'DECOMPOSITION' | 'RESEARCH' | 'SYNTHESIS' | 'VALIDATION' | 'AUDIT' | 'INTEGRATION';
  status: 'pending' | 'active' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  confidence: number;
  thoughts: ThinkingNode[];
  validationChecks: ValidationCheck[];
  agentsInvolved: string[];
  tokenCost: number;
}

export interface ValidationCheck {
  id: string;
  type: 'factual' | 'logical' | 'consistency' | 'completeness' | 'safety' | 'ethical';
  name: string;
  passed: boolean | null;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface SearchResult {
  id: string;
  source: 'CMC' | 'HHNI' | 'SEG' | 'WEB' | 'DOCS' | 'MEMORY';
  title: string;
  content: string;
  relevance: number;
  confidence: number;
  timestamp: Date;
  tags: string[];
  sourceRef?: string;
}

export interface ToolExecution {
  id: string;
  toolName: string;
  agentId: string;
  agentName: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  input: Record<string, any>;
  output?: any;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export interface AgentDiscordMessage {
  id: string;
  type: 'THOUGHT' | 'DECISION' | 'TASK_PROPOSE' | 'TASK_ACCEPT' | 'TASK_COMPLETE' | 'TOOL_CALL' | 'TOOL_RESULT' | 'SUMMARY' | 'ALERT' | 'INSIGHT';
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  threadId?: string;
  channel?: string;
  mode?: string;
  confidence?: number;
  replyTo?: string;
}

export interface GoalHierarchy {
  level: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  confidence: number;
  assignedAgents?: string[];
  children?: GoalHierarchy[];
}

interface CognitiveSwarmPanelProps {
  agents: CognitiveAgent[];
  reasoningChains: ReasoningChain[];
  thinkingNodes: ThinkingNode[];
  searchResults: SearchResult[];
  toolExecutions: ToolExecution[];
  discordMessages: AgentDiscordMessage[];
  goalHierarchy?: GoalHierarchy;
  isActive: boolean;
  currentPhase?: string;
  globalConfidence?: number;
  totalTokens?: number;
}

// ========== HELPER FUNCTIONS ==========

const getAgentIcon = (domain: string) => {
  const icons: Record<string, any> = {
    orchestrator: Network,
    code: Code,
    memory: Database,
    research: Search,
    security: Shield,
    meta: Brain,
    docs: FileText,
    ethics: Scale,
    ux: Eye,
    default: Bot
  };
  return icons[domain] || icons.default;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    processing: 'bg-yellow-500 animate-pulse',
    idle: 'bg-muted-foreground/50',
    cooldown: 'bg-blue-500',
    spawning: 'bg-purple-500 animate-pulse',
    pending: 'bg-muted-foreground/30',
    running: 'bg-yellow-400 animate-pulse',
    completed: 'bg-green-400',
    failed: 'bg-destructive',
    blocked: 'bg-orange-500'
  };
  return colors[status] || 'bg-muted-foreground/50';
};

const getPhaseColor = (phase: string) => {
  const colors: Record<string, string> = {
    ANALYSIS: 'text-blue-400 border-blue-400/30 bg-blue-500/10',
    DECOMPOSITION: 'text-indigo-400 border-indigo-400/30 bg-indigo-500/10',
    RESEARCH: 'text-green-400 border-green-400/30 bg-green-500/10',
    SYNTHESIS: 'text-purple-400 border-purple-400/30 bg-purple-500/10',
    VALIDATION: 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10',
    AUDIT: 'text-red-400 border-red-400/30 bg-red-500/10',
    INTEGRATION: 'text-cyan-400 border-cyan-400/30 bg-cyan-500/10'
  };
  return colors[phase] || 'text-primary border-primary/30 bg-primary/10';
};

const getMessageTypeStyle = (type: string) => {
  const styles: Record<string, { color: string; icon: any }> = {
    THOUGHT: { color: 'text-blue-400 border-blue-400/30', icon: Brain },
    DECISION: { color: 'text-green-400 border-green-400/30', icon: CheckCircle2 },
    TASK_PROPOSE: { color: 'text-yellow-400 border-yellow-400/30', icon: Target },
    TASK_ACCEPT: { color: 'text-lime-400 border-lime-400/30', icon: Play },
    TASK_COMPLETE: { color: 'text-green-500 border-green-500/30', icon: CheckCircle2 },
    TOOL_CALL: { color: 'text-purple-400 border-purple-400/30', icon: Cog },
    TOOL_RESULT: { color: 'text-cyan-400 border-cyan-400/30', icon: Zap },
    SUMMARY: { color: 'text-orange-400 border-orange-400/30', icon: FileText },
    ALERT: { color: 'text-red-400 border-red-400/30', icon: AlertCircle },
    INSIGHT: { color: 'text-pink-400 border-pink-400/30', icon: Lightbulb }
  };
  return styles[type] || { color: 'text-muted-foreground border-border', icon: MessageSquare };
};

const getConfidenceColor = (conf: number) => {
  if (conf >= 0.85) return 'text-green-400';
  if (conf >= 0.6) return 'text-yellow-400';
  if (conf >= 0.4) return 'text-orange-400';
  return 'text-red-400';
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// ========== SUB-COMPONENTS ==========

const AgentCard: React.FC<{ agent: CognitiveAgent }> = ({ agent }) => {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = getAgentIcon(agent.domain);
  
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      agent.status === 'processing' ? 'border-yellow-500/50 bg-yellow-500/5' :
      agent.status === 'active' ? 'border-green-500/30 bg-green-500/5' :
      'border-border/50 bg-card/50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
          <IconComponent className="w-4 h-4 text-primary/70" />
          <span className="text-xs font-mono font-medium text-foreground">{agent.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] font-mono h-5">
            {agent.currentMode}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>
      
      {agent.currentTask && (
        <div className="text-[10px] text-muted-foreground font-mono mb-2 flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          <span className="truncate">{agent.currentTask}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-2">
        <Progress 
          value={(agent.tokensUsed / agent.tokenBudget) * 100} 
          className="h-1.5 flex-1"
        />
        <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
          {agent.tokensUsed}/{agent.tokenBudget}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-mono ${getConfidenceColor(agent.confidence)}`}>
          κ={Math.round(agent.confidence * 100)}%
        </span>
        {agent.threads.length > 0 && (
          <span className="text-[9px] text-muted-foreground font-mono">
            {agent.threads.length} threads
          </span>
        )}
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 5).map((cap, idx) => (
              <Badge key={idx} variant="secondary" className="text-[8px] font-mono">
                {cap}
              </Badge>
            ))}
          </div>
          {agent.processingSteps && agent.processingSteps.length > 0 && (
            <div className="space-y-1">
              {agent.processingSteps.slice(-3).map(step => (
                <div key={step.id} className="flex items-center gap-2 text-[9px] font-mono">
                  {step.status === 'running' ? (
                    <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
                  ) : step.status === 'completed' ? (
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  ) : (
                    <Clock className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className="truncate text-muted-foreground">{step.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const GoalTreeNode: React.FC<{ node: GoalHierarchy; depth?: number }> = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  
  const levelColors: Record<string, string> = {
    T0: 'border-red-500/50 bg-red-500/10',
    T1: 'border-orange-500/50 bg-orange-500/10',
    T2: 'border-yellow-500/50 bg-yellow-500/10',
    T3: 'border-green-500/50 bg-green-500/10',
    T4: 'border-cyan-500/50 bg-cyan-500/10',
    T5: 'border-blue-500/50 bg-blue-500/10',
    T6: 'border-purple-500/50 bg-purple-500/10'
  };
  
  return (
    <div className={`${depth > 0 ? 'ml-4 border-l border-primary/20 pl-3' : ''}`}>
      <div 
        className={`flex items-start gap-2 py-2 px-2 rounded cursor-pointer hover:bg-primary/5 ${
          node.status === 'active' ? 'bg-primary/10' : ''
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        {node.children && node.children.length > 0 ? (
          expanded ? <ChevronDown className="w-3 h-3 mt-1 text-muted-foreground" /> : 
                    <ChevronUp className="w-3 h-3 mt-1 text-muted-foreground" />
        ) : (
          <div className="w-3" />
        )}
        <Badge variant="outline" className={`text-[9px] font-mono ${levelColors[node.level]}`}>
          {node.level}
        </Badge>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-foreground truncate">{node.title}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(node.status)}`} />
          </div>
          {node.description && expanded && (
            <p className="text-[10px] text-muted-foreground font-mono mt-1">{node.description}</p>
          )}
        </div>
        <span className={`text-[9px] font-mono ${getConfidenceColor(node.confidence)}`}>
          {Math.round(node.confidence * 100)}%
        </span>
      </div>
      {expanded && node.children && (
        <div className="mt-1">
          {node.children.map((child, idx) => (
            <GoalTreeNode key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const ThinkingTreeNode: React.FC<{ node: ThinkingNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  
  const typeIcons: Record<string, any> = {
    hypothesis: Lightbulb,
    evidence: Eye,
    inference: GitBranch,
    conclusion: CheckCircle2,
    question: Search,
    contradiction: AlertTriangle,
    insight: Sparkles,
    'memory-recall': MemoryStick
  };
  
  const typeColors: Record<string, string> = {
    hypothesis: 'text-yellow-400 border-yellow-400/30',
    evidence: 'text-blue-400 border-blue-400/30',
    inference: 'text-purple-400 border-purple-400/30',
    conclusion: 'text-green-400 border-green-400/30',
    question: 'text-cyan-400 border-cyan-400/30',
    contradiction: 'text-red-400 border-red-400/30',
    insight: 'text-pink-400 border-pink-400/30',
    'memory-recall': 'text-orange-400 border-orange-400/30'
  };
  
  const IconComponent = typeIcons[node.type] || Brain;
  
  return (
    <div className={`${depth > 0 ? 'ml-4 border-l border-primary/10 pl-3' : ''}`}>
      <div 
        className={`p-2 rounded-lg bg-card/30 border ${typeColors[node.type]} mb-2 cursor-pointer hover:bg-card/50`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-2">
          <IconComponent className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={`text-[8px] font-mono ${typeColors[node.type]}`}>
                {node.type.toUpperCase()}
              </Badge>
              {node.phase && (
                <Badge variant="secondary" className="text-[8px] font-mono">
                  {node.phase}
                </Badge>
              )}
              {node.agentName && (
                <span className="text-[9px] text-muted-foreground font-mono">
                  via {node.agentName}
                </span>
              )}
              <span className={`text-[9px] font-mono ml-auto ${getConfidenceColor(node.confidence)}`}>
                κ={Math.round(node.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs font-mono text-foreground/90 leading-relaxed">
              {node.content}
            </p>
            {node.sourceRefs && node.sourceRefs.length > 0 && expanded && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {node.sourceRefs.map((ref, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[7px] font-mono">
                    ref://{ref}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {node.children && node.children.length > 0 && (
            expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
          )}
        </div>
      </div>
      {expanded && node.children && (
        <div className="space-y-1">
          {node.children.map(child => (
            <ThinkingTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// ========== MAIN COMPONENT ==========

export const CognitiveSwarmPanel: React.FC<CognitiveSwarmPanelProps> = ({
  agents,
  reasoningChains,
  thinkingNodes,
  searchResults,
  toolExecutions,
  discordMessages,
  goalHierarchy,
  isActive,
  currentPhase,
  globalConfidence,
  totalTokens
}) => {
  const [activeTab, setActiveTab] = useState('swarm');
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'processing');
  const activeChain = reasoningChains.find(c => c.status === 'active');
  const recentMessages = discordMessages.slice(-25);
  const recentTools = toolExecutions.slice(-15);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [discordMessages, thinkingNodes]);
  
  return (
    <Card className="bg-black/60 border-primary/20 backdrop-blur-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-primary/20 flex items-center justify-between bg-black/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Network className={`w-5 h-5 ${isActive ? 'text-green-400 animate-pulse' : 'text-primary/60'}`} />
          <div className="flex flex-col">
            <span className="text-sm font-mono font-semibold text-primary">COGNITIVE SWARM</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {currentPhase ? `Phase: ${currentPhase}` : 'AIMOS L2/L3 Visualization'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono border-green-500/30 text-green-400 h-5">
            <Activity className="w-3 h-3 mr-1" />
            {activeAgents.length} ACTIVE
          </Badge>
          {globalConfidence !== undefined && (
            <Badge variant="outline" className={`text-[10px] font-mono h-5 ${getConfidenceColor(globalConfidence)} border-current`}>
              <Scale className="w-3 h-3 mr-1" />
              κ={Math.round(globalConfidence * 100)}%
            </Badge>
          )}
          {totalTokens !== undefined && (
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 h-5">
              {totalTokens.toLocaleString()} tokens
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-4 gap-1 p-1 m-2 bg-black/40 rounded-lg flex-shrink-0">
          <TabsTrigger value="swarm" className="text-[10px] font-mono data-[state=active]:bg-primary/20">
            <Bot className="w-3 h-3 mr-1" />
            SWARM
          </TabsTrigger>
          <TabsTrigger value="reasoning" className="text-[10px] font-mono data-[state=active]:bg-purple-500/20">
            <Cpu className="w-3 h-3 mr-1" />
            REASON
          </TabsTrigger>
          <TabsTrigger value="thinking" className="text-[10px] font-mono data-[state=active]:bg-blue-500/20">
            <Brain className="w-3 h-3 mr-1" />
            THINK
          </TabsTrigger>
          <TabsTrigger value="search" className="text-[10px] font-mono data-[state=active]:bg-green-500/20">
            <Search className="w-3 h-3 mr-1" />
            SEARCH
          </TabsTrigger>
        </TabsList>
        
        <div ref={containerRef} className="flex-1 overflow-y-auto px-2 pb-2" style={{ maxHeight: 'calc(100% - 120px)' }}>
          {/* AGENT SWARM TAB */}
          <TabsContent value="swarm" className="mt-0 space-y-3">
            {/* Orchestrator Status */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Network className="w-5 h-5 text-primary" />
                <span className="text-xs font-mono font-semibold text-primary">APOE ORCHESTRATOR</span>
                <Badge variant="outline" className="text-[9px] font-mono ml-auto">
                  {agents.find(a => a.id === 'apoe-orchestrator')?.currentMode || 'GENERAL'}
                </Badge>
              </div>
              {goalHierarchy && <GoalTreeNode node={goalHierarchy} />}
            </div>
            
            {/* Active Agents Grid */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-mono text-muted-foreground">DOMAIN AGENTS ({agents.length})</span>
              </div>
              <div className="grid gap-2">
                {agents.filter(a => a.id !== 'apoe-orchestrator').map(agent => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
            
            {/* Agent Discord Messages */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-mono text-muted-foreground">AGENT DISCORD ({recentMessages.length})</span>
              </div>
              <div className="space-y-1.5">
                {recentMessages.map(msg => {
                  const style = getMessageTypeStyle(msg.type);
                  const IconComponent = style.icon;
                  return (
                    <div key={msg.id} className={`p-2 rounded bg-card/30 border ${style.color}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className="w-3 h-3" />
                        <Badge variant="outline" className={`text-[8px] font-mono ${style.color}`}>
                          {msg.type}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground font-mono">{msg.agentName}</span>
                        {msg.confidence !== undefined && (
                          <span className={`text-[8px] font-mono ml-auto ${getConfidenceColor(msg.confidence)}`}>
                            κ={Math.round(msg.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-foreground/80">{msg.content}</p>
                      {msg.threadId && (
                        <span className="text-[8px] text-muted-foreground font-mono mt-1 block">
                          thread://{msg.threadId}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Tool Executions */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cog className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-mono text-muted-foreground">MCP TOOLS ({recentTools.length})</span>
              </div>
              <div className="space-y-1.5">
                {recentTools.map(tool => (
                  <div key={tool.id} className="p-2 rounded bg-card/30 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {tool.status === 'executing' ? (
                          <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                        ) : tool.status === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        ) : tool.status === 'failed' ? (
                          <AlertCircle className="w-3 h-3 text-red-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className="text-[10px] font-mono text-purple-300">{tool.toolName}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">via {tool.agentName}</span>
                      </div>
                      {tool.duration && (
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {formatDuration(tool.duration)}
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono truncate">
                      Input: {JSON.stringify(tool.input).slice(0, 60)}...
                    </div>
                    {tool.output && (
                      <div className="text-[9px] text-cyan-400/70 font-mono truncate mt-1">
                        Output: {JSON.stringify(tool.output).slice(0, 60)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* REASONING TAB */}
          <TabsContent value="reasoning" className="mt-0 space-y-3">
            {/* Phase Pipeline */}
            <div className="p-3 rounded-lg bg-black/40 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-semibold text-foreground">REASONING PIPELINE</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {reasoningChains.map(chain => (
                  <div 
                    key={chain.id}
                    className={`flex-1 min-w-[80px] p-2 rounded transition-all ${getPhaseColor(chain.phase)} ${
                      chain.status === 'active' ? 'ring-2 ring-primary/50' : ''
                    } ${chain.status === 'pending' ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {chain.status === 'active' && <Loader2 className="w-3 h-3 animate-spin" />}
                      {chain.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                      <span className="text-[9px] font-mono">{chain.phase}</span>
                    </div>
                    <Progress 
                      value={chain.status === 'completed' ? 100 : chain.status === 'active' ? 50 : 0} 
                      className="h-1"
                    />
                    <div className="flex justify-between mt-1">
                      <span className={`text-[8px] font-mono ${getConfidenceColor(chain.confidence)}`}>
                        κ={Math.round(chain.confidence * 100)}%
                      </span>
                      <span className="text-[8px] text-muted-foreground font-mono">
                        {chain.tokenCost}t
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Active Chain Details */}
            {activeChain && (
              <div className={`p-3 rounded-lg border ${getPhaseColor(activeChain.phase)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 animate-pulse" />
                    <span className="text-sm font-mono font-semibold">{activeChain.phase}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">ACTIVE</Badge>
                  </div>
                  <span className={`text-xs font-mono ${getConfidenceColor(activeChain.confidence)}`}>
                    κ={Math.round(activeChain.confidence * 100)}%
                  </span>
                </div>
                
                {/* Agents Involved */}
                <div className="flex gap-1 mb-3 flex-wrap">
                  {activeChain.agentsInvolved.map((agentId, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[8px] font-mono">
                      {agents.find(a => a.id === agentId)?.name || agentId}
                    </Badge>
                  ))}
                </div>
                
                {/* Thoughts */}
                {activeChain.thoughts.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {activeChain.thoughts.slice(-5).map(thought => (
                      <ThinkingTreeNode key={thought.id} node={thought} />
                    ))}
                  </div>
                )}
                
                {/* Validation Checks */}
                {activeChain.validationChecks.length > 0 && (
                  <div className="border-t border-current/20 pt-2 mt-2">
                    <div className="text-[10px] font-mono text-foreground/60 mb-2">VALIDATION CHECKS:</div>
                    {activeChain.validationChecks.map(check => (
                      <div key={check.id} className="flex items-center gap-2 text-[10px] font-mono mb-1">
                        {check.passed === true ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        ) : check.passed === false ? (
                          <AlertCircle className={`w-3 h-3 ${
                            check.severity === 'critical' ? 'text-red-500' :
                            check.severity === 'error' ? 'text-red-400' :
                            check.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                          }`} />
                        ) : (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        )}
                        <span className={check.passed ? 'text-green-300' : 'text-foreground/70'}>
                          [{check.type}] {check.name}
                        </span>
                        <span className="text-muted-foreground truncate flex-1">{check.details}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Completed Chains Summary */}
            {reasoningChains.filter(c => c.status === 'completed').length > 0 && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-mono text-green-300">COMPLETED PHASES</span>
                </div>
                <div className="space-y-1">
                  {reasoningChains.filter(c => c.status === 'completed').map(chain => (
                    <div key={chain.id} className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-foreground/80">{chain.phase}</span>
                      <div className="flex items-center gap-2">
                        <span className={getConfidenceColor(chain.confidence)}>κ={Math.round(chain.confidence * 100)}%</span>
                        <span className="text-muted-foreground">{chain.tokenCost}t</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* THINKING TAB */}
          <TabsContent value="thinking" className="mt-0 space-y-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-blue-400 animate-pulse" />
                <span className="text-xs font-mono font-semibold text-blue-300">DEEP THINKING PROCESS</span>
                <Badge variant="outline" className="text-[9px] font-mono ml-auto border-blue-500/30">
                  {thinkingNodes.length} nodes
                </Badge>
              </div>
              
              {/* Thinking Tree */}
              <div className="space-y-2">
                {thinkingNodes.filter(n => n.depth === 0).map(node => (
                  <ThinkingTreeNode key={node.id} node={node} />
                ))}
              </div>
              
              {/* Active Thinking Indicator */}
              {isActive && (
                <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-3">
                  <Brain className="w-5 h-5 text-primary animate-pulse" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-primary">Processing thought chain...</span>
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                    <Progress value={undefined} className="h-1 mt-2" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Insight Summary */}
            {thinkingNodes.filter(n => n.type === 'insight' || n.type === 'conclusion').length > 0 && (
              <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-mono text-pink-300">INSIGHTS & CONCLUSIONS</span>
                </div>
                <div className="space-y-2">
                  {thinkingNodes.filter(n => n.type === 'insight' || n.type === 'conclusion').map(node => (
                    <div key={node.id} className="flex items-start gap-2 text-[11px] font-mono">
                      <Lightbulb className="w-3 h-3 mt-0.5 text-pink-400" />
                      <span className="text-foreground/90">{node.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* SEARCH TAB */}
          <TabsContent value="search" className="mt-0 space-y-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Telescope className="w-5 h-5 text-green-400" />
                <span className="text-xs font-mono font-semibold text-green-300">DEEP SEARCH RESULTS</span>
                <Badge variant="outline" className="text-[9px] font-mono ml-auto border-green-500/30">
                  {searchResults.length} results
                </Badge>
              </div>
              
              {/* Search Results */}
              <div className="space-y-2">
                {searchResults.map(result => {
                  const sourceIcons: Record<string, any> = {
                    CMC: Database,
                    HHNI: TreePine,
                    SEG: GitBranch,
                    WEB: Globe,
                    DOCS: FileText,
                    MEMORY: MemoryStick
                  };
                  const SourceIcon = sourceIcons[result.source] || Search;
                  
                  return (
                    <div key={result.id} className="p-2 rounded bg-card/30 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <SourceIcon className="w-3 h-3 text-green-400" />
                        <Badge variant="outline" className="text-[8px] font-mono border-green-500/30 text-green-300">
                          {result.source}
                        </Badge>
                        <span className="text-[10px] font-mono text-foreground/90 flex-1 truncate">{result.title}</span>
                        <span className={`text-[9px] font-mono ${getConfidenceColor(result.relevance)}`}>
                          {Math.round(result.relevance * 100)}% match
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono line-clamp-2">{result.content}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {result.tags.slice(0, 4).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[7px] font-mono">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {searchResults.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-mono">No search results yet</p>
                  <p className="text-[10px] font-mono opacity-70">Deep search activates during REASONING and RESEARCH phases</p>
                </div>
              )}
            </div>
            
            {/* Knowledge Sources */}
            <div className="p-3 rounded-lg bg-black/40 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground">KNOWLEDGE SOURCES</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'CMC', icon: Database, count: searchResults.filter(r => r.source === 'CMC').length },
                  { name: 'HHNI', icon: TreePine, count: searchResults.filter(r => r.source === 'HHNI').length },
                  { name: 'SEG', icon: GitBranch, count: searchResults.filter(r => r.source === 'SEG').length },
                  { name: 'WEB', icon: Globe, count: searchResults.filter(r => r.source === 'WEB').length },
                  { name: 'DOCS', icon: FileText, count: searchResults.filter(r => r.source === 'DOCS').length },
                  { name: 'MEMORY', icon: MemoryStick, count: searchResults.filter(r => r.source === 'MEMORY').length }
                ].map(source => (
                  <div key={source.name} className="p-2 rounded bg-card/30 border border-border/50 text-center">
                    <source.icon className="w-4 h-4 mx-auto mb-1 text-primary/70" />
                    <div className="text-[9px] font-mono text-foreground">{source.name}</div>
                    <div className="text-[10px] font-mono text-primary">{source.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

export default CognitiveSwarmPanel;
