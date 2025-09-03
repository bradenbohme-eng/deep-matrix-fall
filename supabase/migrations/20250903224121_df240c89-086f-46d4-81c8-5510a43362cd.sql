-- Core warfare simulation schema
-- Factions table
CREATE TABLE IF NOT EXISTS public.factions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  ideology JSONB NOT NULL DEFAULT '{}'::jsonb,
  resources JSONB NOT NULL DEFAULT '{"isk": 1000000, "reputation": 0, "intel": 0}'::jsonb,
  territory_control JSONB NOT NULL DEFAULT '[]'::jsonb,
  diplomatic_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_personality JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Players table with warfare progression
CREATE TABLE IF NOT EXISTS public.warfare_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  faction_id UUID REFERENCES public.factions(id),
  rank TEXT NOT NULL DEFAULT 'recruit',
  resources JSONB NOT NULL DEFAULT '{"isk": 10000, "reputation": 0, "intel": 0}'::jsonb,
  skills JSONB NOT NULL DEFAULT '{}'::jsonb,
  clearance_level INTEGER NOT NULL DEFAULT 1,
  active_missions JSONB NOT NULL DEFAULT '[]'::jsonb,
  personal_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  neural_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- World War Clock - global tension system
CREATE TABLE IF NOT EXISTS public.world_war_clock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_time NUMERIC NOT NULL DEFAULT 300, -- minutes to midnight
  tension_factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  recent_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  escalation_probability NUMERIC NOT NULL DEFAULT 0.1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Global events and narrative arcs
CREATE TABLE IF NOT EXISTS public.global_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  preconditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  consequences JSONB NOT NULL DEFAULT '{}'::jsonb,
  affected_factions JSONB NOT NULL DEFAULT '[]'::jsonb,
  probability NUMERIC NOT NULL DEFAULT 0.5,
  active BOOLEAN NOT NULL DEFAULT true,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Player missions and personalized quests
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.warfare_players(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Intel system - classified information
CREATE TABLE IF NOT EXISTS public.intel_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.warfare_players(id),
  intel_type TEXT NOT NULL,
  classification_level INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  value_isk NUMERIC NOT NULL DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  tradeable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Real-time warfare events
CREATE TABLE IF NOT EXISTS public.warfare_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL, -- 'player', 'faction', 'ai'
  actor_id UUID NOT NULL,
  target_type TEXT,
  target_id UUID,
  action_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  impact_score NUMERIC NOT NULL DEFAULT 0,
  global_effect JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI narrative state
CREATE TABLE IF NOT EXISTS public.narrative_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type TEXT NOT NULL,
  context_id UUID NOT NULL,
  narrative_threads JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_plotlines JSONB NOT NULL DEFAULT '[]'::jsonb,
  character_relationships JSONB NOT NULL DEFAULT '{}'::jsonb,
  tension_levels JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warfare_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_war_clock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warfare_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public access to factions" ON public.factions FOR SELECT USING (true);
CREATE POLICY "Players can view their own data" ON public.warfare_players FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public access to world clock" ON public.world_war_clock FOR SELECT USING (true);
CREATE POLICY "Public access to global events" ON public.global_events FOR SELECT USING (true);
CREATE POLICY "Players can access their missions" ON public.missions FOR ALL USING (player_id IN (SELECT id FROM public.warfare_players WHERE user_id = auth.uid()));
CREATE POLICY "Players can manage their intel" ON public.intel_assets FOR ALL USING (owner_id IN (SELECT id FROM public.warfare_players WHERE user_id = auth.uid()));
CREATE POLICY "Public access to warfare events" ON public.warfare_events FOR SELECT USING (true);
CREATE POLICY "Public access to narrative state" ON public.narrative_state FOR SELECT USING (true);

-- Triggers for timestamps
CREATE TRIGGER update_factions_updated_at BEFORE UPDATE ON public.factions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warfare_players_updated_at BEFORE UPDATE ON public.warfare_players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_warfare_players_user ON public.warfare_players (user_id);
CREATE INDEX IF NOT EXISTS idx_warfare_players_faction ON public.warfare_players (faction_id);
CREATE INDEX IF NOT EXISTS idx_missions_player ON public.missions (player_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON public.missions (status);
CREATE INDEX IF NOT EXISTS idx_intel_owner ON public.intel_assets (owner_id);
CREATE INDEX IF NOT EXISTS idx_warfare_events_actor ON public.warfare_events (actor_id);
CREATE INDEX IF NOT EXISTS idx_warfare_events_timestamp ON public.warfare_events (timestamp);

-- Insert initial factions
INSERT INTO public.factions (name, description, ideology, resources) VALUES
('Neo-Corporate Syndicate', 'Advanced corporate entities controlling vast economic networks', '{"focus": "economic_dominance", "methods": ["market_manipulation", "corporate_espionage"], "values": ["efficiency", "profit", "innovation"]}', '{"isk": 50000000, "reputation": 75, "intel": 25}'),
('Digital Liberation Front', 'Decentralized hacker collective fighting for information freedom', '{"focus": "information_liberation", "methods": ["cyber_warfare", "data_liberation"], "values": ["transparency", "freedom", "privacy"]}', '{"isk": 10000000, "reputation": 30, "intel": 85}'),
('Quantum Defense Alliance', 'Military-industrial complex with advanced AI systems', '{"focus": "technological_superiority", "methods": ["advanced_warfare", "ai_development"], "values": ["security", "order", "progress"]}', '{"isk": 75000000, "reputation": 60, "intel": 40}'),
('Shadow Mercenary Guild', 'Elite operatives for hire across all conflicts', '{"focus": "tactical_operations", "methods": ["assassination", "sabotage", "extraction"], "values": ["professionalism", "neutrality", "excellence"]}', '{"isk": 25000000, "reputation": 45, "intel": 70}');

-- Initialize world war clock
INSERT INTO public.world_war_clock (current_time, tension_factors) VALUES
(300, '{"nuclear_tension": 0.2, "cyber_warfare": 0.4, "economic_instability": 0.3, "ai_anomalies": 0.1}');