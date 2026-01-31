import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectionStrategy,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="drop-zone"
      [class.drop-zone--active]="isDragging()"
      [class.drop-zone--uploading]="uploading"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input
        #fileInput
        type="file"
        multiple
        [accept]="accept"
        (change)="onFileInputChange($event)"
        class="hidden"
      />

      @if (uploading) {
        <div class="upload-progress">
          <div class="progress-spinner"></div>
          <span class="progress-text">Feltöltés folyamatban...</span>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="uploadProgress"></div>
          </div>
        </div>
      } @else {
        <div class="drop-content">
          <div class="drop-icon" [class.drop-icon--active]="isDragging()">
            <lucide-icon [name]="ICONS.UPLOAD" [size]="32" />
          </div>
          <h3>Húzd ide a képeket vagy kattints!</h3>
          <p>{{ hint }} ({{ maxSize }})</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .drop-zone {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #fafafa;
    }

    .drop-zone:hover {
      border-color: var(--color-primary, #1e3a5f);
      background: #f8fafc;
    }

    .drop-zone--active {
      border-color: var(--color-primary, #1e3a5f);
      background: rgba(30, 58, 95, 0.05);
      border-style: solid;
    }

    .drop-zone--uploading {
      cursor: default;
    }

    .hidden {
      display: none;
    }

    .drop-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .drop-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e2e8f0;
      border-radius: 50%;
      color: #64748b;
      transition: all 0.2s ease;
    }

    .drop-icon--active,
    .drop-zone:hover .drop-icon {
      background: var(--color-primary, #1e3a5f);
      color: #ffffff;
      transform: scale(1.1);
    }

    .drop-content h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .drop-content p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    /* Dark mode */
    :host-context(.dark) .drop-zone {
      background: rgba(30, 41, 59, 0.5);
      border-color: #475569;
    }

    :host-context(.dark) .drop-zone:hover {
      background: rgba(30, 58, 95, 0.2);
    }

    :host-context(.dark) .drop-content h3 {
      color: #f1f5f9;
    }

    :host-context(.dark) .drop-icon {
      background: #475569;
      color: #94a3b8;
    }

    /* Upload Progress */
    .upload-progress {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .progress-spinner {
      width: 48px;
      height: 48px;
      border: 3px solid #e2e8f0;
      border-top-color: var(--color-primary, #1e3a5f);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .progress-text {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #1e293b;
    }

    :host-context(.dark) .progress-text {
      color: #f1f5f9;
    }

    .progress-bar {
      width: 200px;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }

    :host-context(.dark) .progress-bar {
      background: #475569;
    }

    .progress-fill {
      height: 100%;
      background: var(--color-primary, #1e3a5f);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropZoneComponent {
  readonly ICONS = ICONS;

  /** Feltöltés folyamatban van-e */
  @Input() uploading = false;

  /** Feltöltési folyamat százalékban (0-100) */
  @Input() uploadProgress = 0;

  /** Elfogadott fájltípusok (file input accept attribútum) */
  @Input() accept = '.jpg,.jpeg,.png,.webp';

  /** Maximum méret szövege (pl. "20MB/kép") */
  @Input() maxSize = '20MB/kép';

  /** Hint szöveg a formátumokhoz (pl. "JPG, PNG vagy WebP") */
  @Input() hint = 'JPG, PNG vagy WebP';

  /** Fájlok kiválasztásakor hívódik */
  @Output() filesSelected = new EventEmitter<File[]>();

  isDragging = signal(false);

  @HostListener('window:dragover', ['$event'])
  onWindowDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  @HostListener('window:drop', ['$event'])
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

    if (this.uploading) return;

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
    const validExtensions = this.accept
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
