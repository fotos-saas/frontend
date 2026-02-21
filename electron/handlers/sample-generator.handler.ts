/**
 * sample-generator.handler.ts — Minta generalas Electron IPC handler
 *
 * Folyamat:
 * 1. Photoshop JSX flatten-export.jsx futtatasa → temp JPG
 * 2. Sharp resize mindket meretre
 * 3. Sharp tiled watermark ratetele (SVG composite)
 * 4. Lokalis mentes: PSD mappa / MINTA_{nev}_{meretNev}.jpg
 * 5. HTTP POST feltoltes: /api/tablo-management/projects/{id}/samples
 * 6. Temp fajlok torlese
 */

import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import Store from 'electron-store';
import log from 'electron-log/main';
import sharp from 'sharp';

// ============ Store schema ============

interface SampleSchema {
  sampleSizeLarge: number;
  sampleSizeSmall: number;
  sampleWatermarkText: string;
  sampleWatermarkColor: 'white' | 'black';
  sampleWatermarkOpacity: number;
}

const sampleStore = new Store<SampleSchema>({
  name: 'photostack-samples',
  defaults: {
    sampleSizeLarge: 4000,
    sampleSizeSmall: 2000,
    sampleWatermarkText: 'MINTA',
    sampleWatermarkColor: 'white',
    sampleWatermarkOpacity: 0.15,
  },
});

// ============ Watermark SVG generalas ============

/**
 * Tiled vizjel SVG generalas.
 * -30 fokos forgatott szoveg grid-ben, atmenettel.
 */
function generateTiledWatermarkSvg(
  width: number,
  height: number,
  text: string,
  fontSize: number,
  color: 'white' | 'black',
  opacity: number,
): string {
  const fill = color === 'white' ? '255,255,255' : '0,0,0';
  const spacingX = fontSize * text.length * 0.8 + fontSize * 2;
  const spacingY = fontSize * 3;

  // Diagonal vetel: kell eleg sor/oszlop hogy a forgatott grid kitoltse a kepet
  const diagonal = Math.sqrt(width * width + height * height);
  const cols = Math.ceil(diagonal / spacingX) + 2;
  const rows = Math.ceil(diagonal / spacingY) + 2;

  const offsetX = -diagonal / 2;
  const offsetY = -diagonal / 2;

  let texts = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * spacingX;
      const y = offsetY + row * spacingY;
      texts += `<text x="${x}" y="${y}" fill="rgba(${fill},${opacity})" font-size="${fontSize}" font-family="Arial, Helvetica, sans-serif" font-weight="bold">${escapeXml(text)}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g transform="translate(${width / 2},${height / 2}) rotate(-30) translate(${-width / 2},${-height / 2})">
    ${texts}
  </g>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============ Watermark alkalmazas Sharp-pal ============

async function applyTiledWatermark(
  inputPath: string,
  outputPath: string,
  text: string,
  color: 'white' | 'black',
  opacity: number,
): Promise<void> {
  const metadata = await sharp(inputPath).metadata();
  const width = metadata.width!;
  const height = metadata.height!;

  const fontSize = Math.max(24, Math.min(width, height) / 20);
  const svgOverlay = generateTiledWatermarkSvg(width, height, text, fontSize, color, opacity);

  await sharp(inputPath)
    .composite([{ input: Buffer.from(svgOverlay), gravity: 'centre' }])
    .jpeg({ quality: 90, progressive: true })
    .toFile(outputPath);
}

// ============ HTTP feltoltes ============

interface UploadResult {
  success: boolean;
  error?: string;
}

async function uploadSampleToBackend(
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

      // Multipart form-data osszeallitasa
      const header = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="images[]"; filename="${fileName}"\r\n` +
        `Content-Type: image/jpeg\r\n\r\n`,
      );
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([header, fileBuffer, footer]);

      const url = new URL(`${apiBaseUrl}/partner/projects/${projectId}/sample-packages/upload-from-editor`);
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
            log.error(`Minta feltoltes hiba: HTTP ${res.statusCode}`, data.slice(0, 500));
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (err) => {
        log.error('Minta feltoltes halozati hiba:', err.message);
        resolve({ success: false, error: err.message });
      });

      req.write(body);
      req.end();
    });
  } catch (err) {
    log.error('Minta feltoltes hiba:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Ismeretlen hiba' };
  }
}

