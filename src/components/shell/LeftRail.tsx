// LeftRail — Canon §8: Page Ontology and Local Systems
// "The left side is the home of the current page's ontology."
// Canon §8.3: "Mini Bar to Full Drawer Expansion"

import React from 'react';
import MatrixSidebarRain from '@/components/matrix/MatrixSidebarRain';
import {
  ListChecks,
  Bot,
  Layers,
  Gauge,
  ShieldCheck,
  FolderOpen,
  Search,
  GitBranch,
  Puzzle,
  Radio,
  Crosshair,
  Shield,
  Network,
  List,
  BookOpen,
  LayoutTemplate,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { WorldPage, LeftTab } from './types';
import { WORLD_LEFT_TABS } from './types';

interface LeftRailProps {
  activeWorld: WorldPage;
  activeTab: LeftTab;
  drawerOpen: boolean;
  onTabChange: (tab: LeftTab) => void;
}

// Map icon string keys to components
const ICON_MAP: Record<string, React.ElementType> = {
  'list-checks': ListChecks,
  'bot': Bot,
  'layers': Layers,
  'gauge': Gauge,
  'shield': ShieldCheck,
  'folder': FolderOpen,
  'search': Search,
  'git-branch': GitBranch,
  'puzzle': Puzzle,
  'radio': Radio,
  'crosshair': Crosshair,
  'shield-blue': Shield,
  'network': Network,
  'list': List,
  'book-open': BookOpen,
  'layout-template': LayoutTemplate,
};

const LeftRail: React.FC<LeftRailProps> = ({
  activeWorld,
  activeTab,
  drawerOpen,
  onTabChange,
}) => {
  const tabs = WORLD_LEFT_TABS[activeWorld];

  return (
    <div
      className="relative surface-rail flex flex-col items-center py-2 gap-1 overflow-hidden border-r border-border"
      style={{ width: 'var(--rail-width)' }}
    >
      {/* Matrix Rain Background */}
      <MatrixSidebarRain />

      {/* Tab Icons */}
      <div className="relative z-10 flex flex-col items-center gap-0.5 flex-1">
        {tabs.map(({ id, label, icon }) => {
          const Icon = ICON_MAP[icon] || ListChecks;
          const isActive = activeTab === id && drawerOpen;

          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabChange(id)}
                  className={`rail-icon ${isActive ? 'active' : ''}`}
                  aria-label={label}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-mono">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default LeftRail;
