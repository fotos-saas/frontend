import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  OnInit,
  effect,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { WorkflowPhoto } from '../../models/workflow.models';
import { DEFAULT_PAGINATION_CONFIG } from '../../models/pagination.models';
import { LoadMoreButtonComponent } from '../../../../shared/components/load-more-button';
import { LightboxMediaItem } from '../../../../shared/components/media-lightbox/media-lightbox.types';
import { SelectionGridStateService, PhotoRow } from './selection-grid-state.service';

/**
 * Selection Grid Component
 *
 * Thumbnail grid fotóválasztáshoz CDK Virtual Scrolling-gal.
 * Az üzleti logikát a SelectionGridStateService kezeli.
 */
@Component({
  selector: 'app-selection-grid',
  standalone: true,
  imports: [ScrollingModule, NgTemplateOutlet, LoadMoreButtonComponent],
  templateUrl: './selection-grid.component.html',
  styleUrl: './selection-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SelectionGridStateService],
})
export class SelectionGridComponent implements OnInit {
  private readonly state = inject(SelectionGridStateService);

  constructor() {
    effect(() => {
      const loading = this.isLoading();
      if (!loading && !this.state.isInitialized()) {
        setTimeout(() => this.state.isInitialized.set(true), 50);
      }
    });
  }

  // === INPUTS ===

  readonly photos = input.required<WorkflowPhoto[]>();
  readonly selectedIds = input.required<number[]>();
  readonly allowMultiple = input<boolean>(true);
  readonly maxSelection = input<number | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly isSaving = input<boolean>(false);
  readonly saveSuccess = input<boolean>(false);
  readonly emptyMessage = input<string>('Nincs megjeleníthető kép');
  readonly emptyDescription = input<string | null>(null);
  readonly readonly = input<boolean>(false);
  readonly showHeader = input<boolean>(true);
  readonly deleteMode = input<boolean>(false);
  readonly deleteSelectedIds = input<number[]>([]);
  readonly useVirtualScroll = input<boolean>(DEFAULT_PAGINATION_CONFIG.useVirtualScroll);
  readonly pageSize = input<number>(DEFAULT_PAGINATION_CONFIG.pageSize);
  readonly totalPhotosCount = input<number | null>(null);

  // === OUTPUTS ===

  readonly selectionChange = output<number[]>();
  readonly zoomClick = output<{ photo: WorkflowPhoto; index: number }>();
  readonly maxReachedClick = output<number>();
  readonly loadMore = output<void>();
  readonly deleteSelect = output<{ photo: WorkflowPhoto; selected: boolean }>();
  readonly deleteSingleClick = output<WorkflowPhoto>();
  readonly deselectAllClick = output<void>();

  // === DELEGATED STATE (template-facing) ===

  readonly columnsCount = this.state.columnsCount;
  readonly isLoadingMore = this.state.isLoadingMore;
  readonly isInitialized = this.state.isInitialized;

  // Computed-ok lazy inicializálása ngOnInit-ben (input-függők)
  rowHeight!: typeof this.state.rowHeight;
  minBufferPx!: typeof this.state.minBufferPx;
  maxBufferPx!: typeof this.state.maxBufferPx;
  photoRows!: typeof this.state.photoRows;
  skeletonItems!: typeof this.state.skeletonItems;
  totalCount!: typeof this.state.totalCount;
  hasMorePhotos!: typeof this.state.hasMorePhotos;
  isMaxReached!: typeof this.state.isMaxReached;

  // === LIFECYCLE ===

  ngOnInit(): void {
    this.state.setupInputDerivedState({
      selectedIds: this.selectedIds,
      maxSelection: this.maxSelection,
      photos: this.photos,
      totalPhotosCount: this.totalPhotosCount,
      useVirtualScroll: this.useVirtualScroll,
    });

    // Delegált computed referenciák
    this.rowHeight = this.state.rowHeight;
    this.minBufferPx = this.state.minBufferPx;
    this.maxBufferPx = this.state.maxBufferPx;
    this.photoRows = this.state.photoRows;
    this.skeletonItems = this.state.skeletonItems;
    this.totalCount = this.state.totalCount;
    this.hasMorePhotos = this.state.hasMorePhotos;
    this.isMaxReached = this.state.isMaxReached;

    this.state.initLayout();
  }

  // === TEMPLATE METHODS ===

  onContainerInit(element: HTMLElement): void {
    this.state.onContainerInit(element);
  }

  trackRow(_index: number, row: PhotoRow): number {
    return row.startIndex;
  }

  trackPhoto(_index: number, photo: WorkflowPhoto): number {
    return photo.id;
  }

  isSelected(photoId: number): boolean {
    return this.state.isSelected(photoId);
  }

  isDisabled(photoId: number): boolean {
    return this.state.isDisabled(photoId, this.readonly());
  }

  isDeleteSelected(photoId: number): boolean {
    return this.deleteSelectedIds().includes(photoId);
  }

  onPhotoClick(photo: WorkflowPhoto, event?: Event, index?: number): void {
    const result = this.state.handlePhotoClick({
      photo,
      event,
      index,
      photos: this.photos(),
      selectedIds: this.selectedIds(),
      allowMultiple: this.allowMultiple(),
      maxSelection: this.maxSelection(),
      readonly: this.readonly(),
      deleteMode: this.deleteMode(),
      deleteSelectedIds: this.deleteSelectedIds(),
    });

    switch (result.action) {
      case 'deleteSelect':
        this.deleteSelect.emit({ photo: result.photo, selected: result.selected });
        break;
      case 'zoom':
        this.zoomClick.emit({ photo: result.photo, index: result.index });
        break;
      case 'selectionChange':
        this.selectionChange.emit(result.selection);
        break;
      case 'maxReached':
        this.maxReachedClick.emit(result.max);
        break;
    }
  }

  onZoomClick(photo: WorkflowPhoto, index: number, event: Event): void {
    event.stopPropagation();
    this.zoomClick.emit({ photo, index });
  }

  onDeleteBtnClick(photo: WorkflowPhoto, event: Event): void {
    event.stopPropagation();
    this.deleteSingleClick.emit(photo);
  }

  onSelectAll(): void {
    if (!this.allowMultiple()) return;
    this.selectionChange.emit(this.state.selectAll(this.photos(), this.maxSelection()));
  }

  onDeselectAll(): void {
    this.deselectAllClick.emit();
  }

  onImageError(event: Event, photoId: number): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/placeholder-image.svg';
    this.state.markImageLoaded(photoId);
  }

  onImageLoad(photoId: number): void {
    this.state.markImageLoaded(photoId);
  }

  isImageLoaded(photoId: number): boolean {
    return this.state.isImageLoaded(photoId);
  }

  getLightboxMedia(): LightboxMediaItem[] {
    return this.state.getLightboxMedia(this.photos());
  }

  onLoadMore(): void {
    if (this.state.startLoadMore(this.useVirtualScroll())) {
      this.loadMore.emit();
    }
  }

  finishLoadingMore(): void {
    this.state.finishLoadingMore();
  }
}
