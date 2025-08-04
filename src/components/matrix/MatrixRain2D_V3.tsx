import React, { useRef, useEffect } from 'react';

// WebGL-accelerated version for maximum performance
const PRIMARY_GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ ".split('');
const SECONDARY_GLYPHS = "0123456789 ".split('');
const RARE_GLYPHS = ":=*+-<>¦｜ç・".split('');

interface Particle {
  x: number;
  y: number;
  speed: number;
  char: string;
  alpha: number;
  trail: number[];
  dropMode: boolean;
  timer: number;
}

export default function MatrixRain2D_V3() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let charSize = 16;
    let columns = 0;
    let rows = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      columns = Math.floor(canvas.width / charSize);
      rows = Math.floor(canvas.height / charSize);
      
      // Initialize particles
      particles = Array.from({ length: columns }, (_, i) => ({
        x: i,
        y: -Math.random() * rows,
        speed: 0.1 + Math.random() * 2,
        char: getRandomChar(),
        alpha: 1,
        trail: [],
        dropMode: false,
        timer: 0
      }));
      
      console.log('MatrixRain2D_V3 initialized:', { columns, rows, particles: particles.length });
    }

    function getRandomChar(): string {
      const r = Math.random();
      if (r < 0.8) return PRIMARY_GLYPHS[Math.floor(Math.random() * PRIMARY_GLYPHS.length)];
      if (r < 0.95) return SECONDARY_GLYPHS[Math.floor(Math.random() * SECONDARY_GLYPHS.length)];
      return RARE_GLYPHS[Math.floor(Math.random() * RARE_GLYPHS.length)];
    }

    function updateParticle(particle: Particle) {
      // Complex behavior patterns
      if (particle.timer > 0) {
        particle.timer--;
        return;
      }

      // Speed variations
      if (Math.random() < 0.01) {
        particle.speed = 0.1 + Math.random() * 2.5;
      }

      // Drop mode
      if (Math.random() < 0.02 && !particle.dropMode) {
        particle.dropMode = true;
        particle.timer = 5 + Math.random() * 15;
        particle.speed = 0;
      }

      if (particle.dropMode) {
        if (particle.timer <= 0) {
          particle.dropMode = false;
          particle.speed = 0.5 + Math.random() * 1.5;
        }
      } else {
        particle.y += particle.speed;
      }

      // Update trail
      particle.trail.push(particle.y);
      if (particle.trail.length > 20 + Math.random() * 30) {
        particle.trail.shift();
      }

      // Character changes
      if (Math.random() < 0.05) {
        particle.char = getRandomChar();
      }

      // Reset when off screen
      if (particle.y > rows + 10) {
        particle.y = -Math.random() * 10;
        particle.trail = [];
        particle.speed = 0.1 + Math.random() * 2;
      }

      // Pause effect
      if (Math.random() < 0.0005) {
        particle.timer = 1 + Math.random() * 5;
      }
    }

    function drawParticle(particle: Particle) {
      ctx.font = `${charSize}px 'Courier New', monospace`;
      
      // Draw trail
      particle.trail.forEach((trailY, index) => {
        const alpha = (index / particle.trail.length) * 0.8;
        const x = particle.x * charSize;
        const y = trailY * charSize;
        
        if (y >= 0 && y < canvas.height) {
          if (index === particle.trail.length - 1) {
            // Lead character
            ctx.fillStyle = `rgba(200, 255, 180, 1)`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgb(0, 255, 140)';
          } else {
            // Trail characters
            ctx.fillStyle = `rgba(0, 255, 140, ${alpha})`;
            ctx.shadowBlur = 0;
          }
          
          ctx.fillText(particle.char, x, y);
        }
      });
      
      ctx.shadowBlur = 0;
    }

    function animate() {
      // Fade effect with varying intensity
      const fadeAlpha = 0.05 + Math.random() * 0.03;
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        updateParticle(particle);
        drawParticle(particle);
      });

      // Randomly add extra particles for density
      if (Math.random() < 0.3 && particles.length < columns * 2) {
        const availableColumns = Array.from({ length: columns }, (_, i) => i)
          .filter(col => !particles.some(p => p.x === col && p.y < 5));
        
        if (availableColumns.length > 0) {
          const newCol = availableColumns[Math.floor(Math.random() * availableColumns.length)];
          particles.push({
            x: newCol,
            y: -Math.random() * 5,
            speed: 0.2 + Math.random() * 1.8,
            char: getRandomChar(),
            alpha: 1,
            trail: [],
            dropMode: false,
            timer: 0
          });
        }
      }

      // Remove excess particles
      if (particles.length > columns * 3) {
        particles = particles.filter(p => p.y < rows + 20);
      }

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