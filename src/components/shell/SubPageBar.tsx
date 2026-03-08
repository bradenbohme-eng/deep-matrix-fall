// SubPageBar — Canon §7: Local Modes and Internal Territories
// Phase 3: layoutId indicator + breadcrumb world label

import React from 'react';
import { motion } from 'framer-motion';
import type { WorldPage, SubPage } from './types';
import { WORLD_SUBPAGES } from './types';

interface SubPageBarProps {
  activeWorld: WorldPage;
  activeSubPage: SubPage;
  onSubPageChange: (subPage: SubPage) => void;
}

const SubPageBar: React.FC<SubPageBarProps> = ({
  activeWorld,
  activeSubPage,
  onSubPageChange,
}) => {
  const subPages = WORLD_SUBPAGES[activeWorld];

  return (
    <div
      className="flex items-center px-3 bg-surface-1 border-b border-border select-none gap-3"
      style={{ height: 'var(--subpage-height)' }}
    >
      {/* Breadcrumb */}
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em] shrink-0">
        {activeWorld}
      </span>
      <span className="text-[9px] text-muted-foreground/40">/</span>

      {/* Sub-page tabs */}
      <div className="flex items-center gap-0.5">
        {subPages.map(({ id, label }) => {
          const isActive = activeSubPage === id;
          return (
            <motion.button
              key={id}
              onClick={() => onSubPageChange(id)}
              className={`relative tab-button ${isActive ? 'active' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {isActive && (
                <motion.div
                  layoutId="subpage-pill"
                  className="absolute inset-0 rounded bg-primary/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SubPageBar;
