// Canonical Object Definitions — All kernel objects
// Reference: AIOS Master Index §70

import type { BaseMeta, ScopeRef } from './base';
import type {
  MemoryType,
  CanonicalityStatus,
  RiskClass,
  InteractionMode,
  ToolClass,
  MissionStatus,
  AutonomyTier,
  ProposalStatus,
  RetentionPolicy,
  AbstractionLevel,
  AgentRole,
  CognitiveRegime,
} from './enums';

// ─── Session ───────────────────────────────────────────────────────────────

export interface SessionState extends BaseMeta {
  userId: string;
  workspaceId?: string;
  projectId?: string;
  activeTaskId?: string;
  activeMissionId?: string;
  mode: InteractionMode;
  riskClass: RiskClass;
  status: 'active' | 'idle' | 'closed';
  cognitiveRegime: CognitiveRegime;
  contextSnapshot?: string; // ID of last context assembly
}

// ─── Memory ────────────────────────────────────────────────────────────────

export interface MemoryItem extends BaseMeta {
  memoryType: MemoryType;
  content: string;
  summary?: string;
  abstractionLevel: AbstractionLevel;
  sourceType: string;
  sourceReference?: string;
  confidence: number; // 0–1
  importance: number; // 0–1
  recencyScore: number; // 0–1
  canonicalityStatus: CanonicalityStatus;
  retentionPolicy: RetentionPolicy;
  decayPolicy: string;
  activeFlag: boolean;
  contradictionIds?: string[];
  parentMemoryId?: string;
}

export interface MemoryWriteProposal extends BaseMeta {
  proposedBy: string; // agent role or 'user'
  targetMemoryType: MemoryType;
  candidateContent: string;
  rationale: string;
  confidence: number;
  proposedCanonicality: CanonicalityStatus;
  resolutionStatus: ProposalStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  targetMemoryId?: string; // if updating existing
}

export interface CanonEntry extends BaseMeta {
  memoryId: string;
  canonicalDomain: string;
  status: 'active' | 'demoted' | 'superseded';
  promotionReason?: string;
  demotionReason?: string;
  evidenceIds: string[];
  contradictionCount: number;
}

export interface ContradictionRecord extends BaseMeta {
  leftMemoryId: string;
  rightMemoryId: string;
  contradictionType: string;
  severity: RiskClass;
  resolutionStatus: 'open' | 'resolved' | 'deferred';
  recommendedResolution?: string;
  resolvedBy?: string;
}

// ─── Task ──────────────────────────────────────────────────────────────────

export interface TaskEnvelope extends BaseMeta {
  title: string;
  objective: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  riskClass: RiskClass;
  planId?: string;
  parentTaskId?: string;
  assignedAgent?: AgentRole;
  successCriteria: SuccessCriterion[];
  stopConditions: string[];
  result?: TaskResult;
}

export interface SuccessCriterion {
  id: string;
  description: string;
  type: 'deterministic' | 'rubric';
  passed?: boolean;
  score?: number;
}

export interface TaskResult {
  success: boolean;
  output: unknown;
  artifactIds: string[];
  confidence: number;
  durationMs: number;
  tokensUsed: number;
}

// ─── Mission ───────────────────────────────────────────────────────────────

export interface MissionObject extends BaseMeta {
  title: string;
  objective: string;
  status: MissionStatus;
  autonomyTier: AutonomyTier;
  allowedTools: ToolClass[];
  forbiddenActions: string[];
  budgetLimits: BudgetLimits;
  stopConditions: string[];
  escalationConditions: string[];
  successMetrics: string[];
  rollbackPlan?: string;
  steps: MissionStep[];
}

export interface MissionStep {
  id: string;
  sequenceNo: number;
  taskId?: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped';
  actionSummary: string;
  validationSummary?: string;
  confidence?: number;
}

export interface BudgetLimits {
  maxTokens?: number;
  maxToolCalls?: number;
  maxDurationMs?: number;
  maxCostCents?: number;
}

// ─── Tool Action ───────────────────────────────────────────────────────────

export interface ToolAction extends BaseMeta {
  taskId?: string;
  missionId?: string;
  toolName: string;
  toolClass: ToolClass;
  intent: string;
  inputSummary: string;
  status: 'planned' | 'executing' | 'completed' | 'failed';
  riskClass: RiskClass;
  resultSummary?: string;
  errorSummary?: string;
  durationMs?: number;
}

// ─── Confidence ────────────────────────────────────────────────────────────

export interface ConfidenceRecord extends BaseMeta {
  subjectType: string;
  subjectId: string;
  confidence: number; // 0–1
  dimensions: ConfidenceDimensions;
  rationale: string;
}

export interface ConfidenceDimensions {
  factualCertainty?: number;
  inferenceStrength?: number;
  executionProbability?: number;
  memoryReliability?: number;
  ambiguityLevel?: number;
}

// ─── Evaluation ────────────────────────────────────────────────────────────

export interface EvaluationResult extends BaseMeta {
  benchmarkFamily: string;
  subjectType: string;
  subjectId: string;
  metrics: Record<string, number>;
  regressions: string[];
  recommendation: 'promote' | 'reject' | 'defer';
  notes?: string;
}

// ─── Artifact ──────────────────────────────────────────────────────────────

export interface ArtifactObject extends BaseMeta {
  artifactType: string;
  title: string;
  blobUri: string;
  contentHash: string;
  version: string;
  status: 'draft' | 'active' | 'archived';
  provenance: Record<string, unknown>;
}

// ─── Runtime Journal ───────────────────────────────────────────────────────

export interface RuntimeJournalEntry extends BaseMeta {
  sessionId?: string;
  taskId?: string;
  missionId?: string;
  stateName: string;
  actor: string;
  summary: string;
  confidenceImpact?: number;
  artifactRefs: string[];
}
