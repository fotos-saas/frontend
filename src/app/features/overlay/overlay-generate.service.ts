import { Injectable, inject, NgZone, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OverlayProjectService } from './overlay-project.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlayContext } from '../../core/services/electron.types';

/**
 * Minta + végleges generálás (flatten → export → upload).
 */
@Injectable()
export class OverlayGenerateService {
  private readonly ngZone = inject(NgZone);
  private readonly project = inject(OverlayProjectService);
  private readonly settings = inject(OverlaySettingsService);
  private readonly polling = inject(OverlayPollingService);

  readonly generating = signal<'sample' | 'final' | null>(null);
  readonly generateResult = signal<{ success: boolean; message: string } | null>(null);

  async confirmGenerate(type: 'sample' | 'final', context: OverlayContext): Promise<void> {
    if (!window.electronAPI || this.generating()) return;
    this.generating.set(type);
    this.generateResult.set(null);
    try {
      if (type === 'sample') { await this.doGenerateSample(context); }
      else { await this.doGenerateFinal(context); }
    } catch {
      this.ngZone.run(() => this.generateResult.set({ success: false, message: 'Váratlan hiba' }));
    } finally {
      this.ngZone.run(() => this.generating.set(null));
    }
  }

  private async doGenerateSample(context: OverlayContext): Promise<void> {
    const api = window.electronAPI!;
    const psdPath = this.polling.activeDoc().path;
    if (!psdPath) { this.setError('Nincs megnyitott PSD'); return; }
    const psdDir = psdPath.replace(/[/\\][^/\\]+$/, '');
    const pid = await this.project.resolveProjectId(context);
    if (!pid) { this.setError('Nincs projekt azonosító'); return; }

    const flattenResult = await api.photoshop.runJsx({ scriptName: 'actions/flatten-export.jsx', jsonData: { quality: 95 } });
    if (!flattenResult.success) { this.setError(flattenResult.error || 'Flatten hiba'); return; }
    const okMatch = (flattenResult.output || '').match(/__FLATTEN_RESULT__OK:(.+)/);
    if (!okMatch) { this.setError('Flatten nem adott eredményt'); return; }
    const tempJpg = okMatch[1].trim();

    const authToken = sessionStorage.getItem('marketer_token') || '';
    const projectName = this.polling.activeDoc().name?.replace(/\.(psd|psb|pdd)$/i, '') || 'tablo';
    const sizeWidth = this.settings.sampleUseLargeSize() ? 4000 : 2000;
    const result = await api.sample.generate({
      psdFilePath: tempJpg, outputDir: psdDir, projectId: pid, projectName,
      apiBaseUrl: (window as { __env__?: { apiUrl?: string } }).__env__?.apiUrl || environment.apiUrl,
      authToken, watermarkText: 'MINTA', watermarkColor: this.settings.sampleWatermarkColor(),
      watermarkOpacity: this.settings.sampleWatermarkOpacity(), sampleVersion: this.settings.sampleVersion(),
      sizes: [{ name: 'minta', width: sizeWidth }],
    });
    this.ngZone.run(() => {
      if (result.success) { this.generateResult.set({ success: true, message: `Minta kész (feltöltés háttérben)` }); }
      else { this.generateResult.set({ success: false, message: result.error || 'Minta generálás sikertelen' }); }
    });
  }

  private async doGenerateFinal(context: OverlayContext): Promise<void> {
    const api = window.electronAPI!;
    const psdPath = this.polling.activeDoc().path;
    if (!psdPath) { this.setError('Nincs megnyitott PSD'); return; }
    const psdDir = psdPath.replace(/[/\\][^/\\]+$/, '');
    const pid = await this.project.resolveProjectId(context);
    if (!pid) { this.setError('Nincs projekt azonosító'); return; }

    const flattenResult = await api.photoshop.runJsx({ scriptName: 'actions/flatten-export.jsx', jsonData: { quality: 95 } });
    if (!flattenResult.success) { this.setError(flattenResult.error || 'Flatten hiba'); return; }
    const okMatch = (flattenResult.output || '').match(/__FLATTEN_RESULT__OK:(.+)/);
    if (!okMatch) { this.setError('Flatten nem adott eredményt'); return; }
    const tempJpg = okMatch[1].trim();

    const authToken = sessionStorage.getItem('marketer_token') || '';
    const projectName = this.polling.activeDoc().name?.replace(/\.(psd|psb|pdd)$/i, '') || 'tablo';
    const apiUrl = (window as { __env__?: { apiUrl?: string } }).__env__?.apiUrl || environment.apiUrl;
    const commonParams = { flattenedJpgPath: tempJpg, outputDir: psdDir, projectId: pid, projectName, apiBaseUrl: apiUrl, authToken };

    const [flatResult, smallResult] = await Promise.all([
      api.finalizer.upload({ ...commonParams, type: 'flat' as const }),
      api.finalizer.upload({ ...commonParams, type: 'small_tablo' as const, maxSize: 3000 }),
    ]);
    const results: string[] = [];
    const errors: string[] = [];
    if (flatResult.success && (flatResult.uploadedCount ?? 0) > 0) results.push('Flat');
    else errors.push(flatResult.error || 'Flat feltöltés sikertelen');
    if (smallResult.success && (smallResult.uploadedCount ?? 0) > 0) results.push('Kistabló');
    else errors.push(smallResult.error || 'Kistabló feltöltés sikertelen');
    const totalUploaded = (flatResult.uploadedCount ?? 0) + (smallResult.uploadedCount ?? 0);
    this.ngZone.run(() => {
      if (results.length > 0) { this.generateResult.set({ success: true, message: `Véglegesítve: ${results.join(' + ')} (${totalUploaded} feltöltve)` }); }
      else { this.generateResult.set({ success: false, message: errors.join('; ') || 'Feltöltés sikertelen' }); }
    });
  }

  private setError(message: string): void {
    this.ngZone.run(() => this.generateResult.set({ success: false, message }));
  }
}
