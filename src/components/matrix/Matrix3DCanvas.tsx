import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

// Matrix characters
const MATRIX_CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:=*+-<>¦｜ç・";

// Matrix texture generator
class MatrixTexture {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private chars: string[][];
  private alphas: number[][];
  private speeds: number[][];
  private cols: number;
  private rows: number;
  private fontSize: number;
  private animationTime: number = 0;

  constructor(width = 512, height = 512) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.fontSize = 16;
    this.cols = Math.floor(width / (this.fontSize * 0.6));
    this.rows = Math.floor(height / this.fontSize);
    
    this.chars = Array(this.rows).fill(null).map(() => 
      Array(this.cols).fill(null).map(() => 
        MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      )
    );
    
    this.alphas = Array(this.rows).fill(null).map(() => 
      Array(this.cols).fill(0)
    );
    
    this.speeds = Array(this.rows).fill(null).map(() => 
      Array(this.cols).fill(null).map(() => Math.random() * 0.1 + 0.02)
    );
    
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    
    this.initializeDrops();
  }

  private initializeDrops() {
    // Create initial matrix drops
    for (let col = 0; col < this.cols; col++) {
      if (Math.random() < 0.3) {
        const dropLength = Math.floor(Math.random() * 15) + 5;
        const startRow = Math.floor(Math.random() * this.rows);
        
        for (let i = 0; i < dropLength && startRow + i < this.rows; i++) {
          const alpha = Math.max(0, 1 - (i / dropLength));
          this.alphas[startRow + i][col] = alpha;
        }
      }
    }
  }

  update(deltaTime: number) {
    this.animationTime += deltaTime;
    
    // Clear canvas
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update matrix rain
    for (let col = 0; col < this.cols; col++) {
      // Occasionally start new drops
      if (Math.random() < 0.005) {
        this.alphas[0][col] = 1;
      }
      
      // Update existing drops
      for (let row = this.rows - 1; row > 0; row--) {
        if (this.alphas[row - 1][col] > 0 && this.alphas[row][col] === 0) {
          this.alphas[row][col] = this.alphas[row - 1][col] * 0.98;
          this.alphas[row - 1][col] *= 0.95;
        }
      }
      
      // Fade out drops
      for (let row = 0; row < this.rows; row++) {
        if (this.alphas[row][col] > 0) {
          this.alphas[row][col] *= 0.99;
          if (this.alphas[row][col] < 0.01) {
            this.alphas[row][col] = 0;
          }
        }
      }
    }
    
    // Occasionally change characters
    if (Math.random() < 0.02) {
      const col = Math.floor(Math.random() * this.cols);
      const row = Math.floor(Math.random() * this.rows);
      this.chars[row][col] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    }
    
    // Draw matrix
    this.ctx.font = `${this.fontSize}px 'Courier New', monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const alpha = this.alphas[row][col];
        if (alpha > 0) {
          const x = col * (this.fontSize * 0.6) + (this.fontSize * 0.3);
          const y = row * this.fontSize + (this.fontSize * 0.5);
          
          // Leading character is brighter
          const isLead = row > 0 && this.alphas[row - 1][col] === 0 && alpha > 0.8;
          
          if (isLead) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00ff88';
          } else {
            this.ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
            this.ctx.shadowBlur = 2;
            this.ctx.shadowColor = '#00ff88';
          }
          
          this.ctx.fillText(this.chars[row][col], x, y);
          this.ctx.shadowBlur = 0;
        }
      }
    }
    
    this.texture.needsUpdate = true;
  }

  getTexture() {
    return this.texture;
  }

  dispose() {
    this.texture.dispose();
  }
}

// Matrix Wall Component
function MatrixWall({ position, rotation, scale }: { position: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matrixTexture = useRef<MatrixTexture | null>(null);
  const [material, setMaterial] = useState<THREE.MeshBasicMaterial | null>(null);

  useEffect(() => {
    matrixTexture.current = new MatrixTexture(1024, 1024);
    const mat = new THREE.MeshBasicMaterial({
      map: matrixTexture.current.getTexture(),
      transparent: true,
      side: THREE.DoubleSide,
    });
    setMaterial(mat);

    return () => {
      matrixTexture.current?.dispose();
      mat.dispose();
    };
  }, []);

  useFrame((state, delta) => {
    if (matrixTexture.current) {
      matrixTexture.current.update(delta);
    }
  });

  if (!material) return null;

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[10, 10]} />
      <primitive object={material} />
    </mesh>
  );
}

// Floating Matrix Particles
function MatrixParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions, setPositions] = useState<Float32Array>();
  const [colors, setColors] = useState<Float32Array>();

  useEffect(() => {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      const intensity = Math.random();
      colors[i * 3] = 0; // R
      colors[i * 3 + 1] = intensity; // G
      colors[i * 3 + 2] = intensity * 0.5; // B
    }

    setPositions(positions);
    setColors(colors);
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      pointsRef.current.rotation.x += 0.0005;
    }
  });

  if (!positions || !colors) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation={true}
      />
    </points>
  );
}

// Main 3D Matrix Scene
function Matrix3DScene() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 15);
  }, [camera]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    camera.position.x = Math.sin(time * 0.1) * 2;
    camera.position.y = Math.cos(time * 0.15) * 1;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.3} color="#00ff88" />
      
      {/* Matrix Walls - Creating a 3D room */}
      {/* Front Wall */}
      <MatrixWall position={[0, 0, -15]} />
      
      {/* Back Wall */}
      <MatrixWall position={[0, 0, 15]} rotation={[0, Math.PI, 0]} />
      
      {/* Left Wall */}
      <MatrixWall position={[-15, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      
      {/* Right Wall */}
      <MatrixWall position={[15, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      
      {/* Floor */}
      <MatrixWall position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      
      {/* Ceiling */}
      <MatrixWall position={[0, 10, 0]} rotation={[Math.PI / 2, 0, 0]} />
      
      {/* Additional floating panels */}
      <MatrixWall position={[-5, 5, -5]} rotation={[0.2, 0.3, 0]} scale={[0.8, 0.8, 0.8]} />
      <MatrixWall position={[5, -3, 8]} rotation={[-0.1, -0.4, 0.1]} scale={[1.2, 0.6, 1]} />
      <MatrixWall position={[0, 7, 5]} rotation={[0.5, 0, 0.2]} scale={[1.5, 0.8, 1]} />
      
      {/* Floating matrix particles */}
      <MatrixParticles />
      
      {/* 3D Matrix Text */}
      <Text
        position={[0, 0, 0]}
        fontSize={2}
        color="#00ff88"
        anchorX="center"
        anchorY="middle"
        font="/fonts/courier-prime-v7-latin-regular.woff"
      >
        MATRIX
      </Text>
      
      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={30}
        minDistance={5}
      />
    </>
  );
}

export default function Matrix3DCanvas() {
  return (
    <div className="fixed inset-0 w-full h-full bg-matrix-background">
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Matrix3DScene />
      </Canvas>
    </div>
  );
}