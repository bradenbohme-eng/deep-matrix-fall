// V3 Image Editor - Eraser Tool

import { WorldPoint } from '../types';

export interface EraserState {
  isErasing: boolean;
  lastPoint: WorldPoint | null;
  size: number;
  hardness: number;
  mode: 'normal' | 'background' | 'magic';
}

export const defaultEraserState: EraserState = {
  isErasing: false,
  lastPoint: null,
  size: 20,
  hardness: 1,
  mode: 'normal',
};

export class EraserTool {
  private state: EraserState;
  private erasedAreas: WorldPoint[][] = [];
  private currentErase: WorldPoint[] = [];

  constructor(initialState: Partial<EraserState> = {}) {
    this.state = { ...defaultEraserState, ...initialState };
  }

  startErase(point: WorldPoint): void {
    this.state.isErasing = true;
    this.state.lastPoint = point;
    this.currentErase = [point];
  }

  continueErase(point: WorldPoint, ctx: CanvasRenderingContext2D): void {
    if (!this.state.isErasing || !this.state.lastPoint) return;

    const { size, hardness } = this.state;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Create soft edge with shadow blur for hardness
    if (hardness < 1) {
      ctx.shadowBlur = size * (1 - hardness) * 0.5;
      ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    }

    ctx.beginPath();
    ctx.moveTo(this.state.lastPoint.x, this.state.lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.restore();

    this.state.lastPoint = point;
    this.currentErase.push(point);
  }

  endErase(): void {
    if (this.currentErase.length > 0) {
      this.erasedAreas.push([...this.currentErase]);
    }
    this.state.isErasing = false;
    this.state.lastPoint = null;
    this.currentErase = [];
  }

  setSize(size: number): void {
    this.state.size = Math.max(1, Math.min(500, size));
  }

  setHardness(hardness: number): void {
    this.state.hardness = Math.max(0, Math.min(1, hardness));
  }

  setMode(mode: EraserState['mode']): void {
    this.state.mode = mode;
  }

  getState(): EraserState {
    return { ...this.state };
  }

  // Draw eraser cursor preview
  drawCursor(ctx: CanvasRenderingContext2D, point: WorldPoint): void {
    const { size } = this.state;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}
