import React, { useRef, useEffect } from 'react';
import { useMatrixSettings } from '@/contexts/MatrixSettingsContext';

// Faithful port of the Python matrix rain logic - enhanced with settings
const PRIMARY_GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ ".split('');
const SECONDARY_GLYPHS = "0123456789 ".split('');
const RARE_GLYPHS = ":=*+-<>¦｜ç・".split('');
const ALL_GLYPHS = [...PRIMARY_GLYPHS, ...SECONDARY_GLYPHS, ...RARE_GLYPHS];
const MIRROR_GLYPHS = new Set(SECONDARY_GLYPHS);

const FONT_SIZE = 20;
const BASE_FADE_ALPHA = 0.6;
const MATRIX_GREEN = 'rgb(0, 255, 140)';
const LEAD_COLOR = 'rgb(200, 255, 180)';

// Box-Muller transform for Gaussian random numbers
function gaussianRandom(mean: number, std: number): number {
  let u1, u2;
  do {
    u1 = Math.random();
    u2 = Math.random();
  } while (u1 === 0);
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * std + mean;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface GlyphData {
  glyph: string;
  cooldown: number;
}

class Trail {
  x: number;
  rows: number;
  below_trail: Trail | null = null;
  max_gy: number;
  settings: any;
  
  length: number = 0;
  base_speed: number = 0;
  current_speed: number = 0;
  target_speed: number = 0;
  change_timer: number = 0;
  pause_timer: number = 0;
  y: number = 0;
  glyph_map: Map<number, GlyphData> = new Map();
  drop_mode: boolean = false;
  drop_timer: number = 0;
  drop_cooldown: number = 0;
  full_sync_drop_mode: boolean = false;
  full_sync_drop_timer: number = 0;
  stuck_counter: number = 0;

  constructor(x: number, rows: number, settings: any) {
    this.x = x;
    this.rows = rows;
    this.max_gy = rows - 1;
    this.settings = settings;
    this.reset();
  }

  reset(): void {
    const TRAIL_LENGTH_MEAN = 22;
    const TRAIL_LENGTH_STDDEV = 8;
    
    this.length = Math.max(
      this.settings.trailLengthMin,
      Math.min(this.settings.trailLengthMax, Math.round(gaussianRandom(TRAIL_LENGTH_MEAN, TRAIL_LENGTH_STDDEV)))
    );
    this.base_speed = this.initialSpeed(this.length);
    this.current_speed = this.base_speed;
    this.target_speed = this.base_speed;
    this.change_timer = randomInt(60, 200);
    this.pause_timer = 0;
    this.y = randomInt(-this.length, 0);
    this.glyph_map = new Map();
    this.drop_mode = false;
    this.drop_timer = 0;
    this.drop_cooldown = 0;
    this.full_sync_drop_mode = false;
    this.full_sync_drop_timer = 0;
    this.stuck_counter = 0;
  }

  initialSpeed(length: number): number {
    const minSpeed = this.settings.speedVariationMin;
    const maxSpeed = this.settings.speedVariationMax;
    
    if (length < 10) return randomFloat(minSpeed, maxSpeed * 0.3);
    if (length < 30) return randomFloat(minSpeed * 0.5, maxSpeed * 0.6);
    return randomFloat(minSpeed, maxSpeed);
  }

  setBelowTrail(below_trail: Trail | null): void {
    this.below_trail = below_trail;
  }

  pickGlyph(): string {
    const r = Math.random();
    if (r < 0.7) return PRIMARY_GLYPHS[Math.floor(Math.random() * PRIMARY_GLYPHS.length)];
    if (r < 0.95) return SECONDARY_GLYPHS[Math.floor(Math.random() * SECONDARY_GLYPHS.length)];
    return RARE_GLYPHS[Math.floor(Math.random() * RARE_GLYPHS.length)];
  }

  update(): void {
    if (this.pause_timer > 0) {
      this.pause_timer--;
      return;
    }

    if (this.drop_cooldown > 0) this.drop_cooldown--;

    const prev_y = this.y;
    this.change_timer--;
    
    if (this.change_timer <= 0) {
      const r = Math.random();
      let speed: number;
      const minSpeed = this.settings.speedVariationMin;
      const maxSpeed = this.settings.speedVariationMax;
      
      if (r < 0.8) speed = randomFloat(minSpeed, maxSpeed * 0.3);
      else if (r < 0.98) speed = randomFloat(minSpeed * 0.5, maxSpeed * 0.6);
      else speed = randomFloat(minSpeed, maxSpeed);
      
      this.target_speed = Math.max(minSpeed, speed);
      this.change_timer = randomInt(60, 200);
      
      if (Math.random() < 0.0002) {
        this.pause_timer = randomInt(1, 3);
      }
    }

    // Collision detection with below trail
    if (this.below_trail) {
      const distance_to_below = this.below_trail.y - this.y - this.length;
      if (distance_to_below >= 0 && distance_to_below <= 1 && !this.drop_mode && !this.full_sync_drop_mode) {
        this.drop_mode = true;
        this.drop_timer = randomInt(15, 40);
        this.current_speed = 0;
      } else if (distance_to_below < 0) {
        this.current_speed = 0;
      } else if (distance_to_below < 5) {
        this.current_speed = Math.min(this.current_speed, 0.01);
      } else {
        this.current_speed += (this.target_speed - this.current_speed) * 0.05;
      }
    } else {
      this.current_speed += (this.target_speed - this.current_speed) * 0.05;
    }

    // Update position (affected by global speed)
    if (!this.drop_mode && !this.full_sync_drop_mode) {
      this.y += this.current_speed * this.settings.globalSpeed;
    }

    // Random drop mode (affected by drop spawn rate)
    const dropChance = 0.02 * this.settings.dropSpawnRate;
    if (!this.drop_mode && !this.full_sync_drop_mode && 
        this.drop_cooldown === 0 && this.pause_timer === 0 && 
        Math.random() < dropChance) {
      this.drop_mode = true;
      this.drop_timer = randomInt(1, 7);
      this.current_speed = 0;
    }

    // Random full sync drop mode
    const fullSyncDropChance = 0.04 * this.settings.dropSpawnRate;
    if (!this.drop_mode && !this.full_sync_drop_mode && 
        this.drop_cooldown === 0 && this.pause_timer === 0 && 
        Math.random() < fullSyncDropChance) {
      this.full_sync_drop_mode = true;
      this.full_sync_drop_timer = randomInt(2, 30);
    }

    // Handle drop mode
    if (this.drop_mode) {
      const new_map = new Map<number, GlyphData>();
      for (const [gy, val] of this.glyph_map.entries()) {
        const new_gy = gy + 1;
        if (new_gy < this.rows && (!this.below_trail || !this.below_trail.glyph_map.has(new_gy))) {
          new_map.set(new_gy, val);
        }
      }
      if (new_map.size > 0) this.glyph_map = new_map;
      
      this.drop_timer--;
      if (this.drop_timer <= 0) {
        this.drop_mode = false;
        this.drop_cooldown = randomInt(600, 1000);
        this.current_speed = this.base_speed;
      }
    }

    // Handle full sync drop mode
    else if (this.full_sync_drop_mode) {
      const new_map = new Map<number, GlyphData>();
      const sorted_keys = Array.from(this.glyph_map.keys()).sort((a, b) => b - a);
      
      for (const gy of sorted_keys) {
        const new_gy = gy + 1;
        if (new_gy < this.rows && (!this.below_trail || !this.below_trail.glyph_map.has(new_gy))) {
          new_map.set(new_gy, this.glyph_map.get(gy)!);
        }
      }
      
      if (new_map.size > 0) {
        this.glyph_map = new_map;
        this.y++;
      }
      
      this.full_sync_drop_timer--;
      if (this.full_sync_drop_timer <= 0) {
        this.full_sync_drop_mode = false;
        this.drop_cooldown = randomInt(600, 1000);
        this.current_speed = this.base_speed;
      }
    }

    // Update glyphs (character change frequency controlled by settings)
    const new_glyph_map = new Map<number, GlyphData>();
    for (let i = 0; i < this.length; i++) {
      const gy = Math.floor(this.y) - i;
      if (gy < 0 || gy >= this.rows) continue;
      
      const cooldownMod = 20 + Math.floor(10 / this.settings.characterChangeFreq);
      if (!this.glyph_map.has(gy) || this.glyph_map.get(gy)!.cooldown <= 0) {
        const g = this.pickGlyph();
        const cooldown = randomInt(cooldownMod, cooldownMod + 10);
        new_glyph_map.set(gy, { glyph: g, cooldown });
      } else {
        const existing = this.glyph_map.get(gy)!;
        existing.cooldown--;
        new_glyph_map.set(gy, existing);
      }
    }
    this.glyph_map = new_glyph_map;

    // Random collapse (affected by settings)
    const collapseChance = 0.004 * this.settings.dropSpawnRate;
    if (Math.random() < collapseChance && this.glyph_map.size > 0) {
      const segment = Math.random() < 0.5 ? 0.5 : 0.66;
      const min_y = Math.floor(this.y - this.length * segment);
      const collapse_map = new Map<number, GlyphData>();
      
      for (const [gy, val] of this.glyph_map.entries()) {
        if (gy >= min_y && gy + 1 < this.rows) {
          if (!this.below_trail || !this.below_trail.glyph_map.has(gy + 1)) {
            collapse_map.set(gy + 1, val);
          } else {
            collapse_map.set(gy, val);
          }
        } else {
          collapse_map.set(gy, val);
        }
      }
      this.glyph_map = collapse_map;
    }

    // Stuck detection
    if (Math.abs(this.y - prev_y) < 0.01 && !this.drop_mode && !this.full_sync_drop_mode) {
      this.stuck_counter++;
      if (this.stuck_counter > 100) this.reset();
    } else {
      this.stuck_counter = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D, charWidth: number, charHeight: number): void {
    const lead_pos = Math.floor(this.y);
    
    this.glyph_map.forEach((value, gy) => {
      if (gy > this.max_gy) return;
      
      const x = this.x * charWidth;
      const y = gy * charHeight;
      const isLead = (gy === lead_pos);
      
      // Clear background
      ctx.fillStyle = `rgba(0, 0, 0, ${this.settings.backgroundOpacity})`;
      ctx.fillRect(x, y, charWidth, charHeight);
      
      // Set color with saturation control
      if (isLead) {
        ctx.fillStyle = `rgba(200, 255, 180, ${this.settings.leadCharacterBrightness})`;
        ctx.shadowBlur = this.settings.glowRadius * this.settings.glowIntensity;
        ctx.shadowColor = `rgba(0, 255, 140, ${this.settings.glowIntensity})`;
      } else {
        const alpha = this.settings.colorSaturation;
        ctx.fillStyle = `rgba(0, 255, 140, ${alpha})`;
        ctx.shadowBlur = this.settings.glowRadius * 0.3;
        ctx.shadowColor = `rgba(0, 255, 140, ${this.settings.glowIntensity * 0.5})`;
      }
      
      // Draw glyph (mirrored if needed)
      if (MIRROR_GLYPHS.has(value.glyph)) {
        ctx.save();
        ctx.translate(x + charWidth, y);
        ctx.scale(-1, 1);
        ctx.fillText(value.glyph, 0, charHeight * 0.8);
        ctx.restore();
      } else {
        ctx.fillText(value.glyph, x, y + charHeight * 0.8);
      }
      
      ctx.shadowBlur = 0;
    });
  }

  isOffScreen(): boolean {
    return this.y - this.length > this.rows;
  }
}

export default function MatrixRain2D_Enhanced() {
  const { settings } = useMatrixSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let trails: Trail[] = [];
    let charWidth: number, charHeight: number, columns: number, rows: number;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
      const metrics = ctx.measureText('M');
      charWidth = metrics.width;
      charHeight = FONT_SIZE * 1.2;
      
      columns = Math.floor(canvas.width / charWidth);
      rows = Math.floor(canvas.height / charHeight);
      
      trails = [];
    }

    function animate() {
      if (settings.isPaused) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }

      // Fade effect (controlled by settings)
      ctx.fillStyle = `rgba(0, 0, 0, ${settings.fadeRate})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Remove off-screen trails
      trails = trails.filter(t => !t.isOffScreen());

      // Spawn new trails (controlled by drop spawn rate)
      const trails_per_column: { [key: number]: number } = {};
      trails.forEach(t => {
        trails_per_column[t.x] = (trails_per_column[t.x] || 0) + 1;
      });

      const candidate_columns = Array.from({ length: columns }, (_, i) => i)
        .filter(col => (trails_per_column[col] || 0) < 2);

      const base_trails = columns * rows * 0.01 * settings.dropSpawnRate;
      const min_trails_add = Math.max(1, Math.floor(base_trails) - 1);
      const max_trails_add = Math.floor(base_trails) + 1;
      const num_to_add = randomInt(min_trails_add, max_trails_add);

      for (let i = 0; i < num_to_add && candidate_columns.length > 0; i++) {
        const new_col = candidate_columns[Math.floor(Math.random() * candidate_columns.length)];
        trails.push(new Trail(new_col, rows, settings));
        trails_per_column[new_col] = (trails_per_column[new_col] || 0) + 1;
        candidate_columns.splice(candidate_columns.indexOf(new_col), 1);
      }

      // Group trails by column and set relationships
      const trails_by_column: { [key: number]: Trail[] } = {};
      trails.forEach(t => {
        if (!trails_by_column[t.x]) trails_by_column[t.x] = [];
        trails_by_column[t.x].push(t);
      });

      for (const col in trails_by_column) {
        const col_trails = trails_by_column[col].sort((a, b) => a.y - b.y);
        for (let i = 0; i < col_trails.length; i++) {
          col_trails[i].setBelowTrail(i < col_trails.length - 1 ? col_trails[i + 1] : null);
          if (i < col_trails.length - 1) {
            col_trails[i].max_gy = Math.floor(col_trails[i + 1].y - col_trails[i + 1].length) - 1;
          } else {
            col_trails[i].max_gy = rows - 1;
          }
        }
      }

      // Update and draw trails
      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
      ctx.textBaseline = 'top';
      
      trails.forEach(trail => {
        trail.update();
        trail.draw(ctx, charWidth, charHeight);
      });

      animationFrameId.current = requestAnimationFrame(animate);
    }

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
      className="absolute top-0 left-0 w-full h-full bg-matrix-background pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}