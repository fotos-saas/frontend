import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed,
  OnInit,
  DestroyRef,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsInputComponent, PsFileUploadComponent } from '@shared/components/form';
import { DesignData, FileUploadResponse } from '../../../models/order-finalization.models';
import { OrderValidationService, ValidationError } from '../../../services/order-validation.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { ToastService } from '../../../../../core/services/toast.service';

/**
 * Design Step Component (Step 3)
 * Design beállítások és fájl feltöltés
 *
 * @description
 * - Rich text editor (ngx-editor)
 * - Háttérkép és csatolmány feltöltés
 * - Magic bytes validáció (security)
 * - Per-file loading state
 */
@Component({
  selector: 'app-design-step',
  templateUrl: './design-step.component.html',
  styleUrls: ['./design-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, NgxEditorModule, LucideAngularModule, PsInputComponent, PsFileUploadComponent]
})
export class DesignStepComponent implements OnInit {
  private readonly validationService = inject(OrderValidationService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly MAX_ATTACHMENTS = 5;

  /** Input: Design adatok */
  data = input.required<DesignData>();

  /** Input: Háttérkép fájlnév (ha van) */
  backgroundFileName = input<string | null>(null);

  /** Input: Csatolmány fájlnevek */
  attachmentFileNames = input<string[]>([]);

  /** Output: Adatok változása */
  dataChange = output<DesignData>();

  /** Output: Háttérkép fájlnév változás */
  backgroundFileNameChange = output<string | null>();

  /** Output: Csatolmány fájlnevek változás */
  attachmentFileNamesChange = output<string[]>();

  /** Custom upload callback-ek (partner wizard használja) */
  uploadBackgroundFn = input<((file: File) => Observable<FileUploadResponse>) | null>(null);
  uploadAttachmentFn = input<((file: File) => Observable<FileUploadResponse>) | null>(null);
  deleteFileFn = input<((fileId: string) => Observable<{ success: boolean }>) | null>(null);

  /** Rich text editor */
  editor!: Editor;
  editorToolbar: Toolbar = [
    ['bold', 'italic', 'underline'],
    ['bullet_list', 'ordered_list'],
    ['text_color', 'background_color']
  ];

  /** Validációs hibák */
  errors = computed<ValidationError[]>(() => {
    const result = this.validationService.validateDesignData(this.data());
    return result.errors;
  });

  /** Touched állapot */
  touched: Record<string, boolean> = {
    fontFamily: false,
    fontColor: false,
    description: false
  };

  /** Loading állapotok a FileUploadService-ből */
  get backgroundUploading() { return this.fileUploadService.backgroundUploading; }
  get attachmentUploading() { return this.fileUploadService.attachmentUploading; }

  ngOnInit(): void {
    this.editor = new Editor();

    // Editor cleanup regisztrálása
    this.destroyRef.onDestroy(() => {
      this.editor.destroy();
    });
  }

  /**
   * Mező frissítése
   */
  updateField<K extends keyof DesignData>(field: K, value: DesignData[K]): void {
    this.touched[field as string] = true;
    this.dataChange.emit({ ...this.data(), [field]: value });
  }

  /**
   * Rich text description frissítése (HTML sanitizálás a backend-en történik)
   * Frontend-en csak a max length-et ellenőrizzük
   */
  updateDescription(value: string): void {
    this.touched['description'] = true;
    // Max 5000 karakter (HTML-lel együtt)
    if (value && value.length > 5000) {
      this.toastService.error('Túl hosszú', 'A leírás maximum 5000 karakter lehet');
      return;
    }
    this.dataChange.emit({ ...this.data(), description: value });
  }

  /**
   * Mező hibaüzenetének lekérése
   */
  getFieldError(field: string): string | null {
    if (!this.touched[field]) return null;
    return this.validationService.getFieldError(this.errors(), field);
  }

  /**
   * Mező hibás-e
   */
  hasError(field: string): boolean {
    return !!this.getFieldError(field);
  }

  /**
   * Háttérkép feltöltése (ps-file-upload-ból)
   */
  onBackgroundFileChange(files: File[]): void {
    const file = files[0];
    if (!file) return;

    const upload$ = this.uploadBackgroundFn()
      ? this.uploadBackgroundFn()!(file)
      : this.fileUploadService.uploadBackgroundImage(file);

    upload$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataChange.emit({
              ...this.data(),
              backgroundImageId: response.fileId
            });
            this.backgroundFileNameChange.emit(response.filename);
            this.toastService.success('Siker', 'Háttérkép sikeresen feltöltve!');
          }
        }
      });
  }

  /**
   * Csatolmány feltöltése (ps-file-upload-ból)
   */
  onAttachmentFileChange(files: File[]): void {
    const file = files[0];
    if (!file) return;

    if (this.attachmentFileNames().length >= this.MAX_ATTACHMENTS) {
      this.toastService.error('Limit', `Maximum ${this.MAX_ATTACHMENTS} csatolmány tölthető fel!`);
      return;
    }

    const upload$ = this.uploadAttachmentFn()
      ? this.uploadAttachmentFn()!(file)
      : this.fileUploadService.uploadAttachment(file);

    upload$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataChange.emit({
              ...this.data(),
              attachmentIds: [...this.data().attachmentIds, response.fileId]
            });
            this.attachmentFileNamesChange.emit([
              ...this.attachmentFileNames(),
              response.filename
            ]);
            this.toastService.success('Siker', 'Csatolmány sikeresen feltöltve!');
          }
        }
      });
  }

  /**
   * Háttérkép törlése
   */
  removeBackgroundImage(): void {
    const fileId = this.data().backgroundImageId;
    if (!fileId) return;

    const delete$ = this.deleteFileFn()
      ? this.deleteFileFn()!(fileId)
      : this.fileUploadService.deleteFile(fileId);

    delete$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.dataChange.emit({
            ...this.data(),
            backgroundImageId: null
          });
          this.backgroundFileNameChange.emit(null);
        }
      });
  }

  /**
   * Csatolmány törlése
   */
  removeAttachment(index: number): void {
    const fileId = this.data().attachmentIds[index];
    if (!fileId) return;

    const delete$ = this.deleteFileFn()
      ? this.deleteFileFn()!(fileId)
      : this.fileUploadService.deleteFile(fileId);

    delete$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.dataChange.emit({
            ...this.data(),
            attachmentIds: this.data().attachmentIds.filter((_, i) => i !== index)
          });
          this.attachmentFileNamesChange.emit(
            this.attachmentFileNames().filter((_, i) => i !== index)
          );
        }
      });
  }
}
