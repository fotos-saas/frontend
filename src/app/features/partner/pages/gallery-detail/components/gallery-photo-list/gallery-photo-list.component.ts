import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { GalleryPhoto } from '../../../../models/gallery.models';

@Component({
  selector: 'app-gallery-photo-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './gallery-photo-list.component.html',
  styleUrl: './gallery-photo-list.component.scss',
})
export class GalleryPhotoListComponent {
  readonly ICONS = ICONS;

  readonly photos = input.required<GalleryPhoto[]>();
  readonly deleteSelectedIds = input<number[]>([]);
  readonly searchQuery = input<string>('');
  readonly currentPage = input<number>(1);
  readonly totalPages = input<number>(1);
  readonly filteredCount = input<number>(0);
  readonly totalCount = input<number>(0);

  readonly searchChange = output<string>();
  readonly pageChange = output<number>();
  readonly zoomClick = output<GalleryPhoto>();
  readonly deleteClick = output<GalleryPhoto>();
  readonly listItemClick = output<{ photo: GalleryPhoto; event: MouseEvent }>();

  isDeleteSelected(photoId: number): boolean {
    return this.deleteSelectedIds().includes(photoId);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }
}
