import { Injectable, inject, signal, computed } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';

/**
 * PhotoshopService - Photoshop eleresi ut es inditas kezelese
 *
 * Electron IPC-n keresztul kommunikal a main process-szel.
 * Bongeszoben nem mukodik (isElectron check).
 */
@Injectable({
  providedIn: 'root'
})
export class PhotoshopService {
  private readonly logger = inject(LoggerService);

  /** Photoshop eleresi ut */
  readonly path = signal<string | null>(null);

  /** Konfiguralt-e (van mentett path) */
  readonly isConfigured = computed(() => !!this.path());

  /** Ellenorzes folyamatban */
  readonly checking = signal(false);

  private get api() {
    return window.electronAPI?.photoshop;
  }

  /** Mentett path betoltese + auto-detektalas */
  async detectPhotoshop(): Promise<void> {
    if (!this.api) return;

    this.checking.set(true);
    try {
      const result = await this.api.checkInstalled();
      if (result.found && result.path) {
        this.path.set(result.path);
      }
    } catch (err) {
      this.logger.error('Photoshop detektalasi hiba', err);
    } finally {
      this.checking.set(false);
    }
  }

  /** Path beallitasa es mentese */
  async setPath(psPath: string): Promise<boolean> {
    if (!this.api) return false;

    try {
      const result = await this.api.setPath(psPath);
      if (result.success) {
        this.path.set(psPath);
        return true;
      }
      this.logger.warn('Photoshop path beallitas sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Photoshop path beallitasi hiba', err);
      return false;
    }
  }

  /** Photoshop inditasa */
  async launchPhotoshop(): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron kornyezet' };

    try {
      return await this.api.launch();
    } catch (err) {
      this.logger.error('Photoshop inditasi hiba', err);
      return { success: false, error: 'Nem sikerult elinditani' };
    }
  }

  /** Tallozas file picker-rel */
  async browseForPhotoshop(): Promise<string | null> {
    if (!this.api) return null;

    try {
      const result = await this.api.browsePath();
      if (!result.cancelled && result.path) {
        return result.path;
      }
      return null;
    } catch (err) {
      this.logger.error('Photoshop browse hiba', err);
      return null;
    }
  }
}
