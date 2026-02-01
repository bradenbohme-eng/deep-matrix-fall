import React, { useState, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  Code2, Terminal as TerminalIcon, GitBranch, Bot, Eye, Save,
  Play, Settings, FolderTree, X, Maximize2, Minimize2, Sparkles, Brain
} from 'lucide-react';
import { EnhancedFileExplorer } from './EnhancedFileExplorer';
import { GitPanel } from './GitPanel';
import { TerminalPanel } from './TerminalPanel';
import { PreviewPanel } from './PreviewPanel';
import { AgentToolsPanel } from './AgentToolsPanel';
import { AIAssistantPanel } from './AIAssistantPanel';
import { SAMPanel } from './SAMPanel';
import { useIDEStore } from './useIDEStore';
import { EditorTab } from './types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const ProductionIDE: React.FC = () => {
  const store = useIDEStore();
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [rightPanel, setRightPanel] = useState<'preview' | 'git' | 'agent' | 'ai' | 'sam'>('preview');
  const [showTerminal, setShowTerminal] = useState(true);
  const editorRef = useRef<any>(null);

  const activeTab = store.openTabs.find(t => t.id === store.activeTabId);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleInsertCode = (code: string) => {
    if (editorRef.current && activeTab) {
      const position = editorRef.current.getPosition();
      if (position) {
        editorRef.current.executeEdits('ai-insert', [{
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: '\n' + code + '\n',
        }]);
      }
    }
  };

  const handleSave = () => {
    if (store.activeTabId) {
      store.saveTab(store.activeTabId);
      toast.success('File saved');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <span className="font-mono text-sm font-bold text-primary">AI-MOS Production IDE</span>
          <span className="text-xs text-muted-foreground font-mono">
            on {store.gitStatus.branch}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSave} className="h-7 text-xs">
            <Save className="w-3 h-3 mr-1" /> Save
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Play className="w-3 h-3 mr-1" /> Run
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
            <EnhancedFileExplorer
              files={store.files}
              selectedPath={selectedPath}
              onSelect={(node) => setSelectedPath(node.path)}
              onOpen={(node) => store.openFile(node)}
              onCreate={store.createFile}
              onDelete={store.deleteNode}
              onRename={store.renameNode}
              onCopy={store.copyNodes}
              onCut={store.cutNodes}
              onPaste={store.pasteNodes}
              onBulkCreate={store.bulkCreate}
              clipboardHasContent={!!store.clipboard}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Editor + Terminal */}
          <ResizablePanel defaultSize={50}>
            <ResizablePanelGroup direction="vertical">
              {/* Editor area */}
              <ResizablePanel defaultSize={showTerminal ? 70 : 100}>
                <div className="h-full flex flex-col">
                  {/* Tabs */}
                  <div className="flex items-center border-b border-border bg-muted/30 overflow-x-auto">
                    {store.openTabs.map((tab) => (
                      <div
                        key={tab.id}
                        onClick={() => store.setActiveTabId(tab.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 text-xs font-mono border-r border-border cursor-pointer",
                          tab.id === store.activeTabId
                            ? "bg-background text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>{tab.name}</span>
                        {tab.modified && <span className="text-primary">●</span>}
                        <button
                          onClick={(e) => { e.stopPropagation(); store.closeTab(tab.id); }}
                          className="hover:bg-muted rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Monaco Editor */}
                  <div className="flex-1">
                    {activeTab ? (
                      <Editor
                        height="100%"
                        language={activeTab.language}
                        value={activeTab.content}
                        onChange={(value) => value && store.updateTabContent(activeTab.id, value)}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: true },
                          fontSize: 13,
                          lineNumbers: 'on',
                          automaticLayout: true,
                          tabSize: 2,
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <FolderTree className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Select a file to edit</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>

              {showTerminal && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={30} minSize={15}>
                    <TerminalPanel
                      terminals={store.terminals}
                      activeTerminalId={store.activeTerminalId}
                      files={store.files}
                      onAddLine={store.addTerminalLine}
                      onCreateTerminal={store.createTerminal}
                      onClearTerminal={store.clearTerminal}
                      onSetActiveTerminal={store.setActiveTerminalId}
                    />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel */}
          <ResizablePanel defaultSize={35} minSize={20}>
            <div className="h-full flex flex-col">
              <div className="flex border-b border-border bg-muted/30">
                <Button
                  variant={rightPanel === 'preview' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setRightPanel('preview')}
                  className="flex-1 rounded-none h-8 text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" /> Preview
                </Button>
                <Button
                  variant={rightPanel === 'sam' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setRightPanel('sam')}
                  className="flex-1 rounded-none h-8 text-xs"
                >
                  <Brain className="w-3 h-3 mr-1" /> S.A.M.
                </Button>
                <Button
                  variant={rightPanel === 'ai' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setRightPanel('ai')}
                  className="flex-1 rounded-none h-8 text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" /> AI
                </Button>
                <Button
                  variant={rightPanel === 'git' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setRightPanel('git')}
                  className="flex-1 rounded-none h-8 text-xs"
                >
                  <GitBranch className="w-3 h-3 mr-1" /> Git
                </Button>
                <Button
                  variant={rightPanel === 'agent' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setRightPanel('agent')}
                  className="flex-1 rounded-none h-8 text-xs"
                >
                  <Bot className="w-3 h-3 mr-1" /> Agent
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                {rightPanel === 'preview' && (
                  <PreviewPanel files={store.files} activeFilePath={activeTab?.path} />
                )}
                {rightPanel === 'ai' && (
                  <AIAssistantPanel
                    files={store.files}
                    activeFileContent={activeTab?.content}
                    activeFileLanguage={activeTab?.language}
                    activeFilePath={activeTab?.path}
                    onInsertCode={handleInsertCode}
                    onCreateFile={(path, content) => store.createFile('/', path, 'file')}
                  />
                )}
                {rightPanel === 'git' && (
                  <GitPanel
                    status={store.gitStatus}
                    commits={store.gitCommits}
                    branches={store.gitBranches}
                    onStage={store.gitStage}
                    onUnstage={store.gitUnstage}
                    onCommit={store.gitCommit}
                    onCheckout={store.gitCheckout}
                    onCreateBranch={store.gitCreateBranch}
                  />
                )}
                {rightPanel === 'agent' && (
                  <AgentToolsPanel
                    tasks={store.agentTasks}
                    files={store.files}
                    onAddTask={store.addAgentTask}
                    onUpdateTask={store.updateAgentTask}
                    onExecuteCommand={(cmd) => store.addTerminalLine(store.activeTerminalId, { type: 'input', content: `$ ${cmd}` })}
                    onCreateFile={store.createFile}
                  />
                )}
                {rightPanel === 'sam' && (
                  <SAMPanel
                    files={store.files}
                    masterIndex={store.masterIndex}
                    isIndexing={store.isIndexing}
                    onIndexFiles={store.indexAllFiles}
                    onGenerateDocument={(content, filename) => {
                      store.createFile('/', filename, 'file');
                      toast.success(`Generated ${filename}`);
                    }}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-3 py-1 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <button onClick={() => setShowTerminal(!showTerminal)} className="flex items-center gap-1 hover:text-foreground">
          <TerminalIcon className="w-3 h-3" />
          Terminal
        </button>
        <span className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          {store.gitStatus.branch}
        </span>
        {activeTab && (
          <span className="ml-auto font-mono">{activeTab.language}</span>
        )}
      </div>
    </div>
  );
};

export default ProductionIDE;
