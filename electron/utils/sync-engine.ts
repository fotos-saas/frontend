/**
 * sync-engine.ts — LAN szinkronizálás motor
 *
 * HTTP szerver + chokidar fájl figyelés + delta sync
 * Manifest: Map<relativePath, { size, mtimeMs, quickHash }>
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { watch, type FSWatcher } from 'chokidar';
import log from 'electron-log/main';
import {
  verifyHmac,
  generateHmac,
  findPeerPsk,
  getOrCreateDeviceId,
  getPairedPeers,
  type PairedPeer,
} from './sync-auth';
import { type DiscoveredPeer } from './sync-discovery';

// ============ Típusok ============

export interface ManifestEntry {
  size: number;
  mtimeMs: number;
  quickHash: string;
}

export interface SyncProgress {
  fileName: string;
  percent: number;
  bytesTransferred: number;
  totalBytes: number;
}

export type SyncState = 'disabled' | 'searching' | 'idle' | 'syncing' | 'error';

export type SyncEventHandler<T = void> = (data: T) => void;

// ============ Konstansok ============

const QUICK_HASH_CHUNK_SIZE = 64 * 1024; // 64KB
const DEBOUNCE_MS = 2000;
const IGNORE_PATTERNS = [
  '**/.DS_Store',
  '**/Thumbs.db',
  '**/*.tmp',
  '**/*.lock',
  '**/._*',
  '**/.git/**',
];

// ============ Engine ============

let httpServer: http.Server | null = null;
let serverPort = 0;
let fileWatcher: FSWatcher | null = null;
let workspacePath: string = '';
let manifest = new Map<string, ManifestEntry>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let changedFiles = new Set<string>();

// Event handlerek
const onProgressHandlers: SyncEventHandler<SyncProgress>[] = [];
const onErrorHandlers: SyncEventHandler<string>[] = [];
const onFileChangedHandlers: SyncEventHandler<string[]>[] = [];

// ============ Quick Hash ============

async function computeQuickHash(filePath: string): Promise<string> {
  const stat = await fs.promises.stat(filePath);
  const size = stat.size;

  if (size === 0) {
    return crypto.createHash('md5').update('empty').digest('hex');
  }

  const hash = crypto.createHash('md5');
  const fd = await fs.promises.open(filePath, 'r');

  try {
    // Első 64KB
    const firstChunk = Buffer.alloc(Math.min(QUICK_HASH_CHUNK_SIZE, size));
    await fd.read(firstChunk, 0, firstChunk.length, 0);
    hash.update(firstChunk);

    // Utolsó 64KB (ha a fájl elég nagy)
    if (size > QUICK_HASH_CHUNK_SIZE) {
      const lastChunk = Buffer.alloc(Math.min(QUICK_HASH_CHUNK_SIZE, size));
      await fd.read(lastChunk, 0, lastChunk.length, Math.max(0, size - QUICK_HASH_CHUNK_SIZE));
      hash.update(lastChunk);
    }

    // Méret hozzáadása
    hash.update(size.toString());
  } finally {
    await fd.close();
  }

  return hash.digest('hex');
}

// ============ Manifest ============

async function buildManifest(dirPath: string): Promise<Map<string, ManifestEntry>> {
  const result = new Map<string, ManifestEntry>();

  async function walkDir(dir: string): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(dirPath, fullPath);

      // Ignorált fájlok kiszűrése
      if (shouldIgnore(entry.name)) continue;

      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.isFile()) {
        try {
          const stat = await fs.promises.stat(fullPath);
          const quickHash = await computeQuickHash(fullPath);
          result.set(relativePath, {
            size: stat.size,
            mtimeMs: stat.mtimeMs,
            quickHash,
          });
        } catch {
          // Fájl nem olvasható, kihagyjuk
        }
      }
    }
  }

  await walkDir(dirPath);
  return result;
}

function shouldIgnore(name: string): boolean {
  if (name === '.DS_Store' || name === 'Thumbs.db') return true;
  if (name.startsWith('._')) return true;
  if (name.endsWith('.tmp') || name.endsWith('.lock')) return true;
  if (name === '.git') return true;
  return false;
}

// ============ HTTP Szerver ============

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

