import { signal, computed } from '@angular/core';
import { DialogStateHelper } from '../../../../../shared/helpers/dialog-state.helper';
import {
  PartnerOrderAlbumDetails,
  AlbumPhoto,
  UploadProgress
} from '../../../services/partner-orders.service';
import { WorkflowPhoto } from '../../../../photo-selection/models/workflow.models';
import { LightboxMediaItem } from '../../../../../shared/components/media-lightbox/media-lightbox.types';

/**
 * Album Detail State
 *
 * Csoportosított state az album-detail komponenshez.
 * A VotingListState mintára épül - Signal-based state management.
 */
export class AlbumDetailState {
  // === ALBUM STATE ===

  /** Betöltés folyamatban */
  readonly loading = signal<boolean>(true);

  /** Album adatok */
  readonly album = signal<PartnerOrderAlbumDetails | null>(null);

  /** Nézet mód: grid vagy lista */
  readonly viewMode = signal<'grid' | 'list'>('list');

  // === UPLOAD STATE ===

  /** Feltöltés folyamatban */
  readonly uploading = signal<boolean>(false);

  /** Feltöltési progress */
  readonly uploadProgress = signal<UploadProgress | null>(null);

  // === DELETE STATE ===

  /** Törlésre kijelölt fotó ID-k (batch mód) */
  readonly deleteSelectedIds = signal<number[]>([]);

  /** Törlés folyamatban */
  readonly deletingPhotos = signal<boolean>(false);

  /** Egyetlen fotó törlésre (confirm dialógushoz) */
  readonly photoToDelete = signal<AlbumPhoto | null>(null);

  // === LIST VIEW STATE ===

  /** Lista szűrő */
  readonly listFilter = signal<'all' | 'selected' | 'unselected'>('all');

  /** Keresési kifejezés */
  readonly searchQuery = signal<string>('');

  /** Aktuális oldal */
  readonly currentPage = signal<number>(1);

  /** Oldal méret */
  readonly pageSize = 20;

  // === DIALOGS (DialogStateHelper használat) ===

  /** Album szerkesztés dialógus */
  readonly editDialog = new DialogStateHelper();

  /** Album törlés confirm dialógus */
  readonly deleteAlbumDialog = new DialogStateHelper();

  /** Fotó törlés confirm dialógus */
  readonly deletePhotoDialog = new DialogStateHelper();

  /** Több fotó törlés confirm dialógus */
  readonly deletePhotosDialog = new DialogStateHelper();

  // === LIGHTBOX ===

  /** Lightbox nyitva */
  readonly lightboxOpen = signal<boolean>(false);

  /** Lightbox aktuális index */
  readonly lightboxIndex = signal<number>(0);

  // === WEBSHOP STATE ===

  /** Webshop engedélyezve a partnernél */
  readonly webshopEnabled = signal<boolean>(false);

  /** Webshop share token az albumhoz */
  readonly webshopToken = signal<string | null>(null);

  /** Token generálás folyamatban */
  readonly generatingToken = signal<boolean>(false);

  /** Link másolva feedback */
  readonly linkCopied = signal<boolean>(false);

  // === ACTION FLAGS ===

  /** Album mentés folyamatban */
  readonly saving = signal<boolean>(false);

  /** Album aktiválás folyamatban */
  readonly activating = signal<boolean>(false);

  /** Lejárat meghosszabbítás folyamatban */
  readonly extendingExpiry = signal<boolean>(false);

  /** ZIP letöltés folyamatban */
  readonly downloading = signal<boolean>(false);

  /** Excel export folyamatban */
  readonly exporting = signal<boolean>(false);

  // === EDIT FORM DATA ===

  /** Szerkesztés form adatai */
  editForm = {
    name: '',
    minSelections: null as number | null,
    maxSelections: null as number | null,
    maxRetouchPhotos: null as number | null,
  };

  // === COMPUTED VALUES ===

  /** Kiválasztott fotó ID-k (progress alapján) */
  readonly selectedPhotoIds = computed<number[]>(() => {
    const albumData = this.album();
    if (!albumData?.progress) return [];
    return albumData.progress.claimedIds || [];
  });

  /** Átalakítja AlbumPhoto[] -> WorkflowPhoto[] formátumra a grid-hez */
  readonly gridPhotos = computed<WorkflowPhoto[]>(() => {
    const albumData = this.album();
    if (!albumData) return [];

    return albumData.photos.map(photo => ({
      id: photo.id,
      url: photo.original_url,
      thumbnailUrl: photo.thumb_url,
      previewUrl: photo.preview_url || photo.original_url,
      filename: photo.name,
    }));
  });

