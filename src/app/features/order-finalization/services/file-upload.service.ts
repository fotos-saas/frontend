import { Injectable, inject, signal } from '@angular/core';
import { Observable, throwError, from, switchMap } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { OrderFinalizationService } from './order-finalization.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { FileUploadService as CoreFileUploadService } from '../../../core/services/file-upload.service';
import { FileUploadResponse } from '../models/order-finalization.models';
import { ERROR_MESSAGES } from '@shared/constants';

/**
 * Order Finalization File Upload Service
 *
 * Specializált fájl feltöltési szolgáltatás a véglegesítéshez.
 * A core FileUploadService-t használja validációra.
 *
 * Funkciók:
 * - Magic bytes validáció (MIME spoofing védelem)
 * - Per-file loading state
 * - Upload progress tracking
 * - Toast értesítések
 */
@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private readonly orderFinalizationService = inject(OrderFinalizationService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly coreFileUpload = inject(CoreFileUploadService);

  /** Háttérkép feltöltés folyamatban */
  backgroundUploading = signal<boolean>(false);

  /** Csatolmány feltöltés folyamatban */
  attachmentUploading = signal<boolean>(false);

  /** Upload progress (0-100) */
  uploadProgress = signal<number>(0);

  /**
   * Háttérkép feltöltése (validációval)
   * @param file - Fájl
   * @returns Observable<FileUploadResponse>
   */
  uploadBackgroundImage(file: File): Observable<FileUploadResponse> {
    return this.uploadFile(file, 'background', this.backgroundUploading);
  }

  /**
   * Csatolmány feltöltése (validációval)
   * @param file - Fájl
   * @returns Observable<FileUploadResponse>
   */
  uploadAttachment(file: File): Observable<FileUploadResponse> {
    return this.uploadFile(file, 'attachment', this.attachmentUploading);
  }

  /**
   * Fájl feltöltése validációval
   * @param file - Fájl
   * @param type - Típus (background | attachment)
   * @param loadingSignal - Loading signal referencia
   * @returns Observable<FileUploadResponse>
   */
  private uploadFile(
    file: File,
    type: 'background' | 'attachment',
    loadingSignal: ReturnType<typeof signal<boolean>>
  ): Observable<FileUploadResponse> {
    const config = this.coreFileUpload.getConfig(type);

    // 1. Szinkron validáció (méret + MIME + extension)
    const syncResult = this.coreFileUpload.validateFile(file, type);
    if (!syncResult.valid) {
      this.toastService.error('Validációs hiba', syncResult.error || 'Érvénytelen fájl');
      return throwError(() => new Error(syncResult.error));
    }

    // 2. Magic bytes validáció (async)
    return from(this.coreFileUpload.validateMagicBytes(file, config)).pipe(
      switchMap(isValid => {
        if (!isValid) {
          const errorMsg = config.errorMessages.magicBytes || 'A fájl tartalma nem megfelelő!';
          this.toastService.error('Érvénytelen fájl', errorMsg);
          return throwError(() => new Error('Invalid file magic bytes'));
        }

        // 3. Upload
        loadingSignal.set(true);
        this.uploadProgress.set(0);

        return this.orderFinalizationService.uploadFile(file, type).pipe(
          tap(() => {
            this.uploadProgress.set(100);
          }),
          catchError(err => {
            this.logger.error(`${type} upload failed`, err);
            this.toastService.error('Hiba', ERROR_MESSAGES.FILE_UPLOAD);
            return throwError(() => err);
          }),
          tap({
            complete: () => loadingSignal.set(false),
            error: () => loadingSignal.set(false)
          })
        );
      })
    );
  }

  /**
   * Fájl törlése
   * @param fileId - Fájl ID
   * @returns Observable<void>
   */
  deleteFile(fileId: string): Observable<{ success: boolean }> {
    return this.orderFinalizationService.deleteFile(fileId).pipe(
      catchError(err => {
        this.logger.error('File delete failed', err);
        this.toastService.error('Hiba', ERROR_MESSAGES.FILE_DELETE);
        return throwError(() => err);
      })
    );
  }

  /**
   * Loading state lekérése típus alapján
   * @param type - Típus
   * @returns boolean signal értéke
   */
  isUploading(type: 'background' | 'attachment'): boolean {
    return type === 'background'
      ? this.backgroundUploading()
      : this.attachmentUploading();
  }

  /**
   * Háttérkép konfiguráció lekérése
   */
  get backgroundConfig() {
    return this.coreFileUpload.backgroundConfig;
  }

  /**
   * Csatolmány konfiguráció lekérése
   */
  get attachmentConfig() {
    return this.coreFileUpload.attachmentConfig;
  }
}
