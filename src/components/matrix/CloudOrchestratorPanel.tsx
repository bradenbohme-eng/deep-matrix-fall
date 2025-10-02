import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, Network, Cpu, HardDrive, Activity, Zap, 
  Globe, Server, Cloud, Terminal, Code, Shield 
} from 'lucide-react';

interface EdgeNode {
  id: string;
  location: string;
  status: 'online' | 'degraded' | 'offline';
  load: number;
  latency: number;
  throughput: string;
  tasks: number;
  uptime: string;
}

interface SwarmTask {
  id: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  nodes: string[];
  startTime: string;
}

const CloudOrchestratorPanel: React.FC = () => {
  const [edgeNodes, setEdgeNodes] = useState<EdgeNode[]>([
    { id: 'edge-us-east-1', location: 'US East (Virginia)', status: 'online', load: 45, latency: 12, throughput: '1.2 GB/s', tasks: 127, uptime: '99.98%' },
    { id: 'edge-us-west-2', location: 'US West (Oregon)', status: 'online', load: 62, latency: 18, throughput: '980 MB/s', tasks: 94, uptime: '99.95%' },
    { id: 'edge-eu-central-1', location: 'EU Central (Frankfurt)', status: 'online', load: 71, latency: 45, throughput: '1.5 GB/s', tasks: 156, uptime: '99.99%' },
    { id: 'edge-ap-southeast-1', location: 'Asia Pacific (Singapore)', status: 'online', load: 38, latency: 87, throughput: '875 MB/s', tasks: 82, uptime: '99.94%' },
    { id: 'edge-ap-northeast-1', location: 'Asia Pacific (Tokyo)', status: 'online', load: 54, latency: 92, throughput: '1.1 GB/s', tasks: 113, uptime: '99.97%' },
    { id: 'edge-sa-east-1', location: 'South America (São Paulo)', status: 'degraded', load: 89, latency: 156, throughput: '543 MB/s', tasks: 67, uptime: '98.82%' },
    { id: 'edge-af-south-1', location: 'Africa (Cape Town)', status: 'online', load: 23, latency: 178, throughput: '421 MB/s', tasks: 34, uptime: '99.89%' },
    { id: 'edge-me-south-1', location: 'Middle East (Bahrain)', status: 'online', load: 67, latency: 123, throughput: '765 MB/s', tasks: 91, uptime: '99.91%' },
  ]);

  const [swarmTasks, setSwarmTasks] = useState<SwarmTask[]>([
    { id: 'task-001', type: 'Global Port Scan', status: 'running', progress: 67, nodes: ['edge-us-east-1', 'edge-eu-central-1', 'edge-ap-southeast-1'], startTime: '2025-01-15T08:23:15Z' },
    { id: 'task-002', type: 'Distributed Brute Force', status: 'running', progress: 34, nodes: ['edge-us-west-2', 'edge-ap-northeast-1'], startTime: '2025-01-15T09:12:44Z' },
    { id: 'task-003', type: 'Mass Vulnerability Scan', status: 'completed', progress: 100, nodes: ['edge-us-east-1', 'edge-us-west-2', 'edge-eu-central-1', 'edge-ap-southeast-1'], startTime: '2025-01-15T06:45:22Z' },
    { id: 'task-004', type: 'OSINT Data Aggregation', status: 'running', progress: 89, nodes: ['edge-af-south-1', 'edge-me-south-1'], startTime: '2025-01-15T07:33:11Z' },
    { id: 'task-005', type: 'Threat Intelligence Sync', status: 'queued', progress: 0, nodes: [], startTime: 'N/A' },
  ]);

  const [metrics, setMetrics] = useState({
    totalNodes: 8,
    activeNodes: 7,
    totalTasks: 127,
    completedToday: 1543,
    avgLatency: 89,
    totalThroughput: '7.2 GB/s',
    cpuUsage: 58,
    memoryUsage: 67,
    networkUsage: 72,
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setEdgeNodes(prev => prev.map(node => ({
        ...node,
        load: Math.min(95, Math.max(10, node.load + (Math.random() - 0.5) * 10)),
        latency: Math.max(5, node.latency + (Math.random() - 0.5) * 5),
        tasks: Math.max(0, node.tasks + Math.floor((Math.random() - 0.5) * 5)),
      })));

      setSwarmTasks(prev => prev.map(task => 
        task.status === 'running' 
          ? { ...task, progress: Math.min(100, task.progress + Math.random() * 3) }
          : task
      ));

      setMetrics(prev => ({
        ...prev,
        totalTasks: prev.totalTasks + Math.floor(Math.random() * 3),
        cpuUsage: Math.min(95, Math.max(20, prev.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.min(95, Math.max(30, prev.memoryUsage + (Math.random() - 0.5) * 4)),
        networkUsage: Math.min(95, Math.max(25, prev.networkUsage + (Math.random() - 0.5) * 6)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const colors = {
      online: 'bg-green-500/20 text-green-400 border-green-500/40',
      degraded: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
      offline: 'bg-red-500/20 text-red-400 border-red-500/40',
      running: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      completed: 'bg-green-500/20 text-green-400 border-green-500/40',
      failed: 'bg-red-500/20 text-red-400 border-red-500/40',
      queued: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
    };
    return colors[status as keyof typeof colors] || colors.offline;
  };

  const getLoadColor = (load: number) => {
    if (load > 80) return 'text-red-400';
    if (load > 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <section className="h-full overflow-y-auto">
      {/* Global Metrics */}
      <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <h2 className="text-primary font-mono text-lg mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 animate-spin-slow" />
          CLOUD ORCHESTRATOR - GLOBAL SWARM CONTROL
        </h2>
        
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3 bg-card/60 border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-mono">NODES</span>
            </div>
            <div className="text-2xl font-mono text-primary">{metrics.activeNodes}/{metrics.totalNodes}</div>
          </Card>
          
          <Card className="p-3 bg-card/60 border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-mono">TASKS</span>
            </div>
            <div className="text-2xl font-mono text-primary">{metrics.totalTasks}</div>
          </Card>
          
          <Card className="p-3 bg-card/60 border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-mono">LATENCY</span>
            </div>
            <div className="text-2xl font-mono text-primary">{metrics.avgLatency}ms</div>
          </Card>
          
          <Card className="p-3 bg-card/60 border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Network className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-mono">THROUGHPUT</span>
            </div>
            <div className="text-xl font-mono text-primary">{metrics.totalThroughput}</div>
          </Card>
        </div>

        {/* Resource Usage */}
        <div className="mt-4 space-y-2">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-muted-foreground">CPU</span>
              <span className="text-primary">{metrics.cpuUsage}%</span>
            </div>
            <Progress value={metrics.cpuUsage} className="h-1" />
          </div>
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-muted-foreground">MEMORY</span>
              <span className="text-primary">{metrics.memoryUsage}%</span>
            </div>
            <Progress value={metrics.memoryUsage} className="h-1" />
          </div>
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-muted-foreground">NETWORK</span>
              <span className="text-primary">{metrics.networkUsage}%</span>
            </div>
            <Progress value={metrics.networkUsage} className="h-1" />
          </div>
        </div>
      </div>

      {/* Edge Nodes */}
      <div className="p-4 border-b border-primary/20">
        <h3 className="text-primary font-mono text-sm mb-3 flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          GLOBAL EDGE NODES
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {edgeNodes.map(node => (
            <Card key={node.id} className="p-3 bg-card/40 border-primary/20 hover:bg-card/60 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-mono text-primary font-semibold">{node.location}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{node.id}</div>
                </div>
                <Badge className={`text-[10px] font-mono ${getStatusBadge(node.status)}`}>
                  {node.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-muted-foreground">Load</span>
                  <span className={getLoadColor(node.load)}>{node.load}%</span>
                </div>
                <Progress value={node.load} className="h-1" />
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-[10px] font-mono">
                    <span className="text-muted-foreground">Latency: </span>
                    <span className="text-primary">{node.latency}ms</span>
                  </div>
                  <div className="text-[10px] font-mono">
                    <span className="text-muted-foreground">Tasks: </span>
                    <span className="text-primary">{node.tasks}</span>
                  </div>
                  <div className="text-[10px] font-mono">
                    <span className="text-muted-foreground">Speed: </span>
                    <span className="text-primary">{node.throughput}</span>
                  </div>
                  <div className="text-[10px] font-mono">
                    <span className="text-muted-foreground">Uptime: </span>
                    <span className="text-green-400">{node.uptime}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Swarm Tasks */}
      <div className="p-4">
        <h3 className="text-primary font-mono text-sm mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          DISTRIBUTED SWARM OPERATIONS
        </h3>
        <div className="space-y-3">
          {swarmTasks.map(task => (
            <Card key={task.id} className="p-3 bg-card/40 border-primary/20">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-mono text-primary font-semibold">{task.type}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {task.id} • Started: {task.startTime !== 'N/A' ? new Date(task.startTime).toLocaleTimeString() : 'Pending'}
                  </div>
                </div>
                <Badge className={`text-[10px] font-mono ${getStatusBadge(task.status)}`}>
                  {task.status.toUpperCase()}
                </Badge>
              </div>

              {task.status === 'running' && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-primary">{Math.floor(task.progress)}%</span>
                  </div>
                  <Progress value={task.progress} className="h-1.5" />
                </div>
              )}

              {task.nodes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.nodes.map(nodeId => (
                    <Badge key={nodeId} variant="secondary" className="text-[9px] font-mono">
                      {nodeId}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        <Button className="w-full mt-4 font-mono">
          <Zap className="w-4 h-4 mr-2" />
          DEPLOY NEW SWARM OPERATION
        </Button>
      </div>

      <div className="p-4 text-xs text-muted-foreground font-mono border-t border-primary/20">
        <Shield className="w-3 h-3 inline mr-2" />
        All operations are secured with end-to-end encryption. Database operations utilize Supabase Edge Functions 
        with parallel processing across global nodes. Swarm intelligence enables distributed reconnaissance, 
        vulnerability scanning, and data aggregation at scale.
      </div>
    </section>
  );
};

export default CloudOrchestratorPanel;
