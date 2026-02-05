import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PartnerOrdersService } from '../../../services/partner-orders.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AlbumDetailState } from './album-detail.state';
import { AlbumEditFormData } from './components/album-edit-modal/album-edit-modal.component';

/**
 * AlbumDetailActionsService
 *
 * HTTP-hívás logika az album-detail komponenshez.
 * Component-scoped (providers tömbben regisztrált).
 */
@Injectable()
export class AlbumDetailActionsService {
  private readonly ordersService = inject(PartnerOrdersService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // === ALBUM LOADING ===

  loadAlbum(state: AlbumDetailState, id: number): void {
    state.startLoading();
    this.ordersService.getAlbum(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (album) => {
        state.finishLoading(album);
      },
      error: () => {
        this.toast.error('Hiba', 'Az album nem található');
        this.router.navigate(['/partner/orders/clients']);
      }
    });
  }

  // === ACTIVATE ===

  activateAlbum(state: AlbumDetailState): void {
    const album = state.album();
    if (!album) return;

    state.activating.set(true);
    this.ordersService.activateAlbum(album.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Siker', 'Album aktiválva! Az ügyfél mostantól elérheti.');
        this.loadAlbum(state, album.id);
        state.activating.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        state.activating.set(false);
      }
    });
  }

  // === DELETE ALBUM ===

  deleteAlbum(state: AlbumDetailState): void {
    const album = state.album();
    if (!album) return;

    const clientId = album.client.id;
    this.ordersService.deleteAlbum(album.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Siker', 'Album törölve');
        this.router.navigate(['/partner/orders/clients', clientId]);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
      }
    });
  }

  // === UPLOAD ===

  uploadFiles(state: AlbumDetailState, files: File[]): void {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/zip', 'application/x-zip-compressed'];
    const validFiles = files.filter(f => {
      const isValidType = validTypes.includes(f.type) || f.name.toLowerCase().endsWith('.zip');
      const isValidSize = f.size <= 50 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      this.toast.error('Hiba', 'Nincs érvényes fájl a feltöltéshez');
      return;
    }

    if (validFiles.length !== files.length) {
      this.toast.warning('Figyelem', `${files.length - validFiles.length} fájl nem megfelelő formátumú vagy túl nagy`);
    }

    const album = state.album();
    if (!album) return;

    state.startUpload(validFiles.length);

    this.ordersService.uploadPhotosChunked(album.id, validFiles).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (progress) => {
        state.updateUploadProgress(progress);
        if (progress.completed) {
          this.toast.success('Siker', `${progress.uploadedCount} kép sikeresen feltöltve`);
          this.loadAlbum(state, album.id);
          state.uploadSuccess();
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt a feltöltés során');
        state.uploadError();
      }
    });
  }

  // === DELETE PHOTO ===

  deletePhoto(state: AlbumDetailState): void {
    const photo = state.photoToDelete();
    const album = state.album();
    if (!photo || !album) return;

    this.ordersService.deletePhoto(album.id, photo.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        state.removePhoto(photo.id);
        this.toast.success('Siker', 'Kép törölve');
        state.closeDeletePhotoConfirm();
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        state.closeDeletePhotoConfirm();
      }
    });
  }

  // === DELETE MULTIPLE PHOTOS ===

  deleteSelectedPhotos(state: AlbumDetailState): void {
    const idsToDelete = state.deleteSelectedIds();
    const album = state.album();
    if (idsToDelete.length === 0 || !album) return;

    state.deletingPhotos.set(true);

    const deletePromises = idsToDelete.map(id =>
      this.ordersService.deletePhoto(album.id, id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        state.removePhotos(idsToDelete);
        this.toast.success('Siker', `${idsToDelete.length} kép törölve`);
      })
      .catch(() => {
        this.toast.error('Hiba', 'Nem sikerült törölni néhány képet');
        state.deletingPhotos.set(false);
        this.loadAlbum(state, album.id);
      });
  }

  // === SAVE ALBUM ===

  saveAlbum(state: AlbumDetailState, formData: AlbumEditFormData): void {
    if (!formData.name.trim()) {
      this.toast.error('Hiba', 'Az album neve kötelező');
      return;
    }

    const album = state.album();
    if (!album) return;

    state.saving.set(true);
    this.ordersService.updateAlbum(album.id, {
      name: formData.name.trim(),
      min_selections: formData.minSelections,
      max_selections: formData.maxSelections,
      max_retouch_photos: formData.maxRetouchPhotos,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Siker', 'Album mentve');
        this.loadAlbum(state, album.id);
        state.editSuccess();
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Nem sikerült menteni');
        state.saving.set(false);
      }
    });
  }

  // === EXPIRY ===

  changeExpiry(state: AlbumDetailState, dateString: string): void {
    const album = state.album();
    if (!album) return;

    const newExpiry = new Date(dateString);
    newExpiry.setHours(23, 59, 59, 999);

    state.extendingExpiry.set(true);
    this.ordersService.extendAlbumExpiry(album.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        state.updateExpiry(response.data.expiresAt);
        this.toast.success('Siker', 'Lejárat módosítva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        state.extendingExpiry.set(false);
      }
    });
  }

  extendExpiry(state: AlbumDetailState, days: number): void {
    const album = state.album();
    if (!album) return;

    const currentExpiry = album.expiresAt;
    const baseDate = currentExpiry ? new Date(currentExpiry) : new Date();
    const startDate = baseDate < new Date() ? new Date() : baseDate;
    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    state.extendingExpiry.set(true);
    this.ordersService.extendAlbumExpiry(album.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        state.updateExpiry(response.data.expiresAt);
        this.toast.success('Siker', `Lejárat meghosszabbítva ${days} nappal`);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        state.extendingExpiry.set(false);
      }
    });
  }

  // === EXPORT ===

  downloadZip(state: AlbumDetailState): void {
    const album = state.album();
    const photoIds = state.selectedPhotoIds();
    if (!album || photoIds.length === 0) {
      this.toast.warning('Figyelem', 'Nincs kiválasztott kép');
      return;
    }

    state.downloading.set(true);
    this.ordersService.downloadSelectedZip(album.id, photoIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.triggerDownload(blob, `album-${album.id}-selected.zip`);
          state.downloading.set(false);
          this.toast.success('Siker', 'Letöltés elkezdődött');
        },
        error: () => {
          this.toast.error('Hiba', 'Nem sikerült a letöltés');
          state.downloading.set(false);
        }
      });
  }

  exportExcel(state: AlbumDetailState): void {
    const album = state.album();
    if (!album) return;

    const photoIds = state.selectedPhotoIds();
    const idsToExport = photoIds.length > 0 ? photoIds : album.photos.map(p => p.id);

    state.exporting.set(true);
    this.ordersService.exportExcel(album.id, idsToExport)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.triggerDownload(blob, `album-${album.id}-export.xlsx`);
          state.exporting.set(false);
          this.toast.success('Siker', 'Excel export elkészült');
        },
        error: () => {
          this.toast.error('Hiba', 'Nem sikerült az export');
          state.exporting.set(false);
        }
      });
  }

  // === PRIVATE HELPERS ===

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
