// HQ Page - The new Cursor-like IDE interface

import React from 'react';
import { HQLayout } from '@/components/hq';
import { MatrixSettingsProvider } from '@/contexts/MatrixSettingsContext';

const HQ: React.FC = () => {
  return (
    <MatrixSettingsProvider>
      <HQLayout />
    </MatrixSettingsProvider>
  );
};

export default HQ;
