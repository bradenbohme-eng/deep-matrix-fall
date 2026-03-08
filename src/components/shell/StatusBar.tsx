// StatusBar — Phase 3: Live telemetry with animated indicators

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { WorldPage } from './types';

interface StatusBarProps {
  activeWorld: WorldPage;
}

const StatusBar: React.FC<StatusBarProps> = ({ activeWorld }) => {
  const [time, setTime] = useState(new Date());
  const [memUsage, setMemUsage] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      setMemUsage(prev => Math.max(30, Math.min(80, prev + (Math.random() - 0.5) * 3)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer
      className="flex items-center justify-between px-3 bg-surface-1 border-t border-border select-none"
      style={{ height: 'var(--statusbar-height)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-success"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ boxShadow: '0 0 6px hsl(142 76% 36% / 0.5)' }}
          />
          <span className="text-[10px] font-mono text-muted-foreground">
            ONLINE
          </span>
        </div>
        <span className="divider-v h-3" />
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-wider">
          {activeWorld}
        </span>
        <span className="divider-v h-3" />
        <Metric label="Agents" value="4" color="text-foreground" />
        <Metric label="Budget" value="36%" color="text-foreground" />
        <Metric label="Mem" value={`${Math.round(memUsage)}%`} color={memUsage > 70 ? 'text-warning' : 'text-foreground'} />
      </div>

      <div className="flex items-center gap-3">
        <Metric label="κ" value="92.3%" color="text-success" />
        <span className="divider-v h-3" />
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </footer>
  );
};

const Metric: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = 'text-foreground' }) => (
  <span className="text-[10px] font-mono text-muted-foreground">
    {label}: <span className={color}>{value}</span>
  </span>
);

export default StatusBar;
