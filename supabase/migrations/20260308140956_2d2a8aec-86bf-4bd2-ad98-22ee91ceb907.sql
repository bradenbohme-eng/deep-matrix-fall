-- Phase 1: Add CMC memory level system to atoms table
ALTER TABLE aimos_memory_atoms 
  ADD COLUMN IF NOT EXISTS memory_level TEXT DEFAULT 'warm',
  ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS compressed_from UUID,
  ADD COLUMN IF NOT EXISTS compression_ratio FLOAT;

-- Set existing atoms to warm
UPDATE aimos_memory_atoms SET memory_level = 'warm' WHERE memory_level IS NULL;

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_atoms_memory_level ON aimos_memory_atoms(memory_level);
CREATE INDEX IF NOT EXISTS idx_atoms_last_accessed ON aimos_memory_atoms(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_atoms_access_count ON aimos_memory_atoms(access_count DESC);