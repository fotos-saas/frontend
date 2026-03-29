import { ipcMain, app } from 'electron';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import log from 'electron-log/main';

import { getScriptsPath, getPythonPath, ensureVenv } from './portrait-python';
import {
  SUPPORTED_EXTENSIONS,
  MAX_READ_SIZE,
  isAllowedPath,
  isInsideTempDir,
  encodeUrlPath,
  isAllowedUrl,
  writeTempJson,
  cleanupTemp,
  parseLastJsonResult,
  sanitizeSettings,
  cleanupOldTempFiles,
  downloadFile,
} from './portrait-utils';

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
