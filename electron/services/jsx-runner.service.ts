/**
 * JsxRunnerService — Photoshop JSX futtatás infrastruktúra
 *
 * Modulok: script-escape.util, photoshop-detector.service,
 * photo-download.service, jsx-data-preparer.service
 */

import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import log from 'electron-log/main';

// Extracted modules
import { appleScriptEscape, jsxStringEscape } from './script-escape.util';
import {
  isValidPhotoshopPath as _isValidPhotoshopPath,
  findPhotoshopInstallation as _findPhotoshopInstallation,
  isPhotoshopRunning as _isPhotoshopRunning,
} from './photoshop-detector.service';
import { downloadPhoto as _downloadPhoto } from './photo-download.service';
import {
  sanitizeNameForLayer as _sanitizeNameForLayer,
  breakName as _breakName,
  preparePersonsForJsx as _preparePersonsForJsx,
  prepareImageLayersForJsx as _prepareImageLayersForJsx,
} from './jsx-data-preparer.service';
import type {
  PersonData,
  PersonWithPhoto,
  ImageSizeConfig,
  PreparedPersons,
  PreparedImageLayers,
} from './jsx-data-preparer.service';

// Re-export types so callers don't need to change their imports
export type {
  PersonData,
  PersonWithPhoto,
  ImageSizeConfig,
  PreparedPersons,
  PreparedImageLayers,
} from './jsx-data-preparer.service';

// Re-export standalone functions for callers that import them directly
export { appleScriptEscape, jsxStringEscape } from './script-escape.util';

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

export interface JsxRunResult {
  success: boolean;
  error?: string;
  output?: string;
}

// ============ JsxRunnerService ============

export class JsxRunnerService {
  constructor(private readonly psStore: Store<PhotoshopSchema>) {}

  isValidPhotoshopPath(psPath: string): boolean {
    return _isValidPhotoshopPath(psPath);
  }

  findPhotoshopInstallation(): string | null {
    return _findPhotoshopInstallation();
  }

  isPhotoshopRunning(): Promise<boolean> {
    return _isPhotoshopRunning();
  }

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

  sanitizeNameForLayer(text: string, personId?: number): string {
    return _sanitizeNameForLayer(text, personId);
  }

  breakName(name: string, breakAfter: number): string {
    return _breakName(name, breakAfter);
  }

  preparePersonsForJsx(personsData: PersonData[]): PreparedPersons {
    return _preparePersonsForJsx(personsData, this.psStore);
  }

  async prepareImageLayersForJsx(
    personsData: PersonWithPhoto[],
    imageSizeCm: ImageSizeConfig,
    docDpi: number = 200,
  ): Promise<PreparedImageLayers> {
    return _prepareImageLayersForJsx(personsData, imageSizeCm, docDpi);
  }

  downloadPhoto(
    url: string,
    fileName: string,
    _targetSize?: unknown,
    _redirectCount?: number,
  ): Promise<string> {
    return _downloadPhoto(url, fileName, _targetSize, _redirectCount);
  }

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

    const scriptBaseDir = this.getScriptBaseDir();

    return scriptContent.replace(
      /\/\/\s*#include\s+"([^"]+)"/g,
      (_match, includePath) => {
        const fullPath = path.resolve(scriptDir, includePath);
        const realPath = fs.existsSync(fullPath) ? fs.realpathSync(fullPath) : null;

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
        execFile('osascript', ['-e', appleScript], { timeout: 300000 }, (error, stdout, stderr) => {
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
        const child = spawn('osascript', ['-e', appleScript], { timeout: 300000 });
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
