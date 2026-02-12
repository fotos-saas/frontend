import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Renderer2,
  viewChild,
  OnInit,
  DestroyRef,
  inject,
} from '@angular/core';
import { ZoomDirective } from '../../directives/zoom';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { SampleLightboxItem } from './samples-lightbox.types';
import { createBackdropHandler } from '../../utils/dialog.util';

/**
 * Samples Lightbox Component - Közös minták lightbox
 *
 * Használható: SamplesComponent (mintaképek oldal), SamplesModalComponent (partner)
 *
 * Funkciók:
 * - Zoom (pinch, wheel, gombok, long press)
 * - Navigáció (nyíl gombok, keyboard)
 * - Leírás panel (opcionális, ha van description)
 * - Meta bar (dátum, verzió badge, zoom controls, counter)
 */
@Component({
  selector: 'app-samples-lightbox',
  standalone: true,
  imports: [ZoomDirective, SafeHtmlPipe, DatePipe, DecimalPipe],
  templateUrl: './samples-lightbox.component.html',
  styleUrls: ['./samples-lightbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  }
})
export class SamplesLightboxComponent implements OnInit {
  /** Backdrop handler a kijelölés közbeni bezárás megelőzéséhez */
  readonly backdropHandler = createBackdropHandler(() => this.close.emit(), 'lightbox');

  /** Samples lista */
  readonly samples = input.required<SampleLightboxItem[]>();

  /** Aktuális index */
  readonly currentIndex = input.required<number>();

  /** Bezárás event */
  readonly close = output<void>();

  /** Navigáció event - új index */
  readonly navigate = output<number>();

  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.stopContinuousZoom();
      this.renderer.removeStyle(document.body, 'overflow');
    });
  }

  /** Description doboz nyitva van-e */
  descriptionOpen = true;

  /** Zoom enabled toggle */
  zoomEnabled = true;

  /** Current zoom level */
  currentZoom = 1;

  /** Zoom config - mobilon nagyobb max zoom */
  get zoomConfig(): { maxZoom: number } {
    const isMobile = window.innerWidth <= 768;
    return { maxZoom: isMobile ? 8 : 4 };
  }

  /** Max zoom for UI display */
  get maxZoom(): number {
    return this.zoomConfig.maxZoom;
  }

  /** Reference to zoom directive */
  readonly zoomDirective = viewChild<ZoomDirective>('zoomDirective');

  /** Long press zoom interval */
  private zoomInterval: ReturnType<typeof setInterval> | null = null;

  /** Aktuális sample */
  get currentSample(): SampleLightboxItem | null {
    return this.samples()[this.currentIndex()] || null;
  }

  /** Első kép-e */
  get isFirst(): boolean {
    return this.currentIndex() === 0;
  }

  /** Utolsó kép-e */
  get isLast(): boolean {
    return this.currentIndex() === this.samples().length - 1;
  }

  ngOnInit(): void {
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  /** Keyboard navigáció */
  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.close.emit();
        break;
      case 'ArrowLeft':
        if (this.currentZoom === 1) this.prevImage();
        break;
      case 'ArrowRight':
        if (this.currentZoom === 1) this.nextImage();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
      case '_':
        event.preventDefault();
        this.zoomOut();
        break;
      case '0':
        event.preventDefault();
        this.resetZoom();
        break;
    }
  }

  /** Előző kép */
  prevImage(): void {
    if (this.currentIndex() > 0) {
      this.currentZoom = 1;
      this.zoomDirective()?.reinitialize();
      this.navigate.emit(this.currentIndex() - 1);
    }
  }

  /** Következő kép */
  nextImage(): void {
    if (this.currentIndex() < this.samples().length - 1) {
      this.currentZoom = 1;
      this.zoomDirective()?.reinitialize();
      this.navigate.emit(this.currentIndex() + 1);
    }
  }

  /** Handle zoom change from directive */
  onZoomChange(zoom: number): void {
    this.currentZoom = zoom;
    this.cdr.markForCheck();
  }

  /** Zoom controls */
  zoomIn(): void {
    this.zoomDirective()?.zoomIn();
  }

  zoomOut(): void {
    this.zoomDirective()?.zoomOut();
  }

  resetZoom(): void {
    this.zoomDirective()?.resetZoom();
  }

  /** Start continuous zoom on long press */
  startContinuousZoom(direction: 'in' | 'out'): void {
    this.stopContinuousZoom();
    const zoomFn = direction === 'in' ? () => this.zoomIn() : () => this.zoomOut();
    zoomFn();
    this.zoomInterval = setInterval(() => {
      zoomFn();
      this.cdr.markForCheck();
    }, 120);
  }

  /** Stop continuous zoom */
  stopContinuousZoom(): void {
    if (this.zoomInterval) {
      clearInterval(this.zoomInterval);
      this.zoomInterval = null;
    }
  }


  /** Cache-buster hozzáadása URL-hez */
  getFullSizeUrl(url: string | undefined): string {
    if (!url) return '';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}full=1`;
  }

  /** Toggle description panel */
  toggleDescription(): void {
    this.descriptionOpen = !this.descriptionOpen;
  }
}
