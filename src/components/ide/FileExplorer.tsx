import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator,
  ContextMenuTrigger 
} from '@/components/ui/context-menu';
import {
  Folder, FolderOpen, File, FileCode, FileJson, FileText,
  Plus, RefreshCw, Trash2, Edit3, Copy, Scissors, Clipboard,
  ChevronRight, ChevronDown, Search
} from 'lucide-react';
import { FileNode, getLanguageFromPath } from './types';
import { cn } from '@/lib/utils';

interface FileExplorerProps {
  files: FileNode[];
  selectedPath?: string;
  onSelect: (node: FileNode) => void;
  onOpen: (node: FileNode) => void;
  onCreate: (parentPath: string, name: string, type: 'file' | 'folder') => void;
  onDelete: (path: string) => void;
  onRename: (oldPath: string, newName: string) => void;
  onCopy: (paths: string[]) => void;
  onCut: (paths: string[]) => void;
  onPaste: (targetPath: string) => void;
  clipboardHasContent?: boolean;
}

const getFileIcon = (node: FileNode) => {
  if (node.type === 'folder') {
    return null; // Will be handled separately with open/closed state
  }
  const ext = node.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-400" />;
    case 'md':
      return <FileText className="w-4 h-4 text-gray-400" />;
    case 'css':
    case 'scss':
      return <File className="w-4 h-4 text-pink-400" />;
    default:
      return <File className="w-4 h-4 text-muted-foreground" />;
  }
};

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  selectedPath?: string;
  onSelect: (node: FileNode) => void;
  onOpen: (node: FileNode) => void;
  onCreate: (parentPath: string, name: string, type: 'file' | 'folder') => void;
  onDelete: (path: string) => void;
  onRename: (oldPath: string, newName: string) => void;
  onCopy: (paths: string[]) => void;
  onCut: (paths: string[]) => void;
  onPaste: (targetPath: string) => void;
  clipboardHasContent?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth,
  selectedPath,
  onSelect,
  onOpen,
  onCreate,
  onDelete,
  onRename,
  onCopy,
  onCut,
  onPaste,
  clipboardHasContent,
}) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [inputValue, setInputValue] = useState(node.name);

  const handleClick = () => {
    if (node.type === 'folder') {
      setExpanded(!expanded);
    }
    onSelect(node);
  };

  const handleDoubleClick = () => {
    if (node.type === 'file') {
      onOpen(node);
    }
  };

  const handleRename = () => {
    if (inputValue.trim() && inputValue !== node.name) {
      onRename(node.path, inputValue.trim());
    }
    setIsRenaming(false);
  };

  const handleCreate = (type: 'file' | 'folder') => {
    if (inputValue.trim()) {
      onCreate(node.path, inputValue.trim(), type);
    }
    setIsCreating(null);
    setInputValue('');
  };

  const isSelected = selectedPath === node.path;

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 cursor-pointer rounded-sm text-xs font-mono transition-colors",
              isSelected ? "bg-primary/20 text-primary" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          >
            {node.type === 'folder' && (
              expanded 
                ? <ChevronDown className="w-3 h-3 shrink-0" />
                : <ChevronRight className="w-3 h-3 shrink-0" />
            )}
            {node.type === 'folder' ? (
              expanded 
                ? <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                : <Folder className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              getFileIcon(node)
            )}
            {isRenaming ? (
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                className="h-5 text-xs px-1 py-0"
                autoFocus
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
            {node.modified && <span className="text-primary ml-1">●</span>}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {node.type === 'folder' && (
            <>
              <ContextMenuItem onClick={() => { setIsCreating('file'); setInputValue('newfile.ts'); }}>
                <Plus className="w-4 h-4 mr-2" />
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => { setIsCreating('folder'); setInputValue('newfolder'); }}>
                <Folder className="w-4 h-4 mr-2" />
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={() => onCopy([node.path])}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onCut([node.path])}>
            <Scissors className="w-4 h-4 mr-2" />
            Cut
          </ContextMenuItem>
          {node.type === 'folder' && clipboardHasContent && (
            <ContextMenuItem onClick={() => onPaste(node.path)}>
              <Clipboard className="w-4 h-4 mr-2" />
              Paste
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => { setIsRenaming(true); setInputValue(node.name); }}>
            <Edit3 className="w-4 h-4 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem 
            onClick={() => onDelete(node.path)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isCreating && (
        <div 
          className="flex items-center gap-1 px-2 py-1"
          style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
        >
          {isCreating === 'folder' ? (
            <Folder className="w-4 h-4 text-amber-400" />
          ) : (
            <File className="w-4 h-4 text-muted-foreground" />
          )}
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => handleCreate(isCreating)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate(isCreating);
              if (e.key === 'Escape') setIsCreating(null);
            }}
            className="h-5 text-xs px-1 py-0"
            autoFocus
          />
        </div>
      )}

      {expanded && node.children && (
        <div>
          {node.children
            .sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === 'folder' ? -1 : 1;
            })
            .map(child => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onOpen={onOpen}
                onCreate={onCreate}
                onDelete={onDelete}
                onRename={onRename}
                onCopy={onCopy}
                onCut={onCut}
                onPaste={onPaste}
                clipboardHasContent={clipboardHasContent}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedPath,
  onSelect,
  onOpen,
  onCreate,
  onDelete,
  onRename,
  onCopy,
  onCut,
  onPaste,
  clipboardHasContent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Explorer</span>
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="h-7 text-xs pl-7"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {files.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onOpen={onOpen}
              onCreate={onCreate}
              onDelete={onDelete}
              onRename={onRename}
              onCopy={onCopy}
              onCut={onCut}
              onPaste={onPaste}
              clipboardHasContent={clipboardHasContent}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
