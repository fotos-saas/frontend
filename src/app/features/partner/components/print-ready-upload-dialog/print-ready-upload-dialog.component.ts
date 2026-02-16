import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, DestroyRef, ElementRef, viewChild, linkedSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PsSelectComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { PartnerFinalizationService, PrintFileType } from '../../services/partner-finalization.service';
import { PrintReadyFile, TabloSize } from '../../models/partner.models';
import { ICONS } from '../../../../shared/constants/icons.constants';

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_TYPES = ['application/pdf', 'image/tiff', 'image/jpeg', 'image/png', 'image/vnd.adobe.photoshop'];
const ALLOWED_EXTENSIONS = ['.pdf', '.tiff', '.tif', '.psd', '.jpg', '.jpeg', '.png'];

@Component({
  selector: 'app-print-ready-upload-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent, PsSelectComponent],
  templateUrl: './print-ready-upload-dialog.component.html',
  styleUrl: './print-ready-upload-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintReadyUploadDialogComponent {
  readonly ICONS = ICONS;
  private readonly finalizationService = inject(PartnerFinalizationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = input.required<number>();
  readonly projectName = input.required<string>();
  readonly fileType = input.required<PrintFileType>();
  readonly currentTabloSize = input<string | null>(null);
  readonly availableSizes = input<TabloSize[]>([]);

  readonly close = output<void>();
  readonly uploaded = output<PrintReadyFile>();
  readonly tabloSizeChanged = output<{ projectId: number; size: string }>();

  readonly sizeOptions = computed<PsSelectOption[]>(() =>
    this.availableSizes().map(s => ({ id: s.value, label: s.label }))
  );

  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  selectedFile = signal<File | null>(null);
  tabloSize = linkedSignal(() => this.currentTabloSize() ?? '');
  isDragging = signal(false);
  isUploading = signal(false);
  errorMessage = signal('');
  uploadProgress = signal(0);

  readonly acceptExtensions = ALLOWED_EXTENSIONS.join(',');

  readonly initialTabloSize = computed(() => this.currentTabloSize() ?? '');

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  openFileDialog(): void {
    this.fileInput()?.nativeElement.click();
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.errorMessage.set('');
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
  }

  onSubmit(): void {
    const file = this.selectedFile();
    if (!file || this.isUploading()) return;

    this.isUploading.set(true);
    this.errorMessage.set('');

    const newSize = this.tabloSize().trim();

    this.finalizationService.uploadPrintReady(
      this.projectId(),
      file,
      this.fileType(),
      newSize || undefined,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isUploading.set(false);
          if (newSize !== this.initialTabloSize()) {
            this.tabloSizeChanged.emit({ projectId: this.projectId(), size: newSize });
          }
          this.uploaded.emit(response.data);
          this.close.emit();
        },
        error: (err) => {
          this.isUploading.set(false);
          this.errorMessage.set(err.error?.message ?? 'Hiba a feltöltés során.');
        },
      });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  private validateAndSetFile(file: File): void {
    this.errorMessage.set('');

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);

    if (!isValidType) {
      this.errorMessage.set('Csak PDF, TIFF, PSD, JPG és PNG fájlok engedélyezettek.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.errorMessage.set('A fájl mérete nem haladhatja meg a 200 MB-ot.');
      return;
    }

    this.selectedFile.set(file);
  }
}
