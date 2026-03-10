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
import { UploadQueueService } from '../../../../../shared/services/upload-queue.service';

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
  private readonly uploadQueue = inject(UploadQueueService);

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

  /** Projekt ID a queue-hoz (ha van, queue-t használ) */
  projectId = input<number | null>(null);

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
   * Háttérkép feltöltése — queue-ba kerül ha van projectId
   */
  onBackgroundFileChange(files: File[]): void {
    const file = files[0];
    if (!file) return;

    const uploadFn = this.uploadBackgroundFn()
      ? this.uploadBackgroundFn()!
      : (f: File) => this.fileUploadService.uploadBackgroundImage(f);

    const pid = this.projectId();
    if (pid) {
      this.uploadQueue.enqueue({
        file,
        projectId: pid,
        type: 'background',
        uploadFn,
        onSuccess: (response) => {
          if (response.success) {
            this.dataChange.emit({ ...this.data(), backgroundImageId: response.fileId });
            this.backgroundFileNameChange.emit(response.filename);
            this.toastService.success('Siker', 'Háttérkép sikeresen feltöltve!');
          }
        },
      });
    } else {
      // Fallback: közvetlen feltöltés (nincs projectId)
      uploadFn(file)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.dataChange.emit({ ...this.data(), backgroundImageId: response.fileId });
              this.backgroundFileNameChange.emit(response.filename);
              this.toastService.success('Siker', 'Háttérkép sikeresen feltöltve!');
            }
          }
        });
    }
  }

  /**
   * Csatolmány feltöltése — queue-ba kerül ha van projectId
   */
  onAttachmentFileChange(files: File[]): void {
    if (!files.length) return;

    const remaining = this.MAX_ATTACHMENTS - this.attachmentFileNames().length;
    if (remaining <= 0) {
      this.toastService.error('Limit', `Maximum ${this.MAX_ATTACHMENTS} csatolmány tölthető fel!`);
      return;
    }

    const filesToUpload = files.slice(0, remaining);
    if (filesToUpload.length < files.length) {
      this.toastService.warning('Figyelem', `Csak ${remaining} csatolmány fér még, ${files.length - filesToUpload.length} fájl kihagyva.`);
    }

    const uploadFn = this.uploadAttachmentFn()
      ? this.uploadAttachmentFn()!
      : (f: File) => this.fileUploadService.uploadAttachment(f);

    const pid = this.projectId();

    for (const file of filesToUpload) {
      if (pid) {
        this.uploadQueue.enqueue({
          file,
          projectId: pid,
          type: 'attachment',
          uploadFn,
          onSuccess: (response) => {
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
          },
        });
      } else {
        uploadFn(file)
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
    }
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
