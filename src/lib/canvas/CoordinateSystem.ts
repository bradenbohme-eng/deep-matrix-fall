// V3 Coordinate System - Single Source of Truth for All Coordinate Conversions
// Rule 2: All Conversions Through CoordinateSystem

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { CoordinateSystemState, WorldPoint, ScreenPoint, ImagePoint } from './types';

export class CoordinateSystem {
  private state: CoordinateSystemState;

  constructor(initialState?: Partial<CoordinateSystemState>) {
    this.state = {
      panX: 0,
      panY: 0,
      zoom: 1,
      viewportWidth: 800,
      viewportHeight: 600,
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      ...initialState,
    };
  }

  updateState(updates: Partial<CoordinateSystemState>): void {
    this.state = { ...this.state, ...updates };
  }

  getState(): Readonly<CoordinateSystemState> {
    return { ...this.state };
  }

  // Rule 7: Screen-to-World Formula
  // Screen → World (for event handling)
  screenToWorld(screenX: number, screenY: number): WorldPoint {
    const { panX, panY, zoom, viewportWidth, viewportHeight } = this.state;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    
    // Reverse transform: remove pan, remove zoom, adjust for center
    const worldX = (screenX - centerX - panX) / zoom + CANVAS_WIDTH / 2;
    const worldY = (screenY - centerY - panY) / zoom + CANVAS_HEIGHT / 2;
    
    return { x: worldX, y: worldY, __space: 'world' };
  }

  // World → Screen (for rendering overlays)
  worldToScreen(worldX: number, worldY: number): ScreenPoint {
    const { panX, panY, zoom, viewportWidth, viewportHeight } = this.state;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    
    // Forward transform: apply offset, zoom, pan
    const screenX = (worldX - CANVAS_WIDTH / 2) * zoom + centerX + panX;
    const screenY = (worldY - CANVAS_HEIGHT / 2) * zoom + centerY + panY;
    
    return { x: screenX, y: screenY, __space: 'screen' };
  }

  // Rule 6: World-to-Image is Identity
  // World → Image (identity in V3)
  worldToImage(worldX: number, worldY: number): ImagePoint {
    // World space origin = Image space origin (both top-left)
    return {
      x: Math.floor(worldX),
      y: Math.floor(worldY),
      __space: 'image',
    };
  }

  // Image → World (identity in V3)
  imageToWorld(imageX: number, imageY: number): WorldPoint {
    return {
      x: imageX,
      y: imageY,
      __space: 'world',
    };
  }

  // Rule 4: Transform Order is Critical
  // Apply transform to canvas context
  applyToContext(ctx: CanvasRenderingContext2D): void {
    const { panX, panY, zoom, viewportWidth, viewportHeight } = this.state;
    
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Move to viewport center, apply pan, apply zoom
    ctx.translate(viewportWidth / 2 + panX, viewportHeight / 2 + panY);
    ctx.scale(zoom, zoom);
    
    // Move origin to canvas top-left (world space origin)
    ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
  }

  // Zoom to cursor point (keeps point under cursor stationary)
  zoomAtPoint(newZoom: number, screenX: number, screenY: number): void {
    const { panX, panY, zoom, viewportWidth, viewportHeight } = this.state;
    
    // Get world point before zoom
    const worldBefore = this.screenToWorld(screenX, screenY);
    
    // Update zoom
    this.state.zoom = Math.max(0.1, Math.min(10, newZoom));
    
    // Get screen point after zoom (with same world point)
    const screenAfter = this.worldToScreen(worldBefore.x, worldBefore.y);
    
    // Adjust pan to keep point stationary
    this.state.panX += screenX - screenAfter.x;
    this.state.panY += screenY - screenAfter.y;
  }

  // Add pan offset
  addPan(dx: number, dy: number): void {
    this.state.panX += dx;
    this.state.panY += dy;
  }

  // Set pan position
  setPan(x: number, y: number): void {
    this.state.panX = x;
    this.state.panY = y;
  }

  // Set zoom level
  setZoom(zoom: number): number {
    this.state.zoom = Math.max(0.1, Math.min(10, zoom));
    return this.state.zoom;
  }

  // Reset view to center
  resetView(): void {
    this.state.panX = 0;
    this.state.panY = 0;
    this.state.zoom = 1;
  }

  // Check if world point is within canvas bounds
  isInBounds(worldX: number, worldY: number): boolean {
    return worldX >= 0 && worldX < CANVAS_WIDTH && 
           worldY >= 0 && worldY < CANVAS_HEIGHT;
  }

  // Safe pixel access from ImageData
  getImageDataSafely(
    imageData: ImageData, 
    worldX: number, 
    worldY: number
  ): { r: number; g: number; b: number; a: number } | null {
    const imagePoint = this.worldToImage(worldX, worldY);
    
    if (imagePoint.x < 0 || imagePoint.x >= imageData.width ||
        imagePoint.y < 0 || imagePoint.y >= imageData.height) {
      return null;
    }
    
    const index = (imagePoint.y * imageData.width + imagePoint.x) * 4;
    return {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
      a: imageData.data[index + 3],
    };
  }

  // Test roundtrip fidelity (for debugging)
  testRoundtripFidelity(screenX: number, screenY: number): { error: number } {
    const world = this.screenToWorld(screenX, screenY);
    const backToScreen = this.worldToScreen(world.x, world.y);
    
    const error = Math.sqrt(
      Math.pow(screenX - backToScreen.x, 2) + 
      Math.pow(screenY - backToScreen.y, 2)
    );
    
    return { error };
  }
}

// Singleton instance for shared usage
export const coordinateSystem = new CoordinateSystem();
