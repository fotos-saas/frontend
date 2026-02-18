import { Injectable, inject, DestroyRef, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  PartnerService,
  UploadedPhoto,
  TabloPersonItem,
  MatchResult,
  PhotoAssignment,
  AlbumsSummary,
  AlbumType
} from '../../../services/partner.service';
import { UploadProgressService } from '../../../../../core/services/upload-progress.service';
import { environment } from '../../../../../../environments/environment';
import type { FileUploadProgress } from '../../../../../core/models/upload-progress.models';

/**
 * Component-scoped service a PhotoUploadWizard HTTP hívásaihoz.
 * NEM providedIn: 'root' - a komponens providers tömbjében kell regisztrálni.
 */
@Injectable()
export class PhotoUploadWizardActionsService {
  private partnerService = inject(PartnerService);
  private uploadService = inject(UploadProgressService);
  private destroyRef = inject(DestroyRef);

  // === DATA LOADING ===

  loadAlbums(
    projectId: number,
    albumsSummary: WritableSignal<AlbumsSummary | null>,
    loadingAlbums: WritableSignal<boolean>
  ): void {
    loadingAlbums.set(true);
    this.partnerService.getAlbums(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          albumsSummary.set(response.albums);
          loadingAlbums.set(false);
        },
        error: () => loadingAlbums.set(false)
      });
  }

  loadPersons(
    projectId: number,
    persons: WritableSignal<TabloPersonItem[]>
  ): void {
    this.partnerService.getProjectPersons(projectId, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => persons.set(response.data)
      });
  }

  loadAlbumDetails(
    projectId: number,
    album: AlbumType,
    uploadedPhotos: WritableSignal<UploadedPhoto[]>
  ): void {
    this.partnerService.getAlbum(projectId, album)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => uploadedPhotos.set(response.album.photos)
      });
  }

  // === UPLOAD ===

  /**
   * Fájlok feltöltése albumba valós idejű progress-szel.
   * Egyedi képek: chunked HTTP progress
   * ZIP: async job + polling (ha backend async: true)
   */
  uploadFiles(
    projectId: number,
    album: AlbumType,
    files: File[],
    uploadedPhotos: WritableSignal<UploadedPhoto[]>,
    uploading: WritableSignal<boolean>,
    uploadProgress: WritableSignal<FileUploadProgress | null>
  ): void {
    uploading.set(true);
    uploadProgress.set(null);

    const isZip = files.length === 1 && files[0].name.toLowerCase().endsWith('.zip');
    const uploadUrl = `${environment.apiUrl}/partner/projects/${projectId}/albums/${album}/upload`;

    const upload$ = isZip
      ? this.uploadService.uploadZipWithProgress(
          uploadUrl,
          files[0],
          `${environment.apiUrl}/partner/upload-status/{batchId}`,
        )
      : this.uploadService.uploadFilesWithProgress(uploadUrl, files);

    upload$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (progress) => {
          uploadProgress.set(progress);
          if (progress.completed) {
            if (progress.photos.length > 0) {
              const newPhotos: UploadedPhoto[] = progress.photos.map(p => ({
                mediaId: p.mediaId,
                filename: p.filename,
                iptcTitle: p.iptcTitle ?? null,
                thumbUrl: p.thumbUrl,
                fullUrl: p.fullUrl ?? '',
              }));
              uploadedPhotos.update(current => [...newPhotos, ...current]);
            } else {
              // Async ZIP: fotók nincsenek a polling válaszban → album újratöltés
              this.loadAlbumDetails(projectId, album, uploadedPhotos);
            }
            uploading.set(false);
          } else if (progress.phase === 'error') {
            uploading.set(false);
          }
        },
        error: () => {
          uploading.set(false);
          uploadProgress.set(null);
        },
      });
  }

  // === DELETE ===

  removePhoto(
    projectId: number,
    mediaId: number,
    uploadedPhotos: WritableSignal<UploadedPhoto[]>
  ): void {
    this.partnerService.deletePendingPhotos(projectId, [mediaId])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          uploadedPhotos.update(photos => photos.filter(p => p.mediaId !== mediaId));
        }
      });
  }

  confirmDelete(
    projectId: number,
    mediaIds: number[],
    uploadedPhotos: WritableSignal<UploadedPhoto[]>,
    assignments: WritableSignal<PhotoAssignment[]>,
    saving: WritableSignal<boolean>,
    deleteConfirmData: WritableSignal<{ mediaIds: number[]; count: number } | null>,
    showDeleteConfirm: WritableSignal<boolean>
  ): void {
    showDeleteConfirm.set(false);
    saving.set(true);

    this.partnerService.deletePendingPhotos(projectId, mediaIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const deletedSet = new Set(mediaIds);
          uploadedPhotos.update(photos => photos.filter(p => !deletedSet.has(p.mediaId)));
          assignments.update(a => a.filter(x => !deletedSet.has(x.mediaId)));
          saving.set(false);
          deleteConfirmData.set(null);
        },
        error: () => {
          saving.set(false);
          deleteConfirmData.set(null);
        }
      });
  }

  // === AI MATCHING ===

  startAiMatching(
    projectId: number,
    photoIds: number[],
    persons: TabloPersonItem[],
    matchResult: WritableSignal<MatchResult | null>,
    assignments: WritableSignal<PhotoAssignment[]>,
    matching: WritableSignal<boolean>,
    onComplete: () => void
  ): void {
    matching.set(true);

    this.partnerService.matchPhotos(projectId, photoIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          matchResult.set(response);
          matching.set(false);
          this.buildInitialAssignments(response, persons, assignments);
          setTimeout(() => onComplete(), 300);
        },
        error: () => matching.set(false)
      });
  }

  // === FINALIZE ===

  finalize(
    projectId: number,
    currentAssignments: PhotoAssignment[],
    saving: WritableSignal<boolean>,
    onComplete: (assignedCount: number) => void
  ): void {
    saving.set(true);
    this.partnerService.assignPhotos(projectId, currentAssignments)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          saving.set(false);
          onComplete(response.assignedCount);
        },
        error: () => saving.set(false)
      });
  }

  // === HELPER ===

  private buildInitialAssignments(
    result: MatchResult,
    persons: TabloPersonItem[],
    assignments: WritableSignal<PhotoAssignment[]>
  ): void {
    const newAssignments: PhotoAssignment[] = [];
    for (const match of result.matches) {
      if (match.mediaId) {
        const person = persons.find(p => p.name === match.name);
        if (person) {
          newAssignments.push({ personId: person.id, mediaId: match.mediaId });
        }
      }
    }
    assignments.set(newAssignments);
  }
}
