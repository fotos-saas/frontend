import { Directive, input, output, HostListener, inject } from '@angular/core';
import { FileUploadService } from '../../core/services/file-upload.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * File Upload Directive
 * Fájl feltöltés validációval és esemény kezeléssel
 *
 * Használat:
 * <input
 *   type="file"
 *   [fileUpload]="'background'"
 *   (fileSelectedEvent)="onFileSelected($event)"
 * />
 */
@Directive({
  selector: '[fileUpload]',
  standalone: true
})
export class FileUploadDirective {
  /** Signal-based inputs */
  readonly fileUpload = input.required<'background' | 'attachment'>();

  /** Signal-based outputs */
  readonly fileSelectedEvent = output<File>();

  private readonly fileUploadService = inject(FileUploadService);
  private readonly toastService = inject(ToastService);

  /**
   * File input change event
   */
  @HostListener('change', ['$event'])
  onChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Validáció
    const validation = this.fileUploadService.validateFile(file, this.fileUpload());

    if (!validation.valid) {
      this.toastService.error('Fájl hiba', validation.error || 'Érvénytelen fájl');
      // Input tisztítása
      input.value = '';
      return;
    }

    // Validált fájl kiküldése
    this.fileSelectedEvent.emit(file);

    // Input tisztítása (újra ugyanaz a fájl is kiválasztható legyen)
    input.value = '';
  }
}
