import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerStripeSettingsService } from '../../../../../services/partner-stripe-settings.service';

@Component({
  selector: 'app-stripe-settings',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './stripe-settings.component.html',
  styleUrl: './stripe-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StripeSettingsComponent implements OnInit {
  readonly stripeService = inject(PartnerStripeSettingsService);
  readonly ICONS = ICONS;

  publicKey = '';
  secretKey = '';
  webhookSecret = '';
  stripeEnabled = false;

  readonly validationResult = signal<{ valid: boolean; message: string } | null>(null);
  readonly saved = signal(false);

  ngOnInit(): void {
    this.stripeService.loadSettings();
  }

  save(): void {
    const payload: Record<string, unknown> = {};
    if (this.publicKey) payload['stripe_public_key'] = this.publicKey;
    if (this.secretKey) payload['stripe_secret_key'] = this.secretKey;
    if (this.webhookSecret) payload['stripe_webhook_secret'] = this.webhookSecret;
    payload['stripe_enabled'] = this.stripeEnabled;

    this.stripeService.updateSettings(payload, () => {
      this.saved.set(true);
      this.publicKey = '';
      this.secretKey = '';
      this.webhookSecret = '';
      setTimeout(() => this.saved.set(false), 3000);
    });
  }

  validateKeys(): void {
    this.validationResult.set(null);
    this.stripeService.validateKeys((valid, message) => {
      this.validationResult.set({ valid, message });
    });
  }

  toggleEnabled(): void {
    this.stripeEnabled = !this.stripeEnabled;
  }
}
