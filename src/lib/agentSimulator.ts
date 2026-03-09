// Agent Simulation Engine — Generates plausible agent activity traces
// Runs alongside real AI chat to create cognitive transparency visualization

export type AgentRole = 'planner' | 'researcher' | 'verifier' | 'auditor' | 'executor' | 'inquisitor' | 'forecaster';
export type ReasoningPhase = 'analysis' | 'research' | 'synthesis' | 'validation' | 'audit' | 'crucible' | 'forecast';
export type ThinkingDepth = 'shallow' | 'medium' | 'deep';

export interface AgentState {
  id: string;
  role: AgentRole;
  name: string;
  status: 'idle' | 'active' | 'waiting' | 'complete';
  currentTask: string;
  confidence: number;
  tokensUsed: number;
  threadId: string;
  startedAt: number;
}

export interface ReasoningStep {
  id: string;
  phase: ReasoningPhase;
  thought: string;
  confidence: number;
  agents: AgentRole[];
  timestamp: number;
  duration: number;
  evidenceRefs: string[];
}

export interface GoalNode {
  id: string;
  level: number; // T0-T6
  label: string;
  status: 'pending' | 'active' | 'complete';
  children: GoalNode[];
  confidence: number;
}

export interface MemoryQuery {
  id: string;
  system: 'CMC' | 'SEG' | 'HHNI' | 'VIF';
  operation: 'QUERY' | 'STORE' | 'LINK' | 'VALIDATE';
  target: string;
  result: string;
  timestamp: number;
  latencyMs: number;
}

export interface SwarmState {
  agents: AgentState[];
  reasoningSteps: ReasoningStep[];
  goalTree: GoalNode;
  memoryOps: MemoryQuery[];
  overallConfidence: number;
  isActive: boolean;
  startedAt: number;
}

const AGENT_DEFS: { role: AgentRole; name: string }[] = [
  { role: 'planner', name: 'Planner' },
  { role: 'researcher', name: 'Researcher' },
  { role: 'verifier', name: 'Verifier' },
  { role: 'auditor', name: 'Auditor' },
  { role: 'executor', name: 'Executor' },
  { role: 'inquisitor', name: 'Inquisitor' },
  { role: 'forecaster', name: 'Forecaster' },
];

const REASONING_TEMPLATES: Record<ReasoningPhase, string[]> = {
  analysis: [
    'Decomposing query into sub-objectives...',
    'Identifying key entities and constraints...',
    'Mapping query intent to operational mode...',
    'Extracting pinned constraints from context memory...',
    'Cross-referencing with active task dependencies...',
  ],
  research: [
    'Querying evidence graph for related knowledge...',
    'Retrieving relevant memory atoms from CMC...',
    'Scanning tag hierarchy for contextual anchors...',
    'Gathering source references for verification...',
    'Searching for contradicting evidence patterns...',
  ],
  synthesis: [
    'Merging evidence streams into coherent response...',
    'Applying confidence weighting to source materials...',
    'Generating structured output with citation links...',
    'Balancing depth vs. conciseness for response format...',
    'Integrating multi-agent perspectives into unified view...',
  ],
  validation: [
    'Running schema validation on output structure...',
    'Checking for contradictions against known facts...',
    'Verifying confidence thresholds (VIF gate check)...',
    'Cross-validating agent consensus on key claims...',
    'Applying hallucination detection heuristics...',
  ],
  audit: [
    'Final quality gate: coherence score assessment...',
    'Recording reasoning chain for future retrieval...',
    'Logging confidence metrics to consciousness tracker...',
    'Archiving evidence graph connections used...',
    'Updating agent performance metrics...',
  ],
};

