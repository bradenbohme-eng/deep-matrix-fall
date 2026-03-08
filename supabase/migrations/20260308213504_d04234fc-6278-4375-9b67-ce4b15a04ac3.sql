
-- ══════════════════════════════════════════════════════════════
-- CONTEXTUAL SYNC — Bitemporal Contract Index (BCI) Schema
-- ══════════════════════════════════════════════════════════════

-- 1. BCI Entities — Core bitemporal contract index
CREATE TABLE public.bci_entities (
  entity_id text PRIMARY KEY,
  kind text NOT NULL DEFAULT 'function',
  path text,
  language text,
  owner text,
  visibility text DEFAULT 'public',
  span jsonb DEFAULT '{}',
  contract jsonb DEFAULT '{}',
  weights jsonb DEFAULT '{}',
  boundary_views jsonb DEFAULT '{}',
  dependencies jsonb DEFAULT '{}',
  quartet jsonb DEFAULT '{"code_refs":[],"doc_refs":[],"test_refs":[],"trace_refs":[]}',
  sync_status text NOT NULL DEFAULT 'UNINDEXED',
  parity_score float DEFAULT 0,
  confidence_score float DEFAULT 0,
  blast_radius int DEFAULT 0,
  stale_reasons text[] DEFAULT '{}',
  contradiction_refs text[] DEFAULT '{}',
  tx_time timestamptz NOT NULL DEFAULT now(),
  valid_time_start timestamptz NOT NULL DEFAULT now(),
  valid_time_end timestamptz,
  supersedes text,
  superseded_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. BCI Entity Versions — Historical version chain
CREATE TABLE public.bci_entity_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text NOT NULL REFERENCES public.bci_entities(entity_id) ON DELETE CASCADE,
  version_number int NOT NULL DEFAULT 1,
  contract jsonb DEFAULT '{}',
  weights jsonb DEFAULT '{}',
  boundary_views jsonb DEFAULT '{}',
  dependencies jsonb DEFAULT '{}',
  dependency_hash text,
  tx_time timestamptz NOT NULL DEFAULT now(),
  valid_time_start timestamptz NOT NULL DEFAULT now(),
  valid_time_end timestamptz
);

-- 3. Sync Evaluations — Gate decision records
CREATE TABLE public.sync_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_entities text[] NOT NULL DEFAULT '{}',
  event text,
  status_before text,
  status_after text,
  scores jsonb DEFAULT '{}',
  policy jsonb DEFAULT '{}',
  detected_failures text[] DEFAULT '{}',
  contradiction_refs text[] DEFAULT '{}',
  recommended_action text DEFAULT 'PROCEED',
  tx_time timestamptz NOT NULL DEFAULT now(),
  valid_time_start timestamptz NOT NULL DEFAULT now(),
  valid_time_end timestamptz
);

-- 4. Sync Witnesses — Evidence binding
CREATE TABLE public.sync_witnesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'test_run',
  subject_entities text[] NOT NULL DEFAULT '{}',
  claims_supported text[] DEFAULT '{}',
  result text,
  environment jsonb DEFAULT '{}',
  artifacts text[] DEFAULT '{}',
  tx_time timestamptz NOT NULL DEFAULT now(),
  valid_time_start timestamptz NOT NULL DEFAULT now(),
  valid_time_end timestamptz
);

-- 5. Sync Contradictions — First-class contradiction objects
CREATE TABLE public.sync_contradictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  object text NOT NULL,
  relation text,
  reason text,
  severity text DEFAULT 'medium',
  status text DEFAULT 'open',
  tx_time timestamptz NOT NULL DEFAULT now(),
  valid_time_start timestamptz NOT NULL DEFAULT now(),
  valid_time_end timestamptz
);

-- 6. Sync Remediation Atoms — Bounded repair tasks
CREATE TABLE public.sync_remediation_atoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_evaluation_id uuid REFERENCES public.sync_evaluations(id) ON DELETE SET NULL,
  target_entity text,
  failure_class text,
  missing_dimensions text[] DEFAULT '{}',
  required_context text[] DEFAULT '{}',
  narrowed_task text,
  retry_budget_remaining int DEFAULT 3,
  authority_tier text DEFAULT 'auto',
  escalation_target text,
  status text DEFAULT 'pending',
  tx_time timestamptz NOT NULL DEFAULT now()
);

-- 7. Sync Policy Profiles — Configurable gate thresholds
CREATE TABLE public.sync_policy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  min_confidence float DEFAULT 0.6,
  min_parity float DEFAULT 0.5,
  min_witness_coverage float DEFAULT 0.3,
  max_blast_radius_auto int DEFAULT 10,
  max_auto_retries int DEFAULT 3,
  block_on text[] DEFAULT '{"BLOCKED","ESCALATED"}',
  warn_on text[] DEFAULT '{"STALE","DRIFTED"}',
  version int DEFAULT 1,
  is_active boolean DEFAULT true
);

-- Indexes
CREATE INDEX idx_bci_entities_sync_status ON public.bci_entities(sync_status);
CREATE INDEX idx_bci_entities_path ON public.bci_entities(path);
CREATE INDEX idx_bci_entities_kind ON public.bci_entities(kind);
CREATE INDEX idx_bci_entities_tx_time ON public.bci_entities(tx_time DESC);
CREATE INDEX idx_bci_entity_versions_entity ON public.bci_entity_versions(entity_id);
CREATE INDEX idx_sync_evaluations_tx ON public.sync_evaluations(tx_time DESC);
CREATE INDEX idx_sync_contradictions_status ON public.sync_contradictions(status);
CREATE INDEX idx_sync_remediation_status ON public.sync_remediation_atoms(status);

-- Enable RLS (public access for edge functions using service role)
ALTER TABLE public.bci_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bci_entity_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_witnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_remediation_atoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_policy_profiles ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read bci_entities" ON public.bci_entities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read bci_entity_versions" ON public.bci_entity_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read sync_evaluations" ON public.sync_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read sync_witnesses" ON public.sync_witnesses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read sync_contradictions" ON public.sync_contradictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read sync_remediation_atoms" ON public.sync_remediation_atoms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read sync_policy_profiles" ON public.sync_policy_profiles FOR SELECT TO authenticated USING (true);

-- Allow anon read for dashboard (since no auth implemented yet)
CREATE POLICY "Allow anon read bci_entities" ON public.bci_entities FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read bci_entity_versions" ON public.bci_entity_versions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read sync_evaluations" ON public.sync_evaluations FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read sync_witnesses" ON public.sync_witnesses FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read sync_contradictions" ON public.sync_contradictions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read sync_remediation_atoms" ON public.sync_remediation_atoms FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read sync_policy_profiles" ON public.sync_policy_profiles FOR SELECT TO anon USING (true);

-- Seed default policy profile
INSERT INTO public.sync_policy_profiles (name, min_confidence, min_parity, min_witness_coverage, max_blast_radius_auto, max_auto_retries, is_active)
VALUES ('default', 0.6, 0.5, 0.3, 10, 3, true),
       ('strict', 0.8, 0.7, 0.6, 5, 2, false),
       ('lenient', 0.4, 0.3, 0.1, 20, 5, false);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_bci_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_bci_entities_updated_at
  BEFORE UPDATE ON public.bci_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_bci_updated_at();
