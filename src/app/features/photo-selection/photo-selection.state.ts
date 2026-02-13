import { signal, computed, DestroyRef } from '@angular/core';
import { LightboxMediaItem } from '../../shared/components/media-lightbox/media-lightbox.types';
import {
  WorkflowStep,
  WorkflowPhoto,
  ProgressData,
  WorkSessionData,
  ReviewGroups,
  ModificationInfo,
  getStepIndex,
  EMPTY_STATE_MESSAGES,
} from './models/workflow.models';
import { validateSelection, isMaxReached as isMaxReachedFn } from './helpers/selection.validator';
import {
  togglePhotoInSelection,
  selectAllPhotos,
  deselectAllPhotos,
  createSelectionSet,
} from './helpers/selection.helper';
import { PaginationConfig } from './models/pagination.models';
import { LightboxState, DialogsState, PaginationState } from './state';

/**
 * Photo Selection State
 *
 * Centralized state management for photo-selection component.
 * Refactored to use modular sub-states for better maintainability.
 */
export class PhotoSelectionState {
  // === SUB-STATES ===
  readonly lightbox = new LightboxState();
  readonly dialogs = new DialogsState();
  readonly pagination = new PaginationState();

  // === LOADING STATE ===

  /** Kezdeti betöltés folyamatban */
  readonly isLoading = signal<boolean>(true);

  /** Auto-save folyamatban */
  readonly isSaving = signal<boolean>(false);

  /** Auto-save sikeres (rövid ideig true a visszajelzéshez) */
  readonly saveSuccess = signal<boolean>(false);

  /** Auto-save timeout ID a success visszajelzéshez */
  private saveSuccessTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Hiba üzenet */
  readonly errorMessage = signal<string | null>(null);

  // === WORKFLOW STATE ===

  /** Aktuális lépés */
  readonly currentStep = signal<WorkflowStep>('claiming');

  /** Kiválasztott fotó ID-k */
  readonly selectedPhotoIds = signal<number[]>([]);

  /** Maximum kiválasztható */
  readonly maxSelection = signal<number | null>(null);

  /** Több fotó kiválasztható-e */
  readonly allowMultiple = signal<boolean>(true);

  /** Album ID */
  readonly albumId = signal<number | null>(null);

  /** Work session adatok */
  readonly workSession = signal<WorkSessionData | null>(null);

  /** Progress adatok */
  readonly progress = signal<ProgressData | null>(null);

  /** Véglegesített-e a workflow */
  readonly isFinalized = signal<boolean>(false);

  /** Megtekintési lépés (finalized workflow esetén) */
  readonly viewingStep = signal<WorkflowStep | null>(null);

  /** Review csoportok (completed state - mindhárom lépés fotói) */
  readonly reviewGroups = signal<ReviewGroups | null>(null);

  /** Módosítási információk (completed state - ingyenes időablak) */
  readonly modificationInfo = signal<ModificationInfo | null>(null);

  // === COMPUTED VALUES (delegált) ===

  /** Látható fotók (pagination state-ből) */
  readonly visiblePhotos = computed(() => this.pagination.visiblePhotos());

  /** Összes fotó (pagination state-ből) */
  readonly allPhotos = computed(() => this.pagination.allPhotos());

  /** Total count (pagination state-ből) */
  readonly totalPhotosCount = computed(() => this.pagination.totalCount());

  /** Lightbox nyitva (lightbox state-ből) */
  readonly lightboxOpen = computed(() => this.lightbox.isOpen());

  /** Lightbox index (lightbox state-ből) */
  readonly lightboxIndex = computed(() => this.lightbox.currentIndex());

  // === LEGACY COMPAT (dialogs) ===

  /** Info dialog (dialogsból) */
  get infoDialog() { return this.dialogs.infoDialog; }

  /** Confirm dialog (dialogsból) */
  get confirmDialog() { return this.dialogs.confirmDialog; }

  /** Deselect confirm dialog (dialogsból) */
  get deselectConfirmDialog() { return this.dialogs.deselectConfirmDialog; }

  // === LEGACY COMPAT (pagination) ===

  /** Pagination config */
  readonly paginationConfig = computed(() => this.pagination.config());

  /** Is loading more */
  readonly isLoadingMore = computed(() => this.pagination.isLoadingMore());

  /** Use virtual scroll */
  readonly useVirtualScroll = computed(() => this.pagination.useVirtualScroll());

  /** Has more photos */
  readonly hasMorePhotos = computed(() => this.pagination.hasMorePhotos());

  // === COMPUTED VALUES ===

