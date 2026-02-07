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
import { LightboxThumbnailService } from './lightbox-thumbnail.service';

/**
 * LightboxComponent - Template elonezet lightbox
 *
 * Ujrafelhasznalhato lightbox komponens:
 * - Template kepek elonezete
 * - Zoom funkcio (pinch/wheel/buttons)
 * - Keyboard navigation (ESC, Arrow keys, Space)
 * - Thumbnail galeria drag scroll-lal
 * - Lazy thumbnail loading
 */
@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [DecimalPipe, ZoomDirective],
  templateUrl: './lightbox.component.html',
  styleUrls: ['./lightbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DragScrollService, LightboxThumbnailService]
})
export class LightboxComponent {
  readonly backdropHandler = createBackdropHandler(() => this.closeRequest.emit(), 'lightbox__overlay');

  // Inputs
  readonly isOpen = input.required<boolean>();
  readonly template = input.required<Template | null>();
  readonly templates = input.required<Template[]>();
  readonly isSelectedFn = input.required<(id: number) => boolean>();
  readonly canSelectMore = input<boolean>(true);

  // Outputs
  readonly closeRequest = output<void>();
  readonly navigateRequest = output<'prev' | 'next'>();
  readonly toggleSelectionRequest = output<Template>();
  readonly selectByIndexRequest = output<number>();

  // Zoom state
  private readonly _currentZoom = signal<number>(1);
  readonly currentZoom = this._currentZoom.asReadonly();
  readonly imageChanging = signal<boolean>(false);

  readonly zoomConfig: Partial<ZoomConfig> = {
    maxZoom: 4,
    minZoom: 1,
    zoomStep: 0.5
  };

  private continuousZoomInterval: ReturnType<typeof setInterval> | null = null;

  // ViewChild references
  readonly zoomDirective = viewChild<ZoomDirective>('zoomDirective');
  readonly lightboxElement = viewChild<ElementRef<HTMLDivElement>>('lightboxElement');
  readonly galleryContainer = viewChild<ElementRef<HTMLDivElement>>('galleryContainer');
  readonly galleryTrack = viewChild<ElementRef<HTMLDivElement>>('galleryTrack');

  // DI
  private readonly dragScrollService = inject(DragScrollService);
  private readonly thumbnailService = inject(LightboxThumbnailService);
  private readonly destroyRef = inject(DestroyRef);

  // Computed
  readonly currentIndex = computed(() => {
    const current = this.template();
    if (!current) return -1;
    return this.templates().findIndex(t => t.id === current.id);
  });

  readonly hasPrev = computed(() => this.templates().length > 1);
  readonly hasNext = computed(() => this.templates().length > 1);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => {
          this.lightboxElement()?.nativeElement?.focus();
          this.thumbnailService.setupLazyLoading();
          this.thumbnailService.observeThumbnails(this.galleryTrack()?.nativeElement ?? null);

          const gallery = this.galleryContainer()?.nativeElement;
          if (gallery) {
            this.dragScrollService.setElement(gallery);
          }
        }, 50);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.stopContinuousZoom();
      this.dragScrollService.destroy();
      this.thumbnailService.destroy();
    });
  }

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
        event.preventDefault();
        const template = this.template();
        if (template) {
          this.toggleSelectionRequest.emit(template);
        }
        break;
    }
  }

  navigate(direction: 'prev' | 'next'): void {
    this.imageChanging.set(true);
    setTimeout(() => {
      this.navigateRequest.emit(direction);
      this.resetZoom();
      const newIndex = direction === 'prev'
        ? Math.max(0, this.currentIndex() - 1)
        : Math.min(this.templates().length - 1, this.currentIndex() + 1);
      this.autoScrollGallery(newIndex);
      setTimeout(() => this.imageChanging.set(false), 30);
    }, 80);
  }

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

  toggleCurrentSelection(): void {
    const template = this.template();
    if (template) {
      this.toggleSelectionRequest.emit(template);
    }
  }

  isSelected(templateId: number): boolean {
    return this.isSelectedFn()(templateId);
  }

  // ==================== ZOOM ====================

  onZoomChange(zoom: number): void { this._currentZoom.set(zoom); }
  zoomIn(): void { this.zoomDirective()?.zoomIn(); }
  zoomOut(): void { this.zoomDirective()?.zoomOut(); }

  resetZoom(): void {
    this.zoomDirective()?.resetZoom();
    this._currentZoom.set(1);
  }

  startContinuousZoom(direction: 'in' | 'out'): void {
    this.stopContinuousZoom();
    if (direction === 'in') { this.zoomIn(); } else { this.zoomOut(); }
    this.continuousZoomInterval = setInterval(() => {
      if (direction === 'in') { this.zoomIn(); } else { this.zoomOut(); }
    }, 100);
  }

  stopContinuousZoom(): void {
    if (this.continuousZoomInterval) {
      clearInterval(this.continuousZoomInterval);
      this.continuousZoomInterval = null;
    }
  }

  // ==================== GALLERY DRAG SCROLL ====================

  onGalleryMouseDown(event: MouseEvent): void { this.dragScrollService.onMouseDown(event); }
  onGalleryMouseMove(event: MouseEvent): void { this.dragScrollService.onMouseMove(event); }
  onGalleryMouseUp(): void { this.dragScrollService.onMouseUp(); }
  onGalleryTouchStart(event: TouchEvent): void { this.dragScrollService.onTouchStart(event); }
  onGalleryTouchMove(event: TouchEvent): void { this.dragScrollService.onTouchMove(event); }
  onGalleryTouchEnd(): void { this.dragScrollService.onTouchEnd(); }

  // ==================== THUMBNAIL LAZY LOADING ====================

  getThumbnailUrl(template: Template): string {
    return this.thumbnailService.getThumbnailUrl(template.id, template.thumbnailUrl);
  }

  isThumbnailLoaded(templateId: number): boolean {
    return this.thumbnailService.isThumbnailLoaded(templateId);
  }

  private autoScrollGallery(selectedIndex: number): void {
    const thumbnailWidth = 88; // 80px + 8px margin
    this.dragScrollService.scrollToItem(selectedIndex, thumbnailWidth);
  }

  trackByTemplate(index: number, template: Template): number {
    return template.id;
  }
}
