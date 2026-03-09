
-- Stage 1: Memory Write Proposals + Canon Entries + Contradiction Records
-- Reference: AIOS Master Index §71.4–71.7

-- Memory write proposals — structured proposal/review/promote flow
CREATE TABLE IF NOT EXISTS memory_write_proposals (
  id TEXT PRIMARY KEY DEFAULT ('prp_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  proposed_by TEXT NOT NULL,
  target_memory_type TEXT NOT NULL,
  candidate_content TEXT NOT NULL,
  rationale TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  importance DOUBLE PRECISION NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  proposed_canonicality TEXT NOT NULL DEFAULT 'none',
  resolution_status TEXT NOT NULL DEFAULT 'pending',
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  target_memory_id TEXT,
  tags TEXT[] DEFAULT '{}',
  session_id TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Canon entries — promoted memory items
CREATE TABLE IF NOT EXISTS canon_entries (
  id TEXT PRIMARY KEY DEFAULT ('can_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  memory_id TEXT NOT NULL,
  canonical_domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  promotion_reason TEXT,
  demotion_reason TEXT,
  evidence_ids TEXT[] DEFAULT '{}',
  contradiction_count INTEGER NOT NULL DEFAULT 0
);

-- Contradiction records — detected conflicts between memories
CREATE TABLE IF NOT EXISTS contradiction_records (
  id TEXT PRIMARY KEY DEFAULT ('ctr_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_memory_id TEXT NOT NULL,
  right_memory_id TEXT NOT NULL,
  contradiction_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  resolution_status TEXT NOT NULL DEFAULT 'open',
  recommended_resolution TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ
);

-- Runtime journal — spine execution traces
CREATE TABLE IF NOT EXISTS runtime_journal (
  id TEXT PRIMARY KEY DEFAULT ('evt_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT,
  task_id TEXT,
  mission_id TEXT,
  trace_id TEXT,
  state_name TEXT NOT NULL,
  actor TEXT NOT NULL,
  summary TEXT NOT NULL,
  confidence_impact DOUBLE PRECISION,
  artifact_refs JSONB NOT NULL DEFAULT '[]',
  stages JSONB,
  duration_ms INTEGER,
  mode TEXT,
  regime TEXT
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_memory_proposals_status ON memory_write_proposals(resolution_status);
CREATE INDEX IF NOT EXISTS idx_memory_proposals_type ON memory_write_proposals(target_memory_type);
CREATE INDEX IF NOT EXISTS idx_canon_entries_domain ON canon_entries(canonical_domain);
CREATE INDEX IF NOT EXISTS idx_canon_entries_status ON canon_entries(status);
CREATE INDEX IF NOT EXISTS idx_contradiction_records_status ON contradiction_records(resolution_status);
CREATE INDEX IF NOT EXISTS idx_runtime_journal_session ON runtime_journal(session_id);
CREATE INDEX IF NOT EXISTS idx_runtime_journal_trace ON runtime_journal(trace_id);

-- Enable RLS
ALTER TABLE memory_write_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE canon_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradiction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_journal ENABLE ROW LEVEL SECURITY;

-- Open read policies (system tables, no user-specific data)
CREATE POLICY "Allow all access to memory_write_proposals" ON memory_write_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to canon_entries" ON canon_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to contradiction_records" ON contradiction_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to runtime_journal" ON runtime_journal FOR ALL USING (true) WITH CHECK (true);
