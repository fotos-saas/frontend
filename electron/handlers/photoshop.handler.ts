import { ipcMain, dialog, BrowserWindow } from 'electron';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import Store from 'electron-store';
import log from 'electron-log/main';

interface PhotoshopSchema {
  photoshopPath: string | null;
}

const psStore = new Store<PhotoshopSchema>({
  name: 'photostack-photoshop',
  defaults: {
    photoshopPath: null,
  },
});

/** Default Photoshop install helyek (macOS + Windows) */
const DEFAULT_PS_PATHS_MAC = [
  '/Applications/Adobe Photoshop 2026/Adobe Photoshop 2026.app',
  '/Applications/Adobe Photoshop 2025/Adobe Photoshop 2025.app',
  '/Applications/Adobe Photoshop 2024/Adobe Photoshop 2024.app',
  '/Applications/Adobe Photoshop CC 2024/Adobe Photoshop CC 2024.app',
];

const DEFAULT_PS_PATHS_WIN = [
  'C:\\Program Files\\Adobe\\Adobe Photoshop 2026\\Photoshop.exe',
  'C:\\Program Files\\Adobe\\Adobe Photoshop 2025\\Photoshop.exe',
  'C:\\Program Files\\Adobe\\Adobe Photoshop 2024\\Photoshop.exe',
  'C:\\Program Files\\Adobe\\Adobe Photoshop CC 2024\\Photoshop.exe',
];

function isValidPhotoshopPath(psPath: string): boolean {
  if (!fs.existsSync(psPath)) return false;

  if (process.platform === 'darwin') {
    // macOS: .app bundle = directory
    return psPath.endsWith('.app') && fs.statSync(psPath).isDirectory();
  } else {
    // Windows: .exe file
    return psPath.endsWith('.exe') && fs.statSync(psPath).isFile();
  }
}

function findPhotoshopInstallation(): string | null {
  const paths = process.platform === 'darwin' ? DEFAULT_PS_PATHS_MAC : DEFAULT_PS_PATHS_WIN;

  for (const psPath of paths) {
    if (isValidPhotoshopPath(psPath)) {
      return psPath;
    }
  }
  return null;
}

export function registerPhotoshopHandlers(_mainWindow: BrowserWindow): void {
  // Get saved path
  ipcMain.handle('photoshop:get-path', () => {
    return psStore.get('photoshopPath', null);
  });

  // Set & validate path
  ipcMain.handle('photoshop:set-path', (_event, psPath: string) => {
    try {
      if (typeof psPath !== 'string' || psPath.length > 500) {
        return { success: false, error: 'Ervenytelen eleresi ut' };
      }

      if (!isValidPhotoshopPath(psPath)) {
        return { success: false, error: 'A megadott eleresi uton nem talalhato Photoshop' };
      }

      psStore.set('photoshopPath', psPath);
      log.info(`Photoshop path beallitva: ${psPath}`);
      return { success: true };
    } catch (error) {
      log.error('Photoshop path beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni az eleresi utat' };
    }
  });

  // Launch Photoshop
  ipcMain.handle('photoshop:launch', () => {
    try {
      const psPath = psStore.get('photoshopPath', null);
      if (!psPath) {
        return { success: false, error: 'Nincs beallitva Photoshop eleresi ut' };
      }

      if (!isValidPhotoshopPath(psPath)) {
        return { success: false, error: 'A Photoshop nem talalhato a beallitott helyen' };
      }

      if (process.platform === 'darwin') {
        // macOS: open -a paranccsal inditjuk
        const child = execFile('open', ['-a', psPath]);
        child.unref();
      } else {
        // Windows: kozvetlen execFile
        const child = execFile(psPath, { detached: true, stdio: 'ignore' } as never);
        child.unref();
      }

      log.info(`Photoshop elinditva: ${psPath}`);
      return { success: true };
    } catch (error) {
      log.error('Photoshop inditasi hiba:', error);
      return { success: false, error: 'Nem sikerult elinditani a Photoshop-ot' };
    }
  });

  // Auto-detect Photoshop
  ipcMain.handle('photoshop:check-installed', () => {
    try {
      // Elobb nezzuk a mentett path-ot
      const savedPath = psStore.get('photoshopPath', null);
      if (savedPath && isValidPhotoshopPath(savedPath)) {
        return { found: true, path: savedPath };
      }

      // Ha a mentett path nem valid, keressuk a default helyeken
      const foundPath = findPhotoshopInstallation();
      if (foundPath) {
        psStore.set('photoshopPath', foundPath);
        log.info(`Photoshop auto-detektalva: ${foundPath}`);
        return { found: true, path: foundPath };
      }

      return { found: false, path: null };
    } catch (error) {
      log.error('Photoshop detektalasi hiba:', error);
      return { found: false, path: null };
    }
  });

  // Browse for Photoshop
  ipcMain.handle('photoshop:browse-path', async () => {
    try {
      const filters = process.platform === 'darwin'
        ? [{ name: 'Alkalmazások', extensions: ['app'] }]
        : [{ name: 'Futtatható fájlok', extensions: ['exe'] }];

      const result = await dialog.showOpenDialog({
        title: 'Photoshop kiválasztása',
        properties: process.platform === 'darwin'
          ? ['openFile', 'treatPackageAsDirectory'] as never
          : ['openFile'],
        filters,
        defaultPath: process.platform === 'darwin' ? '/Applications' : 'C:\\Program Files\\Adobe',
      });

      if (result.canceled || !result.filePaths.length) {
        return { cancelled: true };
      }

      const selectedPath = result.filePaths[0];

      // macOS: ha .app-on beluli fajlt valasztott, keressuk meg a .app root-ot
      let finalPath = selectedPath;
      if (process.platform === 'darwin' && !selectedPath.endsWith('.app')) {
        const appMatch = selectedPath.match(/^(.*?\.app)/);
        if (appMatch) {
          finalPath = appMatch[1];
        }
      }

      return { cancelled: false, path: finalPath };
    } catch (error) {
      log.error('Photoshop browse hiba:', error);
      return { cancelled: true };
    }
  });

  log.info('Photoshop IPC handlerek regisztralva');
}
