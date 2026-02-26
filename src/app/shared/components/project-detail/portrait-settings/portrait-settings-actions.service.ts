import { Injectable, inject, signal } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  PortraitSettings,
  DEFAULT_PORTRAIT_SETTINGS,
} from '../../../../features/partner/models/portrait.models';

@Injectable()
export class PortraitSettingsActionsService {
  private partnerService = inject(PartnerService);
  readonly toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  // Állapotok
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly deleting = signal(false);
  readonly settings = signal<PortraitSettings>({ ...DEFAULT_PORTRAIT_SETTINGS });
  readonly hasBackgroundImage = signal(false);
  readonly backgroundImageUrl = signal<string | null>(null);
  readonly backgroundThumbUrl = signal<string | null>(null);

  load(projectId: number): void {
    this.loading.set(true);
    this.partnerService.getPortraitSettings(projectId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.settings.set(res.data.settings);
        this.hasBackgroundImage.set(res.data.has_background_image);
        this.backgroundImageUrl.set(res.data.background_image_url);
        this.backgroundThumbUrl.set(res.data.background_thumb_url);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Hiba', 'Nem sikerült betölteni a portré beállításokat');
      },
    });
  }

  save(projectId: number): void {
    this.saving.set(true);
    this.partnerService.updatePortraitSettings(projectId, this.settings()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.settings.set(res.data.settings);
        this.toast.success('Siker', 'Portré beállítások mentve');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült menteni a beállításokat');
      },
    });
  }

  uploadBackground(projectId: number, file: File): void {
    this.uploading.set(true);
    this.partnerService.uploadPortraitBackground(projectId, file).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.hasBackgroundImage.set(true);
        this.backgroundImageUrl.set(res.data.url);
        this.backgroundThumbUrl.set(res.data.thumb_url);
        this.toast.success('Siker', 'Háttérkép feltöltve');
      },
      error: () => {
        this.uploading.set(false);
        this.toast.error('Hiba', 'Nem sikerült feltölteni a háttérképet');
      },
    });
  }

  deleteBackground(projectId: number): void {
    this.deleting.set(true);
    this.partnerService.deletePortraitBackground(projectId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.deleting.set(false);
        this.hasBackgroundImage.set(false);
        this.backgroundImageUrl.set(null);
        this.backgroundThumbUrl.set(null);
        this.toast.success('Siker', 'Háttérkép törölve');
      },
      error: () => {
        this.deleting.set(false);
        this.toast.error('Hiba', 'Nem sikerült törölni a háttérképet');
      },
    });
  }

  updateSetting<K extends keyof PortraitSettings>(key: K, value: PortraitSettings[K]): void {
    // Szám típusú mezőknél explicit konverzió (template $event any típusú)
    const current = this.settings()[key];
    if (typeof current === 'number' && typeof value !== 'number') {
      const num = Number(value);
      if (isNaN(num)) return;
      value = num as PortraitSettings[K];
    }
    this.settings.update(s => ({ ...s, [key]: value }));
  }
}
