// StatusBar — Persistent telemetry strip
// Canon §5: Part of the shell's metabolism

import React from 'react';
import type { WorldPage } from './types';

interface StatusBarProps {
  activeWorld: WorldPage;
}

const StatusBar: React.FC<StatusBarProps> = ({ activeWorld }) => {
  return (
    <footer
      className="flex items-center justify-between px-3 bg-surface-1 border-t border-border select-none"
      style={{ height: 'var(--statusbar-height)' }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-subtle shadow-glow" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            HQ Online
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {activeWorld.toUpperCase()}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono text-muted-foreground">
          Budget: 36%
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          4 Agents
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          0 Alerts
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          UTF-8
        </span>
      </div>
    </footer>
  );
};

export default StatusBar;
