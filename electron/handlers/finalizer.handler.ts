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
import * as crypto from 'crypto';
import log from 'electron-log/main';
import sharp from 'sharp';
import { resolveApiBaseUrl } from '../utils/api-url';

// ============ HTTP feltöltés ============

const CHUNKED_THRESHOLD = 8 * 1024 * 1024; // 8MB — ennél nagyobb fájlok darabolva mennek

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

    // Fájl méret a Content-Length számításhoz (fájlt nem olvassuk RAM-ba egészben)
    const fileStat = await fs.promises.stat(filePath);
    const totalLength = typePart.length + filePart.length + fileStat.size + footer.length;

    const url = new URL(`${apiBaseUrl}/partner/finalizations/${projectId}/upload`);
    const isHttps = url.protocol === 'https:';
    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      timeout: 120_000,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': totalLength,
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json',
      },
    };

    return await new Promise<UploadResult>((resolve) => {
      let resolved = false;
      const safeResolve = (result: UploadResult) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      const protocol = isHttps ? https : http;
      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            safeResolve({ success: true });
          } else {
            log.error(`Feltöltés hiba (${type}): HTTP ${res.statusCode}`, data.slice(0, 500));
            safeResolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 200)}` });
          }
        });
      });

      req.on('error', (err) => {
        log.error(`Feltöltés hálózati hiba (${type}):`, err.message);
        safeResolve({ success: false, error: err.message });
      });

      req.on('timeout', () => {
        log.error(`Feltöltés timeout (${type})`);
        req.destroy(new Error('Upload timeout'));
      });

      // Multipart header rész kiírása
      req.write(typePart);
      req.write(filePart);

      // Fájl stream-elése chunk-olva (nem olvassuk egészben RAM-ba)
      const fileStream = fs.createReadStream(filePath, { highWaterMark: 256 * 1024 });
      fileStream.on('data', (chunk) => {
        const ok = req.write(chunk);
        if (!ok) {
          fileStream.pause();
          req.once('drain', () => fileStream.resume());
        }
      });
      fileStream.on('end', () => {
        req.write(footer);
        req.end();
      });
      fileStream.on('error', (err) => {
        log.error(`Fájl olvasási hiba (${type}):`, err.message);
        req.destroy();
        safeResolve({ success: false, error: `Fájl olvasási hiba: ${err.message}` });
      });
    });
  } catch (err) {
    log.error('Feltöltés hiba:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Ismeretlen hiba' };
  }
}

// ============ Chunked Upload (darabolásos feltöltés nagy fájlokhoz) ============

interface ChunkedInitResponse {
  success: boolean;
  data: { upload_id: string; chunk_size: number; total_chunks: number };
}

function httpJson(
  apiBaseUrl: string,
  pathStr: string,
  method: string,
  authToken: string,
  body?: Record<string, unknown>,
  formData?: { boundary: string; parts: Buffer[] },
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${apiBaseUrl}/partner/chunked-upload${pathStr}`);
    const isHttps = url.protocol === 'https:';
    const payload = formData
      ? Buffer.concat(formData.parts)
      : body ? Buffer.from(JSON.stringify(body)) : undefined;

    const headers: Record<string, string | number> = {
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/json',
    };

    if (formData) {
      headers['Content-Type'] = `multipart/form-data; boundary=${formData.boundary}`;
      headers['Content-Length'] = payload!.length;
    } else if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = payload!.length;
    }

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method,
      timeout: 60_000,
      headers,
    };

    const proto = isHttps ? https : http;
    const req = proto.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('Timeout')); });

    if (payload) req.write(payload);
    req.end();
  });
}

