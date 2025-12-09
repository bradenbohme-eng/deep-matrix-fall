// V3 Image Editor - Right Panel (Properties/Layers/History/AI)

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Layers, History, Sparkles, Eye, EyeOff, Trash2, Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { EditorProject, Layer, HistoryEntry, BlendMode } from '@/lib/canvas/types';

interface RightPanelProps {
  activeTab: 'properties' | 'layers' | 'history' | 'ai';
  onTabChange: (tab: 'properties' | 'layers' | 'history' | 'ai') => void;
  project: EditorProject | null;
  selectedLayer?: Layer;
  history: HistoryEntry[];
  historyIndex: number;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
  onHistoryNavigate: (index: number) => void;
}

const blendModes: BlendMode[] = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light',
  'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

export function RightPanel({
  activeTab,
  onTabChange,
  project,
  selectedLayer,
  history,
  historyIndex,
  onSelectLayer,
  onUpdateLayer,
  onHistoryNavigate,
}: RightPanelProps) {
  return (
    <div className="w-80 bg-black/50 backdrop-blur-sm border-l border-border flex flex-col flex-shrink-0">
      {/* Tab Bar */}
      <div className="flex border-b border-border">
        <TabButton 
          icon={Settings} 
          active={activeTab === 'properties'} 
          onClick={() => onTabChange('properties')}
          title="Properties"
        />
        <TabButton 
          icon={Layers} 
          active={activeTab === 'layers'} 
          onClick={() => onTabChange('layers')}
          title="Layers"
        />
        <TabButton 
          icon={History} 
          active={activeTab === 'history'} 
          onClick={() => onTabChange('history')}
          title="History"
        />
        <TabButton 
          icon={Sparkles} 
          active={activeTab === 'ai'} 
          onClick={() => onTabChange('ai')}
          title="AI Tools"
          accent
        />
      </div>

      {/* Panel Content */}
      <ScrollArea className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'properties' && (
            <motion.div
              key="properties"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <PropertiesPanel layer={selectedLayer} onUpdateLayer={onUpdateLayer} />
            </motion.div>
          )}

          {activeTab === 'layers' && (
            <motion.div
              key="layers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <LayersPanel
                project={project}
                selectedLayerId={project?.selectedLayerId || null}
                onSelectLayer={onSelectLayer}
                onUpdateLayer={onUpdateLayer}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <HistoryPanel
                history={history}
                currentIndex={historyIndex}
                onNavigate={onHistoryNavigate}
              />
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <AIPanel layer={selectedLayer} />
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}

// Tab Button Component
function TabButton({ 
  icon: Icon, 
  active, 
  onClick, 
  title, 
  accent 
}: { 
  icon: React.ElementType; 
  active: boolean; 
  onClick: () => void; 
  title: string;
  accent?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`flex-1 rounded-none h-12 ${
        active 
          ? accent 
            ? 'bg-muted text-purple-400' 
            : 'bg-muted text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
      title={title}
    >
      <Icon size={16} />
    </Button>
  );
}

// Properties Panel
function PropertiesPanel({ layer, onUpdateLayer }: { layer?: Layer; onUpdateLayer: (id: string, updates: Partial<Layer>) => void }) {
  if (!layer) {
    return (
      <div className="text-center text-muted-foreground h-40 flex items-center justify-center">
        Select a layer to adjust its properties.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Opacity</label>
        <div className="flex items-center gap-3">
          <Slider
            value={[layer.opacity * 100]}
            onValueChange={([val]) => onUpdateLayer(layer.id, { opacity: val / 100 })}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm w-12 text-right">{Math.round(layer.opacity * 100)}%</span>
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Blend Mode</label>
        <Select
          value={layer.blendMode}
          onValueChange={(val) => onUpdateLayer(layer.id, { blendMode: val as BlendMode })}
        >
          <SelectTrigger className="w-full bg-muted border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {blendModes.map(mode => (
              <SelectItem key={mode} value={mode} className="capitalize">
                {mode.replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-border" />

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Transform</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Rotation</label>
            <Slider
              value={[layer.transform?.rotation || 0]}
              onValueChange={([val]) => onUpdateLayer(layer.id, { 
                transform: { ...layer.transform, rotation: val, scaleX: layer.transform?.scaleX || 1, scaleY: layer.transform?.scaleY || 1 } 
              })}
              min={-180}
              max={180}
              step={1}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Scale</label>
            <Slider
              value={[(layer.transform?.scaleX || 1) * 100]}
              onValueChange={([val]) => onUpdateLayer(layer.id, { 
                transform: { rotation: layer.transform?.rotation || 0, scaleX: val / 100, scaleY: val / 100 } 
              })}
              min={10}
              max={200}
              step={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Layers Panel
function LayersPanel({
  project,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
}: {
  project: EditorProject | null;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
}) {
  if (!project) {
    return (
      <div className="text-center text-muted-foreground h-40 flex items-center justify-center">
        No project open.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Layer List */}
      <div className="space-y-1">
        {[...project.layers].reverse().map((layer) => (
          <div
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
              selectedLayerId === layer.id
                ? 'bg-primary/30'
                : 'hover:bg-muted'
            }`}
          >
            {/* Visibility Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateLayer(layer.id, { visible: !layer.visible });
              }}
            >
              {layer.visible ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3 text-muted-foreground" />
              )}
            </Button>

            {/* Thumbnail */}
            {layer.image && (
              <div className="w-10 h-8 bg-muted rounded overflow-hidden flex-shrink-0">
                <img
                  src={layer.dataUrl || (layer.image as HTMLImageElement).src}
                  alt={layer.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Layer Name */}
            <span className="flex-1 truncate text-sm">{layer.name}</span>

            {/* Lock Indicator */}
            {layer.locked && <Lock className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Layer Actions */}
      <Separator className="bg-border" />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Plus className="w-3 h-3 mr-1" /> Add Layer
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// History Panel
function HistoryPanel({
  history,
  currentIndex,
  onNavigate,
}: {
  history: HistoryEntry[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}) {
  if (history.length === 0) {
    return (
      <div className="text-center text-muted-foreground h-40 flex items-center justify-center">
        No history yet.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {[...history].reverse().map((entry, reverseIndex) => {
        const originalIndex = history.length - 1 - reverseIndex;
        return (
          <motion.div
            key={originalIndex}
            onClick={() => onNavigate(originalIndex)}
            className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
              currentIndex === originalIndex
                ? 'bg-primary/30 font-semibold'
                : 'hover:bg-muted'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reverseIndex * 0.02 }}
          >
            {entry.action}
          </motion.div>
        );
      })}
    </div>
  );
}

// AI Panel
function AIPanel({ layer }: { layer?: Layer }) {
  if (!layer) {
    return (
      <div className="text-center text-muted-foreground h-40 flex items-center justify-center">
        Select a layer to use AI tools.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <h3 className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Generative AI
        </h3>
        <textarea
          placeholder="e.g., 'remove the background' or 'add a sunset'"
          className="w-full h-20 bg-muted border border-border rounded-md p-2 text-sm resize-none"
        />
        <Button className="w-full mt-2 bg-purple-600 hover:bg-purple-700">
          Generate
        </Button>
      </div>

      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <h3 className="text-sm font-medium text-blue-300 mb-3">Enhancement AI</h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full border-blue-500/30 hover:bg-blue-500/10">
            Auto Enhance
          </Button>
          <Button variant="outline" className="w-full border-blue-500/30 hover:bg-blue-500/10">
            AI Super Resolution (2x)
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <h3 className="text-sm font-medium text-emerald-300 mb-3">Restoration AI</h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full border-emerald-500/30 hover:bg-emerald-500/10">
            Remove Scratches
          </Button>
          <Button variant="outline" className="w-full border-emerald-500/30 hover:bg-emerald-500/10">
            Colorize B&W Photo
          </Button>
        </div>
      </div>
    </div>
  );
}
