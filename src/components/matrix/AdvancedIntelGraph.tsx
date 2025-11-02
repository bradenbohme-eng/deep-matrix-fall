import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Zap, Database, Globe, Shield, AlertTriangle } from 'lucide-react';

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  author?: string;
  points?: number;
  created_at?: string;
}

interface IntelGraphProps {
  items: FeedItem[];
}

// Custom node types for different intel entities
const HubNode = ({ data }: { data: any }) => (
  <div className="px-6 py-4 bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-primary rounded-lg shadow-lg">
    <Network className="w-6 h-6 text-primary mb-2 mx-auto" />
    <div className="text-primary font-mono text-xs font-bold text-center">{data.label}</div>
    <div className="text-primary/70 font-mono text-[10px] text-center mt-1">
      {data.connections} connections
    </div>
  </div>
);

const ItemNode = ({ data }: { data: any }) => {
  const threatLevel = typeof data.threat_level === 'number' ? data.threat_level : 0;
  return (
    <div className="px-4 py-3 bg-card/90 border border-primary/30 rounded-md shadow-md hover:shadow-lg transition-all hover:border-primary/60">
      <Database className="w-4 h-4 text-primary mb-1" />
      <div className="text-foreground font-mono text-[10px] max-w-[150px] truncate">{data.label}</div>
      {data.threat_level !== undefined && (
        <Badge 
          variant="outline" 
          className={`mt-1 text-[8px] ${
            threatLevel > 0.7 ? 'border-red-500/50 text-red-400' :
            threatLevel > 0.4 ? 'border-yellow-500/50 text-yellow-400' :
            'border-green-500/50 text-green-400'
          }`}
        >
          {(threatLevel * 100).toFixed(0)}%
        </Badge>
      )}
    </div>
  );
};

const KeywordNode = ({ data }: { data: any }) => (
  <div className="px-3 py-2 bg-accent/20 border border-accent/40 rounded-full shadow-sm">
    <div className="text-accent font-mono text-[9px] font-semibold">{data.label}</div>
    {data.connections > 3 && (
      <div className="text-accent/70 text-[8px] text-center">{data.connections}</div>
    )}
  </div>
);

const ClusterNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 bg-destructive/20 border-2 border-destructive/50 rounded-lg shadow-md">
    <AlertTriangle className="w-4 h-4 text-destructive mb-1" />
    <div className="text-destructive font-mono text-[10px] font-bold">{data.label}</div>
  </div>
);

const nodeTypes = {
  hub: HubNode,
  item: ItemNode,
  keyword: KeywordNode,
  cluster: ClusterNode,
};

