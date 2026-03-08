
-- Test scenarios and their runs
CREATE TABLE public.aimos_test_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  scenario_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.aimos_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.aimos_test_scenarios(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running',
  steps JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- VM/External connections
CREATE TABLE public.aimos_vm_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  connection_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'untested',
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS for now (system-level tables)
ALTER TABLE public.aimos_test_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aimos_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aimos_vm_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to test scenarios" ON public.aimos_test_scenarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to test runs" ON public.aimos_test_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to vm connections" ON public.aimos_vm_connections FOR ALL USING (true) WITH CHECK (true);
