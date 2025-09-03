import React, { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IntelNode {
  id: string;
  title: string;
  classification: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  connections: string[];
  type: 'intel' | 'player' | 'faction' | 'hub';
}

interface IntelLink {
  source: string;
  target: string;
  strength: number;
  distance: number;
}

interface FeedItem {
  id: string;
  title: string;
  classification_level: number;
  value_isk: number;
  intel_type: string;
  owner_id?: string;
}

interface IntelGraphProps {
  items?: FeedItem[];
  width?: number;
  height?: number;
}

export const IntelGraph: React.FC<IntelGraphProps> = ({ 
  items = [], 
  width = 800, 
  height = 600 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [intelAssets, setIntelAssets] = useState<FeedItem[]>([]);
  const [animationId, setAnimationId] = useState<number | null>(null);

  // Load intel assets from database
  useEffect(() => {
    const loadIntelAssets = async () => {
      try {
        const { data } = await supabase
          .from('intel_assets')
          .select('id, title, classification_level, value_isk, intel_type, owner_id')
          .eq('tradeable', true)
          .limit(50);
        
        if (data) {
          setIntelAssets(data);
        }
      } catch (error) {
        console.error('Error loading intel assets:', error);
      }
    };

    loadIntelAssets();

    // Real-time subscription
    const channel = supabase
      .channel('intel-graph')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'intel_assets' 
      }, () => {
        loadIntelAssets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const { nodes, links } = useMemo(() => {
    const allItems = items.length > 0 ? items : intelAssets;
    if (allItems.length === 0) return { nodes: [], links: [] };

    const nodeMap = new Map<string, IntelNode>();
    const linkSet = new Set<string>();
    const links: IntelLink[] = [];

    // Create central hub
    const hubId = 'GLOBAL_INTEL_HUB';
    nodeMap.set(hubId, {
      id: hubId,
      title: 'GLOBAL INTEL WEB',
      classification: 5,
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      value: 100,
      connections: [],
      type: 'hub'
    });

    // Create nodes for each intel asset
    allItems.forEach((item, index) => {
      const angle = (index / allItems.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.3;
      
      const node: IntelNode = {
        id: item.id,
        title: item.title,
        classification: item.classification_level,
        x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
        y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        value: Math.log10(item.value_isk + 1) * 10,
        connections: [],
        type: 'intel'
      };

      nodeMap.set(item.id, node);

      // Connect to hub
      const linkId = `${hubId}-${item.id}`;
      if (!linkSet.has(linkId)) {
        links.push({
          source: hubId,
          target: item.id,
          strength: item.classification_level / 5,
          distance: 150 + item.classification_level * 20
        });
        linkSet.add(linkId);
      }
    });

    // Create connections between related intel (same type or similar classification)
    allItems.forEach((item1, i) => {
      allItems.forEach((item2, j) => {
        if (i >= j) return;
        
        const similarity = calculateSimilarity(item1, item2);
        if (similarity > 0.3) {
          const linkId = `${item1.id}-${item2.id}`;
          if (!linkSet.has(linkId)) {
            links.push({
              source: item1.id,
              target: item2.id,
              strength: similarity,
              distance: 100 + (1 - similarity) * 100
            });
            linkSet.add(linkId);
          }
        }
      });
    });

    return { nodes: Array.from(nodeMap.values()), links };
  }, [intelAssets, items, width, height]);

  const calculateSimilarity = (item1: FeedItem, item2: FeedItem): number => {
    let similarity = 0;
    
    // Same intel type
    if (item1.intel_type === item2.intel_type) {
      similarity += 0.4;
    }
    
    // Similar classification level
    const classificationDiff = Math.abs(item1.classification_level - item2.classification_level);
    similarity += (5 - classificationDiff) / 5 * 0.3;
    
    // Similar value
    const valueDiff = Math.abs(Math.log10(item1.value_isk + 1) - Math.log10(item2.value_isk + 1));
    similarity += Math.max(0, (3 - valueDiff) / 3) * 0.3;
    
    return similarity;
  };

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    const animate = () => {
      ctx.fillStyle = 'hsl(var(--background))';
      ctx.fillRect(0, 0, width, height);

      // Apply forces
      nodes.forEach(node => {
        if (node.type === 'hub') return; // Hub stays fixed

        // Gravitational pull towards center
        const centerX = width / 2;
        const centerY = height / 2;
        const distToCenter = Math.sqrt((node.x - centerX) ** 2 + (node.y - centerY) ** 2);
        const gravityStrength = 0.0001;
        node.vx += (centerX - node.x) * gravityStrength;
        node.vy += (centerY - node.y) * gravityStrength;

        // Repulsion from other nodes
        nodes.forEach(other => {
          if (node === other) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 150 && distance > 0) {
            const repulsion = 500 / (distance * distance);
            node.vx += (dx / distance) * repulsion;
            node.vy += (dy / distance) * repulsion;
          }
        });

        // Damping
        node.vx *= 0.98;
        node.vy *= 0.98;

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Boundary conditions
        if (node.x < 20) { node.x = 20; node.vx = 0; }
        if (node.x > width - 20) { node.x = width - 20; node.vx = 0; }
        if (node.y < 20) { node.y = 20; node.vy = 0; }
        if (node.y > height - 20) { node.y = height - 20; node.vy = 0; }
      });

      // Draw links
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (!source || !target) return;

        const alpha = Math.max(0.1, link.strength);
        ctx.strokeStyle = `hsla(var(--primary-hsl), ${alpha})`;
        ctx.lineWidth = Math.max(0.5, link.strength * 3);
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        // Animated data flow
        const time = Date.now() * 0.005;
        const flowPosition = (time % 1);
        const flowX = source.x + (target.x - source.x) * flowPosition;
        const flowY = source.y + (target.y - source.y) * flowPosition;
        
        ctx.fillStyle = `hsl(var(--primary) / 0.8)`;
        ctx.beginPath();
        ctx.arc(flowX, flowY, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach(node => {
        const radius = node.type === 'hub' ? 25 : Math.max(8, node.value / 5);
        
        // Node glow
        if (node.type === 'hub') {
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 2);
          gradient.addColorStop(0, 'hsl(var(--primary) / 0.6)');
          gradient.addColorStop(1, 'hsl(var(--primary) / 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node body
        if (node.type === 'hub') {
          ctx.fillStyle = 'hsl(var(--primary))';
        } else {
          const classificationColor = node.classification <= 1 ? '#10b981' : 
                                     node.classification <= 3 ? '#f59e0b' : '#ef4444';
          ctx.fillStyle = classificationColor;
        }
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Node border
        ctx.strokeStyle = 'hsl(var(--primary))';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Classification level indicator
        if (node.type !== 'hub') {
          ctx.fillStyle = 'hsl(var(--background))';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.classification.toString(), node.x, node.y);
        }

        // Labels for important nodes
        if (node.type === 'hub' || node.value > 50) {
          ctx.fillStyle = 'hsl(var(--foreground))';
          ctx.font = node.type === 'hub' ? '14px monospace' : '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const maxWidth = 100;
          const text = node.title.length > 15 ? node.title.substring(0, 15) + '...' : node.title;
          ctx.fillText(text, node.x, node.y + radius + 5);
        }
      });

      // Title
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GLOBAL INTELLIGENCE NETWORK', width / 2, 30);

      // Stats
      ctx.fillStyle = 'hsl(var(--muted-foreground))';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`NODES: ${nodes.length}`, 20, height - 40);
      ctx.fillText(`CONNECTIONS: ${links.length}`, 20, height - 20);
      
      ctx.textAlign = 'right';
      ctx.fillText('NEURAL LINK: ACTIVE', width - 20, height - 40);
      ctx.fillText('QUANTUM SYNC: STABLE', width - 20, height - 20);

      setAnimationId(requestAnimationFrame(animate));
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [nodes, links, width, height, animationId]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          canvasRef.current.width = rect.width;
          canvasRef.current.height = Math.min(600, rect.height);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <canvas 
        ref={canvasRef}
        className="w-full h-full border border-primary/20 rounded bg-background"
        style={{ imageRendering: 'pixelated' }}
      />
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground font-mono text-sm">
            INITIALIZING INTELLIGENCE NETWORK...
          </div>
        </div>
      )}
    </div>
  );
};