// TopBar — Canon §6: Global Identity and World Switching
// Enhanced with framer-motion transitions

import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Code, Shield, FileText,
  Zap, Bell, User, Command,
} from 'lucide-react';
import type { WorldPage } from './types';

interface TopBarProps {
  activeWorld: WorldPage;
  onWorldChange: (world: WorldPage) => void;
  alertCount?: number;
}

const WORLDS: { id: WorldPage; label: string; icon: React.ElementType }[] = [
  { id: 'orchestration', label: 'HQ', icon: Activity },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'intel', label: 'Intel', icon: Shield },
  { id: 'docs', label: 'Docs', icon: FileText },
];

const TopBar: React.FC<TopBarProps> = ({ activeWorld, onWorldChange, alertCount = 0 }) => {
  return (
    <header className="surface-topbar flex items-center justify-between px-3 select-none"
            style={{ height: 'var(--topbar-height)' }}>
      {/* Left: Project Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center border border-primary/20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{ boxShadow: '0 0 12px hsl(120 100% 44% / 0.2)' }}
          >
            <Command className="w-3.5 h-3.5 text-primary" />
          </motion.div>
          <span className="font-display text-sm font-semibold tracking-[0.15em] text-foreground glow-text">
            MATRIX
          </span>
        </div>
        <div className="divider-v h-5 mx-1" />
      </div>

      {/* Center: World Navigation */}
      <nav className="flex items-center gap-0.5">
        {WORLDS.map(({ id, label, icon: Icon }) => {
          const isActive = activeWorld === id;
          return (
            <motion.button
              key={id}
              onClick={() => onWorldChange(id)}
              className={`
                relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-mono
                transition-colors
                ${isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-3'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {isActive && (
                <motion.div
                  layoutId="world-indicator"
                  className="absolute inset-0 rounded-md bg-primary/10 border border-primary/15"
                  style={{ boxShadow: '0 0 16px hsl(120 100% 44% / 0.1)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="font-medium relative z-10">{label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Right: Global Actions */}
      <div className="flex items-center gap-1">
        <motion.button className="rail-icon" title="Quick Command (⌘K)" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Zap className="w-3.5 h-3.5" />
        </motion.button>
        <motion.button className="rail-icon relative" title="Alerts" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Bell className="w-3.5 h-3.5" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive rounded-full 
                           text-[8px] font-bold text-destructive-foreground flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </motion.button>
        <motion.button className="rail-icon" title="Profile" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <User className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </header>
  );
};

export default TopBar;
