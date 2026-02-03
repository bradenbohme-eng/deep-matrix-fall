// Blue Team Panel - Defensive Security Operations

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Eye,
  AlertTriangle,
  Activity,
  Search,
  FileWarning,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  TrendingUp,
  Database,
  Radar
} from 'lucide-react';
import type { Alert, Indicator } from './types';

interface BlueTeamPanelProps {
  alerts?: Alert[];
  onAcknowledgeAlert?: (id: string) => void;
}

const BlueTeamPanel: React.FC<BlueTeamPanelProps> = ({ 
  alerts: externalAlerts,
  onAcknowledgeAlert 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [alerts] = useState<Alert[]>(externalAlerts || [
    { 
      id: 'a1', 
      severity: 'critical', 
      title: 'Suspicious PowerShell Execution',
      description: 'Base64-encoded PowerShell command detected from workstation',
      source: 'EDR',
      timestamp: new Date(Date.now() - 300000),
      acknowledged: false,
      relatedIndicators: ['hash-1', 'ip-1']
    },
    { 
      id: 'a2', 
      severity: 'high', 
      title: 'Brute Force Attack Detected',
      description: 'Multiple failed login attempts from external IP',
      source: 'SIEM',
      timestamp: new Date(Date.now() - 900000),
      acknowledged: false,
      relatedIndicators: ['ip-2']
    },
    { 
      id: 'a3', 
      severity: 'medium', 
      title: 'Unusual Outbound Traffic',
      description: 'Data exfiltration pattern detected to unknown destination',
      source: 'NDR',
      timestamp: new Date(Date.now() - 1800000),
      acknowledged: true,
      relatedIndicators: ['ip-3', 'domain-1']
    },
  ]);

  const [indicators] = useState<Indicator[]>([
    { id: 'hash-1', type: 'hash', value: 'a1b2c3d4e5f6...', confidence: 95, source: 'VirusTotal', tags: ['malware', 'trojan'], firstSeen: new Date(Date.now() - 86400000), lastSeen: new Date() },
    { id: 'ip-1', type: 'ip', value: '185.243.115.84', confidence: 87, source: 'ThreatFeed', tags: ['c2', 'apt'], firstSeen: new Date(Date.now() - 172800000), lastSeen: new Date() },
    { id: 'domain-1', type: 'domain', value: 'malware-c2.evil.com', confidence: 99, source: 'Internal', tags: ['c2', 'blocked'], firstSeen: new Date(Date.now() - 604800000), lastSeen: new Date() },
  ]);

  const [huntingQueries] = useState([
    { id: 1, name: 'Suspicious Process Creation', status: 'running', matches: 12 },
    { id: 2, name: 'Lateral Movement Detection', status: 'completed', matches: 0 },
    { id: 3, name: 'Persistence Mechanisms', status: 'scheduled', matches: 0 },
  ]);

  const severityColors = {
    critical: 'text-red-500 bg-red-500/10 border-red-500/30',
    high: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    info: 'text-muted-foreground bg-muted/10 border-muted/30',
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="h-full flex flex-col p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="font-mono text-sm font-bold text-blue-500">BLUE TEAM OPS</span>
        </div>
        <div className="flex items-center space-x-2">
          {unacknowledgedCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unacknowledgedCount} Active
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-muted/20 rounded p-2 text-center">
          <div className="text-lg font-mono text-red-500">{alerts.filter(a => a.severity === 'critical').length}</div>
          <div className="text-[10px] text-muted-foreground">Critical</div>
        </div>
        <div className="bg-muted/20 rounded p-2 text-center">
          <div className="text-lg font-mono text-orange-500">{alerts.filter(a => a.severity === 'high').length}</div>
          <div className="text-[10px] text-muted-foreground">High</div>
        </div>
        <div className="bg-muted/20 rounded p-2 text-center">
          <div className="text-lg font-mono text-primary">{indicators.length}</div>
          <div className="text-[10px] text-muted-foreground">IOCs</div>
        </div>
        <div className="bg-muted/20 rounded p-2 text-center">
          <div className="text-lg font-mono text-blue-500">{huntingQueries.filter(q => q.status === 'running').length}</div>
          <div className="text-[10px] text-muted-foreground">Hunts</div>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 bg-muted/30">
          <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
          <TabsTrigger value="iocs" className="text-xs">IOCs</TabsTrigger>
          <TabsTrigger value="hunting" className="text-xs">Hunting</TabsTrigger>
          <TabsTrigger value="forensics" className="text-xs">Forensics</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="flex-1 overflow-hidden mt-2">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {alerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`p-3 border ${severityColors[alert.severity]} ${
                    !alert.acknowledged ? 'border-l-4' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        'text-yellow-500'
                      }`} />
                      <div>
                        <div className="font-mono text-sm font-bold">{alert.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{alert.description}</div>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">{alert.source}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.round((Date.now() - alert.timestamp.getTime()) / 60000)}m ago
                          </span>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary"
                        onClick={() => onAcknowledgeAlert?.(alert.id)}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="iocs" className="flex-1 overflow-hidden mt-2">
          <div className="mb-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indicators..."
              className="bg-black/30 border-blue-500/30 text-xs"
            />
          </div>
          <ScrollArea className="h-[calc(100%-40px)]">
            <div className="space-y-2">
              {indicators.map((ioc) => (
                <div 
                  key={ioc.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/20 hover:bg-muted/40"
                >
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="font-mono text-sm">{ioc.value}</div>
                      <div className="flex items-center space-x-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">{ioc.type}</Badge>
                        {ioc.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-primary">{ioc.confidence}%</div>
                    <div className="text-[10px] text-muted-foreground">{ioc.source}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="hunting" className="flex-1 overflow-hidden mt-2">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {huntingQueries.map((query) => (
                <Card key={query.id} className="p-3 bg-black/30 border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Radar className={`w-4 h-4 ${
                        query.status === 'running' ? 'text-yellow-500 animate-pulse' :
                        query.status === 'completed' ? 'text-primary' :
                        'text-muted-foreground'
                      }`} />
                      <span className="font-mono text-sm">{query.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {query.matches} matches
                    </Badge>
                  </div>
                  {query.status === 'running' && (
                    <Progress value={65} className="h-1" />
                  )}
                </Card>
              ))}
              
              <Button variant="outline" className="w-full border-blue-500/50 text-blue-500 mt-4">
                <Search className="w-4 h-4 mr-1" />
                New Hunt Query
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="forensics" className="flex-1 overflow-hidden mt-2">
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Eye className="w-12 h-12 mb-2 text-blue-500/50" />
            <div className="text-sm font-mono">Forensics Lab</div>
            <div className="text-xs">Upload evidence for analysis</div>
            <Button variant="outline" size="sm" className="mt-4 border-blue-500/50 text-blue-500">
              <FileWarning className="w-4 h-4 mr-1" />
              Analyze Artifact
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlueTeamPanel;
