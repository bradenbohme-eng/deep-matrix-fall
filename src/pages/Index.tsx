import React, { useState } from 'react';
import AdvancedNeoChat from '@/components/matrix/AdvancedNeoChat';
import LeftDrawer from '@/components/matrix/LeftDrawer';
import RightDrawer from '@/components/matrix/RightDrawer';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Index = () => {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex bg-background">
      {/* Left Drawer Toggle Button */}
      {!leftDrawerOpen && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLeftDrawerOpen(true)}
            className="rounded-l-none rounded-r-lg border-l-0 bg-background/90 backdrop-blur-sm hover:bg-primary/20 h-24 px-2 border-primary/30"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Left Drawer - Intel Operations */}
      <LeftDrawer open={leftDrawerOpen} onOpenChange={setLeftDrawerOpen} />

      {/* Main Content Area - Neo Terminal (Full Width) */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${leftDrawerOpen ? 'ml-2' : 'ml-0'} ${rightDrawerOpen ? 'mr-2' : 'mr-0'}`}>
        <AdvancedNeoChat />
      </div>

      {/* Right Drawer - Command & Control */}
      <RightDrawer open={rightDrawerOpen} onOpenChange={setRightDrawerOpen} />

      {/* Right Drawer Toggle Button */}
      {!rightDrawerOpen && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRightDrawerOpen(true)}
            className="rounded-r-none rounded-l-lg border-r-0 bg-background/90 backdrop-blur-sm hover:bg-primary/20 h-24 px-2 border-primary/30"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
