import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
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
  imports: [FormsModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './album-photo-list.component.html',
  styleUrls: ['./album-photo-list.component.scss']
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
