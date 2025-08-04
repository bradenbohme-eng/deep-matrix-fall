import React, { useRef, useEffect } from 'react';

// Simplified but sophisticated version focusing on visual appeal
const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:=*+-<>¦｜ç・".split('');

interface DropletState {
  x: number;
  y: number;
  speed: number;
  baseSpeed: number;
  targetSpeed: number;
  length: number;
  chars: string[];
  alphas: number[];
  changeTimer: number;
  pauseTimer: number;
  dropTimer: number;
  isDropping: boolean;
  glowIntensity: number;
  lastUpdate: number;
}

export default function MatrixRain2D_V4() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let droplets: DropletState[] = [];
    let charWidth = 14;
    let charHeight = 20;
    let columns = 0;
    let rows = 0;
    let lastTime = 0;

    // Gaussian random number generator
    function gaussian(mean: number, stdDev: number): number {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return z0 * stdDev + mean;
    }

    function createDroplet(column: number): DropletState {
      const length = Math.max(3, Math.min(50, Math.round(gaussian(18, 8))));
      const baseSpeed = length < 10 ? 0.2 + Math.random() * 0.3 : 
                       length < 25 ? 0.4 + Math.random() * 0.4 : 
                       0.6 + Math.random() * 1.2;
      
      return {
        x: column,
        y: -length - Math.random() * 10,
        speed: baseSpeed,
        baseSpeed,
        targetSpeed: baseSpeed,
        length,
        chars: Array.from({ length }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]),
        alphas: Array.from({ length }, (_, i) => Math.max(0.1, 1 - (i / length) * 0.9)),
        changeTimer: 40 + Math.random() * 80,
        pauseTimer: 0,
        dropTimer: 0,
        isDropping: false,
        glowIntensity: 0.5 + Math.random() * 0.5,
        lastUpdate: 0
      };
    }

    function updateDroplet(droplet: DropletState, deltaTime: number): void {
      droplet.lastUpdate += deltaTime;
      
      if (droplet.pauseTimer > 0) {
        droplet.pauseTimer -= deltaTime;
        return;
      }

      // Speed changes and behaviors
      droplet.changeTimer -= deltaTime;
      if (droplet.changeTimer <= 0) {
        const speedVariation = 0.8 + Math.random() * 0.4;
        droplet.targetSpeed = droplet.baseSpeed * speedVariation;
        droplet.changeTimer = 30 + Math.random() * 100;
        
        // Random pause
        if (Math.random() < 0.002) {
          droplet.pauseTimer = 20 + Math.random() * 60;
        }
      }

      // Smooth speed interpolation
      droplet.speed += (droplet.targetSpeed - droplet.speed) * 0.08;

      // Drop mode logic
      if (!droplet.isDropping && Math.random() < 0.015) {
        droplet.isDropping = true;
        droplet.dropTimer = 30 + Math.random() * 100;
        droplet.speed = 0;
      }

      if (droplet.isDropping) {
        droplet.dropTimer -= deltaTime;
        if (droplet.dropTimer <= 0) {
          droplet.isDropping = false;
          droplet.speed = droplet.baseSpeed;
        }
      } else {
        droplet.y += droplet.speed;
      }

      // Character mutations
      if (Math.random() < 0.03) {
        const idx = Math.floor(Math.random() * droplet.chars.length);
        droplet.chars[idx] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }

      // Collapse effect
      if (Math.random() < 0.001 && droplet.length > 5) {
        const collapsePoint = Math.floor(droplet.length * (0.4 + Math.random() * 0.4));
        droplet.chars.splice(collapsePoint, 1);
        droplet.alphas.splice(collapsePoint, 1);
        droplet.length = droplet.chars.length;
      }

      // Glow intensity variation
      droplet.glowIntensity += (Math.random() - 0.5) * 0.02;
      droplet.glowIntensity = Math.max(0.2, Math.min(1, droplet.glowIntensity));
    }

    function drawDroplet(droplet: DropletState): void {
      for (let i = 0; i < droplet.length; i++) {
        const charY = Math.floor(droplet.y - i);
        if (charY < 0 || charY >= rows) continue;
        
        const x = droplet.x * charWidth;
        const y = charY * charHeight;
        const char = droplet.chars[i];
        const alpha = droplet.alphas[i];
        
        // Lead character (bright white-green with glow)
        if (i === 0) {
          ctx.shadowBlur = 12 * droplet.glowIntensity;
          ctx.shadowColor = `rgba(0, 255, 140, ${droplet.glowIntensity})`;
          ctx.fillStyle = `rgba(220, 255, 200, 1)`;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(0, 255, 140, ${alpha})`;
        }
        
        ctx.fillText(char, x, y);
      }
      
      ctx.shadowBlur = 0;
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      ctx.font = `${charHeight}px 'Courier New', monospace`;
      ctx.textBaseline = 'top';
      
      columns = Math.floor(canvas.width / charWidth);
      rows = Math.floor(canvas.height / charHeight);
      
      // Create initial droplets
      droplets = [];
      for (let i = 0; i < columns; i++) {
        if (Math.random() < 0.7) {
          droplets.push(createDroplet(i));
        }
      }
      
      console.log('MatrixRain2D_V4 initialized:', { columns, rows, droplets: droplets.length });
    }

    function animate(currentTime: number) {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // Dynamic fade effect
      const fadeIntensity = 0.06 + Math.sin(currentTime * 0.001) * 0.01;
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeIntensity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update droplets
      droplets.forEach(droplet => updateDroplet(droplet, deltaTime));

      // Remove off-screen droplets
      droplets = droplets.filter(d => d.y - d.length < rows + 5);

      // Add new droplets
      const columnsInUse = new Set(droplets.map(d => d.x));
      const availableColumns = Array.from({ length: columns }, (_, i) => i)
        .filter(col => !columnsInUse.has(col));

      if (availableColumns.length > 0 && Math.random() < 0.3) {
        const newCol = availableColumns[Math.floor(Math.random() * availableColumns.length)];
        droplets.push(createDroplet(newCol));
      }

      // Occasionally add secondary droplets to busy columns
      if (Math.random() < 0.1) {
        const busyColumns = Array.from(columnsInUse).filter(col => 
          droplets.filter(d => d.x === col).length === 1
        );
        if (busyColumns.length > 0) {
          const col = busyColumns[Math.floor(Math.random() * busyColumns.length)];
          const existingDroplet = droplets.find(d => d.x === col);
          if (existingDroplet && existingDroplet.y > 10) {
            droplets.push(createDroplet(col));
          }
        }
      }

      // Draw all droplets
      ctx.font = `${charHeight}px 'Courier New', monospace`;
      droplets.forEach(drawDroplet);

      animationFrameId.current = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animationFrameId.current = requestAnimationFrame(animate);

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