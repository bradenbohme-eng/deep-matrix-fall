// Orchestration System - Main Export
// Event-sourced autonomous AI engine with verification and test harness

// Core Types
export * from './types';

// Event Store (Event Sourcing + Snapshots)
export { EventStore, StateMaterializer, getEventStore, resetEventStore } from './eventStore';

// Task Queue + DAG Engine
export { TaskQueue } from './taskQueue';

// Autonomy Governor (Budgets + Modes + STOP)
export { AutonomyGovernor } from './autonomyGovernor';

// Verifier + Auditor
export { Verifier, Auditor } from './verifier';

// Context Manager (Three-tier context)
export { ContextManager } from './contextManager';

// Orchestration Kernel (Main execution loop)
export { OrchestrationKernel, createKernel } from './kernel';

// Test Harness (DSL + Runner + Scoring)
export { TestRunner, getTestRunner } from './testHarness';

// Test Log Store (Persistent test results with reasoning traces)
export {
  TestLogStore,
  getTestLogStore,
  type TestRun,
  type TestSession,
  type ReasoningStep,
  type ImprovementSuggestion,
  type BudgetSnapshot,
  type InternalStateEntry,
  type CrossTestInsight,
  type AggregateStats,
} from './testLogStore';
