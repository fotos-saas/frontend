/**
 * finalizer.handler.ts — Véglegesített tablókép feltöltés Electron IPC handler
 *
 * Folyamat:
 * 1. Photoshop JSX flatten-export.jsx futtatása → temp JPG (a ps service végzi)
 * 2. A temp JPG-t közvetlenül feltölti: nincs resize, nincs watermark
 * 3. HTTP POST: /api/partner/finalizations/{projectId}/upload (type=flat)
 * 4. Temp fájl törlése
 */

import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import log from 'electron-log/main';

// ============ HTTP feltöltés ============

interface UploadResult {
  success: boolean;
  error?: string;
}

async function uploadFinalToBackend(
  filePath: string,
  apiBaseUrl: string,
  projectId: number,
  authToken: string,
): Promise<UploadResult> {
  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    return await new Promise<UploadResult>((resolve) => {
      const fileName = path.basename(filePath);
      const boundary = `----FormBoundary${Date.now()}`;

      // type=flat mező + file mező
      const typePart = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="type"\r\n\r\n` +
        `flat\r\n`,
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
            log.error(`Véglegesítés feltöltés hiba: HTTP ${res.statusCode}`, data.slice(0, 500));
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (err) => {
        log.error('Véglegesítés feltöltés hálózati hiba:', err.message);
        resolve({ success: false, error: err.message });
      });

      req.write(body);
      req.end();
    });
  } catch (err) {
    log.error('Véglegesítés feltöltés hiba:', err);
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
  }) => {
    const tempFiles: string[] = [];

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

      // Lokális mentés FLAT_ prefix-szel
      const sanitizedName = params.projectName
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'vegglegesites';

      const localFileName = `FLAT_${sanitizedName}.jpg`;
      const localOutputPath = path.join(resolvedOutputDir, localFileName);
      fs.copyFileSync(resolvedPath, localOutputPath);
      log.info(`Véglegesítés lokális mentés: ${localOutputPath}`);

      // Feltöltés
      let uploadedCount = 0;
      let uploadError: string | undefined;

      if (params.apiBaseUrl && params.authToken) {
        const uploadResult = await uploadFinalToBackend(
          resolvedPath,
          params.apiBaseUrl,
          params.projectId,
          params.authToken,
        );
        if (uploadResult.success) {
          uploadedCount = 1;
          log.info('Véglegesítés feltöltve');
        } else {
          uploadError = uploadResult.error;
          log.error('Véglegesítés feltöltés sikertelen:', uploadError);
        }
      }

      // Temp fájlok törlése
      for (const tempFile of tempFiles) {
        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (_) { /* ignore */ }
      }

      log.info(`Véglegesítés kész: ${localOutputPath}, feltöltve: ${uploadedCount}`);

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

      log.error('Véglegesítés hiba:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ismeretlen hiba',
      };
    }
  });
}
