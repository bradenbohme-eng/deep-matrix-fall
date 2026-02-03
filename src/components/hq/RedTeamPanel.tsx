// Red Team Panel - Offensive Security Operations

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crosshair, 
  Target, 
  Zap, 
  Key,
  Upload,
  Activity,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  Terminal,
  Globe,
  Lock,
  Unlock,
  Skull
} from 'lucide-react';
import type { AttackChain, AttackPhase } from './types';

interface RedTeamPanelProps {
  onLaunchOperation?: (target: string, type: string) => void;
}

const RedTeamPanel: React.FC<RedTeamPanelProps> = ({ onLaunchOperation }) => {
  const [target, setTarget] = useState('');
  const [activeChains, setActiveChains] = useState<AttackChain[]>([
    {
      id: 'chain-1',
      name: 'Operation Shadow Strike',
      phases: [
        { id: 'p1', name: 'Reconnaissance', technique: 'OSINT', mitreId: 'T1592', status: 'success' },
        { id: 'p2', name: 'Initial Access', technique: 'Phishing', mitreId: 'T1566', status: 'success' },
        { id: 'p3', name: 'Execution', technique: 'PowerShell', mitreId: 'T1059.001', status: 'executing' },
        { id: 'p4', name: 'Persistence', technique: 'Registry Run Keys', mitreId: 'T1547', status: 'pending' },
      ],
      status: 'active',
      target: '192.168.1.0/24',
      startTime: new Date(Date.now() - 3600000),
    }
  ]);
  
  const [exploits] = useState([
    { id: 1, name: 'CVE-2024-1234', type: 'RCE', severity: 'critical', platform: 'Windows' },
    { id: 2, name: 'CVE-2024-5678', type: 'SQLi', severity: 'high', platform: 'Web' },
    { id: 3, name: 'CVE-2024-9012', type: 'LPE', severity: 'medium', platform: 'Linux' },
  ]);

  const [credentials] = useState([
    { id: 1, username: 'admin', hash: '5f4dcc3b5aa765d61d8327deb882cf99', cracked: true, password: 'password' },
    { id: 2, username: 'root', hash: 'e99a18c428cb38d5f260853678922e03', cracked: false },
    { id: 3, username: 'service_acct', hash: 'd8578edf8458ce06fbc5bb76a58c5ca4', cracked: true, password: 'qwerty' },
  ]);

  const handleLaunchScan = () => {
    if (!target.trim()) return;
    onLaunchOperation?.(target, 'reconnaissance');
  };

  return (
    <div className="h-full flex flex-col p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Crosshair className="w-5 h-5 text-red-500" />
          <span className="font-mono text-sm font-bold text-red-500">RED TEAM OPS</span>
        </div>
        <Badge variant="outline" className="text-red-500 border-red-500/50">
          {activeChains.filter(c => c.status === 'active').length} Active Operations
        </Badge>
      </div>

      {/* Target Input */}
      <div className="flex space-x-2">
        <Input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target IP, domain, or CIDR..."
          className="flex-1 font-mono text-xs bg-black/30 border-red-500/30"
        />
        <Button 
          onClick={handleLaunchScan}
          size="sm" 
          className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50"
        >
          <Target className="w-4 h-4 mr-1" />
          Engage
        </Button>
      </div>

      <Tabs defaultValue="chains" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 bg-muted/30">
          <TabsTrigger value="chains" className="text-xs">Attack Chains</TabsTrigger>
          <TabsTrigger value="exploits" className="text-xs">Exploits</TabsTrigger>
          <TabsTrigger value="creds" className="text-xs">Credentials</TabsTrigger>
          <TabsTrigger value="c2" className="text-xs">C2</TabsTrigger>
        </TabsList>

        <TabsContent value="chains" className="flex-1 overflow-hidden mt-2">
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {activeChains.map((chain) => (
                <Card key={chain.id} className="p-3 bg-black/30 border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Skull className="w-4 h-4 text-red-500" />
                      <span className="font-mono text-sm font-bold">{chain.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {chain.status === 'active' ? (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500">
                          <Pause className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-primary">
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    Target: <span className="text-foreground font-mono">{chain.target}</span>
                  </div>
                  
                  {/* Kill Chain Progress */}
                  <div className="space-y-1">
                    {chain.phases.map((phase, idx) => (
                      <div key={phase.id} className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          phase.status === 'success' ? 'bg-primary' :
                          phase.status === 'executing' ? 'bg-yellow-500 animate-pulse' :
                          phase.status === 'failed' ? 'bg-destructive' :
                          'bg-muted'
                        }`} />
                        <span className="text-xs font-mono flex-1">{phase.name}</span>
                        <span className="text-xs text-muted-foreground">{phase.mitreId}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="exploits" className="flex-1 overflow-hidden mt-2">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {exploits.map((exploit) => (
                <div 
                  key={exploit.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/20 hover:bg-muted/40 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Zap className={`w-4 h-4 ${
                      exploit.severity === 'critical' ? 'text-red-500' :
                      exploit.severity === 'high' ? 'text-orange-500' :
                      'text-yellow-500'
                    }`} />
                    <div>
                      <div className="font-mono text-sm">{exploit.name}</div>
                      <div className="text-xs text-muted-foreground">{exploit.type} • {exploit.platform}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    <Play className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="creds" className="flex-1 overflow-hidden mt-2">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {credentials.map((cred) => (
                <div 
                  key={cred.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/20"
                >
                  <div className="flex items-center space-x-2">
                    {cred.cracked ? (
                      <Unlock className="w-4 h-4 text-primary" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-mono text-sm">{cred.username}</div>
                      {cred.cracked ? (
                        <div className="text-xs text-primary">{cred.password}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground font-mono">{cred.hash.slice(0, 16)}...</div>
                      )}
                    </div>
                  </div>
                  {!cred.cracked && (
                    <Button variant="ghost" size="sm" className="text-yellow-500">
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="c2" className="flex-1 overflow-hidden mt-2">
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Globe className="w-12 h-12 mb-2 text-red-500/50" />
            <div className="text-sm font-mono">C2 Framework</div>
            <div className="text-xs">No active beacons</div>
            <Button variant="outline" size="sm" className="mt-4 border-red-500/50 text-red-500">
              <Terminal className="w-4 h-4 mr-1" />
              Deploy Listener
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RedTeamPanel;
