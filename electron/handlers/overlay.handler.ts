import { ipcMain, BrowserWindow, shell } from 'electron';
import log from 'electron-log/main';
import * as fs from 'fs';
import * as path from 'path';

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

// ProjectId persistens tarolasa: PSD path → projectId mapping
const psdProjectMap = new Map<string, number>();

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
        projectId: typeof ctx.projectId === 'number' ? ctx.projectId : overlayContext.projectId,
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

  // Fo ablak megmutatasa es fokuszalasa (pl. login szukseges)
  ipcMain.handle('overlay:show-main-window', async () => {
    try {
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
      return { success: true };
    } catch (error) {
      log.error('Show main window failed:', error);
      return { success: false, error: 'Show failed' };
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

      // PSD melletti JSON-bol projectId kinyerese ha a context-ben nincs
      if (!overlayContext.projectId && lastActiveDoc.path) {
        const projectId = readProjectIdFromJson(lastActiveDoc.path);
        if (projectId) {
          overlayContext = { ...overlayContext, projectId };
          log.info(`ProjectId from PSD JSON: ${projectId}`);
          const ow = getOverlayWindow();
          if (ow && !ow.isDestroyed()) {
            ow.webContents.send('overlay:context-changed', overlayContext);
          }
        }
      }

      // Overlay-nek jelezzuk a valtozast
      const overlayWindow = getOverlayWindow();
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('overlay:active-doc-changed', lastActiveDoc);
      }

      return { success: true };
    }
    return { success: false, error: 'Invalid doc info' };
  });

  // ProjectId lekerdezese: context-bol vagy PSD melletti JSON-bol
  ipcMain.handle('overlay:get-project-id', async () => {
    if (overlayContext.projectId) return { projectId: overlayContext.projectId };
    if (lastActiveDoc.path) {
      const projectId = readProjectIdFromJson(lastActiveDoc.path);
      if (projectId) {
        overlayContext = { ...overlayContext, projectId };
        return { projectId };
      }
    }
    return { projectId: null };
  });

  // Click-through: az atlatszo terulet atenged a toolbar mogotti appnak
  ipcMain.on('overlay:set-ignore-mouse', (_event, ignore: boolean) => {
    const overlayWindow = getOverlayWindow();
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
  });

  /**
   * PSD melletti JSON-bol vagy layouts/ snapshot-bol projectId kiolvasasa.
   */
  function readProjectIdFromJson(psdPath: string): number | null {
    try {
      const psdDir = path.dirname(psdPath);

      // Helper: projectId kinyerése egy JSON objektumból (projectId vagy id mező, string vagy number)
      const extractId = (data: Record<string, unknown>): number | null => {
        const raw = data.projectId ?? data.id;
        if (raw == null) return null;
        const num = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
        return num > 0 ? num : null;
      };

      // 1. PSD melletti project-info.json (saját rendszer, legmegbízhatóbb)
      const projectInfoPath = path.join(psdDir, 'project-info.json');
      if (fs.existsSync(projectInfoPath)) {
        const id = extractId(JSON.parse(fs.readFileSync(projectInfoPath, 'utf-8')));
        if (id) return id;
      }

      // 2. PSD melletti data.json (régi rendszer fallback)
      const dataJsonPath = path.join(psdDir, 'data.json');
      if (fs.existsSync(dataJsonPath)) {
        const id = extractId(JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')));
        if (id) return id;
      }

      // 3. PSD melletti azonos nevű .json
      const jsonPath = psdPath.replace(/\.(psd|psb)$/i, '.json');
      if (fs.existsSync(jsonPath)) {
        const id = extractId(JSON.parse(fs.readFileSync(jsonPath, 'utf-8')));
        if (id) return id;
      }

      // 4. layouts/ mappaban levo legujabb snapshot
      const layoutsDir = path.join(psdDir, 'layouts');
      if (fs.existsSync(layoutsDir)) {
        const files = fs.readdirSync(layoutsDir)
          .filter(f => f.endsWith('.json'))
          .sort()
          .reverse(); // legujabb elol (datummal kezdodo fajlnev)
        for (const file of files) {
          const id = extractId(JSON.parse(fs.readFileSync(path.join(layoutsDir, file), 'utf-8')));
          if (id) return id;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

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
