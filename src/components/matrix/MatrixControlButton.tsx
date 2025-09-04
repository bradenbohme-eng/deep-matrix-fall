import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, ChevronRight } from 'lucide-react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export const MatrixControlButton: React.FC = () => {
  const { settings, updateSetting, loadPreset, resetToDefaults, presets } = useMatrixSettings();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="w-8 h-8 bg-background/80 backdrop-blur border-primary/30 hover:bg-primary/20"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-56 bg-background/90 backdrop-blur border-primary/30"
      >
        <DropdownMenuLabel className="text-primary font-mono text-xs">
          MATRIX CONTROLS
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-primary/20" />
        
        <DropdownMenuItem 
          onClick={() => updateSetting('show3D', !settings.show3D)}
          className="font-mono text-xs hover:bg-primary/20"
        >
          <div className="flex items-center justify-between w-full">
            <span>{settings.show3D ? '2D Mode' : '3D Mode'}</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => updateSetting('isPaused', !settings.isPaused)}
          className="font-mono text-xs hover:bg-primary/20"
        >
          <div className="flex items-center justify-between w-full">
            <span>{settings.isPaused ? 'Resume' : 'Pause'}</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => updateSetting('showUI', !settings.showUI)}
          className="font-mono text-xs hover:bg-primary/20"
        >
          <div className="flex items-center justify-between w-full">
            <span>{settings.showUI ? 'Hide UI' : 'Show UI'}</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-primary/20" />
        
        <DropdownMenuLabel className="text-muted-foreground font-mono text-xs">
          PRESETS
        </DropdownMenuLabel>
        
        {Object.keys(presets).map((presetName) => (
          <DropdownMenuItem 
            key={presetName}
            onClick={() => loadPreset(presetName as keyof typeof presets)}
            className="font-mono text-xs hover:bg-primary/20 capitalize"
          >
            {presetName}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator className="bg-primary/20" />
        
        <DropdownMenuItem 
          onClick={resetToDefaults}
          className="font-mono text-xs hover:bg-destructive/20 text-destructive"
        >
          Reset to Defaults
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};