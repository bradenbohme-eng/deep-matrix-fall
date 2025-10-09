import React, { useRef, useEffect } from 'react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';

// Original complex matrix rain with full physics simulation
const PRIMARY_GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ ".split('');
const SECONDARY_GLYPHS = "0123456789 ".split('');
const RARE_GLYPHS = ":=*+-<>¦｜ç・".split('');
const MIRROR_GLYPHS = new Set(SECONDARY_GLYPHS);

const FONT_SIZE = 11;
const FADE_ALPHA = 0.5;
const TRAIL_LENGTH_MEAN = 15;
const TRAIL_LENGTH_STDDEV = 6;
const TRAIL_LENGTH_MIN = 2;
const TRAIL_LENGTH_MAX = 40;

interface GlyphData { glyph: string; cooldown: number; }

function gaussianRandom(mean: number, std: number): number {
  let u1, u2;
  do { u1 = Math.random(); u2 = Math.random(); } while (u1 === 0);
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * std + mean;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Trail {
  x: number;
  rows: number;
  length: number = 0;
  speed: number = 0;
  y: number = 0;
  glyph_map: Map<number, GlyphData> = new Map();

  constructor(x: number, rows: number) {
    this.x = x;
    this.rows = rows;
    this.reset();
  }

  reset(): void {
    this.length = Math.max(TRAIL_LENGTH_MIN, Math.min(TRAIL_LENGTH_MAX, 
      Math.round(gaussianRandom(TRAIL_LENGTH_MEAN, TRAIL_LENGTH_STDDEV))));
    this.speed = 0.2 + Math.random() * 0.4;
    this.y = randomInt(-this.length, 0);
    this.glyph_map = new Map();
  }

  pickGlyph(): string {
    const r = Math.random();
    if (r < 0.7) return PRIMARY_GLYPHS[Math.floor(Math.random() * PRIMARY_GLYPHS.length)];
    if (r < 0.95) return SECONDARY_GLYPHS[Math.floor(Math.random() * SECONDARY_GLYPHS.length)];
    return RARE_GLYPHS[Math.floor(Math.random() * RARE_GLYPHS.length)];
  }

  update(): void {
    this.y += this.speed;
    const new_map = new Map<number, GlyphData>();
    
    for (let i = 0; i < this.length; i++) {
      const gy = Math.floor(this.y) - i;
      if (gy < 0 || gy >= this.rows) continue;
      
      if (!this.glyph_map.has(gy) || this.glyph_map.get(gy)!.cooldown <= 0) {
        new_map.set(gy, { glyph: this.pickGlyph(), cooldown: randomInt(15, 25) });
      } else {
        const existing = this.glyph_map.get(gy)!;
        existing.cooldown--;
        new_map.set(gy, existing);
      }
    }
    this.glyph_map = new_map;
  }

  draw(ctx: CanvasRenderingContext2D, charWidth: number, charHeight: number): void {
    const lead_pos = Math.floor(this.y);
    
    this.glyph_map.forEach((value, gy) => {
      const x = this.x * charWidth;
      const y = gy * charHeight;
      const isLead = (gy === lead_pos);
      
      ctx.fillStyle = 'black';
      ctx.fillRect(x, y, charWidth, charHeight);
      
      ctx.fillStyle = isLead ? 'rgb(200, 255, 180)' : 'rgb(0, 255, 140)';
      
      if (isLead) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgb(0, 255, 140)';
      }
      
      if (MIRROR_GLYPHS.has(value.glyph)) {
        ctx.save();
        ctx.translate(x + charWidth, y);
        ctx.scale(-1, 1);
        ctx.fillText(value.glyph, 0, charHeight * 0.8);
        ctx.restore();
      } else {
        ctx.fillText(value.glyph, x, y + charHeight * 0.8);
      }
      
      if (isLead) ctx.shadowBlur = 0;
    });
  }

  isOffScreen(): boolean {
    return this.y - this.length > this.rows;
  }
}

export default function MatrixSidebarRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const { settings } = useMatrixSettings();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let trails: Trail[] = [];
    let charWidth: number, charHeight: number, columns: number, rows: number;

    const resize = () => {
      canvas.width = 64;
      canvas.height = window.innerHeight;
      
      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
      const metrics = ctx.measureText('M');
      charWidth = metrics.width;
      charHeight = FONT_SIZE * 1.2;
      
      columns = Math.floor(canvas.width / charWidth);
      rows = Math.floor(canvas.height / charHeight);
      
      trails = [];
    };

    const animate = () => {
      ctx.fillStyle = `rgba(0, 0, 0, ${FADE_ALPHA})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      trails = trails.filter(t => !t.isOffScreen());

      const trails_per_column: { [key: number]: number } = {};
      trails.forEach(t => trails_per_column[t.x] = (trails_per_column[t.x] || 0) + 1);

      const candidate_columns = Array.from({ length: columns }, (_, i) => i)
        .filter(col => (trails_per_column[col] || 0) < 2);

      const num_to_add = randomInt(1, 3);
      for (let i = 0; i < num_to_add && candidate_columns.length > 0; i++) {
        const new_col = candidate_columns[Math.floor(Math.random() * candidate_columns.length)];
        trails.push(new Trail(new_col, rows));
        candidate_columns.splice(candidate_columns.indexOf(new_col), 1);
      }

      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
      ctx.textBaseline = 'top';
      
      trails.forEach(trail => {
        trail.update();
        trail.draw(ctx, charWidth, charHeight);
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
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
