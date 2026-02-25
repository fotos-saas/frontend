/**
 * finalizer.handler.ts — Véglegesített tablókép feltöltés Electron IPC handler
 *
 * Két típus:
 * - flat: Teljes méretű JPG, nincs resize, nincs watermark
 * - small_tablo: 3000px leghosszabb oldal, nincs watermark
 *
 * Mindkettő megtartja az eredeti színprofilt.
 * HTTP POST: /api/partner/finalizations/{projectId}/upload
 */

import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import log from 'electron-log/main';
import sharp from 'sharp';

// ============ HTTP feltöltés ============

interface UploadResult {
  success: boolean;
  error?: string;
}

async function uploadToBackend(
  filePath: string,
  apiBaseUrl: string,
  projectId: number,
  authToken: string,
  type: 'flat' | 'small_tablo',
  uploadFileName?: string,
): Promise<UploadResult> {
  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    return await new Promise<UploadResult>((resolve) => {
      const fileName = uploadFileName || path.basename(filePath);
      const boundary = `----FormBoundary${Date.now()}`;

      const typePart = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="type"\r\n\r\n` +
        `${type}\r\n`,
      );
      const filePart = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: image/jpeg\r\n\r\n`,
      );
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([typePart, filePart, fileBuffer, footer]);

      const url = new URL(`${apiBaseUrl}/partner/finalizations/${projectId}/upload`);
      const isHttps = url.protocol === 'https:';
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      };

      const protocol = isHttps ? https : http;
      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            log.error(`Feltöltés hiba (${type}): HTTP ${res.statusCode}`, data.slice(0, 500));
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 200)}` });
          }
        });
      });

      req.on('error', (err) => {
        log.error(`Feltöltés hálózati hiba (${type}):`, err.message);
        resolve({ success: false, error: err.message });
      });

      req.write(body);
      req.end();
    });
  } catch (err) {
    log.error('Feltöltés hiba:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Ismeretlen hiba' };
  }
}

// ============ IPC Handler regisztrálás ============

export function registerFinalizerHandlers(): void {

  ipcMain.handle('finalizer:upload', async (_event, params: {
    flattenedJpgPath: string;
    outputDir: string;
    projectId: number;
    projectName: string;
    apiBaseUrl: string;
    authToken: string;
    type?: 'flat' | 'small_tablo';
    maxSize?: number;
  }) => {
    const tempFiles: string[] = [];
    const type = params.type || 'flat';

    try {
      // Validáció
      if (!params.flattenedJpgPath || typeof params.flattenedJpgPath !== 'string') {
        return { success: false, error: 'Érvénytelen JPG elérési út' };
      }
      if (!params.projectId || typeof params.projectId !== 'number') {
        return { success: false, error: 'Érvénytelen projekt ID' };
      }

      // Path traversal védelem
      const resolvedPath = path.resolve(params.flattenedJpgPath);
      const resolvedOutputDir = path.resolve(params.outputDir || path.dirname(resolvedPath));
      const homeDir = path.resolve(app.getPath('home'));
      const tempDir = app.getPath('temp');
      if (!resolvedPath.startsWith(homeDir) && !resolvedPath.startsWith(tempDir)) {
        return { success: false, error: 'Nem engedélyezett elérési út' };
      }
      if (!resolvedOutputDir.startsWith(homeDir)) {
        return { success: false, error: 'Nem engedélyezett kimeneti mappa' };
      }

      if (!fs.existsSync(resolvedPath)) {
        return { success: false, error: 'A flatten temp JPG nem található.' };
      }

      // Prefix: FLAT_ vagy KISTABLO_
      const prefix = type === 'small_tablo' ? 'KISTABLO' : 'FLAT';
      const sanitizedName = params.projectName
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'tablo';

      // Ha maxSize van, resize Sharp-pal (leghosszabb oldal)
      let fileToUpload = resolvedPath;
      if (params.maxSize && params.maxSize > 0) {
        const resizedPath = path.join(app.getPath('temp'), `finalizer-resized-${Date.now()}.jpg`);
        tempFiles.push(resizedPath);

        await sharp(resolvedPath)
          .resize(params.maxSize, params.maxSize, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 95, progressive: true })
          .keepIccProfile()
          .toFile(resizedPath);

        fileToUpload = resizedPath;
        log.info(`Resize kész: ${params.maxSize}px (${type})`);
      }

      // Lokális mentés
      const localFileName = `${prefix}_${sanitizedName}.jpg`;
      const localOutputPath = path.join(resolvedOutputDir, localFileName);
      fs.copyFileSync(fileToUpload, localOutputPath);
      log.info(`Lokális mentés: ${localOutputPath}`);

      // Feltöltés
      let uploadedCount = 0;
      let uploadError: string | undefined;

      if (!params.apiBaseUrl) {
        uploadError = 'Nincs API URL beállítva';
      } else if (!params.authToken) {
        uploadError = 'Nincs bejelentkezési token (marketer_token)';
      } else {
        const uploadResult = await uploadToBackend(
          fileToUpload,
          params.apiBaseUrl,
          params.projectId,
          params.authToken,
          type,
          localFileName,
        );
        if (uploadResult.success) {
          uploadedCount = 1;
          log.info(`Feltöltve: ${type}`);
        } else {
          uploadError = uploadResult.error;
          log.error(`Feltöltés sikertelen (${type}):`, uploadError);
        }
      }

      // Temp fájlok törlése
      for (const tempFile of tempFiles) {
        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (_) { /* ignore */ }
      }

      return {
        success: true,
        localPath: localOutputPath,
        uploadedCount,
        error: uploadError,
      };

    } catch (error) {
      for (const tempFile of tempFiles) {
        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (_) { /* ignore */ }
      }

      log.error(`Hiba (${type}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ismeretlen hiba',
      };
    }
  });
}
