import React, { useRef, useEffect } from 'react';

// Optimized version with better performance
const PRIMARY_GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ ".split('');
const SECONDARY_GLYPHS = "0123456789 ".split('');
const RARE_GLYPHS = ":=*+-<>¦｜ç・".split('');

const config = {
  fontSize: 18,
  fadeAlpha: 0.08,
  matrixGreen: '#00ff8c',
  leadColor: '#c8ffb4',
  trailLength: { mean: 20, std: 6, min: 3, max: 40 },
  speeds: {
    short: [0.2, 0.4],
    med: [0.6, 0.8],
    long: [1.0, 1.5],
    extra: [1.5, 3.0]
  },
  chances: {
    dropMode: 0.015,
    fullSyncDrop: 0.03,
    collapse: 0.002,
    pause: 0.0001
  },
  timers: {
    change: [40, 120],
    pause: [1, 4],
    drop: [2, 10],
    fullSyncDrop: [3, 20],
    dropCooldown: [300, 600],
    glyphCooldown: [15, 25]
  },
  scaling: 0.012
};

class OptimizedTrail {
  x: number;
  y: number = 0;
  length: number;
  speed: number;
  targetSpeed: number;
  glyphs: Array<{ char: string; alpha: number }> = [];
  changeTimer: number = 0;
  pauseTimer: number = 0;
  dropMode: boolean = false;
  dropTimer: number = 0;
  cooldown: number = 0;
  
  constructor(x: number, rows: number) {
    this.x = x;
    this.length = this.gaussianRandom(config.trailLength.mean, config.trailLength.std);
    this.length = Math.max(config.trailLength.min, Math.min(config.trailLength.max, this.length));
    this.speed = this.getRandomSpeed();
    this.targetSpeed = this.speed;
    this.y = -this.length * Math.random();
    this.initGlyphs();
    this.changeTimer = this.randomInt(config.timers.change[0], config.timers.change[1]);
  }

