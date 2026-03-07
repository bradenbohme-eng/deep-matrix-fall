// AppShell — The Persistent Cognitive Shell
// Canon §5: "The shell is the master invention."
// Canon Sentence: "A persistent cognitive shell containing page-specific ontologies
// and living visual instruments, with intelligence on the right, becoming on the bottom,
// local systems on the left, world navigation above, and the work itself at the center."

import React from 'react';
import { useShellStore } from './useShellStore';
import TopBar from './TopBar';
import SubPageBar from './SubPageBar';
import LeftRail from './LeftRail';
import LeftDrawer from './LeftDrawer';
import CenterWorkspace from './CenterWorkspace';
import RightPanel from './RightPanel';
import BottomDock from './BottomDock';
import StatusBar from './StatusBar';

const AppShell: React.FC = () => {
  const store = useShellStore();
  const { layout } = store;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* ═══ Top: Global Identity + World Switching (Canon §6) ═══ */}
      <TopBar
        activeWorld={layout.activeWorld}
        onWorldChange={store.setActiveWorld}
        alertCount={0}
      />

      {/* ═══ Sub-Page: Local Modes (Canon §7) ═══ */}
      <SubPageBar
        activeWorld={layout.activeWorld}
        activeSubPage={layout.activeSubPage}
        onSubPageChange={store.setActiveSubPage}
      />

      {/* ═══ Main Content: Left + Center + Right ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Rail — Page Ontology Icons (Canon §8) */}
        <LeftRail
          activeWorld={layout.activeWorld}
          activeTab={layout.leftActiveTab}
          drawerOpen={layout.leftDrawerOpen}
          onTabChange={store.setLeftActiveTab}
        />

        {/* Left Drawer — Expanded Detail (Canon §12) */}
        <LeftDrawer
          activeWorld={layout.activeWorld}
          activeTab={layout.leftActiveTab}
          width={layout.leftDrawerWidth}
          isOpen={layout.leftDrawerOpen}
        />

        {/* Center — The Thing Itself (Canon §9) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CenterWorkspace
              activeWorld={layout.activeWorld}
              activeSubPage={layout.activeSubPage}
            />
          </div>

          {/* Bottom Dock — Time, Process, History (Canon §11) */}
          <BottomDock
            activeTab={layout.bottomDockTab}
            onTabChange={store.setBottomDockTab}
            height={layout.bottomDockHeight}
            onHeightChange={store.setBottomDockHeight}
            isOpen={layout.bottomDockOpen}
            onToggle={store.toggleBottomDock}
          />
        </div>

        {/* Right — Persistent Intelligence + Inspection (Canon §10) */}
        <RightPanel
          mode={layout.rightPanelMode}
          onModeChange={store.setRightPanelMode}
          isOpen={layout.rightPanelOpen}
          width={layout.rightPanelWidth}
        />
      </div>

      {/* ═══ Status Bar — System Telemetry ═══ */}
      <StatusBar activeWorld={layout.activeWorld} />
    </div>
  );
};

export default AppShell;
