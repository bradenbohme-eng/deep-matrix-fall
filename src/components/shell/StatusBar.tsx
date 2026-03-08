// StatusBar — Persistent telemetry strip with live indicators

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { WorldPage } from './types';

interface StatusBarProps {
  activeWorld: WorldPage;
}

const StatusBar: React.FC<StatusBarProps> = ({ activeWorld }) => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer
      className="flex items-center justify-between px-3 bg-surface-1 border-t border-border select-none"
      style={{ height: 'var(--statusbar-height)' }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ boxShadow: '0 0 6px hsl(120 100% 44% / 0.5)' }}
          />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            HQ Online
          </span>
        </div>
        <span className="divider-v h-3" />
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-wider">
          {activeWorld}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Metric label="Budget" value="36%" />
        <Metric label="Agents" value="4" />
        <Metric label="Alerts" value="0" />
        <span className="divider-v h-3" />
        <span className="text-[10px] font-mono text-muted-foreground">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </footer>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <span className="text-[10px] font-mono text-muted-foreground">
    {label}: <span className="text-foreground">{value}</span>
  </span>
);

export default StatusBar;
