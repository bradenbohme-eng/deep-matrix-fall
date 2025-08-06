import React, { useState } from 'react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Play, Pause, RotateCcw, Settings, Eye, EyeOff } from 'lucide-react';

const MatrixSettingsPanel: React.FC = () => {
  const { settings, updateSetting, loadPreset, resetToDefaults } = useMatrixSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    global: true,
    rain: false,
    visual: false,
    environment: false,
    performance: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!settings.showUI) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className={`w-80 bg-card/90 backdrop-blur-sm border-primary/30 transition-all duration-300 ${
        isOpen ? 'max-h-[90vh] overflow-y-auto' : 'h-auto'
      }`}>
        
        {/* Header */}
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-primary" />
              <span className="text-primary font-mono text-sm">MATRIX CONTROL</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-primary hover:bg-primary/20"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          {/* Quick Controls */}
          <div className="flex items-center space-x-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSetting('isPaused', !settings.isPaused)}
              className="flex items-center space-x-1"
            >
              {settings.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              <span className="text-xs">{settings.isPaused ? 'Resume' : 'Pause'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSetting('showUI', false)}
              className="flex items-center space-x-1"
            >
              <EyeOff className="w-3 h-3" />
              <span className="text-xs">Hide</span>
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="p-4 space-y-4">
            
            {/* Presets */}
            <div>
              <h3 className="text-primary font-mono text-xs mb-2">PRESETS</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(settings).length > 0 && ['classic', 'intense', 'zen', 'chaos'].map(preset => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => loadPreset(preset as any)}
                    className="text-xs capitalize"
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-primary/20" />

            {/* Global Controls */}
            <Collapsible open={openSections.global} onOpenChange={() => toggleSection('global')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-primary font-mono text-xs hover:text-primary-glow">
                GLOBAL CONTROLS
                <ChevronDown className={`w-3 h-3 transition-transform ${openSections.global ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-muted-foreground">Speed</label>
                    <Badge variant="outline" className="text-xs">{settings.globalSpeed}x</Badge>
                  </div>
                  <Slider
                    value={[settings.globalSpeed]}
                    onValueChange={([value]) => updateSetting('globalSpeed', value)}
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSetting('show3D', !settings.show3D)}
                    className="flex-1 text-xs"
                  >
                    {settings.show3D ? '2D Mode' : '3D Mode'}
                  </Button>
                  {!settings.show3D && (
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4].map(v => (
                        <Button
                          key={v}
                          variant={settings.currentVersion === v ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSetting('currentVersion', v)}
                          className="w-8 h-8 p-0 text-xs"
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="bg-primary/20" />

            {/* Matrix Rain Settings */}
            <Collapsible open={openSections.rain} onOpenChange={() => toggleSection('rain')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-primary font-mono text-xs hover:text-primary-glow">
                MATRIX RAIN
                <ChevronDown className={`w-3 h-3 transition-transform ${openSections.rain ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-muted-foreground">Drop Rate</label>
                    <Badge variant="outline" className="text-xs">{settings.dropSpawnRate}</Badge>
                  </div>
                  <Slider
                    value={[settings.dropSpawnRate]}
                    onValueChange={([value]) => updateSetting('dropSpawnRate', value)}
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-muted-foreground">Min Length</label>
                      <Badge variant="outline" className="text-xs">{settings.trailLengthMin}</Badge>
                    </div>
                    <Slider
                      value={[settings.trailLengthMin]}
                      onValueChange={([value]) => updateSetting('trailLengthMin', value)}
                      min={5}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-muted-foreground">Max Length</label>
                      <Badge variant="outline" className="text-xs">{settings.trailLengthMax}</Badge>
                    </div>
                    <Slider
                      value={[settings.trailLengthMax]}
                      onValueChange={([value]) => updateSetting('trailLengthMax', value)}
                      min={10}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-muted-foreground">Character Change Freq</label>
                    <Badge variant="outline" className="text-xs">{settings.characterChangeFreq}</Badge>
                  </div>
                  <Slider
                    value={[settings.characterChangeFreq]}
                    onValueChange={([value]) => updateSetting('characterChangeFreq', value)}
                    min={0.1}
                    max={3.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="bg-primary/20" />

            {/* Visual Effects */}
            <Collapsible open={openSections.visual} onOpenChange={() => toggleSection('visual')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-primary font-mono text-xs hover:text-primary-glow">
                VISUAL EFFECTS
                <ChevronDown className={`w-3 h-3 transition-transform ${openSections.visual ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-muted-foreground">Glow Intensity</label>
                    <Badge variant="outline" className="text-xs">{settings.glowIntensity}</Badge>
                  </div>
                  <Slider
                    value={[settings.glowIntensity]}
                    onValueChange={([value]) => updateSetting('glowIntensity', value)}
                    min={0.0}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-muted-foreground">Glow Radius</label>
                    <Badge variant="outline" className="text-xs">{settings.glowRadius}</Badge>
                  </div>
                  <Slider
                    value={[settings.glowRadius]}
                    onValueChange={([value]) => updateSetting('glowRadius', value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-muted-foreground">Fade Rate</label>
                    <Badge variant="outline" className="text-xs">{settings.fadeRate}</Badge>
                  </div>
                  <Slider
                    value={[settings.fadeRate]}
                    onValueChange={([value]) => updateSetting('fadeRate', value)}
                    min={0.01}
                    max={0.2}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-muted-foreground">Lead Brightness</label>
                    <Badge variant="outline" className="text-xs">{settings.leadCharacterBrightness}</Badge>
                  </div>
                  <Slider
                    value={[settings.leadCharacterBrightness]}
                    onValueChange={([value]) => updateSetting('leadCharacterBrightness', value)}
                    min={1.0}
                    max={3.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="bg-primary/20" />

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="w-full flex items-center space-x-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-xs">Reset to Defaults</span>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MatrixSettingsPanel;