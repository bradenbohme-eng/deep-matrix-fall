-- AIMOS Core Systems Schema
-- CMC (Consciousness Memory Core) - Bitemporal memory with evidence atoms
CREATE TABLE IF NOT EXISTS aimos_memory_atoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'evidence', 'plan', 'decision', 'artifact'
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Bitemporal tracking
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to TIMESTAMPTZ,
  stored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Relationships
  parent_id UUID REFERENCES aimos_memory_atoms(id),
  thread_id TEXT,
  user_id UUID,
  
  -- Quality metrics
  confidence_score NUMERIC(4,3) DEFAULT 0.5,
  relevance_score NUMERIC(4,3),
  quality_score NUMERIC(4,3),
  
  -- Evidence tracking
  source_refs TEXT[],
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'contradicted'
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HHNI (Hierarchical Hypergraph Navigation) - Tag hierarchy and navigation
CREATE TABLE IF NOT EXISTS aimos_tag_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name TEXT NOT NULL UNIQUE,
  parent_tag TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- APOE (Agentic Plan Orchestration Engine) - Plans and execution
CREATE TABLE IF NOT EXISTS aimos_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  success_criteria JSONB NOT NULL,
  
  -- Plan structure
  steps JSONB NOT NULL, -- Array of step objects
  gates JSONB DEFAULT '{}', -- Quality gates attached to plan
  
  -- Execution tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  current_step INTEGER DEFAULT 0,
  execution_log JSONB DEFAULT '[]',
  
  -- Relationships
  parent_plan_id UUID REFERENCES aimos_plans(id),
  thread_id TEXT,
  user_id UUID,
  
  -- Metadata
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VIF (Validation/Instrumentation/Feedback) - Confidence and observability
CREATE TABLE IF NOT EXISTS aimos_confidence_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL, -- Can reference memory atoms, plans, etc.
  entity_type TEXT NOT NULL, -- 'atom', 'plan', 'decision', 'artifact'
  
  -- Confidence dimensions
  factual_accuracy NUMERIC(4,3),
  completeness NUMERIC(4,3),
  relevance NUMERIC(4,3),
  consistency NUMERIC(4,3),
  
  -- Aggregate scores
  overall_confidence NUMERIC(4,3) NOT NULL,
  confidence_trend TEXT, -- 'increasing', 'stable', 'decreasing'
  
  -- Observability
  validation_count INTEGER DEFAULT 0,
  contradiction_count INTEGER DEFAULT 0,
  last_validated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEG (Shared Evidence Graph) - Evidence relationships and validation
CREATE TABLE IF NOT EXISTS aimos_evidence_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_atom_id UUID NOT NULL REFERENCES aimos_memory_atoms(id),
  target_atom_id UUID NOT NULL REFERENCES aimos_memory_atoms(id),
  
  -- Relationship type
  relationship_type TEXT NOT NULL, -- 'supports', 'contradicts', 'extends', 'references'
  strength NUMERIC(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  
  -- Validation
  validated BOOLEAN DEFAULT false,
  validation_notes TEXT,
  validated_at TIMESTAMPTZ,
  validated_by TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(source_atom_id, target_atom_id, relationship_type)
);

-- Consciousness metrics for the system
CREATE TABLE IF NOT EXISTS aimos_consciousness_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'system_health', 'reasoning_depth', 'coherence'
  
  -- Core metrics
  coherence_score NUMERIC(4,3),
  reasoning_depth INTEGER,
  context_stability NUMERIC(4,3),
  
  -- Operational metrics
  memory_utilization NUMERIC(5,2), -- Percentage
  plan_completion_rate NUMERIC(4,3),
  evidence_consistency NUMERIC(4,3),
  
  -- Meta-circular validation
  self_validation_score NUMERIC(4,3),
  
  metadata JSONB DEFAULT '{}',
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reasoning chains for chain-of-thought tracking
CREATE TABLE IF NOT EXISTS aimos_reasoning_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  user_query TEXT NOT NULL,
  
  -- Reasoning process
  reasoning_steps JSONB NOT NULL, -- Array of reasoning step objects
  final_answer TEXT NOT NULL,
  
  -- Chain characteristics
  depth INTEGER NOT NULL, -- How many reasoning steps
  complexity TEXT, -- 'simple', 'moderate', 'complex', 'advanced'
  response_type TEXT NOT NULL, -- 'short_chat', 'detailed_doc', 'hybrid'
  
  -- Quality metrics
  coherence_score NUMERIC(4,3),
  completeness_score NUMERIC(4,3),
  
  -- Evidence
  evidence_atom_ids UUID[],
  source_refs TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memory_atoms_tags ON aimos_memory_atoms USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_memory_atoms_thread ON aimos_memory_atoms(thread_id);
CREATE INDEX IF NOT EXISTS idx_memory_atoms_confidence ON aimos_memory_atoms(confidence_score);
CREATE INDEX IF NOT EXISTS idx_memory_atoms_valid_time ON aimos_memory_atoms(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_plans_status ON aimos_plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_thread ON aimos_plans(thread_id);
CREATE INDEX IF NOT EXISTS idx_confidence_entity ON aimos_confidence_metrics(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_evidence_graph_source ON aimos_evidence_graph(source_atom_id);
CREATE INDEX IF NOT EXISTS idx_evidence_graph_target ON aimos_evidence_graph(target_atom_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_chains_conversation ON aimos_reasoning_chains(conversation_id);

-- Enable Row Level Security
ALTER TABLE aimos_memory_atoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_tag_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_confidence_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_evidence_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_consciousness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE aimos_reasoning_chains ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read for now, can be restricted later)
CREATE POLICY "Public read access" ON aimos_memory_atoms FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON aimos_memory_atoms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON aimos_memory_atoms FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON aimos_tag_hierarchy FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON aimos_tag_hierarchy FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON aimos_plans FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON aimos_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON aimos_plans FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON aimos_confidence_metrics FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON aimos_confidence_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON aimos_confidence_metrics FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON aimos_evidence_graph FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON aimos_evidence_graph FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON aimos_consciousness_metrics FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON aimos_consciousness_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON aimos_reasoning_chains FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON aimos_reasoning_chains FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_aimos_memory_atoms_updated_at
  BEFORE UPDATE ON aimos_memory_atoms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aimos_plans_updated_at
  BEFORE UPDATE ON aimos_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aimos_confidence_metrics_updated_at
  BEFORE UPDATE ON aimos_confidence_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize default tag hierarchy
INSERT INTO aimos_tag_hierarchy (tag_name, parent_tag, level, description) VALUES
('system', NULL, 0, 'Top-level system concepts'),
('architecture', 'system', 1, 'Architectural patterns and designs'),
('implementation', 'system', 1, 'Implementation details'),
('evidence', NULL, 0, 'Evidence and validation'),
('proof', 'evidence', 1, 'Proof and verification atoms'),
('test', 'evidence', 1, 'Test results and coverage'),
('reasoning', NULL, 0, 'Reasoning and decision making'),
('chain_of_thought', 'reasoning', 1, 'Chain of thought processes'),
('decision', 'reasoning', 1, 'Decision records')
ON CONFLICT (tag_name) DO NOTHING;