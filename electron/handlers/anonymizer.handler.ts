/**
 * Tabló Referencia Anonimizáló — Electron IPC handler.
 *
 * Arcdetektálás + anonimizálás Python-nal (Haar + MediaPipe + blur/rect).
 * A kiválasztott workdir-ben lévő képeket dolgozza fel.
 */
import { ipcMain, dialog, BrowserWindow } from 'electron';
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

/** Egy detektált arc bounding box-a */
interface FaceRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Egy kép detektálási eredménye */
interface DetectionResult {
  success: boolean;
  input?: string;
  image_width?: number;
  image_height?: number;
  faces?: FaceRect[];
  face_count?: number;
  processing_time?: number;
  error?: string;
}

/** Anonimizálás beállításai */
interface AnonymizeSettings {
  mode: string;        // 'blur' | 'rect'
  color: string;       // hex szín, default '#888888'
  opacity: number;     // 0-1, default 1.0
  quality: number;     // JPG minőség 50-100, default 95
}

const DEFAULT_SETTINGS: AnonymizeSettings = {
  mode: 'blur',
  color: '#888888',
  opacity: 1.0,
  quality: 95,
};

const OUTPUT_DIR_NAME = 'anonymized';

export function registerAnonymizerHandlers(): void {

  // ============ Mappa választás ============
  ipcMain.handle('anonymizer:select-workdir', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { cancelled: true };

    const result = await dialog.showOpenDialog(win, {
      title: 'Válassz mappát a tablóképekkel',
      properties: ['openDirectory'],
      buttonLabel: 'Kiválasztás',
    });

    if (result.canceled || !result.filePaths.length) {
      return { cancelled: true };
    }

    const dirPath = result.filePaths[0];
    if (!isAllowedReadPath(dirPath)) {
      return { cancelled: false, error: 'Nem engedélyezett mappa' };
    }

    const files = scanImageFiles(dirPath);

    return {
      cancelled: false,
      path: dirPath,
      imageCount: files.length,
      images: files.map(f => ({
        name: path.basename(f),
        path: f,
        size: fs.statSync(f).size,
      })),
    };
  });

  // ============ Arcdetektálás egyetlen képen ============
  ipcMain.handle('anonymizer:detect', async (_event, params: { inputPath: string }) => {
    if (!params?.inputPath || typeof params.inputPath !== 'string') {
      return { success: false, error: 'Érvénytelen paraméterek' };
    }
    if (!isAllowedReadPath(params.inputPath)) {
      return { success: false, error: 'Nem engedélyezett útvonal' };
    }
    if (!fs.existsSync(params.inputPath)) {
      return { success: false, error: 'Fájl nem található' };
    }

    return detectFaces(params.inputPath);
  });

  // ============ Anonimizálás végrehajtása (Python blur/rect) ============
  ipcMain.handle('anonymizer:process', async (
    _event,
    params: {
      inputPath: string;
      faces: FaceRect[];
      settings?: Partial<AnonymizeSettings>;
    }
  ) => {
    if (!params?.inputPath || !Array.isArray(params.faces)) {
      return { success: false, error: 'Érvénytelen paraméterek' };
    }
    if (!isAllowedReadPath(params.inputPath)) {
      return { success: false, error: 'Nem engedélyezett útvonal' };
    }
    if (!fs.existsSync(params.inputPath)) {
      return { success: false, error: 'Fájl nem található' };
    }

    const settings = { ...DEFAULT_SETTINGS, ...params.settings };
    const outputDir = path.join(path.dirname(params.inputPath), OUTPUT_DIR_NAME);

    return anonymizeImage(params.inputPath, params.faces, settings, outputDir);
  });
}

/** Képfájlok keresése egy mappában (nem rekurzív) */
function scanImageFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return [];
  }

  return fs.readdirSync(dirPath)
    .filter(name => {
      if (name.startsWith('.')) return false;
      const ext = path.extname(name).toLowerCase();
      return SUPPORTED_EXTENSIONS.has(ext);
    })
    .map(name => path.join(dirPath, name))
    .sort();
}

/** Python face detection egyetlen képre */
function detectFaces(inputPath: string): Promise<DetectionResult> {
  return new Promise((resolve) => {
    ensureVenv();

    const scriptPath = path.join(getScriptsPath(), 'anonymize_tablo.py');
    if (!fs.existsSync(scriptPath)) {
      resolve({ success: false, error: 'Python script nem található' });
      return;
    }

    const args = [scriptPath, '--input', inputPath];

    // Tablóképek nagyok — több idő kell
    execFile(getPythonPath(), args, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        log.error('Anonymizer detect failed:', error.message);
        if (stderr) log.error('stderr:', stderr.slice(0, 500));
        resolve({ success: false, error: error.message });
        return;
      }

      const result = parseLastJsonResult(stdout);
      if (!result) {
        log.error('Anonymizer parse error. stdout:', stdout.slice(0, 500));
        resolve({ success: false, error: 'Érvénytelen válasz a Python scripttől' });
        return;
      }

      resolve(result as unknown as DetectionResult);
    });
  });
}

/** Egy kép anonimizálása Python script-tel (blur/rect) */
async function anonymizeImage(
  inputPath: string,
  faces: FaceRect[],
  settings: AnonymizeSettings,
  outputDir: string,
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const fileName = path.basename(inputPath);
      const ext = path.extname(fileName).toLowerCase();
      const outputName = ext === '.jpg' || ext === '.jpeg'
        ? fileName
        : fileName.replace(/\.[^.]+$/, '.jpg');
      const outputPath = path.join(outputDir, outputName);

      ensureVenv();

      const scriptPath = path.join(getScriptsPath(), 'anonymize_tablo.py');
      if (!fs.existsSync(scriptPath)) {
        resolve({ success: false, error: 'Python script nem található' });
        return;
      }

      // Arc koordináták JSON temp fájlba
      const facesJsonPath = writeTempJson(faces);

      const args = [
        scriptPath,
        '--process', inputPath,
        '--faces-json', facesJsonPath,
        '--output', outputPath,
        '--mode', settings.mode || 'blur',
        '--color', settings.color || '#888888',
        '--opacity', String(settings.opacity ?? 1.0),
        '--quality', String(settings.quality || 95),
      ];

      execFile(getPythonPath(), args, { timeout: 60000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
        cleanupTemp(facesJsonPath);

        if (error) {
          log.error('Anonymizer process failed:', error.message);
          if (stderr) log.error('stderr:', stderr.slice(0, 500));
          resolve({ success: false, error: error.message });
          return;
        }

        const result = parseLastJsonResult(stdout);
        if (!result || !(result as Record<string, unknown>).success) {
          log.error('Anonymizer process parse error. stdout:', stdout.slice(0, 500));
          resolve({ success: false, error: 'Feldolgozás sikertelen' });
          return;
        }

        log.info(`Anonymized: ${fileName} (${faces.length} arc, mode=${settings.mode})`);
        resolve({ success: true, outputPath });
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      log.error(`Anonymize failed for ${inputPath}:`, msg);
      resolve({ success: false, error: msg });
    }
  });
}
