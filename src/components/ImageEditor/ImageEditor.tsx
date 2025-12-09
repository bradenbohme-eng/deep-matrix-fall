// V3 Image Editor - Main Editor Component

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Save, ZoomIn, ZoomOut, 
  Upload, Loader2, Wand2, Settings, Layers, History, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditorCanvas } from './EditorCanvas';
import { ToolPanel } from './ToolPanel';
import { RightPanel } from './RightPanel';
import { ExportDialog } from './ExportDialog';
import { EditorState, ToolType, EditorProject, Layer, HistoryEntry } from '@/lib/canvas/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/canvas/constants';
import { toast } from 'sonner';

const initialState: EditorState = {
  project: null,
  activeTool: 'select',
  zoom: 100,
  panX: 0,
  panY: 0,
  isProcessing: false,
  history: [],
  historyIndex: -1,
};

export function ImageEditor() {
  const [editorState, setEditorState] = useState<EditorState>(initialState);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'layers' | 'history' | 'ai'>('layers');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { project, activeTool, zoom, isProcessing, history, historyIndex } = editorState;

  // Add to history
  const pushHistory = useCallback((action: string) => {
    setEditorState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        state: { ...prev },
        action,
        timestamp: Date.now(),
      });
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    
    const prevEntry = history[historyIndex - 1];
    setEditorState(prev => ({
      ...prevEntry.state,
      history: prev.history,
      historyIndex: historyIndex - 1,
    }));
    toast.success('Undone: ' + history[historyIndex].action);
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    const nextEntry = history[historyIndex + 1];
    setEditorState(prev => ({
      ...nextEntry.state,
      history: prev.history,
      historyIndex: historyIndex + 1,
    }));
    toast.success('Redone: ' + nextEntry.action);
  }, [history, historyIndex]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      zoom: Math.min(500, prev.zoom + 10),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      zoom: Math.max(10, prev.zoom - 10),
    }));
  }, []);

  // Tool selection
  const handleToolSelect = useCallback((tool: ToolType) => {
    setEditorState(prev => ({ ...prev, activeTool: tool }));
  }, []);

  // File upload
  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setEditorState(prev => ({ ...prev, isProcessing: true }));

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = dataUrl;
      });

      // Create new project with single layer
      const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, ''),
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        bounds: {
          x: (CANVAS_WIDTH - img.width) / 2,
          y: (CANVAS_HEIGHT - img.height) / 2,
          width: img.width,
          height: img.height,
        },
        image: img,
        dataUrl,
        transform: { rotation: 0, scaleX: 1, scaleY: 1 },
      };

      const newProject: EditorProject = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, ''),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        layers: [newLayer],
        selectedLayerId: newLayer.id,
        selection: null,
      };

      setEditorState(prev => ({
        ...prev,
        project: newProject,
        isProcessing: false,
      }));

      pushHistory('Upload Image');
      toast.success('Image loaded successfully!');
    } catch (error) {
      console.error('Error loading image:', error);
      toast.error('Failed to load image');
      setEditorState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [pushHistory]);

  // Update layer
  const handleUpdateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    setEditorState(prev => {
      if (!prev.project) return prev;
      
      const newLayers = prev.project.layers.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      );
      
      return {
        ...prev,
        project: {
          ...prev.project,
          layers: newLayers,
        },
      };
    });
  }, []);

  // Select layer
  const handleSelectLayer = useCallback((layerId: string) => {
    setEditorState(prev => {
      if (!prev.project) return prev;
      return {
        ...prev,
        project: {
          ...prev.project,
          selectedLayerId: layerId,
        },
      };
    });
  }, []);

  // Navigate history
  const handleHistoryNavigate = useCallback((index: number) => {
    if (index < 0 || index >= history.length) return;
    
    const entry = history[index];
    setEditorState(prev => ({
      ...entry.state,
      history: prev.history,
      historyIndex: index,
    }));
  }, [history]);

  const selectedLayer = project?.layers.find(l => l.id === project.selectedLayerId);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Toolbar */}
      <header className="flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur-sm border-b border-border z-30 flex-shrink-0">
        <h1 className="text-lg font-bold text-foreground">
          {project?.name || "V3 Image Editor"}
        </h1>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleUndo} 
            disabled={!canUndo}
            title="Undo"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRedo} 
            disabled={!canRedo}
            title="Redo"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 mx-2">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm w-12 text-center text-foreground">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpload}
            variant="outline"
            className="border-border"
          >
            <Upload className="w-4 h-4 mr-2" /> Open
          </Button>
          <Button 
            onClick={() => setShowExportDialog(true)} 
            disabled={!project} 
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool Panel (Left) */}
        <ToolPanel
          selectedTool={activeTool}
          onToolSelect={handleToolSelect}
          isProcessing={isProcessing}
        />

        {/* Canvas Area (Center) */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {project ? (
            <>
              <EditorCanvas
                project={project}
                activeTool={activeTool}
                zoom={zoom / 100}
                isProcessing={isProcessing}
                onUpdateLayer={handleUpdateLayer}
              />
              
              {/* Processing Overlay */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                    <div className="bg-card/90 rounded-lg p-4 flex items-center gap-3 border border-border">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="font-medium text-foreground">Applying AI Magic...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            // Empty State
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-center max-w-md"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                <Wand2 className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Welcome to V3 Image Editor
              </h2>
              <p className="text-muted-foreground mb-8">
                Upload an image to experience perfect pixel alignment, progressive segmentation, 
                and AI-driven photo manipulation.
              </p>
              <Button 
                size="lg" 
                onClick={handleUpload} 
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-8 py-3"
              >
                <Upload className="w-5 h-5 mr-2" /> Open Image
              </Button>
            </motion.div>
          )}
        </div>

        {/* Right Panel */}
        <RightPanel
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
          project={project}
          selectedLayer={selectedLayer}
          history={history}
          historyIndex={historyIndex}
          onSelectLayer={handleSelectLayer}
          onUpdateLayer={handleUpdateLayer}
          onHistoryNavigate={handleHistoryNavigate}
        />
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        project={project}
      />
    </div>
  );
}
