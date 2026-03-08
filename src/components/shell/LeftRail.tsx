// LeftRail — Canon §8: Page Ontology and Local Systems
// Enhanced with framer-motion active indicator

import React from 'react';
import { motion } from 'framer-motion';
import MatrixSidebarRain from '@/components/matrix/MatrixSidebarRain';
import {
  ListChecks, Bot, Layers, Gauge, ShieldCheck,
  FolderOpen, Search, GitBranch, Puzzle,
  Radio, Crosshair, Shield, Network,
  List, BookOpen, LayoutTemplate,
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

const ICON_MAP: Record<string, React.ElementType> = {
  'list-checks': ListChecks, 'bot': Bot, 'layers': Layers,
  'gauge': Gauge, 'shield': ShieldCheck, 'folder': FolderOpen,
  'search': Search, 'git-branch': GitBranch, 'puzzle': Puzzle,
  'radio': Radio, 'crosshair': Crosshair, 'shield-blue': Shield,
  'network': Network, 'list': List, 'book-open': BookOpen,
  'layout-template': LayoutTemplate,
};

const LeftRail: React.FC<LeftRailProps> = ({ activeWorld, activeTab, drawerOpen, onTabChange }) => {
  const tabs = WORLD_LEFT_TABS[activeWorld];

  return (
    <div
      className="relative surface-rail flex flex-col items-center py-2 gap-1 overflow-hidden border-r border-border"
      style={{ width: 'var(--rail-width)' }}
    >
      <MatrixSidebarRain />

      <div className="relative z-10 flex flex-col items-center gap-0.5 flex-1">
        {tabs.map(({ id, label, icon }) => {
          const Icon = ICON_MAP[icon] || ListChecks;
          const isActive = activeTab === id && drawerOpen;

          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => onTabChange(id)}
                  className={`rail-icon ${isActive ? 'active' : ''}`}
                  aria-label={label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </motion.button>
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
