import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ModuleScreenshot } from '../../module-detail.types';

@Component({
  selector: 'app-detail-screenshots',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './detail-screenshots.component.html',
  styleUrl: './detail-screenshots.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailScreenshotsComponent {
  readonly screenshots = input.required<ModuleScreenshot[]>();
  readonly openLightbox = output<number>();

  readonly ICONS = ICONS;
}
