import { ipcMain, app } from 'electron';
import { execFile, execFileSync } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import * as https from 'https';
import log from 'electron-log/main';

// Engedelyezett fajlkiterjesztesek
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif']);

// Engedelyezett letoltesi domainek (csak HTTPS)
const ALLOWED_DOWNLOAD_DOMAINS = [
  'api.tablostudio.hu',
  'tablostudio.hu',
  ...(app.isPackaged ? [] : ['localhost']),
];

/** Python script base path (extraResources or dev) */
function getScriptsPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'scripts', 'portrait', 'python')
    : path.join(__dirname, '..', '..', 'scripts', 'portrait', 'python');
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

  // Fallback: system python3
  log.warn('Portrait venv python nem talalhato, system python3 hasznalata');
  return 'python3';
}

/** Ensure venv exists, create if missing. Returns true if ready. */
function ensureVenv(): boolean {
  const scriptsPath = getScriptsPath();
  const isWin = process.platform === 'win32';
  const venvPython = isWin
    ? path.join(scriptsPath, '.venv', 'Scripts', 'python.exe')
    : path.join(scriptsPath, '.venv', 'bin', 'python3');

  // Already exists and works?
  if (fs.existsSync(venvPython)) {
    return true;
  }

  const requirementsPath = path.join(scriptsPath, 'requirements.txt');
  if (!fs.existsSync(requirementsPath)) {
    log.error('Portrait requirements.txt nem talalhato');
    return false;
  }

  log.info('Portrait venv letrehozasa...');
  try {
    // Create venv
    execFileSync('python3', ['-m', 'venv', path.join(scriptsPath, '.venv')], {
      timeout: 60000,
    });

    // Install requirements
    const pipPath = isWin
      ? path.join(scriptsPath, '.venv', 'Scripts', 'pip.exe')
      : path.join(scriptsPath, '.venv', 'bin', 'pip');

    execFileSync(pipPath, ['install', '-r', requirementsPath, '--quiet'], {
      timeout: 300000, // 5 perc (torch + modell letoltes)
    });

    log.info('Portrait venv sikeresen letrehozva');
    return fs.existsSync(venvPython);
  } catch (err: unknown) {
    log.error('Portrait venv letrehozas sikertelen:', (err as Error).message);
    return false;
  }
}

