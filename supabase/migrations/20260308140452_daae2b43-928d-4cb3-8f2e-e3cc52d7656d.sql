-- Fix: Use ON CONFLICT on tag_name (unique column) for tag hierarchy seeding
INSERT INTO aimos_tag_hierarchy (tag_name, parent_tag, level, description) VALUES
  ('ai-mos', NULL, 0, 'Root: AI Memory Operating System'),
  ('memory', 'ai-mos', 1, 'Memory subsystems'),
  ('cmc', 'memory', 2, 'Context Memory Core'),
  ('compression', 'cmc', 3, 'Semantic compression algorithms'),
  ('decay', 'cmc', 3, 'Temporal decay and level transitions'),
  ('retrieval', 'cmc', 3, 'Memory retrieval strategies'),
  ('vif', 'reasoning', 2, 'Verifiable Intelligence Framework'),
  ('apoe', 'reasoning', 2, 'Attention Priority Orchestration Engine'),
  ('chains', 'reasoning', 2, 'Reasoning chain tracking'),
  ('hhni', 'navigation', 2, 'Hierarchical Navigation Index'),
  ('tagging', 'navigation', 2, 'Tag taxonomy and classification'),
  ('seg', 'knowledge', 2, 'Symbolic Evidence Graph'),
  ('entities', 'knowledge', 2, 'Entity extraction and management'),
  ('evidence', 'knowledge', 2, 'Evidence chain tracking'),
  ('self-audit', 'evolution', 2, 'System health auditing'),
  ('proposals', 'evolution', 2, 'Evolution proposal management'),
  ('rollback', 'evolution', 2, 'Rollback and recovery')
ON CONFLICT (tag_name) DO UPDATE SET 
  parent_tag = EXCLUDED.parent_tag,
  level = EXCLUDED.level,
  description = EXCLUDED.description;

-- Phase 3: VIF
ALTER TABLE aimos_reasoning_chains
  ADD COLUMN IF NOT EXISTS confidence_kappa FLOAT,
  ADD COLUMN IF NOT EXISTS verification_report JSONB,
  ADD COLUMN IF NOT EXISTS quality_tier TEXT;

CREATE TABLE IF NOT EXISTS aimos_claim_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES aimos_reasoning_chains(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  status TEXT CHECK (status IN ('verified', 'unverified', 'contradicted', 'inference')),
  supporting_atom_ids UUID[],
  contradicting_atom_ids UUID[],
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_claim_verification_chain ON aimos_claim_verification(chain_id);

-- Phase 4: APOE
CREATE TABLE IF NOT EXISTS aimos_agent_discord (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES aimos_plans(id) ON DELETE CASCADE,
  agent_role TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN (
    'THOUGHT', 'DECISION', 'TASK_PROPOSE', 'TASK_ACCEPT',
    'TASK_COMPLETE', 'TOOL_CALL', 'TOOL_RESULT', 'SUMMARY', 'ALERT'
  )),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  thread_id TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_discord_plan ON aimos_agent_discord(plan_id);
CREATE INDEX IF NOT EXISTS idx_agent_discord_created ON aimos_agent_discord(created_at DESC);

CREATE TABLE IF NOT EXISTS aimos_task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES aimos_plans(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6')),
  agent_role TEXT NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'blocked')),
  dependencies UUID[],
  confidence FLOAT,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON aimos_task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_queue_plan ON aimos_task_queue(plan_id);

-- Phase 5: SEG
CREATE TABLE IF NOT EXISTS aimos_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  description TEXT,
  aliases TEXT[],
  source_atom_ids UUID[],
  confidence FLOAT DEFAULT 0.5,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, entity_type)
);

CREATE TABLE IF NOT EXISTS aimos_entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID REFERENCES aimos_entities(id) ON DELETE CASCADE,
  target_entity_id UUID REFERENCES aimos_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'DEPENDS_ON', 'PART_OF', 'SUPPORTS', 'CONTRADICTS',
    'EVOLVED_FROM', 'USES', 'SIMILAR_TO', 'SPECIALIZES'
  )),
  strength FLOAT DEFAULT 0.5,
  evidence_atom_ids UUID[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entity_rel_source ON aimos_entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_rel_target ON aimos_entity_relationships(target_entity_id);

-- Phase 6: Enhanced Evolution
ALTER TABLE evolution_proposals
  ADD COLUMN IF NOT EXISTS monitoring_window_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS monitoring_results JSONB,
  ADD COLUMN IF NOT EXISTS trigger_metrics JSONB,
  ADD COLUMN IF NOT EXISTS expected_metrics JSONB,
  ADD COLUMN IF NOT EXISTS risk_assessment TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS affected_systems TEXT[];

CREATE TABLE IF NOT EXISTS aimos_system_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES evolution_proposals(id) ON DELETE CASCADE,
  snapshot_type TEXT CHECK (snapshot_type IN ('pre_apply', 'post_apply', 'rollback')),
  metrics JSONB NOT NULL,
  config_state JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for new tables
ALTER TABLE aimos_claim_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_agent_discord ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_task_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_system_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read aimos_claim_verification" ON aimos_claim_verification FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert aimos_claim_verification" ON aimos_claim_verification FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public read aimos_agent_discord" ON aimos_agent_discord FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert aimos_agent_discord" ON aimos_agent_discord FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public read aimos_task_queue" ON aimos_task_queue FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public all aimos_task_queue" ON aimos_task_queue FOR ALL TO anon, authenticated USING (true);
CREATE POLICY "Public read aimos_entities" ON aimos_entities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert aimos_entities" ON aimos_entities FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update aimos_entities" ON aimos_entities FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public read aimos_entity_relationships" ON aimos_entity_relationships FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert aimos_entity_relationships" ON aimos_entity_relationships FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public read aimos_system_snapshots" ON aimos_system_snapshots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert aimos_system_snapshots" ON aimos_system_snapshots FOR INSERT TO anon, authenticated WITH CHECK (true);