const AdvancedIntelGraph: React.FC<IntelGraphProps> = ({ items }) => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [layout, setLayout] = useState<'force' | 'hierarchical' | 'radial'>('force');

  const { initialNodes, initialEdges, stats } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    const stopwords = new Set(['the','a','an','and','or','of','to','in','on','for','with','from','by','at','is','are','be','as','vs','via','this','that']);
    
    // Create hub node
    const hubNode: Node = {
      id: 'hub',
      type: 'hub',
      position: { x: 400, y: 300 },
      data: { label: 'GLOBAL INTEL HUB', connections: 0, type: 'hub' },
    };
    flowNodes.push(hubNode);

    const keywordMap = new Map<string, { count: number; nodeIds: string[] }>();
    
    // Process items
    items.slice(0, 40).forEach((item, idx) => {
      const angle = (idx / Math.min(items.length, 40)) * Math.PI * 2;
      const radius = 250 + Math.random() * 100;
      const x = 400 + Math.cos(angle) * radius;
      const y = 300 + Math.sin(angle) * radius;
      
      const itemNode: Node = {
        id: `item-${item.id}`,
        type: 'item',
        position: { x, y },
        data: { 
          label: item.title.slice(0, 40),
          threat_level: Math.random(),
          points: item.points,
          url: item.url,
        },
      };
      flowNodes.push(itemNode);

      // Connect to hub
      flowEdges.push({
        id: `e-hub-${item.id}`,
        source: 'hub',
        target: `item-${item.id}`,
        animated: Math.random() > 0.7,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 1 },
      });

      // Extract keywords
      const words = (item.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w && !stopwords.has(w) && w.length > 3);

      words.slice(0, 3).forEach(word => {
        if (!keywordMap.has(word)) {
          keywordMap.set(word, { count: 0, nodeIds: [] });
        }
        const kwData = keywordMap.get(word)!;
        kwData.count++;
        kwData.nodeIds.push(`item-${item.id}`);
      });
    });

    // Create keyword nodes
    let kwIdx = 0;
    keywordMap.forEach((data, word) => {
      if (data.count > 2) { // Only create nodes for keywords that appear multiple times
        const angle = (kwIdx / keywordMap.size) * Math.PI * 2;
        const radius = 150;
        const x = 400 + Math.cos(angle) * radius;
        const y = 300 + Math.sin(angle) * radius;

        flowNodes.push({
          id: `kw-${word}`,
          type: 'keyword',
          position: { x, y },
          data: { 
            label: word.toUpperCase(),
            connections: data.count,
          },
        });

        // Connect keywords to their items
        data.nodeIds.slice(0, 5).forEach(nodeId => {
          flowEdges.push({
            id: `e-kw-${word}-${nodeId}`,
            source: `kw-${word}`,
            target: nodeId,
            animated: false,
            style: { stroke: 'hsl(var(--accent))', strokeWidth: 0.5, strokeDasharray: '5,5' },
          });
        });

        kwIdx++;
      }
    });

    // Update hub connections
    hubNode.data.connections = flowEdges.filter(e => e.source === 'hub' || e.target === 'hub').length;

    return {
      initialNodes: flowNodes,
      initialEdges: flowEdges,
      stats: {
        nodes: flowNodes.length,
        edges: flowEdges.length,
        keywords: keywordMap.size,
      }
    };
  }, [items]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const applyLayout = (layoutType: 'force' | 'hierarchical' | 'radial') => {
    setLayout(layoutType);
    // Layout logic would go here - for now just update state
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Control Panel */}
      <Panel position="top-left" className="bg-card/90 border border-primary/20 rounded-md p-3 m-2">
        <div className="flex flex-col gap-2">
          <div className="text-primary font-mono text-xs font-bold mb-2">INTEL GRAPH CONTROL</div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={layout === 'force' ? 'default' : 'outline'}
              onClick={() => applyLayout('force')}
              className="text-xs"
            >
              <Zap className="w-3 h-3 mr-1" />
              Force
            </Button>
            <Button 
              size="sm" 
              variant={layout === 'hierarchical' ? 'default' : 'outline'}
              onClick={() => applyLayout('hierarchical')}
              className="text-xs"
            >
              <Globe className="w-3 h-3 mr-1" />
              Hierarchy
            </Button>
            <Button 
              size="sm" 
              variant={layout === 'radial' ? 'default' : 'outline'}
              onClick={() => applyLayout('radial')}
              className="text-xs"
            >
              <Shield className="w-3 h-3 mr-1" />
              Radial
            </Button>
          </div>
          <div className="flex gap-3 text-[10px] font-mono mt-2">
            <div>
              <span className="text-muted-foreground">NODES:</span>{' '}
              <span className="text-primary font-semibold">{stats.nodes}</span>
            </div>
            <div>
              <span className="text-muted-foreground">EDGES:</span>{' '}
              <span className="text-primary font-semibold">{stats.edges}</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Selected Node Info */}
      {selectedNode && (
        <Panel position="top-right" className="bg-card/90 border border-primary/20 rounded-md p-3 m-2 max-w-xs">
          <div className="font-mono text-xs">
            <div className="text-primary font-bold mb-2">NODE DETAILS</div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-[10px]">ID:</div>
              <div className="text-foreground text-[10px] break-all">{selectedNode.id}</div>
              {selectedNode.data.label && (
                <>
                  <div className="text-muted-foreground text-[10px] mt-2">LABEL:</div>
                  <div className="text-foreground text-[10px]">{String(selectedNode.data.label)}</div>
                </>
              )}
              {selectedNode.data.threat_level !== undefined && typeof selectedNode.data.threat_level === 'number' && (
                <>
                  <div className="text-muted-foreground text-[10px] mt-2">THREAT:</div>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] ${
                      selectedNode.data.threat_level > 0.7 ? 'border-red-500/50 text-red-400' :
                      selectedNode.data.threat_level > 0.4 ? 'border-yellow-500/50 text-yellow-400' :
                      'border-green-500/50 text-green-400'
                    }`}
                  >
                    {(selectedNode.data.threat_level * 100).toFixed(0)}%
                  </Badge>
                </>
              )}
            </div>
          </div>
        </Panel>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-background"
      >
        <Background color="hsl(var(--primary))" gap={20} size={0.5} />
        <Controls className="bg-card/90 border-primary/20" />
        <MiniMap 
          className="bg-card/90 border border-primary/20" 
          nodeColor={(n) => {
            if (n.type === 'hub') return 'hsl(var(--accent))';
            if (n.type === 'keyword') return 'hsl(var(--accent))';
            return 'hsl(var(--primary))';
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default AdvancedIntelGraph;