/** Write data to a temp JSON file, return its path */
function writeTempJson(data: unknown): string {
  const tmpPath = path.join(os.tmpdir(), `portrait-${crypto.randomUUID()}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  return tmpPath;
}

/** Safely remove a temp file (no TOCTOU) */
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

/** Encode URL path (szóközök és speciális karakterek kezelése a fájlnevekben) */
function encodeUrlPath(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    // A pathname-t encode-oljuk, de a már encode-olt %-eket ne duplázza
    parsed.pathname = parsed.pathname.split('/').map(segment =>
      encodeURIComponent(decodeURIComponent(segment))
    ).join('/');
    return parsed.toString();
  } catch {
    return urlString;
  }
}

/** Validate download URL - only HTTPS from allowed domains (+ localhost dev) */
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

/** Max letoltesi meret: 50 MB */
const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024;

/** Download a file from URL to a local path (HTTPS only, max 5 redirects, 50 MB limit) */
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

      // Meretkorlat ellenorzes Content-Length-bol
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      if (contentLength > MAX_DOWNLOAD_SIZE) {
        cleanup();
        response.destroy();
        reject(new Error('A fajl merete meghaladja a megengedettet (50 MB)'));
        return;
      }

      // Streaming meretkorlat
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

/** Whitelist-alapu sanitizalas: csak ismert kulcsok, ervenyes ertekek */
function sanitizeSettings(settings: Record<string, unknown>): Record<string, unknown> {
  const VALID_MODES = ['replace', 'darken'];
  const VALID_BG_TYPES = ['preset', 'color', 'image', 'gradient'];
  const VALID_PRESETS = ['black', 'charcoal', 'dark_gray', 'navy', 'dark_blue', 'white', 'light_gray'];
  const VALID_DIRECTIONS = ['vertical', 'horizontal', 'radial'];

  const clampNum = (val: unknown, min: number, max: number, fallback: number): number => {
    const num = Number(val);
    return isNaN(num) ? fallback : Math.max(min, Math.min(max, num));
  };

  const clampColor = (val: unknown): number => clampNum(val, 0, 255, 0);

  const sanitized: Record<string, unknown> = {
    // String enum mezok
    mode: VALID_MODES.includes(String(settings.mode)) ? settings.mode : 'replace',
    background_type: VALID_BG_TYPES.includes(String(settings.background_type)) ? settings.background_type : 'preset',
    preset_name: VALID_PRESETS.includes(String(settings.preset_name)) ? settings.preset_name : 'charcoal',
    gradient_direction: VALID_DIRECTIONS.includes(String(settings.gradient_direction)) ? settings.gradient_direction : 'vertical',

    // Szin ertekek (0-255)
    color_r: clampColor(settings.color_r),
    color_g: clampColor(settings.color_g),
    color_b: clampColor(settings.color_b),
    gradient_start_r: clampColor(settings.gradient_start_r),
    gradient_start_g: clampColor(settings.gradient_start_g),
    gradient_start_b: clampColor(settings.gradient_start_b),
    gradient_end_r: clampColor(settings.gradient_end_r),
    gradient_end_g: clampColor(settings.gradient_end_g),
    gradient_end_b: clampColor(settings.gradient_end_b),

    // El feldolgozas
    edge_inset: clampNum(settings.edge_inset, 0, 20, 2),
    feather_radius: clampNum(settings.feather_radius, 0, 50, 3),
    edge_smoothing: clampNum(settings.edge_smoothing, 0, 10, 2),
    output_quality: clampNum(settings.output_quality, 50, 100, 95),

    // Float ertekek (0-1)
    decontaminate: Boolean(settings.decontaminate),
    decontaminate_strength: clampNum(settings.decontaminate_strength, 0, 1, 0.8),
    hair_refinement: Boolean(settings.hair_refinement),
    hair_refinement_strength: clampNum(settings.hair_refinement_strength, 0, 1, 0.4),
    add_shadow: Boolean(settings.add_shadow),
    shadow_opacity: clampNum(settings.shadow_opacity, 0, 1, 0.3),
    darken_amount: clampNum(settings.darken_amount, 0, 1, 0.7),
    target_brightness: clampNum(settings.target_brightness, 0, 255, 35),
  };

  // background_image_path validacio (path traversal vedelem)
  if (typeof settings.background_image_path === 'string' && isAllowedPath(settings.background_image_path)) {
    sanitized.background_image_path = settings.background_image_path;
  }

  return sanitized;
}

/** Cleanup old temp files (24+ hours) on startup */
function cleanupOldTempFiles(): void {
  const portraitTmpDir = path.join(os.tmpdir(), 'photostack-portrait');
  if (!fs.existsSync(portraitTmpDir)) return;

  const maxAge = 24 * 60 * 60 * 1000; // 24 óra
  try {
    const entries = fs.readdirSync(portraitTmpDir);
    for (const entry of entries) {
      const filePath = path.join(portraitTmpDir, entry);
      try {
        const stats = fs.statSync(filePath);
        if (Date.now() - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          log.info(`Regi portrait temp torolve: ${entry}`);
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
}

/** Max read size for readProcessedFile: 30 MB */
const MAX_READ_SIZE = 30 * 1024 * 1024;

export function registerPortraitHandlers(): void {
  // Induláskori régi temp fájlok törlése
  cleanupOldTempFiles();

  // Kilépéskori cleanup
  app.on('will-quit', () => {
    const portraitTmpDir = path.join(os.tmpdir(), 'photostack-portrait');
    try { fs.rmSync(portraitTmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });
  // ============ Check Python + InSPyReNet availability ============
  ipcMain.handle('portrait:check-python', () => {
    return new Promise<{ available: boolean; error?: string }>((resolve) => {
      const scriptPath = path.join(getScriptsPath(), 'process_portrait.py');

      if (!fs.existsSync(scriptPath)) {
        resolve({ available: false, error: 'Python script nem talalhato' });
        return;
      }

      // Ensure venv exists (auto-install if missing)
      ensureVenv();

      execFile(getPythonPath(), [scriptPath, '--check'], { timeout: 60000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout) => {
        if (error) {
          log.warn('Portrait Python check failed:', error.message);
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

  // ============ Process single portrait ============
  ipcMain.handle('portrait:process-single', (_event, params: {
    inputPath: string;
    outputPath: string;
    settings: Record<string, unknown>;
  }) => {
    return new Promise<{ success: boolean; error?: string; processing_time?: number }>((resolve) => {
      if (!params || typeof params.inputPath !== 'string' || typeof params.outputPath !== 'string') {
        resolve({ success: false, error: 'Ervenytelen parameterek' });
        return;
      }

      // Path traversal vedelem
      if (!isAllowedPath(params.inputPath)) {
        resolve({ success: false, error: 'Path traversal nem megengedett (input)' });
        return;
      }
      if (!isAllowedPath(params.outputPath)) {
        resolve({ success: false, error: 'Path traversal nem megengedett (output)' });
        return;
      }

      // Fajlkiterjesztes validacio
      const ext = path.extname(params.inputPath).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) {
        resolve({ success: false, error: `Nem tamogatott fajlformatum: ${ext}` });
        return;
      }

      if (!fs.existsSync(params.inputPath)) {
        resolve({ success: false, error: 'Bemeneti fajl nem talalhato' });
        return;
      }

      const scriptPath = path.join(getScriptsPath(), 'process_portrait.py');
      if (!fs.existsSync(scriptPath)) {
        resolve({ success: false, error: 'Python script nem talalhato' });
        return;
      }

      const settingsPath = writeTempJson(sanitizeSettings(params.settings || {}));

      const args = [
        scriptPath,
        '--input', params.inputPath,
        '--output', params.outputPath,
        '--settings-json', settingsPath,
      ];

      log.info(`Portrait feldolgozas: ${path.basename(params.inputPath)}`);

      execFile(getPythonPath(), args, { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        cleanupTemp(settingsPath);

        if (error) {
          log.error('Portrait process failed:', error.message);
          if (stderr) log.error('stderr:', stderr);
          resolve({ success: false, error: error.message });
          return;
        }

        const result = parseLastJsonResult(stdout);
        if (!result) {
          log.error('Portrait output parse error. stdout:', stdout.slice(0, 500));
          resolve({ success: false, error: 'Ervenytelen valasz a Python scripttol' });
          return;
        }

        resolve({
          success: result.success === true,
          error: result.error ? String(result.error).slice(0, 500) : undefined,
          processing_time: typeof result.processing_time === 'number' ? result.processing_time : undefined,
        });
      });
    });
  });

  // ============ Process batch (multiple portraits) ============
  ipcMain.handle('portrait:process-batch', (_event, params: {
    items: Array<{ input: string; output: string }>;
    settings: Record<string, unknown>;
  }) => {
    return new Promise<{
      success: boolean;
      error?: string;
      results?: Array<{ success: boolean; input: string; output?: string; error?: string; processing_time?: number }>;
      total?: number;
      successful?: number;
    }>((resolve) => {
      if (!params || !Array.isArray(params.items) || params.items.length === 0) {
        resolve({ success: false, error: 'Nincsenek feldolgozando elemek' });
        return;
      }

      if (params.items.length > 500) {
        resolve({ success: false, error: 'Tul sok elem (max 500)' });
        return;
      }

      const scriptPath = path.join(getScriptsPath(), 'process_portrait.py');
      if (!fs.existsSync(scriptPath)) {
        resolve({ success: false, error: 'Python script nem talalhato' });
        return;
      }

      for (const item of params.items) {
        if (!item.input || !item.output) {
          resolve({ success: false, error: 'Minden elemnek input es output szukseges' });
          return;
        }
        // Path traversal vedelem
        if (!isAllowedPath(item.input) || !isAllowedPath(item.output)) {
          resolve({ success: false, error: 'Path traversal nem megengedett' });
          return;
        }
        // Fajlkiterjesztes validacio
        const ext = path.extname(item.input).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.has(ext)) {
          resolve({ success: false, error: `Nem tamogatott fajlformatum: ${ext}` });
          return;
        }
        if (!fs.existsSync(item.input)) {
          resolve({ success: false, error: 'Bemeneti fajl nem talalhato' });
          return;
        }
      }

      const settingsPath = writeTempJson(sanitizeSettings(params.settings || {}));
      const batchPath = writeTempJson(params.items);

      const args = [
        scriptPath,
        '--batch-json', batchPath,
        '--settings-json', settingsPath,
      ];

      log.info(`Portrait batch feldolgozas: ${params.items.length} elem`);

      // Minimum 5 perc (modell első betöltése lassú) + elemenként 2 perc, max 10 perc
      const timeout = Math.min(300000 + params.items.length * 120000, 600000);

      execFile(getPythonPath(), args, { timeout, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        cleanupTemp(settingsPath);
        cleanupTemp(batchPath);

        if (error) {
          log.error('Portrait batch failed:', error.message);
          if (stderr) log.error('stderr:', stderr);
          resolve({ success: false, error: error.message });
          return;
        }

        const result = parseLastJsonResult(stdout);
        if (!result) {
          log.error('Portrait batch parse error. stdout:', stdout.slice(0, 500));
          resolve({ success: false, error: 'Ervenytelen valasz a Python scripttol' });
          return;
        }

        resolve(result as {
          success: boolean;
          results?: Array<{ success: boolean; input: string; output?: string; error?: string; processing_time?: number }>;
          total?: number;
          successful?: number;
        });
      });
    });
  });

  // ============ Download background image from API ============
  ipcMain.handle('portrait:download-background', async (_event, params: {
    url: string;
    outputPath: string;
  }) => {
    if (!params || typeof params.url !== 'string' || typeof params.outputPath !== 'string') {
      return { success: false, error: 'Ervenytelen parameterek' };
    }

    if (params.url.length > 2000) {
      return { success: false, error: 'URL tul hosszu' };
    }

    // URL path encode-olás (szóközök, ékezetes karakterek a fájlnevekben)
    const encodedUrl = encodeUrlPath(params.url);

    // URL whitelist validacio
    if (!isAllowedUrl(encodedUrl)) {
      return { success: false, error: 'Nem engedelyezett URL domain' };
    }

    // Path traversal vedelem
    if (!isAllowedPath(params.outputPath)) {
      return { success: false, error: 'Path traversal nem megengedett' };
    }

    try {
      const dir = path.dirname(params.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await downloadFile(encodedUrl, params.outputPath);
      log.info(`Portrait hatterkep letoltve: ${path.basename(params.outputPath)}`);
      return { success: true, path: params.outputPath };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('Portrait background download failed:', msg);
      return { success: false, error: msg };
    }
  });

  // ============ Get temp directory for portrait processing ============
  ipcMain.handle('portrait:get-temp-dir', () => {
    const tmpDir = path.join(os.tmpdir(), 'photostack-portrait');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  });

  // ============ Cleanup temp files ============
  ipcMain.handle('portrait:cleanup-temp', (_event, filePaths: string[]) => {
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

  // ============ Read processed file (for batch upload) ============
  ipcMain.handle('portrait:read-processed-file', async (_event, params: { filePath: string }) => {
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
      // Explicit ArrayBuffer masolat (Buffer.buffer problema elkerulese)
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      return { success: true, data: arrayBuffer };
    } catch {
      return { success: false, error: 'Fajl olvasasi hiba' };
    }
  });

  log.info('Portrait IPC handlerek regisztralva');
}
