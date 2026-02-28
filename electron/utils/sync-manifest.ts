/**
 * sync-manifest.ts — Manifest kezelés + quick hash
 *
 * Fájl manifest felépítése és karbantartása.
 * Quick hash: első 64KB + utolsó 64KB + fájlméret → MD5
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

// ============ Quick Hash ============

export async function computeQuickHash(filePath: string): Promise<string> {
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

// ============ Manifest felépítés ============

export async function buildManifest(dirPath: string): Promise<Map<string, ManifestEntry>> {
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

export function shouldIgnore(name: string): boolean {
  if (name === '.DS_Store' || name === 'Thumbs.db') return true;
  if (name.startsWith('._')) return true;
  if (name.endsWith('.tmp') || name.endsWith('.lock')) return true;
  if (name === '.git') return true;
  return false;
}
