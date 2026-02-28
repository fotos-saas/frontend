/**
 * ElectronSyncService — LAN szinkronizálás Angular service
 *
 * Signal-alapú state management, IPC bridge delegálás
 */

import { Injectable, NgZone, DestroyRef, inject, signal, computed } from '@angular/core';
import { LoggerService } from './logger.service';
import type {
  SyncPeer,
  SyncPairedPeer,
  SyncProgressData,
  SyncState,
  SyncSettings,
} from './electron.types';

@Injectable({ providedIn: 'root' })
export class ElectronSyncService {
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cleanupFunctions: Array<() => void> = [];

  // ============ Signals ============

  private readonly _syncState = signal<SyncState>('disabled');
  private readonly _syncEnabled = signal<boolean>(false);
  private readonly _discoveredPeers = signal<SyncPeer[]>([]);
  private readonly _pairedPeers = signal<SyncPairedPeer[]>([]);
  private readonly _currentTransfer = signal<SyncProgressData | null>(null);
  private readonly _pairingCode = signal<string | null>(null);
  private readonly _lastError = signal<string | null>(null);
  private readonly _deviceName = signal<string>('');

  readonly syncState = this._syncState.asReadonly();
  readonly syncEnabled = this._syncEnabled.asReadonly();
  readonly discoveredPeers = this._discoveredPeers.asReadonly();
  readonly pairedPeers = this._pairedPeers.asReadonly();
  readonly currentTransfer = this._currentTransfer.asReadonly();
  readonly pairingCode = this._pairingCode.asReadonly();
  readonly lastError = this._lastError.asReadonly();
  readonly deviceName = this._deviceName.asReadonly();

  readonly isSyncing = computed(() => this._syncState() === 'syncing');
  readonly isSearching = computed(() => this._syncState() === 'searching');
  readonly isConnected = computed(() =>
    this._syncState() === 'idle' || this._syncState() === 'syncing'
  );
  readonly hasError = computed(() => this._syncState() === 'error');

  private get api() {
    return window.electronAPI?.sync;
  }

  private get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  constructor() {
    if (this.isElectron) {
      this.initListeners();
      this.loadInitialState();
    }

    this.destroyRef.onDestroy(() => {
      this.cleanupFunctions.forEach(fn => fn());
      this.cleanupFunctions.length = 0;
    });
  }

  // ============ Publikus metódusok ============

  async enable(userId: string, workspacePath: string): Promise<boolean> {
    if (!this.api) return false;
    const result = await this.api.enable({ userId, workspacePath });
    if (result.success) {
      this._syncEnabled.set(true);
      this.logger.info('LAN sync bekapcsolva');
    } else {
      this._lastError.set(result.error || 'Bekapcsolás sikertelen');
    }
    return result.success;
  }

  async disable(): Promise<boolean> {
    if (!this.api) return false;
    const result = await this.api.disable();
    if (result.success) {
      this._syncEnabled.set(false);
      this._syncState.set('disabled');
      this._discoveredPeers.set([]);
      this._currentTransfer.set(null);
      this._pairingCode.set(null);
      this.logger.info('LAN sync kikapcsolva');
    }
    return result.success;
  }

  async generatePairingCode(): Promise<string | null> {
    if (!this.api) return null;
    const result = await this.api.pair();
    if (result.success && result.mode === 'generate') {
      this._pairingCode.set(result.code);
      return result.code;
    }
    return null;
  }

  async pairWithPeer(peerId: string, code: string): Promise<boolean> {
    if (!this.api) return false;
    const result = await this.api.pairWithPeer({ peerId, code });
    if (result.success) {
      this._pairingCode.set(null);
      await this.refreshPeers();
      this.logger.info('Peer párosítva');
    } else {
      this._lastError.set(result.error || 'Párosítás sikertelen');
    }
    return result.success;
  }

  async acceptPair(peerId: string, code: string): Promise<boolean> {
    if (!this.api) return false;
    const result = await this.api.acceptPair({ peerId, code });
    if (result.success) {
      await this.refreshPeers();
      this.logger.info('Párosítás elfogadva');
    }
    return result.success;
  }

  async unpair(peerId: string): Promise<boolean> {
    if (!this.api) return false;
    const result = await this.api.unpair(peerId);
    if (result.success) {
      await this.refreshPeers();
      this.logger.info('Párosítás törölve');
    }
    return result.success;
  }

  async forceSync(): Promise<boolean> {
    if (!this.api) return false;
    const result = await this.api.forceSync();
    if (!result.success) {
      this._lastError.set(result.error || 'Szinkronizálás sikertelen');
    }
    return result.success;
  }

  async getSettings(): Promise<SyncSettings | null> {
    if (!this.api) return null;
    const result = await this.api.getSettings();
    return result.success ? (result.settings || null) : null;
  }

  async setSettings(settings: { ignorePatterns?: string[] }): Promise<boolean> {
    if (!this.api) return false;
    const result = await this.api.setSettings(settings);
    return result.success;
  }

  async refreshPeers(): Promise<void> {
    if (!this.api) return;
    const result = await this.api.getPeers();
    if (result.success) {
      this.ngZone.run(() => {
        this._discoveredPeers.set(result.discovered as SyncPeer[]);
        this._pairedPeers.set(result.paired as SyncPairedPeer[]);
      });
    }
  }

  clearError(): void {
    this._lastError.set(null);
  }

  // ============ Privát metódusok ============

  private async loadInitialState(): Promise<void> {
    if (!this.api) return;
    try {
      const status = await this.api.getStatus();
      if (status.success) {
        this.ngZone.run(() => {
          this._syncState.set(status.state as SyncState);
          this._syncEnabled.set(status.enabled);
          this._deviceName.set(status.deviceName);
          this._pairedPeers.set(status.pairedPeers as SyncPairedPeer[]);
          this._discoveredPeers.set(status.discoveredPeers as SyncPeer[]);
        });
      }
    } catch (err) {
      this.logger.error('Sync állapot betöltés hiba:', err);
    }
  }

  private initListeners(): void {
    if (!this.api) return;

    const cleanupStatus = this.api.onStatusChanged((data) => {
      this.ngZone.run(() => this._syncState.set(data.state as SyncState));
    });
    this.cleanupFunctions.push(cleanupStatus);

    const cleanupDiscovered = this.api.onPeerDiscovered((peer) => {
      this.ngZone.run(() => {
        const current = this._discoveredPeers();
        const typedPeer = peer as SyncPeer;
        const existing = current.findIndex(p => p.id === typedPeer.id);
        if (existing >= 0) {
          const updated = [...current];
          updated[existing] = typedPeer;
          this._discoveredPeers.set(updated);
        } else {
          this._discoveredPeers.set([...current, typedPeer]);
        }
      });
    });
    this.cleanupFunctions.push(cleanupDiscovered);

    const cleanupLost = this.api.onPeerLost((peer) => {
      this.ngZone.run(() => {
        const typedPeer = peer as SyncPeer;
        this._discoveredPeers.set(
          this._discoveredPeers().filter(p => p.id !== typedPeer.id)
        );
      });
    });
    this.cleanupFunctions.push(cleanupLost);

    const cleanupProgress = this.api.onProgress((progress) => {
      this.ngZone.run(() => this._currentTransfer.set(progress));
    });
    this.cleanupFunctions.push(cleanupProgress);

    const cleanupError = this.api.onError((data) => {
      this.ngZone.run(() => {
        this._lastError.set(data.message);
        this.logger.error('Sync hiba:', data.message);
      });
    });
    this.cleanupFunctions.push(cleanupError);
  }
}
