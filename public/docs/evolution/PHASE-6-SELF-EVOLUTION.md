# Phase 6: Self-Evolution & Autonomous Improvement — Evolution Plan

**Priority**: 🟢 ONGOING — Continuous improvement loop  
**Status**: 🔨 In Progress (basic audit + proposals working)  
**Dependencies**: All previous phases  
**Target**: Fully autonomous self-audit → propose → approve → apply → monitor cycle

---

## 1. Current State

- `evolution_proposals` table with status workflow (pending → approved → applied → rolled_back)
- `self_audit_log` table for health check history
- Self-audit via `self-evolution` edge function (queries DB metrics, generates proposals via AI)
- Approval UI in SelfEvolutionPanel (Approve/Reject buttons)
- Basic health score visualization
- No scheduled audits, no auto-monitoring, no rollback execution, no impact tracking

## 2. Target Architecture

```
┌────────────────────────────────────────────────────────┐
│               SELF-EVOLUTION ENGINE                     │
│                                                         │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐            │
│  │ OBSERVE │ → │ DIAGNOSE │ → │ PROPOSE  │            │
│  │ Metrics │   │ Patterns │   │ Changes  │            │
│  │ Trends  │   │ Anomalies│   │ w/Plans  │            │
│  └─────────┘   └──────────┘   └────┬─────┘            │
│                                     ↓                   │
│                              ┌──────────┐               │
│                              │ APPROVAL │ ← Human       │
│                              │   GATE   │               │
│                              └────┬─────┘               │
│                                   ↓                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐           │
│  │ MONITOR  │ ← │ VALIDATE │ ← │  APPLY   │           │
│  │ Impact   │   │ Results  │   │ Changes  │           │
│  │ Metrics  │   │ VIF Gate │   │ Execute  │           │
│  └──────────┘   └──────────┘   └──────────┘           │
│       ↓                                                │
│  ┌──────────┐                                          │
│  │ ROLLBACK │ ← If metrics degrade                    │
│  │ Revert   │                                          │
│  └──────────┘                                          │
└────────────────────────────────────────────────────────┘
```

## 3. Implementation Steps

### 3.1 Comprehensive Self-Audit
Expand `self-evolution` edge function to check:
```
1. MEMORY HEALTH
   - Total atoms by level (hot/warm/cold/frozen)
   - Compression ratio across levels
   - Orphaned atoms (no tags, no relationships)
   - Stale atoms (not accessed in >30 days)
   - Tag coverage (% atoms with ≥2 tags)

2. REASONING HEALTH
   - Average κ score over last 24h
   - Hallucination rate (contradicted claims / total claims)
   - Reasoning chain depth distribution
   - Failed task rate in APOE queue

3. KNOWLEDGE HEALTH
   - Entity count and relationship density in SEG
   - Orphaned entities (no relationships)
   - Contradiction count in evidence graph
   - Tag hierarchy balance (max depth vs breadth)

4. SYSTEM HEALTH
   - Edge function response times (p50, p95, p99)
   - Error rates by function
   - DB query performance
   - Token usage trends

5. EVOLUTION HEALTH
   - Proposal approval rate
   - Applied proposal success rate (did metrics improve?)
   - Rollback frequency
   - Time-to-apply for approved proposals
```

### 3.2 Pattern Detection
AI-powered anomaly detection:
```
Input: Last 7 days of audit metrics
Process:
  1. Trend analysis: Is κ improving or degrading?
  2. Anomaly detection: Any metric > 2σ from moving average?
  3. Correlation analysis: Which metrics move together?
  4. Root cause hypothesis: AI generates likely causes
Output: {
  trends: [{metric, direction, severity}],
  anomalies: [{metric, value, expected, deviation}],
  correlations: [{metric_a, metric_b, correlation}],
  hypotheses: [{cause, confidence, affected_metrics}]
}
```

### 3.3 Proposal Generation
Upgrade proposal structure:
```typescript
interface EvolutionProposal {
  id: string;
  title: string;
  description: string;
  proposal_type: 'optimization' | 'fix' | 'feature' | 'refactor' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // What triggered this proposal
  source_audit_id: string;
  trigger_metrics: Record<string, number>;
  
  // What will change
  implementation_plan: {
    steps: Array<{
      action: string; // 'alter_table' | 'update_function' | 'modify_config' | 'create_resource'
      target: string; // table/function/config name
      details: string;
      reversible: boolean;
    }>;
    estimated_impact: string;
    affected_systems: string[]; // CMC, HHNI, VIF, APOE, SEG
  };
  
  // How to undo
  rollback_plan: {
    steps: Array<{action: string; target: string; details: string}>;
    data_backup_required: boolean;
  };
  
  // Expected outcomes
  expected_metrics: Record<string, {before: number; after: number}>;
  risk_assessment: 'low' | 'medium' | 'high';
  
  // Lifecycle
  status: 'pending' | 'approved' | 'rejected' | 'applied' | 'monitoring' | 'rolled_back';
  applied_at?: Date;
  monitoring_window_hours: number; // how long to monitor after apply
  monitoring_results?: Record<string, number>;
}
```

