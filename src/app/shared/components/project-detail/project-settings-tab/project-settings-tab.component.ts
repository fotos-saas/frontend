import { Component, ChangeDetectionStrategy, inject, input, signal, OnInit, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-project-settings-tab',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-settings-tab.component.html',
  styleUrl: './project-settings-tab.component.scss',
})
export class ProjectSettingsTabComponent implements OnInit {
  projectId = input.required<number>();

  private partnerService = inject(PartnerService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  loading = signal(true);
  saving = signal(false);
  useCustomLimit = signal(false);
  customLimit = signal(3);
  globalDefault = signal(3);
  effectiveValue = signal(5);

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.partnerService.getProjectSettings(this.projectId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        const d = res.data;
        this.globalDefault.set(d.global_default_max_retouch_photos);
        this.effectiveValue.set(d.effective_max_retouch_photos);

        if (d.max_retouch_photos !== null) {
          this.useCustomLimit.set(true);
          this.customLimit.set(d.max_retouch_photos);
        } else {
          this.useCustomLimit.set(false);
          this.customLimit.set(d.global_default_max_retouch_photos);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Hiba', 'Nem sikerült betölteni a beállításokat');
      },
    });
  }

  toggleCustomLimit(): void {
    this.useCustomLimit.update(v => !v);
    if (!this.useCustomLimit()) {
      this.customLimit.set(this.globalDefault());
    }
  }

  save(): void {
    this.saving.set(true);
    const value = this.useCustomLimit() ? this.customLimit() : null;

    this.partnerService.updateProjectSettings(this.projectId(), { max_retouch_photos: value }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.effectiveValue.set(res.data.effective_max_retouch_photos);
        this.toast.success('Siker', 'Beállítások mentve');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült menteni a beállításokat');
      },
    });
  }
}
