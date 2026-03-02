/**
 * Crop handler segédfunkciók — megosztott utility-k a crop IPC handlerekhez.
 */
import { app } from 'electron';
import { execFileSync } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import * as https from 'https';
import log from 'electron-log/main';

// Engedélyezett fájlkiterjesztések
export const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif']);

// Engedélyezett letöltési domainek (csak HTTPS)
export const ALLOWED_DOWNLOAD_DOMAINS = [
  'api.tablostudio.hu',
  'tablostudio.hu',
  ...(app.isPackaged ? [] : ['localhost']),
];

/** Temp könyvtár neve */
export const TEMP_DIR_NAME = 'photostack-crop';

/** Max letöltési méret: 50 MB */
export const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024;

/** Max read size: 30 MB */
export const MAX_READ_SIZE = 30 * 1024 * 1024;

/** Python script base path (extraResources or dev) */
export function getScriptsPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'scripts', 'crop', 'python')
    : path.join(__dirname, '..', '..', 'scripts', 'crop', 'python');
}

/** Venv python binary path (platform-aware) */
export function getPythonPath(): string {
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
export function ensureVenv(): boolean {
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
export function writeTempJson(data: unknown): string {
  const tmpDir = path.join(os.tmpdir(), TEMP_DIR_NAME);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const tmpPath = path.join(tmpDir, `crop-${crypto.randomUUID()}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  return tmpPath;
}

/** Safely remove a temp file */
export function cleanupTemp(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      log.warn('Temp fajl torlesi hiba:', (err as Error).message);
    }
  }
}

/**
 * Check if a file path is within allowed directories.
 * Íráshoz (output) csak temp dir engedélyezett — olvasáshoz home + temp.
 */
export function isAllowedReadPath(filePath: string): boolean {
  const resolved = resolveRealPath(filePath);
  if (!resolved) return false;
  const homeDir = fs.realpathSync(app.getPath('home'));
  const tmpDir = fs.realpathSync(os.tmpdir());
  return resolved.startsWith(homeDir + path.sep) || resolved.startsWith(tmpDir + path.sep);
}

/**
 * Check if a file path is within temp directory (írás engedélyezve).
 * Symlink-safe: realpathSync-et használ.
 */
export function isAllowedWritePath(filePath: string): boolean {
  return isInsideTempDir(filePath);
}

/** Check if a resolved path is inside the temp directory (symlink-safe) */
export function isInsideTempDir(filePath: string): boolean {
  const resolved = resolveRealPath(filePath);
  if (!resolved) return false;
  const tmpDir = fs.realpathSync(os.tmpdir());
  return resolved.startsWith(tmpDir + path.sep);
}

/** Resolve path with symlink protection. Returns null if resolution fails. */
function resolveRealPath(filePath: string): string | null {
  try {
    // Ha a fájl még nem létezik, a szülő könyvtárat resolve-oljuk
    if (!fs.existsSync(filePath)) {
      const parentDir = path.dirname(filePath);
      if (!fs.existsSync(parentDir)) return null;
      const realParent = fs.realpathSync(parentDir);
      return path.join(realParent, path.basename(filePath));
    }
    return fs.realpathSync(filePath);
  } catch {
    return null;
  }
}

/** Encode URL path (szóközök és speciális karakterek kezelése) */
export function encodeUrlPath(urlString: string): string {
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
export function isAllowedUrl(urlString: string): boolean {
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
export function downloadFile(url: string, destPath: string, maxRedirects = 5): Promise<void> {
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

    const getter = isHttp ? http.get : https.get;

    // Content-Length ellenőrzés ELŐTT nyitjuk meg a fájlt
    getter(url, { timeout: 30000 }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          response.destroy();
          if (!isAllowedUrl(redirectUrl)) {
            reject(new Error('Nem engedelyezett redirect cel'));
            return;
          }
          downloadFile(redirectUrl, destPath, maxRedirects - 1).then(resolve).catch(reject);
          return;
        }
      }
      if (response.statusCode !== 200) {
        response.destroy();
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      // Content-Length ellenőrzés MIELŐTT írunk
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      if (contentLength > MAX_DOWNLOAD_SIZE) {
        response.destroy();
        reject(new Error('A fajl merete meghaladja a megengedettet (50 MB)'));
        return;
      }

      // Csak a méret-check után nyitjuk meg a fájlt írásra
      const file = fs.createWriteStream(destPath);
      const cleanup = () => { file.close(); fs.unlink(destPath, () => {}); };

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
      file.on('error', (err) => { cleanup(); reject(err); });
    }).on('error', (err) => {
      reject(err);
    }).on('timeout', () => {
      reject(new Error('Letöltés időtúllépés (30s)'));
    });
  });
}

/** Parse the last valid JSON result from Python stdout */
export function parseLastJsonResult(stdout: string): Record<string, unknown> | null {
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
export function parseAspectRatio(ratio: string): number {
  const parts = ratio.split(':');
  if (parts.length !== 2) return 0.8;
  const w = parseFloat(parts[0]);
  const h = parseFloat(parts[1]);
  if (isNaN(w) || isNaN(h) || h === 0) return 0.8;
  return w / h;
}

/** Crop settings whitelist sanitization */
export function sanitizeCropSettings(settings: Record<string, unknown>): Record<string, unknown> {
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
export function computeCropRect(
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

  const totalContentH = faceH * (1 + headPaddingTop + chinPaddingBottom);
  const cropH = totalContentH / (1 - (1 - facePositionY) * 0.3);
  const cropW = cropH * aspectRatio;
  const minW = faceW * shoulderWidth * 2.2;
  const finalW = Math.max(cropW, minW);
  const finalH = finalW / aspectRatio;

  const cropTop = face.forehead.y - headPaddingTop * faceH;
  const cropLeft = faceCX - finalW / 2;

  let left = Math.round(Math.max(0, cropLeft));
  let top = Math.round(Math.max(0, cropTop));
  let width = Math.round(Math.min(finalW, imgWidth - left));
  let height = Math.round(Math.min(finalH, imgHeight - top));

  if (top + height > imgHeight) top = Math.max(0, imgHeight - height);
  if (left + width > imgWidth) left = Math.max(0, imgWidth - width);

  const currentRatio = width / height;
  if (currentRatio > aspectRatio) {
    width = Math.round(height * aspectRatio);
    left = Math.round(Math.max(0, faceCX - width / 2));
    if (left + width > imgWidth) left = imgWidth - width;
  } else if (currentRatio < aspectRatio) {
    height = Math.round(width / aspectRatio);
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
export function cleanupOldTempFiles(): void {
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
