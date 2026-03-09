// Canonical Event Topics — All system events flow through these typed topics
// Reference: AIOS Master Index §70

export const EventTopics = {
  // Session lifecycle
  SESSION_CREATED: 'session.created',
  SESSION_MODE_CHANGED: 'session.mode_changed',
  SESSION_CLOSED: 'session.closed',

  // Interaction
  INTERACTION_RECEIVED: 'interaction.received',
  INTERACTION_INTERPRETED: 'interaction.interpreted',
  INTERACTION_RESPONDED: 'interaction.responded',

  // Runtime Spine stages
  SPINE_INTAKE: 'spine.intake',
  SPINE_INTERPRETATION: 'spine.interpretation',
  SPINE_DELIBERATION: 'spine.deliberation',
  SPINE_CONTEXT_ASSEMBLY: 'spine.context_assembly',
  SPINE_ROUTING: 'spine.routing',
  SPINE_SYNTHESIS: 'spine.synthesis',
  SPINE_PERSISTENCE: 'spine.persistence',
  SPINE_COMPLETED: 'spine.completed',
  SPINE_ERROR: 'spine.error',

  // Task
  TASK_CREATED: 'task.created',
  TASK_STARTED: 'task.started',
  TASK_COMPLETED: 'task.completed',
  TASK_FAILED: 'task.failed',
  TASK_CANCELLED: 'task.cancelled',

  // Memory
  MEMORY_WRITE_PROPOSED: 'memory.write_proposed',
  MEMORY_WRITE_APPROVED: 'memory.write_approved',
  MEMORY_WRITE_REJECTED: 'memory.write_rejected',
  MEMORY_CANON_PROMOTED: 'memory.canon_promoted',
  MEMORY_CANON_DEMOTED: 'memory.canon_demoted',
  MEMORY_CONTRADICTION_DETECTED: 'memory.contradiction_detected',
  MEMORY_CONTRADICTION_RESOLVED: 'memory.contradiction_resolved',
  MEMORY_RETRIEVED: 'memory.retrieved',
  MEMORY_DECAYED: 'memory.decayed',

  // Mission
  MISSION_CREATED: 'mission.created',
  MISSION_APPROVED: 'mission.approved',
  MISSION_STEP_COMPLETED: 'mission.step_completed',
  MISSION_PAUSED: 'mission.paused',
  MISSION_RESUMED: 'mission.resumed',
  MISSION_COMPLETED: 'mission.completed',
  MISSION_ABORTED: 'mission.aborted',
  MISSION_ESCALATED: 'mission.escalated',

  // Tool
  TOOL_INVOKED: 'tool.invoked',
  TOOL_COMPLETED: 'tool.completed',
  TOOL_FAILED: 'tool.failed',

  // Evaluation
  EVALUATION_STARTED: 'evaluation.started',
  EVALUATION_COMPLETED: 'evaluation.completed',
  EVALUATION_REGRESSION: 'evaluation.regression',

  // Confidence
  CONFIDENCE_UPDATED: 'confidence.updated',
  CONFIDENCE_DEGRADED: 'confidence.degraded',

  // Governance
  APPROVAL_REQUESTED: 'governance.approval_requested',
  APPROVAL_GRANTED: 'governance.approval_granted',
  APPROVAL_DENIED: 'governance.approval_denied',
  POLICY_VIOLATION: 'governance.policy_violation',
  AUDIT_RECORDED: 'governance.audit_recorded',

  // Evolution
  EVOLUTION_PROPOSED: 'evolution.proposed',
  EVOLUTION_BENCHMARKED: 'evolution.benchmarked',
  EVOLUTION_PROMOTED: 'evolution.promoted',
  EVOLUTION_REJECTED: 'evolution.rejected',
  EVOLUTION_ROLLED_BACK: 'evolution.rolled_back',
} as const;

export type EventTopic = typeof EventTopics[keyof typeof EventTopics];

export interface EventEnvelope {
  eventId: string;
  topic: EventTopic;
  timestamp: string; // ISO 8601
  actor: string;
  sessionId?: string;
  taskId?: string;
  missionId?: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
}
