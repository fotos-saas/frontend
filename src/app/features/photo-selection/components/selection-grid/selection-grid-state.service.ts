import {
  Injectable,
  signal,
  computed,
  inject,
  DestroyRef,
  NgZone,
  PLATFORM_ID,
  Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { WorkflowPhoto } from '../../models/workflow.models';
import { LightboxMediaItem } from '../../../../shared/components/media-lightbox/media-lightbox.types';
import { createSelectionSet, isPhotoSelectedFromSet, selectRangePhotos } from '../../helpers/selection.helper';
import { isMaxReached as isMaxReachedFn } from '../../helpers/selection.validator';

/**
 * Responsive breakpoint konfiguráció: [minWidth, columnsCount]
 */
const BREAKPOINTS: [number, number][] = [
  [1280, 6],
  [1024, 5],
  [640, 4],
  [480, 3],
  [0, 2],
];

/** Grid gap (px) - SCSS-sel szinkronban */
const GRID_GAP = 12;

/** Soron belüli fotók típusa */
export interface PhotoRow {
  photos: WorkflowPhoto[];
  startIndex: number;
}

/**
 * Selection Grid állapotkezelő service
 *
 * Felelős: responsive layout, selection logika, image loading tracking, pagination.
 * A komponens injektálja `{ providedIn: null }` módban.
 */
@Injectable()
export class SelectionGridStateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  // === LAYOUT STATE ===

  /** Aktuális oszlopszám (responsive) */
  readonly columnsCount = signal(3);

  /** Viewport / container szélesség */
  private readonly containerWidth = signal(0);

  // === IMAGE LOADING STATE ===

  /** Betöltött képek ID-jei (O(1) lookup) */
  private readonly loadedImageIds = signal<Set<number>>(new Set());

  // === PAGINATION STATE ===

  /** "Több betöltése" folyamatban */
  readonly isLoadingMore = signal<boolean>(false);

  /**
   * Inicializálva van-e a grid (volt-e loading cycle)
   * Megakadályozza az üres üzenet villanását betöltés előtt
   */
  readonly isInitialized = signal<boolean>(false);

  // === SELECTION STATE ===

  /** Utolsó kattintott fotó ID-je (shift+click range selection-höz) */
  private readonly lastClickedPhotoId = signal<number | null>(null);

  // === COMPUTED (input-függő) - setupInputDerivedState() hívás után elérhetők ===

  private _selectedSet!: Signal<Set<number>>;
  private _isMaxReached!: Signal<boolean>;
  private _rowHeight!: Signal<number>;
  private _minBufferPx!: Signal<number>;
  private _maxBufferPx!: Signal<number>;
  private _photoRows!: Signal<PhotoRow[]>;
  private _skeletonItems!: Signal<number[]>;
  private _totalCount!: Signal<number>;
  private _hasMorePhotos!: Signal<boolean>;

  get selectedSet(): Signal<Set<number>> { return this._selectedSet; }
  get isMaxReached(): Signal<boolean> { return this._isMaxReached; }
  get rowHeight(): Signal<number> { return this._rowHeight; }
  get minBufferPx(): Signal<number> { return this._minBufferPx; }
  get maxBufferPx(): Signal<number> { return this._maxBufferPx; }
  get photoRows(): Signal<PhotoRow[]> { return this._photoRows; }
  get skeletonItems(): Signal<number[]> { return this._skeletonItems; }
  get totalCount(): Signal<number> { return this._totalCount; }
  get hasMorePhotos(): Signal<boolean> { return this._hasMorePhotos; }

  /**
   * Input-függő computed signalok inicializálása.
   * A komponens hívja az OnInit-ben, miután az inputok elérhetők.
   */
  setupInputDerivedState(inputs: {
    selectedIds: Signal<number[]>;
    maxSelection: Signal<number | null>;
    photos: Signal<WorkflowPhoto[]>;
    totalPhotosCount: Signal<number | null>;
    useVirtualScroll: Signal<boolean>;
  }): void {
    this._selectedSet = computed(() => createSelectionSet(inputs.selectedIds()));

    this._isMaxReached = computed(() =>
      isMaxReachedFn(inputs.selectedIds().length, inputs.maxSelection())
    );

    this._rowHeight = computed(() => {
      const cols = this.columnsCount();
      const width = this.containerWidth();
      if (width === 0) return 150;
      const totalGap = GRID_GAP * (cols + 1);
      const itemWidth = (width - totalGap) / cols;
      return Math.ceil(itemWidth + GRID_GAP);
    });

    this._minBufferPx = computed(() => this._rowHeight() * 2);
    this._maxBufferPx = computed(() => this._rowHeight() * 4);

    this._photoRows = computed<PhotoRow[]>(() => {
      const allPhotos = inputs.photos();
      const cols = this.columnsCount();
      const rows: PhotoRow[] = [];
      for (let i = 0; i < allPhotos.length; i += cols) {
        rows.push({ photos: allPhotos.slice(i, i + cols), startIndex: i });
      }
      return rows;
    });

    this._skeletonItems = computed(() => {
      const cols = this.columnsCount();
      return Array.from({ length: cols * 2 }, (_, i) => i + 1);
    });

    this._totalCount = computed(() =>
      inputs.totalPhotosCount() ?? inputs.photos().length
    );

    this._hasMorePhotos = computed(() =>
      !inputs.useVirtualScroll() && inputs.photos().length < this._totalCount()
    );
  }

  // === LAYOUT METHODS ===

  /** Layout inicializálása (resize listener + kezdő méret) */
  initLayout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.updateLayout();
    this.setupResizeListener();
  }

  /** Container ref beállítása és layout számítás */
  onContainerInit(element: HTMLElement): void {
    if (element) {
      this.containerWidth.set(element.clientWidth);
      this.updateColumnsForWidth(element.clientWidth);
    }
  }

  private updateLayout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const width = window.innerWidth;
    this.containerWidth.set(width);
    this.updateColumnsForWidth(width);
  }

  private setupResizeListener(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'resize').pipe(
        debounceTime(150),
        map(() => window.innerWidth),
        distinctUntilChanged(),
        startWith(window.innerWidth),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((width) => {
        this.ngZone.run(() => {
          this.containerWidth.set(width);
          this.updateColumnsForWidth(width);
        });
      });
    });
  }

  private updateColumnsForWidth(width: number): void {
    for (const [minWidth, cols] of BREAKPOINTS) {
      if (width >= minWidth) {
        this.columnsCount.set(cols);
        return;
      }
    }
    this.columnsCount.set(3);
  }

  // === SELECTION METHODS ===

  /** Fotó kiválasztva-e (O(1) lookup Set-tel) */
  isSelected(photoId: number): boolean {
    return isPhotoSelectedFromSet(this._selectedSet(), photoId);
  }

  /** Fotó letiltva-e (max elérve és nincs kiválasztva, vagy readonly) */
  isDisabled(photoId: number, readonly: boolean): boolean {
    if (readonly) return true;
    return this._isMaxReached() && !this.isSelected(photoId);
  }

  /**
   * Fotóra kattintás logika.
   * @returns { action, payload } - a komponens kezeli az output emit-eket
   */
  handlePhotoClick(params: {
    photo: WorkflowPhoto;
    event?: Event;
    index?: number;
    photos: WorkflowPhoto[];
    selectedIds: number[];
    allowMultiple: boolean;
    maxSelection: number | null;
    readonly: boolean;
    deleteMode: boolean;
    deleteSelectedIds: number[];
  }): PhotoClickResult {
    const { photo, event, index, photos, selectedIds, allowMultiple, maxSelection, readonly: isReadonly, deleteMode, deleteSelectedIds } = params;
    const hasCtrlOrCmd = event && 'ctrlKey' in event &&
      ((event as MouseEvent | KeyboardEvent).ctrlKey || (event as MouseEvent | KeyboardEvent).metaKey);

    // Delete mód: Ctrl/Cmd+kattintás kijelöli törlésre
    if (deleteMode && hasCtrlOrCmd) {
      const isCurrentlySelected = deleteSelectedIds.includes(photo.id);
      return { action: 'deleteSelect', photo, selected: !isCurrentlySelected };
    }

    // Readonly módban a lightboxot nyitja
    if (isReadonly) {
      const photoIndex = index ?? photos.findIndex(p => p.id === photo.id);
      return { action: 'zoom', photo, index: photoIndex };
    }

    const hasShiftKey = event && 'shiftKey' in event && (event as MouseEvent | KeyboardEvent).shiftKey;
    const isShiftClick = hasShiftKey && allowMultiple;

    // Shift+click range selection
    if (isShiftClick && this.lastClickedPhotoId() !== null) {
      const allPhotoIds = photos.map(p => p.id);
      const newSelection = selectRangePhotos(
        allPhotoIds, selectedIds, this.lastClickedPhotoId()!, photo.id, maxSelection
      );
      return { action: 'selectionChange', selection: newSelection };
    }

    const isCurrentlySelected = selectedIds.includes(photo.id);
    let newSelection: number[];

    if (isCurrentlySelected) {
      newSelection = selectedIds.filter(id => id !== photo.id);
    } else if (!allowMultiple) {
      newSelection = [photo.id];
    } else if (!this._isMaxReached()) {
      newSelection = [...selectedIds, photo.id];
    } else {
      return { action: 'maxReached', max: maxSelection! };
    }

    this.lastClickedPhotoId.set(photo.id);
    return { action: 'selectionChange', selection: newSelection };
  }

  /** Összes kiválasztása */
  selectAll(photos: WorkflowPhoto[], maxSelection: number | null): number[] {
    const allIds = photos.map(p => p.id);
    if (maxSelection !== null && allIds.length > maxSelection) {
      return allIds.slice(0, maxSelection);
    }
    return allIds;
  }

  // === IMAGE LOADING METHODS ===

  /** Kép betöltöttnek jelölése */
  markImageLoaded(photoId: number): void {
    this.loadedImageIds.update(set => {
      const newSet = new Set(set);
      newSet.add(photoId);
      return newSet;
    });
  }

  /** Ellenőrzi, hogy a kép betöltődött-e */
  isImageLoaded(photoId: number): boolean {
    return this.loadedImageIds().has(photoId);
  }

  // === LIGHTBOX ===

  /** Lightbox media items generálása */
  getLightboxMedia(photos: WorkflowPhoto[]): LightboxMediaItem[] {
    return photos.map(photo => ({
      id: photo.id,
      url: photo.url,
      fileName: photo.filename,
    }));
  }

  // === PAGINATION ===

  /** Több kép betöltése kérés indítása - true ha sikerült indítani */
  startLoadMore(useVirtualScroll: boolean): boolean {
    if (useVirtualScroll || this.isLoadingMore() || !this._hasMorePhotos()) {
      return false;
    }
    this.isLoadingMore.set(true);
    return true;
  }

  /** Betöltés befejezése */
  finishLoadingMore(): void {
    this.isLoadingMore.set(false);
  }
}

// === RESULT TYPES ===

export type PhotoClickResult =
  | { action: 'deleteSelect'; photo: WorkflowPhoto; selected: boolean }
  | { action: 'zoom'; photo: WorkflowPhoto; index: number }
  | { action: 'selectionChange'; selection: number[] }
  | { action: 'maxReached'; max: number };
