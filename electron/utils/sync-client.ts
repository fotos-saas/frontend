/**
 * sync-client.ts — Kliens oldali sync műveletek
 *
 * Manifest lekérés, fájl letöltés, változás értesítés
 * egy távoli peer-ről.
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { generateHmac, getOrCreateDeviceId } from './sync-auth';
import type { ManifestEntry, SyncProgress } from './sync-manifest';

// ============ Manifest lekérés ============

export async function fetchManifestFromPeer(
  ip: string,
  port: number,
  _peerId: string,
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

// ============ Fájl letöltés ============

export async function downloadFileFromPeer(
  ip: string,
  port: number,
  _peerId: string,
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

// ============ Változás értesítés ============

export async function sendNotifyToPeer(
  ip: string,
  port: number,
  _peerId: string,
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
