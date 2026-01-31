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
  DestroyRef
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Template } from '../../services/template-chooser.service';
import { ZoomDirective } from '../../../../shared/directives/zoom';
import { ZoomConfig } from '../../../../shared/directives/zoom/zoom.types';
import { DragScrollService } from '../../services/drag-scroll.service';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';

/**
 * LightboxComponent - Template előnézet lightbox
 *
 * Újrafelhasználható lightbox komponens:
 * - Template képek előnézete
 * - Zoom funkció (pinch/wheel/buttons)
 * - Keyboard navigation (ESC, Arrow keys, Space)
 * - Thumbnail galéria drag scroll-lal
 * - Lazy thumbnail loading
 */
@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [DecimalPipe, ZoomDirective],
  templateUrl: './lightbox.component.html',
  styleUrls: ['./lightbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DragScrollService]
})
export class LightboxComponent {
  /** Backdrop handler a kijelölés közbeni bezárás megelőzéséhez */
  readonly backdropHandler = createBackdropHandler(() => this.closeRequest.emit(), 'lightbox__overlay');

  /** Input: Open state */
  readonly isOpen = input.required<boolean>();

  /** Input: Current template to display */
  readonly template = input.required<Template | null>();

  /** Input: All templates for navigation */
  readonly templates = input.required<Template[]>();

  /** Input: Selection check function */
  readonly isSelectedFn = input.required<(id: number) => boolean>();

  /** Input: Can select more */
  readonly canSelectMore = input<boolean>(true);

  /** Output: Close request */
  readonly closeRequest = output<void>();

  /** Output: Navigate request (prev/next) */
  readonly navigateRequest = output<'prev' | 'next'>();

  /** Output: Toggle selection */
  readonly toggleSelectionRequest = output<Template>();

  /** Output: Select template by index */
  readonly selectByIndexRequest = output<number>();

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

  /** Continuous zoom interval */
  private continuousZoomInterval: ReturnType<typeof setInterval> | null = null;

  /** Thumbnail lazy loading state */
  private thumbnailObserver: IntersectionObserver | null = null;
  private readonly loadedThumbnails = new Set<number>();

  /** ViewChild references (Angular 19+ signal queries) */
  readonly zoomDirective = viewChild<ZoomDirective>('zoomDirective');
  readonly lightboxElement = viewChild<ElementRef<HTMLDivElement>>('lightboxElement');
  readonly galleryContainer = viewChild<ElementRef<HTMLDivElement>>('galleryContainer');
  readonly galleryTrack = viewChild<ElementRef<HTMLDivElement>>('galleryTrack');

  /** DI */
  private readonly dragScrollService = inject(DragScrollService);
  private readonly destroyRef = inject(DestroyRef);

  /** Computed: current template index */
  readonly currentIndex = computed(() => {
    const current = this.template();
    if (!current) return -1;
    return this.templates().findIndex(t => t.id === current.id);
  });

  /** Computed: has prev/next */
  readonly hasPrev = computed(() => this.templates().length > 1);
  readonly hasNext = computed(() => this.templates().length > 1);

