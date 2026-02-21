import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerModule } from '../../../../../models/marketplace.models';

@Component({
  selector: 'app-detail-hero',
  standalone: true,
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './detail-hero.component.html',
  styleUrl: './detail-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailHeroComponent {
  readonly module = input.required<PartnerModule>();
  readonly heroGradient = input<string>('from-indigo-500 to-purple-600');
  readonly badge = input<string | null>(null);
  readonly ctaClick = output<void>();

  readonly ICONS = ICONS;

  get isActive(): boolean {
    return ['active', 'package', 'trial', 'free'].includes(this.module().partner_status);
  }

  get statusLabel(): string {
    const labels: Record<string, string> = {
      inactive: 'Inaktív',
      trial: 'Próba',
      active: 'Aktív',
      paused: 'Szüneteltetve',
      canceling: 'Lemondva',
      free: 'Ingyenes',
      package: 'Csomagban',
    };
    return labels[this.module().partner_status] ?? this.module().partner_status;
  }

  get priceDisplay(): string {
    const mod = this.module();
    if (mod.type === 'free') return 'Ingyenes';
    if (mod.type === 'per_use') {
      if (mod.per_use_price == null) return 'Egyedi árazás';
      return `${mod.per_use_price.toLocaleString('hu-HU')} Ft/${mod.per_use_unit ?? 'db'}`;
    }
    if (mod.monthly_price == null) return 'Egyedi árazás';
    return `${mod.monthly_price.toLocaleString('hu-HU')} Ft/hó`;
  }

  get ctaLabel(): string {
    const mod = this.module();
    if (this.isActive) return 'Aktív';
    if (mod.partner_status === 'paused') return 'Folytatás';
    if (mod.type === 'free') return 'Aktiválás';
    return mod.cta_button || 'Feliratkozás';
  }
}
