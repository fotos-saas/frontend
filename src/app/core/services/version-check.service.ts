import { Injectable, inject, signal, NgZone, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { VersionInfo } from '../models/version.model';
import { BUILD_HASH } from '../constants/build-version';

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const MIN_POLL_GAP_MS = 30 * 1000;
const INITIAL_DELAY_MS = 10_000;

/**
 * Web verzio-ellenorzo service
 *
 * Periodikusan lekerdezi a /version.json-t es osszehasonlitja
 * az aktualis build hash-sel. Ha elteres van, jelzi a frissites szuksegesseget.
 *
 * Csak production web platformon aktiv (nem Electron, nem Capacitor, nem dev).
 */
@Injectable({ providedIn: 'root' })
export class VersionCheckService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly updateAvailable = signal(false);
  readonly currentHash = signal(BUILD_HASH);
  readonly latestHash = signal<string | null>(null);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private initialTimerId: ReturnType<typeof setTimeout> | null = null;
  private lastPollTime = 0;
  private started = false;

  startPolling(): void {
    if (this.started) return;
    if (!isPlatformBrowser(this.platformId)) return;

    if (!environment.production) {
      this.logger.info('[VersionCheck] Dev mód, polling kihagyva');
      return;
    }

    if (this.isElectron() || this.isCapacitor()) {
      this.logger.info('[VersionCheck] Natív platform, polling kihagyva');
      return;
    }

    this.started = true;
    this.logger.info('[VersionCheck] Polling indítása, aktuális hash:', BUILD_HASH);

    this.ngZone.runOutsideAngular(() => {
      this.initialTimerId = setTimeout(() => this.checkForUpdate(), INITIAL_DELAY_MS);
      this.intervalId = setInterval(() => this.checkForUpdate(), POLL_INTERVAL_MS);
    });

    this.setupVisibilityListener();
    this.destroyRef.onDestroy(() => this.stopPolling());
  }

  stopPolling(): void {
    if (this.initialTimerId) {
      clearTimeout(this.initialTimerId);
      this.initialTimerId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.started = false;
  }

  reloadPage(): void {
    window.location.reload();
  }

  private checkForUpdate(): void {
    const now = Date.now();
    if (now - this.lastPollTime < MIN_POLL_GAP_MS) return;
    this.lastPollTime = now;

    const cacheBuster = `?_=${now}`;

    this.http.get<VersionInfo>(`/version.json${cacheBuster}`).subscribe({
      next: (serverVersion) => {
        const current = this.currentHash();
        if (current && current !== serverVersion.hash) {
          this.logger.info(
            '[VersionCheck] Új verzió elérhető!',
            `Aktuális: ${current}, Szerveren: ${serverVersion.hash}`
          );
          this.ngZone.run(() => {
            this.latestHash.set(serverVersion.hash);
            this.updateAvailable.set(true);
          });
        } else {
          this.ngZone.run(() => this.latestHash.set(serverVersion.hash));
        }
      },
      error: () => {
        // Halozati hiba - csendben ignoraljuk
      }
    });
  }

  private setupVisibilityListener(): void {
    const handler = (): void => {
      if (document.visibilityState === 'visible') {
        this.logger.debug('[VersionCheck] Tab aktiv, verzio ellenorzes...');
        this.checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handler);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', handler);
    });
  }

  private isElectron(): boolean {
    return !!(window as unknown as { electronAPI?: unknown }).electronAPI;
  }

  private isCapacitor(): boolean {
    const win = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    return !!win.Capacitor?.isNativePlatform?.();
  }
}
