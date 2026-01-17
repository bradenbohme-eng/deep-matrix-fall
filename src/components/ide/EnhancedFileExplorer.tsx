import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  ChevronRight, ChevronDown, Search, Upload, FolderUp, X,
  FileArchive, MoreHorizontal
} from 'lucide-react';
import { FileNode, getLanguageFromPath } from './types';
import { FileUploadModal } from './FileUploadModal';
import { IngestionResult, IngestionFile } from '@/lib/fileIngestion';
import { cn } from '@/lib/utils';

interface EnhancedFileExplorerProps {
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
  onBulkCreate: (files: Array<{ path: string; name: string; content: string; type: 'file' | 'folder' }>) => void;
  clipboardHasContent?: boolean;
}

const getFileIcon = (node: FileNode) => {
  if (node.type === 'folder') return null;
  const ext = node.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-amber-400" />;
    case 'md':
    case 'mdx':
      return <FileText className="w-4 h-4 text-gray-400" />;
    case 'css':
    case 'scss':
      return <File className="w-4 h-4 text-pink-400" />;
    case 'py':
      return <FileCode className="w-4 h-4 text-green-400" />;
    case 'go':
      return <FileCode className="w-4 h-4 text-cyan-400" />;
    case 'rs':
      return <FileCode className="w-4 h-4 text-orange-400" />;
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
  searchQuery?: string;
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
  searchQuery = '',
}) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [inputValue, setInputValue] = useState(node.name);

  // Filter by search query
  const matchesSearch = searchQuery === '' || 
    node.name.toLowerCase().includes(searchQuery.toLowerCase());
  
  const hasMatchingChildren = node.children?.some(child => {
    if (child.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    if (child.children) {
      return child.children.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return false;
  });

  if (searchQuery && !matchesSearch && !hasMatchingChildren) {
    return null;
  }

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
              "flex items-center gap-1 px-2 py-1 cursor-pointer rounded-sm text-xs font-mono transition-colors group",
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
              <span className={cn("truncate", searchQuery && matchesSearch && "text-primary font-medium")}>
                {node.name}
              </span>
            )}
            {node.modified && <span className="text-primary ml-1">●</span>}
            {node.children && node.children.length > 0 && (
              <Badge variant="outline" className="ml-auto text-[9px] h-4 opacity-0 group-hover:opacity-100">
                {node.children.length}
              </Badge>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {node.type === 'folder' && (
            <>
              <ContextMenuItem onClick={() => { setIsCreating('file'); setInputValue('newfile.ts'); setExpanded(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => { setIsCreating('folder'); setInputValue('newfolder'); setExpanded(true); }}>
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

      {(expanded || (searchQuery && hasMatchingChildren)) && node.children && (
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
                searchQuery={searchQuery}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export const EnhancedFileExplorer: React.FC<EnhancedFileExplorerProps> = ({
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
  onBulkCreate,
  clipboardHasContent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesIngested = useCallback((result: IngestionResult) => {
    if (!result.success || result.files.length === 0) return;

    // Convert ingested files to bulk create format
    const filesToCreate: Array<{ path: string; name: string; content: string; type: 'file' | 'folder' }> = [];
    const foldersCreated = new Set<string>();

    // First, create all necessary folders
    for (const file of result.files) {
      const parts = file.path.split('/').filter(Boolean);
      let currentPath = '';
      
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += '/' + parts[i];
        if (!foldersCreated.has(currentPath)) {
          foldersCreated.add(currentPath);
          filesToCreate.push({
            path: currentPath,
            name: parts[i],
            content: '',
            type: 'folder',
          });
        }
      }
    }

    // Then add all files
    for (const file of result.files) {
      filesToCreate.push({
        path: file.path,
        name: file.name,
        content: file.content,
        type: 'file',
      });
    }

    onBulkCreate(filesToCreate);
    setShowUploadModal(false);
  }, [onBulkCreate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setShowUploadModal(true);
  }, []);

  // Count total files
  const countFiles = (nodes: FileNode[]): number => {
    return nodes.reduce((count, node) => {
      if (node.type === 'file') return count + 1;
      return count + (node.children ? countFiles(node.children) : 0);
    }, 0);
  };

  const totalFiles = countFiles(files);

  return (
    <div 
      className={cn(
        "h-full flex flex-col transition-colors",
        isDragOver && "bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Explorer</span>
          <Badge variant="outline" className="text-[9px] h-4">{totalFiles}</Badge>
          <div className="ml-auto flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setShowUploadModal(true)}
              title="Import codebase"
            >
              <Upload className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Refresh">
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="New file">
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
            className="h-7 text-xs pl-7 pr-7"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg z-10 flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-primary">Drop files here</p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="py-1">
          {files.length === 0 ? (
            <div 
              className="p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setShowUploadModal(true)}
            >
              <FolderUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No files yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click to import a codebase</p>
            </div>
          ) : (
            files.map(node => (
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
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <FileUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onFilesIngested={handleFilesIngested}
      />
    </div>
  );
};

export default EnhancedFileExplorer;
