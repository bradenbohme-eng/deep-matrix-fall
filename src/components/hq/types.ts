// HQ System Types - Matrix Hacker IDE Operating System

export type LeftDrawerTab = 
  | 'explorer'    // File explorer
  | 'search'      // Code search
  | 'git'         // Git operations
  | 'intel'       // Intelligence feeds
  | 'red-team'    // Red team operations
  | 'blue-team'   // Blue team defense
  | 'network'     // Network mapping
  | 'agents';     // AI Agents

export type RightDrawerTab =
  | 'chat'        // AI Chat
  | 'memory'      // AIMOS Memory
  | 'docs'        // Documentation
  | 'surveillance' // Surveillance feeds
  | 'evolve'      // Self-evolution
  | 'settings';   // Matrix settings

export type CentralPanelMode =
  | 'code'        // Monaco code editor
  | 'preview'     // Live preview
  | 'diagram'     // Diagram/flowchart
  | 'map';        // Intel map

export type BottomPanelTab =
  | 'terminal'    // Terminal
  | 'problems'    // Problems/errors
  | 'output'      // Output logs
  | 'diagnostics' // System diagnostics
  | 'debug';      // Debug console

export interface HQLayoutState {
  leftDrawerOpen: boolean;
  leftDrawerTab: LeftDrawerTab;
  rightDrawerOpen: boolean;
  rightDrawerTab: RightDrawerTab;
  bottomPanelOpen: boolean;
  bottomPanelTab: BottomPanelTab;
  bottomPanelHeight: number;
  centralMode: CentralPanelMode;
  leftDrawerWidth: number;
  rightDrawerWidth: number;
}

export interface SecurityOperation {
  id: string;
  type: 'red' | 'blue' | 'purple';
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: Date;
  details: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  motivation: string;
  capabilities: string[];
  ttps: string[];
  lastSeen: Date;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface NetworkNode {
  id: string;
  ip: string;
  hostname?: string;
  type: 'server' | 'workstation' | 'router' | 'firewall' | 'unknown';
  status: 'online' | 'offline' | 'compromised' | 'scanning';
  ports: number[];
  services: string[];
  vulnerabilities: string[];
  position: { x: number; y: number };
}

export interface AttackChain {
  id: string;
  name: string;
  phases: AttackPhase[];
  status: 'planning' | 'active' | 'completed' | 'aborted';
  target: string;
  startTime?: Date;
  endTime?: Date;
}

export interface AttackPhase {
  id: string;
  name: string;
  technique: string;
  mitreId?: string;
  status: 'pending' | 'executing' | 'success' | 'failed';
  output?: string;
}

export interface Indicator {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'email' | 'url' | 'file';
  value: string;
  confidence: number;
  source: string;
  tags: string[];
  firstSeen: Date;
  lastSeen: Date;
}

export interface Alert {
  id: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  assignee?: string;
  relatedIndicators: string[];
}
