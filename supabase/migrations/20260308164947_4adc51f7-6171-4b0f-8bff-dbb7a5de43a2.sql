
-- 1. Add hierarchy columns to agent_genomes
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'specialist';
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS rank_tier INTEGER DEFAULT 3;
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS clearance_level TEXT DEFAULT 'confidential';
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'operations';
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS reports_to TEXT;
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS direct_reports TEXT[] DEFAULT '{}';
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS standing_orders TEXT[] DEFAULT '{}';
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS protocols JSONB DEFAULT '{}';
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS rules_of_engagement TEXT[] DEFAULT '{}';
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS domain_scope TEXT[] DEFAULT '{}';
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS promotion_points INTEGER DEFAULT 0;
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS demotions INTEGER DEFAULT 0;
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS commendations INTEGER DEFAULT 0;
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS infractions INTEGER DEFAULT 0;
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS tournament_wins INTEGER DEFAULT 0;
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS tournament_losses INTEGER DEFAULT 0;
ALTER TABLE agent_genomes ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1200;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS public.agent_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_agent TEXT NOT NULL,
  target_agent TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  trust_score FLOAT DEFAULT 0.5,
  trust_delta_30d FLOAT DEFAULT 0,
  collaboration_count INTEGER DEFAULT 0,
  successful_collaborations INTEGER DEFAULT 0,
  conflict_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_agent, target_agent, relationship_type)
);

CREATE TABLE IF NOT EXISTS public.agent_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_name TEXT NOT NULL UNIQUE,
  protocol_type TEXT NOT NULL,
  description TEXT NOT NULL,
  applies_to TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  enforcement_level TEXT DEFAULT 'mandatory',
  violation_consequence TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_name TEXT NOT NULL,
  tournament_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  config JSONB DEFAULT '{}',
  participants TEXT[] DEFAULT '{}',
  rounds_total INTEGER DEFAULT 3,
  rounds_completed INTEGER DEFAULT 0,
  winner TEXT,
  results JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_tournament_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES agent_tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  round_type TEXT NOT NULL,
  agent_a TEXT NOT NULL,
  agent_b TEXT NOT NULL,
  prompt TEXT NOT NULL,
  agent_a_response TEXT,
  agent_b_response TEXT,
  agent_a_score JSONB,
  agent_b_score JSONB,
  winner TEXT,
  judge_analysis TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_relationships_source ON agent_relationships(source_agent);
CREATE INDEX IF NOT EXISTS idx_agent_relationships_target ON agent_relationships(target_agent);
CREATE INDEX IF NOT EXISTS idx_agent_protocols_type ON agent_protocols(protocol_type);
CREATE INDEX IF NOT EXISTS idx_agent_tournaments_status ON agent_tournaments(status);
CREATE INDEX IF NOT EXISTS idx_agent_tournament_rounds_tid ON agent_tournament_rounds(tournament_id);

-- RLS
ALTER TABLE agent_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tournament_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_agent_relationships" ON agent_relationships FOR SELECT USING (true);
CREATE POLICY "write_agent_relationships" ON agent_relationships FOR INSERT WITH CHECK (true);
CREATE POLICY "upd_agent_relationships" ON agent_relationships FOR UPDATE USING (true);
CREATE POLICY "read_agent_protocols" ON agent_protocols FOR SELECT USING (true);
CREATE POLICY "write_agent_protocols" ON agent_protocols FOR INSERT WITH CHECK (true);
CREATE POLICY "upd_agent_protocols" ON agent_protocols FOR UPDATE USING (true);
CREATE POLICY "read_agent_tournaments" ON agent_tournaments FOR SELECT USING (true);
CREATE POLICY "write_agent_tournaments" ON agent_tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "upd_agent_tournaments" ON agent_tournaments FOR UPDATE USING (true);
CREATE POLICY "read_agent_tournament_rounds" ON agent_tournament_rounds FOR SELECT USING (true);
CREATE POLICY "write_agent_tournament_rounds" ON agent_tournament_rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "upd_agent_tournament_rounds" ON agent_tournament_rounds FOR UPDATE USING (true);
