import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SuperAdminService, SystemSettings } from '../../services/super-admin.service';
import { ICONS } from '../../../../shared/constants';
import { PlansService, PlanOption } from '../../../../shared/services/plans.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PsToggleComponent, PsInputComponent, PsSelectComponent, PsTagInputComponent } from '@shared/components/form';
import { PsTextareaComponent } from '@shared/components/form/ps-textarea/ps-textarea.component';
import { PsSelectOption } from '@shared/components/form/form.types';

type TabId = 'system' | 'email' | 'stripe' | 'info';

/**
 * Beállítások oldal - Super Admin felületen.
 * Tab-okkal szervezett konfigurációs felület.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    PsToggleComponent,
    PsInputComponent,
    PsSelectComponent,
    PsTagInputComponent,
    PsTextareaComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  private readonly service = inject(SuperAdminService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly plansService = inject(PlansService);
  private readonly toast = inject(ToastService);

  readonly ICONS = ICONS;

  // Tab-ok
  readonly tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'system', label: 'Rendszer', icon: 'settings' },
    { id: 'email', label: 'Email', icon: 'mail' },
    { id: 'stripe', label: 'Stripe', icon: 'credit-card' },
    { id: 'info', label: 'Rendszer infó', icon: 'info' },
  ];

  activeTab = signal<TabId>('system');
  loading = signal(true);
  saving = signal(false);
  settings = signal<SystemSettings | null>(null);

  // Form values
  registrationEnabled = signal(true);
  trialDays = signal(14);
  defaultPlan = signal<'alap' | 'iskola' | 'studio' | 'vip'>('alap');

  // Email dev mode
  emailDevMode = signal(false);
  emailDevMasterAddress = signal('');
  emailDevWhitelist = signal<string[]>([]);
  savingEmailDev = signal(false);

  // Test email
  testRecipient = signal('');
  testSubject = signal('');
  testBody = signal('');
  sendingTest = signal(false);

  // Plan opciók - PlansService-ből töltve
  planOptions = signal<PlanOption[]>([]);

  // PsSelect kompatibilis opciók
  planSelectOptions = computed<PsSelectOption[]>(() =>
    this.planOptions().map(o => ({ id: o.value, label: o.label }))
  );

  ngOnInit(): void {
    this.loadPlanOptions();
    this.loadSettings();
  }

  private loadPlanOptions(): void {
    this.plansService.getPlanSelectOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(options => this.planOptions.set(options));
  }

  loadSettings(): void {
    this.loading.set(true);

    this.service.getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.settings.set(response);
          this.registrationEnabled.set(response.system.registrationEnabled);
          this.trialDays.set(response.system.trialDays);
          this.defaultPlan.set(response.system.defaultPlan);
          this.emailDevMode.set(response.email.devMode ?? false);
          this.emailDevMasterAddress.set(response.email.devMasterAddress ?? '');
          this.emailDevWhitelist.set(response.email.devWhitelist ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  setActiveTab(tab: TabId): void {
    this.activeTab.set(tab);
  }

  saveSettings(): void {
    this.saving.set(true);

    this.service.updateSettings({
      registrationEnabled: this.registrationEnabled(),
      trialDays: this.trialDays(),
      defaultPlan: this.defaultPlan(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
        },
        error: () => {
          this.saving.set(false);
        }
      });
  }

  saveEmailDevSettings(): void {
    this.savingEmailDev.set(true);

    this.service.updateSettings({
      emailDevMode: this.emailDevMode(),
      emailDevMasterAddress: this.emailDevMasterAddress() || null,
      emailDevWhitelist: this.emailDevWhitelist(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingEmailDev.set(false);
        },
        error: () => {
          this.savingEmailDev.set(false);
        }
      });
  }

  sendTestEmail(): void {
    this.sendingTest.set(true);

    this.service.sendTestEmail({
      recipient: this.testRecipient(),
      subject: this.testSubject(),
      body: this.testBody(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.sendingTest.set(false);
          this.toast.success('Email elküldve', res.message);
        },
        error: () => {
          this.sendingTest.set(false);
        }
      });
  }
}
