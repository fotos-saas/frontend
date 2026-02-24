import { Component, inject, OnInit, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsInputComponent, PsSelectComponent, PsToggleComponent } from '@shared/components/form';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { PartnerEmailAccountService } from '../../../services/partner-email-account.service';
import type { PartnerEmailAccount, EmailAccountTestResult } from '../../../models/partner.models';

@Component({
  selector: 'app-email-account-settings',
  standalone: true,
  imports: [DatePipe, FormsModule, LucideAngularModule, PsInputComponent, PsSelectComponent, PsToggleComponent, ConfirmDialogComponent],
  templateUrl: './email-account-settings.component.html',
  styleUrl: './email-account-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailAccountSettingsComponent implements OnInit {
  private readonly service = inject(PartnerEmailAccountService);
  private readonly destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;

  // Státusz
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly saved = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly testResult = signal<EmailAccountTestResult | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Meglévő fiók adatai
  readonly existingAccount = signal<PartnerEmailAccount | null>(null);

  // Form mezők
  name = '';
  smtpHost = '';
  smtpPort = 587;
  smtpEncryption = 'tls';
  smtpUsername = '';
  smtpPassword = '';
  smtpFromAddress = '';
  smtpFromName = '';
  imapHost = '';
  imapPort = 993;
  imapEncryption = 'ssl';
  imapUsername = '';
  imapPassword = '';
  imapSentFolder = 'Sent';
  imapSaveSent = true;

  readonly encryptionOptions = [
    { id: 'tls', label: 'TLS' },
    { id: 'ssl', label: 'SSL' },
    { id: 'none', label: 'Nincs' },
  ];

  ngOnInit(): void {
    this.loadAccount();
  }

  private loadAccount(): void {
    this.loading.set(true);
    this.service.getEmailAccount().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (account) => {
        this.existingAccount.set(account);
        if (account) {
          this.fillForm(account);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private fillForm(account: PartnerEmailAccount): void {
    this.name = account.name;
    this.smtpHost = account.smtp_host;
    this.smtpPort = account.smtp_port;
    this.smtpEncryption = account.smtp_encryption;
    this.smtpUsername = account.smtp_username;
    this.smtpFromAddress = account.smtp_from_address;
    this.smtpFromName = account.smtp_from_name;
    this.imapHost = account.imap_host;
    this.imapPort = account.imap_port;
    this.imapEncryption = account.imap_encryption;
    this.imapUsername = account.imap_username;
    this.imapSentFolder = account.imap_sent_folder;
    this.imapSaveSent = account.imap_save_sent;
    // Jelszavakat nem töltjük be (hidden a backend-en)
  }

  private buildPayload(): Record<string, unknown> {
    return {
      name: this.name,
      smtp_host: this.smtpHost,
      smtp_port: this.smtpPort,
      smtp_encryption: this.smtpEncryption,
      smtp_username: this.smtpUsername,
      smtp_password: this.smtpPassword,
      smtp_from_address: this.smtpFromAddress,
      smtp_from_name: this.smtpFromName,
      imap_host: this.imapHost,
      imap_port: this.imapPort,
      imap_encryption: this.imapEncryption,
      imap_username: this.imapUsername,
      imap_password: this.imapPassword,
      imap_sent_folder: this.imapSentFolder,
      imap_save_sent: this.imapSaveSent,
    };
  }

  save(): void {
    this.saving.set(true);
    this.errorMessage.set(null);

    this.service.saveEmailAccount(this.buildPayload()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (account) => {
        this.existingAccount.set(account);
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Mentés sikertelen.');
      },
    });
  }

  test(): void {
    this.testing.set(true);
    this.testResult.set(null);

    this.service.testEmailAccount(this.buildPayload()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (result) => {
        this.testResult.set(result);
        this.testing.set(false);
      },
      error: (err) => {
        this.testing.set(false);
        this.errorMessage.set(err.error?.message || 'Teszt sikertelen.');
      },
    });
  }

  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  deleteAccount(): void {
    this.showDeleteConfirm.set(false);
    this.service.deleteEmailAccount().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.existingAccount.set(null);
        this.resetForm();
      },
    });
  }

  private resetForm(): void {
    this.name = '';
    this.smtpHost = '';
    this.smtpPort = 587;
    this.smtpEncryption = 'tls';
    this.smtpUsername = '';
    this.smtpPassword = '';
    this.smtpFromAddress = '';
    this.smtpFromName = '';
    this.imapHost = '';
    this.imapPort = 993;
    this.imapEncryption = 'ssl';
    this.imapUsername = '';
    this.imapPassword = '';
    this.imapSentFolder = 'Sent';
    this.imapSaveSent = true;
    this.testResult.set(null);
  }
}
