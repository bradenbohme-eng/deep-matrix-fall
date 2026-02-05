// Central Panel - Code Editor, Preview, Diagram, Map, Orchestration

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react';
import { useIDEStore } from '@/components/ide/useIDEStore';
import { HackerMap } from '@/components/warfare/HackerMap';
import DiagramOrganizer from '@/components/matrix/DiagramOrganizer';
import OrchestrationDashboard from './OrchestrationDashboard';
import { 
  Code, 
  Eye, 
  Workflow, 
  Map, 
  X, 
  Maximize2,
  Split,
  Activity
} from 'lucide-react';
import type { CentralPanelMode } from './types';

interface CentralPanelProps {
  mode: CentralPanelMode;
  onModeChange: (mode: CentralPanelMode) => void;
}

const CentralPanel: React.FC<CentralPanelProps> = ({ mode, onModeChange }) => {
  const ideStore = useIDEStore();
  const [splitView, setSplitView] = useState(false);
  
  // Get active tab and its file content
  const activeTab = ideStore.openTabs.find(t => t.id === ideStore.activeTabId);
  
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeTab) {
      ideStore.updateTabContent(activeTab.id, value);
    }
  };

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'json',
      'md': 'markdown',
      'css': 'css',
      'html': 'html',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'yaml': 'yaml',
      'yml': 'yaml',
    };
    return langMap[ext || ''] || 'plaintext';
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Tab Bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30">
        <div className="flex items-center overflow-x-auto">
          {/* Mode Tabs */}
          <div className="flex items-center border-r border-border px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange('code')}
              className={`h-8 px-3 text-xs ${mode === 'code' ? 'bg-primary/20 text-primary' : ''}`}
            >
              <Code className="w-3 h-3 mr-1" />
              Code
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange('preview')}
              className={`h-8 px-3 text-xs ${mode === 'preview' ? 'bg-primary/20 text-primary' : ''}`}
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange('diagram')}
              className={`h-8 px-3 text-xs ${mode === 'diagram' ? 'bg-primary/20 text-primary' : ''}`}
            >
              <Workflow className="w-3 h-3 mr-1" />
              Diagram
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange('map')}
              className={`h-8 px-3 text-xs ${mode === 'map' ? 'bg-primary/20 text-primary' : ''}`}
            >
              <Map className="w-3 h-3 mr-1" />
              Map
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange('orchestration')}
              className={`h-8 px-3 text-xs ${mode === 'orchestration' ? 'bg-primary/20 text-primary' : ''}`}
            >
              <Activity className="w-3 h-3 mr-1" />
              Orchestration
            </Button>
          </div>
          
          {/* Open File Tabs */}
          {mode === 'code' && ideStore.openTabs.map((tab) => (
            <div 
              key={tab.id}
              className={`flex items-center px-3 py-1.5 border-r border-border cursor-pointer group ${
                ideStore.activeTabId === tab.id ? 'bg-background' : 'bg-muted/20 hover:bg-muted/40'
              }`}
              onClick={() => ideStore.setActiveTabId(tab.id)}
            >
              <span className="text-xs font-mono truncate max-w-32">
                {tab.name}
                {tab.modified && <span className="text-primary ml-1">●</span>}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  ideStore.closeTab(tab.id);
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center px-2 space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={() => setSplitView(!splitView)}
          >
            <Split className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'code' && (
          <div className="h-full flex">
            <div className={`${splitView ? 'w-1/2' : 'w-full'} h-full`}>
              {activeTab ? (
                <Editor
                  height="100%"
                  language={activeTab.language || getLanguage(activeTab.name)}
                  value={activeTab.content}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  options={{
                    fontSize: 13,
                    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                    minimap: { enabled: true, scale: 0.8 },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    renderWhitespace: 'selection',
                    bracketPairColorization: { enabled: true },
                    padding: { top: 8 },
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Code className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <div className="text-lg font-mono">No file selected</div>
                    <div className="text-sm mt-2">Select a file from the explorer to start editing</div>
                  </div>
                </div>
              )}
            </div>
            
            {splitView && (
              <div className="w-1/2 h-full border-l border-border bg-black">
                <div className="p-4 text-center text-muted-foreground">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Live Preview</div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'preview' && (
          <div className="h-full bg-black">
            <iframe 
              src="about:blank"
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>
        )}

        {mode === 'diagram' && (
          <div className="h-full">
            <DiagramOrganizer />
          </div>
        )}

        {mode === 'map' && (
          <div className="h-full">
            <HackerMap />
          </div>
        )}

        {mode === 'orchestration' && (
          <div className="h-full">
            <OrchestrationDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default CentralPanel;
