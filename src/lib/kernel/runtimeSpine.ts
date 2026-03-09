// Runtime Spine — Canonical 7-Layer Processing Pipeline
// Reference: AIOS Master Index §30–39
//
// Every user interaction flows through this spine:
//   1. Intake          — Parse input, classify modality, extract signals
//   2. Interpretation  — Determine intent, mode, depth, urgency
//   3. Deliberation    — Plan approach: single-shot vs multi-step, agents needed?
//   4. Context Assembly — Gather relevant memory, artifacts, constraints
//   5. Execution Routing — Route to model/agent/tool with prepared context
//   6. Synthesis       — Merge results, apply persona, verify quality
//   7. Persistence     — Write memory proposals, update state, log journal

import { makeId } from '../contracts/ids';
import { EventTopics, type EventTopic, type EventEnvelope } from '../contracts/events';
import type { InteractionMode, CognitiveRegime, RiskClass, MemoryType } from '../contracts/enums';

// ============================================================================
// SPINE TYPES
// ============================================================================

export interface SpineInput {
  sessionId: string;
  userId: string;
  content: string;
  mode?: InteractionMode;
  attachments?: SpineAttachment[];
  conversationHistory?: ConversationTurn[];
  metadata?: Record<string, unknown>;
}

export interface SpineAttachment {
  type: 'file' | 'image' | 'code' | 'url';
  content: string;
  name?: string;
  mimeType?: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface SpineOutput {
  traceId: string;
  response: string;
  confidence: number;
  mode: InteractionMode;
  regime: CognitiveRegime;
  memoryProposals: MemoryProposal[];
  retrievedMemoryIds: string[];
  toolsUsed: string[];
  durationMs: number;
  stages: SpineStageResult[];
  journalEntry: JournalEntry;
}

export interface SpineStageResult {
  stage: SpineStageName;
  durationMs: number;
  output: Record<string, unknown>;
  confidence?: number;
}

export type SpineStageName =
  | 'intake'
  | 'interpretation'
  | 'deliberation'
  | 'context_assembly'
  | 'execution_routing'
  | 'synthesis'
  | 'persistence';

export interface MemoryProposal {
  memoryType: MemoryType;
  content: string;
  confidence: number;
  importance: number;
  rationale: string;
  proposedBy: string;
  tags?: string[];
}

export interface JournalEntry {
  traceId: string;
  sessionId: string;
  stages: SpineStageName[];
  totalDurationMs: number;
  mode: InteractionMode;
  regime: CognitiveRegime;
  confidence: number;
  memoryProposalCount: number;
  retrievalCount: number;
}

// ============================================================================
// STAGE INTERFACES
// ============================================================================

export interface IntakeResult {
  inputType: 'text' | 'multimodal' | 'command' | 'continuation';
  contentLength: number;
  detectedLanguage: string;
  hasAttachments: boolean;
  signals: IntakeSignal[];
  sanitizedContent: string;
}

export interface IntakeSignal {
  type: 'question' | 'instruction' | 'correction' | 'reference' | 'emotion' | 'urgency';
  value: string;
  confidence: number;
}

export interface InterpretationResult {
  intent: string;
  mode: InteractionMode;
  regime: CognitiveRegime;
  depth: 'shallow' | 'moderate' | 'deep' | 'exhaustive';
  urgency: 'low' | 'normal' | 'high' | 'critical';
  requiresRetrieval: boolean;
  requiresTools: boolean;
  requiresAgents: boolean;
  topicTags: string[];
  riskClass: RiskClass;
}

export interface DeliberationResult {
  approach: 'single_shot' | 'multi_step' | 'agent_swarm' | 'tool_chain';
  steps: DeliberationStep[];
  agentsNeeded: string[];
  toolsNeeded: string[];
  estimatedTokens: number;
  confidenceTarget: number;
}

export interface DeliberationStep {
  id: string;
  action: string;
  agent?: string;
  tool?: string;
  dependsOn?: string[];
}

export interface ContextAssemblyResult {
  pinnedConstraints: string[];
  retrievedMemories: RetrievedMemory[];
  projectContext: string[];
  recentHistory: string[];
  totalTokens: number;
  contextQuality: number; // 0–1
}

export interface RetrievedMemory {
  id: string;
  content: string;
  memoryType: string;
  confidence: number;
  relevanceScore: number;
  tokens: number;
}

export interface ExecutionRoutingResult {
  model: string;
  systemPrompt: string;
  contextPacket: string;
  userPrompt: string;
  toolResults?: Record<string, unknown>[];
  agentOutputs?: Record<string, string>;
  rawResponse: string;
  tokensUsed: number;
}

export interface SynthesisResult {
  finalResponse: string;
  confidence: number;
  rhetoricalEntropy: number;
  blandnessScore: number;
  sourcesUsed: string[];
  cruciblePassed: boolean;
  iterationsNeeded: number;
}

export interface PersistenceResult {
  memoryProposals: MemoryProposal[];
  journalWritten: boolean;
  stateUpdated: boolean;
  entityExtractions: number;
}

// ============================================================================
// RUNTIME SPINE CLASS
// ============================================================================

export type StageProcessor<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

export interface SpineHooks {
  onStageStart?: (stage: SpineStageName) => void;
  onStageComplete?: (stage: SpineStageName, result: SpineStageResult) => void;
  onEvent?: (event: EventEnvelope) => void;
  onError?: (stage: SpineStageName, error: Error) => void;
}

export class RuntimeSpine {
  private hooks: SpineHooks;
  private stages: Map<SpineStageName, StageProcessor<any, any>> = new Map();

