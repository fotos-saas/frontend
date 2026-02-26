import { Injectable, inject, signal } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopPathService } from './photoshop-path.service';

type ElectronResult = { success: boolean; error?: string };
type ApiMethod<T> = ((value: T) => Promise<ElectronResult>) | undefined;

/**
 * PhotoshopSettingsService — Signal-ök (margin, gap, size, align) + setterek (Electron persist).
 */
@Injectable({ providedIn: 'root' })
export class PhotoshopSettingsService {
  private readonly logger = inject(LoggerService);
  private readonly pathService = inject(PhotoshopPathService);

  private get api() { return this.pathService.api; }

  /** Tabló margó (cm) */
  readonly marginCm = signal<number>(2);

  /** Diák fotó layer mérete (cm) */
  readonly studentSizeCm = signal<number>(6);

  /** Tanár fotó layer mérete (cm) */
  readonly teacherSizeCm = signal<number>(6);

  /** Vízszintes gap — képek közötti távolság egy soron belül (cm) */
  readonly gapHCm = signal<number>(2);

  /** Függőleges gap — sorok közötti távolság (cm) */
  readonly gapVCm = signal<number>(3);

  /** Név távolsága a kép aljától (cm) */
  readonly nameGapCm = signal<number>(0.5);

  /** Tördelés: hány valódi szó után sortörés (3+ szavas neveknél) */
  readonly nameBreakAfter = signal<number>(1);

  /** Nevek text igazítás (left/center/right) */
  readonly textAlign = signal<string>('center');

  /** Képek sor-igazítás a gridben (left/center/right) */
  readonly gridAlign = signal<string>('center');

  /** Pozíció szöveg távolsága a név aljától (cm) */
  readonly positionGapCm = signal<number>(0.15);

  /** Pozíció szöveg font mérete (pt) */
  readonly positionFontSize = signal<number>(18);

  /** Minta beállítások */
  readonly sampleSizeLarge = signal(4000);
  readonly sampleSizeSmall = signal(2000);
  readonly sampleWatermarkText = signal('MINTA');
  readonly sampleWatermarkColor = signal<'white' | 'black'>('white');
  readonly sampleWatermarkOpacity = signal(0.15);
  readonly sampleUseLargeSize = signal(false);

  /**
   * Generikus setter: Electron API persist + signal frissítés.
   * 10 setter boilerplate → 1 soros delegálás.
   */
  private async persistSetting<T>(
    apiMethod: ApiMethod<T>,
    sig: ReturnType<typeof signal<T>>,
    value: T,
    label: string,
  ): Promise<boolean> {
    if (!this.api || typeof apiMethod !== 'function') return false;
    try {
      const result = await apiMethod(typeof value === 'number' ? Number(value) as T : value);
      if (result.success) { sig.set(value); return true; }
      this.logger.warn(`${label} beállítás sikertelen:`, result.error);
      return false;
    } catch (err) {
      this.logger.error(`${label} beállítási hiba`, err);
      return false;
    }
  }

  setMargin(v: number) { return this.persistSetting(this.api?.setMargin, this.marginCm, v, 'Margó'); }
  setStudentSize(v: number) { return this.persistSetting(this.api?.setStudentSize, this.studentSizeCm, v, 'Diák képméret'); }
  setTeacherSize(v: number) { return this.persistSetting(this.api?.setTeacherSize, this.teacherSizeCm, v, 'Tanár képméret'); }
  setGapH(v: number) { return this.persistSetting(this.api?.setGapH, this.gapHCm, v, 'Vízszintes gap'); }
  setGapV(v: number) { return this.persistSetting(this.api?.setGapV, this.gapVCm, v, 'Függőleges gap'); }
  setNameGap(v: number) { return this.persistSetting(this.api?.setNameGap, this.nameGapCm, v, 'Név gap'); }
  setNameBreakAfter(v: number) { return this.persistSetting(this.api?.setNameBreakAfter, this.nameBreakAfter, v, 'Név tördelés'); }
  setTextAlign(v: string) { return this.persistSetting(this.api?.setTextAlign, this.textAlign, v, 'Text igazítás'); }
  setGridAlign(v: string) { return this.persistSetting(this.api?.setGridAlign, this.gridAlign, v, 'Grid igazítás'); }
  setPositionGap(v: number) { return this.persistSetting(this.api?.setPositionGap, this.positionGapCm, v, 'Pozíció gap'); }
  setPositionFontSize(v: number) { return this.persistSetting(this.api?.setPositionFontSize, this.positionFontSize, v, 'Pozíció font méret'); }

