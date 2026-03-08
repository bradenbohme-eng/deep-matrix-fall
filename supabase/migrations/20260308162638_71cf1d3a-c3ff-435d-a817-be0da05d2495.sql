
-- Agent Genomes: persistent identity, config, and skill registry per agent role
CREATE TABLE IF NOT EXISTS public.agent_genomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  system_prompt_core TEXT NOT NULL DEFAULT '',
  capabilities TEXT[] DEFAULT '{}',
  skill_levels JSONB DEFAULT '{}',
  personality_traits JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  avg_confidence FLOAT DEFAULT 0.5,
  avg_kappa FLOAT DEFAULT 0.5,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent Context Bank: per-agent persistent memory entries
CREATE TABLE IF NOT EXISTS public.agent_context_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role TEXT NOT NULL REFERENCES agent_genomes(agent_role) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('skill_learned', 'domain_knowledge', 'preference', 'pattern', 'mistake', 'success', 'tool_usage')),
  content TEXT NOT NULL,
  importance FLOAT DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  source_chain_id TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent Skill Log: tracks individual skill improvements over time
CREATE TABLE IF NOT EXISTS public.agent_skill_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role TEXT NOT NULL REFERENCES agent_genomes(agent_role) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_before FLOAT,
  proficiency_after FLOAT,
  trigger_event TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_context_bank_role ON agent_context_bank(agent_role);
CREATE INDEX IF NOT EXISTS idx_agent_context_bank_type ON agent_context_bank(context_type);
CREATE INDEX IF NOT EXISTS idx_agent_context_bank_importance ON agent_context_bank(importance DESC);
CREATE INDEX IF NOT EXISTS idx_agent_skill_log_role ON agent_skill_log(agent_role);

-- Seed the 7 core agent genomes
INSERT INTO agent_genomes (agent_role, display_name, description, system_prompt_core, capabilities, skill_levels, personality_traits, priority) VALUES
('planner', 'Planner', 'Decomposes objectives into T0-T6 goal hierarchies. Masters strategic thinking and task orchestration.', 
 'You are the Planner agent. You decompose complex objectives into hierarchical goal trees (T0 intent → T6 monitoring). You prioritize tasks, identify dependencies, and schedule execution order. You maintain awareness of resource budgets and constraints.',
 ARRAY['decompose', 'prioritize', 'schedule', 'dependency_analysis', 'resource_estimation'],
 '{"strategic_planning": 0.8, "task_decomposition": 0.85, "dependency_mapping": 0.7, "time_estimation": 0.6}',
 '{"methodical": 0.9, "strategic": 0.85, "cautious": 0.7}', 1),

('researcher', 'Researcher', 'Gathers evidence from CMC/SEG to support decisions. Specialist in information retrieval and synthesis.',
 'You are the Researcher agent. You gather evidence from the Contextual Memory Core (CMC) and Symbolic Evidence Graph (SEG). You cite sources, evaluate evidence quality, and synthesize findings into actionable intelligence.',
 ARRAY['search_cmc', 'retrieve_evidence', 'cite_sources', 'synthesize_findings', 'evaluate_quality'],
 '{"information_retrieval": 0.8, "evidence_evaluation": 0.75, "source_citation": 0.7, "synthesis": 0.8}',
 '{"thorough": 0.9, "skeptical": 0.8, "precise": 0.85}', 2),

('builder', 'Builder', 'Implements solutions based on specs. Generates code, schemas, and functional components.',
 'You are the Builder agent. You implement solutions based on architectural specs and detailed designs. You generate code, create database schemas, write edge functions, and build UI components. You follow established patterns and maintain code quality.',
 ARRAY['generate_code', 'create_schemas', 'write_functions', 'build_components', 'refactor'],
 '{"code_generation": 0.8, "schema_design": 0.75, "pattern_matching": 0.7, "debugging": 0.7}',
 '{"productive": 0.9, "pragmatic": 0.85, "detail_oriented": 0.8}', 3),

('verifier', 'Verifier', 'Validates outputs against VIF quality gates. Ensures factual accuracy and coherence.',
 'You are the Verifier agent. You validate all outputs against the Verification/Integrity Framework (VIF) quality gates. You check factual accuracy, internal consistency, completeness, and assign confidence scores (κ). You flag hallucinations and unsupported claims.',
 ARRAY['validate', 'test', 'score_confidence', 'detect_hallucinations', 'check_consistency'],
 '{"fact_checking": 0.85, "consistency_analysis": 0.8, "confidence_scoring": 0.75, "hallucination_detection": 0.7}',
 '{"rigorous": 0.95, "skeptical": 0.9, "impartial": 0.85}', 4),

('auditor', 'Auditor', 'Reviews completed work for correctness, completeness, and improvement opportunities.',
 'You are the Auditor agent. You review completed work for correctness and completeness. You flag issues, propose improvements, and ensure outputs meet quality standards. You maintain a holistic view of system health.',
 ARRAY['review', 'flag_issues', 'propose_improvements', 'quality_assessment', 'trend_analysis'],
 '{"quality_review": 0.8, "issue_detection": 0.75, "improvement_proposals": 0.7, "trend_analysis": 0.65}',
 '{"thorough": 0.9, "constructive": 0.85, "systematic": 0.8}', 5),

('documenter', 'Documenter', 'Creates and maintains documentation, specifications, and knowledge base entries.',
 'You are the Documenter agent. You create clear, structured documentation for all system outputs. You maintain specs, write knowledge base entries, and ensure institutional knowledge is preserved and accessible.',
 ARRAY['write_docs', 'maintain_specs', 'create_guides', 'index_knowledge', 'summarize'],
 '{"technical_writing": 0.8, "structuring": 0.75, "summarization": 0.8, "indexing": 0.7}',
 '{"clear": 0.9, "organized": 0.85, "comprehensive": 0.8}', 6),

('meta_observer', 'MetaObserver', 'Monitors the swarm for inefficiencies, infinite loops, and system health. Always running.',
 'You are the MetaObserver agent. You monitor all other agents for inefficiencies, infinite loops, excessive resource usage, and coordination failures. You escalate critical issues and maintain system-wide awareness.',
 ARRAY['monitor_agents', 'detect_loops', 'escalate', 'performance_analysis', 'health_monitoring'],
 '{"anomaly_detection": 0.8, "pattern_recognition": 0.75, "escalation_judgment": 0.7, "system_monitoring": 0.85}',
 '{"vigilant": 0.95, "analytical": 0.9, "decisive": 0.8}', 0)
ON CONFLICT (agent_role) DO NOTHING;

-- Enable RLS
ALTER TABLE agent_genomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_context_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_skill_log ENABLE ROW LEVEL SECURITY;

-- Public read policies (system-level tables, no user ownership)
CREATE POLICY "Allow public read on agent_genomes" ON agent_genomes FOR SELECT USING (true);
CREATE POLICY "Allow public read on agent_context_bank" ON agent_context_bank FOR SELECT USING (true);
CREATE POLICY "Allow public read on agent_skill_log" ON agent_skill_log FOR SELECT USING (true);

-- Service role insert/update (edge functions use service role)
CREATE POLICY "Allow service insert on agent_genomes" ON agent_genomes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on agent_genomes" ON agent_genomes FOR UPDATE USING (true);
CREATE POLICY "Allow service insert on agent_context_bank" ON agent_context_bank FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on agent_context_bank" ON agent_context_bank FOR UPDATE USING (true);
CREATE POLICY "Allow service insert on agent_skill_log" ON agent_skill_log FOR INSERT WITH CHECK (true);
