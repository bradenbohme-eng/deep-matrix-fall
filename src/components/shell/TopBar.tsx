// TopBar — Canon §6: Global Identity and World Switching
// Phase 3: Enhanced with pulse indicators, command palette trigger, and richer motion

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Code, Shield, FileText, Dna,
  Zap, Bell, User, Command, Search,
} from 'lucide-react';
import type { WorldPage } from './types';

interface TopBarProps {
  activeWorld: WorldPage;
  onWorldChange: (world: WorldPage) => void;
  alertCount?: number;
}

const WORLDS: { id: WorldPage; label: string; icon: React.ElementType; accentHue: number }[] = [
  { id: 'orchestration', label: 'HQ', icon: Activity, accentHue: 120 },
  { id: 'code', label: 'Code', icon: Code, accentHue: 200 },
  { id: 'intel', label: 'Intel', icon: Shield, accentHue: 0 },
  { id: 'docs', label: 'Docs', icon: FileText, accentHue: 270 },
  { id: 'evolve', label: 'Evolve', icon: Dna, accentHue: 300 },
];

const TopBar: React.FC<TopBarProps> = ({ activeWorld, onWorldChange, alertCount = 0 }) => {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="surface-topbar flex items-center justify-between px-3 select-none"
      style={{ height: 'var(--topbar-height)' }}
    >
      {/* Left: Project Identity */}
      <div className="flex items-center gap-3">
        <motion.div
          className="flex items-center gap-2 cursor-pointer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div
            className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center border border-primary/20 relative overflow-hidden"
            style={{ boxShadow: '0 0 12px hsl(120 100% 44% / 0.2)' }}
          >
            <Command className="w-3.5 h-3.5 text-primary relative z-10" />
            <motion.div
              className="absolute inset-0 bg-primary/10"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-[11px] font-semibold tracking-[0.2em] text-foreground glow-text leading-none">
              MATRIX
            </span>
            <span className="text-[8px] font-mono text-muted-foreground leading-none mt-0.5 tracking-wider">
              HQ v5.0
            </span>
          </div>
        </motion.div>
        <div className="divider-v h-5 mx-1" />
      </div>

      {/* Center: World Navigation */}
      <nav className="flex items-center gap-1 bg-surface-1/50 rounded-lg px-1 py-0.5">
        {WORLDS.map(({ id, label, icon: Icon }) => {
          const isActive = activeWorld === id;
          return (
            <motion.button
              key={id}
              onClick={() => onWorldChange(id)}
              className={`
                relative flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-mono
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
                  className="absolute inset-0 rounded-md surface-active"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="font-medium relative z-10 tracking-wide">{label}</span>
              {isActive && (
                <motion.div
                  className="absolute -bottom-[5px] left-1/2 w-6 h-[2px] bg-primary rounded-full"
                  layoutId="world-underline"
                  style={{ x: '-50%', boxShadow: '0 0 8px hsl(120 100% 44% / 0.5)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Right: Global Actions */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-muted-foreground mr-2">{clock}</span>
        <div className="divider-v h-4" />

        {/* Quick Command */}
        <motion.button
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono text-muted-foreground
                     bg-surface-2 border border-border hover:border-primary/20 hover:text-foreground transition-all"
          title="Quick Command (⌘K)"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Search className="w-3 h-3" />
          <span className="hidden sm:inline">⌘K</span>
        </motion.button>

        <motion.button className="rail-icon" title="Alerts" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Bell className="w-3.5 h-3.5" />
          {alertCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive rounded-full 
                         text-[8px] font-bold text-destructive-foreground flex items-center justify-center"
            >
              {alertCount > 9 ? '9+' : alertCount}
            </motion.span>
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
