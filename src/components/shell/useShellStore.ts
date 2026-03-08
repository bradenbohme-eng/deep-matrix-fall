// Shell State Management — Canon-grade persistent cognitive shell
// Canon §31.1: State must reflect Shell/Page/Instrument hierarchy

import { useState, useCallback, useMemo } from 'react';
import type {
  ShellLayoutState,
  WorldPage,
  SubPage,
  LeftTab,
  RightPanelMode,
  BottomDockTab,
} from './types';
import { WORLD_DEFAULT_SUBPAGE } from './types';

const DEFAULT_LAYOUT: ShellLayoutState = {
  activeWorld: 'orchestration',
  activeSubPage: 'command',
  
  leftRailOpen: true,
  leftDrawerOpen: true,
  leftActiveTab: 'tasks',
  leftDrawerWidth: 280,
  
  rightPanelOpen: true,
  rightPanelMode: 'ai',
  rightPanelWidth: 360,
  
  bottomDockOpen: true,
  bottomDockTab: 'timeline',
  bottomDockHeight: 220,
};

export function useShellStore() {
  const [layout, setLayout] = useState<ShellLayoutState>(DEFAULT_LAYOUT);

  // ─── World Navigation (Canon §6) ───
  const setActiveWorld = useCallback((world: WorldPage) => {
    setLayout(prev => ({
      ...prev,
      activeWorld: world,
      activeSubPage: WORLD_DEFAULT_SUBPAGE[world],
      // Reset left tab to first tab of new world
      leftActiveTab: world === 'orchestration' ? 'tasks' :
                     world === 'code' ? 'explorer' :
                     world === 'intel' ? 'sources' :
                     world === 'evolve' ? 'status' : 'outline',
    }));
  }, []);

  // ─── Sub-Page (Canon §7) ───
  const setActiveSubPage = useCallback((subPage: SubPage) => {
    setLayout(prev => ({ ...prev, activeSubPage: subPage }));
  }, []);

  // ─── Left Rail (Canon §8) ───
  const setLeftActiveTab = useCallback((tab: LeftTab) => {
    setLayout(prev => ({
      ...prev,
      leftActiveTab: tab,
      leftDrawerOpen: prev.leftActiveTab === tab ? !prev.leftDrawerOpen : true,
    }));
  }, []);

  const toggleLeftDrawer = useCallback(() => {
    setLayout(prev => ({ ...prev, leftDrawerOpen: !prev.leftDrawerOpen }));
  }, []);

  // ─── Right Panel (Canon §10) ───
  const setRightPanelMode = useCallback((mode: RightPanelMode) => {
    setLayout(prev => ({
      ...prev,
      rightPanelMode: mode,
      rightPanelOpen: prev.rightPanelMode === mode ? !prev.rightPanelOpen : true,
    }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setLayout(prev => ({ ...prev, rightPanelOpen: !prev.rightPanelOpen }));
  }, []);

  // ─── Bottom Dock (Canon §11) ───
  const setBottomDockTab = useCallback((tab: BottomDockTab) => {
    setLayout(prev => ({
      ...prev,
      bottomDockTab: tab,
      bottomDockOpen: prev.bottomDockTab === tab ? !prev.bottomDockOpen : true,
    }));
  }, []);

  const toggleBottomDock = useCallback(() => {
    setLayout(prev => ({ ...prev, bottomDockOpen: !prev.bottomDockOpen }));
  }, []);

  const setBottomDockHeight = useCallback((height: number) => {
    setLayout(prev => ({
      ...prev,
      bottomDockHeight: Math.max(120, Math.min(500, height)),
    }));
  }, []);

  const setLeftDrawerWidth = useCallback((width: number) => {
    setLayout(prev => ({
      ...prev,
      leftDrawerWidth: Math.max(200, Math.min(500, width)),
    }));
  }, []);

  const setRightPanelWidth = useCallback((width: number) => {
    setLayout(prev => ({
      ...prev,
      rightPanelWidth: Math.max(280, Math.min(600, width)),
    }));
  }, []);

  return useMemo(() => ({
    layout,
    setActiveWorld,
    setActiveSubPage,
    setLeftActiveTab,
    toggleLeftDrawer,
    setRightPanelMode,
    toggleRightPanel,
    setBottomDockTab,
    toggleBottomDock,
    setBottomDockHeight,
    setLeftDrawerWidth,
    setRightPanelWidth,
  }), [layout, setActiveWorld, setActiveSubPage, setLeftActiveTab, toggleLeftDrawer,
       setRightPanelMode, toggleRightPanel, setBottomDockTab, toggleBottomDock,
       setBottomDockHeight, setLeftDrawerWidth, setRightPanelWidth]);
}

export type ShellStore = ReturnType<typeof useShellStore>;
