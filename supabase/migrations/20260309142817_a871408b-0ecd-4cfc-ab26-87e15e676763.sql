-- AI Action Queue: Approval-gated autonomous actions
CREATE TABLE IF NOT EXISTS public.ai_action_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  title text NOT NULL,
  description text,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  priority integer DEFAULT 5,
  source_chain_id text,
  agent_role text DEFAULT 'meta_observer',
  auto_approve boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text,
  execution_result jsonb,
  expires_at timestamptz DEFAULT (now() + interval '1 hour')
);

ALTER TABLE public.ai_action_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ai_action_queue" ON public.ai_action_queue
  FOR ALL USING (true) WITH CHECK (true);

-- Autonomy settings table
CREATE TABLE IF NOT EXISTS public.ai_autonomy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_autonomy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ai_autonomy_settings" ON public.ai_autonomy_settings
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.ai_autonomy_settings (setting_key, setting_value) VALUES
  ('auto_approve_memory_writes', '{"enabled": false, "max_per_hour": 10}'),
  ('auto_approve_config_changes', '{"enabled": false}'),
  ('auto_approve_task_creation', '{"enabled": true, "max_per_hour": 20}'),
  ('auto_approve_entity_creation', '{"enabled": true, "max_per_hour": 50}'),
  ('auto_approve_evolution_proposals', '{"enabled": false}'),
  ('global_autonomy_level', '{"level": "supervised", "options": ["locked", "supervised", "autonomous"]}')
ON CONFLICT (setting_key) DO NOTHING;