// SubPageBar — Canon §7: Local Modes and Internal Territories
// "Below the top bar lives a second bar for internal page territories."

import React from 'react';
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
      className="flex items-center px-3 bg-surface-1 border-b border-border select-none"
      style={{ height: 'var(--subpage-height)' }}
    >
      <div className="flex items-center gap-0.5">
        {subPages.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onSubPageChange(id)}
            className={`tab-button ${activeSubPage === id ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubPageBar;
