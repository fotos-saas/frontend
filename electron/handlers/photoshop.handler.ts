import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import Store from 'electron-store';
import log from 'electron-log/main';

interface PhotoshopSchema {
  photoshopPath: string | null;
  workDirectory: string | null;
  tabloMarginCm: number;
}

const psStore = new Store<PhotoshopSchema>({
  name: 'photostack-photoshop',
  defaults: {
    photoshopPath: null,
    workDirectory: null,
    tabloMarginCm: 2,
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
      if (process.platform === 'darwin') {
        // macOS: nativ "Choose Application" dialogus osascript-tel
        // Az Electron dialog nem tudja .app bundle-t kivalasztani (mappaként kezeli)
        return new Promise<{ cancelled: boolean; path?: string }>((resolve) => {
          execFile('osascript', [
            '-e',
            'POSIX path of (choose application with prompt "Válaszd ki a Photoshop alkalmazást" as alias)',
          ], { timeout: 60000 }, (error, stdout) => {
            if (error) {
              // User Cancel = -128 error
              resolve({ cancelled: true });
              return;
            }
            const appPath = stdout.trim().replace(/\/$/, ''); // trailing slash eltavolitasa
            resolve({ cancelled: false, path: appPath });
          });
        });
      } else {
        // Windows: exe fajlt valasztunk
        const result = await dialog.showOpenDialog({
          title: 'Photoshop kiválasztása',
          properties: ['openFile'],
          filters: [{ name: 'Futtatható fájlok', extensions: ['exe'] }],
          defaultPath: 'C:\\Program Files\\Adobe',
        });

        if (result.canceled || !result.filePaths.length) {
          return { cancelled: true };
        }

        return { cancelled: false, path: result.filePaths[0] };
      }
    } catch (error) {
      log.error('Photoshop browse hiba:', error);
      return { cancelled: true };
    }
  });

  // Get Downloads path
  ipcMain.handle('photoshop:get-downloads-path', () => {
    return app.getPath('downloads');
  });

  // Generate PSD file
  ipcMain.handle('photoshop:generate-psd', async (_event, params: {
    widthCm: number;
    heightCm: number;
    dpi: number;
    mode: string;
    outputPath: string;
    persons?: Array<{ id: number; name: string; type: string }>;
  }) => {
    let personsJsonPath: string | null = null;

    try {
      // Input validacio
      if (typeof params.widthCm !== 'number' || typeof params.heightCm !== 'number') {
        return { success: false, error: 'Ervenytelen meret parameterek' };
      }
      if (params.widthCm <= 0 || params.heightCm <= 0) {
        return { success: false, error: 'A mereteknek pozitivnak kell lenniuk' };
      }
      if (typeof params.outputPath !== 'string' || params.outputPath.length > 500) {
        return { success: false, error: 'Ervenytelen kimeneti eleresi ut' };
      }

      // Kimeneti mappa letrehozasa (rekurziv)
      const outputDir = path.dirname(params.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        log.info(`Mappa letrehozva: ${outputDir}`);
      }

      // Python script eleresi ut (extraResources-bol)
      const scriptPath = app.isPackaged
        ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'python', 'tasks', 'generate_psd.py')
        : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'python', 'tasks', 'generate_psd.py');

      const args = [
        scriptPath,
        '--width-cm', String(params.widthCm),
        '--height-cm', String(params.heightCm),
        '--dpi', String(params.dpi || 200),
        '--mode', params.mode || 'RGB',
        '--output', params.outputPath,
      ];

      // Szemelyek JSON temp fajlba irasa (ha vannak)
      if (params.persons && params.persons.length > 0) {
        personsJsonPath = path.join(app.getPath('temp'), `psd-persons-${Date.now()}.json`);
        fs.writeFileSync(personsJsonPath, JSON.stringify(params.persons), 'utf-8');
        args.push('--persons-json', personsJsonPath);
        log.info(`Szemelyek JSON irva: ${personsJsonPath} (${params.persons.length} fo)`);
      }

      return new Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string }>((resolve) => {
        execFile('python3', args, { timeout: 30000 }, (error, stdout, stderr) => {
          // Temp fajl torlese
          if (personsJsonPath && fs.existsSync(personsJsonPath)) {
            try { fs.unlinkSync(personsJsonPath); } catch (_) { /* ignore */ }
          }

          if (error) {
            log.error('PSD generalas hiba:', error.message, stderr);
            resolve({ success: false, error: stderr || error.message, stdout: stdout || '', stderr: stderr || '' });
            return;
          }
          log.info('PSD generalva:', stdout.trim());
          resolve({ success: true, stdout: stdout || '', stderr: stderr || '' });
        });
      });
    } catch (error) {
      // Temp fajl torlese hiba eseten is
      if (personsJsonPath && fs.existsSync(personsJsonPath)) {
        try { fs.unlinkSync(personsJsonPath); } catch (_) { /* ignore */ }
      }
      log.error('PSD generalasi hiba:', error);
      return { success: false, error: 'Nem sikerult a PSD generalasa' };
    }
  });

  // Open file with default application (Photoshop)
  ipcMain.handle('photoshop:open-file', async (_event, filePath: string) => {
    try {
      if (typeof filePath !== 'string' || filePath.length > 500) {
        return { success: false, error: 'Ervenytelen fajl eleresi ut' };
      }

      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'A fajl nem talalhato' };
      }

      const psPath = psStore.get('photoshopPath', null);

      if (process.platform === 'darwin') {
        if (psPath) {
          // macOS: open -a Photoshop file.psd
          const child = execFile('open', ['-a', psPath, filePath]);
          child.unref();
        } else {
          // Nincs PS beallitva, megnyitas alapertelmezett alkalmazassal
          const child = execFile('open', [filePath]);
          child.unref();
        }
      } else {
        if (psPath) {
          // Windows: Photoshop.exe file.psd
          const child = execFile(psPath, [filePath], { detached: true, stdio: 'ignore' } as never);
          child.unref();
        } else {
          const child = execFile('start', ['""', filePath], { shell: true, detached: true, stdio: 'ignore' } as never);
          child.unref();
        }
      }

      log.info(`PSD megnyitva: ${filePath}`);
      return { success: true };
    } catch (error) {
      log.error('PSD megnyitasi hiba:', error);
      return { success: false, error: 'Nem sikerult megnyitni a fajlt' };
    }
  });

  // Get work directory
  ipcMain.handle('photoshop:get-work-dir', () => {
    return psStore.get('workDirectory', null);
  });

  // Set work directory
  ipcMain.handle('photoshop:set-work-dir', (_event, dirPath: string) => {
    try {
      if (typeof dirPath !== 'string' || dirPath.length > 500) {
        return { success: false, error: 'Ervenytelen eleresi ut' };
      }

      if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        return { success: false, error: 'A megadott eleresi ut nem egy mappa' };
      }

      psStore.set('workDirectory', dirPath);
      log.info(`Munka mappa beallitva: ${dirPath}`);
      return { success: true };
    } catch (error) {
      log.error('Munka mappa beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni az eleresi utat' };
    }
  });

  // Browse for work directory
  ipcMain.handle('photoshop:browse-work-dir', async () => {
    try {
      const currentDir = psStore.get('workDirectory', null);

      const result = await dialog.showOpenDialog({
        title: 'Munka mappa kiválasztása',
        properties: ['openDirectory', 'createDirectory'],
        defaultPath: currentDir || app.getPath('documents'),
      });

      if (result.canceled || !result.filePaths.length) {
        return { cancelled: true };
      }

      return { cancelled: false, path: result.filePaths[0] };
    } catch (error) {
      log.error('Munka mappa browse hiba:', error);
      return { cancelled: true };
    }
  });

  // Get tablo margin
  ipcMain.handle('photoshop:get-margin', () => {
    return psStore.get('tabloMarginCm', 2);
  });

  // Set tablo margin
  ipcMain.handle('photoshop:set-margin', (_event, marginCm: number) => {
    try {
      if (typeof marginCm !== 'number' || marginCm < 0 || marginCm > 10) {
        return { success: false, error: 'Ervenytelen margo ertek (0-10 cm)' };
      }

      psStore.set('tabloMarginCm', marginCm);
      log.info(`Tablo margo beallitva: ${marginCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo margo beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a margo erteket' };
    }
  });

  // Generate PSD with streaming debug logs (soronkent kuldi a logokat a renderernek)
  ipcMain.handle('photoshop:generate-psd-debug', async (_event, params: {
    widthCm: number;
    heightCm: number;
    dpi: number;
    mode: string;
    outputPath: string;
    persons?: Array<{ id: number; name: string; type: string }>;
  }) => {
    let personsJsonPath: string | null = null;
    const win = _mainWindow;

    const sendLog = (line: string, stream: 'stdout' | 'stderr') => {
      try { win.webContents.send('psd-debug-log', { line, stream }); } catch (_) { /* ignore */ }
    };

    try {
      // Input validacio
      if (typeof params.widthCm !== 'number' || typeof params.heightCm !== 'number') {
        return { success: false, error: 'Ervenytelen meret parameterek' };
      }
      if (params.widthCm <= 0 || params.heightCm <= 0) {
        return { success: false, error: 'A mereteknek pozitivnak kell lenniuk' };
      }
      if (typeof params.outputPath !== 'string' || params.outputPath.length > 500) {
        return { success: false, error: 'Ervenytelen kimeneti eleresi ut' };
      }

      // Kimeneti mappa letrehozasa (rekurziv)
      const outputDir = path.dirname(params.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        sendLog(`[DEBUG] Mappa letrehozva: ${outputDir}`, 'stdout');
      }

      // Python script eleresi ut
      const scriptPath = app.isPackaged
        ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'python', 'tasks', 'generate_psd.py')
        : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'python', 'tasks', 'generate_psd.py');

      sendLog(`[DEBUG] Script: ${scriptPath}`, 'stdout');
      sendLog(`[DEBUG] Script letezik: ${fs.existsSync(scriptPath)}`, 'stdout');

      const spawnArgs = [
        scriptPath,
        '--width-cm', String(params.widthCm),
        '--height-cm', String(params.heightCm),
        '--dpi', String(params.dpi || 200),
        '--mode', params.mode || 'RGB',
        '--output', params.outputPath,
      ];

      // Szemelyek JSON temp fajlba irasa
      if (params.persons && params.persons.length > 0) {
        personsJsonPath = path.join(app.getPath('temp'), `psd-persons-${Date.now()}.json`);
        fs.writeFileSync(personsJsonPath, JSON.stringify(params.persons), 'utf-8');
        spawnArgs.push('--persons-json', personsJsonPath);
        sendLog(`[DEBUG] Persons JSON irva: ${personsJsonPath} (${params.persons.length} fo)`, 'stdout');
      }

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        const child = spawn('python3', spawnArgs, { timeout: 30000 });
        let stderrBuf = '';

        child.stdout.on('data', (data: Buffer) => {
          const text = data.toString('utf-8');
          for (const line of text.split('\n')) {
            if (line.trim()) sendLog(line, 'stdout');
          }
        });

        child.stderr.on('data', (data: Buffer) => {
          const text = data.toString('utf-8');
          stderrBuf += text;
          for (const line of text.split('\n')) {
            if (line.trim()) sendLog(line, 'stderr');
          }
        });

        child.on('close', (code) => {
          // Temp fajl torlese
          if (personsJsonPath && fs.existsSync(personsJsonPath)) {
            try { fs.unlinkSync(personsJsonPath); } catch (_) { /* ignore */ }
          }

          if (code !== 0) {
            log.error(`PSD debug generalas hiba (exit ${code}):`, stderrBuf);
            resolve({ success: false, error: stderrBuf || `Exit code: ${code}` });
          } else {
            log.info('PSD debug generalva sikeresen');
            resolve({ success: true });
          }
        });

        child.on('error', (err) => {
          if (personsJsonPath && fs.existsSync(personsJsonPath)) {
            try { fs.unlinkSync(personsJsonPath); } catch (_) { /* ignore */ }
          }
          sendLog(`[DEBUG] HIBA: ${err.message}`, 'stderr');
          log.error('PSD debug spawn hiba:', err);
          resolve({ success: false, error: err.message });
        });
      });
    } catch (error) {
      if (personsJsonPath && fs.existsSync(personsJsonPath)) {
        try { fs.unlinkSync(personsJsonPath); } catch (_) { /* ignore */ }
      }
      log.error('PSD debug generalasi hiba:', error);
      return { success: false, error: 'Nem sikerult a PSD generalasa' };
    }
  });

  log.info('Photoshop IPC handlerek regisztralva');
}
