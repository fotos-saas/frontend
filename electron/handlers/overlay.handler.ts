import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log/main';

// Overlay kontextus — melyik modban van az app
interface OverlayContext {
  mode: 'designer' | 'normal';
  projectId?: number;
}

let overlayContext: OverlayContext = { mode: 'normal' };

/**
 * Overlay IPC handlerek regisztralasa.
 * Az overlayWindow es mainWindow referenciakat kulon kapja meg.
 */
export function registerOverlayHandlers(
  getOverlayWindow: () => BrowserWindow | null,
  getMainWindow: () => BrowserWindow | null,
): void {
  // Parancs vegrehajtas: overlay → main process → mainWindow
  ipcMain.handle('overlay:execute-command', async (_event, commandId: string) => {
    if (typeof commandId !== 'string' || commandId.length > 100) {
      return { success: false, error: 'Invalid command ID' };
    }

    try {
      const mainWindow = getMainWindow();
      if (!mainWindow || mainWindow.isDestroyed()) {
        return { success: false, error: 'Main window not available' };
      }

      // Parancs tovabbitasa a mainWindow renderer process-nek
      mainWindow.webContents.send('overlay-command', commandId);
      log.info(`Overlay command forwarded: ${commandId}`);
      return { success: true };
    } catch (error) {
      log.error('Overlay execute-command failed:', error);
      return { success: false, error: 'Command execution failed' };
    }
  });

  // Kontextus lekerdezese
  ipcMain.handle('overlay:get-context', async () => {
    return overlayContext;
  });

  // Kontextus beallitasa (mainWindow jelzi ha designer nyilik/zarul)
  ipcMain.handle('overlay:set-context', async (_event, ctx: Partial<OverlayContext>) => {
    if (ctx.mode && (ctx.mode === 'designer' || ctx.mode === 'normal')) {
      overlayContext = {
        mode: ctx.mode,
        projectId: typeof ctx.projectId === 'number' ? ctx.projectId : undefined,
      };

      // Overlay ablaknak jelezzuk a kontextus valtozast
      const overlayWindow = getOverlayWindow();
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('overlay:context-changed', overlayContext);
      }

      log.info(`Overlay context set: ${overlayContext.mode}, project: ${overlayContext.projectId ?? 'none'}`);
      return { success: true };
    }

    return { success: false, error: 'Invalid context' };
  });

  // Overlay elrejtese (ESC, backdrop click)
  ipcMain.handle('overlay:hide', async () => {
    try {
      const overlayWindow = getOverlayWindow();
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.hide();
      }
      return { success: true };
    } catch (error) {
      log.error('Overlay hide failed:', error);
      return { success: false, error: 'Hide failed' };
    }
  });
}
