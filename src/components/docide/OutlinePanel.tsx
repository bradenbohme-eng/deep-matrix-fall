import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Hash,
  ChevronRight,
  ChevronDown,
  List,
  Bookmark,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentOutline, DocumentBookmark, DocumentComment } from './types';
import { useState } from 'react';

interface OutlinePanelProps {
  outline: DocumentOutline[];
  bookmarks: DocumentBookmark[];
  comments: DocumentComment[];
  documentId: string | null;
  onNavigate: (position: number) => void;
  onRemoveBookmark: (id: string) => void;
  onResolveComment: (id: string) => void;
}

export const OutlinePanel = ({
  outline,
  bookmarks,
  comments,
  documentId,
  onNavigate,
  onRemoveBookmark,
  onResolveComment,
}: OutlinePanelProps) => {
  const [activeSection, setActiveSection] = useState<'outline' | 'bookmarks' | 'comments'>('outline');

  const documentBookmarks = bookmarks.filter(b => b.documentId === documentId);
  const documentComments = comments.filter(c => c.documentId === documentId && !c.resolved);

  const renderOutlineItem = (item: DocumentOutline, index: number) => {
    const indent = (item.level - 1) * 12;
    
    return (
      <div
        key={index}
        className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-accent/50 transition-colors"
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => onNavigate(item.position)}
      >
        <Hash className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm truncate">{item.title}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background/50">
      {/* Section Tabs */}
      <div className="flex border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex-1 rounded-none text-xs gap-1',
            activeSection === 'outline' && 'bg-accent'
          )}
          onClick={() => setActiveSection('outline')}
        >
          <List className="w-3.5 h-3.5" />
          Outline
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex-1 rounded-none text-xs gap-1',
            activeSection === 'bookmarks' && 'bg-accent'
          )}
          onClick={() => setActiveSection('bookmarks')}
        >
          <Bookmark className="w-3.5 h-3.5" />
          {documentBookmarks.length > 0 && (
            <span className="text-[10px] bg-primary/20 px-1 rounded">
              {documentBookmarks.length}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex-1 rounded-none text-xs gap-1',
            activeSection === 'comments' && 'bg-accent'
          )}
          onClick={() => setActiveSection('comments')}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {documentComments.length > 0 && (
            <span className="text-[10px] bg-primary/20 px-1 rounded">
              {documentComments.length}
            </span>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Outline View */}
          {activeSection === 'outline' && (
            <>
              {outline.length > 0 ? (
                outline.map((item, index) => renderOutlineItem(item, index))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <List className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No headings found</p>
                  <p className="text-xs mt-1">Use # to create headings</p>
                </div>
              )}
            </>
          )}

          {/* Bookmarks View */}
          {activeSection === 'bookmarks' && (
            <>
              {documentBookmarks.length > 0 ? (
                documentBookmarks.map(bookmark => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-accent/50 transition-colors group"
                    onClick={() => onNavigate(bookmark.position)}
                  >
                    <Bookmark
                      className="w-3.5 h-3.5"
                      style={{ color: bookmark.color || 'hsl(var(--primary))' }}
                    />
                    <span className="text-sm truncate flex-1">{bookmark.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={e => {
                        e.stopPropagation();
                        onRemoveBookmark(bookmark.id);
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No bookmarks</p>
                  <p className="text-xs mt-1">Select text to add bookmarks</p>
                </div>
              )}
            </>
          )}

          {/* Comments View */}
          {activeSection === 'comments' && (
            <>
              {documentComments.length > 0 ? (
                documentComments.map(comment => (
                  <div
                    key={comment.id}
                    className="p-2 rounded bg-accent/30 mb-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{comment.authorName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-xs"
                        onClick={() => onResolveComment(comment.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No comments</p>
                  <p className="text-xs mt-1">Select text to add comments</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
