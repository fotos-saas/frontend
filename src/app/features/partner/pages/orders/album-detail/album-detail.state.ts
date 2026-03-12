import { signal, computed } from '@angular/core';
import { DialogStateHelper } from '../../../../../shared/helpers/dialog-state.helper';
import {
  PartnerOrderAlbumDetails,
  AlbumPhoto,
  UploadProgress
} from '../../../services/partner-orders.service';
import { WorkflowPhoto } from '../../../../photo-selection/models/workflow.models';
import { LightboxMediaItem } from '../../../../../shared/components/media-lightbox/media-lightbox.types';
import type { FileUploadProgress } from '../../../../../core/models/upload-progress.models';

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

  /** Részletes feltöltési állapot (UploadProgressService) */
  readonly detailedUploadProgress = signal<FileUploadProgress | null>(null);

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

  finishLoading(loadedAlbum: PartnerOrderAlbumDetails): void {
    this.album.set(loadedAlbum);
    this.loading.set(false);
  }

  startLoading(): void {
    this.loading.set(true);
  }

  loadingError(): void {
    this.loading.set(false);
  }

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

  updateUploadProgress(progress: UploadProgress): void {
    this.uploadProgress.set(progress);
  }

  uploadSuccess(): void {
    this.uploading.set(false);
  }

  uploadError(): void {
    this.uploading.set(false);
  }

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

  closeEditModal(): void {
    this.editDialog.close();
  }

  editSuccess(): void {
    this.editDialog.submitSuccess();
    this.saving.set(false);
  }

  openDeleteAlbumConfirm(): void {
    this.deleteAlbumDialog.open();
  }

  closeDeleteAlbumConfirm(): void {
    this.deleteAlbumDialog.close();
  }

  confirmDeletePhoto(photo: AlbumPhoto): void {
    this.photoToDelete.set(photo);
  }

  closeDeletePhotoConfirm(): void {
    this.photoToDelete.set(null);
  }

  openDeletePhotosConfirm(): void {
    this.deletePhotosDialog.open();
  }

  closeDeletePhotosConfirm(): void {
    this.deletePhotosDialog.close();
  }

  toggleDeleteSelection(photoId: number): void {
    const currentIds = this.deleteSelectedIds();
    if (currentIds.includes(photoId)) {
      this.deleteSelectedIds.set(currentIds.filter(id => id !== photoId));
    } else {
      this.deleteSelectedIds.set([...currentIds, photoId]);
    }
  }

  clearDeleteSelection(): void {
    this.deleteSelectedIds.set([]);
  }

  removePhoto(photoId: number): void {
    const current = this.album();
    if (!current) return;

    this.album.set({
      ...current,
      photos: current.photos.filter(p => p.id !== photoId),
      photosCount: current.photosCount - 1
    });
  }

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

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  openLightboxAtPhoto(photoId: number): void {
    const photos = this.album()?.photos || [];
    const index = photos.findIndex(p => p.id === photoId);
    if (index >= 0) {
      this.openLightbox(index);
    }
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  navigateLightbox(direction: number): void {
    const newIndex = this.lightboxIndex() + direction;
    const photos = this.album()?.photos || [];
    if (newIndex >= 0 && newIndex < photos.length) {
      this.lightboxIndex.set(newIndex);
    }
  }

  setListFilter(filter: 'all' | 'selected' | 'unselected'): void {
    this.listFilter.set(filter);
    this.currentPage.set(1);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  updateExpiry(expiresAt: string | null): void {
    const current = this.album();
    if (!current) return;

    this.album.set({
      ...current,
      expiresAt
    });
    this.extendingExpiry.set(false);
  }

  isPhotoSelected(photoId: number): boolean {
    return this.selectedPhotoIds().includes(photoId);
  }

  isDeleteSelected(photoId: number): boolean {
    return this.deleteSelectedIds().includes(photoId);
  }

  getExpiryDateValue(): string {
    const expiresAt = this.album()?.expiresAt;
    if (!expiresAt) return '';
    return new Date(expiresAt).toISOString().split('T')[0];
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  reset(): void {
    this.loading.set(true);
    this.album.set(null);
    this.viewMode.set('list');
    this.uploading.set(false);
    this.uploadProgress.set(null);
    this.detailedUploadProgress.set(null);
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
