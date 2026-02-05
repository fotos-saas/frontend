import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SubscriptionInfo } from '../../../../services/subscription.service';
import { ICONS, getSubscriptionStatusLabel } from '../../../../../../shared/constants';

/**
 * Subscription Card Component
 *
 * Előfizetési információk megjelenítése kártyán.
 */
@Component({
  selector: 'app-subscription-card',
  standalone: true,
  imports: [LucideAngularModule, DatePipe],
  templateUrl: './subscription-card.component.html',
  styleUrls: ['./subscription-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionCardComponent {
  info = input.required<SubscriptionInfo>();
  openPortal = output<void>();

  protected readonly ICONS = ICONS;

  // Központi konstansból
  getStatusLabel(): string {
    return getSubscriptionStatusLabel(this.info().status);
  }

  getFeatureLabel(feature: string): string {
    const labels: Record<string, string> = {
      online_selection: 'Online képválasztás',
      templates: 'Sablonok',
      qr_sharing: 'QR megosztás',
      email_support: 'Email támogatás',
      subdomain: 'Aldomain',
      stripe_payments: 'Online fizetés',
      sms_notifications: 'SMS értesítések',
      priority_support: 'Prioritásos támogatás',
      custom_domain: 'Egyedi domain',
      white_label: 'Fehér címke',
      api_access: 'API hozzáférés',
      dedicated_support: 'Dedikált támogatás'
    };
    return labels[feature] ?? feature;
  }
}
