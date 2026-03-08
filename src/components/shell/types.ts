// Shell Type System — Canon-grade persistent cognitive shell

// ─── World Pages (Canon §6 - Top Bar Territories) ───
export type WorldPage = 'orchestration' | 'code' | 'intel' | 'docs' | 'evolve';

// ─── Sub-Pages per World (Canon §7) ───
export type OrchestrationSubPage = 'command' | 'pipeline' | 'events' | 'tests';
export type CodeSubPage = 'editor' | 'preview' | 'diff';
export type IntelSubPage = 'feeds' | 'network' | 'threats';
export type DocsSubPage = 'edit' | 'outline' | 'versions';

export type SubPage = OrchestrationSubPage | CodeSubPage | IntelSubPage | DocsSubPage;

// ─── Left Rail (Canon §8 - Page Ontology) ───
export type OrchestrationLeftTab = 'tasks' | 'agents' | 'context' | 'budgets' | 'policies';
export type CodeLeftTab = 'explorer' | 'search' | 'git' | 'extensions';
export type IntelLeftTab = 'sources' | 'red-team' | 'blue-team' | 'network';
export type DocsLeftTab = 'outline' | 'sources' | 'templates';

export type LeftTab = OrchestrationLeftTab | CodeLeftTab | IntelLeftTab | DocsLeftTab;

// ─── Right Panel Modes (Canon §10 - Toggled Domain Separation) ───
export type RightPanelMode = 'ai' | 'swarm' | 'inspect' | 'analyze' | 'memory';

// ─── Bottom Dock Tabs (Canon §11 - Time, Process, History) ───
export type BottomDockTab = 'timeline' | 'terminal' | 'history' | 'jobs' | 'tests';

// ─── Shell Layout State ───
export interface ShellLayoutState {
  // World navigation
  activeWorld: WorldPage;
  activeSubPage: SubPage;
  
  // Left side
  leftRailOpen: boolean;
  leftDrawerOpen: boolean;
  leftActiveTab: LeftTab;
  leftDrawerWidth: number;
  
  // Right side
  rightPanelOpen: boolean;
  rightPanelMode: RightPanelMode;
  rightPanelWidth: number;
  
  // Bottom dock
  bottomDockOpen: boolean;
  bottomDockTab: BottomDockTab;
  bottomDockHeight: number;
}

// ─── Sub-page definitions per world ───
export const WORLD_SUBPAGES: Record<WorldPage, { id: SubPage; label: string }[]> = {
  orchestration: [
    { id: 'command', label: 'Command' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'events', label: 'Events' },
    { id: 'tests', label: 'Tests' },
  ],
  code: [
    { id: 'editor', label: 'Editor' },
    { id: 'preview', label: 'Preview' },
    { id: 'diff', label: 'Diff' },
  ],
  intel: [
    { id: 'feeds', label: 'Feeds' },
    { id: 'network', label: 'Network' },
    { id: 'threats', label: 'Threats' },
  ],
  docs: [
    { id: 'edit', label: 'Edit' },
    { id: 'outline', label: 'Outline' },
    { id: 'versions', label: 'Versions' },
  ],
};

// ─── Default sub-pages when switching worlds ───
export const WORLD_DEFAULT_SUBPAGE: Record<WorldPage, SubPage> = {
  orchestration: 'command',
  code: 'editor',
  intel: 'feeds',
  docs: 'edit',
};

// ─── Left rail tabs per world ───
export const WORLD_LEFT_TABS: Record<WorldPage, { id: LeftTab; label: string; icon: string }[]> = {
  orchestration: [
    { id: 'tasks', label: 'Tasks', icon: 'list-checks' },
    { id: 'agents', label: 'Agents', icon: 'bot' },
    { id: 'context', label: 'Context', icon: 'layers' },
    { id: 'budgets', label: 'Budgets', icon: 'gauge' },
    { id: 'policies', label: 'Policies', icon: 'shield' },
  ],
  code: [
    { id: 'explorer', label: 'Explorer', icon: 'folder' },
    { id: 'search', label: 'Search', icon: 'search' },
    { id: 'git', label: 'Git', icon: 'git-branch' },
    { id: 'extensions', label: 'Extensions', icon: 'puzzle' },
  ],
  intel: [
    { id: 'sources', label: 'Sources', icon: 'radio' },
    { id: 'red-team', label: 'Red Team', icon: 'crosshair' },
    { id: 'blue-team', label: 'Blue Team', icon: 'shield' },
    { id: 'network', label: 'Network', icon: 'network' },
  ],
  docs: [
    { id: 'outline', label: 'Outline', icon: 'list' },
    { id: 'sources', label: 'Sources', icon: 'book-open' },
    { id: 'templates', label: 'Templates', icon: 'layout-template' },
  ],
};
