import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { TourStep } from './guided-tour.types';
import { ICONS } from '../../constants/icons.constants';

@Component({
  selector: 'app-guided-tour-tooltip',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './guided-tour-tooltip.component.html',
  styleUrl: './guided-tour-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidedTourTooltipComponent {
  readonly step = input.required<TourStep>();
  readonly isFirstStep = input(false);
  readonly isLastStep = input(false);
  readonly stepCounter = input('');
  readonly arrowPosition = input<'top' | 'bottom' | 'left' | 'right' | 'none'>('none');
  readonly progressPercent = input(0);

  readonly nextEvent = output<void>();
  readonly previousEvent = output<void>();
  readonly skipEvent = output<void>();

  readonly ICONS = ICONS;
}
