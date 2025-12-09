// Rule 12: Zero-Latency Seed Highlight
// Draw 3×3 seed highlight immediately (0ms perceived latency)

import { WorldPoint } from '../types';

export class ZeroLatencyPreview {
  private ctx: CanvasRenderingContext2D | null = null;
  private lastSeedPoint: WorldPoint | null = null;
  
  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }
  
  /**
   * Draw instant seed highlight at the clicked/hovered point
   * This provides immediate visual feedback before flood fill starts
   */
  drawInstantSeed(seedPoint: WorldPoint): void {
    if (!this.ctx) return;
    
    this.lastSeedPoint = seedPoint;
    
    const x = Math.floor(seedPoint.x);
    const y = Math.floor(seedPoint.y);
    
    // Draw 3×3 seed highlight
    this.ctx.save();
    
    // Primary highlight (center pixel)
    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    this.ctx.fillRect(x, y, 1, 1);
    
    // Secondary highlight (surrounding pixels)
    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
    this.ctx.fillRect(x - 1, y - 1, 3, 3);
    
    // Outline
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - 1.5, y - 1.5, 4, 4);
    
    this.ctx.restore();
  }
  
  /**
   * Draw expanding ring indicator
   * Shows progressive expansion during flood fill
   */
  drawExpandingRing(centerX: number, centerY: number, radius: number): void {
    if (!this.ctx) return;
    
    this.ctx.save();
    
    // Draw animated ring
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  /**
   * Clear the preview
   */
  clear(): void {
    this.lastSeedPoint = null;
    // Note: Actual clearing is handled by the preview canvas render loop
  }
  
  /**
   * Get the last seed point
   */
  getLastSeedPoint(): WorldPoint | null {
    return this.lastSeedPoint;
  }
}
