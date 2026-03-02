import { ipcMain, app } from 'electron';
import { execFile, execFileSync } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import * as https from 'https';
import sharp from 'sharp';
import log from 'electron-log/main';

// Engedelyezett fajlkiterjesztesek
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif']);

// Engedelyezett letoltesi domainek (csak HTTPS)
const ALLOWED_DOWNLOAD_DOMAINS = [
  'api.tablostudio.hu',
  'tablostudio.hu',
  ...(app.isPackaged ? [] : ['localhost']),
];

/** Temp konyvtar neve */
const TEMP_DIR_NAME = 'photostack-crop';

/** Max letoltesi meret: 50 MB */
const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024;

/** Max read size: 30 MB */
const MAX_READ_SIZE = 30 * 1024 * 1024;

/** Python script base path (extraResources or dev) */
function getScriptsPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'scripts', 'crop', 'python')
    : path.join(__dirname, '..', '..', 'scripts', 'crop', 'python');
}

/** Venv python binary path (platform-aware) */
function getPythonPath(): string {
  const scriptsPath = getScriptsPath();
  const isWin = process.platform === 'win32';
  const venvPython = isWin
    ? path.join(scriptsPath, '.venv', 'Scripts', 'python.exe')
    : path.join(scriptsPath, '.venv', 'bin', 'python3');

  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  log.warn('Crop venv python nem talalhato, system python3 hasznalata');
  return 'python3';
}

/** Ensure venv exists, create if missing. Returns true if ready. */
function ensureVenv(): boolean {
  const scriptsPath = getScriptsPath();
  const isWin = process.platform === 'win32';
  const venvPython = isWin
    ? path.join(scriptsPath, '.venv', 'Scripts', 'python.exe')
    : path.join(scriptsPath, '.venv', 'bin', 'python3');

  if (fs.existsSync(venvPython)) {
    return true;
  }

  const requirementsPath = path.join(scriptsPath, 'requirements.txt');
  if (!fs.existsSync(requirementsPath)) {
    log.error('Crop requirements.txt nem talalhato');
    return false;
  }

  log.info('Crop venv letrehozasa...');
  try {
    execFileSync('python3', ['-m', 'venv', path.join(scriptsPath, '.venv')], {
      timeout: 60000,
    });

    const pipPath = isWin
      ? path.join(scriptsPath, '.venv', 'Scripts', 'pip.exe')
      : path.join(scriptsPath, '.venv', 'bin', 'pip');

    execFileSync(pipPath, ['install', '-r', requirementsPath, '--quiet'], {
      timeout: 300000,
    });

    log.info('Crop venv sikeresen letrehozva');
    return fs.existsSync(venvPython);
  } catch (err: unknown) {
    log.error('Crop venv letrehozas sikertelen:', (err as Error).message);
    return false;
  }
}

