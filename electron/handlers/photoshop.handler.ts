import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import Store from 'electron-store';
import log from 'electron-log/main';
import sharp from 'sharp';

interface PhotoshopSchema {
  photoshopPath: string | null;
  workDirectory: string | null;
  tabloMarginCm: number;
  tabloStudentSizeCm: number;
  tabloTeacherSizeCm: number;
  tabloGapHCm: number;
  tabloGapVCm: number;
}

const psStore = new Store<PhotoshopSchema>({
  name: 'photostack-photoshop',
  defaults: {
    photoshopPath: null,
    workDirectory: null,
    tabloMarginCm: 2,
    tabloStudentSizeCm: 6,
    tabloTeacherSizeCm: 6,
    tabloGapHCm: 2,
    tabloGapVCm: 3,
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

  // Get tablo student photo size
  ipcMain.handle('photoshop:get-student-size', () => {
    return psStore.get('tabloStudentSizeCm', 6);
  });

  // Set tablo student photo size
  ipcMain.handle('photoshop:set-student-size', (_event, sizeCm: number) => {
    try {
      if (typeof sizeCm !== 'number' || sizeCm < 1 || sizeCm > 30) {
        return { success: false, error: 'Ervenytelen kepmeret ertek (1-30 cm)' };
      }
      psStore.set('tabloStudentSizeCm', sizeCm);
      log.info(`Tablo diak kepmeret beallitva: ${sizeCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo diak kepmeret beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a kepmeret erteket' };
    }
  });

  // Get tablo teacher photo size
  ipcMain.handle('photoshop:get-teacher-size', () => {
    return psStore.get('tabloTeacherSizeCm', 6);
  });

  // Set tablo teacher photo size
  ipcMain.handle('photoshop:set-teacher-size', (_event, sizeCm: number) => {
    try {
      if (typeof sizeCm !== 'number' || sizeCm < 1 || sizeCm > 30) {
        return { success: false, error: 'Ervenytelen kepmeret ertek (1-30 cm)' };
      }
      psStore.set('tabloTeacherSizeCm', sizeCm);
      log.info(`Tablo tanar kepmeret beallitva: ${sizeCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo tanar kepmeret beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a kepmeret erteket' };
    }
  });

  // Get tablo gap vizszintes (kepek kozotti tavolsag)
  ipcMain.handle('photoshop:get-gap-h', () => {
    return psStore.get('tabloGapHCm', 2);
  });

  // Set tablo gap vizszintes
  ipcMain.handle('photoshop:set-gap-h', (_event, gapCm: number) => {
    try {
      if (typeof gapCm !== 'number' || gapCm < 0 || gapCm > 10) {
        return { success: false, error: 'Ervenytelen vizszintes gap ertek (0-10 cm)' };
      }

      psStore.set('tabloGapHCm', gapCm);
      log.info(`Tablo vizszintes gap beallitva: ${gapCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo vizszintes gap beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a gap erteket' };
    }
  });

  // Get tablo gap fuggoleges (sorok kozotti tavolsag)
  ipcMain.handle('photoshop:get-gap-v', () => {
    return psStore.get('tabloGapVCm', 3);
  });

  // Set tablo gap fuggoleges
  ipcMain.handle('photoshop:set-gap-v', (_event, gapCm: number) => {
    try {
      if (typeof gapCm !== 'number' || gapCm < 0 || gapCm > 10) {
        return { success: false, error: 'Ervenytelen fuggoleges gap ertek (0-10 cm)' };
      }

      psStore.set('tabloGapVCm', gapCm);
      log.info(`Tablo fuggoleges gap beallitva: ${gapCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo fuggoleges gap beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a gap erteket' };
    }
  });

  // ============ JSX ExtendScript futtatás ============

  // JSX scriptek kihelyezese a workDir/scripts/ mappaba
  // Ha a mappa nem letezik → friss masolas
  // Ha a forrasfajl ujabb mint a cel → feluliras
  function deployJsxScripts(workDir: string): void {
    const sourceBase = app.isPackaged
      ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'extendscript')
      : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'extendscript');

    const targetBase = path.join(workDir, 'scripts');

    // Rekurzivan masol egy mappat, csak ujabb fajlokat irja felul
    function syncDir(srcDir: string, dstDir: string): void {
      if (!fs.existsSync(dstDir)) {
        fs.mkdirSync(dstDir, { recursive: true });
      }

      const entries = fs.readdirSync(srcDir, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const dstPath = path.join(dstDir, entry.name);

        if (entry.isDirectory()) {
          syncDir(srcPath, dstPath);
        } else if (entry.isFile() && entry.name.endsWith('.jsx')) {
          let needsCopy = true;
          if (fs.existsSync(dstPath)) {
            const srcMtime = fs.statSync(srcPath).mtimeMs;
            const dstMtime = fs.statSync(dstPath).mtimeMs;
            if (srcMtime <= dstMtime) {
              needsCopy = false;
            }
          }
          if (needsCopy) {
            fs.copyFileSync(srcPath, dstPath);
            log.info(`JSX deploy: ${path.relative(targetBase, dstPath)}`);
          }
        }
      }
    }

    try {
      syncDir(sourceBase, targetBase);
      log.info(`JSX scriptek kihelyezve: ${targetBase}`);
    } catch (error) {
      log.error('JSX deploy hiba:', error);
    }
  }

  // Ekezetmentes slug (layerName generalashoz)
  // Unicode NFD normalizacio: ekezetes → alap + combining mark, majd mark strip
  // Univerzalis: magyar, nemet, francia, stb. mind mukodik
  function sanitizeNameForLayer(text: string, personId?: number): string {
    let result = text
      .normalize('NFD')                    // pl. "á" → "a" + combining acute
      .replace(/[\u0300-\u036f]/g, '')     // combining diacritical marks torlese
      .replace(/\u0150/g, 'O').replace(/\u0151/g, 'o')  // Ő/ő (kettős ékezet — NFD nem bontja)
      .replace(/\u0170/g, 'U').replace(/\u0171/g, 'u')  // Ű/ű (kettős ékezet — NFD nem bontja)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (personId !== undefined) {
      result += `---${personId}`;
    }
    return result;
  }

  // PersonsData előkészítése a JSX számára
  // Python logika: számolás, szétválogatás, elnevezések — JSX csak végrehajtó
  function preparePersonsForJsx(personsData: Array<{ id: number; name: string; type: string }>) {
    const students = personsData.filter(p => p.type !== 'teacher');
    const teachers = personsData.filter(p => p.type === 'teacher');

    const layers = [
      ...students.map(p => ({
        layerName: sanitizeNameForLayer(p.name, p.id),
        displayText: p.name,
        group: 'Students',
      })),
      ...teachers.map(p => ({
        layerName: sanitizeNameForLayer(p.name, p.id),
        displayText: p.name,
        group: 'Teachers',
      })),
    ];

    return {
      layers,
      stats: { students: students.length, teachers: teachers.length, total: personsData.length },
    };
  }

  // Foto letoltese URL-rol temp mappaba + opcionalis sharp elomeretezes
  // targetSize megadasa eseten cover logika: kitolti a celmeretet (crop kozeprol)
  function downloadPhoto(url: string, fileName: string, targetSize?: { width: number; height: number }): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempDir = path.join(app.getPath('temp'), 'psd-photos');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Ha van targetSize, a vegso fajl a resized/ almappaba kerul
      const resizedDir = path.join(tempDir, 'resized');
      const rawPath = path.join(tempDir, fileName);
      const finalPath = targetSize ? path.join(resizedDir, fileName) : rawPath;

      // Ha a vegso fajl mar letezik es friss (5 perc), hasznaljuk
      if (fs.existsSync(finalPath)) {
        const stats = fs.statSync(finalPath);
        const FIVE_MINUTES = 5 * 60 * 1000;
        if (Date.now() - stats.mtimeMs < FIVE_MINUTES && stats.size > 0) {
          log.info(`Cached foto: ${fileName}`);
          resolve(finalPath);
          return;
        }
      }

      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(rawPath);

      log.info(`Foto letoltese: ${url} → ${fileName}`);

      protocol.get(url, (response) => {
        // Redirect kezeles
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(rawPath);
            downloadPhoto(redirectUrl, fileName, targetSize).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(rawPath, () => {});
          reject(new Error(`Foto letoltes sikertelen: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();

          // Ha nincs meretezes, kesz
          if (!targetSize) {
            log.info(`Foto letoltve: ${fileName}`);
            resolve(rawPath);
            return;
          }

          // Sharp cover resize: kitolti a celmeretet, kozeprol vagja
          if (!fs.existsSync(resizedDir)) {
            fs.mkdirSync(resizedDir, { recursive: true });
          }

          sharp(rawPath)
            .resize(targetSize.width, targetSize.height, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: 95 })
            .toFile(finalPath)
            .then(() => {
              log.info(`Foto meretezve: ${fileName} → ${targetSize.width}x${targetSize.height}`);
              resolve(finalPath);
            })
            .catch((err: Error) => {
              log.warn(`Sharp meretezes sikertelen (${fileName}), eredeti kep hasznalata:`, err.message);
              resolve(rawPath); // fallback: eredeti kep
            });
        });
      }).on('error', (err) => {
        fs.unlink(rawPath, () => {});
        reject(err);
      });
    });
  }

  // Image layerek előkészítése a JSX számára
  // Méretek cm → px átszámítása, elnevezések, csoportosítás, fotó letöltés
  // FONTOS: a pixelszámítás a DOKUMENTUM DPI-jével történik (200),
  // nem a kép DPI-jével (300), mert a placeholder a PSD-ben lesz!
  async function prepareImageLayersForJsx(
    personsData: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>,
    imageSizeCm: { widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number },
    docDpi: number = 200,
  ) {
    const students = personsData.filter(p => p.type !== 'teacher');
    const teachers = personsData.filter(p => p.type === 'teacher');

    // cm → px: a DOKUMENTUM DPI-jével szamolunk, hogy a PSD-ben helyes meretu legyen
    const widthPx = Math.round((imageSizeCm.widthCm / 2.54) * docDpi);
    const heightPx = Math.round((imageSizeCm.heightCm / 2.54) * docDpi);

    // Fotok parhuzamos letoltese (csak ahol van photoUrl)
    const allPersons = [...students, ...teachers];
    const downloadResults = await Promise.all(
      allPersons.map(async (p) => {
        if (!p.photoUrl) return null;
        try {
          const layerName = sanitizeNameForLayer(p.name, p.id);
          const ext = p.photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `${layerName}.${ext}`;
          return await downloadPhoto(p.photoUrl, fileName, { width: widthPx, height: heightPx });
        } catch (err) {
          log.warn(`Foto letoltes sikertelen (${p.name}):`, err);
          return null;
        }
      }),
    );

    // Layers felepitese a letoltesi eredmenyekkel
    const layers = allPersons.map((p, idx) => ({
      layerName: sanitizeNameForLayer(p.name, p.id),
      group: p.type === 'teacher' ? 'Teachers' : 'Students',
      widthPx,
      heightPx,
      photoPath: downloadResults[idx] || null,
    }));

    const withPhoto = downloadResults.filter(r => r !== null).length;

    return {
      layers,
      stats: { students: students.length, teachers: teachers.length, total: personsData.length, withPhoto },
      imageSizeCm,
      studentSizeCm: imageSizeCm.studentSizeCm || 0,
      teacherSizeCm: imageSizeCm.teacherSizeCm || 0,
    };
  }

  // JSX script utvonal feloldasa: workDir/scripts/ elsodleges, Electron fallback
  function resolveJsxPath(scriptName: string): string {
    // 1. Ha van workDir es a fajl letezik benne → onnan olvassuk
    const workDir = psStore.get('workDirectory', null);
    if (workDir) {
      const workDirPath = path.join(workDir, 'scripts', scriptName);
      if (fs.existsSync(workDirPath)) {
        return workDirPath;
      }
    }

    // 2. Fallback: eredeti Electron scripts/ hely
    return app.isPackaged
      ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'extendscript', scriptName)
      : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'extendscript', scriptName);
  }

  // JSX #include direktívák feloldása (inline-olja a fájl tartalmát)
  function resolveIncludes(scriptContent: string, scriptDir: string): string {
    return scriptContent.replace(
      /\/\/\s*#include\s+"([^"]+)"/g,
      (_match, includePath) => {
        const fullPath = path.resolve(scriptDir, includePath);
        if (!fs.existsSync(fullPath)) {
          log.warn(`JSX #include fajl nem talalhato: ${fullPath}`);
          return `// HIBA: #include fajl nem talalhato: ${includePath}`;
        }
        const includeContent = fs.readFileSync(fullPath, 'utf-8');
        // Rekurzív #include feloldás
        return resolveIncludes(includeContent, path.dirname(fullPath));
      },
    );
  }

  // JSX script osszeallitasa: deploy + CONFIG beallitasok + #include feloldas + action kod
  function buildJsxScript(scriptName: string, dataFilePath?: string, targetDocName?: string): string {
    // Scriptek kihelyezese a workDir-be (ha van beallitva)
    const workDir = psStore.get('workDirectory', null);
    if (workDir) {
      deployJsxScripts(workDir);
    }

    const scriptPath = resolveJsxPath(scriptName);
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`JSX script nem talalhato: ${scriptPath}`);
    }

    let scriptContent = fs.readFileSync(scriptPath, 'utf-8');
    const scriptDir = path.dirname(scriptPath);

    // #include direktívák feloldása
    scriptContent = resolveIncludes(scriptContent, scriptDir);

    // CONFIG override-ok beallitasa a CONFIG blokk UTAN
    const configOverrides: string[] = [];
    if (dataFilePath) {
      const escapedPath = dataFilePath.replace(/\\/g, '/');
      configOverrides.push(`CONFIG.DATA_FILE_PATH = "${escapedPath}";`);
    }
    if (targetDocName) {
      const escapedName = targetDocName.replace(/"/g, '\\"');
      configOverrides.push(`CONFIG.TARGET_DOC_NAME = "${escapedName}";`);
    }

    if (configOverrides.length > 0) {
      const overrideBlock = '\n' + configOverrides.join('\n') + '\n';
      const configStart = scriptContent.indexOf('var CONFIG');
      if (configStart > -1) {
        const configEnd = scriptContent.indexOf('};', configStart);
        if (configEnd > -1) {
          scriptContent = scriptContent.slice(0, configEnd + 2) + overrideBlock + scriptContent.slice(configEnd + 2);
        }
      }
    }

    return scriptContent;
  }

  // Run JSX script (non-streaming) via osascript
  ipcMain.handle('photoshop:run-jsx', async (_event, params: {
    scriptName: string;
    dataFilePath?: string;
    targetDocName?: string;
    personsData?: Array<{ id: number; name: string; type: string }>;
    imageData?: { persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>; widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number };
    jsonData?: Record<string, unknown>;
  }) => {
    let tempJsonPath: string | null = null;

    try {
      if (typeof params.scriptName !== 'string' || params.scriptName.length > 200) {
        return { success: false, error: 'Ervenytelen script nev' };
      }

      // Biztonsag: script nev nem tartalmazhat path traversal-t
      if (params.scriptName.includes('..') || params.scriptName.startsWith('/')) {
        return { success: false, error: 'Ervenytelen script utvonal' };
      }

      // Ha personsData-t kaptunk, előkészítjük és temp JSON fajlba irjuk
      let dataFilePath = params.dataFilePath;
      if (!dataFilePath && params.personsData && params.personsData.length > 0) {
        const prepared = preparePersonsForJsx(params.personsData);
        tempJsonPath = path.join(app.getPath('temp'), `jsx-persons-${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(prepared), 'utf-8');
        dataFilePath = tempJsonPath;
        log.info(`JSX persons JSON irva: ${tempJsonPath} (${prepared.stats.total} fo: ${prepared.stats.students} diak, ${prepared.stats.teachers} tanar)`);
      }

      // Ha imageData-t kaptunk, image layerek előkészítése (async — fotó letöltéssel)
      if (!dataFilePath && params.imageData && params.imageData.persons.length > 0) {
        const prepared = await prepareImageLayersForJsx(params.imageData.persons, {
          widthCm: params.imageData.widthCm,
          heightCm: params.imageData.heightCm,
          dpi: params.imageData.dpi,
          studentSizeCm: params.imageData.studentSizeCm,
          teacherSizeCm: params.imageData.teacherSizeCm,
        });
        tempJsonPath = path.join(app.getPath('temp'), `jsx-images-${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(prepared), 'utf-8');
        dataFilePath = tempJsonPath;
        log.info(`JSX images JSON irva: ${tempJsonPath} (${prepared.stats.total} fo, ${prepared.stats.withPhoto} fotoval, ${prepared.layers[0]?.widthPx}x${prepared.layers[0]?.heightPx} px)`);
      }

      // Ha jsonData-t kaptunk (altalanos JSON adat, pl. guide margo), temp fajlba irjuk
      if (!dataFilePath && params.jsonData) {
        tempJsonPath = path.join(app.getPath('temp'), `jsx-data-${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(params.jsonData), 'utf-8');
        dataFilePath = tempJsonPath;
        log.info(`JSX jsonData irva: ${tempJsonPath}`);
      }

      const jsxCode = buildJsxScript(params.scriptName, dataFilePath, params.targetDocName);
      log.info(`JSX script futtatasa: ${params.scriptName} (${jsxCode.length} karakter)`);

      if (process.platform !== 'darwin') {
        return { success: false, error: 'JSX futtatás csak macOS-en támogatott (osascript)' };
      }

      // A JSX kodot temp fajlba irjuk, mert tul hosszu lenne a parancssorba
      const tempJsxPath = path.join(app.getPath('temp'), `jsx-script-${Date.now()}.jsx`);
      fs.writeFileSync(tempJsxPath, jsxCode, 'utf-8');

      const appleScript = `tell application id "com.adobe.Photoshop" to do javascript file "${tempJsxPath}"`;

      return new Promise<{ success: boolean; error?: string; output?: string }>((resolve) => {
        execFile('osascript', ['-e', appleScript], { timeout: 60000 }, (error, stdout, stderr) => {
          // Temp fajlok torlese
          try { fs.unlinkSync(tempJsxPath); } catch (_) { /* ignore */ }
          if (tempJsonPath && fs.existsSync(tempJsonPath)) {
            try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          }

          if (error) {
            log.error('JSX futtatasi hiba:', error.message, stderr);
            resolve({ success: false, error: stderr || error.message });
            return;
          }
          log.info('JSX sikeresen lefutott:', stdout.trim().slice(0, 500));
          resolve({ success: true, output: stdout || '' });
        });
      });
    } catch (error) {
      if (tempJsonPath && fs.existsSync(tempJsonPath)) {
        try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
      }
      log.error('JSX futtatasi hiba:', error);
      const errMsg = error instanceof Error ? error.message : 'Ismeretlen hiba';
      return { success: false, error: errMsg };
    }
  });

  // Run JSX script with streaming debug logs
  ipcMain.handle('photoshop:run-jsx-debug', async (_event, params: {
    scriptName: string;
    dataFilePath?: string;
    targetDocName?: string;
    personsData?: Array<{ id: number; name: string; type: string }>;
    imageData?: { persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>; widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number };
    jsonData?: Record<string, unknown>;
  }) => {
    const win = _mainWindow;
    let tempJsonPath: string | null = null;

    const sendLog = (line: string, stream: 'stdout' | 'stderr') => {
      try { win.webContents.send('jsx-debug-log', { line, stream }); } catch (_) { /* ignore */ }
    };

    try {
      if (typeof params.scriptName !== 'string' || params.scriptName.length > 200) {
        return { success: false, error: 'Ervenytelen script nev' };
      }

      if (params.scriptName.includes('..') || params.scriptName.startsWith('/')) {
        return { success: false, error: 'Ervenytelen script utvonal' };
      }

      // Ha personsData-t kaptunk, előkészítjük és temp JSON fajlba irjuk
      let dataFilePath = params.dataFilePath;
      if (!dataFilePath && params.personsData && params.personsData.length > 0) {
        const prepared = preparePersonsForJsx(params.personsData);
        tempJsonPath = path.join(app.getPath('temp'), `jsx-persons-debug-${Date.now()}.json`);
        const jsonStr = JSON.stringify(prepared);
        fs.writeFileSync(tempJsonPath, jsonStr, 'utf-8');
        dataFilePath = tempJsonPath;
        sendLog(`[DEBUG] Persons JSON irva: ${tempJsonPath} (${prepared.stats.total} fo: ${prepared.stats.students} diak, ${prepared.stats.teachers} tanar)`, 'stdout');
      }

      // Ha imageData-t kaptunk, image layerek előkészítése (async — fotó letöltéssel)
      if (!dataFilePath && params.imageData && params.imageData.persons.length > 0) {
        sendLog(`[DEBUG] Fotok letoltese...`, 'stdout');
        const prepared = await prepareImageLayersForJsx(params.imageData.persons, {
          widthCm: params.imageData.widthCm,
          heightCm: params.imageData.heightCm,
          dpi: params.imageData.dpi,
          studentSizeCm: params.imageData.studentSizeCm,
          teacherSizeCm: params.imageData.teacherSizeCm,
        });
        tempJsonPath = path.join(app.getPath('temp'), `jsx-images-debug-${Date.now()}.json`);
        const jsonStr = JSON.stringify(prepared);
        fs.writeFileSync(tempJsonPath, jsonStr, 'utf-8');
        dataFilePath = tempJsonPath;
        sendLog(`[DEBUG] Images JSON irva: ${tempJsonPath} (${prepared.stats.total} fo, ${prepared.stats.withPhoto} fotoval, ${prepared.layers[0]?.widthPx}x${prepared.layers[0]?.heightPx} px)`, 'stdout');
      }

      // Ha jsonData-t kaptunk, temp fajlba irjuk
      if (!dataFilePath && params.jsonData) {
        tempJsonPath = path.join(app.getPath('temp'), `jsx-data-debug-${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(params.jsonData), 'utf-8');
        dataFilePath = tempJsonPath;
        sendLog(`[DEBUG] JSON data irva: ${tempJsonPath}`, 'stdout');
      }

      const jsxCode = buildJsxScript(params.scriptName, dataFilePath, params.targetDocName);
      sendLog(`[DEBUG] JSX script: ${params.scriptName} (${jsxCode.length} karakter)`, 'stdout');

      if (process.platform !== 'darwin') {
        return { success: false, error: 'JSX futtatás csak macOS-en támogatott (osascript)' };
      }

      // Temp JSX fajl
      const tempJsxPath = path.join(app.getPath('temp'), `jsx-debug-${Date.now()}.jsx`);
      fs.writeFileSync(tempJsxPath, jsxCode, 'utf-8');
      sendLog(`[DEBUG] Temp JSX irva: ${tempJsxPath}`, 'stdout');

      const appleScript = `tell application id "com.adobe.Photoshop" to do javascript file "${tempJsxPath}"`;

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        const child = spawn('osascript', ['-e', appleScript], { timeout: 60000 });
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
          // Temp fajlok torlese
          try { fs.unlinkSync(tempJsxPath); } catch (_) { /* ignore */ }
          if (tempJsonPath && fs.existsSync(tempJsonPath)) {
            try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          }

          if (code !== 0) {
            log.error(`JSX debug hiba (exit ${code}):`, stderrBuf);
            resolve({ success: false, error: stderrBuf || `Exit code: ${code}` });
          } else {
            log.info('JSX debug sikeresen lefutott');
            resolve({ success: true });
          }
        });

        child.on('error', (err) => {
          try { fs.unlinkSync(tempJsxPath); } catch (_) { /* ignore */ }
          if (tempJsonPath && fs.existsSync(tempJsonPath)) {
            try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          }
          sendLog(`[DEBUG] HIBA: ${err.message}`, 'stderr');
          log.error('JSX debug spawn hiba:', err);
          resolve({ success: false, error: err.message });
        });
      });
    } catch (error) {
      if (tempJsonPath && fs.existsSync(tempJsonPath)) {
        try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
      }
      log.error('JSX debug futtatasi hiba:', error);
      const errMsg = error instanceof Error ? error.message : 'Ismeretlen hiba';
      return { success: false, error: errMsg };
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
