import { Injectable, inject, signal, computed } from '@angular/core';
import { PhotoshopService } from '../../services/photoshop.service';
import { PartnerProjectDetails } from '../../services/partner.service';

interface SampleActionsConfig {
  getProject: () => PartnerProjectDetails | null;
  clearMessages: () => void;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
}

/**
 * Minta/végleges generálás + minta beállítások.
 * Komponens-szintű service (providers tömb).
 */
@Injectable()
export class TabloEditorSampleActionsService {
  private readonly ps = inject(PhotoshopService);

  private config!: SampleActionsConfig;

  /** Minta generálás állapot */
  readonly generatingSample = signal(false);
  readonly sampleResult = signal<{ localPaths: string[]; uploadedCount: number; generatedAt: string } | null>(null);

  /** Véglegesítés állapot */
  readonly generatingFinal = signal(false);
  readonly finalResult = signal<{ localPath: string; uploadedCount: number; generatedAt: string } | null>(null);

  /** Minta beállítások (signal referenciák a ps service-ből) */
  readonly sampleSizeLarge = this.ps.sampleSizeLarge;
  readonly sampleSizeSmall = this.ps.sampleSizeSmall;
  readonly sampleLargeSize = this.ps.sampleUseLargeSize;
  readonly sampleWatermarkText = this.ps.sampleWatermarkText;
  readonly sampleWatermarkColor = this.ps.sampleWatermarkColor;
  readonly sampleWatermarkOpacity = this.ps.sampleWatermarkOpacity;
  readonly opacityPercent = computed(() => Math.round(this.sampleWatermarkOpacity() * 100));

  configure(config: SampleActionsConfig): void {
    this.config = config;
  }

  toggleLargeSize(): void {
    const next = !this.sampleLargeSize();
    this.sampleLargeSize.set(next);
    this.ps.setSampleSettings({ useLargeSize: next });
  }

  toggleWatermarkColor(): void {
    const next = this.sampleWatermarkColor() === 'white' ? 'black' : 'white';
    this.sampleWatermarkColor.set(next);
    this.ps.setSampleSettings({ watermarkColor: next });
  }

  cycleWatermarkOpacity(): void {
    const pct = Math.round(this.sampleWatermarkOpacity() * 100);
    const next = (pct >= 23 ? 10 : pct + 1) / 100;
    this.sampleWatermarkOpacity.set(next);
    this.ps.setSampleSettings({ watermarkOpacity: next });
  }

  async generateSample(): Promise<void> {
    if (this.generatingSample()) return;
    const p = this.config.getProject();
    if (!p) return;

    this.config.clearMessages();
    this.generatingSample.set(true);
    try {
      const result = await this.ps.generateSample(p.id, p.name, this.sampleLargeSize(), {
        schoolName: p.school?.name ?? null,
        className: p.className ?? null,
      });
      if (result.success) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        this.sampleResult.set({
          localPaths: result.localPaths || [],
          uploadedCount: result.uploadedCount || 0,
          generatedAt: timeStr,
        });
        this.config.setSuccess(`Minta generálás kész! ${result.localPaths?.length || 0} fájl mentve, ${result.uploadedCount || 0} feltöltve.`);
      } else {
        this.config.setError(result.error || 'Minta generálás sikertelen.');
      }
    } finally {
      this.generatingSample.set(false);
    }
  }

  async generateFinal(): Promise<void> {
    if (this.generatingFinal()) return;
    const p = this.config.getProject();
    if (!p) return;

    this.config.clearMessages();
    this.generatingFinal.set(true);
    try {
      const result = await this.ps.generateFinal(p.id, p.name, {
        schoolName: p.school?.name ?? null,
        className: p.className ?? null,
      });
      if (result.success) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        this.finalResult.set({
          localPath: result.localPath || '',
          uploadedCount: result.uploadedCount || 0,
          generatedAt: timeStr,
        });
        this.config.setSuccess(`Véglegesítés kész! Feltöltve: ${result.uploadedCount || 0} fájl.`);
      } else {
        this.config.setError(result.error || 'Véglegesítés sikertelen.');
      }
    } finally {
      this.generatingFinal.set(false);
    }
  }

  setSampleSizeLargeValue(e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 500 && v <= 10000) this.ps.setSampleSettings({ sizeLarge: v });
  }

  setSampleSizeSmallValue(e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 500 && v <= 10000) this.ps.setSampleSettings({ sizeSmall: v });
  }

  setSampleWatermarkTextValue(e: Event): void {
    const v = (e.target as HTMLInputElement).value.trim();
    if (v.length > 0) this.ps.setSampleSettings({ watermarkText: v });
  }

  setSampleWatermarkColorValue(color: 'white' | 'black'): void {
    this.ps.setSampleSettings({ watermarkColor: color });
  }

  setSampleWatermarkOpacityValue(e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 0.05 && v <= 0.50) this.ps.setSampleSettings({ watermarkOpacity: v });
  }
}
