import {
  Directive,
  ElementRef,
  input,
  output,
  OnInit,
  Renderer2,
  inject,
  signal,
  DestroyRef,
  NgZone,
  effect
} from '@angular/core';
import { ZoomConfig, ZoomState, PanPosition, PanBounds, DEFAULT_ZOOM_CONFIG, INITIAL_ZOOM_STATE } from './zoom.types';

/**
 * Zoom directive for image lightbox with mobile and desktop support.
 *
 * Features:
 * - Desktop: mouse wheel zoom, mouse pan, keyboard shortcuts
 * - Mobile: pinch-to-zoom, double-tap zoom, touch pan
 * - Configurable: enable/disable features via config
 * - Performance: RAF-optimized, GPU-accelerated transforms
 * - Security: Uses Renderer2 for DOM manipulation
 *
 * Usage:
 * ```html
 * <img appZoom
 *      [zoomEnabled]="true"
 *      [zoomConfig]="{ maxZoom: 4 }"
 *      (zoomChangeEvent)="onZoomChange($event)" />
 * ```
 */
@Directive({
  selector: '[appZoom]',
  standalone: true,
  exportAs: 'appZoom'
})
export class ZoomDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  /** Signal-based inputs */
  readonly zoomEnabled = input<boolean>(true);
  readonly zoomConfig = input<Partial<ZoomConfig>>({});

  /** Signal-based outputs */
  readonly zoomChangeEvent = output<number>();
  readonly panChangeEvent = output<PanPosition>();

  /** Internal config state - updated via effect */
  private config: ZoomConfig = { ...DEFAULT_ZOOM_CONFIG };

  constructor() {
    // Update config when zoomConfig input changes
    effect(() => {
      const configInput = this.zoomConfig();
      this.config = { ...DEFAULT_ZOOM_CONFIG, ...configInput };
    });
  }

  /** Current zoom state as signal */
  public readonly state = signal<ZoomState>(INITIAL_ZOOM_STATE);

  /** Current zoom level (convenience getter) */
  public get currentZoom(): number {
    return this.state().zoom;
  }

  // Gesture tracking
  private touchStartDistance = 0;
  private touchStartZoom = 1;
  private panStartX = 0;
  private panStartY = 0;
  private panInitialX = 0;
  private panInitialY = 0;
  private lastTapTime = 0;
  private readonly DOUBLE_TAP_DELAY = 300;

  // RAF optimization
  private rafId: number | null = null;
  private pendingUpdate = false;

  // Event listener cleanup
  private cleanupFns: (() => void)[] = [];

  public ngOnInit(): void {
    if (!this.zoomEnabled()) return;

    this.setupElement();
    this.setupEventListeners();

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => this.cleanup());
  }

  /** Zoom in by step */
  public zoomIn(): void {
    if (!this.zoomEnabled()) return;
    this.zoomTo(this.state().zoom + this.config.zoomStep);
  }

  /** Zoom out by step */
  public zoomOut(): void {
    if (!this.zoomEnabled()) return;
    this.zoomTo(this.state().zoom - this.config.zoomStep);
  }

  /** Reset zoom to 1x */
  public resetZoom(): void {
    if (!this.zoomEnabled()) return;
    this.updateState({ zoom: 1, panX: 0, panY: 0, isZooming: false, isPanning: false });
    this.updateTransform();
    this.zoomChangeEvent.emit(1);
    this.panChangeEvent.emit({ x: 0, y: 0 });
  }

  /** Zoom to specific level */
  public zoomTo(level: number): void {
    if (!this.zoomEnabled()) return;

    const clampedZoom = this.clampZoom(level);
    if (clampedZoom === this.state().zoom) return;

    // Reset pan when returning to 1x
    const newPanX = clampedZoom === 1 ? 0 : this.state().panX;
    const newPanY = clampedZoom === 1 ? 0 : this.state().panY;

    this.updateState({ zoom: clampedZoom, panX: newPanX, panY: newPanY });
    this.updateTransform();
    this.zoomChangeEvent.emit(clampedZoom);
  }

  /** Reinitialize for new image */
  public reinitialize(): void {
    this.updateState(INITIAL_ZOOM_STATE);
    this.updateTransform();
    this.zoomChangeEvent.emit(1);
  }

  // === Private Methods ===

  private setupElement(): void {
    const el = this.el.nativeElement;
    this.renderer.setStyle(el, 'cursor', 'grab');
    this.renderer.setStyle(el, 'will-change', 'transform');
    this.renderer.setStyle(el, 'transition', 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)');
    this.renderer.setStyle(el, 'touch-action', 'none');
    this.renderer.setStyle(el, '-webkit-touch-action', 'none');
  }

  private setupEventListeners(): void {
    const el = this.el.nativeElement;

    // Run outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      // Mouse wheel
      if (this.config.enableWheel) {
        const wheelFn = (e: WheelEvent) => this.onWheel(e);
        el.addEventListener('wheel', wheelFn, { passive: false });
        this.cleanupFns.push(() => el.removeEventListener('wheel', wheelFn));
      }

      // Touch events
      if (this.config.enablePinch || this.config.enableDoubleTap || this.config.enablePan) {
        const touchStartFn = (e: TouchEvent) => this.onTouchStart(e);
        const touchMoveFn = (e: TouchEvent) => this.onTouchMove(e);
        const touchEndFn = () => this.onTouchEnd();

        el.addEventListener('touchstart', touchStartFn, { passive: false });
        el.addEventListener('touchmove', touchMoveFn, { passive: false });
        el.addEventListener('touchend', touchEndFn);

        this.cleanupFns.push(() => {
          el.removeEventListener('touchstart', touchStartFn);
          el.removeEventListener('touchmove', touchMoveFn);
          el.removeEventListener('touchend', touchEndFn);
        });
      }

      // Mouse pan
      if (this.config.enablePan) {
        const mouseDownFn = (e: MouseEvent) => this.onMouseDown(e);
        const mouseMoveFn = (e: MouseEvent) => this.onMouseMove(e);
        const mouseUpFn = () => this.onMouseUp();

        el.addEventListener('mousedown', mouseDownFn);
        document.addEventListener('mousemove', mouseMoveFn);
        document.addEventListener('mouseup', mouseUpFn);

        this.cleanupFns.push(() => {
          el.removeEventListener('mousedown', mouseDownFn);
          document.removeEventListener('mousemove', mouseMoveFn);
          document.removeEventListener('mouseup', mouseUpFn);
        });
      }

      // Double click
      if (this.config.enableDoubleTap) {
        const dblClickFn = () => this.onDoubleClick();
        el.addEventListener('dblclick', dblClickFn);
        this.cleanupFns.push(() => el.removeEventListener('dblclick', dblClickFn));
      }
    });
  }

  private onWheel(ev: WheelEvent): void {
    if (!this.zoomEnabled()) return;
    ev.preventDefault();

    const delta = ev.deltaY > 0 ? -this.config.zoomStep : this.config.zoomStep;
    const multiplier = ev.ctrlKey ? 2 : 1;

    this.ngZone.run(() => this.zoomTo(this.state().zoom + delta * multiplier));
  }

  private onTouchStart(ev: TouchEvent): void {
    if (!this.zoomEnabled()) return;

    if (ev.touches.length === 2 && this.config.enablePinch) {
      ev.preventDefault();
      this.touchStartDistance = this.getTouchDistance(ev.touches[0], ev.touches[1]);
      this.touchStartZoom = this.state().zoom;
      this.updateState({ isZooming: true });
    } else if (ev.touches.length === 1) {
      this.handleSingleTouch(ev);
    }
  }

  private onTouchMove(ev: TouchEvent): void {
    if (!this.zoomEnabled()) return;

    const currentState = this.state();

    if (ev.touches.length === 2 && currentState.isZooming && this.config.enablePinch) {
      ev.preventDefault();
      this.handlePinchMove(ev);
    } else if (ev.touches.length === 1 && currentState.isPanning && this.config.enablePan) {
      ev.preventDefault();
      this.handlePanMove(ev.touches[0]);
    }
  }

  private onTouchEnd(): void {
    const wasPanning = this.state().isPanning;
    this.updateState({ isZooming: false, isPanning: false });

    // Re-enable transition after pan
    if (wasPanning) {
      this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)');
    }
  }

  private onMouseDown(ev: MouseEvent): void {
    if (!this.zoomEnabled || this.state().zoom <= 1) return;

    ev.preventDefault();
    this.updateState({ isPanning: true });
    this.panStartX = ev.clientX - this.state().panX;
    this.panStartY = ev.clientY - this.state().panY;

    // Disable transition during pan for instant response
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'none');
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grabbing');
  }

  private onMouseMove(ev: MouseEvent): void {
    if (!this.state().isPanning) return;

    const newPanX = ev.clientX - this.panStartX;
    const newPanY = ev.clientY - this.panStartY;
    const clamped = this.clampPan(newPanX, newPanY);

    this.updateState({ panX: clamped.x, panY: clamped.y });
    this.updateTransform();
    this.ngZone.run(() => this.panChangeEvent.emit(clamped));
  }

  private onMouseUp(): void {
    if (!this.state().isPanning) return;

    this.updateState({ isPanning: false });

    // Re-enable transition after pan
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)');
    const cursor = this.state().zoom > 1 ? 'grab' : 'default';
    this.renderer.setStyle(this.el.nativeElement, 'cursor', cursor);
  }

  private onDoubleClick(): void {
    if (!this.zoomEnabled || !this.config.enableDoubleTap) return;

    this.ngZone.run(() => {
      if (this.state().zoom === 1) {
        this.zoomTo(2);
      } else {
        this.resetZoom();
      }
    });
  }

  private handleSingleTouch(ev: TouchEvent): void {
    const now = Date.now();
    const timeSinceLastTap = now - this.lastTapTime;

    if (timeSinceLastTap < this.DOUBLE_TAP_DELAY && this.config.enableDoubleTap) {
      ev.preventDefault();
      this.ngZone.run(() => {
        if (this.state().zoom === 1) {
          this.zoomTo(2);
        } else {
          this.resetZoom();
        }
      });
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;

      if (this.state().zoom > 1 && this.config.enablePan) {
        this.panStartX = ev.touches[0].clientX;
        this.panStartY = ev.touches[0].clientY;
        this.panInitialX = this.state().panX;
        this.panInitialY = this.state().panY;
        this.updateState({ isPanning: true });

        // Disable transition during pan for instant response
        this.renderer.setStyle(this.el.nativeElement, 'transition', 'none');
      }
    }
  }

  private handlePinchMove(ev: TouchEvent): void {
    if (this.pendingUpdate) return;

    this.pendingUpdate = true;
    this.rafId = requestAnimationFrame(() => {
      const currentDistance = this.getTouchDistance(ev.touches[0], ev.touches[1]);
      const scale = currentDistance / this.touchStartDistance;
      const newZoom = this.clampZoom(this.touchStartZoom * scale);

      this.updateState({ zoom: newZoom });
      this.updateTransform();
      this.ngZone.run(() => this.zoomChangeEvent.emit(newZoom));

      this.pendingUpdate = false;
    });
  }

  private handlePanMove(touch: Touch): void {
    const deltaX = touch.clientX - this.panStartX;
    const deltaY = touch.clientY - this.panStartY;
    const clamped = this.clampPan(this.panInitialX + deltaX, this.panInitialY + deltaY);

    this.updateState({ panX: clamped.x, panY: clamped.y });
    this.updateTransform();
    this.ngZone.run(() => this.panChangeEvent.emit(clamped));
  }

  private updateState(partial: Partial<ZoomState>): void {
    this.state.update(current => ({ ...current, ...partial }));
  }

  private updateTransform(): void {
    const { zoom, panX, panY } = this.state();
    const transform = `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px) translateZ(0)`;
    this.renderer.setStyle(this.el.nativeElement, 'transform', transform);
  }

  private clampZoom(level: number): number {
    return Math.max(this.config.minZoom, Math.min(this.config.maxZoom, level));
  }

  private clampPan(panX: number, panY: number): PanPosition {
    const bounds = this.calculateBounds();
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, panX)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, panY))
    };
  }

  private calculateBounds(): PanBounds {
    const el = this.el.nativeElement;
    const zoom = this.state().zoom;
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement?.getBoundingClientRect();

    if (!parent) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const scaledWidth = rect.width * zoom;
    const scaledHeight = rect.height * zoom;
    const excessWidth = Math.max(0, (scaledWidth - parent.width) / 2);
    const excessHeight = Math.max(0, (scaledHeight - parent.height) / 2);

    return {
      minX: -excessWidth,
      maxX: excessWidth,
      minY: -excessHeight,
      maxY: excessHeight
    };
  }

  private getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private cleanup(): void {
    // Cancel RAF
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Remove event listeners
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];

    // Reset transform
    this.renderer.removeStyle(this.el.nativeElement, 'transform');
  }
}
