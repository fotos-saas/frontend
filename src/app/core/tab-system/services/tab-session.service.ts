/**
 * TabSessionService — tab session perzisztencia electron-store-ba
 */

import { Injectable, inject, NgZone } from '@angular/core';
import { ElectronService } from '../../services/electron.service';
import { LoggerService } from '../../services/logger.service';
import type { TabSession } from '../models/tab.model';

const SESSION_KEY = 'tab-session';

@Injectable({ providedIn: 'root' })
export class TabSessionService {
  private readonly electronService = inject(ElectronService);
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Session mentes (debounce-olt, 500ms) */
  save(session: TabSession): void {
    if (!this.electronService.isElectron) return;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(session);
      this.saveTimeout = null;
    }, 500);
  }

  /** Azonnali mentes (app bezaraskor) */
  saveImmediate(session: TabSession): void {
    if (!this.electronService.isElectron) return;

    try {
      window.electronAPI!.cache.set(SESSION_KEY, {
        ...session,
        savedAt: Date.now(),
      });
      this.logger.debug('Tab session mentve', { tabCount: session.tabs.length });
    } catch (error) {
      this.logger.error('Tab session mentes sikertelen', error);
    }
  }

  /** Session betoltes */
  async load(): Promise<TabSession | null> {
    if (!this.electronService.isElectron) return null;

    try {
      const data = await window.electronAPI!.cache.get(SESSION_KEY);
      if (!data || typeof data !== 'object') return null;

      const session = data as TabSession;

      // Validalas
      if (!Array.isArray(session.tabs) || session.tabs.length === 0) {
        return null;
      }

      this.logger.info('Tab session betoltve', { tabCount: session.tabs.length });
      return session;
    } catch (error) {
      this.logger.error('Tab session betoltes sikertelen', error);
      return null;
    }
  }

  /** Session torles */
  clear(): void {
    if (!this.electronService.isElectron) return;

    try {
      window.electronAPI!.cache.delete(SESSION_KEY);
    } catch (error) {
      this.logger.error('Tab session torles sikertelen', error);
    }
  }
}
