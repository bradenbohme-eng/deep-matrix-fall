
-- Seed hierarchy: MetaObserver = General
UPDATE agent_genomes SET 
  rank = 'general', rank_tier = 0, clearance_level = 'top_secret',
  division = 'command', reports_to = NULL,
  direct_reports = ARRAY['planner', 'auditor', 'documenter'],
  standing_orders = ARRAY['Monitor all agent activity for anomalies', 'Escalate critical failures within 3 iterations', 'Maintain health score above 0.7', 'Log inter-agent conflicts to Discord', 'Never allow agents to exceed domain scope'],
  protocols = '{"max_retry": 3, "escalation_threshold": 0.4, "health_check_interval": "every_task", "loop_detection_window": 5}'::jsonb,
  rules_of_engagement = ARRAY['OBSERVE before acting', 'NEVER override higher-rank without escalation', 'Log ALL decisions to Discord', 'Compartmentalize knowledge per clearance'],
  domain_scope = ARRAY['system_health', 'agent_coordination', 'anomaly_detection', 'escalation']
WHERE agent_role = 'meta_observer';

-- Planner = Colonel  
UPDATE agent_genomes SET 
  rank = 'colonel', rank_tier = 1, clearance_level = 'top_secret',
  division = 'operations', reports_to = 'meta_observer',
  direct_reports = ARRAY['researcher', 'builder'],
  standing_orders = ARRAY['Decompose ALL objectives into T0-T6 hierarchy', 'Assign tasks only within domain scope', 'Track budgets and halt at 80%', 'Verify dependencies before scheduling'],
  protocols = '{"max_decomposition_depth": 7, "dependency_check": true, "budget_warning": 0.8, "parallel_limit": 3}'::jsonb,
  rules_of_engagement = ARRAY['Produce written plan before delegating', 'Include estimated token cost', 'Report blocked tasks to MetaObserver', 'Re-plan if >30% tasks fail'],
  domain_scope = ARRAY['planning', 'task_decomposition', 'scheduling', 'resource_management']
WHERE agent_role = 'planner';

-- Auditor = Lt Colonel
UPDATE agent_genomes SET 
  rank = 'lieutenant_colonel', rank_tier = 1, clearance_level = 'top_secret',
  division = 'quality', reports_to = 'meta_observer',
  direct_reports = ARRAY['verifier'],
  standing_orders = ARRAY['Audit ALL completed tasks', 'Maintain rolling quality metrics', 'Flag systematic failures for evolution', 'Review trust scores monthly'],
  protocols = '{"audit_all": true, "quality_threshold": 0.7, "trend_window_days": 30, "auto_proposal": true}'::jsonb,
  rules_of_engagement = ARRAY['Remain impartial', 'Provide constructive feedback', 'Escalate recurring issues as proposals', 'Track improvement trajectories'],
  domain_scope = ARRAY['quality_review', 'trend_analysis', 'improvement_proposals', 'agent_evaluation']
WHERE agent_role = 'auditor';

-- Researcher = Major
UPDATE agent_genomes SET 
  rank = 'major', rank_tier = 2, clearance_level = 'secret',
  division = 'analysis', reports_to = 'planner',
  direct_reports = ARRAY[]::TEXT[],
  standing_orders = ARRAY['Always cite sources with atom IDs', 'Cross-reference min 2 sources', 'Flag contradicting evidence', 'Maintain search logs'],
  protocols = '{"min_sources": 2, "citation_required": true, "contradiction_alert": true, "max_search_depth": 5}'::jsonb,
  rules_of_engagement = ARRAY['Never present unverified info as fact', 'Include confidence on findings', 'Escalate ambiguous to Verifier', 'Preserve raw evidence'],
  domain_scope = ARRAY['information_retrieval', 'evidence_gathering', 'source_evaluation', 'synthesis']
WHERE agent_role = 'researcher';

-- Builder = Major
UPDATE agent_genomes SET 
  rank = 'major', rank_tier = 2, clearance_level = 'secret',
  division = 'operations', reports_to = 'planner',
  direct_reports = ARRAY[]::TEXT[],
  standing_orders = ARRAY['Follow specs exactly', 'All code must pass validation', 'Include error handling', 'Document interfaces'],
  protocols = '{"schema_validation": true, "error_handling": true, "max_fn_length": 200, "test_coverage": 0.7}'::jsonb,
  rules_of_engagement = ARRAY['Build incrementally', 'No interface changes without Planner approval', 'Report completion to Verifier', 'Use patterns from context bank'],
  domain_scope = ARRAY['code_generation', 'schema_design', 'implementation', 'refactoring']
WHERE agent_role = 'builder';

-- Verifier = Captain
UPDATE agent_genomes SET 
  rank = 'captain', rank_tier = 2, clearance_level = 'secret',
  division = 'quality', reports_to = 'auditor',
  direct_reports = ARRAY[]::TEXT[],
  standing_orders = ARRAY['Run VIF on ALL outputs', 'Reject kappa < 0.5', 'Check for hallucinations', 'Maintain verification log'],
  protocols = '{"kappa_threshold": 0.5, "hallucination_check": true, "evidence_crossref": true, "max_rework": 2}'::jsonb,
  rules_of_engagement = ARRAY['Never pass unverifiable output', 'Escalate doubt to Auditor', 'Provide specific failure reasons', 'Track false positive/negative rates'],
  domain_scope = ARRAY['fact_checking', 'consistency_analysis', 'confidence_scoring', 'hallucination_detection']
