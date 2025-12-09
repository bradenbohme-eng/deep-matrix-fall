// V3 Image Editor Type Definitions

// Tagged coordinate types to prevent mixing
export interface ScreenPoint {
  x: number;
  y: number;
  __space: 'screen';
}

export interface WorldPoint {
  x: number;
  y: number;
  __space: 'world';
}

export interface ImagePoint {
  x: number;
  y: number;
  __space: 'image';
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayerBounds extends Bounds {}

export interface SelectionMask {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  bounds: Bounds;
}

export interface CoordinateSystemState {
  panX: number;
  panY: number;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
}

export type ToolType = 
  | 'select'
  | 'move'
  | 'crop'
  | 'marquee'
  | 'magic-wand'
  | 'brush'
  | 'eraser'
  | 'healing'
  | 'clone'
  | 'pen'
  | 'text'
  | 'rectangle'
  | 'gradient'
  | 'color-adjust';

export type BlendMode = 
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  bounds: LayerBounds;
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap | null;
  dataUrl?: string;
  imageUrl?: string;
  transform?: {
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  mask?: SelectionMask;
}

export interface EditorProject {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: Layer[];
  selectedLayerId: string | null;
  selection: SelectionMask | null;
}

export interface HistoryEntry {
  state: EditorState;
  action: string;
  timestamp: number;
}

export interface EditorState {
  project: EditorProject | null;
  activeTool: ToolType;
  zoom: number;
  panX: number;
  panY: number;
  isProcessing: boolean;
  history: HistoryEntry[];
  historyIndex: number;
}

export interface RingProcessResult {
  completed: boolean;
  timeUsed: number;
}

export interface PreviewResult {
  mask: Uint8ClampedArray;
  bounds: Bounds;
  complete: boolean;
}

export type PreviewCallback = (result: PreviewResult) => void;
