import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronDown, ChevronUp, Brain, Cpu, Search, CheckCircle2, 
  AlertCircle, Network, Users, Zap, Shield, Target, 
  GitBranch, Layers, Eye, Lightbulb, Scale, Clock
} from 'lucide-react';

export interface ReasoningPhase {
  id: string;
  name: 'ANALYSIS' | 'RESEARCH' | 'SYNTHESIS' | 'VALIDATION' | 'AUDIT' | 'PLANNING' | 'EXECUTION';
  status: 'pending' | 'active' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  confidence: number;
  thoughts: ThoughtNode[];
  validationChecks?: ValidationCheck[];
}

export interface ThoughtNode {
  id: string;
  type: 'hypothesis' | 'evidence' | 'inference' | 'conclusion' | 'question' | 'contradiction';
  content: string;
  confidence: number;
  sourceRefs?: string[];
  children?: ThoughtNode[];
  agentId?: string;
  agentName?: string;
}

export interface ValidationCheck {
  id: string;
  type: 'factual' | 'logical' | 'consistency' | 'completeness' | 'safety';
  name: string;
  passed: boolean;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

export interface GoalNode {
  level: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  title: string;
  status: 'pending' | 'active' | 'completed';
  confidence: number;
  children?: GoalNode[];
}

interface DeepReasoningPanelProps {
  phases: ReasoningPhase[];
  goalHierarchy?: GoalNode;
  isThinking: boolean;
  finalConfidence?: number;
  totalTokensUsed?: number;
  reasoningDepth?: number;
}

const phaseIcons: Record<string, any> = {
  ANALYSIS: Brain,
  RESEARCH: Search,
  SYNTHESIS: Cpu,
  VALIDATION: CheckCircle2,
  AUDIT: Shield,
  PLANNING: Target,
  EXECUTION: Zap
};

const phaseColors: Record<string, string> = {
  ANALYSIS: 'text-blue-400 border-blue-400/30 bg-blue-500/10',
  RESEARCH: 'text-green-400 border-green-400/30 bg-green-500/10',
  SYNTHESIS: 'text-purple-400 border-purple-400/30 bg-purple-500/10',
  VALIDATION: 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10',
  AUDIT: 'text-red-400 border-red-400/30 bg-red-500/10',
  PLANNING: 'text-cyan-400 border-cyan-400/30 bg-cyan-500/10',
  EXECUTION: 'text-orange-400 border-orange-400/30 bg-orange-500/10'
};

const thoughtTypeIcons: Record<string, any> = {
  hypothesis: Lightbulb,
  evidence: Eye,
  inference: GitBranch,
  conclusion: CheckCircle2,
  question: Search,
  contradiction: AlertCircle
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.85) return 'text-green-400';
  if (confidence >= 0.6) return 'text-yellow-400';
  return 'text-red-400';
};

