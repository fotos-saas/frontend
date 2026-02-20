import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { ModuleStep } from '../../module-detail.types';

@Component({
  selector: 'app-detail-how-it-works',
  standalone: true,
  templateUrl: './detail-how-it-works.component.html',
  styleUrl: './detail-how-it-works.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailHowItWorksComponent {
  readonly steps = input.required<ModuleStep[]>();
}
