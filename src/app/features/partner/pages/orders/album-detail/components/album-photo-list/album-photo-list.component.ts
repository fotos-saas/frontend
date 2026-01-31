import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { AlbumPhoto, AlbumStatus } from '../../../../../services/partner-orders.service';

/**
 * Album Photo List Component
 *
 * Lista nézet a fotókhoz: szűrők, keresés, pagináció, törlés, export.
 */
@Component({
  selector: 'app-album-photo-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule, MatTooltipModule],
  template: `
    <div class="photo-list">
      <!-- Filter bar -->
      <div class="photo-list__filters">
        <select
          [ngModel]="filter()"
          (ngModelChange)="filterChange.emit($event)"
          class="photo-list__select"
        >
          <option value="all">Összes kép ({{ totalCount() }})</option>
          <option value="selected">Kiválasztottak ({{ selectedCount() }})</option>
          <option value="unselected">Nem kiválasztottak ({{ totalCount() - selectedCount() }})</option>
        </select>
        <div class="photo-list__search">
          <lucide-icon [name]="ICONS.SEARCH" [size]="16" />
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchChange.emit($event)"
            placeholder="Keresés névre vagy fájlnévre..."
            class="photo-list__search-input"
          />
        </div>
      </div>

      <!-- Action bar -->
      <div class="photo-list__actions">
        <button
          (click)="downloadZip.emit()"
          [disabled]="selectedCount() === 0 || downloading()"
          class="photo-list__action-btn"
        >
          @if (downloading()) {
            <div class="spinner"></div>
          } @else {
            <lucide-icon [name]="ICONS.DOWNLOAD" [size]="16" />
          }
          Kiválasztottak letöltése (ZIP)
        </button>
        <button
          (click)="exportExcel.emit()"
          [disabled]="exporting()"
          class="photo-list__action-btn photo-list__action-btn--secondary"
        >
          @if (exporting()) {
            <div class="spinner spinner--dark"></div>
          } @else {
            <lucide-icon [name]="ICONS.FILE_SPREADSHEET" [size]="16" />
          }
          Excel export
        </button>
      </div>

      <!-- Photo list items -->
      <div class="photo-list__items">
        @for (photo of photos(); track photo.id; let i = $index) {
          <div
            class="photo-list__item"
            [class.photo-list__item--selected]="isSelected(photo.id)"
            [class.photo-list__item--delete-selected]="isDeleteSelected(photo.id)"
            [style.animation-delay]="i * 0.03 + 's'"
            (click)="onItemClick(photo, $event)"
          >
            <img
              [src]="photo.thumb_url"
              [alt]="photo.name"
              class="photo-list__thumb"
              loading="lazy"
              (click)="onThumbClick(photo); $event.stopPropagation()"
            />
            <div class="photo-list__info">
              <span class="photo-list__title">{{ photo.title || getFilenameWithoutExt(photo.name) }}</span>
              @if (photo.title && photo.title !== getFilenameWithoutExt(photo.name)) {
                <span class="photo-list__filename">{{ getFilenameWithoutExt(photo.name) }}</span>
              }
            </div>
            @if (isSelected(photo.id)) {
              <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="20" class="photo-list__check" />
            }

            @if (albumStatus() !== 'completed') {
              @if (isDeleteSelected(photo.id)) {
                <lucide-icon [name]="ICONS.CHECK" [size]="20" class="photo-list__delete-check" />
              } @else {
                <button
                  class="photo-list__delete-btn"
                  matTooltip="Törlés"
                  (click)="onDeleteClick(photo); $event.stopPropagation()"
                >
                  <lucide-icon [name]="ICONS.DELETE" [size]="16" />
                </button>
              }
            }
          </div>
        } @empty {
          <div class="photo-list__empty">
            <lucide-icon [name]="ICONS.SEARCH" [size]="32" />
            <p>Nincs találat a szűrési feltételeknek megfelelően</p>
          </div>
        }
      </div>

      <!-- Paginator -->
      @if (totalPages() > 1) {
        <div class="pagination">
          <button
            class="page-btn"
            [disabled]="currentPage() === 1"
            (click)="pageChange.emit(currentPage() - 1)"
          >
            <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="16" />
            Előző
          </button>

          <div class="page-info">
            {{ currentPage() }} / {{ totalPages() }} oldal
            <span class="total-count">({{ filteredCount() }} kép)</span>
          </div>

          <button
            class="page-btn"
            [disabled]="currentPage() === totalPages()"
            (click)="pageChange.emit(currentPage() + 1)"
          >
            Következő
            <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes listItemEntry {
      from { opacity: 0; transform: translateX(-8px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .photo-list {
      animation: fadeIn 0.2s ease;
    }

    .photo-list__filters {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .photo-list__select {
      padding: 8px 12px;
      font-size: 0.875rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      color: #1e293b;
      cursor: pointer;
      min-width: 200px;
    }

    .photo-list__select:focus {
      outline: none;
      border-color: var(--color-primary, #3b82f6);
    }

    :host-context(.dark) .photo-list__select {
      background: #1f2937;
      border-color: #4b5563;
      color: #f8fafc;
    }

    .photo-list__search {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      min-width: 200px;
    }

    :host-context(.dark) .photo-list__search {
      background: #1f2937;
      border-color: #4b5563;
    }

    .photo-list__search lucide-icon {
      color: #94a3b8;
    }

    .photo-list__search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 0.875rem;
      color: #1e293b;
      outline: none;
    }

    :host-context(.dark) .photo-list__search-input {
      color: #f8fafc;
    }

    .photo-list__search-input::placeholder {
      color: #94a3b8;
    }

    .photo-list__actions {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .photo-list__action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      font-size: 0.875rem;
      font-weight: 500;
      background: var(--color-primary, #1e3a5f);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .photo-list__action-btn:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .photo-list__action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .photo-list__action-btn--secondary {
      background: white;
      color: var(--color-primary, #1e3a5f);
      border: 1px solid #e2e8f0;
    }

    .photo-list__action-btn--secondary:hover:not(:disabled) {
      background: #f8fafc;
      border-color: var(--color-primary, #1e3a5f);
    }

    :host-context(.dark) .photo-list__action-btn--secondary {
      background: #1f2937;
      border-color: #4b5563;
      color: #60a5fa;
    }

    :host-context(.dark) .photo-list__action-btn--secondary:hover:not(:disabled) {
      background: #374151;
    }

    .photo-list__items {
      display: flex;
      flex-direction: column;
      gap: 4px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
    }

    :host-context(.dark) .photo-list__items {
      background: #1f2937;
      border-color: #334155;
    }

    .photo-list__item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      transition: all 0.15s ease;
      animation: listItemEntry 0.2s ease forwards;
      opacity: 0;
    }

    .photo-list__item:hover {
      background: #f8fafc;
    }

    :host-context(.dark) .photo-list__item:hover {
      background: #334155;
    }

    .photo-list__item--selected {
      background: #eff6ff;
    }

    :host-context(.dark) .photo-list__item--selected {
      background: rgba(59, 130, 246, 0.15);
    }

    .photo-list__item--selected:hover {
      background: #dbeafe;
    }

    :host-context(.dark) .photo-list__item--selected:hover {
      background: rgba(59, 130, 246, 0.25);
    }

    .photo-list__item--delete-selected {
      background: #fef2f2;
      border-left: 3px solid #dc2626;
    }

    :host-context(.dark) .photo-list__item--delete-selected {
      background: rgba(220, 38, 38, 0.1);
      border-left-color: #f87171;
    }

    .photo-list__thumb {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 6px;
      background: #f1f5f9;
      flex-shrink: 0;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }

    .photo-list__thumb:hover {
      opacity: 0.8;
    }

    :host-context(.dark) .photo-list__thumb {
      background: #374151;
    }

    .photo-list__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .photo-list__title {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :host-context(.dark) .photo-list__title {
      color: #f8fafc;
    }

    .photo-list__filename {
      font-size: 0.75rem;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :host-context(.dark) .photo-list__filename {
      color: #94a3b8;
    }

    .photo-list__check {
      color: #16a34a;
      flex-shrink: 0;
    }

    .photo-list__delete-check {
      color: #dc2626;
      flex-shrink: 0;
    }

    :host-context(.dark) .photo-list__delete-check {
      color: #f87171;
    }

    .photo-list__delete-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 6px;
      color: #94a3b8;
      cursor: pointer;
      opacity: 0;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .photo-list__item:hover .photo-list__delete-btn {
      opacity: 1;
    }

    .photo-list__delete-btn:hover {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }

    :host-context(.dark) .photo-list__delete-btn:hover {
      background: rgba(220, 38, 38, 0.15);
      border-color: rgba(220, 38, 38, 0.3);
      color: #f87171;
    }

    .photo-list__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 24px;
      color: #94a3b8;
      text-align: center;
    }

    .photo-list__empty p {
      margin: 0;
      font-size: 0.875rem;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 16px;
      padding: 12px;
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 0.875rem;
      font-weight: 500;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .page-btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: var(--color-primary, #1e3a5f);
      color: var(--color-primary, #1e3a5f);
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    :host-context(.dark) .page-btn {
      background: #1f2937;
      border-color: #4b5563;
      color: #94a3b8;
    }

    :host-context(.dark) .page-btn:hover:not(:disabled) {
      background: #374151;
      color: #60a5fa;
    }

    .page-info {
      font-size: 0.875rem;
      color: #64748b;
    }

    :host-context(.dark) .page-info {
      color: #94a3b8;
    }

    .total-count {
      margin-left: 4px;
      color: #94a3b8;
    }

    :host-context(.dark) .total-count {
      color: #64748b;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner--dark {
      border-color: rgba(255, 255, 255, 0.3);
      border-top-color: white;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AlbumPhotoListComponent {
  readonly ICONS = ICONS;

  // Inputs (Signal-based)
  readonly photos = input.required<AlbumPhoto[]>();
  readonly selectedIds = input<number[]>([]);
  readonly deleteSelectedIds = input<number[]>([]);
  readonly filter = input<'all' | 'selected' | 'unselected'>('all');
  readonly searchQuery = input<string>('');
  readonly currentPage = input<number>(1);
  readonly totalPages = input<number>(1);
  readonly filteredCount = input<number>(0);
  readonly totalCount = input<number>(0);
  readonly selectedCount = input<number>(0);
  readonly downloading = input<boolean>(false);
  readonly exporting = input<boolean>(false);
  readonly albumStatus = input<AlbumStatus>('draft');

  // Outputs
  readonly filterChange = output<'all' | 'selected' | 'unselected'>();
  readonly searchChange = output<string>();
  readonly pageChange = output<number>();
  readonly zoomClick = output<AlbumPhoto>();
  readonly deleteClick = output<AlbumPhoto>();
  readonly listItemClick = output<{ photo: AlbumPhoto; event: MouseEvent }>();
  readonly downloadZip = output<void>();
  readonly exportExcel = output<void>();

  isSelected(photoId: number): boolean {
    return this.selectedIds().includes(photoId);
  }

  isDeleteSelected(photoId: number): boolean {
    return this.deleteSelectedIds().includes(photoId);
  }

  getFilenameWithoutExt(filename: string): string {
    return filename.replace(/\.[^/.]+$/, '');
  }

  onThumbClick(photo: AlbumPhoto): void {
    this.zoomClick.emit(photo);
  }

  onDeleteClick(photo: AlbumPhoto): void {
    this.deleteClick.emit(photo);
  }

  onItemClick(photo: AlbumPhoto, event: MouseEvent): void {
    this.listItemClick.emit({ photo, event });
  }
}
