/**
 * Crop végrehajtás IPC handlerek — Sharp vágás, letöltés, temp kezelés.
 */
import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import sharp from 'sharp';
import log from 'electron-log/main';
import {
  isAllowedReadPath,
  isAllowedWritePath,
  isInsideTempDir,
  SUPPORTED_EXTENSIONS,
  TEMP_DIR_NAME,
  MAX_READ_SIZE,
  sanitizeCropSettings,
  computeCropRect,
  encodeUrlPath,
  isAllowedUrl,
  downloadFile,
  cleanupTemp,
} from './crop-utils';

export function registerCropExecutionHandlers(): void {

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

    if (!isAllowedReadPath(params.inputPath)) {
      return { success: false, error: 'Bemeneti path nem megengedett' };
    }

    if (!isAllowedWritePath(params.outputPath)) {
      return { success: false, error: 'Kimeneti path nem megengedett (csak temp konyvtar)' };
    }

    if (params.thumbnailPath && !isAllowedWritePath(params.thumbnailPath)) {
      return { success: false, error: 'Thumbnail path nem megengedett (csak temp konyvtar)' };
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

      const outDir = path.dirname(params.outputPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      await sharp(params.inputPath)
        .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
        .jpeg({ quality, mozjpeg: true })
        .toFile(params.outputPath);

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
        if (!isAllowedReadPath(item.inputPath)) {
          results.push({ success: false, inputPath: item.inputPath, error: 'Bemeneti path nem megengedett' });
          continue;
        }

        if (!isAllowedWritePath(item.outputPath)) {
          results.push({ success: false, inputPath: item.inputPath, error: 'Kimeneti path nem megengedett' });
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

        const outDir = path.dirname(item.outputPath);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }

        await sharp(item.inputPath)
          .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
          .jpeg({ quality, mozjpeg: true })
          .toFile(item.outputPath);

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

    if (!isAllowedWritePath(params.outputPath)) {
      return { success: false, error: 'Kimeneti path nem megengedett (csak temp konyvtar)' };
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

  // ============ Save temp file (browser file → temp dir) ============
  ipcMain.handle('crop:save-temp-file', async (_event, params: { fileName: string; data: ArrayBuffer }) => {
    if (!params || typeof params.fileName !== 'string' || !params.data) {
      return { success: false, error: 'Ervenytelen parameterek' };
    }

    const ext = path.extname(params.fileName).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      return { success: false, error: 'Nem tamogatott fajlformatum' };
    }

    // Fájlnév sanitizálás
    const safeName = `calib_${Date.now()}${ext}`;
    const tempDir = path.join(os.tmpdir(), TEMP_DIR_NAME);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, safeName);
    if (!isAllowedWritePath(outputPath)) {
      return { success: false, error: 'Nem engedelyezett celmappa' };
    }

    try {
      const buffer = Buffer.from(params.data);
      if (buffer.length === 0 || buffer.length > MAX_READ_SIZE) {
        return { success: false, error: 'Ervenytelen fajlmeret' };
      }
      fs.writeFileSync(outputPath, buffer);
      return { success: true, path: outputPath };
    } catch {
      return { success: false, error: 'Fajl irasi hiba' };
    }
  });
}
