import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';

/**
 * Step Choice - AI vs Manuális párosítás választó.
 *
 * Két nagy kártya gombot jelenít meg:
 * - AI párosítás: automatikus név-alapú párosítás
 * - Manuális párosítás: drag & drop a review képernyőn
 */
@Component({
  selector: 'app-step-choice',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './step-choice.component.html',
  styleUrls: ['./step-choice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepChoiceComponent {
  readonly ICONS = ICONS;

  // Inputs
  readonly photoCount = input(0);
  readonly loading = input(false);

  // Outputs
  readonly aiSelected = output<void>();
  readonly manualSelected = output<void>();
}
