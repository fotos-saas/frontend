import { SlicePipe } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { UploadedPhoto } from '../../../services/partner.service';
import { DropZoneComponent } from '../../../../../shared/components/drop-zone/drop-zone.component';

/**
 * Step Upload - Drag & drop fájlfeltöltés + ZIP támogatás.
 * Használja a közös DropZoneComponent-et.
 */
@Component({
  selector: 'app-step-upload',
  standalone: true,
  imports: [LucideAngularModule, DropZoneComponent, SlicePipe],
  template: `
    <div class="step-upload">
      <!-- Drop Zone - csak ha nincs még kép VAGY ha showDropZone aktív -->
      @if (showDropZone() || uploadedPhotos.length === 0) {
        <app-drop-zone
          [uploading]="uploading"
          [uploadProgress]="uploadProgress"
          accept=".jpg,.jpeg,.png,.webp,.zip"
          hint="JPG, PNG, WebP vagy ZIP fájl"
          maxSize="max. 50 kép"
          (filesSelected)="onFilesSelected($event)"
        />
      }

      <!-- Uploaded Photos Grid -->
      @if (uploadedPhotos.length > 0) {
        <div class="uploaded-section">
          <div class="section-header">
            <h4>Feltöltött képek ({{ uploadedPhotos.length }})</h4>
            @if (!uploading) {
              <div class="header-actions">
                <button class="delete-all-btn" (click)="removeAllPhotos.emit()">
                  <lucide-icon [name]="ICONS.DELETE" [size]="14" />
                  Mind törlése
                </button>
                <button class="add-more-btn" (click)="toggleDropZone()">
                  <lucide-icon [name]="showDropZone() ? ICONS.CHEVRON_UP : ICONS.PLUS" [size]="14" />
                  {{ showDropZone() ? 'Elrejt' : 'További képek' }}
                </button>
              </div>
            }
          </div>

          <div class="photos-grid">
            @for (photo of uploadedPhotos; track photo.mediaId; let i = $index) {
              <div
                class="photo-card"
                [style.animation-delay]="i * 0.03 + 's'"
              >
                <img
                  [src]="photo.thumbUrl"
                  [alt]="photo.filename"
                  loading="lazy"
                />
                <div class="photo-overlay">
                  <button
                    class="remove-btn"
                    (click)="removePhoto.emit(photo.mediaId); $event.stopPropagation()"
                    title="Eltávolítás"
                  >
                    <lucide-icon [name]="ICONS.X" [size]="14" />
                  </button>
                </div>
                <div class="photo-info">
                  <span class="photo-name" [title]="photo.filename">
                    {{ photo.filename | slice:0:20 }}{{ photo.filename.length > 20 ? '...' : '' }}
                  </span>
                  @if (photo.iptcTitle) {
                    <span class="iptc-badge" title="IPTC név: {{ photo.iptcTitle }}">
                      <lucide-icon [name]="ICONS.USER" [size]="10" />
                      {{ photo.iptcTitle }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Empty State Info -->
      @if (uploadedPhotos.length === 0 && !uploading) {
        <div class="info-cards">
          <div class="info-card">
            <lucide-icon [name]="ICONS.IMAGE" [size]="20" class="info-icon" />
            <div class="info-content">
              <strong>Képformátumok</strong>
              <span>JPG, PNG, WebP</span>
            </div>
          </div>
          <div class="info-card">
            <lucide-icon [name]="ICONS.FOLDER" [size]="20" class="info-icon" />
            <div class="info-content">
              <strong>ZIP feltöltés</strong>
              <span>Több kép egyszerre</span>
            </div>
          </div>
          <div class="info-card">
            <lucide-icon [name]="ICONS.USER" [size]="20" class="info-icon" />
            <div class="info-content">
              <strong>IPTC metaadat</strong>
              <span>Automatikus névfelismerés</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .step-upload {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Uploaded Section */
    .uploaded-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-header h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .delete-all-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #dc2626;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .delete-all-btn:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #b91c1c;
    }

    .add-more-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .add-more-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    /* Photos Grid */
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }

    .photo-card {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      background: #f1f5f9;
      animation: fadeIn 0.3s ease forwards;
      opacity: 0;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .photo-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .photo-card:hover .photo-overlay {
      opacity: 1;
    }

    .remove-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      border: none;
      border-radius: 50%;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .remove-btn:hover {
      background: #ef4444;
      transform: scale(1.1);
    }

    .photo-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24px 6px 6px;
      background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .photo-name {
      font-size: 0.6875rem;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .iptc-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 5px;
      background: rgba(16, 185, 129, 0.8);
      border-radius: 4px;
      font-size: 0.5625rem;
      font-weight: 500;
      color: #ffffff;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Info Cards */
    .info-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .info-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }

    .info-icon {
      color: var(--color-primary, #1e3a5f);
      flex-shrink: 0;
    }

    .info-content {
      display: flex;
      flex-direction: column;
    }

    .info-content strong {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .info-content span {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .info-cards {
        grid-template-columns: 1fr;
      }

      .photos-grid {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      }
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
export class StepUploadComponent {
  readonly ICONS = ICONS;

  @Input() uploadedPhotos: UploadedPhoto[] = [];
  @Input() uploading = false;
  @Input() uploadProgress = 0;

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() removePhoto = new EventEmitter<number>();
  @Output() removeAllPhotos = new EventEmitter<void>();
  @Output() continueToMatching = new EventEmitter<void>();

  showDropZone = signal(true);

  onFilesSelected(files: File[]): void {
    this.filesSelected.emit(files);
    this.showDropZone.set(false); // Elrejtjük a drop zone-t feltöltés után
  }

  toggleDropZone(): void {
    this.showDropZone.update(v => !v);
  }
}
