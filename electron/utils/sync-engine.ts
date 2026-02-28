/**
 * sync-engine.ts — LAN szinkronizálás orchestrátor
 *
 * Összefogja a manifest, szerver és kliens modulokat.
 * Chokidar fájl figyelés + lifecycle kezelés.
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { watch, type FSWatcher } from 'chokidar';
import log from 'electron-log/main';
import { buildManifest, computeQuickHash } from './sync-manifest';
import { createSyncServer } from './sync-server';
import type { ManifestEntry, SyncProgress, SyncState, SyncEventHandler } from './sync-manifest';

// Re-exportok a visszafelé kompatibilitáshoz
export type { ManifestEntry, SyncProgress, SyncState, SyncEventHandler } from './sync-manifest';
export { fetchManifestFromPeer, downloadFileFromPeer, sendNotifyToPeer } from './sync-client';

// ============ Konstansok ============

const DEBOUNCE_MS = 2000;
const IGNORE_PATTERNS = [
  '**/.DS_Store',
  '**/Thumbs.db',
  '**/*.tmp',
  '**/*.lock',
  '**/._*',
  '**/.git/**',
];

// ============ Engine State ============

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

  const scheduleDebounce = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const files = Array.from(changedFiles);
      changedFiles.clear();
      handleBatchChange(files);
    }, DEBOUNCE_MS);
  };

  const handleChange = (filePath: string) => {
    const relativePath = path.relative(dirPath, filePath);
    changedFiles.add(relativePath);
    scheduleDebounce();
  };

  fileWatcher.on('add', handleChange);
  fileWatcher.on('change', handleChange);
  fileWatcher.on('unlink', (filePath: string) => {
    const relativePath = path.relative(dirPath, filePath);
    manifest.delete(relativePath);
    changedFiles.add(relativePath);
    scheduleDebounce();
  });
}

async function handleBatchChange(relativePaths: string[]): Promise<void> {
  for (const relPath of relativePaths) {
    const fullPath = path.join(workspacePath, relPath);
    try {
      const stat = await fs.promises.stat(fullPath);
      const quickHash = await computeQuickHash(fullPath);
      manifest.set(relPath, { size: stat.size, mtimeMs: stat.mtimeMs, quickHash });
    } catch {
      manifest.delete(relPath);
    }
  }

  log.info(`Fájl változás: ${relativePaths.length} fájl frissítve a manifestben`);
  onFileChangedHandlers.forEach(h => h(relativePaths));
}

// ============ Engine Lifecycle ============

export async function startSyncEngine(wsPath: string): Promise<number> {
  workspacePath = wsPath;

  log.info(`Manifest felépítése: ${wsPath}`);
  manifest = await buildManifest(wsPath);
  log.info(`Manifest kész: ${manifest.size} fájl`);

  httpServer = createSyncServer(
    manifest,
    () => workspacePath,
    onFileChangedHandlers,
  );

  return new Promise((resolve, reject) => {
    httpServer!.listen(0, '0.0.0.0', () => {
      const addr = httpServer!.address();
      if (typeof addr === 'object' && addr) {
        serverPort = addr.port;
        log.info(`Sync HTTP szerver elindítva: port ${serverPort}`);
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

// ============ Getterek ============

export function getServerPort(): number {
  return serverPort;
}

export function getWorkspacePath(): string {
  return workspacePath;
}

export function getManifest(): Map<string, ManifestEntry> {
  return manifest;
}

// ============ Event kezelés ============

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
