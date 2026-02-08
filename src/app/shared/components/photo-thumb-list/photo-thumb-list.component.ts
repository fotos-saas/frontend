import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../constants/icons.constants';

export interface ThumbPhoto {
  id: number;
  thumbUrl: string | null;
  originalName?: string | null;
}

export type ThumbSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-photo-thumb-list',
  standalone: true,
  imports: [MatTooltipModule, LucideAngularModule],
  templateUrl: './photo-thumb-list.component.html',
  styleUrl: './photo-thumb-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoThumbListComponent {
  readonly photos = input.required<ThumbPhoto[]>();
  readonly size = input<ThumbSize>('md');
  readonly highlight = input<boolean>(false);

  readonly ICONS = ICONS;

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/placeholder-image.svg';
  }
}
