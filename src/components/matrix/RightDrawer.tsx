import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, Cpu, X, Code2, FileText, Map } from 'lucide-react';
import MatrixSettingsPanel from './MatrixSettingsPanel';
import AgentsPanel from './AgentsPanel';
import CloudOrchestratorPanel from './CloudOrchestratorPanel';
import EnhancedIDEPanel from './EnhancedIDEPanel';
import { DocumentManager } from '@/components/document/DocumentManager';
import { HackerMap } from '../warfare/HackerMap';

interface RightDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RightDrawer: React.FC<RightDrawerProps> = ({ open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-[900px] bg-background/95 backdrop-blur-xl border-l border-primary/20 animate-slide-in-right flex flex-col z-50">
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-primary/20">
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
      
      <Tabs defaultValue="documents" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="flex-shrink-0 grid w-full grid-cols-6 bg-muted/50 mx-4 mt-2">
          <TabsTrigger value="documents" className="font-mono text-xs">
            <FileText className="w-4 h-4 mr-2" />
            AI-MOS DOCS
          </TabsTrigger>
          <TabsTrigger value="map" className="font-mono text-xs">
            <Map className="w-4 h-4 mr-2" />
            GLOBAL MAP
          </TabsTrigger>
          <TabsTrigger value="ide" className="font-mono text-xs">
            <Code2 className="w-4 h-4 mr-2" />
            IDE
          </TabsTrigger>
          <TabsTrigger value="agents" className="font-mono text-xs">
            <Shield className="w-4 h-4 mr-2" />
            AGENTS
          </TabsTrigger>
          <TabsTrigger value="orchestrator" className="font-mono text-xs">
            <Cpu className="w-4 h-4 mr-2" />
            CLOUD
          </TabsTrigger>
          <TabsTrigger value="settings" className="font-mono text-xs">
            <Settings className="w-4 h-4 mr-2" />
            SETTINGS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="flex-1 overflow-y-auto mt-2">
          <DocumentManager />
        </TabsContent>

        <TabsContent value="map" className="flex-1 overflow-hidden mt-2">
          <div className="h-full w-full">
            <HackerMap />
          </div>
        </TabsContent>

        <TabsContent value="ide" className="flex-1 overflow-hidden mt-2">
          <EnhancedIDEPanel />
        </TabsContent>

        <TabsContent value="agents" className="flex-1 overflow-y-auto mt-2">
          <AgentsPanel />
        </TabsContent>

        <TabsContent value="orchestrator" className="flex-1 overflow-y-auto mt-2">
          <CloudOrchestratorPanel />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-y-auto mt-2">
          <MatrixSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RightDrawer;
