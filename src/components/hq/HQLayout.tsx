// HQ Layout - Main Matrix Hacker IDE Operating System Layout

import React from 'react';
import { useHQStore } from './useHQStore';
import LeftActivityBar from './LeftActivityBar';
import RightActivityBar from './RightActivityBar';
import LeftDrawerContent from './LeftDrawerContent';
import RightDrawerContent from './RightDrawerContent';
import CentralPanel from './CentralPanel';
import BottomPanel from './BottomPanel';

const HQLayout: React.FC = () => {
  const store = useHQStore();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Activity Bar */}
        <LeftActivityBar
          activeTab={store.layout.leftDrawerTab}
          onTabChange={store.setLeftDrawerTab}
          isDrawerOpen={store.layout.leftDrawerOpen}
          onToggleDrawer={store.toggleLeftDrawer}
        />

        {/* Left Drawer Content */}
        {store.layout.leftDrawerOpen && (
          <LeftDrawerContent
            activeTab={store.layout.leftDrawerTab}
            width={store.layout.leftDrawerWidth}
          />
        )}

        {/* Central Panel - Editor/Preview/Diagram/Map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CentralPanel
            mode={store.layout.centralMode}
            onModeChange={store.setCentralMode}
          />

          {/* Bottom Panel */}
          <BottomPanel
            activeTab={store.layout.bottomPanelTab}
            onTabChange={store.setBottomPanelTab}
            height={store.layout.bottomPanelHeight}
            onHeightChange={store.setBottomPanelHeight}
            isOpen={store.layout.bottomPanelOpen}
            onClose={store.toggleBottomPanel}
          />
        </div>

        {/* Right Drawer Content */}
        {store.layout.rightDrawerOpen && (
          <RightDrawerContent
            activeTab={store.layout.rightDrawerTab}
            width={store.layout.rightDrawerWidth}
          />
        )}

        {/* Right Activity Bar */}
        <RightActivityBar
          activeTab={store.layout.rightDrawerTab}
          onTabChange={store.setRightDrawerTab}
          isDrawerOpen={store.layout.rightDrawerOpen}
          onToggleDrawer={store.toggleRightDrawer}
        />
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-muted/30 border-t border-border flex items-center justify-between px-2 text-xs font-mono text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>HQ ONLINE</span>
          </span>
          <span>{store.layout.centralMode.toUpperCase()}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{store.alerts.filter(a => !a.acknowledged).length} Alerts</span>
          <span>{store.operations.filter(o => o.status === 'running').length} Operations</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export default HQLayout;
