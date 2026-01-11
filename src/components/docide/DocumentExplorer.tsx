import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  Edit2,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentNode } from './types';

interface DocumentExplorerProps {
  documents: DocumentNode[];
  activeDocumentId: string | null;
  clipboard: { type: 'cut' | 'copy'; nodes: DocumentNode[] } | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string, title: string, type: 'document' | 'folder') => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onCopy: (id: string) => void;
  onCut: (id: string) => void;
  onPaste: (targetId: string) => void;
}

interface TreeNodeProps {
  node: DocumentNode;
  level: number;
  activeDocumentId: string | null;
  clipboard: { type: 'cut' | 'copy'; nodes: DocumentNode[] } | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string, title: string, type: 'document' | 'folder') => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onCopy: (id: string) => void;
  onCut: (id: string) => void;
  onPaste: (targetId: string) => void;
}

const TreeNode = ({
  node,
  level,
  activeDocumentId,
  clipboard,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onCopy,
  onCut,
  onPaste,
}: TreeNodeProps) => {
  const [expanded, setExpanded] = useState(level < 2);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const [isCreating, setIsCreating] = useState<'document' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const isFolder = node.type === 'folder';
  const isActive = node.id === activeDocumentId;
  const isCut = clipboard?.type === 'cut' && clipboard.nodes.some(n => n.id === node.id);

  const handleClick = () => {
    if (isFolder) {
      setExpanded(!expanded);
    } else {
      onSelect(node.id);
    }
  };

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== node.title) {
      onRename(node.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleCreate = () => {
    if (newItemName.trim() && isCreating) {
      onCreate(node.id, newItemName.trim(), isCreating);
      setNewItemName('');
      setIsCreating(null);
      setExpanded(true);
    }
  };

  const getIcon = () => {
    if (isFolder) {
      return expanded ? (
        <FolderOpen className="w-4 h-4 text-primary" />
      ) : (
        <Folder className="w-4 h-4 text-primary" />
      );
    }
    
    if (node.metadata?.status === 'published') {
      return <BookOpen className="w-4 h-4 text-green-400" />;
    }
    
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className={cn(isCut && 'opacity-50')}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              'flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer text-sm transition-colors',
              'hover:bg-accent/50',
              isActive && 'bg-accent text-accent-foreground'
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={handleClick}
          >
            {isFolder && (
              <span className="w-4 h-4 flex items-center justify-center">
                {expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </span>
            )}
            {!isFolder && <span className="w-4" />}
            
            {getIcon()}
            
            {isRenaming ? (
              <Input
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                className="h-5 py-0 px-1 text-xs"
                autoFocus
              />
            ) : (
              <span className="flex-1 truncate">{node.title}</span>
            )}

            {node.modified && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          {isFolder && (
            <>
              <ContextMenuItem onClick={() => setIsCreating('document')}>
                <FileText className="w-4 h-4 mr-2" />
                New Document
              </ContextMenuItem>
              <ContextMenuItem onClick={() => setIsCreating('folder')}>
                <Folder className="w-4 h-4 mr-2" />
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          
          <ContextMenuItem onClick={() => setIsRenaming(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Rename
          </ContextMenuItem>
          
          <ContextMenuItem onClick={() => onCopy(node.id)}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </ContextMenuItem>
          
          <ContextMenuItem onClick={() => onCut(node.id)}>
            <Scissors className="w-4 h-4 mr-2" />
            Cut
          </ContextMenuItem>
          
          {isFolder && clipboard && (
            <ContextMenuItem onClick={() => onPaste(node.id)}>
              <Clipboard className="w-4 h-4 mr-2" />
              Paste
            </ContextMenuItem>
          )}
          
          <ContextMenuSeparator />
          
          <ContextMenuItem 
            onClick={() => onDelete(node.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Create new item input */}
      {isCreating && (
        <div
          className="flex items-center gap-1 py-1 px-2"
          style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
        >
          {isCreating === 'folder' ? (
            <Folder className="w-4 h-4 text-primary" />
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground" />
          )}
          <Input
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onBlur={() => {
              if (newItemName.trim()) handleCreate();
              else setIsCreating(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setIsCreating(null);
            }}
            placeholder={`New ${isCreating}...`}
            className="h-5 py-0 px-1 text-xs flex-1"
            autoFocus
          />
        </div>
      )}

      {/* Children */}
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              activeDocumentId={activeDocumentId}
              clipboard={clipboard}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
              onRename={onRename}
              onCopy={onCopy}
              onCut={onCut}
              onPaste={onPaste}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DocumentExplorer = ({
  documents,
  activeDocumentId,
  clipboard,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onCopy,
  onCut,
  onPaste,
}: DocumentExplorerProps) => {
  return (
    <div className="h-full flex flex-col bg-background/50">
      <div className="p-2 border-b border-border/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              const root = documents.find(d => d.type === 'folder');
              if (root) onCreate(root.id, 'Untitled', 'document');
            }}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="py-2">
          {documents.map(doc => (
            <TreeNode
              key={doc.id}
              node={doc}
              level={0}
              activeDocumentId={activeDocumentId}
              clipboard={clipboard}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
              onRename={onRename}
              onCopy={onCopy}
              onCut={onCut}
              onPaste={onPaste}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
