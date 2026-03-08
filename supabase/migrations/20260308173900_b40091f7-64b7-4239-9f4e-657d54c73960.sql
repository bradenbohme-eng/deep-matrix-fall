
-- Add missing columns to system_prompts
ALTER TABLE public.system_prompts ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE public.system_prompts ADD COLUMN IF NOT EXISTS source_proposal_id UUID REFERENCES public.evolution_proposals(id);

-- Seed default prompts (ignore conflicts)
INSERT INTO public.system_prompts (prompt_key, prompt_text, category, priority, is_active) VALUES
('cognitive_loop_protocol', 'Always reference retrieved CMC memory atoms when answering. If a fact was ingested into memory, use it in your response verbatim when relevant.', 'memory', 10, true),
('verification_mandate', 'For analytical claims, compute and report confidence levels. Flag low-confidence assertions explicitly.', 'vif', 8, true),
('agent_coordination', 'When planning multi-step tasks, delegate to the appropriate specialist agent based on their skill profile and past performance.', 'apoe', 7, true)
ON CONFLICT (prompt_key) DO NOTHING;
