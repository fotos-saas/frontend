import { Injectable, signal, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

interface BundleInfo {
  id: string;
  version: string;
  downloaded: string;
  checksum: string;
  status: string;
}

/**
 * App Update Service - OTA Updates with Capgo
 *
 * Allows instant updates without App Store review.
 * Only JS/HTML/CSS can be updated, not native code.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly logger = inject(LoggerService);
  // Update state
  readonly updateAvailable = signal(false);
  readonly downloading = signal(false);
  readonly downloadProgress = signal(0);
  readonly currentVersion = signal<string | null>(null);
  readonly latestVersion = signal<string | null>(null);

  private initialized = false;

  constructor() {
    if (Capacitor.isNativePlatform()) {
      this.initialize();
    }
  }

  /**
   * Initialize the updater and check for updates
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      // Notify that the app is ready (important for rollback protection)
      await CapacitorUpdater.notifyAppReady();

      // Get current bundle info
      const current = await CapacitorUpdater.current();
      if (current.bundle.version) {
        this.currentVersion.set(current.bundle.version);
      }

      // Listen for update events
      CapacitorUpdater.addListener('updateAvailable', (info) => {
        this.logger.info('Update available', info);
        this.updateAvailable.set(true);
        this.latestVersion.set(info.bundle.version);
      });

      // Note: Capgo event names - extended event listener interface
      type CapgoUpdater = typeof CapacitorUpdater & {
        addListener(event: 'download', callback: (state: { percent: number }) => void): void;
        addListener(event: 'downloadComplete', callback: (bundle: BundleInfo) => void): void;
        addListener(event: 'downloadFailed', callback: (error: { version: string }) => void): void;
        addListener(event: 'updateFailed', callback: (error: { version: string }) => void): void;
      };
      const updater = CapacitorUpdater as unknown as CapgoUpdater;

      updater.addListener('download', (state: { percent: number }) => {
        this.downloadProgress.set(state.percent);
      });

      updater.addListener('downloadComplete', (bundle: BundleInfo) => {
        this.logger.info('Download complete', bundle);
        this.downloading.set(false);
      });

      updater.addListener('downloadFailed', (error: { version: string }) => {
        this.logger.error('Download failed', error);
        this.downloading.set(false);
      });

      updater.addListener('updateFailed', (error: { version: string }) => {
        this.logger.error('Update failed', error);
        // The plugin will automatically rollback
      });

      // Check for updates
      await this.checkForUpdate();

    } catch (error) {
      this.logger.error('AppUpdateService initialization error', error);
    }
  }

  /**
   * Check for available updates
   */
  async checkForUpdate(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const latest = await CapacitorUpdater.getLatest();
      if (latest.version) {
        this.latestVersion.set(latest.version);

        const current = await CapacitorUpdater.current();
        if (current.bundle.version !== latest.version) {
          this.updateAvailable.set(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      this.logger.error('Failed to check for updates', error);
      return false;
    }
  }

  /**
   * Download and install the latest update
   * @param reloadImmediately - If true, reload the app immediately after download
   */
  async downloadAndInstall(reloadImmediately = false): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || !this.updateAvailable()) {
      return false;
    }

    this.downloading.set(true);
    this.downloadProgress.set(0);

    try {
      // Download the bundle
      const bundle = await CapacitorUpdater.download({
        url: '', // Capgo will use the configured URL
        version: this.latestVersion()!,
      });

      // Set the bundle to be used on next reload
      await CapacitorUpdater.set(bundle);

      if (reloadImmediately) {
        await CapacitorUpdater.reload();
      }

      this.updateAvailable.set(false);
      return true;

    } catch (error) {
      this.logger.error('Failed to download update', error);
      this.downloading.set(false);
      return false;
    }
  }

  /**
   * Get list of downloaded bundles
   */
  async getDownloadedBundles(): Promise<BundleInfo[]> {
    if (!Capacitor.isNativePlatform()) return [];

    try {
      const result = await CapacitorUpdater.list();
      return result.bundles;
    } catch (error) {
      this.logger.error('Failed to get bundles', error);
      return [];
    }
  }

  /**
   * Delete a specific bundle
   */
  async deleteBundle(id: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      await CapacitorUpdater.delete({ id });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete bundle', error);
      return false;
    }
  }

  /**
   * Reset to the built-in bundle (factory reset)
   */
  async resetToBuiltin(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      await CapacitorUpdater.reset();
      await CapacitorUpdater.reload();
      return true;
    } catch (error) {
      this.logger.error('Failed to reset', error);
      return false;
    }
  }
}