async function uploadChunked(
  filePath: string,
  apiBaseUrl: string,
  authToken: string,
  metadata: Record<string, unknown>,
  uploadFileName?: string,
): Promise<UploadResult> {
  const fileName = uploadFileName || path.basename(filePath);
  const fileStat = await fs.promises.stat(filePath);
  const fileSize = fileStat.size;

  // Fájl hash számítás (SHA-256)
  const fileHash = await new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });

  // 1. Init
  log.info(`[CHUNKED] Init: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);
  const initRes = await httpJson(apiBaseUrl, '/init', 'POST', authToken, {
    file_name: fileName,
    file_size: fileSize,
    mime_type: 'image/jpeg',
    file_hash: fileHash,
    metadata,
  });

  if (initRes.status < 200 || initRes.status >= 300) {
    log.error(`[CHUNKED] Init hiba: HTTP ${initRes.status}`, initRes.body.slice(0, 300));
    return { success: false, error: `Init hiba: HTTP ${initRes.status}` };
  }

  const initData: ChunkedInitResponse = JSON.parse(initRes.body);
  const uploadId = initData.data.upload_id;
  const chunkSize = initData.data.chunk_size;
  const totalChunks = initData.data.total_chunks;

  log.info(`[CHUNKED] Session: ${uploadId}, ${totalChunks} chunk × ${(chunkSize / 1024 / 1024).toFixed(1)}MB`);

  // 2. Chunk-ok feltöltése szekvenciálisan — fájlt egyszer nyitjuk meg
  const fd = await fs.promises.open(filePath, 'r');
  try {
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileSize);
    const chunkBuffer = Buffer.alloc(end - start);

    // Chunk olvasása az egyszer megnyitott file descriptor-ból
    await fd.read(chunkBuffer, 0, end - start, start);

    // Multipart formdata a chunk-hoz
    const boundary = `----ChunkBoundary${Date.now()}${i}`;
    const indexPart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chunk_index"\r\n\r\n` +
      `${i}\r\n`,
    );
    const chunkPart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chunk"; filename="chunk_${i}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`,
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);

    let success = false;
    let lastError = '';

    // Retry: max 3x exponential backoff
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const chunkRes = await httpJson(
          apiBaseUrl, `/${uploadId}/chunk`, 'POST', authToken,
          undefined,
          { boundary, parts: [indexPart, chunkPart, chunkBuffer, footer] },
        );

        if (chunkRes.status >= 200 && chunkRes.status < 300) {
          success = true;
          break;
        }

        lastError = `HTTP ${chunkRes.status}: ${chunkRes.body.slice(0, 200)}`;
        log.warn(`[CHUNKED] Chunk ${i}/${totalChunks} retry ${attempt + 1}: ${lastError}`);
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Ismeretlen hiba';
        log.warn(`[CHUNKED] Chunk ${i}/${totalChunks} retry ${attempt + 1}: ${lastError}`);
      }

      if (attempt < 2) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt + 1) * 1000));
      }
    }

    if (!success) {
      log.error(`[CHUNKED] Chunk ${i} véglegesen sikertelen: ${lastError}`);
      await fd.close();
      // Abort
      try {
        await httpJson(apiBaseUrl, `/${uploadId}`, 'DELETE', authToken);
      } catch (_) { /* ignore */ }
      return { success: false, error: `Chunk ${i + 1}/${totalChunks} feltöltése sikertelen: ${lastError}` };
    }

    log.info(`[CHUNKED] Chunk ${i + 1}/${totalChunks} OK`);
  }
  } finally {
    await fd.close();
  }

  // 3. Complete
  log.info(`[CHUNKED] Complete...`);
  const completeRes = await httpJson(apiBaseUrl, `/${uploadId}/complete`, 'POST', authToken, {});

  if (completeRes.status < 200 || completeRes.status >= 300) {
    log.error(`[CHUNKED] Complete hiba: HTTP ${completeRes.status}`, completeRes.body.slice(0, 300));
    return { success: false, error: `Complete hiba: HTTP ${completeRes.status}` };
  }

  log.info(`[CHUNKED] Sikeres feltöltés: ${fileName}`);
  return { success: true };
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

      // Feltöltés — automatikusan chunked ha >8MB
      let uploadedCount = 0;
      let uploadError: string | undefined;

      const resolvedApiUrl = resolveApiBaseUrl(params.apiBaseUrl || '');
      if (!resolvedApiUrl) {
        uploadError = 'Nincs API URL beállítva';
      } else if (!params.authToken) {
        uploadError = 'Nincs bejelentkezési token (marketer_token)';
      } else {
        const fileStat = await fs.promises.stat(fileToUpload);
        const useChunked = fileStat.size >= CHUNKED_THRESHOLD;

        let uploadResult: UploadResult;

        if (useChunked) {
          log.info(`Nagy fájl (${(fileStat.size / 1024 / 1024).toFixed(1)}MB) → chunked upload`);
          const collection = type === 'small_tablo' ? 'print_small_tablo' : 'print_flat';
          uploadResult = await uploadChunked(
            fileToUpload,
            resolvedApiUrl,
            params.authToken,
            {
              context: 'finalization',
              project_id: params.projectId,
              collection,
              type,
            },
            localFileName,
          );
        } else {
          uploadResult = await uploadToBackend(
            fileToUpload,
            resolvedApiUrl,
            params.projectId,
            params.authToken,
            type,
            localFileName,
          );
        }

        if (uploadResult.success) {
          uploadedCount = 1;
          log.info(`Feltöltve: ${type}${useChunked ? ' (chunked)' : ''}`);
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
