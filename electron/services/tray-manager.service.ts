/**
 * TrayManagerService — Tray ikon kezelés background módban
 *
 * - Narancssárga badge ha van feladat
 * - Kontextus menü: Megnyitás, Szünet/Folytatás, Kilépés
 * - macOS notification küldés
 */

import { Tray, Menu, nativeImage, app, Notification, shell } from 'electron';
import * as path from 'path';
import log from 'electron-log/main';

export class TrayManagerService {
  private tray: Tray | null = null;
  private isPaused = false;
  private pendingCount = 0;
  private onPauseToggle: (() => void) | null = null;

  create(callbacks?: { onPauseToggle?: () => void }): void {
    if (this.tray) return;

    this.onPauseToggle = callbacks?.onPauseToggle ?? null;

    const iconPath = this.getIconPath('idle');
    const icon = nativeImage.createFromPath(iconPath);

    this.tray = new Tray(icon.resize({ width: 18, height: 18 }));
    this.tray.setToolTip('PhotoStack — Előkészítő');
    this.updateContextMenu();

    log.info('Tray ikon letrehozva (background mod)');
  }

  destroy(): void {
    this.tray?.destroy();
    this.tray = null;
  }

  setPendingCount(count: number): void {
    this.pendingCount = count;
    if (count > 0) {
      this.tray?.setImage(nativeImage.createFromPath(this.getIconPath('active')).resize({ width: 18, height: 18 }));
      this.tray?.setToolTip(`PhotoStack — ${count} feladat várakozik`);
    } else {
      this.tray?.setImage(nativeImage.createFromPath(this.getIconPath('idle')).resize({ width: 18, height: 18 }));
      this.tray?.setToolTip('PhotoStack — Előkészítő');
    }
    this.updateContextMenu();
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.updateContextMenu();
    const state = paused ? 'szüneteltetve' : 'aktív';
    log.info(`Workflow poller: ${state}`);
  }

  showNotification(title: string, body: string): void {
    if (!Notification.isSupported()) return;

    const notification = new Notification({
      title,
      body,
      silent: false,
    });
    notification.show();
  }

  private updateContextMenu(): void {
    if (!this.tray) return;

    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: `PhotoStack Előkészítő${this.pendingCount > 0 ? ` (${this.pendingCount})` : ''}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Megnyitás böngészőben',
        click: () => {
          shell.openExternal('https://tablostudio.hu/partner/workflows');
        },
      },
      {
        label: this.isPaused ? 'Folytatás' : 'Szünet',
        click: () => {
          this.isPaused = !this.isPaused;
          this.onPauseToggle?.();
          this.updateContextMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Kilépés',
        click: () => {
          app.quit();
        },
      },
    ];

    this.tray.setContextMenu(Menu.buildFromTemplate(template));
  }

  private getIconPath(state: 'idle' | 'active'): string {
    const iconName = state === 'active' ? 'tray-active.png' : 'tray-idle.png';
    return app.isPackaged
      ? path.join(process.resourcesPath, 'assets', iconName)
      : path.join(__dirname, '..', '..', 'assets', iconName);
  }
}
