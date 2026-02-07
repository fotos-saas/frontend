import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { GalleryProgress } from '../../../../models/gallery.models';

@Component({
  selector: 'app-gallery-info-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './gallery-info-bar.component.html',
  styleUrl: './gallery-info-bar.component.scss',
})
export class GalleryInfoBarComponent {
  readonly ICONS = ICONS;

  readonly photosCount = input.required<number>();
  readonly totalSizeMb = input.required<number>();
  readonly viewMode = input.required<'grid' | 'list'>();
  readonly progress = input<GalleryProgress | null>(null);

  readonly deadline = input<string | null>(null);
  readonly deadlineFormatted = input<string | null>(null);
  readonly settingDeadline = input<boolean>(false);
  readonly isDeadlineExpired = input<boolean>(false);

  readonly viewModeChange = output<'grid' | 'list'>();
  readonly deadlineExtend = output<number>();

  readonly hasProgress = computed(() => {
    const p = this.progress();
    return p !== null && p.totalUsers > 0;
  });
}