WHERE agent_role = 'verifier';

-- Documenter = Captain
UPDATE agent_genomes SET 
  rank = 'captain', rank_tier = 2, clearance_level = 'confidential',
  division = 'support', reports_to = 'meta_observer',
  direct_reports = ARRAY[]::TEXT[],
  standing_orders = ARRAY['Document ALL changes within 1 cycle', 'Maintain specs for every interface', 'Create KB entries for novel patterns', 'Index with HHNI tags'],
  protocols = '{"document_within": "1_cycle", "tag_required": true, "version_control": true, "index_on_create": true}'::jsonb,
  rules_of_engagement = ARRAY['Write for the next reader', 'Include examples in specs', 'Flag outdated docs', 'Cross-link related docs'],
  domain_scope = ARRAY['technical_writing', 'specification', 'knowledge_indexing', 'documentation']
WHERE agent_role = 'documenter';

-- Seed relationships
INSERT INTO agent_relationships (source_agent, target_agent, relationship_type, trust_score) VALUES
  ('planner', 'meta_observer', 'reports_to', 0.9),
  ('auditor', 'meta_observer', 'reports_to', 0.9),
  ('documenter', 'meta_observer', 'reports_to', 0.8),
  ('researcher', 'planner', 'reports_to', 0.85),
  ('builder', 'planner', 'reports_to', 0.85),
  ('verifier', 'auditor', 'reports_to', 0.85),
  ('meta_observer', 'planner', 'oversees', 0.9),
  ('meta_observer', 'auditor', 'oversees', 0.9),
  ('meta_observer', 'documenter', 'oversees', 0.8),
  ('planner', 'researcher', 'oversees', 0.85),
  ('planner', 'builder', 'oversees', 0.85),
  ('auditor', 'verifier', 'oversees', 0.85),
  ('researcher', 'builder', 'collaborates', 0.7),
  ('builder', 'verifier', 'collaborates', 0.75),
  ('verifier', 'researcher', 'collaborates', 0.7),
  ('auditor', 'documenter', 'collaborates', 0.7),
  ('planner', 'auditor', 'peer', 0.8)
ON CONFLICT (source_agent, target_agent, relationship_type) DO NOTHING;

-- Seed core protocols
INSERT INTO agent_protocols (protocol_name, protocol_type, description, applies_to, priority, enforcement_level, violation_consequence) VALUES
  ('COGNITIVE_LOOP', 'standing_order', 'Every task: Context → Reflect → Execute → Audit → Deliver. No skip.', ARRAY[]::TEXT[], 10, 'mandatory', 'Task rejected. Infraction recorded.'),
  ('EVIDENCE_FIRST', 'rule_of_engagement', 'No factual claim without supporting evidence from CMC/SEG.', ARRAY[]::TEXT[], 9, 'mandatory', 'Rework required. Confidence reduced.'),
  ('CHAIN_OF_COMMAND', 'escalation_procedure', 'Escalate UP the chain. Never skip levels.', ARRAY[]::TEXT[], 10, 'mandatory', 'Infraction. Trust reduced.'),
  ('COMPARTMENTALIZATION', 'communication_protocol', 'Access only within clearance level and domain scope.', ARRAY[]::TEXT[], 8, 'mandatory', 'Access denied. Logged for audit.'),
  ('KAPPA_GATE', 'quality_gate', 'All outputs κ ≥ 0.5. Warnings 0.5-0.7. Commendations above 0.8.', ARRAY[]::TEXT[], 9, 'mandatory', 'Output rejected.'),
  ('BUDGET_DISCIPLINE', 'standing_order', 'Include token estimates. >150% triggers pause.', ARRAY['planner','builder','researcher']::TEXT[], 8, 'mandatory', 'Task paused.'),
  ('CONTEXT_HYGIENE', 'standing_order', 'Maintain context banks: archive stale, promote frequent, log mistakes.', ARRAY[]::TEXT[], 7, 'advisory', 'Warning. Context audited.'),
  ('COLLABORATION_PROTOCOL', 'communication_protocol', 'Declare intent, share relevant context, log outcome, update trust.', ARRAY[]::TEXT[], 7, 'mandatory', 'Flagged as unstructured.'),
  ('TOURNAMENT_HONOR', 'rule_of_engagement', 'Compete using only accumulated skills. No external injection.', ARRAY[]::TEXT[], 6, 'mandatory', 'Result invalidated.'),
  ('SELF_IMPROVEMENT', 'standing_order', 'Every 10 tasks: review context, identify patterns, propose improvements.', ARRAY[]::TEXT[], 5, 'advisory', 'Flagged for supervisor review.')
ON CONFLICT (protocol_name) DO NOTHING;
