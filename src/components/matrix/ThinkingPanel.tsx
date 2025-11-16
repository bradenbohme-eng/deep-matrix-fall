import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Brain, Cpu, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReasoningStep {
  step: number;
  phase: 'analysis' | 'research' | 'synthesis' | 'validation' | 'audit';
  thought: string;
  confidence: number;
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
      case 'analysis': return 'text-blue-400';
      case 'research': return 'text-green-400';
      case 'synthesis': return 'text-purple-400';
      case 'validation': return 'text-yellow-400';
      case 'audit': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
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
              <span className="text-sm font-mono text-primary">THINKING...</span>
            </>
          ) : (
            <>
              <Cpu className="w-5 h-5 text-primary" />
              <span className="text-sm font-mono text-foreground">
                {reasoning.length} REASONING CYCLES
              </span>
            </>
          )}
          {finalConfidence !== undefined && (
            <Badge variant="outline" className={`${getConfidenceColor(finalConfidence)} border-current`}>
              κ = {(finalConfidence * 100).toFixed(1)}%
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="border-t border-primary/20 p-4 space-y-4 max-h-96 overflow-y-auto">
          {reasoning.map((step, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${getPhaseColor(step.phase)}`}>
                  {getPhaseIcon(step.phase)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      STEP {step.step}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getPhaseColor(step.phase)} border-current`}>
                      {step.phase.toUpperCase()}
                    </Badge>
                    <span className={`text-xs font-mono ml-auto ${getConfidenceColor(step.confidence)}`}>
                      κ={(step.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground/80 font-mono">
                    {step.thought}
                  </p>

                  {step.subSteps && step.subSteps.length > 0 && (
                    <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                      {step.subSteps.map((subStep, subIdx) => (
                        <div key={subIdx} className="text-xs space-y-1">
                          <div className="text-primary/80 font-mono">→ {subStep.action}</div>
                          <div className="text-foreground/60 font-mono pl-3">
                            {subStep.result}
                          </div>
                          <div className={`font-mono pl-3 ${getConfidenceColor(subStep.confidence)}`}>
                            κ={(subStep.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.checks && step.checks.length > 0 && (
                    <div className="space-y-1">
                      {step.checks.map((check, checkIdx) => (
                        <div key={checkIdx} className="flex items-start gap-2 text-xs">
                          {check.passed ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-400 mt-0.5" />
                          )}
                          <div>
                            <span className="text-foreground/80 font-mono">
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
            <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
              <Brain className="w-4 h-4" />
              <span className="font-mono">Processing next reasoning cycle...</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
