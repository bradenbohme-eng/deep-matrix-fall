import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GitBranch, GitCommit as GitCommitIcon, GitMerge, GitPullRequest,
  Plus, Minus, Check, X, RefreshCw, Upload, Download,
  ChevronDown, ChevronRight, File, History, Cloud
} from 'lucide-react';
import { GitStatus, GitCommit, GitBranch as GitBranchType } from './types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GitPanelProps {
  status: GitStatus;
  commits: GitCommit[];
  branches: GitBranchType[];
  onStage: (paths: string[]) => void;
  onUnstage: (paths: string[]) => void;
  onCommit: (message: string) => GitCommit;
  onCheckout: (branch: string) => void;
  onCreateBranch: (name: string) => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  status,
  commits,
  branches,
  onStage,
  onUnstage,
  onCommit,
  onCheckout,
  onCreateBranch,
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    staged: true,
    unstaged: true,
    untracked: true,
  });

  const handleCommit = () => {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }
    if (status.staged.length === 0) {
      toast.error('No staged changes to commit');
      return;
    }
    const commit = onCommit(commitMessage);
    setCommitMessage('');
    toast.success(`Committed: ${commit.hash.slice(0, 7)}`);
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    onCreateBranch(newBranchName);
    setNewBranchName('');
    setShowNewBranch(false);
    toast.success(`Created branch: ${newBranchName}`);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const FileItem: React.FC<{ 
    path: string; 
    type: 'staged' | 'unstaged' | 'untracked';
  }> = ({ path, type }) => (
    <div className="flex items-center gap-2 px-2 py-1 text-xs font-mono hover:bg-muted/50 rounded group">
      <File className="w-3 h-3 text-muted-foreground" />
      <span className="truncate flex-1">{path.split('/').pop()}</span>
      <span className="text-muted-foreground text-[10px] truncate max-w-[100px]">
        {path.split('/').slice(0, -1).join('/')}
      </span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
        {type === 'staged' ? (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onUnstage([path])}>
            <Minus className="w-3 h-3" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onStage([path])}>
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="changes" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 h-8 bg-muted/30">
          <TabsTrigger value="changes" className="text-xs gap-1">
            <GitCommitIcon className="w-3 h-3" />
            Changes
          </TabsTrigger>
          <TabsTrigger value="branches" className="text-xs gap-1">
            <GitBranch className="w-3 h-3" />
            Branches
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1">
            <History className="w-3 h-3" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="changes" className="flex-1 flex flex-col mt-0 p-2 space-y-2">
          {/* Branch indicator */}
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono font-medium">{status.branch}</span>
            {status.ahead > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4">
                ↑{status.ahead}
              </Badge>
            )}
            {status.behind > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4">
                ↓{status.behind}
              </Badge>
            )}
            <div className="ml-auto flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Pull">
                <Download className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Push">
                <Upload className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Sync">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Commit input */}
          <div className="space-y-2">
            <Input
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
            />
            <Button 
              onClick={handleCommit} 
              className="w-full h-7 text-xs"
              disabled={status.staged.length === 0}
            >
              <Check className="w-3 h-3 mr-1" />
              Commit ({status.staged.length})
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {/* Staged changes */}
            <div className="mb-2">
              <button
                onClick={() => toggleSection('staged')}
                className="flex items-center gap-1 w-full px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground"
              >
                {expandedSections.staged ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>Staged Changes</span>
                <Badge variant="outline" className="ml-auto text-[10px] h-4">{status.staged.length}</Badge>
              </button>
              {expandedSections.staged && status.staged.map(path => (
                <FileItem key={path} path={path} type="staged" />
              ))}
            </div>

            {/* Unstaged changes */}
            <div className="mb-2">
              <button
                onClick={() => toggleSection('unstaged')}
                className="flex items-center gap-1 w-full px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground"
              >
                {expandedSections.unstaged ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>Changes</span>
                <Badge variant="outline" className="ml-auto text-[10px] h-4">{status.unstaged.length}</Badge>
              </button>
              {expandedSections.unstaged && status.unstaged.map(path => (
                <FileItem key={path} path={path} type="unstaged" />
              ))}
            </div>

            {/* Untracked files */}
            <div>
              <button
                onClick={() => toggleSection('untracked')}
                className="flex items-center gap-1 w-full px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground"
              >
                {expandedSections.untracked ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>Untracked</span>
                <Badge variant="outline" className="ml-auto text-[10px] h-4">{status.untracked.length}</Badge>
              </button>
              {expandedSections.untracked && status.untracked.map(path => (
                <FileItem key={path} path={path} type="untracked" />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="branches" className="flex-1 mt-0 p-2 space-y-2">
          <div className="flex items-center gap-2">
            {showNewBranch ? (
              <>
                <Input
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Branch name..."
                  className="h-7 text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateBranch();
                    if (e.key === 'Escape') setShowNewBranch(false);
                  }}
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCreateBranch}>
                  <Check className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNewBranch(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                className="w-full h-7 text-xs"
                onClick={() => setShowNewBranch(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                New Branch
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {branches.map(branch => (
                <div
                  key={branch.name}
                  onClick={() => onCheckout(branch.name)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs font-mono",
                    branch.current 
                      ? "bg-primary/20 text-primary" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitBranch className="w-3 h-3" />
                  <span>{branch.name}</span>
                  {branch.current && <Check className="w-3 h-3 ml-auto" />}
                  {branch.remote && <Cloud className="w-3 h-3 ml-auto text-muted-foreground" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 mt-0 p-2">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {commits.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No commits yet
                </div>
              ) : (
                commits.map(commit => (
                  <div
                    key={commit.id}
                    className="p-2 bg-muted/30 rounded space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <GitCommitIcon className="w-3 h-3 text-primary" />
                      <span className="text-xs font-mono text-primary">{commit.hash}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {commit.date.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs">{commit.message}</p>
                    <p className="text-[10px] text-muted-foreground">{commit.author}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