  /** Mentett beállítások betöltése detektáláskor */
  async loadSavedSettings(): Promise<void> {
    if (!this.api) return;

    const safe = <T>(fn: (() => Promise<T>) | undefined, fallback: T): Promise<T> =>
      typeof fn === 'function' ? fn().catch(() => fallback) : Promise.resolve(fallback);

    const [savedMargin, savedStudentSize, savedTeacherSize, savedGapH, savedGapV, savedNameGap, savedNameBreak, savedTextAlign, savedGridAlign, savedPositionGap, savedPositionFontSize] = await Promise.all([
      safe(this.api.getMargin, undefined as number | undefined),
      safe(this.api.getStudentSize, undefined as number | undefined),
      safe(this.api.getTeacherSize, undefined as number | undefined),
      safe(this.api.getGapH, undefined as number | undefined),
      safe(this.api.getGapV, undefined as number | undefined),
      safe(this.api.getNameGap, undefined as number | undefined),
      safe(this.api.getNameBreakAfter, undefined as number | undefined),
      safe(this.api.getTextAlign, undefined as string | undefined),
      safe(this.api.getGridAlign, undefined as string | undefined),
      safe(this.api.getPositionGap, undefined as number | undefined),
      safe(this.api.getPositionFontSize, undefined as number | undefined),
    ]);

    if (savedMargin !== undefined) this.marginCm.set(savedMargin);
    if (savedStudentSize !== undefined) this.studentSizeCm.set(savedStudentSize);
    if (savedTeacherSize !== undefined) this.teacherSizeCm.set(savedTeacherSize);
    if (savedGapH !== undefined) this.gapHCm.set(savedGapH);
    if (savedGapV !== undefined) this.gapVCm.set(savedGapV);
    if (savedNameGap !== undefined) this.nameGapCm.set(savedNameGap);
    if (savedNameBreak !== undefined) this.nameBreakAfter.set(savedNameBreak);
    if (savedTextAlign !== undefined) this.textAlign.set(savedTextAlign);
    if (savedGridAlign !== undefined) this.gridAlign.set(savedGridAlign);
    if (savedPositionGap !== undefined) this.positionGapCm.set(savedPositionGap);
    if (savedPositionFontSize !== undefined) this.positionFontSize.set(savedPositionFontSize);
  }

  /** Minta beállítások betöltése */
  async loadSampleSettings(): Promise<void> {
    const sampleApi = window.electronAPI?.sample;
    if (!sampleApi) return;
    try {
      const result = await sampleApi.getSettings();
      if (result.success && result.settings) {
        this.sampleSizeLarge.set(result.settings.sizeLarge);
        this.sampleSizeSmall.set(result.settings.sizeSmall);
        this.sampleWatermarkText.set(result.settings.watermarkText);
        this.sampleWatermarkColor.set(result.settings.watermarkColor);
        this.sampleWatermarkOpacity.set(result.settings.watermarkOpacity);
        if (result.settings.useLargeSize !== undefined) {
          this.sampleUseLargeSize.set(result.settings.useLargeSize);
        }
      }
    } catch (_) { /* Minta beállítások nem kritikus */ }
  }

  /** Minta beállítás mentése */
  async setSampleSettings(settings: Partial<{
    sizeLarge: number;
    sizeSmall: number;
    watermarkText: string;
    watermarkColor: 'white' | 'black';
    watermarkOpacity: number;
    useLargeSize: boolean;
  }>): Promise<boolean> {
    const sampleApi = window.electronAPI?.sample;
    if (!sampleApi) return false;
    try {
      const result = await sampleApi.setSettings(settings);
      if (result.success) {
        if (settings.sizeLarge !== undefined) this.sampleSizeLarge.set(settings.sizeLarge);
        if (settings.sizeSmall !== undefined) this.sampleSizeSmall.set(settings.sizeSmall);
        if (settings.watermarkText !== undefined) this.sampleWatermarkText.set(settings.watermarkText);
        if (settings.watermarkColor !== undefined) this.sampleWatermarkColor.set(settings.watermarkColor);
        if (settings.watermarkOpacity !== undefined) this.sampleWatermarkOpacity.set(settings.watermarkOpacity);
        if (settings.useLargeSize !== undefined) this.sampleUseLargeSize.set(settings.useLargeSize);
        return true;
      }
      return false;
    } catch (err) {
      this.logger.error('Minta beállítás mentési hiba', err);
      return false;
    }
  }
}