// ============ IPC Handlerek regisztralasa ============

export function registerSampleGeneratorHandlers(): void {

  // --- Beallitasok getter ---
  ipcMain.handle('sample:get-settings', () => {
    try {
      return {
        success: true,
        settings: {
          sizeLarge: sampleStore.get('sampleSizeLarge', 4000),
          sizeSmall: sampleStore.get('sampleSizeSmall', 2000),
          watermarkText: sampleStore.get('sampleWatermarkText', 'MINTA'),
          watermarkColor: sampleStore.get('sampleWatermarkColor', 'white'),
          watermarkOpacity: sampleStore.get('sampleWatermarkOpacity', 0.15),
        },
      };
    } catch (error) {
      log.error('Minta beallitasok olvasasi hiba:', error);
      return { success: false, error: 'Nem sikerult beolvasni a beallitasokat' };
    }
  });

  // --- Beallitasok setter ---
  ipcMain.handle('sample:set-settings', (_event, settings: Partial<{
    sizeLarge: number;
    sizeSmall: number;
    watermarkText: string;
    watermarkColor: 'white' | 'black';
    watermarkOpacity: number;
  }>) => {
    try {
      if (settings.sizeLarge !== undefined) {
        const v = Number(settings.sizeLarge);
        if (v >= 500 && v <= 10000) sampleStore.set('sampleSizeLarge', v);
      }
      if (settings.sizeSmall !== undefined) {
        const v = Number(settings.sizeSmall);
        if (v >= 500 && v <= 10000) sampleStore.set('sampleSizeSmall', v);
      }
      if (settings.watermarkText !== undefined) {
        const t = String(settings.watermarkText).trim();
        if (t.length > 0 && t.length <= 50) sampleStore.set('sampleWatermarkText', t);
      }
      if (settings.watermarkColor !== undefined) {
        if (settings.watermarkColor === 'white' || settings.watermarkColor === 'black') {
          sampleStore.set('sampleWatermarkColor', settings.watermarkColor);
        }
      }
      if (settings.watermarkOpacity !== undefined) {
        const o = Number(settings.watermarkOpacity);
        if (o >= 0.05 && o <= 0.50) sampleStore.set('sampleWatermarkOpacity', o);
      }

      log.info('Minta beallitasok frissitve');
      return { success: true };
    } catch (error) {
      log.error('Minta beallitasok mentesi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a beallitasokat' };
    }
  });

  // --- Fo generalo folyamat ---
  ipcMain.handle('sample:generate', async (_event, params: {
    psdFilePath: string;
    outputDir: string;
    projectId: number;
    projectName: string;
    apiBaseUrl: string;
    authToken: string;
    watermarkText?: string;
    watermarkColor?: 'white' | 'black';
    watermarkOpacity?: number;
    sizes?: Array<{ name: string; width: number }>;
  }) => {
    const tempFiles: string[] = [];
    const localPaths: string[] = [];
    const errors: string[] = [];
    let uploadedCount = 0;

    try {
      // Validacio
      if (!params.psdFilePath || typeof params.psdFilePath !== 'string') {
        return { success: false, error: 'Ervenytelen PSD eleresi ut' };
      }
      if (!params.projectId || typeof params.projectId !== 'number') {
        return { success: false, error: 'Ervenytelen projekt ID' };
      }

      // Path traversal vedelem: a fajlnak a user home konyvtaran belul kell lennie
      const resolvedPath = path.resolve(params.psdFilePath);
      const resolvedOutputDir = path.resolve(params.outputDir || path.dirname(resolvedPath));
      const homeDir = path.resolve(app.getPath('home'));
      const tempDir = app.getPath('temp');
      if (!resolvedPath.startsWith(homeDir) && !resolvedPath.startsWith(tempDir)) {
        return { success: false, error: 'Nem engedelyezett eleresi ut' };
      }
      if (!resolvedOutputDir.startsWith(homeDir)) {
        return { success: false, error: 'Nem engedelyezett kimeneti mappa' };
      }

      // A psdFilePath itt mar a flatten temp JPG utvonala (a service eloszor futtatja a JSX flatten-t)
      if (!fs.existsSync(resolvedPath)) {
        return { success: false, error: 'A flatten temp JPG nem talalhato. Eloszor futtasd a flatten-export JSX-et!' };
      }

      // Beallitasok (param > store > default)
      const watermarkText = params.watermarkText || sampleStore.get('sampleWatermarkText', 'MINTA');
      const watermarkColor = params.watermarkColor || sampleStore.get('sampleWatermarkColor', 'white') as 'white' | 'black';
      const watermarkOpacity = params.watermarkOpacity ?? sampleStore.get('sampleWatermarkOpacity', 0.15);
      const sizes = params.sizes || [
        { name: 'nagy', width: sampleStore.get('sampleSizeLarge', 4000) },
        { name: 'kicsi', width: sampleStore.get('sampleSizeSmall', 2000) },
      ];

      // A projectName-bol generalunk fajlnevet
      const sanitizedName = params.projectName
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'minta';

      log.info(`Minta generalas indul: ${params.projectName} (${sizes.length} meret)`);

      // 2-3. Resize + watermark minden meretre
      for (const size of sizes) {
        try {
          // Resize
          const resizedPath = path.join(app.getPath('temp'), `sample-resized-${size.name}-${Date.now()}.jpg`);
          tempFiles.push(resizedPath);

          await sharp(resolvedPath)
            .resize(size.width, undefined, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 92, progressive: true })
            .toFile(resizedPath);

          log.info(`Resize kesz: ${size.name} (${size.width}px)`);

          // Watermark
          const watermarkedFileName = sizes.length === 1
            ? `MINTA_${sanitizedName}.jpg`
            : `MINTA_${sanitizedName}_${size.name}.jpg`;
          const watermarkedPath = path.join(app.getPath('temp'), `sample-watermarked-${size.name}-${Date.now()}.jpg`);
          tempFiles.push(watermarkedPath);

          await applyTiledWatermark(resizedPath, watermarkedPath, watermarkText, watermarkColor, watermarkOpacity);
          log.info(`Watermark kesz: ${size.name}`);

          // 4. Lokalis mentes a PSD mappa melle
          const localOutputPath = path.join(resolvedOutputDir, watermarkedFileName);
          fs.copyFileSync(watermarkedPath, localOutputPath);
          localPaths.push(localOutputPath);
          log.info(`Lokalis mentes: ${localOutputPath}`);

          // 5. Upload
          if (params.apiBaseUrl && params.authToken) {
            const uploadResult = await uploadSampleToBackend(
              watermarkedPath,
              params.apiBaseUrl,
              params.projectId,
              params.authToken,
            );
            if (uploadResult.success) {
              uploadedCount++;
              log.info(`Feltoltve: ${size.name}`);
            } else {
              errors.push(`${size.name}: ${uploadResult.error}`);
            }
          }
        } catch (sizeErr) {
          const errMsg = sizeErr instanceof Error ? sizeErr.message : 'Ismeretlen hiba';
          log.error(`Meret feldolgozasi hiba (${size.name}):`, errMsg);
          errors.push(`${size.name}: ${errMsg}`);
        }
      }

      // 6. Temp fajlok torlese
      for (const tempFile of tempFiles) {
        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (_) { /* ignore */ }
      }

      const success = localPaths.length > 0;
      log.info(`Minta generalas ${success ? 'kesz' : 'sikertelen'}: ${localPaths.length} fajl, ${uploadedCount} feltoltve`);

      return {
        success,
        localPaths,
        uploadedCount,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      // Cleanup temp files on error
      for (const tempFile of tempFiles) {
        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (_) { /* ignore */ }
      }

      log.error('Minta generalas hiba:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ismeretlen hiba',
        localPaths,
        uploadedCount,
        errors,
      };
    }
  });
}