/** Write data to a temp JSON file, return its path */
function writeTempJson(data: unknown): string {
  const tmpDir = path.join(os.tmpdir(), TEMP_DIR_NAME);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const tmpPath = path.join(tmpDir, `crop-${crypto.randomUUID()}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  return tmpPath;
}

/** Safely remove a temp file */
function cleanupTemp(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      log.warn('Temp fajl torlesi hiba:', (err as Error).message);
    }
  }
}

/** Check if a file path is within allowed directories */
function isAllowedPath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const homeDir = path.resolve(app.getPath('home'));
  const tmpDir = path.resolve(os.tmpdir());
  return resolved.startsWith(homeDir + path.sep) || resolved.startsWith(tmpDir + path.sep);
}

/** Check if a resolved path is inside the temp directory (symlink-safe) */
function isInsideTempDir(filePath: string): boolean {
  try {
    const resolved = fs.realpathSync(filePath);
    const tmpDir = fs.realpathSync(os.tmpdir());
    return resolved.startsWith(tmpDir + path.sep);
  } catch {
    return false;
  }
}

/** Encode URL path (szóközök és speciális karakterek kezelése) */
function encodeUrlPath(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    parsed.pathname = parsed.pathname.split('/').map(segment =>
      encodeURIComponent(decodeURIComponent(segment))
    ).join('/');
    return parsed.toString();
  } catch {
    return urlString;
  }
}

/** Validate download URL */
function isAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const isLocalDev = !app.isPackaged && parsed.hostname === 'localhost' && parsed.protocol === 'http:';
    if (parsed.protocol !== 'https:' && !isLocalDev) return false;
    if (!ALLOWED_DOWNLOAD_DOMAINS.includes(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Download a file from URL to a local path */
function downloadFile(url: string, destPath: string, maxRedirects = 5): Promise<void> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Tul sok atiranyitas'));
      return;
    }

    const isHttp = url.startsWith('http://');
    const isHttps = url.startsWith('https://');
    if (!isHttps && !(isHttp && !app.isPackaged)) {
      reject(new Error('Csak HTTPS URL megengedett'));
      return;
    }

    const file = fs.createWriteStream(destPath);
    const cleanup = () => { file.close(); fs.unlink(destPath, () => {}); };
    const getter = isHttp ? http.get : https.get;

    getter(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          cleanup();
          if (!isAllowedUrl(redirectUrl)) {
            reject(new Error('Nem engedelyezett redirect cel'));
            return;
          }
          downloadFile(redirectUrl, destPath, maxRedirects - 1).then(resolve).catch(reject);
          return;
        }
      }
      if (response.statusCode !== 200) {
        cleanup();
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      if (contentLength > MAX_DOWNLOAD_SIZE) {
        cleanup();
        response.destroy();
        reject(new Error('A fajl merete meghaladja a megengedettet (50 MB)'));
        return;
      }

      let downloaded = 0;
      response.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        if (downloaded > MAX_DOWNLOAD_SIZE) {
          response.destroy();
          cleanup();
          reject(new Error('A fajl merete meghaladja a megengedettet (50 MB)'));
        }
      });

      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      cleanup();
      reject(err);
    });
  });
}

/** Parse the last valid JSON result from Python stdout */
function parseLastJsonResult(stdout: string): Record<string, unknown> | null {
  const lines = stdout.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed && typeof parsed === 'object' && ('success' in parsed || 'results' in parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch { continue; }
  }
  return null;
}

/** Aspect ratio parse ("4:5" -> 0.8, "3:4" -> 0.75) */
function parseAspectRatio(ratio: string): number {
  const parts = ratio.split(':');
  if (parts.length !== 2) return 0.8;
  const w = parseFloat(parts[0]);
  const h = parseFloat(parts[1]);
  if (isNaN(w) || isNaN(h) || h === 0) return 0.8;
  return w / h;
}

/** Crop settings whitelist sanitization */
function sanitizeCropSettings(settings: Record<string, unknown>): Record<string, unknown> {
  const VALID_PRESETS = ['school_portrait', 'yearbook', 'passport', 'headshot', 'custom'];
  const VALID_RATIOS = ['3:4', '4:5', '2:3', '1:1', '5:7'];
  const VALID_NO_FACE = ['skip', 'center_crop', 'original'];
  const VALID_MULTI_FACE = ['largest', 'first', 'skip'];

  const clampNum = (val: unknown, min: number, max: number, fallback: number): number => {
    const num = Number(val);
    return isNaN(num) ? fallback : Math.max(min, Math.min(max, num));
  };

  return {
    preset: VALID_PRESETS.includes(String(settings.preset)) ? settings.preset : 'school_portrait',
    head_padding_top: clampNum(settings.head_padding_top, 0, 1, 0.25),
    chin_padding_bottom: clampNum(settings.chin_padding_bottom, 0, 1, 0.40),
    shoulder_width: clampNum(settings.shoulder_width, 0.3, 1.5, 0.85),
    face_position_y: clampNum(settings.face_position_y, 0.1, 0.7, 0.38),
    aspect_ratio: VALID_RATIOS.includes(String(settings.aspect_ratio)) ? settings.aspect_ratio : '4:5',
    output_quality: clampNum(settings.output_quality, 50, 100, 95),
    no_face_action: VALID_NO_FACE.includes(String(settings.no_face_action)) ? settings.no_face_action : 'skip',
    multi_face_action: VALID_MULTI_FACE.includes(String(settings.multi_face_action)) ? settings.multi_face_action : 'largest',
  };
}

/** Compute crop rectangle from face landmarks and settings */
function computeCropRect(
  face: {
    forehead: { x: number; y: number };
    chin: { x: number; y: number };
    left_ear: { x: number; y: number };
    right_ear: { x: number; y: number };
    face_center: { x: number; y: number };
    face_width: number;
    face_height: number;
  },
  imgWidth: number,
  imgHeight: number,
  settings: Record<string, unknown>,
): { left: number; top: number; width: number; height: number } {
  const headPaddingTop = Number(settings.head_padding_top) || 0.25;
  const chinPaddingBottom = Number(settings.chin_padding_bottom) || 0.40;
  const shoulderWidth = Number(settings.shoulder_width) || 0.85;
  const facePositionY = Number(settings.face_position_y) || 0.38;
  const aspectRatioStr = String(settings.aspect_ratio || '4:5');
  const aspectRatio = parseAspectRatio(aspectRatioStr);

  const faceH = face.face_height;
  const faceW = face.face_width;
  const faceCX = face.face_center.x;

  // Teljes "fej + váll" magasság: fej + padding top + padding bottom
  const totalContentH = faceH * (1 + headPaddingTop + chinPaddingBottom);

  // A crop magassága: az arcközép a face_position_y arányban legyen
  const cropH = totalContentH / (1 - (1 - facePositionY) * 0.3);

  // A crop szélessége: aspect ratio alapján
  const cropW = cropH * aspectRatio;

  // Minimális szélesség: váll arány * arcszélesség
  const minW = faceW * shoulderWidth * 2.2;
  const finalW = Math.max(cropW, minW);
  const finalH = finalW / aspectRatio;

  // Az arc teteje (homlok) a crop tetejétől headPaddingTop * faceH-ra legyen
  const cropTop = face.forehead.y - headPaddingTop * faceH;

  // Középre igazítás vízszintesen
  const cropLeft = faceCX - finalW / 2;

  // Kerekítés és clamp
  let left = Math.round(Math.max(0, cropLeft));
  let top = Math.round(Math.max(0, cropTop));
  let width = Math.round(Math.min(finalW, imgWidth - left));
  let height = Math.round(Math.min(finalH, imgHeight - top));

  // Ha a crop kilóg alul, toljuk feljebb
  if (top + height > imgHeight) {
    top = Math.max(0, imgHeight - height);
  }
  // Ha a crop kilóg jobbra, toljuk balra
  if (left + width > imgWidth) {
    left = Math.max(0, imgWidth - width);
  }

  // Biztosítsuk az aspect ratio-t a végleges crop-ban
  const targetRatio = aspectRatio;
  const currentRatio = width / height;
  if (currentRatio > targetRatio) {
    // Túl széles → szűkítsük
    width = Math.round(height * targetRatio);
    left = Math.round(Math.max(0, faceCX - width / 2));
    if (left + width > imgWidth) left = imgWidth - width;
  } else if (currentRatio < targetRatio) {
    // Túl magas → vágjuk
    height = Math.round(width / targetRatio);
    if (top + height > imgHeight) top = Math.max(0, imgHeight - height);
  }

  return {
    left: Math.max(0, left),
    top: Math.max(0, top),
    width: Math.max(1, Math.min(width, imgWidth)),
    height: Math.max(1, Math.min(height, imgHeight)),
  };
}

/** Cleanup old temp files (24+ hours) on startup */
function cleanupOldTempFiles(): void {
  const cropTmpDir = path.join(os.tmpdir(), TEMP_DIR_NAME);
  if (!fs.existsSync(cropTmpDir)) return;

  const maxAge = 24 * 60 * 60 * 1000;
  try {
    const entries = fs.readdirSync(cropTmpDir);
    for (const entry of entries) {
      const filePath = path.join(cropTmpDir, entry);
      try {
        const stats = fs.statSync(filePath);
        if (Date.now() - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          log.info(`Regi crop temp torolve: ${entry}`);
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
}

export function registerCropHandlers(): void {
  // Induláskori régi temp fájlok törlése
  cleanupOldTempFiles();

  // Kilépéskori cleanup
  app.on('will-quit', () => {
    const cropTmpDir = path.join(os.tmpdir(), TEMP_DIR_NAME);
    try { fs.rmSync(cropTmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  // ============ Check Python + MediaPipe availability ============
  ipcMain.handle('crop:check-python', () => {
    return new Promise<{ available: boolean; error?: string }>((resolve) => {
      const scriptPath = path.join(getScriptsPath(), 'auto_crop.py');

      if (!fs.existsSync(scriptPath)) {
        resolve({ available: false, error: 'Python script nem talalhato' });
        return;
      }

      ensureVenv();

      execFile(getPythonPath(), [scriptPath, '--check'], { timeout: 60000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout) => {
        if (error) {
          log.warn('Crop Python check failed:', error.message);
          resolve({ available: false, error: error.message });
          return;
        }
        try {
          const result = JSON.parse(stdout.trim());
          resolve({ available: result.available === true });
        } catch {
          resolve({ available: false, error: 'Ervenytelen valasz a Python scripttol' });
        }
      });
    });
  });

  // ============ Detect faces in a single image ============
  ipcMain.handle('crop:detect-faces', (_event, params: { inputPath: string }) => {
    return new Promise<Record<string, unknown>>((resolve) => {
      if (!params || typeof params.inputPath !== 'string') {
        resolve({ success: false, error: 'Ervenytelen parameterek' });
        return;
      }

      if (!isAllowedPath(params.inputPath)) {
        resolve({ success: false, error: 'Path traversal nem megengedett' });
        return;
      }

      const ext = path.extname(params.inputPath).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) {
        resolve({ success: false, error: `Nem tamogatott fajlformatum: ${ext}` });
        return;
      }

      if (!fs.existsSync(params.inputPath)) {
        resolve({ success: false, error: 'Bemeneti fajl nem talalhato' });
        return;
      }

      const scriptPath = path.join(getScriptsPath(), 'auto_crop.py');
      if (!fs.existsSync(scriptPath)) {
        resolve({ success: false, error: 'Python script nem talalhato' });
        return;
      }

      const args = [scriptPath, '--input', params.inputPath];

      execFile(getPythonPath(), args, { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          log.error('Crop detect failed:', error.message);
          if (stderr) log.error('stderr:', stderr);
          resolve({ success: false, error: error.message });
          return;
        }

        const result = parseLastJsonResult(stdout);
        if (!result) {
          log.error('Crop output parse error. stdout:', stdout.slice(0, 500));
          resolve({ success: false, error: 'Ervenytelen valasz a Python scripttol' });
          return;
        }

        resolve(result);
      });
    });
  });

  // ============ Detect faces in batch ============
  ipcMain.handle('crop:detect-batch', (_event, params: { items: Array<{ input: string }> }) => {
    return new Promise<Record<string, unknown>>((resolve) => {
      if (!params || !Array.isArray(params.items) || params.items.length === 0) {
        resolve({ success: false, error: 'Nincsenek feldolgozando elemek' });
        return;
      }

      if (params.items.length > 500) {
        resolve({ success: false, error: 'Tul sok elem (max 500)' });
        return;
      }

      const scriptPath = path.join(getScriptsPath(), 'auto_crop.py');
      if (!fs.existsSync(scriptPath)) {
        resolve({ success: false, error: 'Python script nem talalhato' });
        return;
      }

      for (const item of params.items) {
        if (!item.input || typeof item.input !== 'string') {
          resolve({ success: false, error: 'Minden elemnek input szukseges' });
          return;
        }
        if (!isAllowedPath(item.input)) {
          resolve({ success: false, error: 'Path traversal nem megengedett' });
          return;
        }
        const ext = path.extname(item.input).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.has(ext)) {
          resolve({ success: false, error: `Nem tamogatott fajlformatum: ${ext}` });
          return;
        }
      }

      const batchPath = writeTempJson(params.items);
      const args = [scriptPath, '--batch-json', batchPath];

      // Timeout: min 60s + item*10s, max 300s
      const timeout = Math.min(60000 + params.items.length * 10000, 300000);

      execFile(getPythonPath(), args, { timeout, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        cleanupTemp(batchPath);

        if (error) {
          log.error('Crop detect-batch failed:', error.message);
          if (stderr) log.error('stderr:', stderr);
          resolve({ success: false, error: error.message });
          return;
        }

        const result = parseLastJsonResult(stdout);
        if (!result) {
          log.error('Crop batch parse error. stdout:', stdout.slice(0, 500));
          resolve({ success: false, error: 'Ervenytelen valasz a Python scripttol' });
          return;
        }

        resolve(result);
      });
    });
  });

  // ============ Execute crop on single image (Sharp) ============
  ipcMain.handle('crop:execute-crop', async (_event, params: {
    inputPath: string;
    outputPath: string;
    thumbnailPath?: string;
    face: Record<string, unknown>;
    settings: Record<string, unknown>;
  }) => {
    if (!params || typeof params.inputPath !== 'string' || typeof params.outputPath !== 'string') {
      return { success: false, error: 'Ervenytelen parameterek' };
    }

    if (!isAllowedPath(params.inputPath) || !isAllowedPath(params.outputPath)) {
      return { success: false, error: 'Path traversal nem megengedett' };
    }

    if (params.thumbnailPath && !isAllowedPath(params.thumbnailPath)) {
      return { success: false, error: 'Path traversal nem megengedett (thumbnail)' };
    }

    if (!fs.existsSync(params.inputPath)) {
      return { success: false, error: 'Bemeneti fajl nem talalhato' };
    }

    try {
      const sanitized = sanitizeCropSettings(params.settings || {});
      const metadata = await sharp(params.inputPath).metadata();
      const imgW = metadata.width || 0;
      const imgH = metadata.height || 0;

      if (imgW === 0 || imgH === 0) {
        return { success: false, error: 'Ervenytelen kepmeret' };
      }

      const face = params.face as {
        forehead: { x: number; y: number };
        chin: { x: number; y: number };
        left_ear: { x: number; y: number };
        right_ear: { x: number; y: number };
        face_center: { x: number; y: number };
        face_width: number;
        face_height: number;
      };

      const crop = computeCropRect(face, imgW, imgH, sanitized);
      const quality = Number(sanitized.output_quality) || 95;

      // Output dir letrehozas
      const outDir = path.dirname(params.outputPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // Vagás Sharp-pal
      await sharp(params.inputPath)
        .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
        .jpeg({ quality, mozjpeg: true })
        .toFile(params.outputPath);

      // Thumbnail készítés
      if (params.thumbnailPath) {
        const thumbDir = path.dirname(params.thumbnailPath);
        if (!fs.existsSync(thumbDir)) {
          fs.mkdirSync(thumbDir, { recursive: true });
        }
        await sharp(params.outputPath)
          .resize(400, null, { withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(params.thumbnailPath);
      }

      return {
        success: true,
        outputPath: params.outputPath,
        thumbnailPath: params.thumbnailPath || null,
        crop,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('Crop execute failed:', msg);
      return { success: false, error: msg };
    }
  });

  // ============ Execute batch crop (Sharp) ============
  ipcMain.handle('crop:execute-batch-crop', async (_event, params: {
    items: Array<{
      inputPath: string;
      outputPath: string;
      thumbnailPath: string;
      face: Record<string, unknown>;
    }>;
    settings: Record<string, unknown>;
  }) => {
    if (!params || !Array.isArray(params.items) || params.items.length === 0) {
      return { success: false, error: 'Nincsenek feldolgozando elemek' };
    }

    if (params.items.length > 500) {
      return { success: false, error: 'Tul sok elem (max 500)' };
    }

    const sanitized = sanitizeCropSettings(params.settings || {});
    const quality = Number(sanitized.output_quality) || 95;
    const results: Array<{
      success: boolean;
      inputPath: string;
      outputPath?: string;
      thumbnailPath?: string;
      crop?: { left: number; top: number; width: number; height: number };
      error?: string;
    }> = [];

    for (const item of params.items) {
      try {
        if (!isAllowedPath(item.inputPath) || !isAllowedPath(item.outputPath)) {
          results.push({ success: false, inputPath: item.inputPath, error: 'Path traversal nem megengedett' });
          continue;
        }

        if (!fs.existsSync(item.inputPath)) {
          results.push({ success: false, inputPath: item.inputPath, error: 'Fajl nem talalhato' });
          continue;
        }

        const metadata = await sharp(item.inputPath).metadata();
        const imgW = metadata.width || 0;
        const imgH = metadata.height || 0;

        if (imgW === 0 || imgH === 0) {
          results.push({ success: false, inputPath: item.inputPath, error: 'Ervenytelen kepmeret' });
          continue;
        }

        const face = item.face as {
          forehead: { x: number; y: number };
          chin: { x: number; y: number };
          left_ear: { x: number; y: number };
          right_ear: { x: number; y: number };
          face_center: { x: number; y: number };
          face_width: number;
          face_height: number;
        };

        const crop = computeCropRect(face, imgW, imgH, sanitized);

        // Output dir
        const outDir = path.dirname(item.outputPath);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }

        // Vagás
        await sharp(item.inputPath)
          .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
          .jpeg({ quality, mozjpeg: true })
          .toFile(item.outputPath);

        // Thumbnail
        if (item.thumbnailPath) {
          const thumbDir = path.dirname(item.thumbnailPath);
          if (!fs.existsSync(thumbDir)) {
            fs.mkdirSync(thumbDir, { recursive: true });
          }
          await sharp(item.outputPath)
            .resize(400, null, { withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(item.thumbnailPath);
        }

        results.push({
          success: true,
          inputPath: item.inputPath,
          outputPath: item.outputPath,
          thumbnailPath: item.thumbnailPath || undefined,
          crop,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error(`Crop batch item failed (${path.basename(item.inputPath)}):`, msg);
        results.push({ success: false, inputPath: item.inputPath, error: msg });
      }
    }

    const successful = results.filter(r => r.success).length;
    return { success: true, results, total: results.length, successful };
  });

  // ============ Download photo from API ============
  ipcMain.handle('crop:download-photo', async (_event, params: {
    url: string;
    outputPath: string;
  }) => {
    if (!params || typeof params.url !== 'string' || typeof params.outputPath !== 'string') {
      return { success: false, error: 'Ervenytelen parameterek' };
    }

    if (params.url.length > 2000) {
      return { success: false, error: 'URL tul hosszu' };
    }

    const encodedUrl = encodeUrlPath(params.url);
    if (!isAllowedUrl(encodedUrl)) {
      return { success: false, error: 'Nem engedelyezett URL domain' };
    }

    if (!isAllowedPath(params.outputPath)) {
      return { success: false, error: 'Path traversal nem megengedett' };
    }

    try {
      const dir = path.dirname(params.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await downloadFile(encodedUrl, params.outputPath);
      return { success: true, path: params.outputPath };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('Crop photo download failed:', msg);
      return { success: false, error: msg };
    }
  });

  // ============ Get temp directory ============
  ipcMain.handle('crop:get-temp-dir', () => {
    const tmpDir = path.join(os.tmpdir(), TEMP_DIR_NAME);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  });

  // ============ Cleanup temp files ============
  ipcMain.handle('crop:cleanup-temp', (_event, filePaths: string[]) => {
    if (!Array.isArray(filePaths)) return { success: false };
    let cleaned = 0;
    for (const fp of filePaths) {
      if (typeof fp === 'string' && isInsideTempDir(fp)) {
        cleanupTemp(path.resolve(fp));
        cleaned++;
      }
    }
    return { success: true, cleaned };
  });

  // ============ Read processed file (for upload) ============
  ipcMain.handle('crop:read-processed-file', async (_event, params: { filePath: string }) => {
    if (!params || typeof params.filePath !== 'string') {
      return { success: false, error: 'Ervenytelen parameterek' };
    }

    if (!isInsideTempDir(params.filePath)) {
      return { success: false, error: 'Csak temp konyvtarbol olvasas engedelyezett' };
    }

    const ext = path.extname(params.filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      return { success: false, error: 'Nem tamogatott fajlformatum' };
    }

    try {
      const stats = fs.statSync(params.filePath);
      if (stats.size > MAX_READ_SIZE || stats.size === 0) {
        return { success: false, error: 'Ervenytelen fajlmeret' };
      }

      const buffer = fs.readFileSync(params.filePath);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      return { success: true, data: arrayBuffer };
    } catch {
      return { success: false, error: 'Fajl olvasasi hiba' };
    }
  });

  log.info('Crop IPC handlerek regisztralva');
}
