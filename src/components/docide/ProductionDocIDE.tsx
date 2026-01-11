import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocumentStore } from './useDocumentStore';
import { DocumentExplorer } from './DocumentExplorer';
import { DocumentEditor } from './DocumentEditor';
import { OutlinePanel } from './OutlinePanel';
import { TemplatePanel } from './TemplatePanel';
import { VersionPanel } from './VersionPanel';
import { FileText, BookOpen, History, Sparkles } from 'lucide-react';

export const ProductionDocIDE = () => {
  const store = useDocumentStore();
  const activeTab = store.getActiveTab();
  const activeDocument = store.getActiveDocument();

  const handleTemplateSelect = (template: any) => {
    const root = store.documents.find(d => d.type === 'folder');
    if (root) {
      const newDoc = store.createDocument(root.id, template.name, template.content);
      store.openTab(newDoc.id);
    }
  };

  const handleCreateBlank = () => {
    const root = store.documents.find(d => d.type === 'folder');
    if (root) {
      const newDoc = store.createDocument(root.id, 'Untitled Document', '# Untitled\n\nStart writing...');
      store.openTab(newDoc.id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Sidebar - Explorer */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Tabs defaultValue="explorer" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-9">
              <TabsTrigger value="explorer" className="flex-1 text-xs gap-1 data-[state=active]:bg-accent">
                <FileText className="w-3.5 h-3.5" />
                Files
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex-1 text-xs gap-1 data-[state=active]:bg-accent">
                <BookOpen className="w-3.5 h-3.5" />
                Templates
              </TabsTrigger>
            </TabsList>
            <TabsContent value="explorer" className="flex-1 m-0">
              <DocumentExplorer
                documents={store.documents}
                activeDocumentId={activeTab?.documentId || null}
                clipboard={store.clipboard}
                onSelect={store.openTab}
                onCreate={store.createDocument}
                onDelete={store.deleteDocument}
                onRename={store.renameDocument}
                onCopy={store.copyDocument}
                onCut={store.cutDocument}
                onPaste={store.pasteDocument}
              />
            </TabsContent>
            <TabsContent value="templates" className="flex-1 m-0">
              <TemplatePanel
                templates={store.templates}
                onSelectTemplate={handleTemplateSelect}
                onCreateBlank={handleCreateBlank}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Editor */}
        <ResizablePanel defaultSize={55} minSize={40}>
          <DocumentEditor
            tabs={store.openTabs}
            activeTabId={store.activeTabId}
            onTabChange={(id) => {
              const tab = store.openTabs.find(t => t.id === id);
              if (tab) store.openTab(tab.documentId);
            }}
            onTabClose={store.closeTab}
            onContentChange={store.updateTabContent}
            onSave={store.saveTab}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Sidebar - Outline & Versions */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
          <Tabs defaultValue="outline" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-9">
              <TabsTrigger value="outline" className="flex-1 text-xs gap-1 data-[state=active]:bg-accent">
                <Sparkles className="w-3.5 h-3.5" />
                Structure
              </TabsTrigger>
              <TabsTrigger value="versions" className="flex-1 text-xs gap-1 data-[state=active]:bg-accent">
                <History className="w-3.5 h-3.5" />
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="outline" className="flex-1 m-0">
              <OutlinePanel
                outline={store.outline}
                bookmarks={store.bookmarks}
                comments={store.comments}
                documentId={activeTab?.documentId || null}
                onNavigate={() => {}}
                onRemoveBookmark={store.removeBookmark}
                onResolveComment={store.resolveComment}
              />
            </TabsContent>
            <TabsContent value="versions" className="flex-1 m-0">
              <VersionPanel
                versions={store.versions}
                documentId={activeTab?.documentId || null}
                currentContent={activeTab?.content || ''}
                onRestore={store.restoreVersion}
                onCompare={() => {}}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
