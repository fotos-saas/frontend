/**
 * JsxRunnerService — Photoshop JSX futtatás infrastruktúra
 *
 * A photoshop.handler.ts-ből kiemelt JSX kezelő logika:
 * - Photoshop telepítés keresés
 * - JSX script deploy, feloldás, összeállítás
 * - osascript futtatás (szinkron + streaming)
 * - Fotó letöltés + sharp resize
 * - Személy/kép adat előkészítés JSX-hez
 */

import { execFile, spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { app } from 'electron';
import Store from 'electron-store';
import log from 'electron-log/main';
import sharp from 'sharp';

// ============ Types ============

export interface PhotoshopSchema {
  photoshopPath: string | null;
  workDirectory: string | null;
  tabloMarginCm: number;
  tabloStudentSizeCm: number;
  tabloTeacherSizeCm: number;
  tabloGapHCm: number;
  tabloGapVCm: number;
  tabloNameGapCm: number;
  tabloNameBreakAfter: number;
  tabloTextAlign: string;
  tabloGridAlign: string;
  tabloPositionGapCm: number;
  tabloPositionFontSize: number;
}

export interface PersonData {
  id: number;
  name: string;
  type: string;
}

export interface PersonWithPhoto extends PersonData {
  photoUrl?: string | null;
}

export interface ImageSizeConfig {
  widthCm: number;
  heightCm: number;
  dpi: number;
  studentSizeCm?: number;
  teacherSizeCm?: number;
}

export interface PreparedPersons {
  layers: Array<{ layerName: string; displayText: string; group: string }>;
  textAlign: string;
  stats: { students: number; teachers: number; total: number };
}

export interface PreparedImageLayers {
  layers: Array<{ layerName: string; group: string; widthPx: number; heightPx: number; photoPath: string | null }>;
  stats: { students: number; teachers: number; total: number; withPhoto: number };
  imageSizeCm: ImageSizeConfig;
  studentSizeCm: number;
  teacherSizeCm: number;
}

export interface JsxRunResult {
  success: boolean;
  error?: string;
  output?: string;
}

// ============ Constants ============

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

const PHOTO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 perc

// ============ Helpers ============

/** AppleScript string escape — megakadályozza az injection-t */
export function appleScriptEscape(str: string): string {
  return str
    .replace(/\0/g, '')     // null byte eltávolítás
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/** JSX (ExtendScript) string escape — külön kontextus az AppleScript-től */
export function jsxStringEscape(str: string): string {
  return str
    .replace(/\0/g, '')     // null byte eltávolítás
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/** Allowed domains for photo downloads (SSRF protection) */
const PRODUCTION_DOWNLOAD_DOMAINS = [
  'api.tablostudio.hu',
  'cdn.tablostudio.hu',
  'storage.tablostudio.hu',
  'tablostudio.hu',
];

/** Localhost csak dev módban engedélyezett */
const DEV_DOWNLOAD_DOMAINS = [
  ...PRODUCTION_DOWNLOAD_DOMAINS,
  'localhost',
  '127.0.0.1',
];

const MAX_REDIRECTS = 3;

// ============ JsxRunnerService ============

export class JsxRunnerService {
  constructor(private readonly psStore: Store<PhotoshopSchema>) {}

  // ---- Photoshop telepítés ----

  isValidPhotoshopPath(psPath: string): boolean {
    if (!fs.existsSync(psPath)) return false;
    if (process.platform === 'darwin') {
      return psPath.endsWith('.app') && fs.statSync(psPath).isDirectory();
    }
    return psPath.endsWith('.exe') && fs.statSync(psPath).isFile();
  }

  findPhotoshopInstallation(): string | null {
    const paths = process.platform === 'darwin' ? DEFAULT_PS_PATHS_MAC : DEFAULT_PS_PATHS_WIN;
    for (const psPath of paths) {
      if (this.isValidPhotoshopPath(psPath)) return psPath;
    }
    return null;
  }

  isPhotoshopRunning(): Promise<boolean> {
    return new Promise((resolve) => {
      if (process.platform !== 'darwin') {
        resolve(false);
        return;
      }
      execFile('pgrep', ['-x', 'Adobe Photoshop'], (error) => {
        resolve(!error);
      });
    });
  }

  // ---- JSX script deploy ----

  deployJsxScripts(workDir: string): void {
    const sourceBase = app.isPackaged
      ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'extendscript')
      : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'extendscript');

    const targetBase = path.join(workDir, 'scripts');

    const syncDir = (srcDir: string, dstDir: string): void => {
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
            if (srcMtime <= dstMtime) needsCopy = false;
          }
          if (needsCopy) {
            fs.copyFileSync(srcPath, dstPath);
            log.info(`JSX deploy: ${path.relative(targetBase, dstPath)}`);
          }
        }
      }
    };

    try {
      syncDir(sourceBase, targetBase);
      log.info(`JSX scriptek kihelyezve: ${targetBase}`);
    } catch (error) {
      log.error('JSX deploy hiba:', error);
    }
  }

  // ---- Név kezelés ----

  sanitizeNameForLayer(text: string, personId?: number): string {
    let result = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u0150/g, 'O').replace(/\u0151/g, 'o')
      .replace(/\u0170/g, 'U').replace(/\u0171/g, 'u')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (personId !== undefined) {
      result += `---${personId}`;
    }
    return result;
  }

  breakName(name: string, breakAfter: number): string {
    if (breakAfter <= 0) return name;
    const words = name.split(' ');
    if (words.length < 2) return name;
    const isPrefix = (w: string) => w.replace(/\./g, '').length <= 2;
    const realCount = words.filter(w => !isPrefix(w)).length;
    if (realCount < 3) return name;
    const hyphenIndex = words.findIndex(w => w.indexOf('-') !== -1);
    if (hyphenIndex !== -1 && hyphenIndex < words.length - 1) {
      return words.slice(0, hyphenIndex + 1).join(' ') + '\r' + words.slice(hyphenIndex + 1).join(' ');
    }
    let realWordCount = 0;
    let breakIndex = -1;
    for (let i = 0; i < words.length; i++) {
      if (!isPrefix(words[i])) realWordCount++;
      if (realWordCount > breakAfter && breakIndex === -1) breakIndex = i;
    }
    if (breakIndex === -1) return name;
    return words.slice(0, breakIndex).join(' ') + '\r' + words.slice(breakIndex).join(' ');
  }

  // ---- Adat előkészítés ----

  preparePersonsForJsx(personsData: PersonData[]): PreparedPersons {
    const breakAfter = this.psStore.get('tabloNameBreakAfter', 1);
    const textAlign = this.psStore.get('tabloTextAlign', 'center');
    const students = personsData.filter(p => p.type !== 'teacher');
    const teachers = personsData.filter(p => p.type === 'teacher');

    const layers = [
      ...students.map(p => ({
        layerName: this.sanitizeNameForLayer(p.name, p.id),
        displayText: this.breakName(p.name, breakAfter),
        group: 'Students',
      })),
      ...teachers.map(p => ({
        layerName: this.sanitizeNameForLayer(p.name, p.id),
        displayText: this.breakName(p.name, breakAfter),
        group: 'Teachers',
      })),
    ];

    return {
      layers,
      textAlign,
      stats: { students: students.length, teachers: teachers.length, total: personsData.length },
    };
  }

  async prepareImageLayersForJsx(
    personsData: PersonWithPhoto[],
    imageSizeCm: ImageSizeConfig,
    docDpi: number = 200,
  ): Promise<PreparedImageLayers> {
    const students = personsData.filter(p => p.type !== 'teacher');
    const teachers = personsData.filter(p => p.type === 'teacher');

    const widthPx = Math.round((imageSizeCm.widthCm / 2.54) * docDpi);
    const heightPx = Math.round((imageSizeCm.heightCm / 2.54) * docDpi);

    const allPersons = [...students, ...teachers];
    const downloadResults = await Promise.all(
      allPersons.map(async (p) => {
        if (!p.photoUrl) return null;
        try {
          const layerName = this.sanitizeNameForLayer(p.name, p.id);
          const ext = p.photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `${layerName}.${ext}`;
          return await this.downloadPhoto(p.photoUrl, fileName, { width: widthPx, height: heightPx });
        } catch (err) {
          log.warn(`Foto letoltes sikertelen (${p.name}):`, err);
          return null;
        }
      }),
    );

    const layers = allPersons.map((p, idx) => ({
      layerName: this.sanitizeNameForLayer(p.name, p.id),
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

  // ---- Fotó letöltés ----

  /** URL domain whitelist ellenőrzés (SSRF védelem) */
  private isAllowedDownloadUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      // Localhost csak dev módban engedélyezett
      const allowedDomains = app.isPackaged ? PRODUCTION_DOWNLOAD_DOMAINS : DEV_DOWNLOAD_DOMAINS;
      // Strict domain match — NEM enged subdomain bypass-t (pl. evil.localhost)
      return allowedDomains.some((d) => parsed.hostname === d);
    } catch {
      return false;
    }
  }

  downloadPhoto(
    url: string,
    fileName: string,
    targetSize?: { width: number; height: number },
    _redirectCount = 0,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // SSRF védelem: csak engedélyezett domainekről töltünk le
      if (!this.isAllowedDownloadUrl(url)) {
        reject(new Error(`Nem engedélyezett letöltési URL domain: ${url}`));
        return;
      }

      // Path traversal védelem: csak a fájlnevet használjuk
      const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!safeName || safeName === '.' || safeName === '..') {
        reject(new Error(`Érvénytelen fájlnév: ${fileName}`));
        return;
      }

      const tempDir = path.join(app.getPath('temp'), 'psd-photos');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const resizedDir = path.join(tempDir, 'resized');
      const rawPath = path.join(tempDir, safeName);
      const finalPath = targetSize ? path.join(resizedDir, safeName) : rawPath;

      if (fs.existsSync(finalPath)) {
        const stats = fs.statSync(finalPath);
        if (Date.now() - stats.mtimeMs < PHOTO_CACHE_TTL_MS && stats.size > 0) {
          log.info(`Cached foto: ${fileName}`);
          resolve(finalPath);
          return;
        }
      }

      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(rawPath);

      log.info(`Foto letoltese: ${url} → ${fileName}`);

      protocol.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(rawPath);
            if (_redirectCount >= MAX_REDIRECTS) {
              reject(new Error(`Túl sok átirányítás (max ${MAX_REDIRECTS})`));
              return;
            }
            this.downloadPhoto(redirectUrl, safeName, targetSize, _redirectCount + 1).then(resolve).catch(reject);
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

          if (!targetSize) {
            log.info(`Foto letoltve: ${fileName}`);
            resolve(rawPath);
            return;
          }

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
              resolve(rawPath);
            });
        });
      }).on('error', (err) => {
        fs.unlink(rawPath, () => {});
        reject(err);
      });
    });
  }

  // ---- JSX script összeállítás ----

  resolveJsxPath(scriptName: string): string {
    const workDir = this.psStore.get('workDirectory', null);
    if (workDir) {
      const workDirPath = path.join(workDir, 'scripts', scriptName);
      if (fs.existsSync(workDirPath)) return workDirPath;
    }
    return app.isPackaged
      ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'extendscript', scriptName)
      : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'extendscript', scriptName);
  }

  resolveIncludes(scriptContent: string, scriptDir: string, depth = 0): string {
    const MAX_INCLUDE_DEPTH = 10;
    if (depth >= MAX_INCLUDE_DEPTH) {
      log.warn(`JSX #include max mélység elérve (${MAX_INCLUDE_DEPTH})`);
      return scriptContent;
    }

    // A script base könyvtár: a munkakönytár/scripts vagy a beépített scripts
    const scriptBaseDir = this.getScriptBaseDir();

    return scriptContent.replace(
      /\/\/\s*#include\s+"([^"]+)"/g,
      (_match, includePath) => {
        const fullPath = path.resolve(scriptDir, includePath);
        const realPath = fs.existsSync(fullPath) ? fs.realpathSync(fullPath) : null;

        // Path traversal védelem: az include-nak a script base-en belül kell lennie
        // Strict check: path separator kötelező a base dir után (megelőzi /scripts-evil/ bypass-t)
        if (!realPath || !(realPath === scriptBaseDir || realPath.startsWith(scriptBaseDir + path.sep))) {
          log.warn(`JSX #include path traversal blokkolva: ${includePath} → ${fullPath}`);
          return `// HIBA: #include fajl nem engedelyezett: ${includePath}`;
        }

        const includeContent = fs.readFileSync(realPath, 'utf-8');
        return this.resolveIncludes(includeContent, path.dirname(realPath), depth + 1);
      },
    );
  }

  private getScriptBaseDir(): string {
    const workDir = this.psStore.get('workDirectory', null);
    if (workDir) {
      const scriptsDir = path.join(workDir, 'scripts');
      if (fs.existsSync(scriptsDir)) return fs.realpathSync(scriptsDir);
    }
    const builtInDir = app.isPackaged
      ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'extendscript')
      : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'extendscript');
    return fs.existsSync(builtInDir) ? fs.realpathSync(builtInDir) : builtInDir;
  }

  buildJsxScript(
    scriptName: string,
    dataFilePath?: string,
    targetDocName?: string,
    psdFilePath?: string,
    extraConfig?: Record<string, string>,
  ): string {
    const workDir = this.psStore.get('workDirectory', null);
    if (workDir) {
      this.deployJsxScripts(workDir);
    }

    const scriptPath = this.resolveJsxPath(scriptName);
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`JSX script nem talalhato: ${scriptPath}`);
    }

    let scriptContent = fs.readFileSync(scriptPath, 'utf-8');
    const scriptDir = path.dirname(scriptPath);

    scriptContent = this.resolveIncludes(scriptContent, scriptDir);

    const configOverrides: string[] = [];
    if (dataFilePath) {
      const escapedPath = jsxStringEscape(dataFilePath.replace(/\\/g, '/'));
      configOverrides.push(`CONFIG.DATA_FILE_PATH = "${escapedPath}";`);
    }
    if (targetDocName) {
      configOverrides.push(`CONFIG.TARGET_DOC_NAME = "${jsxStringEscape(targetDocName)}";`);
    }
    if (psdFilePath) {
      const escapedPsd = jsxStringEscape(psdFilePath.replace(/\\/g, '/'));
      configOverrides.push(`CONFIG.PSD_FILE_PATH = "${escapedPsd}";`);
    }
    if (extraConfig) {
      const SAFE_KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
      for (const [key, val] of Object.entries(extraConfig)) {
        if (!SAFE_KEY_PATTERN.test(key)) {
          log.warn(`extraConfig érvénytelen kulcs kihagyva: ${key}`);
          continue;
        }
        configOverrides.push(`CONFIG.${key} = "${jsxStringEscape(val)}";`);
      }
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

  buildFocusPreservingAppleScript(jsxFilePath: string): string {
    const escapedPath = appleScriptEscape(jsxFilePath);
    return [
      'tell application id "com.adobe.Photoshop"',
      `  set _result to do javascript file "${escapedPath}"`,
      'end tell',
      'return _result',
    ].join('\n');
  }

  // ---- JSX futtatás ----

  async runJsx(params: {
    scriptName: string;
    dataFilePath?: string;
    targetDocName?: string;
    psdFilePath?: string;
    personsData?: PersonData[];
    imageData?: { persons: PersonWithPhoto[] } & ImageSizeConfig;
    jsonData?: Record<string, unknown>;
  }): Promise<JsxRunResult> {
    let tempJsonPath: string | null = null;

    try {
      if (typeof params.scriptName !== 'string' || params.scriptName.length > 200) {
        return { success: false, error: 'Ervenytelen script nev' };
      }

      if (params.scriptName.includes('..') || params.scriptName.startsWith('/')) {
        return { success: false, error: 'Ervenytelen script utvonal' };
      }

      let dataFilePath = params.dataFilePath;

      if (!dataFilePath && params.personsData && params.personsData.length > 0) {
        const prepared = this.preparePersonsForJsx(params.personsData);
        tempJsonPath = path.join(app.getPath('temp'), `jsx-persons-${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(prepared), 'utf-8');
        dataFilePath = tempJsonPath;
        log.info(`JSX persons JSON irva: ${tempJsonPath} (${prepared.stats.total} fo)`);
      }

      if (!dataFilePath && params.imageData && params.imageData.persons.length > 0) {
        const prepared = await this.prepareImageLayersForJsx(params.imageData.persons, {
          widthCm: params.imageData.widthCm,
          heightCm: params.imageData.heightCm,
          dpi: params.imageData.dpi,
          studentSizeCm: params.imageData.studentSizeCm,
          teacherSizeCm: params.imageData.teacherSizeCm,
        });
        tempJsonPath = path.join(app.getPath('temp'), `jsx-images-${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(prepared), 'utf-8');
        dataFilePath = tempJsonPath;
        log.info(`JSX images JSON irva: ${tempJsonPath} (${prepared.stats.withPhoto} fotoval)`);
      }

      let extraConfig: Record<string, string> | undefined;
      if (!dataFilePath && params.jsonData) {
        const allSimple = Object.values(params.jsonData).every(v => typeof v === 'string');
        if (allSimple) {
          extraConfig = params.jsonData as Record<string, string>;
        } else {
          tempJsonPath = path.join(app.getPath('temp'), `jsx-data-${Date.now()}.json`);
          fs.writeFileSync(tempJsonPath, JSON.stringify(params.jsonData), 'utf-8');
          dataFilePath = tempJsonPath;
        }
      }

      const jsxCode = this.buildJsxScript(params.scriptName, dataFilePath, params.targetDocName, params.psdFilePath, extraConfig);
      log.info(`JSX script futtatasa: ${params.scriptName} (${jsxCode.length} karakter)`);

      if (process.platform !== 'darwin') {
        return { success: false, error: 'JSX futtatás csak macOS-en támogatott (osascript)' };
      }

      const tempJsxPath = path.join(app.getPath('temp'), `jsx-script-${Date.now()}.jsx`);
      fs.writeFileSync(tempJsxPath, jsxCode, 'utf-8');

      const appleScript = this.buildFocusPreservingAppleScript(tempJsxPath);

      return new Promise<JsxRunResult>((resolve) => {
        execFile('osascript', ['-e', appleScript], { timeout: 60000 }, (error, stdout, stderr) => {
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
  }

  runJsxStreaming(params: {
    scriptName: string;
    dataFilePath?: string;
    targetDocName?: string;
    psdFilePath?: string;
    personsData?: PersonData[];
    imageData?: { persons: PersonWithPhoto[] } & ImageSizeConfig;
    jsonData?: Record<string, unknown>;
    onLog?: (line: string, stream: 'stdout' | 'stderr') => void;
  }): Promise<JsxRunResult> {
    // Streaming variant — delegates data prep to runJsx-like logic but uses spawn
    return this._runJsxInternal(params, true);
  }

  private async _runJsxInternal(params: {
    scriptName: string;
    dataFilePath?: string;
    targetDocName?: string;
    psdFilePath?: string;
    personsData?: PersonData[];
    imageData?: { persons: PersonWithPhoto[] } & ImageSizeConfig;
    jsonData?: Record<string, unknown>;
    onLog?: (line: string, stream: 'stdout' | 'stderr') => void;
  }, streaming: boolean): Promise<JsxRunResult> {
    let tempJsonPath: string | null = null;
    const sendLog = params.onLog || (() => {});

    try {
      if (typeof params.scriptName !== 'string' || params.scriptName.length > 200) {
        return { success: false, error: 'Ervenytelen script nev' };
      }
      if (params.scriptName.includes('..') || params.scriptName.startsWith('/')) {
        return { success: false, error: 'Ervenytelen script utvonal' };
      }

      let dataFilePath = params.dataFilePath;

      if (!dataFilePath && params.personsData && params.personsData.length > 0) {
        const prepared = this.preparePersonsForJsx(params.personsData);
        tempJsonPath = path.join(app.getPath('temp'), `jsx-persons-${streaming ? 'debug-' : ''}${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(prepared), 'utf-8');
        dataFilePath = tempJsonPath;
        sendLog(`[DEBUG] Persons JSON irva: ${tempJsonPath}`, 'stdout');
      }

      if (!dataFilePath && params.imageData && params.imageData.persons.length > 0) {
        sendLog('[DEBUG] Fotok letoltese...', 'stdout');
        const prepared = await this.prepareImageLayersForJsx(params.imageData.persons, {
          widthCm: params.imageData.widthCm,
          heightCm: params.imageData.heightCm,
          dpi: params.imageData.dpi,
          studentSizeCm: params.imageData.studentSizeCm,
          teacherSizeCm: params.imageData.teacherSizeCm,
        });
        tempJsonPath = path.join(app.getPath('temp'), `jsx-images-${streaming ? 'debug-' : ''}${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(prepared), 'utf-8');
        dataFilePath = tempJsonPath;
        sendLog(`[DEBUG] Images JSON irva: ${tempJsonPath}`, 'stdout');
      }

      if (!dataFilePath && params.jsonData) {
        tempJsonPath = path.join(app.getPath('temp'), `jsx-data-${streaming ? 'debug-' : ''}${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(params.jsonData), 'utf-8');
        dataFilePath = tempJsonPath;
        sendLog(`[DEBUG] JSON data irva: ${tempJsonPath}`, 'stdout');
      }

      const jsxCode = this.buildJsxScript(params.scriptName, dataFilePath, params.targetDocName, params.psdFilePath);
      sendLog(`[DEBUG] JSX script: ${params.scriptName} (${jsxCode.length} karakter)`, 'stdout');

      if (process.platform !== 'darwin') {
        return { success: false, error: 'JSX futtatás csak macOS-en támogatott (osascript)' };
      }

      const tempJsxPath = path.join(app.getPath('temp'), `jsx-${streaming ? 'debug-' : 'script-'}${Date.now()}.jsx`);
      fs.writeFileSync(tempJsxPath, jsxCode, 'utf-8');

      const appleScript = this.buildFocusPreservingAppleScript(tempJsxPath);

      return new Promise<JsxRunResult>((resolve) => {
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
          try { fs.unlinkSync(tempJsxPath); } catch (_) { /* ignore */ }
          if (tempJsonPath && fs.existsSync(tempJsonPath)) {
            try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          }
          if (code !== 0) {
            log.error(`JSX hiba (exit ${code}):`, stderrBuf);
            resolve({ success: false, error: stderrBuf || `Exit code: ${code}` });
          } else {
            log.info('JSX sikeresen lefutott');
            resolve({ success: true });
          }
        });

        child.on('error', (err) => {
          try { fs.unlinkSync(tempJsxPath); } catch (_) { /* ignore */ }
          if (tempJsonPath && fs.existsSync(tempJsonPath)) {
            try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          }
          sendLog(`[DEBUG] HIBA: ${err.message}`, 'stderr');
          log.error('JSX spawn hiba:', err);
          resolve({ success: false, error: err.message });
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
  }
}
