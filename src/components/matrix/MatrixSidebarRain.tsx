import React, { useRef, useEffect } from 'react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';

const FONT_SIZE = 14;
const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789".split('');

interface Drop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
}

export default function MatrixSidebarRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<Drop[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const { settings } = useMatrixSettings();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = 64; // Fixed width for sidebar
      canvas.height = window.innerHeight;

      // Initialize drops
      const columns = Math.floor(canvas.width / FONT_SIZE);
      dropsRef.current = Array.from({ length: columns }, (_, i) => ({
        x: i,
        y: Math.random() * -20,
        speed: 0.3 + Math.random() * 0.5,
        chars: Array.from({ length: 15 + Math.floor(Math.random() * 10) }, () => 
          GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        )
      }));
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      // Fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
      ctx.textBaseline = 'top';

      dropsRef.current.forEach((drop) => {
        // Draw trail
        drop.chars.forEach((char, i) => {
          const y = (drop.y - i) * FONT_SIZE;
          if (y >= 0 && y < canvas.height) {
            const isLead = i === 0;
            
            if (isLead) {
              ctx.fillStyle = 'rgba(200, 255, 180, 1)';
              ctx.shadowBlur = 8;
              ctx.shadowColor = 'rgba(0, 255, 140, 0.8)';
            } else {
              const alpha = Math.max(0.1, 1 - (i / drop.chars.length));
              ctx.fillStyle = `rgba(0, 255, 140, ${alpha})`;
              ctx.shadowBlur = 3;
              ctx.shadowColor = 'rgba(0, 255, 140, 0.3)';
            }
            
            ctx.fillText(char, drop.x * FONT_SIZE, y);
            ctx.shadowBlur = 0;
          }
        });

        // Update position
        drop.y += drop.speed * (settings?.globalSpeed || 1);

        // Reset when off screen
        if (drop.y * FONT_SIZE > canvas.height + drop.chars.length * FONT_SIZE) {
          drop.y = Math.random() * -20;
          drop.speed = 0.3 + Math.random() * 0.5;
          drop.chars = Array.from({ length: 15 + Math.floor(Math.random() * 10) }, () => 
            GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          );
        }

        // Random character change
        if (Math.random() < 0.05) {
          const idx = Math.floor(Math.random() * drop.chars.length);
          drop.chars[idx] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [settings]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
