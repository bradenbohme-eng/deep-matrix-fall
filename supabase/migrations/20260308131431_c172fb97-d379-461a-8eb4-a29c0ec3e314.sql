
-- Evolution proposals table: tracks AI-proposed changes with human approval gates
CREATE TABLE public.evolution_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_type TEXT NOT NULL DEFAULT 'optimization',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  implementation_plan JSONB NOT NULL DEFAULT '{}',
  expected_impact TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied', 'rolled_back', 'failed')),
  source_audit_id UUID,
  system_state_snapshot JSONB DEFAULT '{}',
  applied_changes JSONB DEFAULT '{}',
  rollback_plan JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  review_notes TEXT
);

-- Self-audit log: records every self-audit run
CREATE TABLE public.self_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL DEFAULT 'full',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms DOUBLE PRECISION,
  findings JSONB NOT NULL DEFAULT '[]',
  system_health_score DOUBLE PRECISION,
  proposals_generated INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.evolution_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/manage proposals
CREATE POLICY "Allow all access to evolution_proposals" ON public.evolution_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to self_audit_log" ON public.self_audit_log FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_evolution_proposals_status ON public.evolution_proposals (status);
CREATE INDEX idx_evolution_proposals_priority ON public.evolution_proposals (priority);
CREATE INDEX idx_self_audit_log_type ON public.self_audit_log (audit_type);
CREATE INDEX idx_self_audit_log_started ON public.self_audit_log (started_at DESC);
