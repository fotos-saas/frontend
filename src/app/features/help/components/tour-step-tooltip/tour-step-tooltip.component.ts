import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';

@Component({
  selector: 'app-tour-step-tooltip',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './tour-step-tooltip.component.html',
  styleUrl: './tour-step-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourStepTooltipComponent {
  readonly ICONS = ICONS;
  readonly title = input.required<string>();
  readonly content = input.required<string>();
  readonly stepNumber = input.required<number>();
  readonly totalSteps = input.required<number>();
  readonly allowSkip = input(true);

  readonly next = output<void>();
  readonly prev = output<void>();
  readonly skip = output<void>();
}
