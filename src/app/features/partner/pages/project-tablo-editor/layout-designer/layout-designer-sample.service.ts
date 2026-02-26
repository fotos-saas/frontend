import { Injectable, inject, signal } from '@angular/core';
import { PhotoshopService } from '../../../services/photoshop.service';

/**
 * LayoutDesignerSampleService — Minta/végleges generálás a designer-ből.
 */
@Injectable()
export class LayoutDesignerSampleService {
  private readonly ps = inject(PhotoshopService);

  readonly generatingSample = signal(false);
  readonly generatingFinal = signal(false);
  readonly finalMode = signal<'flat' | 'small_tablo' | 'both'>('both');
  readonly sampleSuccess = signal<string | null>(null);
  readonly sampleError = signal<string | null>(null);

  private _projectId = 0;
  private _projectName = '';
  private _schoolName: string | null = null;
  private _className: string | null = null;

  configure(opts: { projectId: number; projectName: string; schoolName: string | null; className: string | null }): void {
    this._projectId = opts.projectId;
    this._projectName = opts.projectName;
    this._schoolName = opts.schoolName;
    this._className = opts.className;
  }

  onLargeSizeChange(value: boolean): void {
    this.ps.sampleUseLargeSize.set(value);
    this.ps.setSampleSettings({ useLargeSize: value });
  }

  onCycleOpacity(): void {
    const pct = Math.round(this.ps.sampleWatermarkOpacity() * 100);
    const next = (pct >= 23 ? 10 : pct + 1) / 100;
    this.ps.sampleWatermarkOpacity.set(next);
    this.ps.setSampleSettings({ watermarkOpacity: next });
  }

  onWatermarkColorChange(color: 'white' | 'black'): void {
    this.ps.sampleWatermarkColor.set(color);
    this.ps.setSampleSettings({ watermarkColor: color });
  }

  /** Minta generálás */
  async onGenerateSample(): Promise<void> {
    if (this.generatingSample()) return;
    this.generatingSample.set(true);
    this.sampleSuccess.set(null);
    this.sampleError.set(null);
    try {
      const result = await this.ps.generateSample(
        this._projectId, this._projectName, this.ps.sampleUseLargeSize(),
        { schoolName: this._schoolName, className: this._className },
      );
      if (result.success) {
        this.sampleSuccess.set(`${result.localPaths?.length || 0} fájl mentve, ${result.uploadedCount || 0} feltöltve`);
      } else {
        this.sampleError.set(result.error || 'Minta generálás sikertelen');
      }
    } catch { this.sampleError.set('Váratlan hiba a minta generálásnál'); }
    finally { this.generatingSample.set(false); }
  }

  /** Véglegesítés mód váltás */
  onCycleFinalMode(): void {
    const modes: Array<'flat' | 'small_tablo' | 'both'> = ['both', 'flat', 'small_tablo'];
    const idx = modes.indexOf(this.finalMode());
    this.finalMode.set(modes[(idx + 1) % modes.length]);
  }

  /** Véglegesítés */
  async onGenerateFinal(): Promise<void> {
    if (this.generatingFinal()) return;
    this.generatingFinal.set(true);
    this.sampleSuccess.set(null);
    this.sampleError.set(null);

    const mode = this.finalMode();
    const results: string[] = [];
    const errors: string[] = [];
    const ctx = { schoolName: this._schoolName, className: this._className };

    try {
      if (mode === 'flat' || mode === 'both') {
        const r = await this.ps.generateFinal(this._projectId, this._projectName, ctx);
        if (r.success && r.uploadedCount && r.uploadedCount > 0) results.push('Flat');
        else errors.push(r.error || 'Flat feltöltés sikertelen');
      }
      if (mode === 'small_tablo' || mode === 'both') {
        const r = await this.ps.generateSmallTablo(this._projectId, this._projectName, ctx);
        if (r.success && r.uploadedCount && r.uploadedCount > 0) results.push('Kistabló');
        else errors.push(r.error || 'Kistabló feltöltés sikertelen');
      }
      if (results.length > 0) this.sampleSuccess.set(`Feltöltve: ${results.join(' + ')}`);
      if (errors.length > 0) this.sampleError.set(errors.join('; '));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.sampleError.set(`Véglegesítés hiba: ${msg}`);
    } finally { this.generatingFinal.set(false); }
  }
}
