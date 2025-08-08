import React, { useEffect, useMemo, useRef, useState } from 'react';

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

// Lightweight animated force graph for a Matrix-style intel web
const IntelGraph: React.FC<IntelGraphProps> = ({ items }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 640, h: 360 });

  // Build nodes/links from items
  const { nodes, links } = useMemo(() => {
    type Node = { id: string; x: number; y: number; vx: number; vy: number; size: number; kind: 'hub' | 'item' | 'keyword'; };
    type Link = { source: string; target: string; weight: number };

    const center: Node = { id: 'NEO_CORE', x: 0, y: 0, vx: 0, vy: 0, size: 10, kind: 'hub' };
    const nodesMap = new Map<string, Node>([[center.id, center]]);
    const linksArr: Link[] = [];

    const stopwords = new Set(['the','a','an','and','or','of','to','in','on','for','with','from','by','at','is','are','be','as','vs','via']);

    const rand = (min:number,max:number)=>Math.random()*(max-min)+min;

    items.slice(0, 40).forEach((it, idx) => {
      const id = `item_${it.id}`;
      nodesMap.set(id, { id, x: rand(-150, 150), y: rand(-100, 100), vx: 0, vy: 0, size: 6, kind: 'item' });
      linksArr.push({ source: 'NEO_CORE', target: id, weight: 1 });

      const words = (it.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w && !stopwords.has(w) && w.length > 3);

      words.slice(0, 3).forEach(w => {
        const kwId = `kw_${w}`;
        if (!nodesMap.has(kwId)) {
          nodesMap.set(kwId, { id: kwId, x: rand(-200, 200), y: rand(-150, 150), vx: 0, vy: 0, size: 4, kind: 'keyword' });
        }
        linksArr.push({ source: id, target: kwId, weight: 0.7 });
      });
    });

    return { nodes: Array.from(nodesMap.values()), links: linksArr };
  }, [items]);

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Animation loop (simple force simulation)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let raf = 0;

    // Pull CSS HSL tokens for colors
    const root = getComputedStyle(document.documentElement);
    const primary = root.getPropertyValue('--primary') || '140 76% 48%';
    const accent = root.getPropertyValue('--accent') || '260 85% 66%';
    const fg = root.getPropertyValue('--foreground') || '0 0% 98%';

    // Physics params
    const centerStrength = 0.005;
    const linkStrength = 0.05;
    const repulsion = 2500;
    const damping = 0.9;

    const idToNode = new Map(nodes.map(n => [n.id, n] as const));

    const tick = () => {
      frame++;
      const { w, h } = size;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);

      // Forces
      nodes.forEach(n => {
        // Pull to center (except exact center)
        if (n.id !== 'NEO_CORE') {
          n.vx += -n.x * centerStrength;
          n.vy += -n.y * centerStrength;
        }
      });

      // Link springs
      links.forEach(l => {
        const a = idToNode.get(l.source)!;
        const b = idToNode.get(l.target)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const force = (dist - 60) * linkStrength * l.weight;
        const nx = dx / dist, ny = dy / dist;
        a.vx += force * nx; a.vy += force * ny;
        b.vx -= force * nx; b.vy -= force * ny;
      });

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x; const dy = b.y - a.y;
          const dist2 = dx*dx + dy*dy + 0.01;
          const f = repulsion / dist2;
          const nx = dx / Math.sqrt(dist2); const ny = dy / Math.sqrt(dist2);
          a.vx -= f * nx; a.vy -= f * ny;
          b.vx += f * nx; b.vy += f * ny;
        }
      }

      // Integrate
      nodes.forEach(n => {
        n.vx *= damping; n.vy *= damping;
        n.x += n.vx; n.y += n.vy;
      });

      // Draw links
      ctx.lineWidth = 1;
      links.forEach((l, idx) => {
        const a = idToNode.get(l.source)!;
        const b = idToNode.get(l.target)!;
        const pulse = 0.4 + 0.3 * Math.sin((frame + idx * 7) * 0.05);
        ctx.strokeStyle = `hsl(${primary} / ${0.25 + pulse * 0.25})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((n, idx) => {
        const base = n.kind === 'hub' ? accent : primary;
        const glow = 0.4 + 0.3 * Math.sin((frame + idx * 13) * 0.06);
        const r = n.size + (n.kind === 'item' ? 1.5 * glow : glow);
        ctx.fillStyle = `hsl(${base} / ${0.7})`;
        ctx.shadowColor = `hsl(${base} / 0.35)`;
        ctx.shadowBlur = 8 * glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Hub label
      ctx.fillStyle = `hsl(${fg} / 0.8)`;
      ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GLOBAL INTEL WEB', 0, -size.h/2 + 16);

      ctx.restore();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nodes, links, size]);

  return (
    <div ref={containerRef} className="w-full h-full bg-background/30 border border-primary/20 rounded-md">
      <canvas ref={canvasRef} width={size.w} height={size.h} className="w-full h-full" />
    </div>
  );
};

export default IntelGraph;
