import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ProjectDetailData } from '../project-detail.types';
import { ICONS } from '../../../constants/icons.constants';

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
            <button
              type="button"
              class="download-btn"
              (click)="downloadClick.emit()"
            >
              <lucide-icon [name]="ICONS.DOWNLOAD" [size]="16" />
              Letöltés
            </button>
          </div>
        } @else {
          <div class="empty-file">
            <lucide-icon [name]="ICONS.FILE" [size]="32" class="empty-icon" />
            <p>Még nincs nyomdakész fájl feltöltve.</p>
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
      flex-shrink: 0;
    }

    .download-btn:hover {
      background: #059669;
    }

    .empty-file {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      text-align: center;
    }

    .empty-icon {
      color: #94a3b8;
    }

    .empty-file p {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    @media (max-width: 480px) {
      .file-card {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .download-btn {
        justify-content: center;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition-duration: 0.01ms !important;
      }
    }
  `],
})
export class ProjectPrintTabComponent {
  readonly ICONS = ICONS;

  readonly project = input<ProjectDetailData | null>(null);
  readonly downloadClick = output<void>();

  readonly fileIcon = computed(() => {
    const mime = this.project()?.printReadyFile?.mimeType ?? '';
    if (mime.includes('pdf')) return ICONS.FILE_TEXT;
    if (mime.includes('image')) return ICONS.IMAGE;
    return ICONS.FILE_CHECK;
  });

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
