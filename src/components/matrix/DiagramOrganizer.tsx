import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useEdgesState,
  useNodesState,
  addEdge,
  Edge,
  Node,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Types for our DB rows
interface KGNodeRow {
  id: string;
  user_id: string;
  title: string;
  type: string;
  summary: string | null;
  metadata: Record<string, any>;
  importance: number;
  activity_score: number;
  external_ref_type: string | null;
  external_ref_id: string | null;
  created_at: string;
  updated_at: string;
}

interface KGEdgeRow {
  id: string;
  user_id: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
  strength: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type DiagramMode = 'knowledge' | 'architecture';

interface DiagramOrganizerProps {
  mode?: DiagramMode; // knowledge graph by default; architecture filters code/services
}

// Generate massive global network orchestration data
const generateGlobalNetwork = () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Core quantum control hubs
  const coreHubs = [
    { id: 'quantum-core-alpha', label: 'QUANTUM CORE ALPHA', pos: { x: 0, y: 0 }, type: 'quantum' },
    { id: 'quantum-core-beta', label: 'QUANTUM CORE BETA', pos: { x: 400, y: 0 }, type: 'quantum' },
    { id: 'quantum-core-gamma', label: 'QUANTUM CORE GAMMA', pos: { x: -400, y: 0 }, type: 'quantum' },
  ];

  // Regional orchestration centers
  const regions = [
    { id: 'na-orchestrator', label: 'North America Orchestrator', pos: { x: -600, y: 200 }, region: 'NA' },
    { id: 'eu-orchestrator', label: 'Europe Orchestrator', pos: { x: 0, y: 200 }, region: 'EU' },
    { id: 'asia-orchestrator', label: 'Asia-Pacific Orchestrator', pos: { x: 600, y: 200 }, region: 'ASIA' },
    { id: 'sa-orchestrator', label: 'South America Orchestrator', pos: { x: -300, y: 400 }, region: 'SA' },
    { id: 'africa-orchestrator', label: 'Africa Orchestrator', pos: { x: 300, y: 400 }, region: 'AF' },
  ];

  // Thousands of edge nodes globally
  const edgeTypes = ['datacenter', 'cdn', 'relay', 'satellite', 'submarine', 'cellular', 'fiber', 'mesh'];
  let nodeCounter = 0;

  // Generate edge network infrastructure
  for (let region = 0; region < regions.length; region++) {
    const baseX = regions[region].pos.x;
    const baseY = regions[region].pos.y;
    
    // Major data centers per region (50-100 per region)
    for (let dc = 0; dc < 75; dc++) {
      const angle = (dc / 75) * 2 * Math.PI;
      const radius = 150 + Math.random() * 200;
      const x = baseX + Math.cos(angle) * radius;
      const y = baseY + Math.sin(angle) * radius;
      
      nodes.push({
        id: `dc-${region}-${dc}`,
        data: { 
          label: `DataCenter-${regions[region].region}-${dc.toString().padStart(3, '0')}`,
          type: 'datacenter',
          capacity: Math.floor(Math.random() * 10000) + 1000,
          status: Math.random() > 0.1 ? 'online' : 'maintenance'
        },
        position: { x, y },
        style: {
          border: '2px solid hsl(220, 100%, 50%)',
          background: 'hsl(220, 100%, 10%)',
          color: 'hsl(220, 100%, 80%)',
          width: 120,
          height: 60,
        }
      });
      
      // Connect to regional orchestrator
      edges.push({
        id: `edge-${nodeCounter++}`,
        source: regions[region].id,
        target: `dc-${region}-${dc}`,
        animated: Math.random() > 0.7,
        style: { stroke: 'hsl(220, 100%, 60%)', strokeWidth: 2 }
      });
    }

    // Edge computing nodes (200-300 per region)
    for (let edge = 0; edge < 250; edge++) {
      const parentDC = Math.floor(Math.random() * 75);
      const angle = Math.random() * 2 * Math.PI;
      const radius = 50 + Math.random() * 100;
      const parentX = baseX + Math.cos((parentDC / 75) * 2 * Math.PI) * (150 + Math.random() * 200);
      const parentY = baseY + Math.sin((parentDC / 75) * 2 * Math.PI) * (150 + Math.random() * 200);
      const x = parentX + Math.cos(angle) * radius;
      const y = parentY + Math.sin(angle) * radius;
      
      const edgeType = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];
      
      nodes.push({
        id: `edge-${region}-${edge}`,
        data: { 
          label: `${edgeType.toUpperCase()}-${edge.toString().padStart(3, '0')}`,
          type: edgeType,
          throughput: Math.floor(Math.random() * 1000) + 100,
          latency: Math.floor(Math.random() * 50) + 1
        },
        position: { x, y },
        style: {
          border: '1px solid hsl(150, 80%, 50%)',
          background: 'hsl(150, 80%, 5%)',
          color: 'hsl(150, 80%, 70%)',
          width: 80,
          height: 40,
        }
      });
      
      // Connect to parent datacenter
      edges.push({
        id: `edge-${nodeCounter++}`,
        source: `dc-${region}-${parentDC}`,
        target: `edge-${region}-${edge}`,
        animated: Math.random() > 0.8,
        style: { stroke: 'hsl(150, 80%, 60%)', strokeWidth: 1 }
      });
    }

