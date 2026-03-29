/**
 * PhotoDownloadService — Fotó letöltés SSRF védelemmel és path traversal védelemmel
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { app } from 'electron';
import log from 'electron-log/main';

// ============ Constants ============

export const PHOTO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 perc

/** Allowed domains for photo downloads (SSRF protection) */
export const PRODUCTION_DOWNLOAD_DOMAINS = [
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

// ============ Functions ============

/** URL domain whitelist ellenőrzés (SSRF védelem) */
export function isAllowedDownloadUrl(url: string): boolean {
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

export function downloadPhoto(
  url: string,
  fileName: string,
  _targetSize?: unknown,
  _redirectCount = 0,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // SSRF védelem: csak engedélyezett domainekről töltünk le
    if (!isAllowedDownloadUrl(url)) {
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

    const rawPath = path.join(tempDir, safeName);

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
          downloadPhoto(redirectUrl, safeName, undefined, _redirectCount + 1).then(resolve).catch(reject);
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
        log.info(`Foto letoltve: ${fileName}`);
        resolve(rawPath);
      });
    }).on('error', (err) => {
      fs.unlink(rawPath, () => {});
      reject(err);
    });
  });
}
