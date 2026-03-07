// TopBar — Canon §6: Global Identity and World Switching
// "The top bar defines the world-level structure of the application."

import React from 'react';
import {
  Activity,
  Code,
  Shield,
  FileText,
  Zap,
  Bell,
  User,
  Command,
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
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center shadow-glow">
            <Command className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-display text-sm font-semibold tracking-wider text-foreground glow-text">
            MATRIX
          </span>
        </div>
        <div className="divider-v h-5 mx-1" />
      </div>

      {/* Center: World Navigation (Canon §6.1) */}
      <nav className="flex items-center gap-0.5">
        {WORLDS.map(({ id, label, icon: Icon }) => {
          const isActive = activeWorld === id;
          return (
            <button
              key={id}
              onClick={() => onWorldChange(id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono
                transition-all duration-150 relative
                ${isActive
                  ? 'text-primary bg-primary/10 shadow-glow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-3'
                }
              `}
              title={label}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="font-medium">{label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-px bg-primary shadow-glow" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Global Actions */}
      <div className="flex items-center gap-1">
        <button className="rail-icon" title="Quick Command (⌘K)">
          <Zap className="w-3.5 h-3.5" />
        </button>
        <button className="rail-icon relative" title="Alerts">
          <Bell className="w-3.5 h-3.5" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive rounded-full 
                           text-[8px] font-bold text-destructive-foreground flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>
        <button className="rail-icon" title="Profile">
          <User className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
