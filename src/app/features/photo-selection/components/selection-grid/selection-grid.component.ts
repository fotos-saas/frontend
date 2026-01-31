import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
  DestroyRef,
  effect,
} from '@angular/core';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { WorkflowPhoto } from '../../models/workflow.models';
import { LightboxMediaItem } from '../../../../shared/components/media-lightbox/media-lightbox.types';
import { createSelectionSet, isPhotoSelectedFromSet, selectRangePhotos } from '../../helpers/selection.helper';
import { isMaxReached as isMaxReachedFn } from '../../helpers/selection.validator';
import { LoadMoreButtonComponent } from '../../../../shared/components/load-more-button';
import { DEFAULT_PAGINATION_CONFIG } from '../../models/pagination.models';

/**
 * Responsive breakpoint konfiguráció: [minWidth, columnsCount]
 * - Mobile (< 480px): 2 oszlop
 * - Small tablet (480px - 640px): 3 oszlop
 * - Tablet (640px - 1024px): 4 oszlop
 * - Desktop (> 1024px): 5-6 oszlop
 */
const BREAKPOINTS: [number, number][] = [
  [1280, 6],  // Large desktop: 6 oszlop
  [1024, 5],  // Desktop: 5 oszlop
  [640, 4],   // Tablet: 4 oszlop
  [480, 3],   // Small tablet: 3 oszlop
  [0, 2],     // Mobile: 2 oszlop
];

/** Grid gap (px) - SCSS-sel szinkronban */
const GRID_GAP = 12;

/** Soron belüli fotók típusa */
interface PhotoRow {
  photos: WorkflowPhoto[];
  startIndex: number;
}

/**
 * Selection Grid Component
 *
 * Thumbnail grid fotóválasztáshoz CDK Virtual Scrolling-gal.
 * - Multi/Single select mód
 * - Max selection limit
 * - Zoom gomb → Lightbox
 * - Virtual scrolling 500+ képhez
 * - Shift+click range selection (US-007)
 * - A11y támogatás
 */
