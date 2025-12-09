// V6 Preview Wave Engine - Progressive Segmentation Preview
// Rule 11: Progressive Preview is Mandatory
// Rule 12: Zero-Latency Seed Highlight
// Rule 13: Request Cancellation is Required

import { WorldPoint, PreviewCallback, Bounds } from '../types';
import { RingBFS } from './RingBFS';
import { RequestCancellation } from './RequestCancellation';
import { ZeroLatencyPreview } from './ZeroLatencyPreview';
import { RING_BUDGET_MS } from '../constants';

export class PreviewWaveEngine {
  private ringBFS: RingBFS | null = null;
  private requestCancellation: RequestCancellation;
  private zeroLatencyPreview: ZeroLatencyPreview;
  private animationFrameId: number | null = null;
  private previewCtx: CanvasRenderingContext2D | null = null;
  
  constructor() {
    this.requestCancellation = new RequestCancellation();
    this.zeroLatencyPreview = new ZeroLatencyPreview();
  }
  
  setPreviewContext(ctx: CanvasRenderingContext2D): void {
    this.previewCtx = ctx;
    this.zeroLatencyPreview.setContext(ctx);
  }
  
  startWave(
    imageData: ImageData,
    seedPoint: WorldPoint,
    tolerance: number,
    onProgress?: PreviewCallback,
    onComplete?: PreviewCallback
  ): number {
    // 1. Cancel any existing preview
    this.cancel();
    
    // 2. Generate request ID
    const requestId = this.requestCancellation.startPreview();
    
    // 3. Instant seed highlight (0ms perceived latency)
    if (this.previewCtx) {
      this.zeroLatencyPreview.drawInstantSeed(seedPoint);
    }
    
    // 4. Initialize RingBFS
    this.ringBFS = new RingBFS(imageData, seedPoint, tolerance);
    
    // 5. Start progressive expansion
    this.scheduleFrame(requestId, onProgress, onComplete);
    
    return requestId;
  }
  
  private scheduleFrame(
    requestId: number,
    onProgress?: PreviewCallback,
    onComplete?: PreviewCallback
  ): void {
    this.animationFrameId = requestAnimationFrame(() => {
      // Check if request is still valid
      if (!this.requestCancellation.isValid(requestId)) {
        return; // Cancelled
      }
      
      if (!this.ringBFS) return;
      
      // Process one ring (4-8ms budget)
      const result = this.ringBFS.processRing(RING_BUDGET_MS);
      
      // Get current state
      const mask = this.ringBFS.getCurrentMask();
      const bounds = this.ringBFS.getCurrentBounds();
      
      if (mask && bounds) {
        // Notify progress
        if (onProgress) {
          onProgress({ mask, bounds, complete: result.completed });
        }
        
        if (result.completed) {
          // Notify complete
          if (onComplete) {
            onComplete({ mask, bounds, complete: true });
          }
          this.ringBFS = null;
          return;
        }
      }
      
      // Schedule next frame
      this.scheduleFrame(requestId, onProgress, onComplete);
    });
  }
  
  cancel(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.requestCancellation.cancelAll();
    this.ringBFS = null;
    
    // Clear preview
    if (this.previewCtx) {
      this.zeroLatencyPreview.clear();
    }
  }
  
  updateTolerance(newTolerance: number): void {
    if (this.ringBFS) {
      this.ringBFS.updateTolerance(newTolerance);
    }
  }
  
  isActive(): boolean {
    return this.ringBFS !== null && !this.ringBFS.isCompleted();
  }
  
  getCurrentProgress(): { ring: number; completed: boolean } | null {
    if (!this.ringBFS) return null;
    
    return {
      ring: this.ringBFS.getRingNumber(),
      completed: this.ringBFS.isCompleted()
    };
  }
}

// Export singleton for shared usage
export const previewWaveEngine = new PreviewWaveEngine();
