import { useState, useCallback, useRef } from 'react';
import { AgentState, ToolCall, AgentMessage } from '@/components/matrix/AgentActivityPanel';
import { ReasoningPhase, ThoughtNode, ValidationCheck, GoalNode } from '@/components/matrix/DeepReasoningPanel';

// Default agents based on AIMOS architecture
const defaultAgents: AgentState[] = [
  {
    id: 'apoe-orchestrator',
    name: 'APOE Orchestrator',
    type: 'orchestrator',
    domain: 'orchestrator',
    status: 'idle',
    currentMode: 'GENERAL',
    confidence: 1.0,
    tokenBudget: 8000,
    tokensUsed: 0,
    lastActive: new Date()
  },
  {
    id: 'code-architect',
    name: 'CodeArchitectAgent',
    type: 'domain',
    domain: 'code',
    status: 'idle',
    currentMode: 'GENERAL',
    confidence: 0.9,
    tokenBudget: 4000,
    tokensUsed: 0,
    lastActive: new Date()
  },
  {
    id: 'memory-agent',
    name: 'MemoryAgent',
    type: 'domain',
    domain: 'memory',
    status: 'idle',
    currentMode: 'GENERAL',
    confidence: 0.95,
    tokenBudget: 4000,
    tokensUsed: 0,
    lastActive: new Date()
  },
  {
    id: 'research-agent',
    name: 'ResearchAgent',
    type: 'domain',
    domain: 'research',
    status: 'idle',
    currentMode: 'GENERAL',
    confidence: 0.85,
    tokenBudget: 4000,
    tokensUsed: 0,
    lastActive: new Date()
  },
  {
    id: 'security-agent',
    name: 'SecurityAgent',
    type: 'domain',
    domain: 'security',
    status: 'idle',
    currentMode: 'GENERAL',
    confidence: 0.9,
    tokenBudget: 3000,
    tokensUsed: 0,
    lastActive: new Date()
  },
  {
    id: 'meta-observer',
    name: 'MetaObserverAgent',
    type: 'meta',
    domain: 'meta',
    status: 'idle',
    currentMode: 'GENERAL',
    confidence: 0.95,
    tokenBudget: 2000,
    tokensUsed: 0,
    lastActive: new Date()
  }
];