function sendJson(res: http.ServerResponse, data: unknown, status = 200): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function createSyncServer(): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost`);
    const pathname = url.pathname;

    // Health check (nem igényel auth)
    if (pathname === '/sync/health' && req.method === 'GET') {
      sendJson(res, {
        status: 'ok',
        deviceId: getOrCreateDeviceId(),
        timestamp: Date.now(),
      });
      return;
    }

    // Auth check a többi endpointhoz
    let body = '';
    if (req.method === 'POST') {
      body = await readBody(req);
    }

    if (!authenticateRequest(req, body)) {
      sendJson(res, { error: 'Nem engedélyezett' }, 401);
      return;
    }

    try {
      if (pathname === '/sync/manifest' && req.method === 'GET') {
        await handleManifest(res);
      } else if (pathname === '/sync/file' && req.method === 'GET') {
        const filePath = url.searchParams.get('path');
        if (!filePath) {
          sendJson(res, { error: 'Hiányzó path paraméter' }, 400);
          return;
        }
        await handleFileDownload(req, res, filePath);
      } else if (pathname === '/sync/notify' && req.method === 'POST') {
        handleNotify(res, body);
      } else if (pathname === '/sync/pair' && req.method === 'POST') {
        handlePairRequest(req, res, body);
      } else {
        sendJson(res, { error: 'Nem található' }, 404);
      }
    } catch (err) {
      log.error('Sync szerver hiba:', err);
      sendJson(res, { error: 'Szerver hiba' }, 500);
    }
  });
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

async function handleManifest(res: http.ServerResponse): Promise<void> {
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
): Promise<void> {
  // Path traversal védelem
  const fullPath = path.resolve(workspacePath, relativePath);
  if (!fullPath.startsWith(path.resolve(workspacePath))) {
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

function handleNotify(res: http.ServerResponse, body: string): void {
  try {
    const data = JSON.parse(body) as { changedFiles: string[] };
    if (data.changedFiles?.length) {
      log.info(`Peer értesítés: ${data.changedFiles.length} fájl változott`);
      onFileChangedHandlers.forEach(h => h(data.changedFiles));
    }
    sendJson(res, { ok: true });
  } catch {
    sendJson(res, { error: 'Érvénytelen JSON' }, 400);
  }
}

function handlePairRequest(
  _req: http.IncomingMessage,
  res: http.ServerResponse,
  body: string,
): void {
  try {
    const data = JSON.parse(body) as {
      peerId: string;
      deviceName: string;
      psk: string;
    };
    if (!data.peerId || !data.psk) {
      sendJson(res, { error: 'Hiányzó adatok' }, 400);
      return;
    }
    // A párosítás a handler-ben történik, itt csak visszaigazolunk
    sendJson(res, {
      ok: true,
      deviceId: getOrCreateDeviceId(),
      deviceName: require('os').hostname(),
    });
  } catch {
    sendJson(res, { error: 'Érvénytelen JSON' }, 400);
  }
}

// ============ Fájl figyelés (chokidar) ============

function startWatching(dirPath: string): void {
  fileWatcher = watch(dirPath, {
    ignored: IGNORE_PATTERNS,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 500,
    },
  });

  const handleChange = (filePath: string) => {
    const relativePath = path.relative(dirPath, filePath);
    changedFiles.add(relativePath);

    // Debounce: 2s ablakban összegyűjtjük a változásokat
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const files = Array.from(changedFiles);
      changedFiles.clear();
      handleBatchChange(files);
    }, DEBOUNCE_MS);
  };

  fileWatcher.on('add', handleChange);
  fileWatcher.on('change', handleChange);
  fileWatcher.on('unlink', (filePath: string) => {
    const relativePath = path.relative(dirPath, filePath);
    manifest.delete(relativePath);
    changedFiles.add(relativePath);

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const files = Array.from(changedFiles);
      changedFiles.clear();
      handleBatchChange(files);
    }, DEBOUNCE_MS);
  });
}

async function handleBatchChange(relativePaths: string[]): Promise<void> {
  // Manifest frissítése
  for (const relPath of relativePaths) {
    const fullPath = path.join(workspacePath, relPath);
    try {
      const stat = await fs.promises.stat(fullPath);
      const quickHash = await computeQuickHash(fullPath);
      manifest.set(relPath, { size: stat.size, mtimeMs: stat.mtimeMs, quickHash });
    } catch {
      manifest.delete(relPath); // Fájl törölve
    }
  }

  log.info(`Fájl változás: ${relativePaths.length} fájl frissítve a manifestben`);

  // Peer-ek értesítése
  const peers = getPairedPeers();
  for (const peer of peers) {
    notifyPeer(peer, relativePaths).catch(err => {
      log.warn(`Peer értesítés sikertelen (${peer.deviceName}):`, err.message);
    });
  }
}

// ============ Kliens oldali sync ============

async function notifyPeer(peer: PairedPeer, changedFiles: string[]): Promise<void> {
  // Peer port megkeresése a discovered peers-ből (importálni kell kívülről)
  // Egyelőre a sync handler fogja kezelni a peer port mapping-et
}

export async function fetchManifestFromPeer(
  ip: string,
  port: number,
  peerId: string,
  psk: string,
): Promise<Record<string, ManifestEntry>> {
  const authHeader = generateHmac(psk, 'GET', '/sync/manifest');
  const deviceId = getOrCreateDeviceId();

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: ip,
      port,
      path: '/sync/manifest',
      method: 'GET',
      headers: {
        'X-Sync-Auth': authHeader,
        'X-Sync-Peer-Id': deviceId,
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('Érvénytelen manifest JSON'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

export async function downloadFileFromPeer(
  ip: string,
  port: number,
  peerId: string,
  psk: string,
  relativePath: string,
  destPath: string,
  onProgress?: (progress: SyncProgress) => void,
): Promise<void> {
  const authHeader = generateHmac(psk, 'GET', '/sync/file');
  const deviceId = getOrCreateDeviceId();
  const encodedPath = encodeURIComponent(relativePath);

  // Célmappa létrehozása
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: ip,
      port,
      path: `/sync/file?path=${encodedPath}`,
      method: 'GET',
      headers: {
        'X-Sync-Auth': authHeader,
        'X-Sync-Peer-Id': deviceId,
      },
      timeout: 300000, // 5 perc nagy fájlokhoz
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      let bytesTransferred = 0;
      const writeStream = fs.createWriteStream(destPath);

      res.on('data', (chunk: Buffer) => {
        bytesTransferred += chunk.length;
        if (onProgress && totalBytes > 0) {
          onProgress({
            fileName: relativePath,
            percent: Math.round((bytesTransferred / totalBytes) * 100),
            bytesTransferred,
            totalBytes,
          });
        }
      });

      res.pipe(writeStream);

      writeStream.on('finish', () => {
        // mtime beállítása a peer-ről kapott értékre
        const mtime = res.headers['x-file-mtime'];
        if (mtime && typeof mtime === 'string') {
          const mtimeMs = parseFloat(mtime);
          fs.utimesSync(destPath, new Date(mtimeMs), new Date(mtimeMs));
        }
        resolve();
      });
      writeStream.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

export async function sendNotifyToPeer(
  ip: string,
  port: number,
  peerId: string,
  psk: string,
  changedFiles: string[],
): Promise<void> {
  const body = JSON.stringify({ changedFiles });
  const authHeader = generateHmac(psk, 'POST', '/sync/notify', body);
  const deviceId = getOrCreateDeviceId();

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: ip,
      port,
      path: '/sync/notify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Sync-Auth': authHeader,
        'X-Sync-Peer-Id': deviceId,
      },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve();
        else reject(new Error(`HTTP ${res.statusCode}: ${data}`));
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.write(body);
    req.end();
  });
}

// ============ Engine Lifecycle ============

export async function startSyncEngine(wsPath: string): Promise<number> {
  workspacePath = wsPath;

  // Manifest felépítése
  log.info(`Manifest felépítése: ${wsPath}`);
  manifest = await buildManifest(wsPath);
  log.info(`Manifest kész: ${manifest.size} fájl`);

  // HTTP szerver indítása random porton
  httpServer = createSyncServer();

  return new Promise((resolve, reject) => {
    httpServer!.listen(0, '0.0.0.0', () => {
      const addr = httpServer!.address();
      if (typeof addr === 'object' && addr) {
        serverPort = addr.port;
        log.info(`Sync HTTP szerver elindítva: port ${serverPort}`);

        // Fájl figyelés indítása
        startWatching(wsPath);

        resolve(serverPort);
      } else {
        reject(new Error('Nem sikerült a port lekérdezése'));
      }
    });

    httpServer!.on('error', (err) => {
      log.error('Sync szerver hiba:', err);
      reject(err);
    });
  });
}

export function stopSyncEngine(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (fileWatcher) {
    fileWatcher.close();
    fileWatcher = null;
  }

  if (httpServer) {
    httpServer.close();
    httpServer = null;
  }

  manifest.clear();
  changedFiles.clear();
  serverPort = 0;
  workspacePath = '';

  log.info('Sync engine leállítva');
}

export function getServerPort(): number {
  return serverPort;
}

export function getWorkspacePath(): string {
  return workspacePath;
}

export function getManifest(): Map<string, ManifestEntry> {
  return manifest;
}

export function onProgress(handler: SyncEventHandler<SyncProgress>): void {
  onProgressHandlers.push(handler);
}

export function onError(handler: SyncEventHandler<string>): void {
  onErrorHandlers.push(handler);
}

export function onFileChanged(handler: SyncEventHandler<string[]>): void {
  onFileChangedHandlers.push(handler);
}

export function emitProgress(progress: SyncProgress): void {
  onProgressHandlers.forEach(h => h(progress));
}

export function emitError(error: string): void {
  onErrorHandlers.forEach(h => h(error));
}

export function clearEngineHandlers(): void {
  onProgressHandlers.length = 0;
  onErrorHandlers.length = 0;
  onFileChangedHandlers.length = 0;
}
