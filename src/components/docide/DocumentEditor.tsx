import { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  Edit,
  Columns,
  Save,
  Undo,
  Redo,
  Search,
  Replace,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentTab } from './types';
import ReactMarkdown from 'react-markdown';

interface DocumentEditorProps {
  tabs: DocumentTab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onContentChange: (tabId: string, content: string) => void;
  onSave: (tabId: string) => void;
}

type ViewMode = 'edit' | 'preview' | 'split';

export const DocumentEditor = ({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onContentChange,
  onSave,
}: DocumentEditorProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const editorRef = useRef<any>(null);
  const [showSearch, setShowSearch] = useState(false);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange: OnChange = (value) => {
    if (activeTabId && value !== undefined) {
      onContentChange(activeTabId, value);
    }
  };

  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!selection || !model) return;

    const selectedText = model.getValueInRange(selection);
    const newText = `${prefix}${selectedText}${suffix}`;

    editor.executeEdits('', [{
      range: selection,
      text: newText,
    }]);

    editor.focus();
  }, []);

  const formatActions = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { icon: Code, action: () => insertMarkdown('`', '`'), title: 'Inline Code' },
    { icon: Quote, action: () => insertMarkdown('> '), title: 'Quote' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { icon: Image, action: () => insertMarkdown('![alt](', ')'), title: 'Image' },
    { icon: List, action: () => insertMarkdown('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. '), title: 'Numbered List' },
    { icon: Heading1, action: () => insertMarkdown('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('## '), title: 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('### '), title: 'Heading 3' },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            if (activeTabId) onSave(activeTabId);
            break;
          case 'b':
            e.preventDefault();
            insertMarkdown('**', '**');
            break;
          case 'i':
            e.preventDefault();
            insertMarkdown('*', '*');
            break;
          case 'f':
            e.preventDefault();
            setShowSearch(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, onSave, insertMarkdown]);

  if (tabs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-background/50">
        <div className="text-center text-muted-foreground">
          <Edit className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No document open</p>
          <p className="text-sm mt-1">Select a document or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/50">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-border/50 bg-background/80">
        <ScrollArea className="flex-1">
          <div className="flex">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 border-r border-border/50 cursor-pointer transition-colors',
                  'hover:bg-accent/50',
                  tab.id === activeTabId && 'bg-accent'
                )}
                onClick={() => onTabChange(tab.id)}
              >
                <span className="text-sm truncate max-w-[120px]">{tab.title}</span>
                {tab.modified && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-50 hover:opacity-100"
                  onClick={e => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 px-2 border-l border-border/50">
          <Button
            variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('edit')}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={viewMode === 'split' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('split')}
          >
            <Columns className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('preview')}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50 bg-background/60">
        {formatActions.map(({ icon: Icon, action, title }, index) => (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={action}
            title={title}
          >
            <Icon className="w-3.5 h-3.5" />
          </Button>
        ))}
        
        <div className="w-px h-5 bg-border/50 mx-1" />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => editorRef.current?.trigger('keyboard', 'undo', null)}
          title="Undo"
        >
          <Undo className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => editorRef.current?.trigger('keyboard', 'redo', null)}
          title="Redo"
        >
          <Redo className="w-3.5 h-3.5" />
        </Button>
        
        <div className="w-px h-5 bg-border/50 mx-1" />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setShowSearch(!showSearch)}
          title="Find & Replace"
        >
          <Search className="w-3.5 h-3.5" />
        </Button>
        
        <div className="flex-1" />
        
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => activeTabId && onSave(activeTabId)}
          disabled={!activeTab?.modified}
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </Button>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={cn('flex-1', viewMode === 'split' && 'border-r border-border/50')}>
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={activeTab?.content || ''}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 24,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                renderWhitespace: 'none',
                lineNumbers: 'off',
                folding: true,
                automaticLayout: true,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              }}
            />
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={cn('flex-1 overflow-hidden', viewMode === 'split' && 'max-w-[50%]')}>
            <ScrollArea className="h-full">
              <div className="p-6 prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-code:text-primary/80 prose-pre:bg-background/50">
                <ReactMarkdown>
                  {activeTab?.content || ''}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-border/50 bg-background/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Markdown</span>
          {activeTab && (
            <>
              <span>{activeTab.content.split(/\s+/).filter(w => w).length} words</span>
              <span>{activeTab.content.length} characters</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          {activeTab?.cursorPosition && (
            <span>Ln {activeTab.cursorPosition.line}, Col {activeTab.cursorPosition.column}</span>
          )}
        </div>
      </div>
    </div>
  );
};
