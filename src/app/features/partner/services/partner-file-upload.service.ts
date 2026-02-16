import { Injectable, inject, signal } from '@angular/core';
import { Observable, throwError, from, switchMap } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PartnerFinalizationApiService } from './partner-finalization-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { FileUploadService as CoreFileUploadService } from '../../../core/services/file-upload.service';
import { FileUploadResponse } from '../../order-finalization/models/order-finalization.models';

/**
 * Partner File Upload Service
 * Fájl feltöltés a partner order wizard-hoz.
 * A PartnerFinalizationApiService-t használja (partner endpoint).
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerFileUploadService {
  private readonly partnerApi = inject(PartnerFinalizationApiService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly coreFileUpload = inject(CoreFileUploadService);

  backgroundUploading = signal<boolean>(false);
  attachmentUploading = signal<boolean>(false);
  uploadProgress = signal<number>(0);

  private projectId = 0;

  setProjectId(id: number): void {
    this.projectId = id;
  }

  uploadBackgroundImage(file: File): Observable<FileUploadResponse> {
    return this.uploadFile(file, 'background', this.backgroundUploading);
  }

  uploadAttachment(file: File): Observable<FileUploadResponse> {
    return this.uploadFile(file, 'attachment', this.attachmentUploading);
  }

  private uploadFile(
    file: File,
    type: 'background' | 'attachment',
    loadingSignal: ReturnType<typeof signal<boolean>>
  ): Observable<FileUploadResponse> {
    const config = this.coreFileUpload.getConfig(type);

    const syncResult = this.coreFileUpload.validateFile(file, type);
    if (!syncResult.valid) {
      this.toastService.error('Validációs hiba', syncResult.error || 'Érvénytelen fájl');
      return throwError(() => new Error(syncResult.error));
    }

    return from(this.coreFileUpload.validateMagicBytes(file, config)).pipe(
      switchMap(isValid => {
        if (!isValid) {
          const errorMsg = config.errorMessages.magicBytes || 'A fájl tartalma nem megfelelő!';
          this.toastService.error('Érvénytelen fájl', errorMsg);
          return throwError(() => new Error('Invalid file magic bytes'));
        }

        loadingSignal.set(true);
        this.uploadProgress.set(0);

        return this.partnerApi.uploadFile(this.projectId, file, type).pipe(
          tap(() => {
            this.uploadProgress.set(100);
          }),
          catchError(err => {
            this.logger.error(`${type} upload failed`, err);
            this.toastService.error('Hiba', 'Hiba történt a fájl feltöltésekor');
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

  deleteFile(fileId: string): Observable<{ success: boolean }> {
    return this.partnerApi.deleteFile(this.projectId, fileId).pipe(
      catchError(err => {
        this.logger.error('File delete failed', err);
        this.toastService.error('Hiba', 'Hiba történt a fájl törlésekor');
        return throwError(() => err);
      })
    );
  }

  isUploading(type: 'background' | 'attachment'): boolean {
    return type === 'background'
      ? this.backgroundUploading()
      : this.attachmentUploading();
  }

  formatFileSize(bytes: number): string {
    return this.coreFileUpload.formatFileSize(bytes);
  }

  get backgroundConfig() {
    return this.coreFileUpload.backgroundConfig;
  }

  get attachmentConfig() {
    return this.coreFileUpload.attachmentConfig;
  }
}
