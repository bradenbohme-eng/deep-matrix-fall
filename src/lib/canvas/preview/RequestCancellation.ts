// Rule 13: Request Cancellation is Required
// Prevents old previews from overwriting new ones

export class RequestCancellation {
  private currentRequestId: number = 0;
  private validRequests: Set<number> = new Set();
  
  /**
   * Start a new preview request
   * @returns Unique request ID
   */
  startPreview(): number {
    // Invalidate all previous requests
    this.cancelAll();
    
    // Generate new ID
    this.currentRequestId++;
    this.validRequests.add(this.currentRequestId);
    
    return this.currentRequestId;
  }
  
  /**
   * Check if a request is still valid
   * @param requestId The request ID to check
   * @returns true if valid, false if cancelled
   */
  isValid(requestId: number): boolean {
    return this.validRequests.has(requestId);
  }
  
  /**
   * Cancel a specific request
   * @param requestId The request ID to cancel
   */
  cancel(requestId: number): void {
    this.validRequests.delete(requestId);
  }
  
  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    this.validRequests.clear();
  }
  
  /**
   * Get the current request ID
   */
  getCurrentRequestId(): number {
    return this.currentRequestId;
  }
}