### 3.4 Apply & Monitor
When proposal is approved:
```
1. Snapshot current system state (metrics, configs)
2. Execute implementation steps in order
3. Set status = 'monitoring'
4. Start monitoring window (default 24h)
5. Every 6h during window: compare metrics to expected_metrics
6. If all metrics improved or stable → status = 'applied' (final)
7. If any metric degraded > 10% → auto-trigger rollback
8. Log everything to Agent Discord
```

### 3.5 Automatic Rollback
```
Trigger: metric_after < metric_before × 0.90 (10% degradation)
Process:
  1. Execute rollback_plan steps in reverse order
  2. Verify system returns to pre-apply state
  3. Set proposal status = 'rolled_back'
  4. Log rollback reason and metrics
  5. Create new audit entry noting the failed evolution
  6. Flag for human review
```

### 3.6 Scheduled Audits
Configure periodic execution:
- **Hourly**: Quick health check (response times, error rates)
- **Every 6 hours**: Full audit (memory, reasoning, knowledge health)
- **Daily**: Trend analysis + pattern detection + proposal generation
- **Weekly**: Deep audit with cross-system correlation analysis

### 3.7 Evolution Dashboard (UI)
Enhance SelfEvolutionPanel:
- **Health Overview**: Radar chart of all health dimensions
- **Trend Graphs**: 7-day sparklines for key metrics
- **Active Proposals**: Cards with approve/reject + risk badge
- **Applied History**: Timeline of applied proposals with impact metrics
- **Rollback Log**: List of rolled-back proposals with reasons
- **Audit Schedule**: Next scheduled audit countdown
- **System Snapshot**: Current state vs baseline comparison

## 4. Database Changes

```sql
-- Expand evolution_proposals with monitoring fields
ALTER TABLE evolution_proposals
  ADD COLUMN monitoring_window_hours INTEGER DEFAULT 24,
  ADD COLUMN monitoring_results JSONB,
  ADD COLUMN trigger_metrics JSONB,
  ADD COLUMN expected_metrics JSONB,
  ADD COLUMN risk_assessment TEXT DEFAULT 'medium',
  ADD COLUMN affected_systems TEXT[];

-- System state snapshots for rollback
CREATE TABLE IF NOT EXISTS aimos_system_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES evolution_proposals(id),
  snapshot_type TEXT CHECK (snapshot_type IN ('pre_apply', 'post_apply', 'rollback')),
  metrics JSONB NOT NULL,
  config_state JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit schedule tracking
CREATE TABLE IF NOT EXISTS aimos_audit_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL, -- 'quick', 'full', 'deep', 'trend'
  frequency_hours INTEGER NOT NULL,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'
);
```

## 5. The 13 Protocol Laws (from OmniBus.txt)

Every evolution proposal MUST be checked against these laws:
1. **Resonance Audit** — Does the change align with system harmony?
2. **Fractal Resolution** — Is the change self-similar at all scales?
3. **Entropy Balancing** — Does it maintain freedom/structure balance?
4. **Temporal Coherence** — Is it consistent across time?
5. **Evidence Grounding** — Is it supported by data?
6. **Contradiction Resolution** — Does it resolve, not create, conflicts?
7. **Minimal Disruption** — Smallest change for maximum impact?
8. **Reversibility** — Can it be undone?
9. **Transparency** — Is the reasoning visible?
10. **Human Sovereignty** — Does the human retain control?
11. **Quality Monotonicity** — Does quality only go up?
12. **Knowledge Preservation** — Is no knowledge lost?
13. **Self-Consistency** — Does the system remain self-consistent?

## 6. Success Metrics

- **Audit coverage**: 100% of health dimensions checked every 6h
- **Proposal quality**: >60% of proposals approved by user
- **Apply success rate**: >80% of applied proposals pass monitoring
- **Rollback speed**: <5 minutes from detection to revert
- **Overall κ trend**: Monotonically improving over 30-day window

---

*Self-evolution is the soul of the system — it learns to improve itself.*
