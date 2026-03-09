import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, RefreshCw, Cpu, Search, Zap, Network, Layers,
} from 'lucide-react';
import {
  buildGraph, seedCoreEntities,
  type GraphNode as GN, type GraphEdge as GE, type GraphData,
} from '@/lib/segQueryEngine';
import { toast } from 'sonner';

// ─── Color Map ───
const TYPE_COLORS: Record<string, string> = {
  system: '#00ff41',
  component: '#00d4ff',
  protocol: '#ff6b00',
  concept: '#b388ff',
  metric: '#ffeb3b',
  document: '#8d6e63',
};

function makeFlowNodes(nodes: GN[]): Node[] {
  const cols = 4;
  return nodes.map((n, i) => ({
    id: n.id,
    position: {
      x: 100 + (i % cols) * 320 + Math.random() * 40,
      y: 100 + Math.floor(i / cols) * 180 + Math.random() * 30,
    },
    data: {
      label: (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold" style={{ color: TYPE_COLORS[n.type] || '#ccc' }}>
            {n.type.toUpperCase()}
          </span>
          <span className="font-mono text-sm">{n.label}</span>
          <span className="text-[10px] text-muted-foreground">{`κ ${(n.confidence * 100).toFixed(0)}%`}</span>
        </div>
      ),
    },
    style: {
      background: 'hsl(var(--card))',
      border: `2px solid ${TYPE_COLORS[n.type] || '#555'}`,
      borderRadius: 10,
      padding: 10,
      minWidth: 140,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));
}

function makeFlowEdges(edges: GE[]): Edge[] {
  return edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.type,
    animated: e.strength > 0.7,
    style: { stroke: '#00ff4180', strokeWidth: Math.max(1, e.strength * 3) },
    labelStyle: { fill: '#999', fontSize: 9 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00ff41' },
  }));
}

const KnowledgeGraph: React.FC = () => {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<GN | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await buildGraph();
      setGraphData(data);
      setNodes(makeFlowNodes(data.nodes));
      setEdges(makeFlowEdges(data.edges));
    } catch (err) {
      console.error('[SEG] graph load error', err);
    }
    setLoading(false);
  }, [setNodes, setEdges]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSeed = async () => {
    setSeeding(true);
    const count = await seedCoreEntities();
    toast.success(`Seeded ${count} new entities`);
    await refresh();
    setSeeding(false);
  };

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const gn = graphData?.nodes.find(n => n.id === node.id);
    setSelectedNode(gn ?? null);
  }, [graphData]);

  // Filter stats
  const stats = useMemo(() => {
    if (!graphData) return { nodes: 0, edges: 0, types: {} as Record<string, number> };
    const types: Record<string, number> = {};
    graphData.nodes.forEach(n => { types[n.type] = (types[n.type] || 0) + 1; });
    return { nodes: graphData.nodes.length, edges: graphData.edges.length, types };
  }, [graphData]);

  const filteredNodes = useMemo(() => {
    if (!search || !graphData) return graphData?.nodes ?? [];
    const q = search.toLowerCase();
    return graphData.nodes.filter(n =>
      n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)
    );
  }, [graphData, search]);

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 h-12 border-b border-primary/20 bg-card/80 backdrop-blur flex items-center px-4 gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> HQ
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Network className="w-5 h-5 text-primary" />
        <span className="font-mono text-sm font-bold text-primary">SEG KNOWLEDGE GRAPH</span>
        <span className="text-xs text-muted-foreground ml-2">Phase 5 · Symbolic Evidence Graph</span>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {stats.nodes} entities · {stats.edges} relations
          </Badge>
          <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
            <Zap className="w-3 h-3 mr-1" />
            {seeding ? 'Seeding...' : 'Seed Core'}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-72 border-r border-primary/10 bg-card/40 flex flex-col">
          <div className="p-3 border-b border-primary/10">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-xs font-mono"
                placeholder="Search entities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Type legend */}
          <div className="p-3 border-b border-primary/10">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Types</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(stats.types).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-[10px]" style={{ borderColor: TYPE_COLORS[type] }}>
                  <span style={{ color: TYPE_COLORS[type] }}>●</span> {type} ({count})
                </Badge>
              ))}
            </div>
          </div>

          {/* Entity list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredNodes.map(n => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNode(n)}
                  className={`w-full text-left p-2 rounded text-xs font-mono hover:bg-primary/10 transition ${
                    selectedNode?.id === n.id ? 'bg-primary/20 border border-primary/30' : ''
                  }`}
                >
                  <span style={{ color: TYPE_COLORS[n.type] }}>■</span>{' '}
                  <span className="text-foreground">{n.label}</span>
                  <span className="text-muted-foreground ml-1">κ{(n.confidence * 100).toFixed(0)}</span>
                </button>
              ))}
              {filteredNodes.length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-8">
                  {graphData?.nodes.length === 0
                    ? 'No entities. Click "Seed Core" to initialize.'
                    : 'No matches.'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main graph canvas */}
        <div className="flex-1 relative">
          {nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              fitView
              minZoom={0.3}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#00ff4110" gap={20} />
              <Controls />
              <MiniMap
                nodeColor={node => {
                  const gn = graphData?.nodes.find(n => n.id === node.id);
                  return TYPE_COLORS[gn?.type ?? ''] ?? '#333';
                }}
                style={{ background: 'hsl(var(--card))' }}
              />
            </ReactFlow>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-3">
                <Layers className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm font-mono">
                  {loading ? 'Loading graph...' : 'No entities in SEG. Seed core entities to begin.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right detail panel */}
        {selectedNode && (
          <div className="w-80 border-l border-primary/10 bg-card/40 flex flex-col">
            <div className="p-3 border-b border-primary/10 flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-primary">{selectedNode.label}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)} className="h-6 w-6 p-0 text-xs">✕</Button>
            </div>
            <ScrollArea className="flex-1 p-3 space-y-3">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">Type</span>
                  <Badge variant="outline" className="ml-2 text-xs" style={{ borderColor: TYPE_COLORS[selectedNode.type] }}>
                    {selectedNode.type}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">Confidence</span>
                  <p className="text-sm font-mono text-primary">κ {(selectedNode.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">Description</span>
                  <p className="text-xs text-muted-foreground mt-1">{selectedNode.description || 'No description'}</p>
                </div>

                <Separator />

                <div>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">Connections</span>
                  <div className="mt-1 space-y-1">
                    {graphData?.edges
                      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map(e => {
                        const otherId = e.source === selectedNode.id ? e.target : e.source;
                        const other = graphData.nodes.find(n => n.id === otherId);
                        const direction = e.source === selectedNode.id ? '→' : '←';
                        return (
                          <button
                            key={e.id}
                            onClick={() => {
                              if (other) setSelectedNode(other);
                            }}
                            className="w-full text-left text-xs font-mono p-1.5 rounded hover:bg-primary/10"
                          >
                            {direction} <span className="text-primary">{other?.label ?? '?'}</span>
                            <span className="text-muted-foreground ml-1">({e.type})</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraph;