export const useAIMOSReasoning = () => {
  const [agents, setAgents] = useState<AgentState[]>(defaultAgents);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [reasoningPhases, setReasoningPhases] = useState<ReasoningPhase[]>([]);
  const [goalHierarchy, setGoalHierarchy] = useState<GoalNode | undefined>();
  const [isReasoning, setIsReasoning] = useState(false);
  const [finalConfidence, setFinalConfidence] = useState<number | undefined>();
  const [totalTokens, setTotalTokens] = useState(0);
  const [reasoningDepth, setReasoningDepth] = useState(0);
  
  const messageIdCounter = useRef(0);
  const toolCallIdCounter = useRef(0);

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Simulate agent activity
  const activateAgent = useCallback((agentId: string, mode: string, task: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'processing', currentMode: mode, currentTask: task, lastActive: new Date() }
        : agent
    ));
  }, []);

  const deactivateAgent = useCallback((agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'idle', currentTask: undefined }
        : agent
    ));
  }, []);

  // Add agent message
  const addAgentMessage = useCallback((
    type: AgentMessage['type'],
    agentId: string,
    content: string,
    options?: { threadId?: string; mode?: string; confidence?: number }
  ) => {
    const agent = defaultAgents.find(a => a.id === agentId);
    const message: AgentMessage = {
      id: generateId('msg'),
      type,
      agentId,
      agentName: agent?.name || agentId,
      content,
      timestamp: new Date(),
      ...options
    };
    setAgentMessages(prev => [...prev.slice(-50), message]);
    return message;
  }, []);

  // Add tool call
  const addToolCall = useCallback((toolName: string, agentId: string, input: Record<string, any>) => {
    const call: ToolCall = {
      id: generateId('tool'),
      toolName,
      agentId,
      status: 'executing',
      input,
      startTime: new Date()
    };
    setToolCalls(prev => [...prev.slice(-20), call]);
    return call;
  }, []);

  // Complete tool call
  const completeToolCall = useCallback((callId: string, output: any, success: boolean = true) => {
    setToolCalls(prev => prev.map(call => 
      call.id === callId 
        ? { 
            ...call, 
            status: success ? 'completed' : 'failed', 
            output, 
            endTime: new Date(),
            duration: new Date().getTime() - call.startTime.getTime()
          }
        : call
    ));
  }, []);

  // Start reasoning process
  const startReasoning = useCallback((query: string, mode: string) => {
    setIsReasoning(true);
    setFinalConfidence(undefined);
    setTotalTokens(0);
    setReasoningDepth(0);
    
    // Initialize phases based on mode
    const phaseNames: ReasoningPhase['name'][] = mode === 'deep-think' 
      ? ['ANALYSIS', 'RESEARCH', 'SYNTHESIS', 'VALIDATION', 'AUDIT']
      : mode === 'planning'
      ? ['PLANNING', 'ANALYSIS', 'SYNTHESIS', 'VALIDATION']
      : ['ANALYSIS', 'SYNTHESIS', 'VALIDATION'];

    const phases: ReasoningPhase[] = phaseNames.map((name, idx) => ({
      id: generateId('phase'),
      name,
      status: idx === 0 ? 'active' : 'pending',
      confidence: 0,
      thoughts: []
    }));

    setReasoningPhases(phases);

    // Create goal hierarchy for planning mode
    if (mode === 'planning' || mode === 'deep-think') {
      setGoalHierarchy({
        level: 'T0',
        title: query.slice(0, 50) + (query.length > 50 ? '...' : ''),
        status: 'active',
        confidence: 0.5,
        children: [
          {
            level: 'T1',
            title: 'High-level analysis',
            status: 'pending',
            confidence: 0
          },
          {
            level: 'T2',
            title: 'Component breakdown',
            status: 'pending',
            confidence: 0
          }
        ]
      });
    }

    // Activate orchestrator
    activateAgent('apoe-orchestrator', mode.toUpperCase(), `Processing: ${query.slice(0, 30)}...`);
    addAgentMessage('TASK_PROPOSE', 'apoe-orchestrator', `Initiating ${mode} reasoning for: "${query.slice(0, 50)}..."`, {
      mode: mode.toUpperCase(),
      confidence: 0.5
    });

    return phases[0].id;
  }, [activateAgent, addAgentMessage]);

  // Add thought to current phase
  const addThought = useCallback((phaseId: string, thought: Omit<ThoughtNode, 'id'>) => {
    const thoughtNode: ThoughtNode = {
      id: generateId('thought'),
      ...thought
    };

    setReasoningPhases(prev => prev.map(phase => 
      phase.id === phaseId 
        ? { ...phase, thoughts: [...phase.thoughts, thoughtNode] }
        : phase
    ));

    setReasoningDepth(d => d + 1);
    setTotalTokens(t => t + Math.floor(Math.random() * 200) + 100);

    return thoughtNode;
  }, []);

  // Progress to next phase
  const advancePhase = useCallback((currentPhaseId: string, confidence: number, validationChecks?: ValidationCheck[]) => {
    setReasoningPhases(prev => {
      const currentIdx = prev.findIndex(p => p.id === currentPhaseId);
      if (currentIdx === -1) return prev;

      return prev.map((phase, idx) => {
        if (idx === currentIdx) {
          return { 
            ...phase, 
            status: 'completed', 
            confidence,
            validationChecks,
            endTime: new Date()
          };
        }
        if (idx === currentIdx + 1) {
          return { ...phase, status: 'active', startTime: new Date() };
        }
        return phase;
      });
    });

    // Update goal hierarchy confidence
    setGoalHierarchy(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        confidence: Math.min(1, prev.confidence + 0.15),
        children: prev.children?.map((child, idx) => ({
          ...child,
          status: idx === 0 ? 'completed' : idx === 1 ? 'active' : 'pending',
          confidence: idx === 0 ? confidence : child.confidence
        }))
      };
    });
  }, []);

  // Complete reasoning
  const completeReasoning = useCallback((finalConf: number) => {
    setIsReasoning(false);
    setFinalConfidence(finalConf);
    
    // Complete all phases
    setReasoningPhases(prev => prev.map(phase => ({
      ...phase,
      status: 'completed',
      confidence: phase.confidence || finalConf
    })));

    // Complete goal hierarchy
    setGoalHierarchy(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'completed',
        confidence: finalConf,
        children: prev.children?.map(child => ({
          ...child,
          status: 'completed',
          confidence: finalConf
        }))
      };
    });

    // Deactivate all agents
    defaultAgents.forEach(agent => deactivateAgent(agent.id));

    addAgentMessage('TASK_COMPLETE', 'apoe-orchestrator', `Reasoning complete. Final confidence: ${(finalConf * 100).toFixed(1)}%`, {
      confidence: finalConf
    });
  }, [deactivateAgent, addAgentMessage]);

  // Reset state
  const resetReasoning = useCallback(() => {
    setAgents(defaultAgents);
    setToolCalls([]);
    setAgentMessages([]);
    setReasoningPhases([]);
    setGoalHierarchy(undefined);
    setIsReasoning(false);
    setFinalConfidence(undefined);
    setTotalTokens(0);
    setReasoningDepth(0);
  }, []);

  return {
    // State
    agents,
    toolCalls,
    agentMessages,
    reasoningPhases,
    goalHierarchy,
    isReasoning,
    finalConfidence,
    totalTokens,
    reasoningDepth,
    
    // Actions
    activateAgent,
    deactivateAgent,
    addAgentMessage,
    addToolCall,
    completeToolCall,
    startReasoning,
    addThought,
    advancePhase,
    completeReasoning,
    resetReasoning
  };
};
