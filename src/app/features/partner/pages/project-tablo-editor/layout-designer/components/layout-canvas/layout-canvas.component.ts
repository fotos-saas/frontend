import {
  Component, ChangeDetectionStrategy, inject, computed,
  signal, NgZone, DestroyRef, output, input,
} from '@angular/core';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutLayerComponent } from '../layout-layer/layout-layer.component';
import { LayoutGridOverlayComponent } from '../layout-grid-overlay/layout-grid-overlay.component';
import { LayoutFloatingToolbarComponent } from '../layout-floating-toolbar/layout-floating-toolbar.component';

/** Minimális mozgás (px) hogy marquee induljon — nem indul el véletlenül */
const MARQUEE_THRESHOLD = 3;

/**
 * Layout Canvas — arányos konténer, benne a layerek.
 * A PSD dokumentumot szimulálja fehér háttérrel.
 * Támogatja a marquee (téglalap) kijelölést az üres területen.
 */
@Component({
  selector: 'app-layout-canvas',
  standalone: true,
  imports: [LayoutLayerComponent, LayoutGridOverlayComponent, LayoutFloatingToolbarComponent],
  templateUrl: './layout-canvas.component.html',
  styleUrl: './layout-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutCanvasComponent {
  readonly state = inject(LayoutDesignerStateService);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly linking = input<boolean>(false);

  readonly uploadPhotoClicked = output<void>();
  readonly linkLayersClicked = output<void>();
  readonly unlinkLayersClicked = output<void>();

  readonly scaleInfo = this.state.scaleInfo;

  /** Overlay → canvas-area konverziós konstansok */
  private static readonly TOOLBAR_HEIGHT = 56;
  private static readonly SIDEBAR_WIDTH = 220;

  /** Canvas pozíció (overlay contentRect-hez képest → canvas-area-ra konvertálva) */
  readonly canvasLeft = computed(() => this.scaleInfo().offsetX - LayoutCanvasComponent.SIDEBAR_WIDTH);
  readonly canvasTop = computed(() => this.scaleInfo().offsetY - LayoutCanvasComponent.TOOLBAR_HEIGHT);

  /** Marquee kiindulási pont (wrapper-hez relatív px) */
  readonly marqueeStart = signal<{ x: number; y: number } | null>(null);

  /** Marquee aktuális végpont (wrapper-hez relatív px) */
  readonly marqueeCurrent = signal<{ x: number; y: number } | null>(null);

  /** Marquee téglalap (CSS-hez) */
  readonly marqueeRect = computed(() => {
    const start = this.marqueeStart();
    const current = this.marqueeCurrent();
    if (!start || !current) return null;

    return {
      left: Math.min(start.x, current.x),
      top: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    };
  });

  /** Mozgás volt-e a threshold felett */
  private marqueeStarted = false;

  /** Eredeti mousedown pozíció (threshold számításhoz) */
  private rawStart: { x: number; y: number } | null = null;

  /** Cmd/Ctrl nyomva volt-e a mousedown-kor */
  private marqueeAdditive = false;

  /** Globális listener cleanup függvények */
  private cleanupMove: (() => void) | null = null;
  private cleanupUp: (() => void) | null = null;

  isLayerSelected(layerId: number): boolean {
    return this.state.selectedLayerIds().has(layerId);
  }

  /** Wrapper mousedown: marquee indítása ha üres területre kattintottunk */
  onWrapperMouseDown(event: MouseEvent): void {
    // Csak bal klikk
    if (event.button !== 0) return;

    // Ha layer elemre kattintottunk, NE indítsunk marquee-t
    const target = event.target as HTMLElement;
    if (this.isLayerElement(target)) return;

    // Cmd/Ctrl/Shift nélkül → kijelölés törlése
    const additive = event.metaKey || event.ctrlKey || event.shiftKey;
    if (!additive) {
      this.state.clearSelection();
    }

    // Wrapper-hez relatív pozíció
    const wrapperRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - wrapperRect.left;
    const y = event.clientY - wrapperRect.top;

    this.rawStart = { x, y };
    this.marqueeAdditive = additive;
    this.marqueeStarted = false;

    // Globális listenerek zone-on kívül (performance)
    this.zone.runOutsideAngular(() => {
      const onMove = (e: MouseEvent) => this.onMouseMove(e, wrapperRect);
      const onUp = (e: MouseEvent) => this.onMouseUp(e);

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);

      this.cleanupMove = () => document.removeEventListener('mousemove', onMove);
      this.cleanupUp = () => document.removeEventListener('mouseup', onUp);
    });

    event.preventDefault();
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.cleanupListeners());
  }

  /** Mousemove: marquee frissítése */
  private onMouseMove(event: MouseEvent, wrapperRect: DOMRect): void {
    if (!this.rawStart) return;

    const x = event.clientX - wrapperRect.left;
    const y = event.clientY - wrapperRect.top;

    // Threshold ellenőrzés
    if (!this.marqueeStarted) {
      const dx = Math.abs(x - this.rawStart.x);
      const dy = Math.abs(y - this.rawStart.y);
      if (dx < MARQUEE_THRESHOLD && dy < MARQUEE_THRESHOLD) return;
      this.marqueeStarted = true;
    }

    // Signal frissítés zone-ban (CD trigger)
    this.zone.run(() => {
      this.marqueeStart.set(this.rawStart);
      this.marqueeCurrent.set({ x, y });
    });
  }

  /** Mouseup: kijelölés végrehajtása + cleanup */
  private onMouseUp(_event: MouseEvent): void {
    if (this.marqueeStarted) {
      this.zone.run(() => {
        const matched = this.getLayersInMarquee();
        if (matched.size > 0) {
          if (this.marqueeAdditive) {
            this.state.addToSelection(matched);
          } else {
            this.state.selectLayers(matched);
          }
        }
      });
    }

    // Cleanup
    this.zone.run(() => {
      this.marqueeStart.set(null);
      this.marqueeCurrent.set(null);
    });
    this.rawStart = null;
    this.marqueeStarted = false;
    this.cleanupListeners();
  }

  /** Marquee téglalap alá eső layerek keresése */
  private getLayersInMarquee(): Set<number> {
    const rect = this.marqueeRect();
    if (!rect) return new Set();

    const si = this.scaleInfo();
    const layers = this.state.layers();

    // Marquee screen px → PSD koordináta konverzió
    const canvasLeft = si.offsetX - LayoutCanvasComponent.SIDEBAR_WIDTH;
    const canvasTopPx = si.offsetY - LayoutCanvasComponent.TOOLBAR_HEIGHT;

    const psdLeft = (rect.left - canvasLeft) / si.scale;
    const psdTop = (rect.top - canvasTopPx) / si.scale;
    const psdRight = (rect.left + rect.width - canvasLeft) / si.scale;
    const psdBottom = (rect.top + rect.height - canvasTopPx) / si.scale;

    const matched = new Set<number>();

    for (const l of layers) {
      // Fixed layerek nem kijelölhetők marquee-vel
      if (l.category === 'fixed') continue;

      const lx = l.editedX ?? l.x;
      const ly = l.editedY ?? l.y;
      const lr = lx + l.width;
      const lb = ly + l.height;

      // AABB átfedés teszt
      if (lx < psdRight && lr > psdLeft && ly < psdBottom && lb > psdTop) {
        matched.add(l.layerId);
      }
    }

    return matched;
  }

  /** Ellenőrzi hogy egy elem layer-e, floating toolbar-e (vagy azok gyereke) */
  private isLayerElement(el: HTMLElement): boolean {
    let current: HTMLElement | null = el;
    while (current) {
      if (current.classList.contains('designer-layer')) return true;
      if (current.classList.contains('floating-toolbar')) return true;
      if (current.classList.contains('layout-canvas-wrapper')) return false;
      current = current.parentElement;
    }
    return false;
  }

  /** Globális listener cleanup */
  private cleanupListeners(): void {
    this.cleanupMove?.();
    this.cleanupUp?.();
    this.cleanupMove = null;
    this.cleanupUp = null;
  }
}
