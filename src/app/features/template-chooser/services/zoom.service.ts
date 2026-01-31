import { Injectable, signal, computed } from '@angular/core';

/**
 * ZoomService - Zoom funkcionalitás kezelése
 *
 * Újrafelhasználható service zoom funkcióhoz:
 * - Zoom in/out
 * - Reset zoom
 * - Continuous zoom (long press)
 * - Zoom level signal
 */
@Injectable()
export class ZoomService {
  /** Current zoom level */
  private readonly _currentZoom = signal<number>(1);

  /** Zoom configuration */
  private readonly _config = signal<ZoomConfig>({
    minZoom: 1,
    maxZoom: 4,
    zoomStep: 0.5
  });

  /** Continuous zoom interval */
  private continuousZoomInterval: ReturnType<typeof setInterval> | null = null;

  /** Readonly zoom level signal */
  readonly currentZoom = this._currentZoom.asReadonly();

  /** Computed: can zoom in */
  readonly canZoomIn = computed(() => this._currentZoom() < this._config().maxZoom);

  /** Computed: can zoom out */
  readonly canZoomOut = computed(() => this._currentZoom() > this._config().minZoom);

  /** Computed: is at default zoom */
  readonly isAtDefault = computed(() => this._currentZoom() === 1);

  /** Computed: zoom percentage */
  readonly zoomPercentage = computed(() => Math.round(this._currentZoom() * 100));

  /**
   * Configure zoom settings
   */
  configure(config: Partial<ZoomConfig>): void {
    this._config.update(c => ({ ...c, ...config }));
  }

  /**
   * Zoom in by one step
   */
  zoomIn(): void {
    const config = this._config();
    this._currentZoom.update(zoom =>
      Math.min(zoom + config.zoomStep, config.maxZoom)
    );
  }

  /**
   * Zoom out by one step
   */
  zoomOut(): void {
    const config = this._config();
    this._currentZoom.update(zoom =>
      Math.max(zoom - config.zoomStep, config.minZoom)
    );
  }

  /**
   * Reset zoom to 1x
   */
  resetZoom(): void {
    this._currentZoom.set(1);
  }

  /**
   * Set zoom to specific value
   */
  setZoom(value: number): void {
    const config = this._config();
    this._currentZoom.set(
      Math.max(config.minZoom, Math.min(value, config.maxZoom))
    );
  }

  /**
   * Start continuous zoom (for long press)
   * @param direction 'in' or 'out'
   * @param intervalMs Interval in milliseconds (default: 100)
   */
  startContinuousZoom(direction: 'in' | 'out', intervalMs = 100): void {
    this.stopContinuousZoom();

    // Initial zoom
    if (direction === 'in') {
      this.zoomIn();
    } else {
      this.zoomOut();
    }

    // Continue zooming while pressed
    this.continuousZoomInterval = setInterval(() => {
      if (direction === 'in') {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    }, intervalMs);
  }

  /**
   * Stop continuous zoom
   */
  stopContinuousZoom(): void {
    if (this.continuousZoomInterval) {
      clearInterval(this.continuousZoomInterval);
      this.continuousZoomInterval = null;
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    this.stopContinuousZoom();
  }
}

/**
 * Zoom configuration interface
 */
export interface ZoomConfig {
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
}
