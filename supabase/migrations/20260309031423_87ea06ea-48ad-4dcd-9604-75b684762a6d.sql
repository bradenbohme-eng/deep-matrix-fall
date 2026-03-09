
-- Work orders table for structured agent dispatching
CREATE TABLE IF NOT EXISTS public.work_orders (
  id text PRIMARY KEY,
  mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
  step_id text NOT NULL,
  assigned_agent text NOT NULL,
  objective text NOT NULL,
  tool_whitelist text[] NOT NULL DEFAULT '{}',
  risk_ceiling text NOT NULL DEFAULT 'low',
  token_budget integer NOT NULL DEFAULT 10000,
  timeout_ms integer NOT NULL DEFAULT 60000,
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Tool action log for audit trail
CREATE TABLE IF NOT EXISTS public.tool_action_log (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  work_order_id text,
  mission_id uuid REFERENCES public.missions(id),
  tool_name text NOT NULL,
  tool_class text NOT NULL,
  risk_class text NOT NULL DEFAULT 'minimal',
  intent text,
  input_summary text,
  status text NOT NULL DEFAULT 'planned',
  result_summary text,
  error_summary text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add missing columns to missions if needed
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS autonomy_tier integer NOT NULL DEFAULT 0;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS allowed_tools text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS forbidden_actions text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS budget_limits jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS stop_conditions text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS escalation_conditions text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS success_metrics text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS steps jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS current_step_index integer DEFAULT 0;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS rollback_plan text;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS abort_reason text;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_action_log ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='work_orders' AND policyname='Allow all on work_orders') THEN
    CREATE POLICY "Allow all on work_orders" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tool_action_log' AND policyname='Allow all on tool_action_log') THEN
    CREATE POLICY "Allow all on tool_action_log" ON public.tool_action_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
