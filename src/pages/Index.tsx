import React, { useEffect, useState } from 'react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';
import Matrix3DCanvas from '@/components/matrix/Matrix3DCanvas';
import MatrixHUD from '@/components/matrix/MatrixHUD';
import MatrixRain2D_V1 from '@/components/matrix/MatrixRain2D_V1';
import MatrixRain2D_V2 from '@/components/matrix/MatrixRain2D_V2';
import MatrixRain2D_V3 from '@/components/matrix/MatrixRain2D_V3';
import MatrixRain2D_V4 from '@/components/matrix/MatrixRain2D_V4';
import MatrixRain2D_Enhanced from '@/components/matrix/MatrixRain2D_Enhanced';
import AdvancedNeoChat from '@/components/matrix/AdvancedNeoChat';
import LeftDrawer from '@/components/matrix/LeftDrawer';
import RightDrawer from '@/components/matrix/RightDrawer';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Index = () => {
  const { settings, updateSetting } = useMatrixSettings();
  const [showMatrixControls, setShowMatrixControls] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        updateSetting('showUI', !settings.showUI);
      }
      if (e.key === ' ') {
        e.preventDefault();
        updateSetting('isPaused', !settings.isPaused);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [settings.showUI, settings.isPaused, updateSetting]);

  const renderMatrixVersion = () => {
    switch (settings.currentVersion) {
      case 1: return <MatrixRain2D_Enhanced />;
      case 2: return <MatrixRain2D_V2 />;
      case 3: return <MatrixRain2D_V3 />;
      case 4: return <MatrixRain2D_V4 />;
      default: return <MatrixRain2D_Enhanced />;
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      
      {/* Full Screen Matrix Background */}
      <div className="absolute inset-0">
        {settings.show3D ? (
          <>
            {/* 3D Matrix Background */}
            <Matrix3DCanvas />
            {/* Matrix HUD Overlay */}
            <MatrixHUD />
          </>
        ) : (
          <>
            {/* 2D Matrix Rain Versions */}
            {renderMatrixVersion()}
            {/* Matrix HUD Overlay */}
            <MatrixHUD />
          </>
        )}
      </div>

      {/* Left Drawer Toggle Button */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
          className="rounded-l-none rounded-r-lg border-l-0 bg-background/90 backdrop-blur-sm hover:bg-background/95 h-24 px-2"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${leftDrawerOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Right Drawer Toggle Button */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
          className="rounded-r-none rounded-l-lg border-r-0 bg-background/90 backdrop-blur-sm hover:bg-background/95 h-24 px-2"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${rightDrawerOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Left Drawer - Intel Operations */}
      <LeftDrawer open={leftDrawerOpen} onOpenChange={setLeftDrawerOpen} />

      {/* Right Drawer - Command & Control */}
      <RightDrawer open={rightDrawerOpen} onOpenChange={setRightDrawerOpen} />

      {/* Neo Terminal Interface - Centered */}
      <AdvancedNeoChat />

      {/* Show UI Toggle (when UI is hidden) */}
      {!settings.showUI && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => updateSetting('showUI', true)}
            className="w-10 h-10 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded flex items-center justify-center transition-all duration-300"
            title="Show UI (H)"
          >
            <span className="text-primary font-mono text-xs">UI</span>
          </button>
        </div>
      )}

      {/* Pause Indicator */}
      {settings.isPaused && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-card/80 backdrop-blur-sm border border-primary/30 rounded-lg p-6">
            <div className="text-primary font-mono text-xl text-center">
              SIMULATION PAUSED
            </div>
            <div className="text-muted-foreground font-mono text-sm text-center mt-2">
              Press SPACE to resume
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
