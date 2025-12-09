// V3 Image Editor - Dual Canvas Architecture
// Rule 14: Dual Canvas Architecture

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { EditorProject, Layer, ToolType, WorldPoint, SelectionMask } from '@/lib/canvas/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_BG, CHECKERBOARD_SIZE, CHECKERBOARD_LIGHT, CHECKERBOARD_DARK } from '@/lib/canvas/constants';
import { CoordinateSystem } from '@/lib/canvas/CoordinateSystem';
import { previewWaveEngine } from '@/lib/canvas/preview';

interface EditorCanvasProps {
  project: EditorProject;
  activeTool: ToolType;
  zoom: number;
  isProcessing: boolean;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
}

export function EditorCanvas({ project, activeTool, zoom, isProcessing, onUpdateLayer }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const coordSystemRef = useRef<CoordinateSystem>(new CoordinateSystem());
  
  const [previewMask, setPreviewMask] = useState<Uint8ClampedArray | null>(null);
  const [hoverPoint, setHoverPoint] = useState<WorldPoint | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Update coordinate system when zoom changes
  useEffect(() => {
    coordSystemRef.current.setZoom(zoom);
  }, [zoom]);

  // Initialize canvas dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      coordSystemRef.current.updateState({
        viewportWidth: rect.width,
        viewportHeight: rect.height,
        devicePixelRatio: dpr,
      });

      // Set canvas dimensions
      [mainCanvasRef, previewCanvasRef].forEach(ref => {
        const canvas = ref.current;
        if (canvas) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(dpr, dpr);
          }
        }
      });
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Main canvas render loop
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationId: number;
    
    const render = () => {
      const { viewportWidth, viewportHeight } = coordSystemRef.current.getState();
      
      // Clear canvas
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, viewportWidth, viewportHeight);
      
      // Apply coordinate transform
      ctx.save();
      coordSystemRef.current.applyToContext(ctx);
      
      // Draw checkerboard background
      drawCheckerboard(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw canvas border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw layers
      for (const layer of project.layers) {
        if (!layer.visible || !layer.image) continue;
        
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        
        // Apply layer transform
        const { x, y, width, height } = layer.bounds;
        const transform = layer.transform || { rotation: 0, scaleX: 1, scaleY: 1 };
        
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate((transform.rotation * Math.PI) / 180);
        ctx.scale(transform.scaleX, transform.scaleY);
        ctx.translate(-width / 2, -height / 2);
        
        ctx.drawImage(layer.image, 0, 0, width, height);
        ctx.restore();
      }
      
      // Draw selection
      if (project.selection) {
        drawSelection(ctx, project.selection);
      }
      
      ctx.restore();
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationId);
  }, [project.layers, project.selection]);

  // Preview canvas render loop
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationId: number;
    
    const render = () => {
      const { viewportWidth, viewportHeight } = coordSystemRef.current.getState();
      
      // Clear preview canvas
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, viewportWidth, viewportHeight);
      
      // Apply coordinate transform
      ctx.save();
      coordSystemRef.current.applyToContext(ctx);
      
      // Draw magic wand preview
      if (previewMask && hoverPoint && activeTool === 'magic-wand') {
        drawPreviewMask(ctx, previewMask, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      
      // Draw cursor indicator
      if (hoverPoint && activeTool === 'magic-wand') {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fillRect(Math.floor(hoverPoint.x) - 1, Math.floor(hoverPoint.y) - 1, 3, 3);
      }
      
      ctx.restore();
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationId);
  }, [previewMask, hoverPoint, activeTool]);

  // Get composite ImageData for segmentation
  const getCompositeImageData = useCallback((): ImageData | null => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill background
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw layers
    for (const layer of project.layers) {
      if (!layer.visible || !layer.image) continue;
      
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      
      const { x, y, width, height } = layer.bounds;
      const transform = layer.transform || { rotation: 0, scaleX: 1, scaleY: 1 };
      
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.scale(transform.scaleX, transform.scaleY);
      ctx.translate(-width / 2, -height / 2);
      
      ctx.drawImage(layer.image, 0, 0, width, height);
      ctx.restore();
    }

    try {
      return ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch {
      console.warn('Cannot read pixel data (cross-origin)');
      return null;
    }
  }, [project.layers]);

  // Mouse event handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isPanning) {
      const dx = screenX - panStart.x;
      const dy = screenY - panStart.y;
      coordSystemRef.current.addPan(dx, dy);
      setPanStart({ x: screenX, y: screenY });
      return;
    }

    const worldPoint = coordSystemRef.current.screenToWorld(screenX, screenY);

    // Check bounds
    if (!coordSystemRef.current.isInBounds(worldPoint.x, worldPoint.y)) {
      setHoverPoint(null);
      setPreviewMask(null);
      previewWaveEngine.cancel();
      return;
    }

    setHoverPoint(worldPoint);

    // Start progressive preview for magic wand
    if (activeTool === 'magic-wand') {
      const imageData = getCompositeImageData();
      if (imageData) {
        const previewCtx = previewCanvasRef.current?.getContext('2d');
        if (previewCtx) {
          previewWaveEngine.setPreviewContext(previewCtx);
        }
        
        previewWaveEngine.startWave(
          imageData,
          worldPoint,
          32, // Default tolerance
          (result) => setPreviewMask(result.mask),
          (result) => setPreviewMask(result.mask)
        );
      }
    }
  }, [activeTool, isPanning, panStart, getCompositeImageData]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse or space+left for panning
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      setIsPanning(true);
      setPanStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      e.preventDefault();
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverPoint(null);
    setPreviewMask(null);
    setIsPanning(false);
    previewWaveEngine.cancel();
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const currentZoom = coordSystemRef.current.getState().zoom;
    const newZoom = Math.max(0.1, Math.min(10, currentZoom * delta));
    
    coordSystemRef.current.zoomAtPoint(newZoom, screenX, screenY);
  }, []);

  // Get cursor style based on tool
  const getCursor = () => {
    if (isPanning) return 'grabbing';
    
    switch (activeTool) {
      case 'magic-wand': return 'crosshair';
      case 'move': return 'move';
      case 'brush': return 'crosshair';
      case 'eraser': return 'crosshair';
      default: return 'default';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ cursor: getCursor() }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      <canvas 
        ref={mainCanvasRef} 
        className="absolute inset-0"
      />
      <canvas 
        ref={previewCanvasRef} 
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}

// Helper: Draw checkerboard pattern
function drawCheckerboard(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const size = CHECKERBOARD_SIZE;
  
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const isLight = ((x / size) + (y / size)) % 2 === 0;
      ctx.fillStyle = isLight ? CHECKERBOARD_LIGHT : CHECKERBOARD_DARK;
      ctx.fillRect(x, y, size, size);
    }
  }
}

// Helper: Draw selection mask
function drawSelection(ctx: CanvasRenderingContext2D, selection: SelectionMask) {
  const { data, width, height, bounds } = selection;
  
  // Draw marching ants
  const offset = (Date.now() / 20) % 8;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = offset;
  
  // Simple boundary rendering
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.setLineDash([]);
}

// Helper: Draw preview mask
function drawPreviewMask(ctx: CanvasRenderingContext2D, mask: Uint8ClampedArray, width: number, height: number) {
  ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (mask[index] > 0) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}
