import { Injectable, inject, NgZone, DestroyRef, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

/**
 * Overlay beállítások perzisztencia:
 * - Név beállítások (breakAfter, gapCm)
 * - Minta generálás beállítások (size, watermark, opacity, version)
 * - SyncWithBorder flag
 */
@Injectable()
export class OverlaySettingsService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);

  // Név beállítások
  readonly nameBreakAfter = signal(1);
  readonly nameGapCm = signal(0.5);
  private nameSettingsLoaded = false;

  // Minta generálás beállítások
  readonly sampleUseLargeSize = signal(false);
  readonly sampleWatermarkColor = signal<'white' | 'black'>('white');
  readonly sampleWatermarkOpacity = signal(0.15);
  readonly sampleVersion = signal('');

  // SyncWithBorder
  readonly syncWithBorder = signal(true);

  /** Betölti a sync border értéket egy adott projekthez */
  loadSyncBorderForProject(projectId?: number): boolean {
    try {
      const key = `sync-border-${projectId ?? 'default'}`;
      return localStorage.getItem(key) !== 'false';
    } catch {
      return true;
    }
  }

  saveSyncBorder(projectId?: number): void {
    try {
      const key = `sync-border-${projectId ?? 'default'}`;
      localStorage.setItem(key, String(this.syncWithBorder()));
    } catch { /* ignore */ }
  }

  toggleSyncBorder(projectId?: number): void {
    this.syncWithBorder.update(v => !v);
    this.saveSyncBorder(projectId);
    window.electronAPI?.overlay.executeCommand(
      this.syncWithBorder() ? 'sync-border-on' : 'sync-border-off',
    );
  }

  // ============ Név beállítások ============

  /** Sortörés ciklikus váltás: 0 → 1 → 2 → 0 */
  cycleBreakAfter(): void {
    const current = this.nameBreakAfter();
    const next = current >= 2 ? 0 : current + 1;
    this.nameBreakAfter.set(next);
    this.saveNameSetting('nameBreakAfter', next);
  }

  /** Gap növelés/csökkentés */
  adjustGap(delta: number): void {
    const current = this.nameGapCm();
    const next = Math.round(Math.max(0, Math.min(5, current + delta)) * 10) / 10;
    this.nameGapCm.set(next);
    this.saveNameSetting('nameGapCm', next);
  }

  /** Betölti a név + minta beállításokat Electron-ból és a backend-ből */
  async loadSettings(projectId?: number | null): Promise<void> {
    if (!window.electronAPI || this.nameSettingsLoaded) return;
    try {
      const [gap, breakAfter, sampleSettings] = await Promise.all([
        window.electronAPI.photoshop.getNameGap(),
        window.electronAPI.photoshop.getNameBreakAfter(),
        window.electronAPI.sample.getSettings(),
      ]);
      this.ngZone.run(() => {
        if (gap !== undefined) this.nameGapCm.set(gap);
        if (breakAfter !== undefined) this.nameBreakAfter.set(breakAfter);
        if (sampleSettings.success && sampleSettings.settings) {
          const s = sampleSettings.settings;
          this.sampleUseLargeSize.set(s.useLargeSize);
          this.sampleWatermarkColor.set(s.watermarkColor);
          this.sampleWatermarkOpacity.set(s.watermarkOpacity);
          this.sampleVersion.set(s.sampleVersion ?? '');
        }
        this.nameSettingsLoaded = true;
      });
      if (projectId) {
        this.loadSampleSettingsForProject(projectId);
      }
    } catch { /* ignore */ }
  }

  // ============ Minta generálás beállítások ============

  toggleSampleSize(): void {
    this.sampleUseLargeSize.update(v => !v);
    window.electronAPI?.sample.setSettings({ useLargeSize: this.sampleUseLargeSize() });
  }

  toggleWatermarkColor(): void {
    const next = this.sampleWatermarkColor() === 'white' ? 'black' : 'white';
    this.sampleWatermarkColor.set(next);
    window.electronAPI?.sample.setSettings({ watermarkColor: next });
  }

  cycleOpacity(direction: 1 | -1 = 1): void {
    const pct = Math.round(this.sampleWatermarkOpacity() * 100);
    const next = Math.min(50, Math.max(5, pct + direction)) / 100;
    this.sampleWatermarkOpacity.set(next);
    window.electronAPI?.sample.setSettings({ watermarkOpacity: next });
  }

  cycleSampleVersion(direction: 1 | -1 = 1): void {
    const current = this.sampleVersion();
    const num = current ? parseInt(current, 10) : 0;
    const next = Math.max(0, (isNaN(num) ? 0 : num) + direction);
    const val = next === 0 ? '' : String(next);
    this.sampleVersion.set(val);
    window.electronAPI?.sample.setSettings({ sampleVersion: val });
  }

  /** Minta beállítások mentése a backend-re */
  saveSampleSettingsToBackend(projectId: number | null, data: {
    sample_use_large_size?: boolean;
    sample_watermark_color?: 'white' | 'black';
    sample_watermark_opacity?: number;
    sample_version?: string;
  }): void {
    if (!projectId) return;
    this.http.put(
      `${environment.apiUrl}/partner/projects/${projectId}/sample-settings`,
      data,
    ).subscribe();
  }

  /** Backend-ről betölti a sample settings-et egy adott projekthez */
  loadSampleSettingsForProject(projectId: number): void {
    this.http.get<{
      data: {
        sample_use_large_size: boolean | null;
        sample_watermark_color: 'white' | 'black' | null;
        sample_watermark_opacity: number | null;
        sample_version: string | null;
      };
    }>(`${environment.apiUrl}/partner/projects/${projectId}/sample-settings`)
      .subscribe({
        next: (res) => {
          const d = res.data;
          this.sampleUseLargeSize.set(d.sample_use_large_size ?? false);
          this.sampleWatermarkColor.set(d.sample_watermark_color ?? 'white');
          this.sampleWatermarkOpacity.set(
            d.sample_watermark_opacity !== null ? d.sample_watermark_opacity / 100 : 0.15,
          );
          this.sampleVersion.set(d.sample_version ?? '');
          window.electronAPI?.sample.setSettings({ sampleVersion: d.sample_version ?? '' });
        },
      });
  }

  private saveNameSetting(key: string, value: number): void {
    if (!window.electronAPI) return;
    if (key === 'nameBreakAfter') {
      window.electronAPI.photoshop.setNameBreakAfter(value);
    } else if (key === 'nameGapCm') {
      window.electronAPI.photoshop.setNameGap(value);
    }
  }
}
