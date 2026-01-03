// V3 Image Editor - Crop Tool

import { WorldPoint, Bounds } from '../types';

export interface CropState {
  isActive: boolean;
  isDragging: boolean;
  dragType: 'create' | 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'resize-n' | 'resize-s' | 'resize-e' | 'resize-w' | null;
  startPoint: WorldPoint | null;
  cropBounds: Bounds | null;
  aspectRatio: number | null; // null = freeform
  presets: { name: string; ratio: number | null }[];
}

export const defaultCropState: CropState = {
  isActive: false,
  isDragging: false,
  dragType: null,
  startPoint: null,
  cropBounds: null,
  aspectRatio: null,
  presets: [
    { name: 'Freeform', ratio: null },
    { name: '1:1', ratio: 1 },
    { name: '16:9', ratio: 16 / 9 },
    { name: '9:16', ratio: 9 / 16 },
    { name: '4:3', ratio: 4 / 3 },
    { name: '3:2', ratio: 3 / 2 },
  ],
};

export class CropTool {
  private state: CropState;
  private handleSize = 8;

  constructor(initialState: Partial<CropState> = {}) {
    this.state = { ...defaultCropState, ...initialState };
  }

  activate(imageBounds: Bounds): void {
    this.state.isActive = true;
    this.state.cropBounds = { ...imageBounds };
  }

  deactivate(): void {
    this.state.isActive = false;
    this.state.cropBounds = null;
    this.state.isDragging = false;
    this.state.dragType = null;
  }

  startDrag(point: WorldPoint): void {
    if (!this.state.isActive || !this.state.cropBounds) return;

    const dragType = this.getHandleAtPoint(point);
    if (dragType) {
      this.state.isDragging = true;
      this.state.dragType = dragType;
      this.state.startPoint = point;
    }
  }

  continueDrag(point: WorldPoint): void {
    if (!this.state.isDragging || !this.state.startPoint || !this.state.cropBounds) return;

    const dx = point.x - this.state.startPoint.x;
    const dy = point.y - this.state.startPoint.y;
    const bounds = this.state.cropBounds;

    switch (this.state.dragType) {
      case 'move':
        this.state.cropBounds = {
          x: bounds.x + dx,
          y: bounds.y + dy,
          width: bounds.width,
          height: bounds.height,
        };
        break;
      case 'resize-se':
        this.state.cropBounds = {
          ...bounds,
          width: Math.max(20, bounds.width + dx),
          height: Math.max(20, bounds.height + dy),
        };
        if (this.state.aspectRatio) {
          this.state.cropBounds.height = this.state.cropBounds.width / this.state.aspectRatio;
        }
        break;
      case 'resize-nw':
        const newWidth = Math.max(20, bounds.width - dx);
        const newHeight = Math.max(20, bounds.height - dy);
        this.state.cropBounds = {
          x: bounds.x + (bounds.width - newWidth),
          y: bounds.y + (bounds.height - newHeight),
          width: newWidth,
          height: newHeight,
        };
        break;
      case 'resize-ne':
        this.state.cropBounds = {
          x: bounds.x,
          y: bounds.y + dy,
          width: Math.max(20, bounds.width + dx),
          height: Math.max(20, bounds.height - dy),
        };
        break;
      case 'resize-sw':
        this.state.cropBounds = {
          x: bounds.x + dx,
          y: bounds.y,
          width: Math.max(20, bounds.width - dx),
          height: Math.max(20, bounds.height + dy),
        };
        break;
      case 'resize-n':
        this.state.cropBounds = {
          x: bounds.x,
          y: bounds.y + dy,
          width: bounds.width,
          height: Math.max(20, bounds.height - dy),
        };
        break;
      case 'resize-s':
        this.state.cropBounds = {
          ...bounds,
          height: Math.max(20, bounds.height + dy),
        };
        break;
      case 'resize-e':
        this.state.cropBounds = {
          ...bounds,
          width: Math.max(20, bounds.width + dx),
        };
        break;
      case 'resize-w':
        this.state.cropBounds = {
          x: bounds.x + dx,
          y: bounds.y,
          width: Math.max(20, bounds.width - dx),
          height: bounds.height,
        };
        break;
    }

    this.state.startPoint = point;
  }

  endDrag(): void {
    this.state.isDragging = false;
    this.state.dragType = null;
    this.state.startPoint = null;
  }

  setAspectRatio(ratio: number | null): void {
    this.state.aspectRatio = ratio;
    if (ratio && this.state.cropBounds) {
      this.state.cropBounds.height = this.state.cropBounds.width / ratio;
    }
  }

  getCropBounds(): Bounds | null {
    return this.state.cropBounds ? { ...this.state.cropBounds } : null;
  }

