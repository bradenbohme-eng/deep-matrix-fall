// V3 Image Editor Constants - Single Source of Truth

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const CANVAS_BG = '#1a1a1a';

// Zoom limits
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;
export const ZOOM_STEP = 0.1;

// Performance budgets
export const FRAME_BUDGET_MS = 16.67; // 60fps target
export const RING_BUDGET_MS = 6; // Time budget per ring in progressive preview

// Checkerboard pattern
export const CHECKERBOARD_SIZE = 10;
export const CHECKERBOARD_LIGHT = '#2d2d2d';
export const CHECKERBOARD_DARK = '#1a1a1a';

// Selection rendering
export const SELECTION_STROKE_WIDTH = 1;
export const SELECTION_DASH_PATTERN = [4, 4];
export const SELECTION_ANIMATION_SPEED = 20; // ms per step

// Color similarity thresholds
export const DEFAULT_TOLERANCE = 32;
export const MAX_TOLERANCE = 255;
