// StatusBar — Phase 4: Live telemetry from real DB + self-evolution awareness

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import type { WorldPage } from './types';

interface StatusBarProps {
  activeWorld: WorldPage;
}

interface SystemHealth {
  atomCount: number;
  chainCount: number;
  planCount: number;
  pendingProposals: number;
  avgCoherence: number;
  aiOnline: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ activeWorld }) => {
  const [time, setTime] = useState(new Date());
  const [health, setHealth] = useState<SystemHealth>({
    atomCount: 0, chainCount: 0, planCount: 0,
    pendingProposals: 0, avgCoherence: 0, aiOnline: true,
  });

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll real system health every 30s
  const fetchHealth = useCallback(async () => {
    try {
      const [atoms, chains, plans, proposals, reasoning] = await Promise.all([
        supabase.from('aimos_memory_atoms').select('*', { count: 'exact', head: true }),
        supabase.from('aimos_reasoning_chains').select('*', { count: 'exact', head: true }),
        supabase.from('aimos_plans').select('*', { count: 'exact', head: true }),
        supabase.from('evolution_proposals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('aimos_reasoning_chains').select('coherence_score').order('created_at', { ascending: false }).limit(20),
      ]);

      const scores = (reasoning.data || []).map((r: any) => r.coherence_score || 0);
      const avgCoherence = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

      setHealth({
        atomCount: atoms.count || 0,
        chainCount: chains.count || 0,
        planCount: plans.count || 0,
        pendingProposals: proposals.count || 0,
        avgCoherence,
        aiOnline: true,
      });
    } catch {
      setHealth(prev => ({ ...prev, aiOnline: false }));
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const kappa = health.avgCoherence > 0 ? `${(health.avgCoherence * 100).toFixed(1)}%` : '—';
  const kappaColor = health.avgCoherence >= 0.7 ? 'text-success' : health.avgCoherence >= 0.4 ? 'text-warning' : 'text-destructive';

  return (
    <footer
      className="flex items-center justify-between px-3 bg-surface-1 border-t border-border select-none"
      style={{ height: 'var(--statusbar-height)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <motion.span
            className={`w-1.5 h-1.5 rounded-full ${health.aiOnline ? 'bg-success' : 'bg-destructive'}`}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ boxShadow: health.aiOnline ? '0 0 6px hsl(142 76% 36% / 0.5)' : '0 0 6px hsl(0 84% 60% / 0.5)' }}
          />
          <span className="text-[10px] font-mono text-muted-foreground">
            {health.aiOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
        <span className="divider-v h-3" />
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-wider">
          {activeWorld}
        </span>
        <span className="divider-v h-3" />
        <Metric label="Atoms" value={String(health.atomCount)} />
        <Metric label="Chains" value={String(health.chainCount)} />
        <Metric label="Plans" value={String(health.planCount)} />
        {health.pendingProposals > 0 && (
          <>
            <span className="divider-v h-3" />
            <Metric label="Proposals" value={String(health.pendingProposals)} color="text-warning" />
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Metric label="κ" value={kappa} color={kappaColor} />
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
