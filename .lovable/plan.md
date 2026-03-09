

# Deliberative Polycaste Integration into AIMOS

## Architectural Mapping

The Polycaste framework maps remarkably well to the existing AIMOS stack:

| Polycaste Concept | Existing AIMOS Component | Gap |
|-------------------|--------------------------|-----|
| Chrono-State Substrate | CMC (4-tier memory) + HHNI (tag expansion) | Semantic vs. Episodic segregation missing |
| Internal Ensemble | APOE Agent Swarm (Planner, Researcher, Builder, Verifier, Auditor) | No parallel execution — currently sequential |
| Adversarial Crucible | VIF Engine (claim verification) | Post-hoc only — no pre-output adversarial loop |
| N-Dimensional Persona Matrix | Static system prompt | No dynamic persona axes (ρ, ω, φ, ε) |
| Sub-Vocal Synthesis | Agent Discord logs thoughts | Not a true decoupled "proto-thought" layer |

## Implementation Plan

### Phase 1: Inquisitor Agent + Adversarial Loop

Add a new **Inquisitor** agent to APOE that attacks the Synthesizer's draft before output.

**Database Changes:**
```sql
-- Add inquisitor to agent_genomes
INSERT INTO agent_genomes (agent_role, display_name, system_prompt_core, capabilities)
VALUES ('inquisitor', 'Inquisitor', 'You brutally attack drafts for logical fallacies, contradictions, and bland AI boilerplate...', 
        '["attack_logic", "detect_hallucination", "penalize_blandness", "flag_circular_reasoning"]');

-- Add rhetorical entropy scoring to verification
ALTER TABLE aimos_claim_verification ADD COLUMN IF NOT EXISTS rhetorical_entropy FLOAT;
ALTER TABLE aimos_claim_verification ADD COLUMN IF NOT EXISTS blandness_score FLOAT;
```

**Edge Function: `polycaste-crucible`**
- Receives draft response from `hq-chat`
- Runs Inquisitor AI attack with heuristic vectors (fallacies, contradictions, blandness)
- Computes rhetorical entropy (penalizes "As an AI..." patterns)
- Returns pass/fail + critique + rewrite instructions
- Loops max 2 times until draft clears "Brilliance" threshold (κ ≥ 0.75)

### Phase 2: Persona Matrix System

**Database:**
```sql
CREATE TABLE persona_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT NOT NULL,
  pedagogy FLOAT DEFAULT 0.5,      -- ρ: Socratic ↔ Didactic
  wit_irony FLOAT DEFAULT 0.5,     -- ω: Literal ↔ Sardonic
  formality FLOAT DEFAULT 0.5,     -- φ: Academic ↔ Vernacular
  edge_friction FLOAT DEFAULT 0.5, -- ε: Agreeable ↔ Challenging
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**HQ-Chat Integration:**
- Load user's persona state at session start
- Inject persona coordinates into system prompt as control parameters
- After response, analyze user sentiment to micro-adjust axes for next turn

### Phase 3: Semantic vs. Episodic Memory Segregation

Extend CMC to explicitly tag memory atoms by type:

```sql
ALTER TABLE aimos_memory_atoms 
ADD COLUMN memory_class TEXT DEFAULT 'semantic' 
CHECK (memory_class IN ('semantic', 'episodic', 'procedural'));
```

- **Semantic**: Facts, project architecture, code schemas
- **Episodic**: User preferences, conversation history, emotional valence
- **Procedural**: How-to knowledge, workflow patterns

The Archivist agent ($\mathcal{A}$) queries episodic memory first to restore "Atmospheric State Tensor."

### Phase 4: UI Visualization — Crucible Activity

Add a **"Crucible"** tab to SwarmPanel showing:
- Proto-thought draft (pre-attack)
- Inquisitor critique bullets
- Rewrite iterations with entropy scores
- Final output release gate (κ threshold visualization)

## Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/polycaste-crucible/index.ts` | New adversarial loop engine |
| `supabase/functions/hq-chat/index.ts` | Integrate crucible call before streaming; load persona state |
| `supabase/functions/apoe-engine/index.ts` | Add Inquisitor + Forecaster agent roles |
| `src/components/shell/SwarmPanel.tsx` | Add Crucible tab visualization |
| `src/lib/agentSimulator.ts` | Add Inquisitor + Forecaster to simulation |
| `supabase/config.toml` | Register new function |

## Technical Details

**Blandness Penalty Heuristics:**
```typescript
const BLANDNESS_PATTERNS = [
  /As an AI/i, /I don't have personal/i, /In conclusion/i,
  /It's important to note/i, /I hope this helps/i,
  /Let me know if you/i, /I'd be happy to/i,
];
const blandnessScore = patterns.filter(p => p.test(draft)).length / patterns.length;
const rhetoricalEntropy = 1 - blandnessScore; // Higher = better
```

**Crucible Loop:**
```
draft = synthesizer_output
for iteration in 1..3:
  critique = inquisitor.attack(draft)
  κ = vif.score(draft, critique)
  if κ >= 0.75 and rhetoricalEntropy >= 0.80:
    RELEASE to Presentation Layer
  else:
    draft = synthesizer.rewrite(draft, critique)
if not released:
  draft = final_draft + "[CONFIDENCE: LOW]" hedge
```

**Persona Oscillation (Stochastic Dynamic):**
- During streaming, analyze sentence-level sentiment
- Shift persona axes in real-time (e.g., increase ε after detecting user confusion)
- Log axis transitions to Agent Discord for transparency