  getState(): CropState {
    return { ...this.state };
  }

  private getHandleAtPoint(point: WorldPoint): CropState['dragType'] {
    if (!this.state.cropBounds) return null;

    const b = this.state.cropBounds;
    const hs = this.handleSize;

    // Corner handles
    if (this.pointInRect(point, b.x - hs, b.y - hs, hs * 2, hs * 2)) return 'resize-nw';
    if (this.pointInRect(point, b.x + b.width - hs, b.y - hs, hs * 2, hs * 2)) return 'resize-ne';
    if (this.pointInRect(point, b.x - hs, b.y + b.height - hs, hs * 2, hs * 2)) return 'resize-sw';
    if (this.pointInRect(point, b.x + b.width - hs, b.y + b.height - hs, hs * 2, hs * 2)) return 'resize-se';

    // Edge handles
    if (this.pointInRect(point, b.x + b.width / 2 - hs, b.y - hs, hs * 2, hs * 2)) return 'resize-n';
    if (this.pointInRect(point, b.x + b.width / 2 - hs, b.y + b.height - hs, hs * 2, hs * 2)) return 'resize-s';
    if (this.pointInRect(point, b.x - hs, b.y + b.height / 2 - hs, hs * 2, hs * 2)) return 'resize-w';
    if (this.pointInRect(point, b.x + b.width - hs, b.y + b.height / 2 - hs, hs * 2, hs * 2)) return 'resize-e';

    // Inside crop area = move
    if (this.pointInRect(point, b.x, b.y, b.width, b.height)) return 'move';

    return null;
  }

  private pointInRect(point: WorldPoint, x: number, y: number, w: number, h: number): boolean {
    return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
  }

  // Draw crop overlay
  drawOverlay(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.state.cropBounds) return;

    const b = this.state.cropBounds;

    // Darken outside crop area
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    // Top
    ctx.fillRect(0, 0, canvasWidth, b.y);
    // Bottom
    ctx.fillRect(0, b.y + b.height, canvasWidth, canvasHeight - b.y - b.height);
    // Left
    ctx.fillRect(0, b.y, b.x, b.height);
    // Right
    ctx.fillRect(b.x + b.width, b.y, canvasWidth - b.x - b.width, b.height);

    // Draw crop border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, b.y, b.width, b.height);

    // Draw rule of thirds grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    // Vertical lines
    ctx.moveTo(b.x + b.width / 3, b.y);
    ctx.lineTo(b.x + b.width / 3, b.y + b.height);
    ctx.moveTo(b.x + (2 * b.width) / 3, b.y);
    ctx.lineTo(b.x + (2 * b.width) / 3, b.y + b.height);
    // Horizontal lines
    ctx.moveTo(b.x, b.y + b.height / 3);
    ctx.lineTo(b.x + b.width, b.y + b.height / 3);
    ctx.moveTo(b.x, b.y + (2 * b.height) / 3);
    ctx.lineTo(b.x + b.width, b.y + (2 * b.height) / 3);
    ctx.stroke();

    // Draw corner handles
    ctx.fillStyle = '#fff';
    const hs = this.handleSize;
    
    // Corners
    ctx.fillRect(b.x - hs / 2, b.y - hs / 2, hs, hs);
    ctx.fillRect(b.x + b.width - hs / 2, b.y - hs / 2, hs, hs);
    ctx.fillRect(b.x - hs / 2, b.y + b.height - hs / 2, hs, hs);
    ctx.fillRect(b.x + b.width - hs / 2, b.y + b.height - hs / 2, hs, hs);

    // Edge midpoints
    ctx.fillRect(b.x + b.width / 2 - hs / 2, b.y - hs / 2, hs, hs);
    ctx.fillRect(b.x + b.width / 2 - hs / 2, b.y + b.height - hs / 2, hs, hs);
    ctx.fillRect(b.x - hs / 2, b.y + b.height / 2 - hs / 2, hs, hs);
    ctx.fillRect(b.x + b.width - hs / 2, b.y + b.height / 2 - hs / 2, hs, hs);

    ctx.restore();
  }

  // Get cursor style based on hover position
  getCursor(point: WorldPoint): string {
    const handle = this.getHandleAtPoint(point);
    switch (handle) {
      case 'resize-nw':
      case 'resize-se':
        return 'nwse-resize';
      case 'resize-ne':
      case 'resize-sw':
        return 'nesw-resize';
      case 'resize-n':
      case 'resize-s':
        return 'ns-resize';
      case 'resize-e':
      case 'resize-w':
        return 'ew-resize';
      case 'move':
        return 'move';
      default:
        return 'crosshair';
    }
  }
}