    // Satellite uplinks (10-20 per region)
    for (let sat = 0; sat < 15; sat++) {
      const angle = (sat / 15) * 2 * Math.PI;
      const radius = 400 + Math.random() * 100;
      const x = baseX + Math.cos(angle) * radius;
      const y = baseY + Math.sin(angle) * radius - 200;
      
      nodes.push({
        id: `sat-${region}-${sat}`,
        data: { 
          label: `SAT-UPLINK-${sat}`,
          type: 'satellite',
          orbital: true,
          frequency: `${Math.floor(Math.random() * 40) + 10}GHz`
        },
        position: { x, y },
        style: {
          border: '2px solid hsl(60, 100%, 50%)',
          background: 'hsl(60, 100%, 8%)',
          color: 'hsl(60, 100%, 80%)',
          width: 100,
          height: 50,
          borderRadius: '25px'
        }
      });
      
      // Connect satellites to multiple datacenters
      for (let connection = 0; connection < 3; connection++) {
        const targetDC = Math.floor(Math.random() * 75);
        edges.push({
          id: `edge-${nodeCounter++}`,
          source: `sat-${region}-${sat}`,
          target: `dc-${region}-${targetDC}`,
          animated: true,
          style: { 
            stroke: 'hsl(60, 100%, 60%)', 
            strokeWidth: 2,
            strokeDasharray: '5,5'
          }
        });
      }
    }
  }

  // Add core quantum hubs
  coreHubs.forEach(hub => {
    nodes.push({
      id: hub.id,
      data: { 
        label: hub.label,
        type: 'quantum-core',
        qubits: Math.floor(Math.random() * 1000) + 500,
        entanglement: 'active'
      },
      position: hub.pos,
      style: {
        border: '3px solid hsl(300, 100%, 50%)',
        background: 'hsl(300, 100%, 5%)',
        color: 'hsl(300, 100%, 90%)',
        width: 180,
        height: 80,
        borderRadius: '40px'
      }
    });
  });

  // Add regional orchestrators
  regions.forEach(region => {
    nodes.push({
      id: region.id,
      data: { 
        label: region.label,
        type: 'orchestrator',
        region: region.region,
        nodes_managed: Math.floor(Math.random() * 500) + 300
      },
      position: region.pos,
      style: {
        border: '3px solid hsl(30, 100%, 50%)',
        background: 'hsl(30, 100%, 5%)',
        color: 'hsl(30, 100%, 90%)',
        width: 160,
        height: 70,
      }
    });
  });

  // Connect quantum cores to orchestrators
  coreHubs.forEach(hub => {
    regions.forEach(region => {
      edges.push({
        id: `edge-${nodeCounter++}`,
        source: hub.id,
        target: region.id,
        animated: true,
        style: { 
          stroke: 'hsl(300, 100%, 60%)', 
          strokeWidth: 4
        }
      });
    });
  });

  // Cross-region backbone connections
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      edges.push({
        id: `backbone-${i}-${j}`,
        source: regions[i].id,
        target: regions[j].id,
        animated: true,
        style: { 
          stroke: 'hsl(0, 100%, 60%)', 
          strokeWidth: 3,
          strokeDasharray: '10,5'
        }
      });
    }
  }

  return { nodes, edges };
};

const DemoData = generateGlobalNetwork();