  constructor() {
    // Focus lightbox when opened
    effect(() => {
      if (this.isOpen()) {
        // Delay to ensure DOM is ready
        setTimeout(() => {
          this.lightboxElement()?.nativeElement?.focus();
          this.setupThumbnailLazyLoading();
          this.observeThumbnails();

          // Setup drag scroll service
          const gallery = this.galleryContainer()?.nativeElement;
          if (gallery) {
            this.dragScrollService.setElement(gallery);
          }
        }, 50);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.stopContinuousZoom();
      this.dragScrollService.destroy();
      if (this.thumbnailObserver) {
        this.thumbnailObserver.disconnect();
      }
    });
  }

  /**
   * Keyboard event handler
   */
  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.closeRequest.emit();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.navigateRequest.emit('prev');
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.navigateRequest.emit('next');
        break;
      case ' ':
        // Space = toggle selection
        event.preventDefault();
        const template = this.template();
        if (template) {
          this.toggleSelectionRequest.emit(template);
        }
        break;
    }
  }


  /**
   * Navigate to prev/next
   */
  navigate(direction: 'prev' | 'next'): void {
    this.imageChanging.set(true);
    setTimeout(() => {
      this.navigateRequest.emit(direction);
      this.resetZoom();
      // Auto-scroll gallery
      const newIndex = direction === 'prev'
        ? Math.max(0, this.currentIndex() - 1)
        : Math.min(this.templates().length - 1, this.currentIndex() + 1);
      this.autoScrollGallery(newIndex);
      setTimeout(() => this.imageChanging.set(false), 30);
    }, 80);
  }

  /**
   * Select template by index
   */
  selectByIndex(index: number): void {
    if (index === this.currentIndex()) return;

    this.imageChanging.set(true);
    setTimeout(() => {
      this.selectByIndexRequest.emit(index);
      this.resetZoom();
      this.autoScrollGallery(index);
      setTimeout(() => this.imageChanging.set(false), 30);
    }, 80);
  }

  /**
   * Toggle selection of current template
   */
  toggleCurrentSelection(): void {
    const template = this.template();
    if (template) {
      this.toggleSelectionRequest.emit(template);
    }
  }

  /**
   * Check if template is selected
   */
  isSelected(templateId: number): boolean {
    return this.isSelectedFn()(templateId);
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

  startContinuousZoom(direction: 'in' | 'out'): void {
    this.stopContinuousZoom();
    if (direction === 'in') {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
    this.continuousZoomInterval = setInterval(() => {
      if (direction === 'in') {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    }, 100);
  }

  stopContinuousZoom(): void {
    if (this.continuousZoomInterval) {
      clearInterval(this.continuousZoomInterval);
      this.continuousZoomInterval = null;
    }
  }

  // ==================== GALLERY DRAG SCROLL ====================

  onGalleryMouseDown(event: MouseEvent): void {
    this.dragScrollService.onMouseDown(event);
  }

  onGalleryMouseMove(event: MouseEvent): void {
    this.dragScrollService.onMouseMove(event);
  }

  onGalleryMouseUp(): void {
    this.dragScrollService.onMouseUp();
  }

  onGalleryTouchStart(event: TouchEvent): void {
    this.dragScrollService.onTouchStart(event);
  }

  onGalleryTouchMove(event: TouchEvent): void {
    this.dragScrollService.onTouchMove(event);
  }

  onGalleryTouchEnd(): void {
    this.dragScrollService.onTouchEnd();
  }

  // ==================== THUMBNAIL LAZY LOADING ====================

  private setupThumbnailLazyLoading(): void {
    if (!('IntersectionObserver' in window)) return;

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    this.thumbnailObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const templateId = parseInt(img.dataset['templateId'] || '0', 10);

          if (!this.loadedThumbnails.has(templateId)) {
            const actualSrc = img.dataset['src'];
            if (actualSrc) {
              img.src = actualSrc;
              img.classList.remove('lightbox__thumbnail-image--loading');
              this.loadedThumbnails.add(templateId);
            }
          }
          this.thumbnailObserver?.unobserve(img);
        }
      });
    }, options);
  }

  private observeThumbnails(): void {
    if (!this.thumbnailObserver || !this.galleryTrack()?.nativeElement) return;

    const images = this.galleryTrack()!.nativeElement.querySelectorAll('.lightbox__thumbnail-image');
    images.forEach(img => {
      this.thumbnailObserver?.observe(img);
    });
  }

  getThumbnailUrl(template: Template): string {
    if (this.loadedThumbnails.has(template.id)) {
      return template.thumbnailUrl;
    }
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  isThumbnailLoaded(templateId: number): boolean {
    return this.loadedThumbnails.has(templateId);
  }

  private autoScrollGallery(selectedIndex: number): void {
    const thumbnailWidth = 88; // 80px + 8px margin
    this.dragScrollService.scrollToItem(selectedIndex, thumbnailWidth);
  }

  /** TrackBy for templates */
  trackByTemplate(index: number, template: Template): number {
    return template.id;
  }
}
