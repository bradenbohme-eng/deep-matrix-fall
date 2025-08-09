-- Knowledge Graph schema for progressive diagram and RAG context
-- 1) Nodes table
CREATE TABLE IF NOT EXISTS public.knowledge_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'concept',
  summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  importance NUMERIC NOT NULL DEFAULT 0.5,
  activity_score NUMERIC NOT NULL DEFAULT 0,
  external_ref_type TEXT, -- e.g. 'document', 'section', 'url', 'code_file'
  external_ref_id TEXT,   -- e.g. document/section UUID, URL, or file path
  embedding VECTOR(1536), -- optional semantic search support
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and policies
ALTER TABLE public.knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge nodes" ON public.knowledge_graph_nodes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge nodes" ON public.knowledge_graph_nodes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge nodes" ON public.knowledge_graph_nodes
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge nodes" ON public.knowledge_graph_nodes
FOR DELETE USING (auth.uid() = user_id);

-- Timestamps trigger
CREATE TRIGGER update_knowledge_graph_nodes_updated_at
BEFORE UPDATE ON public.knowledge_graph_nodes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_kgn_user ON public.knowledge_graph_nodes (user_id);
CREATE INDEX IF NOT EXISTS idx_kgn_type ON public.knowledge_graph_nodes (type);
CREATE INDEX IF NOT EXISTS idx_kgn_importance ON public.knowledge_graph_nodes (importance);
CREATE INDEX IF NOT EXISTS idx_kgn_activity ON public.knowledge_graph_nodes (activity_score);


-- 2) Edges table (directed)
CREATE TABLE IF NOT EXISTS public.knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_node_id UUID NOT NULL REFERENCES public.knowledge_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.knowledge_graph_nodes(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'relates_to',
  strength NUMERIC NOT NULL DEFAULT 0.5, -- used for edge brightness/weight
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and policies
ALTER TABLE public.knowledge_graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge edges" ON public.knowledge_graph_edges
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge edges" ON public.knowledge_graph_edges
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge edges" ON public.knowledge_graph_edges
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge edges" ON public.knowledge_graph_edges
FOR DELETE USING (auth.uid() = user_id);

-- Timestamps trigger
CREATE TRIGGER update_knowledge_graph_edges_updated_at
BEFORE UPDATE ON public.knowledge_graph_edges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_kge_user ON public.knowledge_graph_edges (user_id);
CREATE INDEX IF NOT EXISTS idx_kge_source ON public.knowledge_graph_edges (source_node_id);
CREATE INDEX IF NOT EXISTS idx_kge_target ON public.knowledge_graph_edges (target_node_id);
CREATE INDEX IF NOT EXISTS idx_kge_relation ON public.knowledge_graph_edges (relation_type);
