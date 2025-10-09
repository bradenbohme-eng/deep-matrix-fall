import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Terminal, Zap, Shield, Database, Eye, Network, 
  Activity, AlertTriangle, CheckCircle2, Clock, Play, Pause
} from 'lucide-react';

interface ScanTask {
  id: string;
  name: string;
  target: string;
  tool: string;
  status: 'running' | 'complete' | 'queued' | 'failed';
  progress: number;
  startTime: Date;
  findings: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const TOOLS = [
  { name: 'nmap', icon: Terminal, desc: 'Port Scanner', color: 'text-blue-400' },
  { name: 'masscan', icon: Zap, desc: 'Fast Scanner', color: 'text-yellow-400' },
  { name: 'nikto', icon: Shield, desc: 'Web Scanner', color: 'text-red-400' },
  { name: 'sqlmap', icon: Database, desc: 'SQL Injection', color: 'text-purple-400' },
  { name: 'shodan', icon: Eye, desc: 'Search Engine', color: 'text-cyan-400' },
  { name: 'wireshark', icon: Network, desc: 'Packet Analysis', color: 'text-green-400' },
];

export default function AdvancedScanOps() {
  const [scans, setScans] = useState<ScanTask[]>([]);
  const [activeScans, setActiveScans] = useState(0);

  useEffect(() => {
    // Initialize with some demo scans
    const initialScans: ScanTask[] = [
      {
        id: '1',
        name: 'Port Scan',
        target: '192.168.1.0/24',
        tool: 'nmap',
        status: 'running',
        progress: 67,
        startTime: new Date(Date.now() - 1000 * 60 * 5),
        findings: 12,
        severity: 'medium'
      },
      {
        id: '2',
        name: 'Web Vulnerability Scan',
        target: 'target.example.com',
        tool: 'nikto',
        status: 'complete',
        progress: 100,
        startTime: new Date(Date.now() - 1000 * 60 * 15),
        findings: 8,
        severity: 'high'
      },
      {
        id: '3',
        name: 'Network Discovery',
        target: '10.0.0.0/16',
        tool: 'masscan',
        status: 'queued',
        progress: 0,
        startTime: new Date(),
        findings: 0,
        severity: 'low'
      },
      {
        id: '4',
        name: 'Shodan Intelligence',
        target: '203.0.113.0/24',
        tool: 'shodan',
        status: 'running',
        progress: 43,
        startTime: new Date(Date.now() - 1000 * 60 * 3),
        findings: 24,
        severity: 'critical'
      }
    ];
    
    setScans(initialScans);
    setActiveScans(initialScans.filter(s => s.status === 'running').length);

    // Simulate progress updates
    const interval = setInterval(() => {
      setScans(prev => prev.map(scan => {
        if (scan.status === 'running' && scan.progress < 100) {
          const newProgress = Math.min(100, scan.progress + Math.random() * 5);
          return {
            ...scan,
            progress: newProgress,
            findings: scan.findings + (Math.random() > 0.7 ? 1 : 0),
            status: newProgress >= 100 ? 'complete' : 'running'
          };
        }
        return scan;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ScanTask['status']) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4 animate-pulse text-yellow-400" />;
      case 'complete': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'queued': return <Clock className="w-4 h-4 text-blue-400" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const getSeverityColor = (severity: ScanTask['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getElapsedTime = (startTime: Date) => {
    const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-4 p-4">
      {/* Stats Overview */}
      <Card className="p-4 bg-card/60 border-primary/20">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{activeScans}</div>
            <div className="text-xs text-muted-foreground">Active Scans</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{scans.filter(s => s.status === 'complete').length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{scans.reduce((acc, s) => acc + s.findings, 0)}</div>
            <div className="text-xs text-muted-foreground">Total Findings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{scans.filter(s => s.status === 'queued').length}</div>
            <div className="text-xs text-muted-foreground">Queued</div>
          </div>
        </div>
      </Card>

      {/* Reconnaissance Tools */}
      <Card className="p-4 border border-primary/20 bg-card/60">
        <h3 className="text-primary font-mono text-sm mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          RECONNAISSANCE ARSENAL
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button 
                key={tool.name}
                variant="outline" 
                className="font-mono text-xs flex flex-col items-start h-auto p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3 h-3 ${tool.color}`} />
                  <span className="font-semibold">{tool.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{tool.desc}</span>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Active Scans */}
      <Card className="p-4 border border-primary/20 bg-card/60">
        <h3 className="text-primary font-mono text-sm mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          ACTIVE OPERATIONS
        </h3>
        <div className="space-y-3">
          {scans.map((scan) => (
            <div 
              key={scan.id} 
              className="p-3 bg-muted/30 rounded border border-primary/10 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(scan.status)}
                    <span className="font-mono text-sm font-semibold">{scan.name}</span>
                    <Badge variant="outline" className="text-[10px]">{scan.tool}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Target: {scan.target}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${getSeverityColor(scan.severity)}`}>
                    {scan.severity.toUpperCase()}
                  </Badge>
                  {scan.status === 'running' && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Pause className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {scan.status === 'running' && (
                <div className="space-y-1">
                  <Progress value={scan.progress} className="h-1" />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>{scan.progress.toFixed(0)}% complete</span>
                    <span>Runtime: {getElapsedTime(scan.startTime)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono">
                    Findings: <span className="text-yellow-400 font-semibold">{scan.findings}</span>
                  </span>
                  {scan.status === 'complete' && (
                    <span className="text-green-400 font-mono">✓ Analysis complete</span>
                  )}
                </div>
                {scan.status === 'queued' && (
                  <Button variant="outline" size="sm" className="h-6 text-[10px]">
                    <Play className="w-3 h-3 mr-1" />
                    Start
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-4 border border-primary/20 bg-card/60">
        <h3 className="text-primary font-mono text-sm mb-3">SYSTEM STATUS</h3>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">CPU Usage</span>
            <span className="text-primary">47%</span>
          </div>
          <Progress value={47} className="h-1" />
          
          <div className="flex justify-between items-center mt-3">
            <span className="text-muted-foreground">Memory</span>
            <span className="text-primary">2.3GB / 8GB</span>
          </div>
          <Progress value={28.75} className="h-1" />
          
          <div className="flex justify-between items-center mt-3">
            <span className="text-muted-foreground">Network I/O</span>
            <span className="text-yellow-400">↓ 124 MB/s ↑ 32 MB/s</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