const GoalHierarchyDisplay: React.FC<{ node: GoalNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  
  return (
    <div className={`ml-${depth * 4}`}>
      <div 
        className="flex items-center gap-2 py-1 cursor-pointer hover:bg-primary/5 rounded px-2"
        onClick={() => setExpanded(!expanded)}
      >
        {node.children && node.children.length > 0 && (
          expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
        )}
        <Badge variant="outline" className={`text-[9px] font-mono ${
          node.status === 'completed' ? 'border-green-500/30 text-green-400' :
          node.status === 'active' ? 'border-yellow-500/30 text-yellow-400' :
          'border-gray-500/30 text-gray-400'
        }`}>
          {node.level}
        </Badge>
        <span className="text-xs font-mono text-foreground/80 flex-1">{node.title}</span>
        <span className={`text-[9px] font-mono ${getConfidenceColor(node.confidence)}`}>
          {Math.round(node.confidence * 100)}%
        </span>
      </div>
      {expanded && node.children && (
        <div className="border-l border-primary/20 ml-4">
          {node.children.map((child, idx) => (
            <GoalHierarchyDisplay key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const DeepReasoningPanel: React.FC<DeepReasoningPanelProps> = ({
  phases,
  goalHierarchy,
  isThinking,
  finalConfidence,
  totalTokensUsed,
  reasoningDepth
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activePhaseView, setActivePhaseView] = useState<string | null>(null);

  const completedPhases = phases.filter(p => p.status === 'completed');
  const activePhase = phases.find(p => p.status === 'active');

  if (phases.length === 0 && !isThinking) return null;

  return (
    <Card className="mb-4 bg-black/60 border-primary/30 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-primary/5 transition-colors border-b border-primary/20"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isThinking ? (
            <>
              <Brain className="w-6 h-6 text-primary animate-pulse" />
              <div className="flex flex-col">
                <span className="text-sm font-mono text-primary font-semibold">
                  DEEP REASONING ACTIVE
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {activePhase ? `Phase: ${activePhase.name}` : 'Initializing cognitive processes...'}
                </span>
              </div>
            </>
          ) : (
            <>
              <Cpu className="w-6 h-6 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-mono text-foreground font-semibold">
                  REASONING COMPLETE
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {completedPhases.length} phases | {reasoningDepth || 0} depth levels
                </span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {finalConfidence !== undefined && (
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary/60" />
              <Badge variant="outline" className={`font-mono ${getConfidenceColor(finalConfidence)} border-current`}>
                κ = {(finalConfidence * 100).toFixed(1)}%
              </Badge>
            </div>
          )}
          {totalTokensUsed && (
            <Badge variant="outline" className="text-xs font-mono border-primary/30">
              {totalTokensUsed.toLocaleString()} tokens
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-primary/20">
          {/* Phase Progress Bar */}
          <div className="p-4 border-b border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-primary/60" />
              <span className="text-xs font-mono text-foreground/80">PHASE PROGRESSION</span>
            </div>
            <div className="flex gap-1">
              {phases.map((phase) => {
                const IconComponent = phaseIcons[phase.name] || Brain;
                return (
                  <div 
                    key={phase.id}
                    className={`flex-1 p-2 rounded cursor-pointer transition-all ${phaseColors[phase.name]} ${
                      phase.status === 'active' ? 'ring-2 ring-primary/50' : ''
                    } ${phase.status === 'pending' ? 'opacity-40' : ''}`}
                    onClick={() => setActivePhaseView(activePhaseView === phase.id ? null : phase.id)}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <IconComponent className={`w-4 h-4 ${phase.status === 'active' ? 'animate-pulse' : ''}`} />
                      <span className="text-[10px] font-mono hidden sm:inline">{phase.name}</span>
                    </div>
                    {phase.status !== 'pending' && (
                      <Progress 
                        value={phase.status === 'completed' ? 100 : 50} 
                        className="h-1 mt-1"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goal Hierarchy (if available) */}
          {goalHierarchy && (
            <div className="p-4 border-b border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-foreground/80">GOAL DECOMPOSITION (T0→T6)</span>
              </div>
              <div className="bg-black/40 rounded p-2 border border-primary/10">
                <GoalHierarchyDisplay node={goalHierarchy} />
              </div>
            </div>
          )}

          {/* Active Phase Details */}
          <ScrollArea className="max-h-[400px]">
            <div className="p-4 space-y-4">
              {phases.filter(p => activePhaseView ? p.id === activePhaseView : p.status !== 'pending').map((phase) => (
                <div key={phase.id} className={`rounded-lg p-3 border ${phaseColors[phase.name]}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {React.createElement(phaseIcons[phase.name] || Brain, { 
                        className: `w-5 h-5 ${phase.status === 'active' ? 'animate-pulse' : ''}` 
                      })}
                      <span className="text-sm font-mono font-semibold">{phase.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {phase.status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className={`text-xs font-mono ${getConfidenceColor(phase.confidence)}`}>
                      κ={Math.round(phase.confidence * 100)}%
                    </span>
                  </div>

                  {/* Thought Nodes */}
                  {phase.thoughts.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {phase.thoughts.map((thought) => {
                        const ThoughtIcon = thoughtTypeIcons[thought.type] || Brain;
                        return (
                          <div key={thought.id} className="flex items-start gap-2 p-2 rounded bg-black/30">
                            <ThoughtIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[9px] font-mono">
                                  {thought.type}
                                </Badge>
                                {thought.agentName && (
                                  <span className="text-[9px] text-muted-foreground font-mono">
                                    via {thought.agentName}
                                  </span>
                                )}
                                <span className={`text-[9px] font-mono ml-auto ${getConfidenceColor(thought.confidence)}`}>
                                  {Math.round(thought.confidence * 100)}%
                                </span>
                              </div>
                              <p className="text-xs font-mono text-foreground/90 leading-relaxed">
                                {thought.content}
                              </p>
                              {thought.sourceRefs && thought.sourceRefs.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {thought.sourceRefs.map((ref, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[8px] font-mono">
                                      ref://{ref}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Validation Checks */}
                  {phase.validationChecks && phase.validationChecks.length > 0 && (
                    <div className="space-y-1 border-t border-current/20 pt-2 mt-2">
                      <div className="text-[10px] font-mono text-foreground/60 mb-1">VALIDATION CHECKS:</div>
                      {phase.validationChecks.map((check) => (
                        <div key={check.id} className="flex items-center gap-2 text-[10px] font-mono">
                          {check.passed ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                          ) : (
                            <AlertCircle className={`w-3 h-3 ${
                              check.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                            }`} />
                          )}
                          <span className={check.passed ? 'text-green-300' : 'text-red-300'}>
                            [{check.type}] {check.name}
                          </span>
                          <span className="text-muted-foreground truncate flex-1">
                            {check.details}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Active Thinking Indicator */}
              {isThinking && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <Brain className="w-5 h-5 text-primary animate-pulse" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-primary">Processing next reasoning cycle...</span>
                      <Network className="w-4 h-4 text-cyan-400 animate-pulse" />
                    </div>
                    <Progress value={undefined} className="h-1 mt-2" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
};
