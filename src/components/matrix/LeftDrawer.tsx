import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Terminal, Radio, Satellite, Database, Shield, 
  Activity, Search, Network, Zap, Eye, X 
} from 'lucide-react';
import LiveFeeds from './LiveFeeds';
import IntelGraph from './IntelGraph';

interface LeftDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeftDrawer: React.FC<LeftDrawerProps> = ({ open, onOpenChange }) => {
  const [feedItems, setFeedItems] = useState([]);

  if (!open) return null;

  return (
    <div className="h-full w-[500px] bg-background/95 backdrop-blur-xl border-r border-primary/20 animate-slide-in-left overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-primary/20">
        <div className="text-primary font-mono flex items-center gap-2 text-sm font-bold">
          <Radio className="w-5 h-5 animate-pulse" />
          INTELLIGENCE OPERATIONS CENTER
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onOpenChange(false)}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="feeds" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 mx-4 mt-2">
          <TabsTrigger value="feeds" className="font-mono text-xs">
            <Activity className="w-4 h-4 mr-2" />
            LIVE FEEDS
          </TabsTrigger>
          <TabsTrigger value="graph" className="font-mono text-xs">
            <Network className="w-4 h-4 mr-2" />
            INTEL GRAPH
          </TabsTrigger>
          <TabsTrigger value="scanner" className="font-mono text-xs">
            <Search className="w-4 h-4 mr-2" />
            SCAN OPS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feeds" className="flex-1 overflow-hidden mt-2">
          <LiveFeeds onData={setFeedItems} />
        </TabsContent>

        <TabsContent value="graph" className="flex-1 overflow-hidden mt-2">
          <IntelGraph items={feedItems} />
        </TabsContent>

        <TabsContent value="scanner" className="flex-1 overflow-y-auto mt-2 px-4">
          <div className="space-y-4">
            <Card className="p-4 border border-primary/20 bg-card/60">
                <h3 className="text-primary font-mono text-sm mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  RECONNAISSANCE TOOLS
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="font-mono text-xs">
                    <Terminal className="w-3 h-3 mr-2" />
                    nmap
                  </Button>
                  <Button variant="outline" className="font-mono text-xs">
                    <Zap className="w-3 h-3 mr-2" />
                    masscan
                  </Button>
                  <Button variant="outline" className="font-mono text-xs">
                    <Shield className="w-3 h-3 mr-2" />
                    nikto
                  </Button>
                  <Button variant="outline" className="font-mono text-xs">
                    <Database className="w-3 h-3 mr-2" />
                    sqlmap
                  </Button>
                  <Button variant="outline" className="font-mono text-xs">
                    <Eye className="w-3 h-3 mr-2" />
                    shodan
                  </Button>
                  <Button variant="outline" className="font-mono text-xs">
                    <Network className="w-3 h-3 mr-2" />
                    wireshark
                  </Button>
              </div>
            </Card>

            <Card className="p-4 border border-primary/20 bg-card/60">
                <h3 className="text-primary font-mono text-sm mb-3">ACTIVE SCANS</h3>
                <div className="space-y-2 text-xs font-mono text-muted-foreground">
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span>Port scan: 192.168.1.0/24</span>
                    <span className="text-yellow-400">RUNNING</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span>Vuln scan: target.example.com</span>
                    <span className="text-green-400">COMPLETE</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span>Recon: 10.0.0.0/16</span>
                    <span className="text-blue-400">QUEUED</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeftDrawer;
