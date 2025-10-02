import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Terminal, Radio, Satellite, Database, Shield, 
  Activity, Search, Network, Zap, Eye 
} from 'lucide-react';
import LiveFeeds from './LiveFeeds';
import IntelGraph from './IntelGraph';

interface LeftDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeftDrawer: React.FC<LeftDrawerProps> = ({ open, onOpenChange }) => {
  const [feedItems, setFeedItems] = useState([]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[600px] sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-primary/20">
        <SheetHeader>
          <SheetTitle className="text-primary font-mono flex items-center gap-2">
            <Radio className="w-5 h-5 animate-pulse" />
            INTELLIGENCE OPERATIONS CENTER
          </SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="feeds" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
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

          <TabsContent value="feeds" className="mt-4 h-[calc(100vh-200px)]">
            <LiveFeeds onData={setFeedItems} />
          </TabsContent>

          <TabsContent value="graph" className="mt-4 h-[calc(100vh-200px)]">
            <IntelGraph items={feedItems} />
          </TabsContent>

          <TabsContent value="scanner" className="mt-4 h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-4">
              <div className="p-4 border border-primary/20 rounded bg-card/60">
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
              </div>

              <div className="p-4 border border-primary/20 rounded bg-card/60">
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
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default LeftDrawer;
