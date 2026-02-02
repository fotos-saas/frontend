import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SuperAdminService, SystemSettings } from '../services/super-admin.service';
import { ICONS, PLAN_SELECT_OPTIONS } from '../../../shared/constants';

type TabId = 'system' | 'email' | 'stripe' | 'info';

/**
 * Beállítások oldal - Super Admin felületen.
 * Tab-okkal szervezett konfigurációs felület.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  private readonly service = inject(SuperAdminService);
  private readonly destroyRef = inject(DestroyRef);

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
  defaultPlan = signal<'alap' | 'iskola' | 'studio'>('alap');

  // Plan opciók - központi konstansból
  readonly planOptions = PLAN_SELECT_OPTIONS;

  ngOnInit(): void {
    this.loadSettings();
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
}
