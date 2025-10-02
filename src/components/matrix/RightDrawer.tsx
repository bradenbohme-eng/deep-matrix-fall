import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, Database, Network, Cpu } from 'lucide-react';
import MatrixSettingsPanel from './MatrixSettingsPanel';
import AgentsPanel from './AgentsPanel';
import CloudOrchestratorPanel from './CloudOrchestratorPanel';

interface RightDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RightDrawer: React.FC<RightDrawerProps> = ({ open, onOpenChange }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-primary/20">
        <SheetHeader>
          <SheetTitle className="text-primary font-mono flex items-center gap-2">
            <Settings className="w-5 h-5 animate-spin-slow" />
            COMMAND & CONTROL CENTER
          </SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="settings" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="settings" className="font-mono text-xs">
              <Settings className="w-4 h-4 mr-2" />
              SETTINGS
            </TabsTrigger>
            <TabsTrigger value="agents" className="font-mono text-xs">
              <Shield className="w-4 h-4 mr-2" />
              AI AGENTS
            </TabsTrigger>
            <TabsTrigger value="orchestrator" className="font-mono text-xs">
              <Cpu className="w-4 h-4 mr-2" />
              ORCHESTRATOR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-4 h-[calc(100vh-200px)] overflow-y-auto">
            <MatrixSettingsPanel />
          </TabsContent>

          <TabsContent value="agents" className="mt-4 h-[calc(100vh-200px)] overflow-y-auto">
            <AgentsPanel />
          </TabsContent>

          <TabsContent value="orchestrator" className="mt-4 h-[calc(100vh-200px)] overflow-y-auto">
            <CloudOrchestratorPanel />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default RightDrawer;
