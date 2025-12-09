// V3 Image Editor - Tool Panel (Left Sidebar)

import React from 'react';
import { 
  Move, Crop, BoxSelect, Wand2, Brush, Eraser, 
  HeartPulse, Droplet, Pen, Type, Square, 
  GraduationCap, Palette 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToolType } from '@/lib/canvas/types';

interface ToolDefinition {
  id: ToolType;
  icon: React.ElementType;
  label: string;
  category: 'basic' | 'selection' | 'paint' | 'vector' | 'effects';
}

const tools: ToolDefinition[] = [
  // Basic Tools
  { id: 'move', icon: Move, label: 'Move', category: 'basic' },
  { id: 'crop', icon: Crop, label: 'Crop', category: 'basic' },
  { id: 'marquee', icon: BoxSelect, label: 'Marquee Select', category: 'basic' },
  
  // AI Selection
  { id: 'magic-wand', icon: Wand2, label: 'Magic Wand', category: 'selection' },
  
  // Retouching
  { id: 'healing', icon: HeartPulse, label: 'Healing Brush', category: 'paint' },
  { id: 'brush', icon: Brush, label: 'Brush', category: 'paint' },
  { id: 'clone', icon: Droplet, label: 'Clone Stamp', category: 'paint' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', category: 'paint' },
  
  // Vector & Text
  { id: 'pen', icon: Pen, label: 'Pen Tool', category: 'vector' },
  { id: 'text', icon: Type, label: 'Text', category: 'vector' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', category: 'vector' },
  
  // Fills & Effects
  { id: 'gradient', icon: GraduationCap, label: 'Gradient', category: 'effects' },
  { id: 'color-adjust', icon: Palette, label: 'Color Adjust', category: 'effects' },
];

interface ToolPanelProps {
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  isProcessing: boolean;
}

export function ToolPanel({ selectedTool, onToolSelect, isProcessing }: ToolPanelProps) {
  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolDefinition[]>);

  const categoryOrder: string[] = ['basic', 'selection', 'paint', 'vector', 'effects'];

  return (
    <div className="w-20 bg-black/50 backdrop-blur-sm border-r border-border flex flex-col flex-shrink-0">
      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        {categoryOrder.map((category, catIndex) => {
          const categoryTools = groupedTools[category];
          if (!categoryTools) return null;

          return (
            <div key={category} className="space-y-1">
              {catIndex > 0 && <Separator className="bg-border/50 my-2" />}
              {categoryTools.map((tool) => {
                const Icon = tool.icon;
                const isSelected = selectedTool === tool.id;
                
                return (
                  <Button
                    key={tool.id}
                    variant="ghost"
                    size="icon"
                    onClick={() => onToolSelect(tool.id)}
                    disabled={isProcessing}
                    className={`
                      w-12 h-12 relative group mx-auto block
                      ${isSelected
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                    title={tool.label}
                  >
                    <Icon className="w-5 h-5" />
                    
                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border shadow-lg transition-opacity">
                      {tool.label}
                    </div>
                  </Button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
