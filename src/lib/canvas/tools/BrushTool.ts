// V3 Image Editor - Brush Tool

import { WorldPoint, RGBA } from '../types';

export interface BrushState {
  isDrawing: boolean;
  lastPoint: WorldPoint | null;
  color: RGBA;
  size: number;
  hardness: number;
  opacity: number;
  flow: number;
}

export const defaultBrushState: BrushState = {
  isDrawing: false,
  lastPoint: null,
  color: { r: 255, g: 255, b: 255, a: 255 },
  size: 10,
  hardness: 0.8,
  opacity: 1,
  flow: 1,
};

export class BrushTool {
  private state: BrushState;
  private strokes: WorldPoint[][] = [];
  private currentStroke: WorldPoint[] = [];

  constructor(initialState: Partial<BrushState> = {}) {
    this.state = { ...defaultBrushState, ...initialState };
  }

  startStroke(point: WorldPoint): void {
    this.state.isDrawing = true;
    this.state.lastPoint = point;
    this.currentStroke = [point];
  }

  continueStroke(point: WorldPoint, ctx: CanvasRenderingContext2D): void {
    if (!this.state.isDrawing || !this.state.lastPoint) return;

    const { color, size, opacity, hardness } = this.state;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Create soft edge with shadow blur for hardness
    if (hardness < 1) {
      ctx.shadowBlur = size * (1 - hardness);
      ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
    }

    ctx.beginPath();
    ctx.moveTo(this.state.lastPoint.x, this.state.lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.restore();

    this.state.lastPoint = point;
    this.currentStroke.push(point);
  }

  endStroke(): void {
    if (this.currentStroke.length > 0) {
      this.strokes.push([...this.currentStroke]);
    }
    this.state.isDrawing = false;
    this.state.lastPoint = null;
    this.currentStroke = [];
  }

  setColor(color: RGBA): void {
    this.state.color = color;
  }

  setSize(size: number): void {
    this.state.size = Math.max(1, Math.min(500, size));
  }

  setHardness(hardness: number): void {
    this.state.hardness = Math.max(0, Math.min(1, hardness));
  }

  setOpacity(opacity: number): void {
    this.state.opacity = Math.max(0, Math.min(1, opacity));
  }

  getState(): BrushState {
    return { ...this.state };
  }

  getStrokes(): WorldPoint[][] {
    return [...this.strokes];
  }

  clearStrokes(): void {
    this.strokes = [];
  }

  // Draw brush cursor preview
  drawCursor(ctx: CanvasRenderingContext2D, point: WorldPoint): void {
    const { size, color } = this.state;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner circle showing color
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
    ctx.fill();
    ctx.restore();
  }
}
