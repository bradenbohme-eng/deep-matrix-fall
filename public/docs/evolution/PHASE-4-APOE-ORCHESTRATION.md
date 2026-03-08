# Phase 4: Attention Priority Orchestration Engine (APOE) — Evolution Plan

**Priority**: 🟡 MEDIUM — Enables multi-step reasoning and planning  
**Status**: 📋 Planned  
**Dependencies**: Phase 1 (CMC), Phase 3 (VIF), `aimos_plans` table  
**Target**: Hierarchical goal decomposition (T0→T6) with agent coordination

---

## 1. Current State

- `aimos_plans` table exists (title, objective, steps, status, gates, execution_log)
- Agent simulator generates mock swarm activity
- SwarmPanel visualizes agents but with simulated data
- No real goal decomposition, no task queue, no agent routing
- HQ chat is single-turn (no multi-step plan execution)

## 2. Target Architecture

```
┌──────────────────────────────────────────────────────┐
│                   APOE ENGINE                         │
│                                                       │
│  ┌──────────┐                                        │
│  │ T0: USER │ "Build a self-auditing memory system"  │
│  │  INTENT  │                                        │
│  └────┬─────┘                                        │
│       ↓                                              │
│  ┌──────────┐                                        │
│  │ T1: BRIEF│ Decompose into high-level objectives   │
│  └────┬─────┘                                        │
│       ↓                                              │
│  ┌──────────┐                                        │
│  │ T2: MODS │ Identify modules/components needed     │
│  └────┬─────┘                                        │
│       ↓                                              │
│  ┌──────────┐                                        │
│  │ T3: ARCH │ Design architecture + interfaces       │
│  └────┬─────┘                                        │
│       ↓                                              │
│  ┌──────────┐                                        │
│  │ T4: SPEC │ Detailed specs per component           │
│  └────┬─────┘                                        │
│       ↓                                              │
│  ┌──────────┐                                        │
│  │ T5: IMPL │ Implementation steps + code generation │
│  └────┬─────┘                                        │
│       ↓                                              │
│  ┌──────────┐                                        │
│  │ T6: MON  │ Monitoring, testing, validation        │
│  └──────────┘                                        │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │           Agent Router                        │    │
│  │  Planner · Researcher · Builder · Verifier    │    │
│  │  Auditor · Documenter · MetaObserver          │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

## 3. Implementation Steps

### 3.1 Goal Decomposition Engine
Edge function `apoe-decompose`:
```
Input: User intent (natural language)
Output: T0-T6 plan tree (JSON)

Process:
  1. T0: Parse user intent → extract core objective
  2. T1: AI generates 2-5 high-level sub-goals
  3. T2: For each sub-goal, identify required modules/systems
  4. T3: For each module, define interfaces and dependencies
  5. T4: For each interface, write detailed specs
  6. T5: For each spec, generate implementation steps
  7. T6: For each implementation, define test + monitoring criteria

Store entire tree in `aimos_plans` with parent_plan_id linking.
```

### 3.2 Agent Role Definitions
```typescript
interface AgentRole {
  id: string;
  name: string;
  capabilities: string[];
  systemPrompt: string;
  priority: number; // execution order within a tier
}

const AGENT_ROLES: AgentRole[] = [
  {
    id: 'planner',
    name: 'Planner',
    capabilities: ['decompose', 'prioritize', 'schedule'],
    systemPrompt: 'You decompose objectives into T0-T6 goal hierarchies...',
    priority: 1,
  },
  {
    id: 'researcher',
    name: 'Researcher',
    capabilities: ['search_cmc', 'retrieve_evidence', 'cite_sources'],
    systemPrompt: 'You gather evidence from CMC/SEG to support decisions...',
    priority: 2,
  },
  {
    id: 'builder',
    name: 'Builder',
    capabilities: ['generate_code', 'create_schemas', 'write_functions'],
    systemPrompt: 'You implement solutions based on specs...',
    priority: 3,
  },
  {
    id: 'verifier',
    name: 'Verifier',
    capabilities: ['validate', 'test', 'score_confidence'],
    systemPrompt: 'You verify outputs against VIF quality gates...',
    priority: 4,
  },
  {
    id: 'auditor',
    name: 'Auditor',
    capabilities: ['review', 'flag_issues', 'propose_improvements'],
    systemPrompt: 'You audit completed work for correctness and completeness...',
    priority: 5,
  },
  {
    id: 'meta_observer',
    name: 'MetaObserver',
    capabilities: ['monitor_agents', 'detect_loops', 'escalate'],
    systemPrompt: 'You observe the swarm for inefficiencies and infinite loops...',
    priority: 0, // always running
  },
];
```

### 3.3 Task Queue & Execution
```typescript
interface TaskQueueEntry {
  id: string;
  planId: string;
  tier: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  agentRole: string;
  input: any;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'blocked';
  dependencies: string[]; // other task IDs that must complete first
  output?: any;
  confidence?: number; // VIF score on output
  startedAt?: Date;
  completedAt?: Date;
}
```

Execution loop:
1. Dequeue next task where all dependencies are `completed`
2. Route to appropriate agent role
3. Execute (AI call with role-specific system prompt + CMC context)
4. Score output via VIF
5. If κ ≥ 0.60 → mark complete, enqueue dependent tasks
6. If κ < 0.60 → retry with expanded context (max 2 retries) → escalate to user

### 3.4 Agent Discord (Activity Log)
```sql
CREATE TABLE aimos_agent_discord (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES aimos_plans(id),
  agent_role TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN (
    'THOUGHT','DECISION','TASK_PROPOSE','TASK_ACCEPT',
    'TASK_COMPLETE','TOOL_CALL','TOOL_RESULT','SUMMARY','ALERT'
  )),
  content TEXT NOT NULL,
  metadata JSONB,
  thread_id TEXT, -- groups related messages
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 Cognitive Loop Integration
Per deepthinkOS spec, every plan execution follows:
```
Context → Reflect → Execute → Audit → Deliver
  (CMC)   (APOE)   (Builder)  (VIF)   (Output)
```
Each step logged to Agent Discord with typed messages.

### 3.6 UI: Plan Visualizer
- Tree view of T0→T6 hierarchy (expandable)
- Color-coded task status (queued=gray, running=blue, done=green, failed=red)
- Agent activity feed (real-time Agent Discord log)
- Progress bar per plan (% tasks completed)
- Click any task → see input/output/confidence

## 4. Database Changes

```sql
-- Agent Discord for activity logging
CREATE TABLE IF NOT EXISTS aimos_agent_discord (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES aimos_plans(id) ON DELETE CASCADE,
  agent_role TEXT NOT NULL,
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  thread_id TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Task queue
CREATE TABLE IF NOT EXISTS aimos_task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES aimos_plans(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  status TEXT DEFAULT 'queued',
  dependencies UUID[],
  confidence FLOAT,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 5. Success Metrics

- **Decomposition quality**: T0→T6 trees rated coherent by user >80% of time
- **Task completion rate**: >90% of queued tasks complete without user intervention
- **Agent efficiency**: Average plan execution <10 AI calls
- **VIF gate pass rate**: >70% of task outputs pass on first attempt
- **Loop detection**: MetaObserver catches infinite loops within 3 iterations

---

*APOE turns single-turn chat into multi-step autonomous reasoning.*
