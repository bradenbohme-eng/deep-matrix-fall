// Right Activity Bar - Matrix Rain Icons for Right Drawer Navigation

import React from 'react';
import { Button } from '@/components/ui/button';
import MatrixSidebarRain from '@/components/matrix/MatrixSidebarRain';
import { 
  MessageCircle, 
  Brain, 
  FileText, 
  Eye, 
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { RightDrawerTab } from './types';

interface RightActivityBarProps {
  activeTab: RightDrawerTab;
  onTabChange: (tab: RightDrawerTab) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
}

const tabs: { id: RightDrawerTab; icon: React.ElementType; label: string }[] = [
  { id: 'chat', icon: MessageCircle, label: 'AI Chat' },
  { id: 'memory', icon: Brain, label: 'AIMOS Memory' },
  { id: 'docs', icon: FileText, label: 'Documentation' },
  { id: 'surveillance', icon: Eye, label: 'Surveillance' },
  { id: 'evolve', icon: Sparkles, label: 'Self-Evolution' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const RightActivityBar: React.FC<RightActivityBarProps> = ({
  activeTab,
  onTabChange,
  isDrawerOpen,
  onToggleDrawer,
}) => {
  return (
    <div className="relative w-14 bg-black/95 border-l border-primary/20 flex flex-col items-center py-2 overflow-hidden">
      {/* Matrix Rain Background */}
      <MatrixSidebarRain />
      
      {/* Toggle Button at Top */}
      <div className="relative z-10 mb-2">
        <Button
          onClick={onToggleDrawer}
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
          title={isDrawerOpen ? 'Collapse Panel' : 'Expand Panel'}
        >
          {isDrawerOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      {/* Tab Buttons */}
      <div className="relative z-10 flex flex-col items-center space-y-1 flex-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id && isDrawerOpen;
          
          return (
            <Button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              variant="ghost"
              size="sm"
              className={`w-10 h-10 p-0 relative group ${
                isActive
                  ? 'bg-primary/20 text-primary border-r-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
              title={tab.label}
            >
              <IconComponent className="w-5 h-5" />
              
              {/* Tooltip - appears on left side for right bar */}
              <span className="absolute right-full mr-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border">
                {tab.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default RightActivityBar;
