import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Terminal, Radio, Satellite, Database, Shield, 
  Activity, Search, Network, Zap, Eye, X 
} from 'lucide-react';
import LiveFeeds from './LiveFeeds';
import AdvancedIntelGraph from './AdvancedIntelGraph';
import AdvancedScanOps from './AdvancedScanOps';

interface LeftDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeftDrawer: React.FC<LeftDrawerProps> = ({ open, onOpenChange }) => {
  const [feedItems, setFeedItems] = useState<any[]>([]);

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
          <AdvancedIntelGraph items={feedItems} />
        </TabsContent>

        <TabsContent value="scanner" className="flex-1 overflow-y-auto mt-2">
          <AdvancedScanOps />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeftDrawer;
