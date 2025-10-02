import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, Shield, AlertTriangle, Database, Network } from 'lucide-react';

const NetworkStatsPanel: React.FC = () => {
  const [stats, setStats] = useState({
    activeNodes: 147,
    packetsPerSec: 0,
    bandwidth: 0,
    threats: 23,
    attacks: 7,
    compromised: 3
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        activeNodes: prev.activeNodes + Math.floor((Math.random() - 0.5) * 5),
        packetsPerSec: Math.floor(Math.random() * 10000) + 5000,
        bandwidth: Math.random() * 100,
        threats: prev.threats + Math.floor((Math.random() - 0.5) * 3),
        attacks: prev.attacks + Math.floor((Math.random() - 0.5) * 2),
        compromised: Math.max(0, prev.compromised + Math.floor((Math.random() - 0.6) * 2))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <Card className="p-3 bg-background/90 backdrop-blur border-primary/20">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Network className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground font-mono">NODES</span>
            </div>
            <div className="text-xl font-mono text-primary">{stats.activeNodes}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-green-400" />
              <span className="text-xs text-muted-foreground font-mono">PKT/S</span>
            </div>
            <div className="text-xl font-mono text-green-400">{stats.packetsPerSec.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-muted-foreground font-mono">THREATS</span>
            </div>
            <div className="text-xl font-mono text-yellow-400">{stats.threats}</div>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-background/90 backdrop-blur border-red-500/30">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-xs font-mono text-foreground">ACTIVE ATTACKS</span>
            </div>
            <Badge variant="destructive" className="font-mono text-xs">{stats.attacks}</Badge>
          </div>
          <Progress value={stats.attacks * 10} className="h-1" />
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-mono text-foreground">COMPROMISED</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs border-orange-500 text-orange-400">
              {stats.compromised}
            </Badge>
          </div>
          <Progress value={stats.compromised * 20} className="h-1" />
        </div>
      </Card>

      <Card className="p-3 bg-background/90 backdrop-blur border-primary/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono text-foreground">BANDWIDTH</span>
          </div>
          <Progress value={stats.bandwidth} className="h-2" />
          <div className="text-xs font-mono text-muted-foreground text-right">
            {stats.bandwidth.toFixed(1)}%
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NetworkStatsPanel;
