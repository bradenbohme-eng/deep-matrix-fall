// V6 Organic Flow - Ring-based BFS for Progressive Preview
// Rule 11: Progressive Preview is Mandatory

import { CANVAS_WIDTH, CANVAS_HEIGHT, RING_BUDGET_MS } from '../constants';
import { WorldPoint, RGBA, Bounds, RingProcessResult } from '../types';

export class RingBFS {
  private imageData: ImageData;
  private seedPoint: WorldPoint;
  private tolerance: number;
  private width: number;
  private height: number;
  
  private mask: Uint8ClampedArray;
  private visited: Uint8Array; // 0=unseen, 1=accepted, 2=rejected
  private queue: number[]; // Current ring
  private nextRing: number[]; // Next ring
  private frontier: number[]; // Rejected pixels on frontier (for breathing tolerance)
  private ringNumber: number = 0;
  private isComplete: boolean = false;
  private seedColor: RGBA;
  
  // Bounds tracking
  private minX: number = Infinity;
  private minY: number = Infinity;
  private maxX: number = -Infinity;
  private maxY: number = -Infinity;
  
  constructor(imageData: ImageData, seedPoint: WorldPoint, tolerance: number) {
    this.imageData = imageData;
    this.seedPoint = seedPoint;
    this.tolerance = tolerance;
    this.width = imageData.width;
    this.height = imageData.height;
    
    // Initialize arrays
    this.mask = new Uint8ClampedArray(this.width * this.height);
    this.visited = new Uint8Array(this.width * this.height);
    this.queue = [];
    this.nextRing = [];
    this.frontier = [];
    
    // Get seed color (using floored world coordinates = image coordinates in V3)
    const seedX = Math.floor(seedPoint.x);
    const seedY = Math.floor(seedPoint.y);
    
    // Validate seed point
    if (seedX < 0 || seedX >= this.width || seedY < 0 || seedY >= this.height) {
      this.isComplete = true;
      return;
    }
    
    this.seedColor = this.getPixelColor(seedX, seedY);
    
    // Initialize with seed point
    const seedIndex = seedY * this.width + seedX;
    this.queue.push(seedIndex);
    this.visited[seedIndex] = 1;
    this.mask[seedIndex] = 255;
    
    // Update bounds
    this.updateBounds(seedX, seedY);
  }
  
  // Rule 10.5: Time Budgeting (4-8ms/frame)
  processRing(timeBudgetMs: number = RING_BUDGET_MS): RingProcessResult {
    if (this.isComplete) {
      return { completed: true, timeUsed: 0 };
    }
    
    const startTime = performance.now();
    
    // Process current ring
    while (this.queue.length > 0) {
      // Check time budget
      if (performance.now() - startTime >= timeBudgetMs) {
        return { completed: false, timeUsed: performance.now() - startTime };
      }
      
      const index = this.queue.shift()!;
      if (this.visited[index] !== 1) continue;
      
      const x = index % this.width;
      const y = Math.floor(index / this.width);
      
      // Check 4-connected neighbors
      const neighbors: [number, number][] = [
        [x - 1, y], [x + 1, y],
        [x, y - 1], [x, y + 1]
      ];
      
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
        
        const nIndex = ny * this.width + nx;
        if (this.visited[nIndex] !== 0) continue;
        
        const neighborColor = this.getPixelColor(nx, ny);
        const similarity = this.colorSimilarity(this.seedColor, neighborColor);
        
        if (similarity <= this.tolerance) {
          // Accept pixel
          this.visited[nIndex] = 1;
          this.mask[nIndex] = 255;
          this.nextRing.push(nIndex);
          this.updateBounds(nx, ny);
        } else {
          // Reject pixel (add to frontier for breathing tolerance)
          this.visited[nIndex] = 2;
          this.frontier.push(nIndex);
        }
      }
    }
    
    // Move to next ring
    if (this.nextRing.length > 0) {
      this.queue = this.nextRing;
      this.nextRing = [];
      this.ringNumber++;
      return { completed: false, timeUsed: performance.now() - startTime };
    }
    
    this.isComplete = true;
    return { completed: true, timeUsed: performance.now() - startTime };
  }
  
  getCurrentMask(): Uint8ClampedArray {
    return this.mask;
  }
  
  getCurrentBounds(): Bounds {
    if (this.minX === Infinity) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    return {
      x: this.minX,
      y: this.minY,
      width: this.maxX - this.minX + 1,
      height: this.maxY - this.minY + 1
    };
  }
  
  isCompleted(): boolean {
    return this.isComplete;
  }
  
  getRingNumber(): number {
    return this.ringNumber;
  }
  
  // Rule 16: Breathing Tolerance
  updateTolerance(newTolerance: number): void {
    if (newTolerance <= this.tolerance) {
      // Tolerance decreased - need to restart (or recalculate from frontier)
      this.tolerance = newTolerance;
      return;
    }
    
    // Tolerance increased - re-test rejected frontier pixels
    this.tolerance = newTolerance;
    
    for (const index of this.frontier) {
      if (this.visited[index] !== 2) continue; // Skip if already accepted
      
      const x = index % this.width;
      const y = Math.floor(index / this.width);
      
      const color = this.getPixelColor(x, y);
      const similarity = this.colorSimilarity(this.seedColor, color);
      
      if (similarity <= this.tolerance) {
        // Accept previously rejected pixel
        this.visited[index] = 1;
        this.mask[index] = 255;
        this.queue.push(index);
        this.updateBounds(x, y);
        this.isComplete = false; // Resume expansion
      }
    }
    
    // Clear frontier of accepted pixels
    this.frontier = this.frontier.filter(idx => this.visited[idx] === 2);
  }
  
  private updateBounds(x: number, y: number): void {
    this.minX = Math.min(this.minX, x);
    this.minY = Math.min(this.minY, y);
    this.maxX = Math.max(this.maxX, x);
    this.maxY = Math.max(this.maxY, y);
  }
  
  private getPixelColor(x: number, y: number): RGBA {
    const index = (y * this.width + x) * 4;
    return {
      r: this.imageData.data[index],
      g: this.imageData.data[index + 1],
      b: this.imageData.data[index + 2],
      a: this.imageData.data[index + 3]
    };
  }
  
  // Rule 15: Perceptually Accurate Color Similarity
  private colorSimilarity(c1: RGBA, c2: RGBA): number {
    const rDiff = c1.r - c2.r;
    const gDiff = c1.g - c2.g;
    const bDiff = c1.b - c2.b;
    const aDiff = c1.a - c2.a;
    
    // Weighted for human eye sensitivity
    return Math.sqrt(
      0.3 * rDiff * rDiff +
      0.59 * gDiff * gDiff +
      0.11 * bDiff * bDiff +
      aDiff * aDiff
    );
  }
}