  /** Kiválasztott fotók száma */
  readonly selectedCount = computed(() => this.selectedPhotoIds().length);

  /** Van-e kiválasztott fotó */
  readonly hasSelection = computed(() => this.selectedCount() > 0);

  /** Kiválasztott ID-k Set-je (O(1) lookup-hoz) */
  readonly selectedSet = computed(() => createSelectionSet(this.selectedPhotoIds()));

  /** Maximum elérve */
  readonly isMaxReached = computed(() =>
    isMaxReachedFn(this.selectedCount(), this.maxSelection())
  );

  /** Aktuális lépés index */
  readonly currentStepIndex = computed(() => getStepIndex(this.currentStep()));

  /** Validáció státusz */
  readonly validationError = computed<string | null>(() => {
    const result = validateSelection(
      this.currentStep(),
      this.selectedCount(),
      this.maxSelection()
    );
    return result.error;
  });

  /** Érvényes-e az aktuális szelekció */
  readonly isValid = computed(() => this.validationError() === null);

  /** Lehet-e továbblépni */
  readonly canProceed = computed(() => {
    if (this.currentStep() === 'completed') return false;
    return this.isValid() && !this.isSaving() && !this.isLoading();
  });

  /** Lehet-e visszalépni */
  readonly canGoBack = computed(() => {
    const step = this.currentStep();
    return step !== 'claiming' && step !== 'completed' && !this.isSaving();
  });

  /** Workflow befejezve */
  readonly isCompleted = computed(() => this.currentStep() === 'completed' && !this.viewingStep());

  /** Readonly mód */
  readonly isReadonly = computed(() => this.isFinalized() && this.viewingStep() !== null);

  /** Tablókép */
  readonly tabloPhoto = computed<WorkflowPhoto | null>(() => {
    const tabloId = this.progress()?.steps_data?.tablo_photo_id;
    if (!tabloId) return null;
    return this.visiblePhotos().find(p => p.id === tabloId) || null;
  });

  /** Lightbox media (temp media felülírja ha van) */
  readonly lightboxMedia = computed<LightboxMediaItem[]>(() => {
    const temp = this.lightbox.tempMedia();
    if (temp) return temp;
    return this.visiblePhotos().map(photo => ({
      id: photo.id,
      url: photo.previewUrl || photo.url,
      fileName: photo.filename,
    }));
  });

  /** Üres állapot üzenet */
  readonly emptyStateMessage = computed(() => {
    const step = this.currentStep();
    return EMPTY_STATE_MESSAGES[step]?.title || 'Nincs megjeleníthető kép';
  });

  /** Üres állapot leírás */
  readonly emptyStateDescription = computed(() => {
    const step = this.currentStep();
    return EMPTY_STATE_MESSAGES[step]?.description || null;
  });

  /** Megjelenített lépés */
  readonly displayedStep = computed(() => {
    if (this.isFinalized() && this.viewingStep()) {
      return this.viewingStep()!;
    }
    return this.currentStep();
  });

  /** Visszatérés gomb megjelenítése */
  readonly showReturnButton = computed(() => this.isFinalized() && this.viewingStep() !== null);

  // === CONSTRUCTOR ===

  constructor(private destroyRef?: DestroyRef) {
    // Cleanup timeout on destroy
    if (this.destroyRef) {
      this.destroyRef.onDestroy(() => {
        if (this.saveSuccessTimeout) {
          clearTimeout(this.saveSuccessTimeout);
        }
      });
    }
  }

  // === LOADING METHODS ===

  startLoading(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
  }

  finishLoading(): void {
    this.isLoading.set(false);
  }

  loadingError(message: string): void {
    this.isLoading.set(false);
    this.errorMessage.set(message);
  }

  // === SAVING METHODS ===

  startSaving(): void {
    this.isSaving.set(true);
  }

  finishSaving(): void {
    this.isSaving.set(false);

    if (this.saveSuccessTimeout) {
      clearTimeout(this.saveSuccessTimeout);
    }

    this.saveSuccess.set(true);

    this.saveSuccessTimeout = setTimeout(() => {
      this.saveSuccess.set(false);
      this.saveSuccessTimeout = null;
    }, 2000);
  }

