import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const MATRIX_QUOTES = [
  "Wake up, Neo...",
  "The Matrix has you",
  "Follow the white rabbit",
  "There is no spoon",
  "Welcome to the real world",
  "Free your mind",
  "What is real?",
  "The chosen one"
];

export default function MatrixHUD() {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % MATRIX_QUOTES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {/* Top HUD */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-auto">
        <Card className="bg-card/80 backdrop-blur-sm border-primary/30 p-4">
          <div className="text-primary font-mono text-sm">
            <div className="text-primary-glow">MATRIX SIMULATION</div>
            <div className="text-muted-foreground mt-1">Status: ACTIVE</div>
          </div>
        </Card>
        
        <Button
          variant="outline"
          className="bg-card/80 backdrop-blur-sm border-primary/30 text-primary hover:bg-primary/20"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? 'Hide HUD' : 'Show HUD'}
        </Button>
      </div>

      {/* Center Quote */}
      {isVisible && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-center">
            <h1 className="text-6xl font-bold bg-gradient-cyber bg-clip-text text-transparent mb-4 animate-pulse">
              THE MATRIX
            </h1>
            <p className="text-xl text-primary-glow font-mono animate-fade-in">
              {MATRIX_QUOTES[currentQuote]}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      {isVisible && (
        <div className="absolute bottom-6 left-6 right-6 flex justify-center">
          <Card className="bg-card/80 backdrop-blur-sm border-primary/30 p-4">
            <div className="text-center text-primary font-mono text-sm">
              <div>Mouse: Rotate • Scroll: Zoom • Drag: Pan</div>
              <div className="text-muted-foreground mt-1">Navigate the Matrix</div>
            </div>
          </Card>
        </div>
      )}

      {/* Matrix Code Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="w-full h-full bg-gradient-matrix"></div>
      </div>
    </div>
  );
}