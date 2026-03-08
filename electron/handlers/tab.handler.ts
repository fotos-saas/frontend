/**
 * Tab Handler — Electron billentyuparancsok kezelese a tab rendszerhez
 *
 * A before-input-event-ben elfogja a Cmd/Ctrl+T, W, Tab, 1-9 billentyuket,
 * es IPC-vel kuldi az Angular renderernek.
 */

import { BrowserWindow } from 'electron';
import log from 'electron-log/main';

export function registerTabHandlers(mainWindow: BrowserWindow): void {
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    const isMac = process.platform === 'darwin';
    const isMod = isMac ? input.meta : input.control;
    const key = input.key.toLowerCase();

    // Ctrl+Tab / Ctrl+Shift+Tab — mindket platformon Ctrl-tel (macOS-en Cmd+Tab rendszer szintu)
    if (key === 'tab' && input.control) {
      event.preventDefault();
      if (input.shift) {
        mainWindow.webContents.send('tab:prev-tab');
      } else {
        mainWindow.webContents.send('tab:next-tab');
      }
      return;
    }

    // Cmd/Ctrl + billentyuk
    if (!isMod) return;

    switch (key) {
      case 't':
        event.preventDefault();
        mainWindow.webContents.send('tab:new-tab');
        break;

      case 'w':
        event.preventDefault();
        mainWindow.webContents.send('tab:close-tab');
        break;

      default: {
        const num = parseInt(input.key, 10);
        if (num >= 1 && num <= 9) {
          event.preventDefault();
          mainWindow.webContents.send('tab:switch-to', num);
        }
        break;
      }
    }
  });

  log.info('Tab handlers registered');
}