  savingError(message: string): void {
    this.isSaving.set(false);
    this.errorMessage.set(message);
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  // === WORKFLOW METHODS ===

  updateFromStepData(data: {
    current_step: WorkflowStep;
    visible_photos: WorkflowPhoto[];
    selected_photos: number[];
    step_metadata: { allow_multiple: boolean; max_selection: number | null };
    album_id: number;
    progress: ProgressData | null;
    work_session: WorkSessionData;
    review_groups?: ReviewGroups;
    modification_info?: ModificationInfo;
  }): void {
    if (data.current_step === 'completed') {
      this.isFinalized.set(true);
    }

    this.currentStep.set(data.current_step);
    this.allowMultiple.set(data.step_metadata.allow_multiple);
    this.maxSelection.set(data.step_metadata.max_selection);
    this.albumId.set(data.album_id);
    this.progress.set(data.progress);
    this.workSession.set(data.work_session);

    if (data.review_groups) {
      this.reviewGroups.set(data.review_groups);
    }

    if (data.modification_info) {
      this.modificationInfo.set(data.modification_info);
    }

    // Delegálás a pagination state-nek
    this.pagination.setAllPhotos(data.visible_photos, data.visible_photos.length);
    this.selectedPhotoIds.set(data.selected_photos);
    this.viewingStep.set(null);
  }

  updateSelection(photoIds: number[]): void {
    this.selectedPhotoIds.set(photoIds);
  }

  viewStep(step: WorkflowStep): void {
    if (!this.isFinalized()) return;
    this.viewingStep.set(step === 'completed' ? null : step);
  }

  returnToCompleted(): void {
    this.viewingStep.set(null);
  }

  // === SELECTION METHODS ===

  togglePhoto(photoId: number): void {
    const result = togglePhotoInSelection(
      this.selectedPhotoIds(),
      photoId,
      this.allowMultiple(),
      this.maxSelection()
    );
    this.selectedPhotoIds.set(result.selection);
  }

  selectAll(): void {
    if (!this.allowMultiple()) return;
    const allIds = this.visiblePhotos().map(p => p.id);
    this.selectedPhotoIds.set(selectAllPhotos(allIds, this.maxSelection()));
  }

  deselectAll(): void {
    this.selectedPhotoIds.set(deselectAllPhotos());
  }

  // === LIGHTBOX METHODS (delegált) ===

  openLightbox(index: number): void {
    this.lightbox.open(index);
  }

  closeLightbox(): void {
    this.lightbox.close();
  }

  navigateLightbox(index: number): void {
    this.lightbox.navigate(index);
  }

  // === PAGINATION METHODS (delegált) ===

  setPaginationConfig(config: Partial<PaginationConfig>): void {
    this.pagination.setConfig(config);
  }

  loadMorePhotos(photos: WorkflowPhoto[]): void {
    this.pagination.loadMorePhotos(photos);
  }

  startLoadingMore(): void {
    this.pagination.startLoadingMore();
  }

  setAllPhotos(photos: WorkflowPhoto[], totalCount: number): void {
    this.pagination.setAllPhotos(photos, totalCount);
  }

  updateFromStepDataWithPagination(data: {
    current_step: WorkflowStep;
    visible_photos: WorkflowPhoto[];
    selected_photos: number[];
    step_metadata: { allow_multiple: boolean; max_selection: number | null };
    album_id: number;
    progress: ProgressData | null;
    work_session: WorkSessionData;
  }, totalCount?: number): void {
    if (data.current_step === 'completed') {
      this.isFinalized.set(true);
    }

    this.currentStep.set(data.current_step);
    this.allowMultiple.set(data.step_metadata.allow_multiple);
    this.maxSelection.set(data.step_metadata.max_selection);
    this.albumId.set(data.album_id);
    this.progress.set(data.progress);
    this.workSession.set(data.work_session);

    const total = totalCount ?? data.visible_photos.length;
    this.pagination.setAllPhotos(data.visible_photos, total);

    const currentSelection = this.selectedPhotoIds();
    if (currentSelection.length === 0 || data.selected_photos.length > 0) {
      this.selectedPhotoIds.set(data.selected_photos);
    }

    this.viewingStep.set(null);
  }

  // === RESET ===

  reset(): void {
    this.isLoading.set(true);
    this.isSaving.set(false);
    this.saveSuccess.set(false);
    if (this.saveSuccessTimeout) {
      clearTimeout(this.saveSuccessTimeout);
      this.saveSuccessTimeout = null;
    }
    this.errorMessage.set(null);
    this.currentStep.set('claiming');
    this.selectedPhotoIds.set([]);
    this.maxSelection.set(null);
    this.allowMultiple.set(true);
    this.albumId.set(null);
    this.workSession.set(null);
    this.progress.set(null);
    this.isFinalized.set(false);
    this.viewingStep.set(null);
    this.reviewGroups.set(null);
    this.modificationInfo.set(null);

    // Sub-states reset
    this.lightbox.reset();
    this.dialogs.reset();
    this.pagination.reset();
  }
}
