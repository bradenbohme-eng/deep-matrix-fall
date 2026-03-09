// Canonical Enums — Single source of truth for all system enumerations
// Reference: AIOS Master Index §70.5

export type RiskClass = 'minimal' | 'low' | 'moderate' | 'high' | 'critical';

export type InteractionMode =
  | 'chat'
  | 'research'
  | 'planning'
  | 'execution'
  | 'coding'
  | 'writing'
  | 'worldbuilding'
  | 'mission_control';

export type MemoryType = 'WM' | 'EM' | 'SM' | 'PM' | 'UM' | 'CM' | 'PRM';

export const MemoryTypeLabels: Record<MemoryType, string> = {
  WM: 'Working Memory',
  EM: 'Episodic Memory',
  SM: 'Semantic Memory',
  PM: 'Project Memory',
  UM: 'User Memory',
  CM: 'Canonical Memory',
  PRM: 'Procedural Memory',
};

export type CanonicalityStatus = 'none' | 'candidate' | 'canonical' | 'demoted' | 'archived';

export type ToolClass =
  | 'read'
  | 'write'
  | 'delete'
  | 'compute'
  | 'web'
  | 'shell'
  | 'api'
  | 'automation'
  | 'simulation';

export type CognitiveRegime =
  | 'reactive'
  | 'analytical'
  | 'planning'
  | 'adversarial'
  | 'creative'
  | 'supervisory'
  | 'reflective';

export type AgentRole =
  | 'planner'
  | 'retriever'
  | 'verifier'
  | 'editor'
  | 'synthesizer'
  | 'executor'
  | 'historian'
  | 'continuity_auditor'
  | 'memory_reconciler'
  | 'world_keeper'
  | 'benchmark_judge'
  | 'policy_sentinel'
  | 'inquisitor'
  | 'forecaster';

export type MissionStatus = 'draft' | 'approved' | 'running' | 'paused' | 'completed' | 'aborted' | 'failed';

export type AutonomyTier = 0 | 1 | 2 | 3;

export const AutonomyTierLabels: Record<AutonomyTier, string> = {
  0: 'Manual — Every action requires approval',
  1: 'Guided — Read-only actions auto-approved',
  2: 'Supervised — Non-destructive actions auto-approved',
  3: 'Autonomous — All within-scope actions auto-approved',
};

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'applied' | 'rolled_back';

export type RetentionPolicy = 'permanent' | 'session' | 'decay' | 'expiring';

export type AbstractionLevel = 'raw' | 'chunk' | 'summary' | 'abstraction' | 'canon';