  /** Szűrt fotók a lista nézethez */
  readonly filteredPhotos = computed<AlbumPhoto[]>(() => {
    const albumData = this.album();
    if (!albumData) return [];

    let photos = [...albumData.photos];
    const filter = this.listFilter();
    const query = this.searchQuery().toLowerCase().trim();
    const selectedIds = this.selectedPhotoIds();

    // Szűrés kiválasztás szerint
    if (filter === 'selected') {
      photos = photos.filter(p => selectedIds.includes(p.id));
    } else if (filter === 'unselected') {
      photos = photos.filter(p => !selectedIds.includes(p.id));
    }

    // Szűrés keresés szerint (fájlnév és IPTC title is)
    if (query) {
      photos = photos.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.title.toLowerCase().includes(query)
      );
    }

    return photos;
  });

  /** Paginált fotók */
  readonly paginatedPhotos = computed<AlbumPhoto[]>(() => {
    const photos = this.filteredPhotos();
    const page = this.currentPage();
    const size = this.pageSize;
    const start = (page - 1) * size;
    return photos.slice(start, start + size);
  });

  /** Összes oldal száma */
  readonly totalPages = computed<number>(() => {
    const total = this.filteredPhotos().length;
    return Math.ceil(total / this.pageSize) || 1;
  });

  /** Van-e kiválasztott fotó */
  readonly hasSelectedPhotos = computed<boolean>(() =>
    this.selectedPhotoIds().length > 0
  );

  /** Lightbox media items */
  readonly lightboxMedia = computed<LightboxMediaItem[]>(() => {
    const albumData = this.album();
    if (!albumData) return [];

    return albumData.photos.map(photo => ({
      id: photo.id,
      url: photo.original_url,
      fileName: photo.name,
    }));
  });

  /** Album lejárt-e */
  readonly isAlbumExpired = computed<boolean>(() => {
    const expiresAt = this.album()?.expiresAt;
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  });

  // === METHODS ===

  /**
   * Betöltés befejezése
   */
  finishLoading(loadedAlbum: PartnerOrderAlbumDetails): void {
    this.album.set(loadedAlbum);
    this.loading.set(false);
  }

  /**
   * Betöltés indítása
   */
  startLoading(): void {
    this.loading.set(true);
  }

  /**
   * Betöltési hiba
   */
  loadingError(): void {
    this.loading.set(false);
  }

  /**
   * Feltöltés indítása
   */
  startUpload(totalFiles: number): void {
    this.uploading.set(true);
    this.uploadProgress.set({
      uploadedCount: 0,
      totalCount: totalFiles,
      photos: [],
      currentChunk: 0,
      totalChunks: Math.ceil(totalFiles / 10),
      progress: 0,
      completed: false,
      errorCount: 0
    });
  }

  /**
   * Feltöltés progress frissítése
   */
  updateUploadProgress(progress: UploadProgress): void {
    this.uploadProgress.set(progress);
  }

  /**
   * Feltöltés sikeres
   */
  uploadSuccess(): void {
    this.uploading.set(false);
  }

  /**
   * Feltöltés hiba
   */
  uploadError(): void {
    this.uploading.set(false);
  }

  /**
   * Szerkesztés modal megnyitása
   */
  openEditModal(): void {
    const albumData = this.album();
    if (!albumData) return;

    this.editForm = {
      name: albumData.name,
      minSelections: albumData.minSelections,
      maxSelections: albumData.maxSelections,
      maxRetouchPhotos: albumData.maxRetouchPhotos,
    };
    this.editDialog.open();
  }

  /**
   * Szerkesztés modal bezárása
   */
  closeEditModal(): void {
    this.editDialog.close();
  }

  /**
   * Szerkesztés sikeres
   */
  editSuccess(): void {
    this.editDialog.submitSuccess();
    this.saving.set(false);
  }

  /**
   * Album törlés confirm megnyitása
   */
  openDeleteAlbumConfirm(): void {
    this.deleteAlbumDialog.open();
  }

  /**
   * Album törlés confirm bezárása
   */
  closeDeleteAlbumConfirm(): void {
    this.deleteAlbumDialog.close();
  }

  /**
   * Egyetlen fotó törlés confirm
   */
  confirmDeletePhoto(photo: AlbumPhoto): void {
    this.photoToDelete.set(photo);
  }

  /**
   * Fotó törlés confirm bezárása
   */
  closeDeletePhotoConfirm(): void {
    this.photoToDelete.set(null);
  }

  /**
   * Batch fotó törlés confirm megnyitása
   */
  openDeletePhotosConfirm(): void {
    this.deletePhotosDialog.open();
  }

  /**
   * Batch fotó törlés confirm bezárása
   */
  closeDeletePhotosConfirm(): void {
    this.deletePhotosDialog.close();
  }

  /**
   * Fotó kiválasztása törlésre (batch mód)
   */
  toggleDeleteSelection(photoId: number): void {
    const currentIds = this.deleteSelectedIds();
    if (currentIds.includes(photoId)) {
      this.deleteSelectedIds.set(currentIds.filter(id => id !== photoId));
    } else {
      this.deleteSelectedIds.set([...currentIds, photoId]);
    }
  }

  /**
   * Törlés kijelölés törlése
   */
  clearDeleteSelection(): void {
    this.deleteSelectedIds.set([]);
  }

  /**
   * Fotó törölve a listából
   */
  removePhoto(photoId: number): void {
    const current = this.album();
    if (!current) return;

    this.album.set({
      ...current,
      photos: current.photos.filter(p => p.id !== photoId),
      photosCount: current.photosCount - 1
    });
  }

  /**
   * Több fotó törölve a listából
   */
  removePhotos(photoIds: number[]): void {
    const current = this.album();
    if (!current) return;

    this.album.set({
      ...current,
      photos: current.photos.filter(p => !photoIds.includes(p.id)),
      photosCount: current.photosCount - photoIds.length
    });
    this.deleteSelectedIds.set([]);
    this.deletingPhotos.set(false);
  }

  /**
   * Lightbox megnyitása adott indexnél
   */
  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  /**
   * Lightbox megnyitása fotó ID alapján
   */
  openLightboxAtPhoto(photoId: number): void {
    const photos = this.album()?.photos || [];
    const index = photos.findIndex(p => p.id === photoId);
    if (index >= 0) {
      this.openLightbox(index);
    }
  }

  /**
   * Lightbox bezárása
   */
  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  /**
   * Lightbox navigálás
   */
  navigateLightbox(direction: number): void {
    const newIndex = this.lightboxIndex() + direction;
    const photos = this.album()?.photos || [];
    if (newIndex >= 0 && newIndex < photos.length) {
      this.lightboxIndex.set(newIndex);
    }
  }

  /**
   * Lista szűrő változás
   */
  setListFilter(filter: 'all' | 'selected' | 'unselected'): void {
    this.listFilter.set(filter);
    this.currentPage.set(1);
  }

  /**
   * Keresési kifejezés változás
   */
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  /**
   * Oldal váltás
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  /**
   * Lejárat frissítése
   */
  updateExpiry(expiresAt: string | null): void {
    const current = this.album();
    if (!current) return;

    this.album.set({
      ...current,
      expiresAt
    });
    this.extendingExpiry.set(false);
  }

  /**
   * Fotó kiválasztva-e (selection)
   */
  isPhotoSelected(photoId: number): boolean {
    return this.selectedPhotoIds().includes(photoId);
  }

  /**
   * Fotó kiválasztva törlésre-e
   */
  isDeleteSelected(photoId: number): boolean {
    return this.deleteSelectedIds().includes(photoId);
  }

  /**
   * Lejárat dátum value formázás
   */
  getExpiryDateValue(): string {
    const expiresAt = this.album()?.expiresAt;
    if (!expiresAt) return '';
    return new Date(expiresAt).toISOString().split('T')[0];
  }

  /**
   * Holnapi dátum (minimum lejárathoz)
   */
  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.loading.set(true);
    this.album.set(null);
    this.viewMode.set('list');
    this.uploading.set(false);
    this.uploadProgress.set(null);
    this.deleteSelectedIds.set([]);
    this.deletingPhotos.set(false);
    this.photoToDelete.set(null);
    this.listFilter.set('all');
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.editDialog.reset();
    this.deleteAlbumDialog.reset();
    this.deletePhotoDialog.reset();
    this.deletePhotosDialog.reset();
    this.lightboxOpen.set(false);
    this.lightboxIndex.set(0);
    this.saving.set(false);
    this.activating.set(false);
    this.extendingExpiry.set(false);
    this.downloading.set(false);
    this.exporting.set(false);
  }
}
