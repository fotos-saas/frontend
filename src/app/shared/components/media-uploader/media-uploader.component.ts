import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatFileSize } from '@shared/utils/formatters.util';

/**
 * Feltöltendő kép előnézet
 */
export interface MediaPreview {
  file: File;
  previewUrl: string;
  name: string;
  size: string;
}

/**
 * Media Uploader Component
 *
 * Képfeltöltő komponens a fórumhoz.
 * - Max 3 kép, max 5MB/kép
 * - Drag & drop támogatás
 * - Előnézet
 */
@Component({
  selector: 'app-media-uploader',
  imports: [CommonModule],
  templateUrl: './media-uploader.component.html',
  styleUrls: ['./media-uploader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaUploaderComponent {
  /** Signal-based inputs */
  readonly disabled = input<boolean>(false);
  readonly maxFiles = input<number>(5);
  readonly maxSizeMB = input<number>(10);

  /** Signal-based outputs */
  readonly filesChangeEvent = output<File[]>();
  readonly uploadErrorEvent = output<string>();

  /** Maximum fájlméret (bytes) - computed from maxSizeMB */
  readonly maxFileSize = computed(() => this.maxSizeMB() * 1024 * 1024);

  /** Kiválasztott fájlok */
  private selectedFiles = signal<MediaPreview[]>([]);

  /** Drag állapot */
  readonly isDragging = signal<boolean>(false);

  /** Előnézetek */
  readonly previews = computed(() => this.selectedFiles());

  /** Van-e hely még fájlnak */
  readonly canAddMore = computed(() => this.selectedFiles().length < this.maxFiles());

  /** Engedélyezett MIME típusok */
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Fájl kiválasztás input-ból
   */
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
    // Reset input (hogy ugyanazt a fájlt újra lehessen választani)
    input.value = '';
  }

  /**
   * Drag over kezelés
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled()) {
      this.isDragging.set(true);
    }
  }

  /**
   * Drag leave kezelés
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  /**
   * Drop kezelés
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (this.disabled()) return;

    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  /**
   * Fájl eltávolítása
   */
  removeFile(index: number): void {
    const current = this.selectedFiles();
    const toRemove = current[index];

    // Előnézet URL felszabadítása
    if (toRemove) {
      URL.revokeObjectURL(toRemove.previewUrl);
    }

    const updated = current.filter((_, i) => i !== index);
    this.selectedFiles.set(updated);
    this.emitFiles();
  }

  /**
   * Összes fájl törlése
   */
  clearAll(): void {
    const current = this.selectedFiles();
    current.forEach(preview => URL.revokeObjectURL(preview.previewUrl));
    this.selectedFiles.set([]);
    this.emitFiles();
  }

  /**
   * Fájlok hozzáadása
   */
  private addFiles(files: File[]): void {
    const current = this.selectedFiles();
    const max = this.maxFiles();
    const remainingSlots = max - current.length;

    if (remainingSlots <= 0) {
      this.uploadErrorEvent.emit(`Maximum ${max} kép tölthető fel.`);
      return;
    }

    // Szűrés és validálás
    const validFiles: MediaPreview[] = [];
    const maxSize = this.maxFileSize();

    for (const file of files.slice(0, remainingSlots)) {
      // Típus ellenőrzés
      if (!this.allowedTypes.includes(file.type)) {
        this.uploadErrorEvent.emit(`"${file.name}" nem támogatott formátum. Használj JPG, PNG, GIF vagy WebP képeket.`);
        continue;
      }

      // Méret ellenőrzés
      if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        this.uploadErrorEvent.emit(`"${file.name}" túl nagy. Maximum ${maxMB}MB engedélyezett.`);
        continue;
      }

      validFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: this.formatFileSize(file.size)
      });
    }

    if (validFiles.length > 0) {
      this.selectedFiles.set([...current, ...validFiles]);
      this.emitFiles();
    }
  }

  /**
   * Fájlok emit-elése
   */
  private emitFiles(): void {
    const files = this.selectedFiles().map(p => p.file);
    this.filesChangeEvent.emit(files);
  }

  /**
   * Fájlméret formázása
   */
  private formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }
}