@Component({
  selector: 'app-selection-grid',
  standalone: true,
  imports: [ScrollingModule, NgTemplateOutlet, LoadMoreButtonComponent],
  templateUrl: './selection-grid.component.html',
  styleUrl: './selection-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionGridComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * US-007: Utolsó kattintott fotó ID-je (shift+click range selection-höz)
   * Ez a referenciapont a range kiválasztáshoz.
   */
  private lastClickedPhotoId = signal<number | null>(null);

  constructor() {
    // Effect: isLoading false-ra váltása után inicializáltnak tekintjük
    effect(() => {
      const loading = this.isLoading();
      if (!loading && !this.isInitialized()) {
        // Kis késleltetés, hogy a DOM renderelés befejeződjön
        setTimeout(() => this.isInitialized.set(true), 50);
      }
    });
  }

  // === INPUTS ===

  /** Fotók listája */
  readonly photos = input.required<WorkflowPhoto[]>();

  /** Kiválasztott fotó ID-k */
  readonly selectedIds = input.required<number[]>();

  /** Több fotó kiválasztható-e */
  readonly allowMultiple = input<boolean>(true);

  /** Maximum kiválasztható fotók száma */
  readonly maxSelection = input<number | null>(null);

  /** Betöltés folyamatban */
  readonly isLoading = input<boolean>(false);

  /** Auto-save folyamatban */
  readonly isSaving = input<boolean>(false);

  /** Auto-save sikeres (rövid ideig true a visszajelzéshez) */
  readonly saveSuccess = input<boolean>(false);

  /** Üres állapot üzenete */
  readonly emptyMessage = input<string>('Nincs megjeleníthető kép');

  /** Üres állapot leírása (opcionális, a főüzenet alatt) */
  readonly emptyDescription = input<string | null>(null);

  /** Readonly mód (véglegesítés után) - képek nem kattinthatók */
  readonly readonly = input<boolean>(false);

  /** Header (kiválasztás számláló) megjelenítése */
  readonly showHeader = input<boolean>(true);

  /** Delete mód - Ctrl/Cmd+kattintás kijelölésre törléshez */
  readonly deleteMode = input<boolean>(false);

  /** Törlésre kijelölt fotó ID-k (delete módban) */
  readonly deleteSelectedIds = input<number[]>([]);

  // === US-008: PAGINATION INPUTS ===

  /**
   * Virtual scroll használata (feature flag)
   * true: CDK Virtual Scroll (nagy listák, 500+ kép)
   * false: Pagination fallback ("Több kép betöltése" gomb)
   */
  readonly useVirtualScroll = input<boolean>(DEFAULT_PAGINATION_CONFIG.useVirtualScroll);

  /** Page méret pagination módban (default: 100) */
  readonly pageSize = input<number>(DEFAULT_PAGINATION_CONFIG.pageSize);

  /** Összes fotó száma (pagination-höz, ha eltér a photos().length-től) */
  readonly totalPhotosCount = input<number | null>(null);

  // === OUTPUTS ===

  /** Szelekció változás */
  readonly selectionChange = output<number[]>();

  /** Zoom kattintás (lightbox megnyitásához) */
  readonly zoomClick = output<{ photo: WorkflowPhoto; index: number }>();

  /** Maximum elérve - disabled képre kattintáskor */
  readonly maxReachedClick = output<number>();

  /** US-008: Több kép betöltése esemény */
  readonly loadMore = output<void>();

  /** Delete mód: Ctrl/Cmd+kattintás történt (törlésre kijelölés batch módhoz) */
  readonly deleteSelect = output<{ photo: WorkflowPhoto; selected: boolean }>();

  /** Delete mód: Kuka gomb kattintás (azonnali törlés confirm-mal) */
  readonly deleteSingleClick = output<WorkflowPhoto>();

  /** Összes kijelölés törlése kattintás (confirm dialog-hoz) */
  readonly deselectAllClick = output<void>();

  // === INTERNAL STATE ===

  /** Aktuális oszlopszám (responsive) - US-002: mobile default = 3 */
  readonly columnsCount = signal(3);

  /** Viewport szélesség */
  private containerWidth = signal(0);

  /**
   * Betöltött képek ID-jei (US-005: skeleton shimmer loading state)
   * Signal-alapú Set a hatékony O(1) lookup-hoz
   */
  private readonly loadedImageIds = signal<Set<number>>(new Set());

  /** US-008: "Több betöltése" folyamatban (pagination) */
  readonly isLoadingMore = signal<boolean>(false);

  /**
   * Inicializálva van-e a grid (volt-e már loading cycle)
   * Megakadályozza az üres üzenet villanását betöltés előtt
   */
  readonly isInitialized = signal<boolean>(false);

  // === COMPUTED ===

  /** Kiválasztott ID-k Set-je (O(1) lookup-hoz) */
  private readonly selectedSet = computed(() => createSelectionSet(this.selectedIds()));

  /** Maximum elérve-e (helper függvénnyel) */
  readonly isMaxReached = computed(() =>
    isMaxReachedFn(this.selectedIds().length, this.maxSelection())
  );

  /**
   * Sor magassága (px) - CDK Virtual Scroll itemSize-hoz
   * aspect-ratio: 1 + gap alapján számolva
   */
  readonly rowHeight = computed(() => {
    const cols = this.columnsCount();
    const width = this.containerWidth();
    if (width === 0) return 150; // Fallback

    // Item szélesség = (container width - gaps) / columns
    const totalGap = GRID_GAP * (cols + 1); // Safari: margin-based gap
    const itemWidth = (width - totalGap) / cols;

    // aspect-ratio: 1, tehát height = width + gap
    return Math.ceil(itemWidth + GRID_GAP);
  });

  /**
   * Buffer méret (px) - 2-3 sor extra renderelése
   */
  readonly minBufferPx = computed(() => this.rowHeight() * 2);
  readonly maxBufferPx = computed(() => this.rowHeight() * 4);

  /**
   * Fotók sorokba csoportosítva (virtual scroll-hoz)
   */
  readonly photoRows = computed<PhotoRow[]>(() => {
    const allPhotos = this.photos();
    const cols = this.columnsCount();
    const rows: PhotoRow[] = [];

    for (let i = 0; i < allPhotos.length; i += cols) {
      rows.push({
        photos: allPhotos.slice(i, i + cols),
        startIndex: i,
      });
    }

    return rows;
  });

  /**
   * Skeleton placeholder elemek száma (2 sor * oszlopszám)
   * Dinamikusan számolt a responsive oszlopszám alapján - CLS megelőzésre
   */
  readonly skeletonItems = computed(() => {
    const cols = this.columnsCount();
    return Array.from({ length: cols * 2 }, (_, i) => i + 1);
  });

  // === US-008: PAGINATION COMPUTED ===

  /**
   * Összes fotó száma (pagination-höz)
   * Ha totalPhotosCount nincs megadva, a photos() hosszát használjuk
   */
  readonly totalCount = computed(() =>
    this.totalPhotosCount() ?? this.photos().length
  );

  /**
   * Van-e még betöltetlen fotó (pagination)
   */
  readonly hasMorePhotos = computed(() =>
    !this.useVirtualScroll() && this.photos().length < this.totalCount()
  );

  // === LIFECYCLE ===

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.updateLayout();
      this.setupResizeListener();
    }
  }

  ngOnDestroy(): void {
    // Cleanup handled by takeUntilDestroyed
  }

  /**
   * Debounced resize listener (150ms) - US-002 requirement
   * Runs outside Angular zone for performance, updates inside zone
   */
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

  // === METHODS ===

  /**
   * Container ref beállítása és layout számítás
   */
  onContainerInit(element: HTMLElement): void {
    if (element) {
      this.containerWidth.set(element.clientWidth);
      this.updateColumnsForWidth(element.clientWidth);
    }
  }

  /**
   * Layout frissítése (resize vagy init)
   */
  private updateLayout(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const width = window.innerWidth;
    this.containerWidth.set(width);
    this.updateColumnsForWidth(width);
  }

  /**
   * Oszlopszám beállítása breakpoint alapján
   */
  private updateColumnsForWidth(width: number): void {
    for (const [minWidth, cols] of BREAKPOINTS) {
      if (width >= minWidth) {
        this.columnsCount.set(cols);
        return;
      }
    }
    this.columnsCount.set(3); // Fallback: mobile default
  }

  /**
   * TrackBy függvény a sorokhoz (virtual scroll optimalizáció)
   */
  trackRow(_index: number, row: PhotoRow): number {
    return row.startIndex;
  }

  /**
   * TrackBy függvény a fotókhoz
   */
  trackPhoto(_index: number, photo: WorkflowPhoto): number {
    return photo.id;
  }

  /**
   * Fotó kiválasztva-e (O(1) lookup Set-tel)
   */
  isSelected(photoId: number): boolean {
    return isPhotoSelectedFromSet(this.selectedSet(), photoId);
  }

  /**
   * Fotó letiltva-e (max elérve és nincs kiválasztva, vagy readonly mód)
   */
  isDisabled(photoId: number): boolean {
    if (this.readonly()) return true;
    return this.isMaxReached() && !this.isSelected(photoId);
  }

  /**
   * Fotó törlésre kijelölve-e (delete módban)
   */
  isDeleteSelected(photoId: number): boolean {
    return this.deleteSelectedIds().includes(photoId);
  }

  /**
   * Fotóra kattintás (normál vagy shift+click)
   * US-007: Shift+click támogatás range selection-höz
   */
  onPhotoClick(photo: WorkflowPhoto, event?: Event, index?: number): void {
    const hasCtrlOrCmd = event && 'ctrlKey' in event &&
      ((event as MouseEvent | KeyboardEvent).ctrlKey || (event as MouseEvent | KeyboardEvent).metaKey);

    // Delete mód: Ctrl/Cmd+kattintás kijelöli törlésre (ELŐBB mint readonly!)
    if (this.deleteMode() && hasCtrlOrCmd) {
      const isCurrentlySelected = this.deleteSelectedIds().includes(photo.id);
      this.deleteSelect.emit({ photo, selected: !isCurrentlySelected });
      return;
    }

    // Readonly módban az egész kép a lightboxot nyitja (ha nincs Ctrl/Cmd)
    if (this.readonly()) {
      const photoIndex = index ?? this.photos().findIndex(p => p.id === photo.id);
      this.zoomClick.emit({ photo, index: photoIndex });
      return;
    }

    const currentSelection = this.selectedIds();
    const allPhotos = this.photos();
    // Shift key ellenőrzés (MouseEvent és KeyboardEvent-en is van shiftKey)
    const hasShiftKey = event && 'shiftKey' in event && (event as MouseEvent | KeyboardEvent).shiftKey;
    const isShiftClick = hasShiftKey && this.allowMultiple();

    // US-007: Shift+click range selection (helper függvény használata)
    if (isShiftClick && this.lastClickedPhotoId() !== null) {
      const allPhotoIds = allPhotos.map(p => p.id);
      const newSelection = selectRangePhotos(
        allPhotoIds,
        currentSelection,
        this.lastClickedPhotoId()!,
        photo.id,
        this.maxSelection()
      );
      this.selectionChange.emit(newSelection);
      return;
    }

    const isCurrentlySelected = currentSelection.includes(photo.id);
    let newSelection: number[];

    if (isCurrentlySelected) {
      // Deselect
      newSelection = currentSelection.filter(id => id !== photo.id);
    } else {
      // Select
      if (!this.allowMultiple()) {
        // Single select - cseréljük
        newSelection = [photo.id];
      } else if (!this.isMaxReached()) {
        // Multi select - hozzáadjuk
        newSelection = [...currentSelection, photo.id];
      } else {
        // Max elérve - jelezzük a felhasználónak
        this.maxReachedClick.emit(this.maxSelection()!);
        return;
      }
    }

    // US-007: Utolsó kattintás frissítése (nem shift+click esetén)
    this.lastClickedPhotoId.set(photo.id);
    this.selectionChange.emit(newSelection);
  }

  /**
   * Zoom gombra kattintás
   */
  onZoomClick(photo: WorkflowPhoto, index: number, event: Event): void {
    event.stopPropagation(); // Ne triggerelődjön a selection
    this.zoomClick.emit({ photo, index });
  }

  /**
   * Delete gombra kattintás (kuka ikon)
   * Egyből törlés confirm-mal (nem batch módban gyűjt)
   */
  onDeleteBtnClick(photo: WorkflowPhoto, event: Event): void {
    event.stopPropagation(); // Ne triggerelődjön a lightbox
    this.deleteSingleClick.emit(photo);
  }

  /**
   * Összes kiválasztása
   */
  onSelectAll(): void {
    if (!this.allowMultiple()) return;

    const allIds = this.photos().map(p => p.id);
    const max = this.maxSelection();

    if (max !== null && allIds.length > max) {
      this.selectionChange.emit(allIds.slice(0, max));
    } else {
      this.selectionChange.emit(allIds);
    }
  }

  /**
   * Kijelölés törlése - confirm dialog-ot kér
   */
  onDeselectAll(): void {
    this.deselectAllClick.emit();
  }

  /**
   * Kép betöltési hiba kezelése
   */
  onImageError(event: Event, photoId: number): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/placeholder-image.svg';
    // Hiba esetén is jelöljük betöltöttnek (placeholder megjelenik)
    this.markImageLoaded(photoId);
  }

  /**
   * Kép sikeres betöltése (US-005: skeleton → kép átmenet)
   */
  onImageLoad(photoId: number): void {
    this.markImageLoaded(photoId);
  }

  /**
   * Kép betöltöttnek jelölése
   */
  private markImageLoaded(photoId: number): void {
    this.loadedImageIds.update(set => {
      const newSet = new Set(set);
      newSet.add(photoId);
      return newSet;
    });
  }

  /**
   * Ellenőrzi, hogy a kép betöltődött-e (US-005)
   */
  isImageLoaded(photoId: number): boolean {
    return this.loadedImageIds().has(photoId);
  }

  /**
   * Lightbox media items generálása
   */
  getLightboxMedia(): LightboxMediaItem[] {
    return this.photos().map(photo => ({
      id: photo.id,
      url: photo.url,
      fileName: photo.filename,
    }));
  }

  // === US-008: PAGINATION METHODS ===

  /**
   * Több kép betöltése (pagination fallback)
   * Csak pagination módban hívható (!useVirtualScroll)
   */
  onLoadMore(): void {
    if (this.useVirtualScroll() || this.isLoadingMore() || !this.hasMorePhotos()) {
      return;
    }
    this.isLoadingMore.set(true);
    this.loadMore.emit();
  }

  /**
   * Betöltés befejezése (hívandó a szülő komponensből a loadMore után)
   */
  finishLoadingMore(): void {
    this.isLoadingMore.set(false);
  }
}
