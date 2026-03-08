# Phase 3: Verifiable Intelligence Framework (VIF) — Evolution Plan

**Priority**: 🟠 HIGH — Prevents hallucination and enforces quality  
**Status**: 📋 Planned  
**Dependencies**: Phase 1 (CMC), Phase 2 (HHNI), `aimos_confidence_metrics` table  
**Target**: Every AI output scored, gated, and auditable with confidence metrics

---

## 1. Current State

- `aimos_confidence_metrics` table exists (entity_id, overall_confidence, completeness, consistency, etc.)
- `aimos_reasoning_chains` logs user_query + final_answer + reasoning_steps
- HQ chat logs interactions to reasoning_chains
- Self-audit produces health scores
- No per-response confidence scoring, no hallucination detection, no quality gates

## 2. Target Architecture

```
┌──────────────────────────────────────────────────┐
│                 VIF ENGINE                        │
│                                                   │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐  │
│  │ PRE-GATE │ →  │ RESPONSE │ →  │ POST-GATE  │  │
│  │ Context  │    │ Generate │    │ Verify &   │  │
│  │ Quality  │    │ + Score  │    │ Confidence │  │
│  │ Check    │    │          │    │ Score      │  │
│  └──────────┘    └──────────┘    └────────────┘  │
│       ↕                               ↕          │
│  ┌──────────────────────────────────────────┐    │
│  │         Confidence Scoring Pipeline       │    │
│  │  Factual · Consistent · Complete · Fresh  │    │
│  └──────────────────────────────────────────┘    │
│       ↕                                          │
│  ┌──────────────────────────────────────────┐    │
│  │         Hallucination Detector            │    │
│  │  Cross-ref CMC · Check contradictions     │    │
│  │  Flag unsupported claims · Source verify   │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

## 3. Implementation Steps

### 3.1 Confidence Scoring Pipeline
For every AI response, compute a composite κ (kappa) score:

```typescript
interface ConfidenceScore {
  factual_accuracy: number;   // 0-1: Claims supported by CMC atoms?
  consistency: number;        // 0-1: Contradicts previous responses?
  completeness: number;       // 0-1: Addresses all parts of query?
  relevance: number;          // 0-1: On-topic with retrieved context?
  freshness: number;          // 0-1: Based on recent vs stale atoms?
  overall: number;            // Weighted composite
}

// Weights (tunable):
const WEIGHTS = {
  factual_accuracy: 0.30,
  consistency: 0.25,
  completeness: 0.20,
  relevance: 0.15,
  freshness: 0.10,
};
```

### 3.2 Pre-Gate: Context Quality Check
Before sending query to AI:
1. Retrieve context atoms from CMC
2. Check minimum atom count (≥3 for knowledge queries, ≥1 for general)
3. Check average atom confidence (≥0.5 threshold)
4. If below threshold → flag as "low-confidence context" → AI instructed to hedge
5. Log pre-gate results

### 3.3 Post-Gate: Response Verification
After AI generates response:
1. **Claim Extraction**: Parse response for factual assertions
2. **Cross-Reference**: Check each claim against CMC atoms
   - Supported → +score
   - Contradicted → -score, flag
   - Unsupported → neutral, flag as "unverified"
3. **Consistency Check**: Compare with last 5 responses in conversation
   - Detect contradictions via keyword overlap + sentiment reversal
4. **Completeness Check**: Did response address all sub-questions?
5. Compute composite κ score
6. Store in `aimos_confidence_metrics`

### 3.4 Hallucination Detection
Edge function `vif-verify`:
```
Input: AI response + retrieved context atoms + conversation history
Process:
  1. Use AI to extract claims from response (structured JSON)
  2. For each claim:
     a. Search CMC for supporting evidence
     b. Search CMC for contradicting evidence
     c. Check if claim is a known fact vs generated inference
  3. Classify: VERIFIED | UNVERIFIED | CONTRADICTED | INFERENCE
  4. Return verification report
Output: {
  claims: [{text, status, supporting_atoms, confidence}],
  overall_hallucination_risk: 0-1,
  flags: string[]
}
```

### 3.5 Quality Gates
Define response quality tiers:
```
κ ≥ 0.85  → GREEN  → Deliver as-is
κ 0.60-0.84 → YELLOW → Deliver with confidence disclaimer
κ 0.40-0.59 → ORANGE → Deliver with explicit hedging + source gaps noted
κ < 0.40  → RED    → Suppress response, ask for clarification or more context
```

### 3.6 Confidence UI
In the chat/shell interface:
- Small κ badge next to each AI response (color-coded GREEN/YELLOW/ORANGE/RED)
- Expandable "Verification Report" showing claim-by-claim analysis
- Trend graph of κ scores over conversation
- Alert banner when response is ORANGE or RED

### 3.7 Self-Correction Loop
When κ < 0.60:
1. Automatically re-query with expanded context (widen CMC search)
2. If still low → inject explicit instruction: "You lack sufficient evidence. State what you know and what you're uncertain about."
3. Log the correction attempt to `aimos_reasoning_chains`

## 4. Database Changes

```sql
-- Per-response confidence tracking (linked to reasoning chains)
ALTER TABLE aimos_reasoning_chains
  ADD COLUMN confidence_kappa FLOAT,
  ADD COLUMN verification_report JSONB,
  ADD COLUMN quality_tier TEXT CHECK (quality_tier IN ('green','yellow','orange','red'));

-- Claim-level verification log
CREATE TABLE aimos_claim_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES aimos_reasoning_chains(id),
  claim_text TEXT NOT NULL,
  status TEXT CHECK (status IN ('verified','unverified','contradicted','inference')),
  supporting_atom_ids UUID[],
  contradicting_atom_ids UUID[],
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 5. Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `vif-pregate` | Before AI call | Assess context quality |
| `vif-verify` | After AI response | Claim extraction + cross-ref |
| `vif-score` | After verification | Compute composite κ |
| `vif-correct` | On low κ | Self-correction retry |

## 6. Success Metrics

- **Hallucination rate**: <5% of claims flagged as CONTRADICTED
- **Confidence calibration**: Predicted κ correlates with actual accuracy
- **Gate enforcement**: 100% of RED responses suppressed or hedged
- **Verification latency**: <3s per response (parallel claim checking)
- **User trust**: Visible κ scores build confidence in system outputs

## 7. Integration Points

- **CMC**: VIF reads atoms for cross-referencing; writes confidence back to atoms
- **HHNI**: Tag quality used as input to relevance scoring
- **APOE**: Task completion gates use VIF scores for quality checkpoints
- **SEG**: Entity confidence derived from VIF verification of related claims
- **Self-Evolution**: Low κ trends trigger evolution proposals

---

*VIF is the immune system — it catches errors before they propagate.*
