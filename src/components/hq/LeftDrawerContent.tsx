// Left Drawer - Contains the left side panels based on active tab

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EnhancedFileExplorer } from '@/components/ide/EnhancedFileExplorer';
import { useIDEStore } from '@/components/ide/useIDEStore';
import LiveFeeds from '@/components/matrix/LiveFeeds';
import AdvancedIntelGraph from '@/components/matrix/AdvancedIntelGraph';
import AgentsPanel from '@/components/matrix/AgentsPanel';
import RedTeamPanel from './RedTeamPanel';
import BlueTeamPanel from './BlueTeamPanel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, GitBranch, GitCommit, GitMerge, RefreshCw, Plus } from 'lucide-react';
import type { LeftDrawerTab } from './types';

interface LeftDrawerContentProps {
  activeTab: LeftDrawerTab;
  width: number;
  onFileSelect?: (path: string) => void;
}

const LeftDrawerContent: React.FC<LeftDrawerContentProps> = ({
  activeTab,
  width,
  onFileSelect,
}) => {
  const ideStore = useIDEStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/workspace', '/workspace/src']));
  const [selectedPath, setSelectedPath] = useState<string | undefined>();

  const handleToggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="h-full bg-card/95 border-r border-border" style={{ width: `${width}px` }}>
      {activeTab === 'explorer' && (
        <div className="h-full flex flex-col">
          <div className="p-2 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Explorer</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <EnhancedFileExplorer
              files={ideStore.files}
              selectedPath={selectedPath}
              onSelect={(node) => {
                setSelectedPath(node.path);
                ideStore.openFile(node);
                onFileSelect?.(node.path);
              }}
              onOpen={(node) => ideStore.openFile(node)}
              onCreate={ideStore.createFile}
              onDelete={ideStore.deleteNode}
              onRename={ideStore.renameNode}
              onCopy={ideStore.copyNodes}
              onCut={ideStore.cutNodes}
              onPaste={ideStore.pasteNodes}
              onBulkCreate={ideStore.bulkCreate}
              clipboardHasContent={!!ideStore.clipboard}
            />
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="h-full flex flex-col">
          <div className="p-2 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Search</span>
          </div>
          <div className="p-2">
            <div className="flex space-x-1">
              <Input 
                placeholder="Search files..." 
                className="text-xs bg-muted/50"
              />
              <Button variant="ghost" size="sm" className="px-2">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="text-xs text-muted-foreground text-center py-8">
              Type to search across all files
            </div>
          </ScrollArea>
        </div>
      )}

      {activeTab === 'git' && (
        <div className="h-full flex flex-col">
          <div className="p-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Source Control</span>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs">
                <GitBranch className="w-4 h-4 text-primary" />
                <span>{ideStore.gitStatus.branch}</span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="text-xs text-muted-foreground mb-2">Changes</div>
                {ideStore.gitStatus.unstaged.length > 0 ? (
                  <div className="space-y-1">
                    {ideStore.gitStatus.unstaged.map(path => (
                      <div key={path} className="text-xs text-muted-foreground truncate">
                        {path.split('/').pop()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No uncommitted changes
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {activeTab === 'intel' && (
        <div className="h-full flex flex-col">
          <div className="p-2 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Intel Feeds</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <LiveFeeds />
          </div>
        </div>
      )}

      {activeTab === 'red-team' && (
        <div className="h-full overflow-hidden">
          <RedTeamPanel />
        </div>
      )}

      {activeTab === 'blue-team' && (
        <div className="h-full overflow-hidden">
          <BlueTeamPanel />
        </div>
      )}

      {activeTab === 'network' && (
        <div className="h-full flex flex-col">
          <div className="p-2 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Network Map</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <AdvancedIntelGraph items={[]} />
          </div>
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="h-full overflow-hidden">
          <AgentsPanel />
        </div>
      )}
    </div>
  );
};

export default LeftDrawerContent;
