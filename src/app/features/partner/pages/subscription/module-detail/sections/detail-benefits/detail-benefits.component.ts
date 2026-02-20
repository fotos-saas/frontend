import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ModuleBenefit } from '../../module-detail.types';

@Component({
  selector: 'app-detail-benefits',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './detail-benefits.component.html',
  styleUrl: './detail-benefits.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailBenefitsComponent {
  readonly benefits = input.required<ModuleBenefit[]>();
}
