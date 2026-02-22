import { ipcMain, BrowserWindow, shell } from 'electron';
import log from 'electron-log/main';

// Overlay kontextus — melyik modban van az app
interface OverlayContext {
  mode: 'designer' | 'normal';
  projectId?: number;
}

// Aktiv PS dokumentum infoja
interface ActiveDocInfo {
  name: string | null;
  path: string | null;
  dir: string | null;
}

let overlayContext: OverlayContext = { mode: 'normal' };
let lastActiveDoc: ActiveDocInfo = { name: null, path: null, dir: null };

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
      // Specialis overlay parancsok — kozvetlenul kezeljuk
      if (commandId === 'ps-open-workdir' || commandId === 'open-workdir') {
        return handleOpenWorkDir();
      }

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

  // Overlay elrejtese
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

  // Aktiv PS dokumentum lekerdezese (cached)
  ipcMain.handle('overlay:get-active-doc', async () => {
    return lastActiveDoc;
  });

  // Aktiv PS dokumentum frissitese (az overlay vagy a polling hivja)
  ipcMain.handle('overlay:poll-active-doc', async () => {
    try {
      // A get-active-doc.jsx-et a photoshop:run-jsx IPC-vel futtatjuk
      // De itt kozvetlenul is megcsinalhatjuk az overlay handler-bol
      // Inkabb tovabbitjuk a mainWindow-nak hogy futtassa
      const mainWindow = getMainWindow();
      if (!mainWindow || mainWindow.isDestroyed()) {
        return lastActiveDoc;
      }

      // Jelezzuk az overlay-nek ha van aktiv doc info
      return lastActiveDoc;
    } catch (error) {
      log.error('Poll active doc failed:', error);
      return lastActiveDoc;
    }
  });

  // Aktiv dokumentum info beallitasa (a photoshop handler vagy mainWindow jelzi)
  ipcMain.handle('overlay:set-active-doc', async (_event, doc: ActiveDocInfo) => {
    if (doc && typeof doc === 'object') {
      lastActiveDoc = {
        name: typeof doc.name === 'string' ? doc.name : null,
        path: typeof doc.path === 'string' ? doc.path : null,
        dir: typeof doc.dir === 'string' ? doc.dir : null,
      };

      // Overlay-nek jelezzuk a valtozast
      const overlayWindow = getOverlayWindow();
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('overlay:active-doc-changed', lastActiveDoc);
      }

      return { success: true };
    }
    return { success: false, error: 'Invalid doc info' };
  });

  // Munkamappa megnyitasa Finder-ben (az aktiv doc mappajabol)
  async function handleOpenWorkDir(): Promise<{ success: boolean; error?: string }> {
    const dir = lastActiveDoc.dir;
    if (dir) {
      try {
        await shell.openPath(dir);
        log.info(`Opened workdir from active doc: ${dir}`);
        return { success: true };
      } catch (error) {
        log.error('Open workdir failed:', error);
        return { success: false, error: 'Failed to open directory' };
      }
    }
    return { success: false, error: 'No active document directory' };
  }
}
