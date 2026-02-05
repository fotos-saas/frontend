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

/**
 * Component-scoped service a PhotoUploadWizard HTTP hívásaihoz.
 * NEM providedIn: 'root' - a komponens providers tömbjében kell regisztrálni.
 */
@Injectable()
export class PhotoUploadWizardActionsService {
  private partnerService = inject(PartnerService);
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

  uploadFiles(
    projectId: number,
    album: AlbumType,
    files: File[],
    uploadedPhotos: WritableSignal<UploadedPhoto[]>,
    uploading: WritableSignal<boolean>,
    uploadProgress: WritableSignal<number>
  ): void {
    uploading.set(true);
    uploadProgress.set(0);

    const isZip = files.length === 1 && files[0].name.toLowerCase().endsWith('.zip');
    const upload$ = isZip
      ? this.partnerService.uploadZipToAlbum(projectId, album, files[0])
      : this.partnerService.uploadToAlbum(projectId, album, files);

    upload$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          uploadedPhotos.update(current => [...response.photos, ...current]);
          uploading.set(false);
          uploadProgress.set(100);
        },
        error: () => uploading.set(false)
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
