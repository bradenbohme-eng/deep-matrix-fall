// AppShell — The Persistent Cognitive Shell
// Canon §5: "The shell is the master invention."

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useShellStore } from './useShellStore';
import TopBar from './TopBar';
import SubPageBar from './SubPageBar';
import LeftRail from './LeftRail';
import LeftDrawer from './LeftDrawer';
import CenterWorkspace from './CenterWorkspace';
import RightPanel from './RightPanel';
import BottomDock from './BottomDock';
import StatusBar from './StatusBar';
import { ScanLines, GlowPulse } from './effects';

const DRAWER_TRANSITION = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
};

const AppShell: React.FC = () => {
  const store = useShellStore();
  const { layout } = store;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Tier 2: Atmospheric effects */}
      <ScanLines opacity={0.025} noiseOpacity={0.012} />
      <GlowPulse />

      {/* ═══ Top: Global Identity + World Switching ═══ */}
      <TopBar
        activeWorld={layout.activeWorld}
        onWorldChange={store.setActiveWorld}
        alertCount={0}
      />

      {/* ═══ Sub-Page: Local Modes ═══ */}
      <SubPageBar
        activeWorld={layout.activeWorld}
        activeSubPage={layout.activeSubPage}
        onSubPageChange={store.setActiveSubPage}
      />

      {/* ═══ Main Content: Left + Center + Right ═══ */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Rail */}
        <LeftRail
          activeWorld={layout.activeWorld}
          activeTab={layout.leftActiveTab}
          drawerOpen={layout.leftDrawerOpen}
          onTabChange={store.setLeftActiveTab}
        />

        {/* Left Drawer — animated */}
        <AnimatePresence mode="wait">
          {layout.leftDrawerOpen && (
            <motion.div
              key="left-drawer"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: layout.leftDrawerWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={DRAWER_TRANSITION}
              className="overflow-hidden flex-shrink-0"
            >
              <LeftDrawer
                activeWorld={layout.activeWorld}
                activeTab={layout.leftActiveTab}
                width={layout.leftDrawerWidth}
                isOpen={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center — The Thing Itself */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <motion.div
            className="flex-1 overflow-hidden"
            layout
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <CenterWorkspace
              activeWorld={layout.activeWorld}
              activeSubPage={layout.activeSubPage}
            />
          </motion.div>

          {/* Bottom Dock — animated */}
          <BottomDock
            activeTab={layout.bottomDockTab}
            onTabChange={store.setBottomDockTab}
            height={layout.bottomDockHeight}
            onHeightChange={store.setBottomDockHeight}
            isOpen={layout.bottomDockOpen}
            onToggle={store.toggleBottomDock}
          />
        </div>

        {/* Right — animated */}
        <AnimatePresence mode="wait">
          {layout.rightPanelOpen && (
            <motion.div
              key="right-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: layout.rightPanelWidth + 48, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={DRAWER_TRANSITION}
              className="overflow-hidden flex-shrink-0"
            >
              <RightPanel
                mode={layout.rightPanelMode}
                onModeChange={store.setRightPanelMode}
                isOpen={true}
                width={layout.rightPanelWidth}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ Status Bar ═══ */}
      <StatusBar activeWorld={layout.activeWorld} />
    </div>
  );
};

export default AppShell;
