import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  kind: 'hub' | 'item' | 'keyword' | 'cluster';
  label?: string;
  connections: number;
  threat_level?: number;
}

interface Link {
  source: string;
  target: string;
  weight: number;
}

const AdvancedIntelGraph: React.FC<IntelGraphProps> = ({ items }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const { nodes, links, clusters } = useMemo(() => {
    const center: Node = { 
      id: 'GLOBAL_INTEL_HUB', 
      x: 0, y: 0, vx: 0, vy: 0, 
      size: 15, 
      kind: 'hub',
      label: 'GLOBAL HUB',
      connections: 0
    };
    
    const nodesMap = new Map<string, Node>([[center.id, center]]);
    const linksArr: Link[] = [];
    const clustersMap = new Map<string, { count: number; threat: number }>();

    const stopwords = new Set(['the','a','an','and','or','of','to','in','on','for','with','from','by','at','is','are','be','as','vs','via','this','that']);
    const rand = (min:number, max:number) => Math.random() * (max - min) + min;

    // Process items and extract intelligence
    items.slice(0, 50).forEach((it, idx) => {
      const id = `node_${it.id}`;
      const threat_level = Math.random();
      
      nodesMap.set(id, { 
        id, 
        x: rand(-200, 200), 
        y: rand(-150, 150), 
        vx: 0, vy: 0, 
        size: 5 + (it.points || 0) / 20,
        kind: 'item',
        label: it.title.slice(0, 30),
        connections: 0,
        threat_level
      });
      
      linksArr.push({ source: 'GLOBAL_INTEL_HUB', target: id, weight: 1 });

      // Extract keywords and create network
      const words = (it.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w && !stopwords.has(w) && w.length > 3);

      // Create keyword clusters
      words.slice(0, 4).forEach(w => {
        const kwId = `kw_${w}`;
        
        if (!nodesMap.has(kwId)) {
          const cluster_threat = clustersMap.get(w)?.threat || Math.random();
          clustersMap.set(w, { 
            count: (clustersMap.get(w)?.count || 0) + 1, 
            threat: cluster_threat 
          });
          
          nodesMap.set(kwId, { 
            id: kwId, 
            x: rand(-250, 250), 
            y: rand(-200, 200), 
            vx: 0, vy: 0, 
            size: 3,
            kind: 'keyword',
            label: w.toUpperCase(),
            connections: 0,
            threat_level: cluster_threat
          });
        }
        
        linksArr.push({ source: id, target: kwId, weight: 0.6 });
        
        const node = nodesMap.get(kwId)!;
        node.connections++;
        node.size = Math.min(10, 3 + node.connections * 0.5);
      });

      // Create inter-item connections based on keyword overlap
      if (idx > 0 && Math.random() > 0.7) {
        const prevId = `node_${items[idx - 1].id}`;
        if (nodesMap.has(prevId)) {
          linksArr.push({ source: id, target: prevId, weight: 0.3 });
        }
      }
    });

    // Update hub connections
    center.connections = linksArr.filter(l => l.source === center.id || l.target === center.id).length;

    return { 
      nodes: Array.from(nodesMap.values()), 
      links: linksArr,
      clusters: clustersMap
    };
  }, [items]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    let mouseX = 0, mouseY = 0;

    const root = getComputedStyle(document.documentElement);
    const primary = root.getPropertyValue('--primary') || '140 76% 48%';
    const accent = root.getPropertyValue('--accent') || '260 85% 66%';
    const destructive = root.getPropertyValue('--destructive') || '0 84% 60%';

    const centerStrength = 0.003;
    const linkStrength = 0.04;
    const repulsion = 3000;
    const damping = 0.88;

    const idToNode = new Map(nodes.map(n => [n.id, n] as const));

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - size.w / 2);
      mouseY = (e.clientY - rect.top - size.h / 2);
      
      // Find hovered node
      let closest: Node | null = null;
      let minDist = 20;
      
      nodes.forEach(n => {
        const dist = Math.hypot(n.x - mouseX, n.y - mouseY);
        if (dist < minDist) {
          minDist = dist;
          closest = n;
        }
      });
      
      setHoveredNode(closest);
    };

    const handleClick = () => {
      setSelectedNode(hoveredNode);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const tick = () => {
      frame++;
      const { w, h } = size;
      
      // Dark background with subtle grid
      ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.fillRect(0, 0, w, h);
      
      ctx.save();
      ctx.translate(w / 2, h / 2);

      // Draw grid
      ctx.strokeStyle = 'rgba(0, 255, 140, 0.05)';
      ctx.lineWidth = 0.5;
      for (let i = -h; i < h; i += 50) {
        ctx.beginPath();
        ctx.moveTo(-w/2, i);
        ctx.lineTo(w/2, i);
        ctx.stroke();
      }
      for (let i = -w; i < w; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, -h/2);
        ctx.lineTo(i, h/2);
        ctx.stroke();
      }

      // Physics simulation
      nodes.forEach(n => {
        if (n.id !== 'GLOBAL_INTEL_HUB') {
          n.vx += -n.x * centerStrength;
          n.vy += -n.y * centerStrength;
        }
      });

      links.forEach(l => {
        const a = idToNode.get(l.source)!;
        const b = idToNode.get(l.target)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const force = (dist - 80) * linkStrength * l.weight;
        const nx = dx / dist, ny = dy / dist;
        a.vx += force * nx; a.vy += force * ny;
        b.vx -= force * nx; b.vy -= force * ny;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist2 = dx*dx + dy*dy + 0.01;
          const f = repulsion / dist2;
          const nx = dx / Math.sqrt(dist2), ny = dy / Math.sqrt(dist2);
          a.vx -= f * nx; a.vy -= f * ny;
          b.vx += f * nx; b.vy += f * ny;
        }
      }

      nodes.forEach(n => {
        n.vx *= damping; n.vy *= damping;
        n.x += n.vx; n.y += n.vy;
      });

      // Draw links with data flow animation
      ctx.lineWidth = 1;
      links.forEach((l, idx) => {
        const a = idToNode.get(l.source)!;
        const b = idToNode.get(l.target)!;
        const pulse = 0.3 + 0.4 * Math.sin((frame + idx * 11) * 0.04);
        
        const isHighlighted = hoveredNode && (hoveredNode.id === a.id || hoveredNode.id === b.id);
        const alpha = isHighlighted ? 0.7 : 0.2 + pulse * 0.15;
        
        ctx.strokeStyle = `hsl(${primary} / ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Data packet animation
        if (Math.random() > 0.98) {
          const t = (frame * 0.02) % 1;
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          ctx.fillStyle = `hsl(${accent} / 0.8)`;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw nodes
      nodes.forEach((n, idx) => {
        const isHovered = hoveredNode?.id === n.id;
        const isSelected = selectedNode?.id === n.id;
        
        let base = primary;
        if (n.kind === 'hub') base = accent;
        if (n.threat_level && n.threat_level > 0.7) base = destructive;
        
        const glow = 0.4 + 0.4 * Math.sin((frame + idx * 17) * 0.05);
        const r = n.size * (isHovered ? 1.5 : isSelected ? 1.3 : 1) + glow;
        
        ctx.fillStyle = `hsl(${base} / ${0.8})`;
        ctx.shadowColor = `hsl(${base} / ${isHovered ? 0.7 : 0.4})`;
        ctx.shadowBlur = (isHovered ? 20 : 10) * glow;
        
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connection count
        if (n.connections > 3) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(n.x + r, n.y - 6, 16, 12);
          ctx.fillStyle = `hsl(${base} / 1)`;
          ctx.font = '9px ui-monospace, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(n.connections.toString(), n.x + r + 2, n.y + 2);
        }

        // Label for hovered or important nodes
        if ((isHovered || isSelected || n.kind === 'hub') && n.label) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          const textWidth = ctx.measureText(n.label).width;
          ctx.fillRect(n.x - textWidth/2 - 4, n.y + r + 2, textWidth + 8, 14);
          
          ctx.fillStyle = `hsl(${base} / 1)`;
          ctx.font = '10px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(n.label, n.x, n.y + r + 12);
        }
      });

      ctx.restore();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [nodes, links, size, hoveredNode, selectedNode]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1" ref={containerRef}>
        <canvas ref={canvasRef} width={size.w} height={size.h} className="w-full h-full cursor-crosshair" />
      </div>
      
      {/* Info Panel */}
      <Card className="m-4 p-3 bg-card/90 border-primary/20">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex gap-4">
            <div>
              <span className="text-muted-foreground">NODES:</span>{' '}
              <span className="text-primary font-semibold">{nodes.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">CONNECTIONS:</span>{' '}
              <span className="text-primary font-semibold">{links.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">CLUSTERS:</span>{' '}
              <span className="text-primary font-semibold">{clusters.size}</span>
            </div>
          </div>
          
          {hoveredNode && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {hoveredNode.kind.toUpperCase()}
              </Badge>
              {hoveredNode.threat_level !== undefined && (
                <Badge 
                  variant="outline" 
                  className={`text-[10px] ${
                    hoveredNode.threat_level > 0.7 ? 'border-red-500/50 text-red-400' :
                    hoveredNode.threat_level > 0.4 ? 'border-yellow-500/50 text-yellow-400' :
                    'border-green-500/50 text-green-400'
                  }`}
                >
                  THREAT: {(hoveredNode.threat_level * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdvancedIntelGraph;
