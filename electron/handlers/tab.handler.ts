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
    const isMod = process.platform === 'darwin' ? input.meta : input.control;
    if (!isMod || input.type !== 'keyDown') return;

    switch (input.key.toLowerCase()) {
      case 't':
        event.preventDefault();
        mainWindow.webContents.send('tab:new-tab');
        break;

      case 'w':
        event.preventDefault();
        mainWindow.webContents.send('tab:close-tab');
        break;

      case 'tab':
        // Ctrl+Tab (NEM Cmd+Tab macOS-en, az rendszer szintu)
        if (!input.meta || !input.control) {
          event.preventDefault();
          if (input.shift) {
            mainWindow.webContents.send('tab:prev-tab');
          } else {
            mainWindow.webContents.send('tab:next-tab');
          }
        }
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
