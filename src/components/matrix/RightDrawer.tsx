import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, Cpu, X } from 'lucide-react';
import MatrixSettingsPanel from './MatrixSettingsPanel';
import AgentsPanel from './AgentsPanel';
import CloudOrchestratorPanel from './CloudOrchestratorPanel';

interface RightDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RightDrawer: React.FC<RightDrawerProps> = ({ open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="h-full w-[500px] bg-background/95 backdrop-blur-xl border-l border-primary/20 animate-slide-in-right overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-primary/20">
        <div className="text-primary font-mono flex items-center gap-2 text-sm font-bold">
          <Settings className="w-5 h-5 animate-spin-slow" />
          COMMAND & CONTROL CENTER
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
      
      <Tabs defaultValue="settings" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 mx-4 mt-2">
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

        <TabsContent value="settings" className="flex-1 overflow-y-auto mt-2">
          <MatrixSettingsPanel />
        </TabsContent>

        <TabsContent value="agents" className="flex-1 overflow-y-auto mt-2">
          <AgentsPanel />
        </TabsContent>

        <TabsContent value="orchestrator" className="flex-1 overflow-y-auto mt-2">
          <CloudOrchestratorPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RightDrawer;
