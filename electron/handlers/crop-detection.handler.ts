/**
 * Crop detektálás IPC handlerek — Python MediaPipe Face Mesh hívások.
 */
import { ipcMain } from 'electron';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log/main';
import {
  getScriptsPath,
  getPythonPath,
  ensureVenv,
  isAllowedReadPath,
  SUPPORTED_EXTENSIONS,
  writeTempJson,
  cleanupTemp,
  parseLastJsonResult,
} from './crop-utils';

export function registerCropDetectionHandlers(): void {

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

      if (!isAllowedReadPath(params.inputPath)) {
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

      ensureVenv();

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

      ensureVenv();

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
        if (!isAllowedReadPath(item.input)) {
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
}
