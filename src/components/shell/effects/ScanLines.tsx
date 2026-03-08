// Tier 2: CRT scan lines + noise grain overlay
// Canon §21A: Procedural textures that create depth without images

import React, { useRef, useEffect } from 'react';

interface ScanLinesProps {
  opacity?: number;
  scanLineGap?: number;
  noiseOpacity?: number;
}

const ScanLines: React.FC<ScanLinesProps> = ({
  opacity = 0.03,
  scanLineGap = 3,
  noiseOpacity = 0.015,
}) => {
  const noiseRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = noiseRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 256;
    canvas.height = 256;

    const imageData = ctx.createImageData(256, 256);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    // Animate noise at low framerate for subtle flicker
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      if (frame % 3 !== 0) return; // Only update every 3rd tick
      for (let i = 0; i < data.length; i += 16) { // Sparse update for perf
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
      }
      ctx.putImageData(imageData, 0, 0);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* CRT Scan Lines */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999]"
        style={{
          opacity,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent ${scanLineGap - 1}px,
            rgba(0, 0, 0, 0.3) ${scanLineGap - 1}px,
            rgba(0, 0, 0, 0.3) ${scanLineGap}px
          )`,
        }}
      />
      {/* Noise Grain */}
      <canvas
        ref={noiseRef}
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{
          width: '100%',
          height: '100%',
          opacity: noiseOpacity,
          mixBlendMode: 'overlay',
        }}
      />
      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[9997]"
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)`,
        }}
      />
    </>
  );
};

export default ScanLines;
