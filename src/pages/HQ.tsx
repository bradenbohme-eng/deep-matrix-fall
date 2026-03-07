// HQ Page — Canon-grade Persistent Cognitive Shell

import React from 'react';
import { AppShell } from '@/components/shell';
import { MatrixSettingsProvider } from '@/contexts/MatrixSettingsContext';

const HQ: React.FC = () => {
  return (
    <MatrixSettingsProvider>
      <AppShell />
    </MatrixSettingsProvider>
  );
};

export default HQ;
