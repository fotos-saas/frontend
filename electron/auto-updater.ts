import { app, ipcMain, Notification, BrowserWindow } from 'electron';
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import log from 'electron-log/main';
import { isDev, updateState, setUpdateState } from './constants';

/**
 * Send update status to renderer process
 */
function sendUpdateStatus(mainWindow: BrowserWindow | null): void {
  mainWindow?.webContents.send('update-status', updateState);
}

/**
 * Initialize auto-updater with event listeners
 */
export function initAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  // Configure auto-updater
  autoUpdater.autoDownload = false; // Manual download for user control
  autoUpdater.autoInstallOnAppQuit = true;

  // Event: Checking for updates
  autoUpdater.on('checking-for-update', () => {
    log.info('Frissites keresese...');
    setUpdateState({ ...updateState, checking: true, error: null });
    sendUpdateStatus(getMainWindow());
  });

  // Event: Update available
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('Frissites elerheto:', info.version);
    setUpdateState({
      ...updateState,
      checking: false,
      available: true,
      version: info.version,
      releaseNotes: typeof info.releaseNotes === 'string'
        ? info.releaseNotes
        : Array.isArray(info.releaseNotes)
          ? info.releaseNotes.map(n => n.note).join('\n')
          : null,
    });
    sendUpdateStatus(getMainWindow());

    // Show notification
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'Frissites elerheto',
        body: `A PhotoStack ${info.version} verzio letoltheto.`,
        silent: false,
      });
      notification.on('click', () => {
        const mainWindow = getMainWindow();
        mainWindow?.show();
        mainWindow?.focus();
      });
      notification.show();
    }
  });

  // Event: No update available
  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    log.info('Nincs uj frissites. Jelenlegi verzio:', info.version);
    setUpdateState({
      ...updateState,
      checking: false,
      available: false,
      version: info.version,
    });
    sendUpdateStatus(getMainWindow());
  });

  // Event: Download progress
  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    log.info(`Letoltes: ${Math.round(progress.percent)}%`);
    setUpdateState({
      ...updateState,
      downloading: true,
      progress: Math.round(progress.percent),
    });
    sendUpdateStatus(getMainWindow());
  });

  // Event: Update downloaded
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    log.info('Frissites letoltve:', info.version);
    setUpdateState({
      ...updateState,
      downloading: false,
      downloaded: true,
      progress: 100,
      version: info.version,
    });
    sendUpdateStatus(getMainWindow());

    // Show notification
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'Frissites telepitesre kesz',
        body: 'Kattints az ujrainditashoz es a frissites telepitesehez.',
        silent: false,
      });
      notification.on('click', () => {
        autoUpdater.quitAndInstall(false, true);
      });
      notification.show();
    }
  });

  // Event: Error
  autoUpdater.on('error', (error: Error) => {
    log.error('Frissitesi hiba:', error);
    setUpdateState({
      ...updateState,
      checking: false,
      downloading: false,
      error: error.message,
    });
    sendUpdateStatus(getMainWindow());
  });

  // Check for updates after a short delay (let app settle)
  if (!isDev) {
    setTimeout(() => {
      log.info('Automatikus frissites ellenorzes inditasa...');
      autoUpdater.checkForUpdates().catch((err) => {
        log.error('Frissites ellenorzesi hiba:', err);
      });
    }, 5000);

    // Check for updates every 4 hours
    setInterval(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        log.error('Idozitett frissites ellenorzesi hiba:', err);
      });
    }, 4 * 60 * 60 * 1000);
  }
}

/**
 * Register auto-updater IPC handlers
 */
export function registerAutoUpdaterHandlers(): void {
  // Check for updates manually
  ipcMain.handle('check-for-updates', async () => {
    log.info('Manualis frissites ellenorzes...');
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        success: true,
        updateAvailable: !!result?.updateInfo,
        version: result?.updateInfo?.version || null,
      };
    } catch (error) {
      log.error('Frissites ellenorzesi hiba:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Download update
  ipcMain.handle('download-update', async () => {
    log.info('Frissites letoltese...');
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      log.error('Frissites letoltesi hiba:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  // Install update (quit and install)
  ipcMain.handle('install-update', async () => {
    log.info('Frissites telepitese...');
    // Give the renderer a moment to clean up
    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true);
    }, 500);
    return { success: true };
  });

  // Get current update status
  ipcMain.handle('get-update-status', () => {
    return updateState;
  });
}
