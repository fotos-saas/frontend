import { Injectable, inject, signal } from '@angular/core';
import { PostFormValidatorService, MediaValidationResult } from './post-form-validator.service';
import { NewsfeedMedia } from '../../../core/services/newsfeed.service';

/**
 * Media Upload Service
 *
 * A poszt létrehozás/szerkesztés média kezelési logikája.
 * Kiemelve a create-post-dialog komponensből a Clean Code elvek szerint.
 *
 * Felelősségek:
 * - Fájl validáció
 * - Preview kezelés
 * - Média törlés logika (edit módban)
 */
@Injectable({
  providedIn: 'root'
})
export class MediaUploadService {
  private readonly validator = inject(PostFormValidatorService);

  /**
   * Fájlok hozzáadása validációval
   * @returns Validációs hiba vagy null ha sikeres
   */
  addFiles(
    files: FileList,
    currentFiles: File[],
    remainingSlots: number
  ): { files: File[]; error: string | null } {
    const newFiles = Array.from(files);
    const result: File[] = [...currentFiles];
    let error: string | null = null;

    for (const file of newFiles.slice(0, remainingSlots)) {
      const validationResult = this.validator.validateMediaFile(file);
      if (!validationResult.valid) {
        error = validationResult.error ?? null;
        continue;
      }

      result.push(file);
    }

    return { files: result, error };
  }

  /**
   * Fájl eltávolítása index alapján
   */
  removeFile(files: File[], index: number): File[] {
    return files.filter((_, i) => i !== index);
  }

  /**
   * Edit módban: meglévő média szűrése (ami nincs törölve)
   */
  filterRemainingMedia(media: NewsfeedMedia[] | undefined, deleteIds: number[]): NewsfeedMedia[] {
    return media?.filter(m => !deleteIds.includes(m.id)) ?? [];
  }

  /**
   * Edit módban: szabad helyek száma új médiának
   */
  calculateAvailableSlots(
    existingMediaCount: number,
    mediaToDeleteCount: number,
    newFilesCount: number
  ): number {
    const remainingExisting = existingMediaCount - mediaToDeleteCount;
    return this.validator.maxFiles - remainingExisting - newFilesCount;
  }

  /**
   * Média törlésre jelölése (edit módban)
   */
  markForDeletion(deleteIds: number[], mediaId: number): number[] {
    if (!deleteIds.includes(mediaId)) {
      return [...deleteIds, mediaId];
    }
    return deleteIds;
  }

  /**
   * Törlés visszavonása (edit módban)
   */
  undoDeletion(deleteIds: number[], mediaId: number): number[] {
    return deleteIds.filter(id => id !== mediaId);
  }

  /**
   * Média keresése ID alapján
   */
  findMediaById(media: NewsfeedMedia[] | undefined, mediaId: number): NewsfeedMedia | undefined {
    return media?.find(m => m.id === mediaId);
  }

  /**
   * Fájl méret formázás (delegate to validator)
   */
  formatFileSize(bytes: number): string {
    return this.validator.formatFileSize(bytes);
  }

  /**
   * Max fájlok száma
   */
  get maxFiles(): number {
    return this.validator.maxFiles;
  }
}
