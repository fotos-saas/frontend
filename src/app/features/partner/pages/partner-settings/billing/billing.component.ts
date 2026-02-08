import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { InvoiceSettingsComponent } from './tabs/invoice-settings/invoice-settings.component';
import { InvoiceListComponent } from './tabs/invoice-list/invoice-list.component';
import { StripeSettingsComponent } from './tabs/stripe-settings/stripe-settings.component';

export type BillingTab = 'settings' | 'invoices' | 'stripe';

interface BillingTabDef {
  id: BillingTab;
  label: string;
  icon: string;
}

const BILLING_TABS: BillingTabDef[] = [
  { id: 'settings', label: 'Beállítások', icon: ICONS.SETTINGS },
  { id: 'invoices', label: 'Számlák', icon: ICONS.RECEIPT },
  { id: 'stripe', label: 'Fizetés (Stripe)', icon: ICONS.CREDIT_CARD },
];

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [LucideAngularModule, InvoiceSettingsComponent, InvoiceListComponent, StripeSettingsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
})
export class BillingComponent {
  readonly ICONS = ICONS;
  readonly tabs = BILLING_TABS;
  readonly activeTab = signal<BillingTab>('settings');

  onTabChange(tab: BillingTab): void {
    this.activeTab.set(tab);
  }
}