  gaussianRandom(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.round(z0 * std + mean);
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getRandomSpeed(): number {
    const r = Math.random();
    if (r < 0.6) return this.randomFloat(config.speeds.short[0], config.speeds.short[1]);
    if (r < 0.85) return this.randomFloat(config.speeds.med[0], config.speeds.med[1]);
    if (r < 0.95) return this.randomFloat(config.speeds.long[0], config.speeds.long[1]);
    return this.randomFloat(config.speeds.extra[0], config.speeds.extra[1]);
  }

  randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  pickGlyph(): string {
    const r = Math.random();
    if (r < 0.75) return PRIMARY_GLYPHS[Math.floor(Math.random() * PRIMARY_GLYPHS.length)];
    if (r < 0.95) return SECONDARY_GLYPHS[Math.floor(Math.random() * SECONDARY_GLYPHS.length)];
    return RARE_GLYPHS[Math.floor(Math.random() * RARE_GLYPHS.length)];
  }

  initGlyphs(): void {
    this.glyphs = [];
    for (let i = 0; i < this.length; i++) {
      this.glyphs.push({
        char: this.pickGlyph(),
        alpha: Math.max(0.1, 1 - (i / this.length) * 0.8)
      });
    }
  }

  update(rows: number, belowTrail?: OptimizedTrail): void {
    if (this.pauseTimer > 0) {
      this.pauseTimer--;
      return;
    }

    if (this.cooldown > 0) this.cooldown--;

    // Speed changes
    this.changeTimer--;
    if (this.changeTimer <= 0) {
      this.targetSpeed = this.getRandomSpeed();
      this.changeTimer = this.randomInt(config.timers.change[0], config.timers.change[1]);
      
      if (Math.random() < config.chances.pause) {
        this.pauseTimer = this.randomInt(config.timers.pause[0], config.timers.pause[1]);
      }
    }

    // Collision detection
    if (belowTrail) {
      const distance = belowTrail.y - this.y - this.length;
      if (distance < 2 && !this.dropMode) {
        this.dropMode = true;
        this.dropTimer = this.randomInt(config.timers.drop[0], config.timers.drop[1]);
      } else if (distance < 0) {
        this.speed = 0;
      } else {
        this.speed += (this.targetSpeed - this.speed) * 0.1;
      }
    } else {
      this.speed += (this.targetSpeed - this.speed) * 0.1;
    }

    // Drop modes
    if (!this.dropMode && this.cooldown === 0 && Math.random() < config.chances.dropMode) {
      this.dropMode = true;
      this.dropTimer = this.randomInt(config.timers.drop[0], config.timers.drop[1]);
    }

    if (this.dropMode) {
      this.dropTimer--;
      if (this.dropTimer <= 0) {
        this.dropMode = false;
        this.cooldown = this.randomInt(config.timers.dropCooldown[0], config.timers.dropCooldown[1]);
      }
    } else {
      this.y += this.speed;
    }

    // Update glyphs
    if (Math.random() < 0.1) {
      const idx = Math.floor(Math.random() * this.glyphs.length);
      this.glyphs[idx].char = this.pickGlyph();
    }

    // Collapse effect
    if (Math.random() < config.chances.collapse && this.glyphs.length > 3) {
      const removeCount = Math.floor(this.glyphs.length * 0.2);
      this.glyphs.splice(Math.floor(this.glyphs.length * 0.6), removeCount);
      this.length = this.glyphs.length;
    }
  }

  draw(ctx: CanvasRenderingContext2D, charWidth: number, charHeight: number): void {
    for (let i = 0; i < this.glyphs.length; i++) {
      const gy = Math.floor(this.y - i);
      if (gy < 0) continue;
      
      const x = this.x * charWidth;
      const y = gy * charHeight;
      const glyph = this.glyphs[i];
      
      // Lead character highlighting
      const isLead = i === 0;
      let alpha = glyph.alpha;
      
      if (isLead) {
        ctx.fillStyle = config.leadColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = config.matrixGreen;
        alpha = 1;
      } else {
        ctx.fillStyle = config.matrixGreen;
        ctx.shadowBlur = 0;
      }
      
      ctx.globalAlpha = alpha;
      ctx.fillText(glyph.char, x, y);
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  isOffScreen(rows: number): boolean {
    return this.y > rows + this.length;
  }
}

export default function MatrixRain2D_V2() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let trails: OptimizedTrail[] = [];
    let charWidth: number, charHeight: number, columns: number, rows: number;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      ctx.font = `${config.fontSize}px 'Courier New', monospace`;
      ctx.textBaseline = 'top';
      
      const metrics = ctx.measureText('M');
      charWidth = metrics.width;
      charHeight = config.fontSize * 1.1;
      
      columns = Math.floor(canvas.width / charWidth);
      rows = Math.floor(canvas.height / charHeight);
      
      trails = [];
      console.log('MatrixRain2D_V2 initialized:', { columns, rows, charWidth, charHeight });
    }

    function animate() {
      // Efficient fade
      ctx.fillStyle = `rgba(0, 0, 0, ${config.fadeAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Remove off-screen trails
      trails = trails.filter(t => !t.isOffScreen(rows));

      // Spawn trails more efficiently
      const trailsPerColumn = new Array(columns).fill(0);
      trails.forEach(t => trailsPerColumn[t.x]++);

      const maxTrails = Math.floor(columns * rows * config.scaling);
      for (let i = 0; i < maxTrails && trails.length < maxTrails; i++) {
        const availableColumns = trailsPerColumn
          .map((count, idx) => ({ count, idx }))
          .filter(col => col.count < 2)
          .map(col => col.idx);
        
        if (availableColumns.length === 0) break;
        
        const newCol = availableColumns[Math.floor(Math.random() * availableColumns.length)];
        trails.push(new OptimizedTrail(newCol, rows));
        trailsPerColumn[newCol]++;
      }

      // Sort and update trails
      const trailsByColumn: { [key: number]: OptimizedTrail[] } = {};
      trails.forEach(t => {
        if (!trailsByColumn[t.x]) trailsByColumn[t.x] = [];
        trailsByColumn[t.x].push(t);
      });

      Object.values(trailsByColumn).forEach(colTrails => {
        colTrails.sort((a, b) => a.y - b.y);
        colTrails.forEach((trail, idx) => {
          const belowTrail = idx < colTrails.length - 1 ? colTrails[idx + 1] : undefined;
          trail.update(rows, belowTrail);
        });
      });

      // Draw all trails
      ctx.font = `${config.fontSize}px 'Courier New', monospace`;
      trails.forEach(trail => trail.draw(ctx, charWidth, charHeight));

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
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full bg-matrix-background pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}