import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerModule } from '../../../../../models/marketplace.models';

@Component({
  selector: 'app-detail-pricing',
  standalone: true,
  imports: [LucideAngularModule, DecimalPipe],
  templateUrl: './detail-pricing.component.html',
  styleUrl: './detail-pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPricingComponent {
  readonly module = input.required<PartnerModule>();
  readonly ctaClick = output<void>();

  readonly ICONS = ICONS;

  get isActive(): boolean {
    return ['active', 'package', 'trial', 'free'].includes(this.module().partner_status);
  }

  get yearlySavingPercent(): number | null {
    const mod = this.module();
    if (!mod.monthly_price || !mod.yearly_price) return null;
    const monthlyTotal = mod.monthly_price * 12;
    return Math.round((1 - mod.yearly_price / monthlyTotal) * 100);
  }
}
