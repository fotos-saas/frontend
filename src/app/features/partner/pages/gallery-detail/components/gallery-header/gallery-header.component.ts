import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { BackButtonComponent } from '../../../../../../shared/components/action-buttons/back-button/back-button.component';

@Component({
  selector: 'app-gallery-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatTooltipModule, BackButtonComponent],
  template: `
    <header class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <app-back-button
          [label]="'Vissza a projekthez'"
          [display]="'icon-text'"
          (clicked)="back.emit()"
        />
      </div>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <lucide-icon [name]="ICONS.IMAGES" [size]="20" class="text-primary" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-900">{{ galleryName() }}</h1>
          <p class="text-sm text-gray-500">{{ photosCount() }} fotó a galériában</p>
        </div>
      </div>
    </header>
  `,
})
export class GalleryHeaderComponent {
  readonly ICONS = ICONS;

  readonly galleryName = input.required<string>();
  readonly photosCount = input.required<number>();

  readonly back = output<void>();
}
