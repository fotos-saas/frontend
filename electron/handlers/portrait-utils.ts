import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import * as https from 'https';
import { app } from 'electron';
import log from 'electron-log/main';

// Engedelyezett fajlkiterjesztesek
export const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif']);

// Engedelyezett letoltesi domainek (csak HTTPS)
export const ALLOWED_DOWNLOAD_DOMAINS = [
  'api.tablostudio.hu',
  'tablostudio.hu',
  ...(app.isPackaged ? [] : ['localhost']),
];

/** Max letoltesi meret: 50 MB */
export const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024;

/** Max read size for readProcessedFile: 30 MB */
export const MAX_READ_SIZE = 30 * 1024 * 1024;

/** Check if a file path is within allowed directories */
export function isAllowedPath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const homeDir = path.resolve(app.getPath('home'));
  const tmpDir = path.resolve(os.tmpdir());
  return resolved.startsWith(homeDir + path.sep) || resolved.startsWith(tmpDir + path.sep);
}

/** Check if a resolved path is inside the temp directory (symlink-safe) */
export function isInsideTempDir(filePath: string): boolean {
  try {
    const resolved = fs.realpathSync(filePath);
    const tmpDir = fs.realpathSync(os.tmpdir());
    return resolved.startsWith(tmpDir + path.sep);
  } catch {
    return false;
  }
}

/** Encode URL path (szóközök és speciális karakterek kezelése a fájlnevekben) */
export function encodeUrlPath(urlString: string): string {
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

/** Write data to a temp JSON file, return its path */
export function writeTempJson(data: unknown): string {
  const tmpPath = path.join(os.tmpdir(), `portrait-${crypto.randomUUID()}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  return tmpPath;
}

/** Safely remove a temp file (no TOCTOU) */
export function cleanupTemp(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      log.warn('Temp fajl torlesi hiba:', (err as Error).message);
    }
  }
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

/** Whitelist-alapu sanitizalas: csak ismert kulcsok, ervenyes ertekek */
export function sanitizeSettings(settings: Record<string, unknown>): Record<string, unknown> {
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
export function cleanupOldTempFiles(): void {
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

/** Download a file from URL to a local path (HTTPS only, max 5 redirects, 50 MB limit) */
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
