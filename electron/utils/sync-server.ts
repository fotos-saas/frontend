/**
 * sync-server.ts — HTTP szerver a LAN szinkronizáláshoz
 *
 * Endpointok:
 * - GET /sync/health — élőség ellenőrzés
 * - POST /sync/pair — párosítási kérelem (kód validáció)
 * - GET /sync/manifest — fájl manifest lekérdezés
 * - GET /sync/file?path=... — fájl letöltés (Range support)
 * - POST /sync/notify — változás értesítés
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log/main';
import { hostname } from 'os';
import {
  verifyHmac,
  findPeerPsk,
  getOrCreateDeviceId,
  validatePairingCode,
  derivePsk,
  addPairedPeer,
} from './sync-auth';
import type { ManifestEntry, SyncEventHandler } from './sync-manifest';

// ============ Konstansok ============

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

// ============ Helpers ============

function authenticateRequest(
  req: http.IncomingMessage,
  body: string = '',
): boolean {
  const authHeader = req.headers['x-sync-auth'] as string;
  const peerId = req.headers['x-sync-peer-id'] as string;
  if (!authHeader || !peerId) return false;

  const psk = findPeerPsk(peerId);
  if (!psk) return false;

  const urlPath = req.url?.split('?')[0] || '/';
  return verifyHmac(psk, authHeader, req.method || 'GET', urlPath, body);
}

export function sendJson(res: http.ServerResponse, data: unknown, status = 200): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error('Request body túl nagy (max 1MB)'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', (err) => reject(err));
  });
}

// ============ HTTP Szerver ============

export function createSyncServer(
  manifest: Map<string, ManifestEntry>,
  getWorkspacePath: () => string,
  fileChangedHandlers: SyncEventHandler<string[]>[],
): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost`);
    const pathname = url.pathname;

    // Health check (nem igényel auth)
    if (pathname === '/sync/health' && req.method === 'GET') {
      sendJson(res, { status: 'ok', timestamp: Date.now() });
      return;
    }

    // Párosítás (nem igényel HMAC auth — a kód validáció az auth)
    if (pathname === '/sync/pair' && req.method === 'POST') {
      try {
        const body = await readBody(req);
        handlePairRequest(res, body);
      } catch (err) {
        log.error('Pair request hiba:', err);
        sendJson(res, { error: 'Szerver hiba' }, 500);
      }
      return;
    }

    // Auth check a többi endpointhoz
    let body = '';
    if (req.method === 'POST') {
      try {
        body = await readBody(req);
      } catch {
        sendJson(res, { error: 'Request body hiba' }, 413);
        return;
      }
    }

    if (!authenticateRequest(req, body)) {
      sendJson(res, { error: 'Nem engedélyezett' }, 401);
      return;
    }

    try {
      if (pathname === '/sync/manifest' && req.method === 'GET') {
        handleManifest(res, manifest);
      } else if (pathname === '/sync/file' && req.method === 'GET') {
        const filePath = url.searchParams.get('path');
        if (!filePath) {
          sendJson(res, { error: 'Hiányzó path paraméter' }, 400);
          return;
        }
        await handleFileDownload(req, res, filePath, getWorkspacePath());
      } else if (pathname === '/sync/notify' && req.method === 'POST') {
        handleNotify(res, body, fileChangedHandlers);
      } else {
        sendJson(res, { error: 'Nem található' }, 404);
      }
    } catch (err) {
      log.error('Sync szerver hiba:', err);
      sendJson(res, { error: 'Szerver hiba' }, 500);
    }
  });
}

// ============ Request handlerek ============

function handleManifest(res: http.ServerResponse, manifest: Map<string, ManifestEntry>): void {
  const manifestObj: Record<string, ManifestEntry> = {};
  for (const [key, value] of manifest) {
    manifestObj[key] = value;
  }
  sendJson(res, manifestObj);
}

async function handleFileDownload(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  relativePath: string,
  wsPath: string,
): Promise<void> {
  // Path traversal védelem
  const fullPath = path.resolve(wsPath, relativePath);
  if (!fullPath.startsWith(path.resolve(wsPath))) {
    sendJson(res, { error: 'Nem engedélyezett elérési út' }, 403);
    return;
  }

  try {
    const stat = await fs.promises.stat(fullPath);

    // Range header támogatás (nagy fájlok)
    const range = req.headers.range;
    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;

        // Bounds validáció
        if (start >= stat.size || end >= stat.size || start > end) {
          res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
          res.end();
          return;
        }

        const chunkSize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'application/octet-stream',
        });

        const stream = fs.createReadStream(fullPath, { start, end });
        stream.pipe(res);
        return;
      }
    }

    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'X-File-Mtime': stat.mtimeMs.toString(),
    });

    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  } catch {
    sendJson(res, { error: 'Fájl nem található' }, 404);
  }
}

function handleNotify(
  res: http.ServerResponse,
  body: string,
  handlers: SyncEventHandler<string[]>[],
): void {
  try {
    const data = JSON.parse(body) as { changedFiles: string[] };
    if (data.changedFiles?.length) {
      log.info(`Peer értesítés: ${data.changedFiles.length} fájl változott`);
      handlers.forEach(h => h(data.changedFiles));
    }
    sendJson(res, { ok: true });
  } catch {
    sendJson(res, { error: 'Érvénytelen JSON' }, 400);
  }
}

function handlePairRequest(res: http.ServerResponse, body: string): void {
  try {
    const data = JSON.parse(body) as {
      peerId: string;
      deviceName: string;
      code: string;
    };
    if (!data.peerId || !data.code || !data.deviceName) {
      sendJson(res, { error: 'Hiányzó adatok' }, 400);
      return;
    }

    if (!validatePairingCode(data.code)) {
      sendJson(res, { error: 'Érvénytelen vagy lejárt kód' }, 403);
      return;
    }

    const salt = [getOrCreateDeviceId(), data.peerId].sort().join(':');
    const psk = derivePsk(data.code, salt);

    addPairedPeer({
      peerId: data.peerId,
      deviceName: data.deviceName,
      psk,
      pairedAt: Date.now(),
    });

    sendJson(res, {
      ok: true,
      deviceId: getOrCreateDeviceId(),
      deviceName: hostname(),
    });
  } catch {
    sendJson(res, { error: 'Érvénytelen JSON' }, 400);
  }
}
