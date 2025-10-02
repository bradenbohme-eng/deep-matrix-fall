import React, { useEffect, useState } from 'react';

interface PacketFlow {
  id: string;
  from: [number, number];
  to: [number, number];
  type: 'attack' | 'recon' | 'data' | 'command';
  progress: number;
}

interface NetworkTrafficOverlayProps {
  nodes: Array<{ coordinates: [number, number] }>;
}

const NetworkTrafficOverlay: React.FC<NetworkTrafficOverlayProps> = ({ nodes }) => {
  const [packets, setPackets] = useState<PacketFlow[]>([]);

  useEffect(() => {
    const generatePacket = () => {
      if (nodes.length < 2) return;
      
      const from = nodes[Math.floor(Math.random() * nodes.length)];
      const to = nodes[Math.floor(Math.random() * nodes.length)];
      
      if (from === to) return;

      const types: Array<'attack' | 'recon' | 'data' | 'command'> = ['attack', 'recon', 'data', 'command'];
      const type = types[Math.floor(Math.random() * types.length)];

      const newPacket: PacketFlow = {
        id: `packet-${Date.now()}-${Math.random()}`,
        from: from.coordinates,
        to: to.coordinates,
        type,
        progress: 0
      };

      setPackets(prev => [...prev, newPacket].slice(-30)); // Keep last 30
    };

    const interval = setInterval(generatePacket, 1000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [nodes]);

  useEffect(() => {
    const animatePackets = setInterval(() => {
      setPackets(prev => prev
        .map(p => ({ ...p, progress: p.progress + 0.02 }))
        .filter(p => p.progress < 1)
      );
    }, 50);

    return () => clearInterval(animatePackets);
  }, []);

  const getPacketColor = (type: string) => {
    switch (type) {
      case 'attack': return '#ef4444';
      case 'recon': return '#3b82f6';
      case 'data': return '#10b981';
      case 'command': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {packets.map(packet => {
        const x1 = ((packet.from[1] + 180) / 360) * 100;
        const y1 = ((90 - packet.from[0]) / 180) * 100;
        const x2 = ((packet.to[1] + 180) / 360) * 100;
        const y2 = ((90 - packet.to[0]) / 180) * 100;

        const currentX = x1 + (x2 - x1) * packet.progress;
        const currentY = y1 + (y2 - y1) * packet.progress;

        return (
          <g key={packet.id}>
            <line
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke={getPacketColor(packet.type)}
              strokeWidth="1"
              opacity={0.3}
              strokeDasharray="5,5"
            />
            <circle
              cx={`${currentX}%`}
              cy={`${currentY}%`}
              r="3"
              fill={getPacketColor(packet.type)}
              opacity={0.8}
            >
              <animate
                attributeName="r"
                values="3;5;3"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}
    </svg>
  );
};

export default NetworkTrafficOverlay;
