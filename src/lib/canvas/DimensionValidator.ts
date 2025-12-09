// Rule 8: ImageData Must Be Dimension-Validated

export class DimensionValidator {
  /**
   * Validate ImageData dimensions match expected size
   */
  static validate(
    imageData: ImageData | null,
    expectedWidth: number,
    expectedHeight: number,
    context: string
  ): boolean {
    if (!imageData) {
      console.warn(`[DimensionValidator] ${context}: ImageData is null`);
      return false;
    }

    if (imageData.width !== expectedWidth || imageData.height !== expectedHeight) {
      console.warn(
        `[DimensionValidator] ${context}: Dimension mismatch. ` +
        `Expected ${expectedWidth}×${expectedHeight}, got ${imageData.width}×${imageData.height}`
      );
      return false;
    }

    const expectedDataLength = expectedWidth * expectedHeight * 4;
    if (imageData.data.length !== expectedDataLength) {
      console.warn(
        `[DimensionValidator] ${context}: Data length mismatch. ` +
        `Expected ${expectedDataLength}, got ${imageData.data.length}`
      );
      return false;
    }

    return true;
  }

  /**
   * Validate or throw error
   */
  static validateOrThrow(
    imageData: ImageData | null,
    expectedWidth: number,
    expectedHeight: number,
    context: string
  ): void {
    if (!this.validate(imageData, expectedWidth, expectedHeight, context)) {
      throw new Error(
        `[DimensionValidator] ${context}: Validation failed. ` +
        `Expected ${expectedWidth}×${expectedHeight}`
      );
    }
  }

  /**
   * Validate mask matches ImageData dimensions
   */
  static validateMask(
    mask: Uint8ClampedArray | Uint8Array,
    imageData: ImageData,
    context: string
  ): boolean {
    const expectedLength = imageData.width * imageData.height;
    
    if (mask.length !== expectedLength) {
      console.warn(
        `[DimensionValidator] ${context}: Mask length mismatch. ` +
        `Expected ${expectedLength}, got ${mask.length}`
      );
      return false;
    }

    return true;
  }

  /**
   * Create validated ImageData
   */
  static createValidated(
    width: number,
    height: number,
    context: string
  ): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error(`[DimensionValidator] ${context}: Cannot get 2D context`);
    }
    
    return ctx.createImageData(width, height);
  }
}