  constructor(hooks: SpineHooks = {}) {
    this.hooks = hooks;
    this.registerDefaultStages();
  }

  // --------------------------------------------------------------------------
  // Stage Registration
  // --------------------------------------------------------------------------

  registerStage<TInput, TOutput>(
    stage: SpineStageName,
    processor: StageProcessor<TInput, TOutput>
  ): void {
    this.stages.set(stage, processor);
  }

  // --------------------------------------------------------------------------
  // Main Execution
  // --------------------------------------------------------------------------

  async process(input: SpineInput): Promise<SpineOutput> {
    const traceId = makeId('spine');
    const startTime = Date.now();
    const stageResults: SpineStageResult[] = [];

    this.emitEvent(EventTopics.SPINE_INTAKE, { traceId, input: { contentLength: input.content.length } });

    try {
      // Stage 1: Intake
      const intake = await this.runStage<SpineInput, IntakeResult>('intake', input, stageResults);

      // Stage 2: Interpretation
      const interpretation = await this.runStage<IntakeResult & { input: SpineInput }, InterpretationResult>(
        'interpretation', { ...intake, input }, stageResults
      );

      // Stage 3: Deliberation
      const deliberation = await this.runStage<InterpretationResult, DeliberationResult>(
        'deliberation', interpretation, stageResults
      );

      // Stage 4: Context Assembly
      const context = await this.runStage<
        { interpretation: InterpretationResult; deliberation: DeliberationResult; input: SpineInput },
        ContextAssemblyResult
      >('context_assembly', { interpretation, deliberation, input }, stageResults);

      // Stage 5: Execution Routing
      const execution = await this.runStage<
        { context: ContextAssemblyResult; deliberation: DeliberationResult; interpretation: InterpretationResult; input: SpineInput },
        ExecutionRoutingResult
      >('execution_routing', { context, deliberation, interpretation, input }, stageResults);

      // Stage 6: Synthesis
      const synthesis = await this.runStage<
        { execution: ExecutionRoutingResult; context: ContextAssemblyResult; interpretation: InterpretationResult },
        SynthesisResult
      >('synthesis', { execution, context, interpretation }, stageResults);

      // Stage 7: Persistence
      const persistence = await this.runStage<
        { synthesis: SynthesisResult; execution: ExecutionRoutingResult; interpretation: InterpretationResult; input: SpineInput },
        PersistenceResult
      >('persistence', { synthesis, execution, interpretation, input }, stageResults);

      const totalDurationMs = Date.now() - startTime;

      const journalEntry: JournalEntry = {
        traceId,
        sessionId: input.sessionId,
        stages: stageResults.map(s => s.stage),
        totalDurationMs,
        mode: interpretation.mode,
        regime: interpretation.regime,
        confidence: synthesis.confidence,
        memoryProposalCount: persistence.memoryProposals.length,
        retrievalCount: context.retrievedMemories.length,
      };

      const output: SpineOutput = {
        traceId,
        response: synthesis.finalResponse,
        confidence: synthesis.confidence,
        mode: interpretation.mode,
        regime: interpretation.regime,
        memoryProposals: persistence.memoryProposals,
        retrievedMemoryIds: context.retrievedMemories.map(m => m.id),
        toolsUsed: deliberation.toolsNeeded,
        durationMs: totalDurationMs,
        stages: stageResults,
        journalEntry,
      };

      this.emitEvent(EventTopics.SPINE_COMPLETED, { traceId, durationMs: totalDurationMs, confidence: synthesis.confidence });

      return output;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown spine error';
      this.emitEvent(EventTopics.SPINE_ERROR, { traceId, error: errorMessage });

      // Return degraded response
      return {
        traceId,
        response: `I encountered an issue processing your request. ${errorMessage}`,
        confidence: 0.1,
        mode: input.mode ?? 'chat',
        regime: 'reactive',
        memoryProposals: [],
        retrievedMemoryIds: [],
        toolsUsed: [],
        durationMs: Date.now() - startTime,
        stages: stageResults,
        journalEntry: {
          traceId,
          sessionId: input.sessionId,
          stages: stageResults.map(s => s.stage),
          totalDurationMs: Date.now() - startTime,
          mode: input.mode ?? 'chat',
          regime: 'reactive',
          confidence: 0.1,
          memoryProposalCount: 0,
          retrievalCount: 0,
        },
      };
    }
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  private async runStage<TInput, TOutput>(
    stageName: SpineStageName,
    input: TInput,
    results: SpineStageResult[]
  ): Promise<TOutput> {
    const stageStart = Date.now();
    this.hooks.onStageStart?.(stageName);

    const topicMap: Record<SpineStageName, EventTopic> = {
      intake: EventTopics.SPINE_INTAKE,
      interpretation: EventTopics.SPINE_INTERPRETATION,
      deliberation: EventTopics.SPINE_DELIBERATION,
      context_assembly: EventTopics.SPINE_CONTEXT_ASSEMBLY,
      execution_routing: EventTopics.SPINE_ROUTING,
      synthesis: EventTopics.SPINE_SYNTHESIS,
      persistence: EventTopics.SPINE_PERSISTENCE,
    };

    try {
      const processor = this.stages.get(stageName);
      if (!processor) {
        throw new Error(`No processor registered for stage: ${stageName}`);
      }

      const output = await processor(input) as TOutput;
      const durationMs = Date.now() - stageStart;

      const stageResult: SpineStageResult = {
        stage: stageName,
        durationMs,
        output: output as Record<string, unknown>,
      };

      results.push(stageResult);
      this.hooks.onStageComplete?.(stageName, stageResult);
      this.emitEvent(topicMap[stageName], { stage: stageName, durationMs });

      return output;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.hooks.onError?.(stageName, err);
      throw err;
    }
  }

  private emitEvent(topic: EventTopic, payload: Record<string, unknown>): void {
    if (!this.hooks.onEvent) return;

    const envelope: EventEnvelope = {
      eventId: makeId('event'),
      topic,
      timestamp: new Date().toISOString(),
      actor: 'runtime_spine',
      payload,
    };

    this.hooks.onEvent(envelope);
  }

  // --------------------------------------------------------------------------
  // Default Stage Processors (lightweight/local — real AI calls are injected)
  // --------------------------------------------------------------------------

  private registerDefaultStages(): void {
    // Stage 1: Intake — classify and sanitize input
    this.registerStage<SpineInput, IntakeResult>('intake', async (input) => {
      const signals: IntakeSignal[] = [];

      if (input.content.includes('?')) {
        signals.push({ type: 'question', value: 'interrogative', confidence: 0.9 });
      }
      if (/!|\burgent\b|\basap\b|\bcritical\b/i.test(input.content)) {
        signals.push({ type: 'urgency', value: 'elevated', confidence: 0.7 });
      }
      if (/\bcorrect\b|\bactually\b|\bwrong\b|\bno,\b/i.test(input.content)) {
        signals.push({ type: 'correction', value: 'user_correction', confidence: 0.8 });
      }

      return {
        inputType: input.attachments?.length ? 'multimodal' : 'text',
        contentLength: input.content.length,
        detectedLanguage: 'en',
        hasAttachments: (input.attachments?.length ?? 0) > 0,
        signals,
        sanitizedContent: input.content.trim(),
      };
    });

    // Stage 2: Interpretation — determine intent, mode, depth
    this.registerStage<IntakeResult & { input: SpineInput }, InterpretationResult>('interpretation', async (data) => {
      const content = data.sanitizedContent.toLowerCase();
      const hasQuestion = data.signals.some(s => s.type === 'question');
      const hasUrgency = data.signals.some(s => s.type === 'urgency');

      // Infer mode
      let mode: InteractionMode = data.input.mode ?? 'chat';
      if (/\bplan\b|\bstrategy\b|\broadmap\b/.test(content)) mode = 'planning';
      if (/\bcode\b|\bfunction\b|\bimplement\b|\bbug\b|\brefactor\b/.test(content)) mode = 'coding';
      if (/\bresearch\b|\bfind\b|\bsearch\b|\banalyze\b/.test(content)) mode = 'research';
      if (/\bwrite\b|\bdraft\b|\bdocument\b|\barticle\b/.test(content)) mode = 'writing';
      if (/\bexecute\b|\brun\b|\bdeploy\b|\bbuild\b/.test(content)) mode = 'execution';
      if (/\bmission\b|\bautonomous\b|\bauto\b/.test(content)) mode = 'mission_control';

      // Infer cognitive regime
      let regime: CognitiveRegime = 'reactive';
      if (content.length > 200) regime = 'analytical';
      if (mode === 'planning') regime = 'planning';
      if (mode === 'coding' && content.length > 100) regime = 'analytical';
      if (mode === 'research') regime = 'analytical';

      // Infer depth
      let depth: InterpretationResult['depth'] = 'shallow';
      if (content.length > 100) depth = 'moderate';
      if (content.length > 500) depth = 'deep';
      if (mode === 'planning' || mode === 'research') depth = 'deep';

      return {
        intent: hasQuestion ? 'query' : 'instruction',
        mode,
        regime,
        depth,
        urgency: hasUrgency ? 'high' : 'normal',
        requiresRetrieval: depth !== 'shallow' || mode === 'research',
        requiresTools: mode === 'coding' || mode === 'execution',
        requiresAgents: depth === 'deep' || (depth as string) === 'exhaustive',
        topicTags: [],
        riskClass: 'minimal',
      };
    });

    // Stage 3: Deliberation — plan approach
    this.registerStage<InterpretationResult, DeliberationResult>('deliberation', async (interp) => {
      let approach: DeliberationResult['approach'] = 'single_shot';
      if (interp.requiresAgents) approach = 'agent_swarm';
      else if (interp.requiresTools) approach = 'tool_chain';
      else if (interp.depth === 'deep') approach = 'multi_step';

      return {
        approach,
        steps: [{ id: makeId('task'), action: 'generate_response' }],
        agentsNeeded: interp.requiresAgents ? ['synthesizer', 'verifier'] : [],
        toolsNeeded: [],
        estimatedTokens: interp.depth === 'shallow' ? 500 : interp.depth === 'moderate' ? 1500 : 3000,
        confidenceTarget: 0.75,
      };
    });

    // Stage 4: Context Assembly — gather relevant context
    this.registerStage<
      { interpretation: InterpretationResult; deliberation: DeliberationResult; input: SpineInput },
      ContextAssemblyResult
    >('context_assembly', async ({ interpretation, input }) => {
      const recentHistory = (input.conversationHistory ?? [])
        .slice(-10)
        .map(t => `${t.role}: ${t.content.substring(0, 200)}`);

      return {
        pinnedConstraints: [],
        retrievedMemories: [],
        projectContext: [],
        recentHistory,
        totalTokens: recentHistory.join('').length / 4,
        contextQuality: 0.7,
      };
    });

    // Stage 5: Execution Routing — prepare and route to LLM
    // NOTE: This default is a stub. Real implementations inject AI gateway calls.
    this.registerStage<
      { context: ContextAssemblyResult; deliberation: DeliberationResult; interpretation: InterpretationResult; input: SpineInput },
      ExecutionRoutingResult
    >('execution_routing', async ({ context, input, interpretation }) => {
      return {
        model: 'stub',
        systemPrompt: `Mode: ${interpretation.mode}, Regime: ${interpretation.regime}`,
        contextPacket: context.recentHistory.join('\n'),
        userPrompt: input.content,
        rawResponse: '[Execution routing stub — inject real AI gateway]',
        tokensUsed: 0,
      };
    });

    // Stage 6: Synthesis — quality check and finalize
    this.registerStage<
      { execution: ExecutionRoutingResult; context: ContextAssemblyResult; interpretation: InterpretationResult },
      SynthesisResult
    >('synthesis', async ({ execution }) => {
      const BLANDNESS_PATTERNS = [
        /As an AI/i, /I don't have personal/i, /In conclusion/i,
        /It's important to note/i, /I hope this helps/i,
        /Let me know if you/i, /I'd be happy to/i,
      ];

      const matches = BLANDNESS_PATTERNS.filter(p => p.test(execution.rawResponse));
      const blandnessScore = matches.length / BLANDNESS_PATTERNS.length;
      const rhetoricalEntropy = 1 - blandnessScore;

      return {
        finalResponse: execution.rawResponse,
        confidence: rhetoricalEntropy > 0.8 ? 0.85 : 0.6,
        rhetoricalEntropy,
        blandnessScore,
        sourcesUsed: [],
        cruciblePassed: rhetoricalEntropy >= 0.8,
        iterationsNeeded: 1,
      };
    });

    // Stage 7: Persistence — propose memory writes
    this.registerStage<
      { synthesis: SynthesisResult; execution: ExecutionRoutingResult; interpretation: InterpretationResult; input: SpineInput },
      PersistenceResult
    >('persistence', async ({ synthesis, interpretation, input }) => {
      const proposals: MemoryProposal[] = [];

      // Propose episodic memory for significant interactions
      if (interpretation.depth !== 'shallow' && synthesis.confidence > 0.5) {
        proposals.push({
          memoryType: 'EM',
          content: `User interaction in ${interpretation.mode} mode: ${input.content.substring(0, 200)}`,
          confidence: synthesis.confidence,
          importance: interpretation.depth === 'deep' ? 0.8 : 0.5,
          rationale: 'Non-trivial interaction worth preserving for continuity',
          proposedBy: 'runtime_spine',
          tags: [interpretation.mode, interpretation.regime],
        });
      }

      return {
        memoryProposals: proposals,
        journalWritten: true,
        stateUpdated: true,
        entityExtractions: 0,
      };
    });
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let globalSpine: RuntimeSpine | null = null;

export function getRuntimeSpine(hooks?: SpineHooks): RuntimeSpine {
  if (!globalSpine) {
    globalSpine = new RuntimeSpine(hooks);
  }
  return globalSpine;
}

export function resetRuntimeSpine(): void {
  globalSpine = null;
}
