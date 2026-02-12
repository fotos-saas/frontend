import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  viewChild,
  ElementRef,
  effect,
  inject,
  DestroyRef,
  AfterViewInit,
} from '@angular/core';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { LightboxMediaItem } from './media-lightbox.types';
import { ZoomDirective } from '../../directives/zoom';
import { ZoomConfig } from '../../directives/zoom/zoom.types';
import { DecimalPipe } from '@angular/common';

/**
 * Media Lightbox Component - Képek lightbox megjelenítése
 *
 * Funkciók:
 * - Teljes képernyős overlay
 * - Zoom: appZoom direktíva (pinch, wheel, double-tap)
 * - Navigáció: nyilak + billentyűzet (← →)
 * - Bezárás: ESC, X gomb, overlay kattintás
 * - Thumbnail sáv (ha több kép van)
 * - A11y: Focus trap implementálva a CDK-val
 */
@Component({
  selector: 'app-media-lightbox',
  standalone: true,
  imports: [DecimalPipe, ZoomDirective, A11yModule],
  templateUrl: './media-lightbox.component.html',
  styleUrls: ['./media-lightbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  }
})
export class MediaLightboxComponent implements AfterViewInit {
  private readonly focusTrapFactory = inject(FocusTrapFactory);

  /** Input: Média elemek */
  readonly media = input.required<LightboxMediaItem[]>();

  /** Input: Aktuális kép indexe */
  readonly currentIndex = input.required<number>();

  /** Output: Bezárás */
  readonly close = output<void>();

  /** Output: Navigáció (új index) */
  readonly navigate = output<number>();

  /** Zoom state */
  private readonly _currentZoom = signal<number>(1);
  readonly currentZoom = this._currentZoom.asReadonly();

  /** Image changing state for blur transition */
  readonly imageChanging = signal<boolean>(false);

  /** Zoom config */
  readonly zoomConfig: Partial<ZoomConfig> = {
    maxZoom: 4,
    minZoom: 1,
    zoomStep: 0.5
  };

  /** ViewChild references */
  readonly zoomDirective = viewChild<ZoomDirective>('zoomDirective');
  readonly lightboxElement = viewChild<ElementRef<HTMLDivElement>>('lightboxElement');

  /** DI */
  private readonly destroyRef = inject(DestroyRef);

  /** Focus trap */
  private focusTrap: FocusTrap | null = null;
  private previousActiveElement: HTMLElement | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.focusTrap?.destroy();
      if (this.previousActiveElement?.focus) {
        setTimeout(() => this.previousActiveElement?.focus(), 0);
      }
    });
  }

  /** Computed: aktuális média elem */
  readonly currentMedia = computed(() => {
    const items = this.media();
    const index = this.currentIndex();
    return items[index] ?? null;
  });

  /** Computed: van előző */
  readonly hasPrev = computed(() => this.currentIndex() > 0);

  /** Computed: van következő */
  readonly hasNext = computed(() => this.currentIndex() < this.media().length - 1);

  ngAfterViewInit(): void {
    // Előző fókuszált elem mentése
    this.previousActiveElement = document.activeElement as HTMLElement;

    // Focus trap létrehozása
    const element = this.lightboxElement()?.nativeElement;
    if (element) {
      this.focusTrap = this.focusTrapFactory.create(element);
      this.focusTrap.focusInitialElementWhenReady();
    }
  }

  /**
   * Keyboard event handler
   */
  onKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;

    switch (event.key) {
      case 'Escape':
        this.close.emit();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.prev();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
    }
  }

  /**
   * Overlay kattintás
   */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('media-lightbox__overlay')) {
      this.close.emit();
    }
  }

  /**
   * Előző kép
   */
  prev(): void {
    if (!this.hasPrev()) return;
    this.navigateTo(this.currentIndex() - 1);
  }

  /**
   * Következő kép
   */
  next(): void {
    if (!this.hasNext()) return;
    this.navigateTo(this.currentIndex() + 1);
  }

  /**
   * Navigáció adott indexre
   */
  navigateTo(index: number): void {
    if (index < 0 || index >= this.media().length) return;
    if (index === this.currentIndex()) return;

    this.imageChanging.set(true);
    setTimeout(() => {
      this.navigate.emit(index);
      this.resetZoom();
      setTimeout(() => this.imageChanging.set(false), 30);
    }, 80);
  }

  // ==================== ZOOM ====================

  onZoomChange(zoom: number): void {
    this._currentZoom.set(zoom);
  }

  zoomIn(): void {
    this.zoomDirective()?.zoomIn();
  }

  zoomOut(): void {
    this.zoomDirective()?.zoomOut();
  }

  resetZoom(): void {
    this.zoomDirective()?.resetZoom();
    this._currentZoom.set(1);
  }

  /** TrackBy for media items */
  trackByMedia(index: number, media: LightboxMediaItem): number {
    return media.id;
  }
}
