
-- Phase 4: Dynamic config and system prompts tables for actionable self-evolution

CREATE TABLE public.aimos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by TEXT DEFAULT 'system',
  proposal_id UUID REFERENCES public.evolution_proposals(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL UNIQUE,
  prompt_text TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'manual',
  proposal_id UUID REFERENCES public.evolution_proposals(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.aimos_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to aimos_config" ON public.aimos_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to system_prompts" ON public.system_prompts FOR ALL USING (true) WITH CHECK (true);

-- Seed default config values
INSERT INTO public.aimos_config (config_key, config_value, description) VALUES
  ('vif_kappa_threshold', '{"value": 0.6}'::jsonb, 'Minimum κ score for quality gate'),
  ('cmc_decay_interval_hours', '{"value": 24}'::jsonb, 'Hours between memory decay cycles'),
  ('cmc_compression_target', '{"value": 0.3}'::jsonb, 'Target compression ratio for cold atoms'),
  ('memory_retrieval_limit', '{"value": 8}'::jsonb, 'Max atoms to retrieve per query'),
  ('context_token_budget', '{"value": 6000}'::jsonb, 'Token budget for context injection');
