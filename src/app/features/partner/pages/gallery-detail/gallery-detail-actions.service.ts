import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PartnerService } from '../../services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UploadProgressService } from '../../../../core/services/upload-progress.service';
import { environment } from '../../../../../environments/environment';
import { GalleryDetailState } from './gallery-detail.state';

/**
 * GalleryDetailActionsService
 *
 * HTTP-hívás logika a galéria kezelő oldalhoz.
 * Component-scoped (providers tömbben regisztrált).
 */
@Injectable()
export class GalleryDetailActionsService {
  private readonly partnerService = inject(PartnerService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly uploadService = inject(UploadProgressService);
  private readonly destroyRef = inject(DestroyRef);

  // === GALLERY LOADING ===

  loadGallery(state: GalleryDetailState, projectId: number): void {
    state.startLoading();
    this.partnerService.getGallery(projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.hasGallery && response.gallery) {
          state.finishLoading(response.gallery, response.deadline);
          this.loadProgress(state, projectId);
        } else {
          state.loadingError();
          this.toast.error('Hiba', 'A projektnek nincs galéria hozzárendelve');
          this.router.navigate(['/partner/projects', projectId]);
        }
      },
      error: () => {
        state.loadingError();
        this.toast.error('Hiba', 'A galéria nem tölthető be');
        this.router.navigate(['/partner/projects']);
      },
    });
  }

  loadProgress(state: GalleryDetailState, projectId: number): void {
    this.partnerService.getGalleryProgress(projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (progress) => {
        state.progress.set(progress);
      },
    });
  }

  // === UPLOAD ===

  uploadFiles(state: GalleryDetailState, projectId: number, files: File[]): void {
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

    state.startUpload(validFiles.length);

    const uploadUrl = `${environment.apiUrl}/partner/projects/${projectId}/gallery/photos`;

    this.uploadService.uploadFilesWithProgress(uploadUrl, validFiles)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (progress) => {
          state.detailedUploadProgress.set(progress);
          state.updateUploadProgress(progress.overallProgress);
          if (progress.completed) {
            this.toast.success('Siker', `${progress.uploadedCount} kép sikeresen feltöltve`);
            state.uploadSuccess();
            state.detailedUploadProgress.set(null);
            this.refreshGallery(state, projectId);
          }
        },
        error: (err: { error?: { message?: string } }) => {
          this.toast.error('Hiba', err.error?.message ?? 'Hiba történt a feltöltés során');
          state.uploadError();
          state.detailedUploadProgress.set(null);
        },
      });
  }

  /** Galéria háttérfrissítés (skeleton nélkül) */
  private refreshGallery(state: GalleryDetailState, projectId: number): void {
    this.partnerService.getGallery(projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.hasGallery && response.gallery) {
          state.gallery.set(response.gallery);
          state.deadline.set(response.deadline ?? null);
        }
      },
    });
  }

  // === DEADLINE ===

  setDeadline(state: GalleryDetailState, projectId: number, dateString: string | null): void {
    state.settingDeadline.set(true);
    this.partnerService.setGalleryDeadline(projectId, dateString)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          state.deadline.set(response.data.deadline);
          state.settingDeadline.set(false);
          this.toast.success('Siker', 'Határidő beállítva');
        },
        error: () => {
          state.settingDeadline.set(false);
          this.toast.error('Hiba', 'Nem sikerült beállítani a határidőt');
        },
      });
  }

  extendDeadline(state: GalleryDetailState, projectId: number, days: number): void {
    const current = state.deadline();
    const base = current ? new Date(current) : new Date();
    base.setDate(base.getDate() + days);
    const newDeadline = base.toISOString().split('T')[0];
    this.setDeadline(state, projectId, newDeadline);
  }

  // === DELETE PHOTO ===

  deletePhoto(state: GalleryDetailState, projectId: number): void {
    const photo = state.photoToDelete();
    if (!photo) return;

    this.partnerService.deleteGalleryPhoto(projectId, photo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          state.removePhoto(photo.id);
          this.toast.success('Siker', 'Kép törölve');
          state.closeDeletePhotoConfirm();
        },
        error: (err: { error?: { message?: string } }) => {
          this.toast.error('Hiba', err.error?.message ?? 'Hiba történt');
          state.closeDeletePhotoConfirm();
        },
      });
  }

  // === DELETE MULTIPLE PHOTOS ===

  deleteSelectedPhotos(state: GalleryDetailState, projectId: number): void {
    const idsToDelete = state.deleteSelectedIds();
    if (idsToDelete.length === 0) return;

    state.deletingPhotos.set(true);

    this.partnerService.deleteGalleryPhotos(projectId, idsToDelete)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          state.removePhotos(idsToDelete);
          this.toast.success('Siker', `${idsToDelete.length} kép törölve`);
        },
        error: () => {
          this.toast.error('Hiba', 'Nem sikerült törölni a képeket');
          state.deletingPhotos.set(false);
          this.loadGallery(state, projectId);
        },
      });
  }
}
