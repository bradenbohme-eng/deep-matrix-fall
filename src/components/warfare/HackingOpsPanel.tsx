import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Terminal, Play, Pause, StopCircle, Loader2 } from 'lucide-react';

interface Operation {
  id: string;
  name: string;
  target: string;
  type: 'scan' | 'exploit' | 'exfiltrate' | 'ddos';
  progress: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
}

const HackingOpsPanel: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([
    { id: 'op1', name: 'Port Scan', target: '10.0.0.0/8', type: 'scan', progress: 45, status: 'running' },
    { id: 'op2', name: 'SQL Injection', target: 'target.mil', type: 'exploit', progress: 78, status: 'running' },
    { id: 'op3', name: 'Data Exfil', target: '192.168.1.100', type: 'exfiltrate', progress: 23, status: 'running' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOperations(prev => prev.map(op => {
        if (op.status !== 'running') return op;
        const newProgress = Math.min(100, op.progress + Math.random() * 5);
        const newStatus = newProgress >= 100 ? 'completed' : 'running';
        return { ...op, progress: newProgress, status: newStatus };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scan': return 'border-blue-500/50 bg-blue-500/10';
      case 'exploit': return 'border-red-500/50 bg-red-500/10';
      case 'exfiltrate': return 'border-purple-500/50 bg-purple-500/10';
      case 'ddos': return 'border-orange-500/50 bg-orange-500/10';
      default: return 'border-primary/50 bg-primary/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="w-3 h-3 animate-spin text-green-400" />;
      case 'paused': return <Pause className="w-3 h-3 text-yellow-400" />;
      case 'completed': return <span className="text-green-400 text-xs">✓</span>;
      case 'failed': return <span className="text-red-400 text-xs">✕</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono text-primary font-bold">OPERATIONS</span>
        </div>
        <Button variant="outline" size="sm" className="h-6 text-xs font-mono">
          <Play className="w-3 h-3 mr-1" />
          NEW OP
        </Button>
      </div>

      <div className="space-y-2">
        {operations.map(op => (
          <Card key={op.id} className={`p-2 border ${getTypeColor(op.type)}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(op.status)}
                <span className="text-xs font-mono text-foreground font-semibold">{op.name}</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {op.type.toUpperCase()}
              </Badge>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground mb-1">
              → {op.target}
            </div>
            <div className="space-y-1">
              <Progress value={op.progress} className="h-1" />
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">{op.status}</span>
                <span className="text-primary">{op.progress.toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex gap-1 mt-1">
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <Pause className="w-2 h-2" />
              </Button>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <StopCircle className="w-2 h-2" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HackingOpsPanel;
