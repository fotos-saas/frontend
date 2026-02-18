import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../constants/icons.constants';
import type { FileUploadProgress } from '../../../core/models/upload-progress.models';

/**
 * Közös Drop Zone komponens fájlfeltöltéshez.
 *
 * Használat:
 * ```html
 * <app-drop-zone
 *   [uploading]="uploading()"
 *   [detailedProgress]="detailedProgress()"
 *   accept=".jpg,.jpeg,.png,.webp,.zip"
 *   hint="JPG, PNG, WebP vagy ZIP"
 *   maxSize="max. 50 kép"
 *   (filesSelected)="onFilesSelected($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-drop-zone',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './drop-zone.component.html',
  styleUrls: ['./drop-zone.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:dragover)': 'onWindowDragOver($event)',
    '(window:drop)': 'onWindowDrop($event)',
  }
})
export class DropZoneComponent {
  readonly ICONS = ICONS;

  /** Feltöltés folyamatban van-e */
  readonly uploading = input<boolean>(false);

  /** Részletes feltöltési állapot (új, UploadProgressService-ből) */
  readonly detailedProgress = input<FileUploadProgress | null>(null);

  /** Feltöltési folyamat százalékban (0-100) - backward compat */
  readonly uploadProgress = input<number>(0);

  /** Összesített progress: detailedProgress vagy uploadProgress */
  readonly displayProgress = computed(() =>
    this.detailedProgress()?.overallProgress ?? this.uploadProgress()
  );

  /** Fázis szöveg a UI-hoz */
  readonly phaseText = computed(() => {
    const d = this.detailedProgress();
    if (!d) return 'Feltöltés folyamatban...';
    if (d.phase === 'uploading') {
      if (d.totalChunks > 1) {
        return `Feltöltés... ${d.currentChunk}/${d.totalChunks} csomag`;
      }
      return 'Feltöltés folyamatban...';
    }
    if (d.phase === 'processing') return `ZIP feldolgozás... ${d.uploadedCount}/${d.totalCount} kép`;
    if (d.phase === 'completed') return 'Kész!';
    return d.errorMessage ?? 'Hiba történt';
  });

  /** Részletes info szöveg a progress bar alatt */
  readonly detailText = computed(() => {
    const d = this.detailedProgress();
    if (!d || d.phase === 'completed') return '';
    const parts: string[] = [];
    if (d.uploadedCount > 0 || d.totalCount > 0) {
      parts.push(`${d.uploadedCount}/${d.totalCount} kép`);
    }
    parts.push(`${this.displayProgress()}%`);
    if (d.errorCount > 0) {
      parts.push(`(${d.errorCount} hiba)`);
    }
    return parts.join(' · ');
  });

  /** Elfogadott fájltípusok (file input accept attribútum) */
  readonly accept = input<string>('.jpg,.jpeg,.png,.webp');

  /** Maximum méret szövege (pl. "20MB/kép") */
  readonly maxSize = input<string>('20MB/kép');

  /** Hint szöveg a formátumokhoz (pl. "JPG, PNG vagy WebP") */
  readonly hint = input<string>('JPG, PNG vagy WebP');

  /** Fájlok kiválasztásakor hívódik */
  readonly filesSelected = output<File[]>();

  isDragging = signal(false);

  onWindowDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onWindowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (this.uploading()) return;

    const files = this.getFilesFromDataTransfer(event.dataTransfer);
    if (files.length > 0) {
      this.filesSelected.emit(files);
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      this.filesSelected.emit(files);
      input.value = ''; // Reset for re-selection
    }
  }

  private getFilesFromDataTransfer(dataTransfer: DataTransfer | null): File[] {
    if (!dataTransfer) return [];

    const files: File[] = [];
    // Extract valid extensions from accept input
    const validExtensions = this.accept()
      .split(',')
      .map(ext => ext.trim().replace('.', '').toLowerCase());

    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension && validExtensions.includes(extension)) {
        files.push(file);
      }
    }

    return files;
  }
}
