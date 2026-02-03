// Left Activity Bar - Matrix Rain Icons for Left Drawer Navigation

import React from 'react';
import { Button } from '@/components/ui/button';
import MatrixSidebarRain from '@/components/matrix/MatrixSidebarRain';
import { 
  Files, 
  Search, 
  GitBranch, 
  Radio, 
  Crosshair, 
  Shield, 
  Network, 
  Bot,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { LeftDrawerTab } from './types';

interface LeftActivityBarProps {
  activeTab: LeftDrawerTab;
  onTabChange: (tab: LeftDrawerTab) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
}

const tabs: { id: LeftDrawerTab; icon: React.ElementType; label: string; color?: string }[] = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'git', icon: GitBranch, label: 'Git' },
  { id: 'intel', icon: Radio, label: 'Intel Feeds' },
  { id: 'red-team', icon: Crosshair, label: 'Red Team', color: 'text-red-500' },
  { id: 'blue-team', icon: Shield, label: 'Blue Team', color: 'text-blue-500' },
  { id: 'network', icon: Network, label: 'Network Map' },
  { id: 'agents', icon: Bot, label: 'AI Agents' },
];

const LeftActivityBar: React.FC<LeftActivityBarProps> = ({
  activeTab,
  onTabChange,
  isDrawerOpen,
  onToggleDrawer,
}) => {
  return (
    <div className="relative w-14 bg-black/95 border-r border-primary/20 flex flex-col items-center py-2 overflow-hidden">
      {/* Matrix Rain Background */}
      <MatrixSidebarRain />
      
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
                  ? 'bg-primary/20 text-primary border-l-2 border-primary' 
                  : `${tab.color || 'text-muted-foreground'} hover:text-primary hover:bg-primary/10`
              }`}
              title={tab.label}
            >
              <IconComponent className="w-5 h-5" />
              
              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border">
                {tab.label}
              </span>
            </Button>
          );
        })}
      </div>
      
      {/* Toggle Button at Bottom */}
      <div className="relative z-10 mt-auto">
        <Button
          onClick={onToggleDrawer}
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
          title={isDrawerOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isDrawerOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default LeftActivityBar;