const MEMORY_TARGETS: Record<string, string[]> = {
  CMC: ['constraint:schema-json', 'context:active-tasks', 'memory:user-prefs', 'context:budget-state'],
  SEG: ['e-graph:47→48', 'evidence:word-limit', 'link:task-dep-chain', 'evidence:confidence-history'],
  HHNI: ['tag:orchestration/tasks', 'tag:reasoning/deep', 'tag:memory/persistence', 'hierarchy:project-scope'],
  VIF: ['check:schema-valid', 'check:contradiction-scan', 'gate:confidence-threshold', 'check:hallucination'],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function estimateComplexity(query: string): ThinkingDepth {
  const words = query.split(/\s+/).length;
  if (words > 30 || /explain|analyze|compare|architecture|design|plan/i.test(query)) return 'deep';
  if (words > 12 || /how|why|what.*should|implement/i.test(query)) return 'medium';
  return 'shallow';
}

export function createSwarmSimulation(query: string): {
  getState: () => SwarmState;
  tick: () => boolean; // returns false when complete
  reset: () => void;
} {
  const complexity = estimateComplexity(query);
  const phaseCount = complexity === 'deep' ? 5 : complexity === 'medium' ? 4 : 3;
  const phases: ReasoningPhase[] = ['analysis', 'research', 'synthesis', 'validation', 'audit'].slice(0, phaseCount) as ReasoningPhase[];

  const now = Date.now();
  let tickCount = 0;
  const totalTicks = phaseCount * 8; // ~8 ticks per phase

  const agents: AgentState[] = AGENT_DEFS.map(d => ({
    id: `agent-${d.role}`,
    role: d.role,
    name: d.name,
    status: 'idle' as const,
    currentTask: '',
    confidence: 0.5 + Math.random() * 0.3,
    tokensUsed: 0,
    threadId: `thread-${d.role}-${now}`,
    startedAt: now,
  }));

  const goalTree: GoalNode = {
    id: 'T0', level: 0, label: 'Process Query', status: 'active', confidence: 0,
    children: [
      {
        id: 'T1', level: 1, label: 'Understand Intent', status: 'pending', confidence: 0,
        children: [
          { id: 'T2a', level: 2, label: 'Parse Entities', status: 'pending', confidence: 0, children: [] },
          { id: 'T2b', level: 2, label: 'Map Constraints', status: 'pending', confidence: 0, children: [] },
        ],
      },
      {
        id: 'T1b', level: 1, label: 'Generate Response', status: 'pending', confidence: 0,
        children: [
          { id: 'T2c', level: 2, label: 'Gather Evidence', status: 'pending', confidence: 0, children: [] },
          { id: 'T2d', level: 2, label: 'Synthesize Answer', status: 'pending', confidence: 0, children: [] },
        ],
      },
      { id: 'T1c', level: 1, label: 'Validate Output', status: 'pending', confidence: 0, children: [] },
    ],
  };

  const reasoningSteps: ReasoningStep[] = [];
  const memoryOps: MemoryQuery[] = [];
  let overallConfidence = 0;
  let isActive = true;

  function getCurrentPhaseIndex(): number {
    return Math.min(Math.floor(tickCount / 8), phases.length - 1);
  }

  function tick(): boolean {
    if (!isActive) return false;
    tickCount++;

    const phaseIdx = getCurrentPhaseIndex();
    const phase = phases[phaseIdx];
    const progress = tickCount / totalTicks;

    // Update agent states based on phase
    const phaseAgentMap: Record<ReasoningPhase, AgentRole[]> = {
      analysis: ['planner', 'researcher'],
      research: ['researcher', 'executor'],
      synthesis: ['planner', 'executor'],
      validation: ['verifier'],
      audit: ['auditor', 'verifier'],
    };

    const activeRoles = phaseAgentMap[phase] || ['planner'];
    agents.forEach(a => {
      if (activeRoles.includes(a.role)) {
        a.status = 'active';
        a.currentTask = `${phase}: ${pickRandom(REASONING_TEMPLATES[phase])}`.slice(0, 60);
        a.tokensUsed += Math.floor(Math.random() * 50 + 10);
        a.confidence = Math.min(0.99, a.confidence + (Math.random() * 0.05));
      } else if (progress > 0.8) {
        a.status = 'complete';
      } else {
        a.status = 'waiting';
        a.currentTask = '';
      }
    });

    // Generate reasoning step at phase boundaries
    if (tickCount % 8 === 1 && phaseIdx < phases.length) {
      const step: ReasoningStep = {
        id: `step-${reasoningSteps.length + 1}`,
        phase,
        thought: pickRandom(REASONING_TEMPLATES[phase]),
        confidence: 0.7 + Math.random() * 0.25,
        agents: activeRoles,
        timestamp: Date.now(),
        duration: 200 + Math.floor(Math.random() * 600),
        evidenceRefs: [`ref-${Math.floor(Math.random() * 100)}`],
      };
      reasoningSteps.push(step);
    }

    // Generate memory ops periodically
    if (tickCount % 3 === 0) {
      const systems: ('CMC' | 'SEG' | 'HHNI' | 'VIF')[] = ['CMC', 'SEG', 'HHNI', 'VIF'];
      const sys = pickRandom(systems);
      const ops: ('QUERY' | 'STORE' | 'LINK' | 'VALIDATE')[] = ['QUERY', 'STORE', 'LINK', 'VALIDATE'];
      memoryOps.push({
        id: `mem-${memoryOps.length}`,
        system: sys,
        operation: pickRandom(ops),
        target: pickRandom(MEMORY_TARGETS[sys]),
        result: `${Math.floor(Math.random() * 12 + 1)} results`,
        timestamp: Date.now(),
        latencyMs: Math.floor(Math.random() * 30 + 5),
      });
    }

    // Update goal tree progress
    const updateGoals = (node: GoalNode, depth: number) => {
      if (progress > (depth * 0.2)) {
        node.status = progress > (depth * 0.2 + 0.2) ? 'complete' : 'active';
        node.confidence = Math.min(0.98, 0.5 + progress * 0.5);
      }
      node.children.forEach(c => updateGoals(c, depth + 1));
    };
    updateGoals(goalTree, 0);

    overallConfidence = 0.5 + progress * 0.45;

    if (tickCount >= totalTicks) {
      isActive = false;
      agents.forEach(a => { a.status = 'complete'; a.currentTask = 'Done'; });
      goalTree.status = 'complete';
      goalTree.confidence = overallConfidence;
    }

    return isActive;
  }

  function getState(): SwarmState {
    return {
      agents: [...agents],
      reasoningSteps: [...reasoningSteps],
      goalTree: { ...goalTree },
      memoryOps: [...memoryOps],
      overallConfidence,
      isActive,
      startedAt: now,
    };
  }

  function reset() {
    tickCount = 0;
    isActive = true;
    reasoningSteps.length = 0;
    memoryOps.length = 0;
    overallConfidence = 0;
    agents.forEach(a => { a.status = 'idle'; a.currentTask = ''; a.tokensUsed = 0; a.confidence = 0.5 + Math.random() * 0.3; });
  }

  return { getState, tick, reset };
}
