import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Brain, Cpu, Search, CheckCircle2, AlertCircle, Network, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AgentActivity {
  agent_id: string;
  agent_name: string;
  mode: string;
  action: string;
  timestamp: string;
}

interface ReasoningStep {
  step: number;
  phase: 'analysis' | 'research' | 'synthesis' | 'validation' | 'audit';
  thought: string;
  confidence: number;
  agents?: AgentActivity[];
  thread_id?: string;
  subSteps?: Array<{
    action: string;
    result: string;
    confidence: number;
  }>;
  checks?: Array<{
    type: string;
    passed: boolean;
    details: string;
  }>;
}

interface ThinkingPanelProps {
  reasoning: ReasoningStep[];
  isThinking: boolean;
  finalConfidence?: number;
}

export const ThinkingPanel: React.FC<ThinkingPanelProps> = ({ 
  reasoning, 
  isThinking,
  finalConfidence 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'analysis': return <Brain className="w-4 h-4" />;
      case 'research': return <Search className="w-4 h-4" />;
      case 'synthesis': return <Cpu className="w-4 h-4" />;
      case 'validation': return <CheckCircle2 className="w-4 h-4" />;
      case 'audit': return <AlertCircle className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'analysis': return 'text-blue-400 border-blue-400/30';
      case 'research': return 'text-green-400 border-green-400/30';
      case 'synthesis': return 'text-purple-400 border-purple-400/30';
      case 'validation': return 'text-yellow-400 border-yellow-400/30';
      case 'audit': return 'text-red-400 border-red-400/30';
      default: return 'text-gray-400 border-gray-400/30';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-green-400 border-green-400/30';
    if (confidence >= 0.6) return 'text-yellow-400 border-yellow-400/30';
    return 'text-red-400 border-red-400/30';
  };

  if (reasoning.length === 0 && !isThinking) return null;

  return (
    <Card className="mb-4 bg-black/40 border-primary/20 backdrop-blur-sm overflow-hidden">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isThinking ? (
            <>
              <Brain className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-sm font-mono text-primary">THINKING... APOE COORDINATING AGENTS</span>
            </>
          ) : (
            <>
              <Cpu className="w-5 h-5 text-primary" />
              <span className="text-sm font-mono text-foreground">
                {reasoning.length} REASONING CYCLES | APOE ORCHESTRATED
              </span>
            </>
          )}
          {finalConfidence !== undefined && (
            <Badge variant="outline" className={`${getConfidenceColor(finalConfidence)} border-current font-mono`}>
              κ = {(finalConfidence * 100).toFixed(1)}%
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="border-t border-primary/20 p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {reasoning.map((step, idx) => (
            <div key={idx} className="space-y-3 border border-primary/10 rounded-lg p-3 bg-black/20">
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${getPhaseColor(step.phase)}`}>
                  {getPhaseIcon(step.phase)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-mono">
                      STEP {step.step}
                    </Badge>
                    <Badge variant="outline" className={`text-xs font-mono ${getPhaseColor(step.phase)} border-current`}>
                      {step.phase.toUpperCase()}
                    </Badge>
                    <span className={`text-xs font-mono ml-auto ${getConfidenceColor(step.confidence)}`}>
                      κ={(step.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground/90 font-mono leading-relaxed">
                    {step.thought}
                  </p>

                  {/* Agent Coordination Display */}
                  {step.agents && step.agents.length > 0 && (
                    <div className="pl-4 border-l-2 border-cyan-500/30 space-y-2 mt-3">
                      <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                        <Network className="w-3 h-3" />
                        <Users className="w-3 h-3" />
                        <span>Agent Coordination ({step.agents.length} active)</span>
                      </div>
                      {step.agents.map((agent, agentIdx) => (
                        <div key={agentIdx} className="flex items-center gap-2 text-xs font-mono">
                          <Badge variant="secondary" className="text-[10px]">
                            {agent.agent_name}
                          </Badge>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-cyan-400">{agent.mode}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-foreground/70">{agent.action}</span>
                        </div>
                      ))}
                      {step.thread_id && (
                        <div className="text-[10px] text-muted-foreground font-mono mt-1">
                          Thread: <span className="text-primary">{step.thread_id}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-steps */}
                  {step.subSteps && step.subSteps.length > 0 && (
                    <div className="pl-4 border-l-2 border-primary/20 space-y-2 mt-3">
                      <div className="text-primary/80 font-semibold text-xs">Sub-steps:</div>
                      {step.subSteps.map((subStep, subIdx) => (
                        <div key={subIdx} className="text-xs space-y-1 font-mono">
                          <div className="text-primary/80">→ {subStep.action}</div>
                          <div className="text-foreground/60 pl-3">{subStep.result}</div>
                          <div className={`pl-3 ${getConfidenceColor(subStep.confidence)}`}>
                            κ={(subStep.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Validation Checks */}
                  {step.checks && step.checks.length > 0 && (
                    <div className="space-y-1 mt-3">
                      <div className="text-green-400 font-semibold text-xs">Validation:</div>
                      {step.checks.map((check, checkIdx) => (
                        <div key={checkIdx} className="flex items-start gap-2 text-xs font-mono">
                          {check.passed ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <span className={check.passed ? "text-green-300" : "text-red-300"}>
                              {check.type}:
                            </span>
                            <span className="text-foreground/60 ml-2">
                              {check.details}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-sm text-primary animate-pulse font-mono">
              <Brain className="w-4 h-4" />
              <Network className="w-4 h-4" />
              <span>Processing next reasoning cycle with agent swarm...</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
