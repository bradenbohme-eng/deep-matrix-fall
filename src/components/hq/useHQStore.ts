// HQ State Management - Zustand-like store for the IDE

import { useState, useCallback } from 'react';
import type { 
  HQLayoutState, 
  LeftDrawerTab, 
  RightDrawerTab, 
  BottomPanelTab, 
  CentralPanelMode,
  SecurityOperation,
  Alert,
  NetworkNode
} from './types';

const DEFAULT_LAYOUT: HQLayoutState = {
  leftDrawerOpen: true,
  leftDrawerTab: 'explorer',
  rightDrawerOpen: true,
  rightDrawerTab: 'chat',
  bottomPanelOpen: true,
  bottomPanelTab: 'terminal',
  bottomPanelHeight: 200,
  centralMode: 'code',
  leftDrawerWidth: 280,
  rightDrawerWidth: 400,
};

export function useHQStore() {
  const [layout, setLayout] = useState<HQLayoutState>(DEFAULT_LAYOUT);
  const [operations, setOperations] = useState<SecurityOperation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  // Layout controls
  const toggleLeftDrawer = useCallback(() => {
    setLayout(prev => ({ ...prev, leftDrawerOpen: !prev.leftDrawerOpen }));
  }, []);

  const toggleRightDrawer = useCallback(() => {
    setLayout(prev => ({ ...prev, rightDrawerOpen: !prev.rightDrawerOpen }));
  }, []);

  const toggleBottomPanel = useCallback(() => {
    setLayout(prev => ({ ...prev, bottomPanelOpen: !prev.bottomPanelOpen }));
  }, []);

  const setLeftDrawerTab = useCallback((tab: LeftDrawerTab) => {
    setLayout(prev => ({ ...prev, leftDrawerTab: tab, leftDrawerOpen: true }));
  }, []);

  const setRightDrawerTab = useCallback((tab: RightDrawerTab) => {
    setLayout(prev => ({ ...prev, rightDrawerTab: tab, rightDrawerOpen: true }));
  }, []);

  const setBottomPanelTab = useCallback((tab: BottomPanelTab) => {
    setLayout(prev => ({ ...prev, bottomPanelTab: tab, bottomPanelOpen: true }));
  }, []);

  const setCentralMode = useCallback((mode: CentralPanelMode) => {
    setLayout(prev => ({ ...prev, centralMode: mode }));
  }, []);

  const setBottomPanelHeight = useCallback((height: number) => {
    setLayout(prev => ({ ...prev, bottomPanelHeight: Math.max(100, Math.min(500, height)) }));
  }, []);

  const setLeftDrawerWidth = useCallback((width: number) => {
    setLayout(prev => ({ ...prev, leftDrawerWidth: Math.max(200, Math.min(500, width)) }));
  }, []);

  const setRightDrawerWidth = useCallback((width: number) => {
    setLayout(prev => ({ ...prev, rightDrawerWidth: Math.max(300, Math.min(600, width)) }));
  }, []);

  // Security operations
  const addOperation = useCallback((op: Omit<SecurityOperation, 'id' | 'timestamp'>) => {
    const newOp: SecurityOperation = {
      ...op,
      id: `op-${Date.now()}`,
      timestamp: new Date(),
    };
    setOperations(prev => [newOp, ...prev].slice(0, 100));
    return newOp.id;
  }, []);

  const updateOperation = useCallback((id: string, updates: Partial<SecurityOperation>) => {
    setOperations(prev => prev.map(op => op.id === id ? { ...op, ...updates } : op));
  }, []);

  // Alert management
  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}`,
      timestamp: new Date(),
      acknowledged: false,
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 200));
    return newAlert.id;
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  // Network operations
  const addNetworkNode = useCallback((node: Omit<NetworkNode, 'id'>) => {
    const newNode: NetworkNode = {
      ...node,
      id: `node-${Date.now()}`,
    };
    setNetworkNodes(prev => [...prev, newNode]);
    return newNode.id;
  }, []);

  const updateNetworkNode = useCallback((id: string, updates: Partial<NetworkNode>) => {
    setNetworkNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  return {
    layout,
    operations,
    alerts,
    networkNodes,
    isScanning,
    
    // Layout actions
    toggleLeftDrawer,
    toggleRightDrawer,
    toggleBottomPanel,
    setLeftDrawerTab,
    setRightDrawerTab,
    setBottomPanelTab,
    setCentralMode,
    setBottomPanelHeight,
    setLeftDrawerWidth,
    setRightDrawerWidth,
    
    // Security actions
    addOperation,
    updateOperation,
    setIsScanning,
    
    // Alert actions
    addAlert,
    acknowledgeAlert,
    
    // Network actions
    addNetworkNode,
    updateNetworkNode,
    setNetworkNodes,
  };
}

export type HQStore = ReturnType<typeof useHQStore>;
