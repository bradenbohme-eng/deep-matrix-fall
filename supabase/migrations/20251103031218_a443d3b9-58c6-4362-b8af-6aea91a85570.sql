-- AIM-OS Inspired Database Schema
-- CMC: Continuous Memory Context - Persistent conversation memory
-- VIF: Verification & Integrity Framework - Confidence tracking
-- SEG: Semantic Entity Graph - Knowledge synthesis
-- TCS: Timeline Context System - Interaction tracking

-- Chat memories table (CMC-inspired)
CREATE TABLE IF NOT EXISTS chat_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.85 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  mode TEXT DEFAULT 'chat',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge entities table (SEG-inspired)
CREATE TABLE IF NOT EXISTS knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  content TEXT NOT NULL,
  relations TEXT[] DEFAULT '{}',
  confidence DECIMAL(3,2) DEFAULT 0.85 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed TIMESTAMPTZ DEFAULT now()
);

-- Timeline events table (TCS-inspired)
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_memories_conversation ON chat_memories(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_memories_user ON chat_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_memories_created ON chat_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_type ON knowledge_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_user ON knowledge_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_conversation ON timeline_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_created ON timeline_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE chat_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_memories
CREATE POLICY "Users can view their own chat memories"
  ON chat_memories FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own chat memories"
  ON chat_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own chat memories"
  ON chat_memories FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for knowledge_entities
CREATE POLICY "Users can view their own knowledge entities"
  ON knowledge_entities FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own knowledge entities"
  ON knowledge_entities FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own knowledge entities"
  ON knowledge_entities FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for timeline_events
CREATE POLICY "Users can view timeline events"
  ON timeline_events FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert timeline events"
  ON timeline_events FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
CREATE TRIGGER update_chat_memories_updated_at_trigger
  BEFORE UPDATE ON chat_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_memories_updated_at();

-- Function to update last_accessed timestamp
CREATE OR REPLACE FUNCTION update_knowledge_entities_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating last_accessed
CREATE TRIGGER update_knowledge_entities_accessed_trigger
  BEFORE UPDATE ON knowledge_entities
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_entities_accessed();