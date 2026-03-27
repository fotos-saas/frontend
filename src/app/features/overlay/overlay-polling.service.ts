import { Injectable, inject, NgZone, DestroyRef, signal } from '@angular/core';
import { ActiveDocInfo } from '../../core/services/electron.types';

const POLL_NORMAL = 5000;
const POLL_TURBO = 1000;
const TURBO_DURATION = 2 * 60 * 1000;

/**
 * Polling + visibility + turbo mód kezelés az overlay-hez.
 * Az aktív PSD doc állapotát kérdezi le periodikusan.
 */
@Injectable()
export class OverlayPollingService {
  private readonly ngZone = inject(NgZone);

  readonly isTurbo = signal(false);
  readonly isEnabled = signal(true);
  readonly activeDoc = signal<ActiveDocInfo>({ name: null, path: null, dir: null });

  /** PS busy — ha true, a polling kihagyja a hívást */
  readonly psBusy = signal(false);

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private turboTimeout: ReturnType<typeof setTimeout> | null = null;
  private isVisible = true;
  private lastPollInterval = POLL_NORMAL;
  private pollCallback: (() => Promise<void>) | null = null;

  /**
   * Polling indítása. A callback-et hívja meg minden poll ciklusban.
   */
  startPolling(destroyRef: DestroyRef, callback: () => Promise<void>): void {
    if (!window.electronAPI) return;
    this.pollCallback = callback;
    this.lastPollInterval = POLL_NORMAL;
    this.executePoll();
    this.pollTimer = setInterval(() => this.executePoll(), POLL_NORMAL);
    destroyRef.onDestroy(() => {
      if (this.pollTimer) clearInterval(this.pollTimer);
      if (this.turboTimeout) clearTimeout(this.turboTimeout);
    });
  }

  /**
   * Visibility kezelés — elrejtett ablak esetén szünetelteti a pollingot.
   */
  listenVisibility(destroyRef: DestroyRef): void {
    const handler = (): void => {
      const hidden = document.hidden;
      if (hidden && this.isVisible) {
        this.isVisible = false;
        this.pausePolling();
      } else if (!hidden && !this.isVisible) {
        this.isVisible = true;
        this.resumePolling();
      }
    };
    document.addEventListener('visibilitychange', handler);
    destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', handler));
  }

  toggleEnabled(): void {
    const enabling = !this.isEnabled();
    this.isEnabled.set(enabling);
    if (enabling) {
      this.resumePolling();
    } else {
      if (this.isTurbo()) this.stopTurbo();
      this.pausePolling();
    }
  }

  toggleTurbo(): void {
    if (!this.isEnabled()) return;
    if (this.isTurbo()) {
      this.stopTurbo();
    } else {
      this.isTurbo.set(true);
      this.restartPolling(POLL_TURBO);
      this.turboTimeout = setTimeout(() => this.stopTurbo(), TURBO_DURATION);
    }
  }

  /**
   * ActiveDoc frissítése mergelve (selectedLayers megőrzéssel).
   */
  mergeActiveDoc(doc: ActiveDocInfo): void {
    const current = this.activeDoc();
    this.activeDoc.set({
      ...doc,
      selectedLayers: doc.selectedLayers ?? current.selectedLayers,
    });
  }

  getIsVisible(): boolean {
    return this.isVisible;
  }

  private stopTurbo(): void {
    this.isTurbo.set(false);
    if (this.turboTimeout) {
      clearTimeout(this.turboTimeout);
      this.turboTimeout = null;
    }
    this.restartPolling(POLL_NORMAL);
  }

  private restartPolling(interval: number): void {
    this.lastPollInterval = interval;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.isVisible) {
      this.pollTimer = setInterval(() => this.executePoll(), interval);
    }
  }

  pausePolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  resumePolling(): void {
    if (!this.isEnabled()) return;
    const interval = this.isTurbo() ? POLL_TURBO : this.lastPollInterval;
    this.executePoll();
    this.pollTimer = setInterval(() => this.executePoll(), interval);
  }

  private executePoll(): void {
    if (!this.isEnabled() || !this.isVisible || !this.pollCallback || this.psBusy()) return;
    this.pollCallback();
  }
}
