/**
 * Zoom configuration options
 */
export interface ZoomConfig {
  /** Minimum zoom level (default: 1) */
  minZoom: number;
  /** Maximum zoom level (default: 3) */
  maxZoom: number;
  /** Zoom step for buttons/keyboard (default: 0.25) */
  zoomStep: number;
  /** Enable pinch-to-zoom on mobile (default: true) */
  enablePinch: boolean;
  /** Enable mouse wheel zoom (default: true) */
  enableWheel: boolean;
  /** Enable double-tap/click zoom (default: true) */
  enableDoubleTap: boolean;
  /** Enable panning when zoomed (default: true) */
  enablePan: boolean;
}

/**
 * Default zoom configuration
 */
export const DEFAULT_ZOOM_CONFIG: ZoomConfig = {
  minZoom: 1,
  maxZoom: 3,
  zoomStep: 0.25,
  enablePinch: true,
  enableWheel: true,
  enableDoubleTap: true,
  enablePan: true
};

/**
 * Zoom state interface
 */
export interface ZoomState {
  /** Current zoom level */
  zoom: number;
  /** Pan X offset */
  panX: number;
  /** Pan Y offset */
  panY: number;
  /** Is currently zooming */
  isZooming: boolean;
  /** Is currently panning */
  isPanning: boolean;
}

/**
 * Initial zoom state
 */
export const INITIAL_ZOOM_STATE: ZoomState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  isZooming: false,
  isPanning: false
};

/**
 * Pan position
 */
export interface PanPosition {
  x: number;
  y: number;
}

/**
 * Pan bounds
 */
export interface PanBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
