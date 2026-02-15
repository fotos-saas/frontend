import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { PsInputComponent, PsSelectComponent, PsTextareaComponent, PsToggleComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { InvoiceSettingsService } from '../../../../../services/invoice-settings.service';
import { InvoiceProvider, INVOICE_PROVIDER_LABELS } from '../../../../../models/invoice.models';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-invoice-settings',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, PsSelectComponent, PsTextareaComponent, PsToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-settings.component.html',
  styleUrl: './invoice-settings.component.scss',
})
export class InvoiceSettingsComponent implements OnInit {
  private settingsService = inject(InvoiceSettingsService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly PROVIDER_LABELS = INVOICE_PROVIDER_LABELS;

  readonly providerOptions: PsSelectOption[] = [
    { id: 'szamlazz_hu', label: 'Számlázz.hu' },
    { id: 'billingo', label: 'Billingo' },
  ];

  readonly currencyOptions: PsSelectOption[] = [
    { id: 'HUF', label: 'HUF' },
    { id: 'EUR', label: 'EUR' },
    { id: 'USD', label: 'USD' },
  ];

  readonly languageOptions: PsSelectOption[] = [
    { id: 'hu', label: 'Magyar' },
    { id: 'en', label: 'Angol' },
    { id: 'de', label: 'Német' },
  ];

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly validating = signal(false);
  readonly apiKeyValid = signal<boolean | null>(null);

  // Form state
  readonly provider = signal<InvoiceProvider>('szamlazz_hu');
  readonly enabled = signal(false);
  readonly hasApiKey = signal(false);
  readonly apiKey = signal('');
  readonly prefix = signal('PS');
  readonly currency = signal('HUF');
  readonly language = signal('hu');
  readonly dueDays = signal(8);
  readonly vatPercentage = signal(27);
  readonly comment = signal('');
  readonly euVat = signal(false);

  // Számlázz.hu
  readonly szamlazzBankName = signal('');
  readonly szamlazzBankAccount = signal('');
  readonly szamlazzReplyEmail = signal('');

  // Billingo
  readonly billingoBlockId = signal('');
  readonly billingoBankAccountId = signal('');

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.settingsService.getSettings().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (s) => {
        this.provider.set(s.invoice_provider);
        this.enabled.set(s.invoice_enabled);
        this.hasApiKey.set(s.has_api_key);
        this.prefix.set(s.invoice_prefix);
        this.currency.set(s.invoice_currency);
        this.language.set(s.invoice_language);
        this.dueDays.set(s.invoice_due_days);
        this.vatPercentage.set(s.invoice_vat_percentage);
        this.comment.set(s.invoice_comment ?? '');
        this.euVat.set(s.invoice_eu_vat);
        this.szamlazzBankName.set(s.szamlazz_bank_name ?? '');
        this.szamlazzBankAccount.set(s.szamlazz_bank_account ?? '');
        this.szamlazzReplyEmail.set(s.szamlazz_reply_email ?? '');
        this.billingoBlockId.set(s.billingo_block_id ?? '');
        this.billingoBankAccountId.set(s.billingo_bank_account_id ?? '');
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Hiba', 'Nem sikerült betölteni a beállításokat');
        this.loading.set(false);
      },
    });
  }

  onProviderChange(value: string): void {
    this.provider.set(value as InvoiceProvider);
    this.apiKeyValid.set(null);
  }

  onToggleEnabled(): void {
    this.enabled.update(v => !v);
  }

  onToggleEuVat(): void {
    this.euVat.update(v => !v);
  }

  validateApiKey(): void {
    this.validating.set(true);
    this.settingsService.validateApiKey().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.apiKeyValid.set(res.success);
        if (res.success) {
          this.toast.success('Siker', res.message);
        } else {
          this.toast.error('Hiba', res.message);
        }
        this.validating.set(false);
      },
      error: () => {
        this.apiKeyValid.set(false);
        this.toast.error('Hiba', 'Validálás sikertelen');
        this.validating.set(false);
      },
    });
  }

  save(): void {
    this.saving.set(true);

    const payload: Record<string, unknown> = {
      invoice_provider: this.provider(),
      invoice_enabled: this.enabled(),
      invoice_prefix: this.prefix(),
      invoice_currency: this.currency(),
      invoice_language: this.language(),
      invoice_due_days: this.dueDays(),
      invoice_vat_percentage: this.vatPercentage(),
      invoice_comment: this.comment() || null,
      invoice_eu_vat: this.euVat(),
      szamlazz_bank_name: this.szamlazzBankName() || null,
      szamlazz_bank_account: this.szamlazzBankAccount() || null,
      szamlazz_reply_email: this.szamlazzReplyEmail() || null,
      billingo_block_id: this.billingoBlockId() || null,
      billingo_bank_account_id: this.billingoBankAccountId() || null,
    };

    if (this.apiKey()) {
      payload['invoice_api_key'] = this.apiKey();
    }

    this.settingsService.updateSettings(payload as never).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.toast.success('Siker', res.message);
        if (this.apiKey()) {
          this.hasApiKey.set(true);
          this.apiKey.set('');
        }
        this.saving.set(false);
      },
      error: () => {
        this.toast.error('Hiba', 'Mentés sikertelen');
        this.saving.set(false);
      },
    });
  }
}
