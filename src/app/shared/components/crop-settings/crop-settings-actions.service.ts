import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PartnerService } from '@features/partner/services/partner.service';
import { ToastService } from '@core/services/toast.service';
import { CropSettings, EMPTY_CROP_SETTINGS, CROP_PRESETS, CropPreset } from '@features/partner/models/crop.models';

@Injectable()
export class CropSettingsActionsService {
  private readonly partnerService = inject(PartnerService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly settings = signal<CropSettings>({ ...EMPTY_CROP_SETTINGS });

  load(): void {
    this.loading.set(true);
    this.partnerService.getCropSettings().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        if (res.data?.settings) {
          this.settings.set(res.data.settings);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Hiba', 'Nem sikerült betölteni a vágási beállításokat');
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.partnerService.updateCropSettings(this.settings()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.data?.settings) {
          this.settings.set(res.data.settings);
        }
        this.toast.success('Mentve', 'Vágási beállítások sikeresen mentve');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült menteni a beállításokat');
      },
    });
  }

  updateSetting<K extends keyof CropSettings>(key: K, value: CropSettings[K]): void {
    const current = this.settings()[key];
    if (typeof current === 'number' && typeof value !== 'number') {
      const num = Number(value);
      if (isNaN(num)) return;
      value = num as CropSettings[K];
    }
    this.settings.update(s => ({ ...s, [key]: value }));
  }

  applyPreset(preset: CropPreset): void {
    const presetValues = CROP_PRESETS[preset];
    if (presetValues) {
      this.settings.update(s => ({
        ...s,
        ...presetValues,
        preset,
      }));
    }
  }
}
