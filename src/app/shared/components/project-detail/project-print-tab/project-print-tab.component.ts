import { Component, ChangeDetectionStrategy, input, output, computed, signal, ElementRef, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ProjectDetailData } from '../project-detail.types';
import { ICONS } from '../../../constants/icons.constants';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/tiff',
  'image/x-tiff',
  'image/vnd.adobe.photoshop',
  'application/x-photoshop',
  'image/jpeg',
  'image/png',
];
const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

@Component({
  selector: 'app-project-print-tab',
  standalone: true,
  imports: [LucideAngularModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="print-tab">
      <!-- Státusz idővonal -->
      <section class="timeline-section">
        <h3 class="section-title">
          <lucide-icon [name]="ICONS.CLOCK" [size]="16" />
          Státusz idővonal
        </h3>
        <div class="timeline">
          @if (project()?.inPrintAt) {
            <div class="timeline-item">
              <div class="timeline-dot timeline-dot--purple"></div>
              <div class="timeline-content">
                <span class="timeline-label">Nyomdába adva</span>
                <span class="timeline-date">{{ project()!.inPrintAt | date:'yyyy. MMM d. HH:mm':'':'hu-HU' }}</span>
              </div>
            </div>
          }
          @if (project()?.doneAt) {
            <div class="timeline-item">
              <div class="timeline-dot timeline-dot--green"></div>
              <div class="timeline-content">
                <span class="timeline-label">Kész</span>
                <span class="timeline-date">{{ project()!.doneAt | date:'yyyy. MMM d. HH:mm':'':'hu-HU' }}</span>
              </div>
            </div>
          } @else {
            <div class="timeline-item timeline-item--pending">
              <div class="timeline-dot timeline-dot--gray"></div>
              <div class="timeline-content">
                <span class="timeline-label">Kész</span>
                <span class="timeline-date timeline-date--pending">Folyamatban...</span>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Nyomdakész fájl -->
      <section class="file-section">
        <h3 class="section-title">
          <lucide-icon [name]="ICONS.FILE_CHECK" [size]="16" />
          Nyomdakész fájl
        </h3>
        @if (project()?.printReadyFile) {
          <div class="file-card">
            <div class="file-info">
              <lucide-icon [name]="fileIcon()" [size]="28" class="file-type-icon" />
              <div class="file-details">
                <span class="file-name">{{ project()!.printReadyFile!.fileName }}</span>
                <span class="file-meta">{{ formatFileSize(project()!.printReadyFile!.size) }} · Feltöltve: {{ project()!.printReadyFile!.uploadedAt | date:'yyyy. MMM d.':'':'hu-HU' }}</span>
              </div>
            </div>
            <div class="file-actions">
              <button type="button" class="download-btn" (click)="downloadClick.emit()">
                <lucide-icon [name]="ICONS.DOWNLOAD" [size]="16" />
                Letöltés
              </button>
              <button type="button" class="replace-btn" (click)="fileInput()?.nativeElement?.click()">
                <lucide-icon [name]="ICONS.UPLOAD" [size]="16" />
                Csere
              </button>
            </div>
          </div>
        } @else {
          <!-- Üres állapot — drag & drop -->
          <div
            class="drop-zone"
            [class.drop-zone--drag]="dragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput()?.nativeElement?.click()"
          >
            <lucide-icon [name]="ICONS.UPLOAD" [size]="32" class="drop-icon" />
            <p class="drop-text">Húzd ide a fájlt vagy kattints a feltöltéshez</p>
            <p class="drop-hint">PDF, TIFF, PSD, JPG, PNG — max 200 MB</p>
          </div>
        }

        <!-- Rejtett file input -->
        <input
          #fileInputRef
          type="file"
          accept=".pdf,.tiff,.tif,.psd,.jpg,.jpeg,.png"
          class="hidden-input"
          (change)="onFileSelected($event)"
        />

        @if (uploadError()) {
          <p class="upload-error">{{ uploadError() }}</p>
        }

        @if (uploading()) {
          <div class="upload-progress">
            <div class="spinner"></div>
            <span>Feltöltés folyamatban...</span>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .print-tab {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 16px;
    }

    /* Timeline */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding-left: 4px;
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      position: relative;
    }

    .timeline-item:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 7px;
      top: 30px;
      bottom: -6px;
      width: 2px;
      background: #e2e8f0;
    }

    .timeline-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .timeline-dot--purple {
      background: #8b5cf6;
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
    }

    .timeline-dot--green {
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    }

    .timeline-dot--gray {
      background: #cbd5e1;
      border: 2px dashed #94a3b8;
      box-sizing: border-box;
    }

    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .timeline-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .timeline-date {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .timeline-date--pending {
      color: #94a3b8;
      font-style: italic;
    }

    /* File Section */
    .file-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }

    .file-type-icon {
      color: #8b5cf6;
      flex-shrink: 0;
    }

    .file-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .file-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-meta {
      font-size: 0.75rem;
      color: #64748b;
    }

    .file-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #10b981;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .download-btn:hover {
      background: #059669;
    }

    .replace-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .replace-btn:hover {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }

    /* Drop zone */
    .drop-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 40px 24px;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 10px;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .drop-zone:hover {
      border-color: #94a3b8;
      background: #f1f5f9;
    }

    .drop-zone--drag {
      border-color: #8b5cf6;
      background: rgba(139, 92, 246, 0.05);
    }

    .drop-icon {
      color: #94a3b8;
    }

    .drop-zone--drag .drop-icon {
      color: #8b5cf6;
    }

    .drop-text {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: #475569;
    }

    .drop-hint {
      margin: 0;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .hidden-input {
      display: none;
    }

    .upload-error {
      margin: 8px 0 0;
      font-size: 0.8125rem;
      color: #ef4444;
    }

    .upload-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e2e8f0;
      border-top-color: #8b5cf6;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .file-card {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .file-actions {
        justify-content: stretch;
      }

      .download-btn,
      .replace-btn {
        flex: 1;
        justify-content: center;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
      }
    }
  `],
})
export class ProjectPrintTabComponent {
  readonly ICONS = ICONS;

  readonly project = input<ProjectDetailData | null>(null);
  readonly downloadClick = output<void>();
  readonly uploadFile = output<File>();

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInputRef');

  readonly dragging = signal(false);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  readonly fileIcon = computed(() => {
    const mime = this.project()?.printReadyFile?.mimeType ?? '';
    if (mime.includes('pdf')) return ICONS.FILE_TEXT;
    if (mime.includes('image')) return ICONS.IMAGE;
    return ICONS.FILE_CHECK;
  });

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  private processFile(file: File): void {
    this.uploadError.set(null);

    if (!ALLOWED_TYPES.includes(file.type) && !this.hasAllowedExtension(file.name)) {
      this.uploadError.set('Nem támogatott fájlformátum. Engedélyezett: PDF, TIFF, PSD, JPG, PNG.');
      return;
    }

    if (file.size > MAX_SIZE) {
      this.uploadError.set('A fájl túl nagy. Maximum 200 MB engedélyezett.');
      return;
    }

    this.uploadFile.emit(file);
  }

  private hasAllowedExtension(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return ['pdf', 'tiff', 'tif', 'psd', 'jpg', 'jpeg', 'png'].includes(ext);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
