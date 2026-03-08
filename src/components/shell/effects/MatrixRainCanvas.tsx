// Tier 3: High-performance Matrix rain — GPU-accelerated canvas
// Canon §21A.3: "Procedural textures create depth without image dependencies"

import React, { useRef, useEffect, useCallback } from 'react';

interface MatrixRainCanvasProps {
  className?: string;
  density?: number;       // columns per 100px width
  speed?: number;         // base fall speed multiplier
  opacity?: number;       // overall opacity
  glowIntensity?: number; // head glow strength
  variant?: 'sidebar' | 'ambient' | 'hero';
}

const KATAKANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
const DIGITS = '0123456789';
const SYMBOLS = ':=*+-<>¦｜·';
const ALL_GLYPHS = KATAKANA + DIGITS + SYMBOLS;

const PRESETS = {
  sidebar: { fontSize: 11, fadeAlpha: 0.06, trailMin: 4, trailMax: 20, spawnRate: 0.04 },
  ambient: { fontSize: 14, fadeAlpha: 0.03, trailMin: 8, trailMax: 35, spawnRate: 0.02 },
  hero:    { fontSize: 16, fadeAlpha: 0.04, trailMin: 10, trailMax: 40, spawnRate: 0.03 },
};

interface Drop {
  x: number;
  y: number;
  speed: number;
  length: number;
  glyphs: string[];
  glyphTimer: number;
}

const MatrixRainCanvas: React.FC<MatrixRainCanvasProps> = ({
  className = '',
  density = 8,
  speed = 1,
  opacity = 0.6,
  glowIntensity = 0.8,
  variant = 'sidebar',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const dropsRef = useRef<Drop[]>([]);
  const dimRef = useRef({ w: 0, h: 0, cols: 0, rows: 0, charW: 0, charH: 0 });

  const preset = PRESETS[variant];

  const randomGlyph = useCallback(() => ALL_GLYPHS[Math.floor(Math.random() * ALL_GLYPHS.length)], []);

  const createDrop = useCallback((cols: number, rows: number, startTop = false): Drop => {
    const length = preset.trailMin + Math.floor(Math.random() * (preset.trailMax - preset.trailMin));
    const glyphs: string[] = [];
    for (let i = 0; i < length; i++) glyphs.push(randomGlyph());
    return {
      x: Math.floor(Math.random() * cols),
      y: startTop ? -length : Math.floor(Math.random() * rows) - length,
      speed: (0.3 + Math.random() * 0.7) * speed,
      length,
      glyphs,
      glyphTimer: 0,
    };
  }, [preset, speed, randomGlyph]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let running = true;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);

      ctx.font = `${preset.fontSize}px 'Courier New', monospace`;
      const m = ctx.measureText('M');
      const charW = m.width;
      const charH = preset.fontSize * 1.3;
      const cols = Math.floor(rect.width / charW);
      const rows = Math.ceil(rect.height / charH);
      dimRef.current = { w: rect.width, h: rect.height, cols, rows, charW, charH };

      // Initialize drops
      const numDrops = Math.max(1, Math.floor(rect.width / 100 * density));
      dropsRef.current = Array.from({ length: numDrops }, () => createDrop(cols, rows, false));
    };

    const draw = () => {
      if (!running) return;
      const { cols, rows, charW, charH } = dimRef.current;
      if (cols === 0) { frameRef.current = requestAnimationFrame(draw); return; }

      // Fade existing content
      ctx.fillStyle = `rgba(0, 0, 0, ${preset.fadeAlpha})`;
      ctx.fillRect(0, 0, dimRef.current.w, dimRef.current.h);

      ctx.font = `${preset.fontSize}px 'Courier New', monospace`;
      ctx.textBaseline = 'top';

      const drops = dropsRef.current;

      for (let d = drops.length - 1; d >= 0; d--) {
        const drop = drops[d];
        drop.y += drop.speed;
        drop.glyphTimer++;

        // Mutate random glyphs periodically
        if (drop.glyphTimer > 6) {
          drop.glyphTimer = 0;
          const idx = Math.floor(Math.random() * drop.glyphs.length);
          drop.glyphs[idx] = randomGlyph();
        }

        const headY = Math.floor(drop.y);

        for (let i = 0; i < drop.length; i++) {
          const gy = headY - i;
          if (gy < 0 || gy >= rows) continue;

          const px = drop.x * charW;
          const py = gy * charH;
          const isHead = i === 0;
          const tailFactor = 1 - (i / drop.length);

          if (isHead) {
            // Bright head with glow
            ctx.shadowBlur = 8 * glowIntensity;
            ctx.shadowColor = `rgba(0, 255, 120, ${0.6 * glowIntensity})`;
            ctx.fillStyle = `rgba(180, 255, 200, ${0.95 * tailFactor})`;
          } else {
            ctx.shadowBlur = 0;
            const g = Math.floor(140 + 115 * tailFactor);
            const a = 0.15 + 0.7 * tailFactor;
            ctx.fillStyle = `rgba(0, ${g}, 60, ${a})`;
          }

          ctx.fillText(drop.glyphs[i % drop.glyphs.length], px, py);
          if (isHead) ctx.shadowBlur = 0;
        }

        // Recycle off-screen drops
        if (headY - drop.length > rows) {
          drops[d] = createDrop(cols, rows, true);
        }
      }

      // Spawn new drops occasionally
      if (Math.random() < preset.spawnRate && drops.length < cols * 2) {
        drops.push(createDrop(cols, rows, true));
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    resize();
    draw();

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [preset, density, speed, glowIntensity, createDrop, randomGlyph]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
    />
  );
};

export default MatrixRainCanvas;