const DiagramOrganizer: React.FC<DiagramOrganizerProps> = ({ mode = 'knowledge' }) => {
  // Controls
  const [depth, setDepth] = useState(2);
  const [threshold, setThreshold] = useState(0.4);
  const [dualMode, setDualMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [coreNodeId, setCoreNodeId] = useState<string | null>(null);

  // Data
  const [kgNodes, setKgNodes] = useState<KGNodeRow[]>([]);
  const [kgEdges, setKgEdges] = useState<KGEdgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch user's graph
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id || null;

        if (!userId) {
          // No auth: demo mode
          if (isMounted) {
            setDemoMode(true);
            setLoading(false);
          }
          return;
        }

        const nodeQuery = supabase
          .from('knowledge_graph_nodes')
          .select('*')
          .eq('user_id', userId);
        const edgeQuery = supabase
          .from('knowledge_graph_edges')
          .select('*')
          .eq('user_id', userId);

        const [nodeRes, edgeRes] = await Promise.all([nodeQuery, edgeQuery]);
        if (nodeRes.error || edgeRes.error) {
          console.error('KG fetch error', nodeRes.error || edgeRes.error);
          setDemoMode(true);
        } else {
          const nodesData = (nodeRes.data || []) as KGNodeRow[];
          const edgesData = (edgeRes.data || []) as KGEdgeRow[];

          // Optional: filter architecture mode
          const filteredNodes = mode === 'architecture'
            ? nodesData.filter(n => (n.type?.toLowerCase?.() || '').includes('code') || (n.external_ref_type || '').includes('code') || (n.type || '').includes('service'))
            : nodesData;

          if (isMounted) {
            setKgNodes(filteredNodes);
            setKgEdges(edgesData);
            // set core: first node with metadata.core === true, else first
            const core = filteredNodes.find(n => n.metadata?.core) || filteredNodes[0] || null;
            setCoreNodeId(core?.id || null);
          }
        }
      } catch (e) {
        console.error('KG load failed', e);
        setDemoMode(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [mode]);

  // Realtime updates
  useEffect(() => {
    const ch = supabase
      .channel('knowledge-graph-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_graph_nodes' }, (payload) => {
        if (payload.eventType === 'INSERT') setKgNodes(prev => [payload.new as any as KGNodeRow, ...prev]);
        if (payload.eventType === 'UPDATE') setKgNodes(prev => prev.map(n => (n.id === (payload.new as any).id ? (payload.new as any) : n)));
        if (payload.eventType === 'DELETE') setKgNodes(prev => prev.filter(n => n.id !== (payload.old as any).id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_graph_edges' }, (payload) => {
        if (payload.eventType === 'INSERT') setKgEdges(prev => [payload.new as any as KGEdgeRow, ...prev]);
        if (payload.eventType === 'UPDATE') setKgEdges(prev => prev.map(e => (e.id === (payload.new as any).id ? (payload.new as any) : e)));
        if (payload.eventType === 'DELETE') setKgEdges(prev => prev.filter(e => e.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  // Build visible subgraph around core with BFS to selected depth
  const visible = useMemo(() => {
    if (demoMode) {
      return { nodes: DemoData.nodes, edges: DemoData.edges };
    }
    if (!coreNodeId || kgNodes.length === 0) return { nodes: [] as Node[], edges: [] as Edge[] };

    const nodeMap = new Map(kgNodes.map(n => [n.id, n]));
    const adj = new Map<string, string[]>();
    kgEdges.forEach(e => {
      if (e.strength < threshold) return; // filter by significance
      if (!adj.has(e.source_node_id)) adj.set(e.source_node_id, []);
      if (!adj.has(e.target_node_id)) adj.set(e.target_node_id, []);
      adj.get(e.source_node_id)!.push(e.target_node_id);
      adj.get(e.target_node_id)!.push(e.source_node_id);
    });

    const visited = new Set<string>();
    const queue: Array<{ id: string; d: number }> = [{ id: coreNodeId, d: 0 }];
    const layers: string[][] = [];

    while (queue.length) {
      const { id, d } = queue.shift()!;
      if (visited.has(id) || d > depth) continue;
      visited.add(id);
      if (!layers[d]) layers[d] = [];
      layers[d].push(id);
      const neighbors = adj.get(id) || [];
      neighbors.forEach(nbr => {
        if (!visited.has(nbr)) queue.push({ id: nbr, d: d + 1 });
      });
    }

    // Position nodes per layer (radial-ish layout)
    const rfNodes: Node[] = [];
    const rfEdges: Edge[] = [];

    const layerGapY = 180;
    const baseXGap = 200;

    layers.forEach((layer, li) => {
      const y = li * layerGapY;
      const nCount = layer.length || 1;
      const startX = -((nCount - 1) * baseXGap) / 2;
      layer.forEach((id, idx) => {
        const n = nodeMap.get(id);
        if (!n) return;
        rfNodes.push({
          id,
          data: { label: n.title },
          position: { x: startX + idx * baseXGap, y },
          style: {
            border: '1px solid hsl(var(--primary) / 0.5)',
            color: 'hsl(var(--foreground))',
            background: 'hsl(var(--card))',
          },
        });
      });
    });

    kgEdges.forEach(e => {
      if (!visited.has(e.source_node_id) || !visited.has(e.target_node_id)) return;
      if (e.strength < threshold) return;
      rfEdges.push({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        animated: e.strength > 0.75,
        style: { stroke: 'hsl(var(--primary) / ' + Math.max(0.2, Math.min(1, e.strength)) + ')' },
        data: { relation: e.relation_type, strength: e.strength },
      });
    });

    return { nodes: rfNodes, edges: rfEdges };
  }, [demoMode, coreNodeId, kgNodes, kgEdges, depth, threshold]);

  useEffect(() => {
    setNodes(visible.nodes);
    setEdges(visible.edges);
  }, [visible, setNodes, setEdges]);

  const onConnect = useCallback((conn: Connection) => setEdges((eds) => addEdge(conn, eds)), [setEdges]);

  const selectedNode = useMemo(() => {
    if (demoMode) {
      return selectedNodeId ? { title: selectedNodeId, summary: 'Demo node details', metadata: {} } : null;
    }
    return kgNodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, kgNodes, demoMode]);

  const selectableCores = useMemo(() => {
    if (demoMode) return [{ id: 'core', title: 'Core Node' }];
    return kgNodes.map(n => ({ id: n.id, title: n.title }));
  }, [kgNodes, demoMode]);

  return (
    <Card className="p-4 bg-card/80 backdrop-blur border border-primary/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="font-mono text-sm text-primary">Diagram Organizer ({mode})</div>
        <Separator className="mx-2" />
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">Depth</span>
          <Slider value={[depth]} min={1} max={6} step={1} onValueChange={(v) => setDepth(v[0])} className="w-32" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">Significance</span>
          <Slider value={[threshold]} min={0} max={1} step={0.05} onValueChange={(v) => setThreshold(v[0])} className="w-32" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">Dual</span>
          <Button variant={dualMode ? 'default' : 'outline'} size="sm" onClick={() => setDualMode(!dualMode)}>
            {dualMode ? 'ON' : 'OFF'}
          </Button>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className="font-mono text-xs text-muted-foreground">Core</span>
          <select
            className="bg-background border border-primary/20 rounded px-2 py-1 text-xs"
            value={coreNodeId || ''}
            onChange={(e) => setCoreNodeId(e.target.value || null)}
          >
            {selectableCores.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto">
          {demoMode && (
            <span className="font-mono text-xs text-muted-foreground">Demo mode (sign in to load your graph)</span>
          )}
        </div>
      </div>

      <div className={`grid ${dualMode ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
        <div className="h-[520px] rounded border border-primary/20">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            onNodeClick={(_, n) => setSelectedNodeId(n.id)}
            style={{ background: 'hsl(var(--background))' }}
          >
            <MiniMap zoomable pannable className="!bg-muted" />
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        {dualMode && (
          <div className="h-[520px] rounded border border-primary/20">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              onNodeClick={(_, n) => setSelectedNodeId(n.id)}
              style={{ background: 'hsl(var(--background))' }}
            >
              <MiniMap zoomable pannable className="!bg-muted" />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        )}
      </div>

      {/* Details panel */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Card className="col-span-2 p-3 bg-card/60 border border-primary/20">
          <div className="font-mono text-xs text-muted-foreground mb-2">Selected Node</div>
          {selectedNode ? (
            <div>
              <div className="font-mono text-sm text-primary">{(selectedNode as any).title || (selectedNode as any).data?.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{(selectedNode as any).summary || 'No summary available.'}</div>
              {!demoMode && (
                <div className="mt-3">
                  <div className="font-mono text-xs text-muted-foreground">External Ref</div>
                  <div className="text-xs">{(kgNodes.find(n => n.id === selectedNodeId)?.external_ref_type) || '—'} {(kgNodes.find(n => n.id === selectedNodeId)?.external_ref_id) || ''}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Click a node to view details.</div>
          )}
        </Card>
        <Card className="p-3 bg-card/60 border border-primary/20">
          <div className="font-mono text-xs text-muted-foreground mb-2">Actions</div>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDepth(d => Math.min(6, d + 1))}>Reveal more</Button>
            <Button variant="outline" size="sm" onClick={() => setDepth(d => Math.max(1, d - 1))}>Reveal less</Button>
            <Button variant="outline" size="sm" onClick={() => setThreshold(t => Math.max(0, Math.min(1, t - 0.1)))}>Increase links</Button>
            <Button variant="outline" size="sm" onClick={() => setThreshold(t => Math.max(0, Math.min(1, t + 0.1)))}>Reduce links</Button>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default DiagramOrganizer;
