import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../constants/icons.constants';

/**
 * Közös Drop Zone komponens fájlfeltöltéshez.
 *
 * Használat:
 * ```html
 * <app-drop-zone
 *   [uploading]="uploading()"
 *   [uploadProgress]="uploadProgress()?.progress || 0"
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

  /** Feltöltési folyamat százalékban (0-100) */
  readonly uploadProgress = input<number>(0);

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
