import { signal, computed } from '@angular/core';
import { DialogStateHelper } from '../../../../shared/helpers/dialog-state.helper';
import { GalleryDetails, GalleryPhoto, GalleryProgress } from '../../models/gallery.models';
import { WorkflowPhoto } from '../../../photo-selection/models/workflow.models';
import { LightboxMediaItem } from '../../../../shared/components/media-lightbox/media-lightbox.types';

/**
 * Gallery Detail State
 *
 * Signal-based state management a galéria kezelő oldalhoz.
 * Az AlbumDetailState mintájára épül.
 */
export class GalleryDetailState {
  // === GALLERY STATE ===

  readonly loading = signal<boolean>(true);
  readonly gallery = signal<GalleryDetails | null>(null);
  readonly viewMode = signal<'grid' | 'list'>('grid');

  // === PROGRESS STATE ===

  readonly progress = signal<GalleryProgress | null>(null);

  // === UPLOAD STATE ===

  readonly uploading = signal<boolean>(false);
  readonly uploadProgress = signal<number>(0);

  // === DELETE STATE ===

  readonly deleteSelectedIds = signal<number[]>([]);
  readonly deletingPhotos = signal<boolean>(false);
  readonly photoToDelete = signal<GalleryPhoto | null>(null);

  // === LIST VIEW STATE ===

  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly pageSize = 40;

  // === DIALOGS ===

  readonly deletePhotoDialog = new DialogStateHelper();
  readonly deletePhotosDialog = new DialogStateHelper();

  // === LIGHTBOX ===

  readonly lightboxOpen = signal<boolean>(false);
  readonly lightboxIndex = signal<number>(0);

  // === COMPUTED VALUES ===

  /** WorkflowPhoto[] formátum a grid-hez */
  readonly gridPhotos = computed<WorkflowPhoto[]>(() => {
    const galleryData = this.gallery();
    if (!galleryData) return [];

    return galleryData.photos.map(photo => ({
      id: photo.id,
      url: photo.original_url,
      thumbnailUrl: photo.thumb_url,
      filename: photo.name,
    }));
  });

  /** Szűrt fotók (keresés alapján) */
  readonly filteredPhotos = computed<GalleryPhoto[]>(() => {
    const galleryData = this.gallery();
    if (!galleryData) return [];

    let photos = [...galleryData.photos];
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      photos = photos.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.title.toLowerCase().includes(query)
      );
    }

    return photos;
  });

  /** Paginált fotók a lista nézethez */
  readonly paginatedPhotos = computed<GalleryPhoto[]>(() => {
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

  /** Lightbox media items */
  readonly lightboxMedia = computed<LightboxMediaItem[]>(() => {
    const galleryData = this.gallery();
    if (!galleryData) return [];

    return galleryData.photos.map(photo => ({
      id: photo.id,
      url: photo.original_url,
      fileName: photo.name,
    }));
  });

  /** Progress összesítő: összesen aktív felhasználó */
  readonly progressTotal = computed<number>(() => {
    const p = this.progress();
    if (!p) return 0;
    return p.totalUsers;
  });

  // === METHODS ===

  finishLoading(loadedGallery: GalleryDetails): void {
    this.gallery.set(loadedGallery);
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
    this.uploadProgress.set(0);
  }

  updateUploadProgress(progress: number): void {
    this.uploadProgress.set(progress);
  }

  uploadSuccess(): void {
    this.uploading.set(false);
    this.uploadProgress.set(0);
  }

  uploadError(): void {
    this.uploading.set(false);
    this.uploadProgress.set(0);
  }

  /** Fotó kiválasztása törlésre */
  toggleDeleteSelection(photoId: number): void {
    const currentIds = this.deleteSelectedIds();
    if (currentIds.includes(photoId)) {
      this.deleteSelectedIds.set(currentIds.filter(id => id !== photoId));
    } else {
      this.deleteSelectedIds.set([...currentIds, photoId]);
    }
  }

  /** Összes fotó kijelölése törlésre */
  selectAllForDelete(): void {
    const galleryData = this.gallery();
    if (!galleryData) return;
    this.deleteSelectedIds.set(galleryData.photos.map(p => p.id));
  }

  /** Összes fotó kijelölve van-e */
  readonly allSelectedForDelete = computed(() => {
    const galleryData = this.gallery();
    if (!galleryData || galleryData.photos.length === 0) return false;
    return this.deleteSelectedIds().length === galleryData.photos.length;
  });

  clearDeleteSelection(): void {
    this.deleteSelectedIds.set([]);
  }

  confirmDeletePhoto(photo: GalleryPhoto): void {
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

  /** Fotó törölve a listából */
  removePhoto(photoId: number): void {
    const current = this.gallery();
    if (!current) return;

    this.gallery.set({
      ...current,
      photos: current.photos.filter(p => p.id !== photoId),
      photosCount: current.photosCount - 1,
    });
  }

  /** Több fotó törölve */
  removePhotos(photoIds: number[]): void {
    const current = this.gallery();
    if (!current) return;

    this.gallery.set({
      ...current,
      photos: current.photos.filter(p => !photoIds.includes(p.id)),
      photosCount: current.photosCount - photoIds.length,
    });
    this.deleteSelectedIds.set([]);
    this.deletingPhotos.set(false);
  }

  /** Lightbox megnyitása */
  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  openLightboxAtPhoto(photoId: number): void {
    const photos = this.gallery()?.photos ?? [];
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
    const photos = this.gallery()?.photos ?? [];
    if (newIndex >= 0 && newIndex < photos.length) {
      this.lightboxIndex.set(newIndex);
    }
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

  isDeleteSelected(photoId: number): boolean {
    return this.deleteSelectedIds().includes(photoId);
  }

  reset(): void {
    this.loading.set(true);
    this.gallery.set(null);
    this.viewMode.set('grid');
    this.progress.set(null);
    this.uploading.set(false);
    this.uploadProgress.set(0);
    this.deleteSelectedIds.set([]);
    this.deletingPhotos.set(false);
    this.photoToDelete.set(null);
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.deletePhotoDialog.reset();
    this.deletePhotosDialog.reset();
    this.lightboxOpen.set(false);
    this.lightboxIndex.set(0);
  }
}
