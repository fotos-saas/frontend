/**
 * sync-handler-sync.ts — Szinkronizálás logika és peer kommunikáció
 *
 * Delta sync, fájl letöltés/feltöltés, peer értesítés,
 * event handler beállítás, párosítási HTTP kérés.
 */

import * as http from 'http';
import * as path from 'path';
import log from 'electron-log/main';
import { hostname } from 'os';
import {
  getPairedPeers,
  getOrCreateDeviceId,
  type PairedPeer,
} from '../utils/sync-auth';
import {
  getDiscoveredPeers,
  onPeerDiscovered,
  onPeerLost,
  clearPeerHandlers,
  type DiscoveredPeer,
} from '../utils/sync-discovery';
import {
  fetchManifestFromPeer,
  downloadFileFromPeer,
  sendNotifyToPeer,
  getManifest,
  getWorkspacePath,
  onProgress,
  onError,
  onFileChanged,
  clearEngineHandlers,
  emitError,
  type SyncState,
} from '../utils/sync-engine';

// ============ Shared state referenciák (a handler-ből kapjuk) ============

export interface SyncHandlerContext {
  sendToRenderer: (channel: string, data: unknown) => void;
  setState: (state: SyncState) => void;
  getState: () => SyncState;
  peerAddresses: Map<string, { ip: string; port: number }>;
  getIsSyncing: () => boolean;
  setIsSyncing: (v: boolean) => void;
}

// ============ Sync logika ============

export async function performSync(
  peer: PairedPeer,
  ctx: SyncHandlerContext,
): Promise<void> {
  const addr = ctx.peerAddresses.get(peer.peerId);
  if (!addr) {
    log.warn(`Peer cím nem található: ${peer.deviceName}`);
    return;
  }

  ctx.setState('syncing');
  ctx.setIsSyncing(true);

  try {
    // 1. Remote manifest lekérése
    const remoteManifest = await fetchManifestFromPeer(
      addr.ip, addr.port, peer.peerId, peer.psk,
    );

    // 2. Lokális manifest
    const localManifest = getManifest();
    const wsPath = getWorkspacePath();

    // 3. Delta számítás
    const toDownload: string[] = [];
    const toUpload: string[] = [];

    for (const [relPath, remoteEntry] of Object.entries(remoteManifest)) {
      const localEntry = localManifest.get(relPath);
      if (!localEntry) {
        toDownload.push(relPath);
      } else if (localEntry.quickHash !== remoteEntry.quickHash) {
        if (remoteEntry.mtimeMs > localEntry.mtimeMs) {
          toDownload.push(relPath);
        } else if (localEntry.mtimeMs > remoteEntry.mtimeMs) {
          toUpload.push(relPath);
        }
      }
    }

    for (const [relPath] of localManifest) {
      if (!(relPath in remoteManifest)) {
        toUpload.push(relPath);
      }
    }

    log.info(`Delta sync: ${toDownload.length} letöltés, ${toUpload.length} feltöltés`);

    // 4. Fájlok letöltése
    for (let i = 0; i < toDownload.length; i++) {
      const relPath = toDownload[i];
      const destPath = path.join(wsPath, relPath);

      try {
        await downloadFileFromPeer(
          addr.ip, addr.port, peer.peerId, peer.psk,
          relPath, destPath,
          (progress) => {
            ctx.sendToRenderer('sync:progress', {
              ...progress,
              overallPercent: Math.round(((i + progress.percent / 100) / toDownload.length) * 100),
            });
          },
        );
        log.info(`Letöltve: ${relPath}`);
      } catch (err) {
        log.error(`Letöltés hiba (${relPath}):`, err);
      }
    }

    // 5. Saját változások jelzése a peer-nek
    if (toUpload.length > 0) {
      try {
        await sendNotifyToPeer(
          addr.ip, addr.port, peer.peerId, peer.psk, toUpload,
        );
        log.info(`Peer értesítve: ${toUpload.length} fájl`);
      } catch (err) {
        log.warn(`Peer értesítés hiba:`, err);
      }
    }

    ctx.setState('idle');
  } catch (err) {
    log.error('Sync hiba:', err);
    ctx.setState('error');
    emitError(err instanceof Error ? err.message : 'Szinkronizálási hiba');
    ctx.sendToRenderer('sync:error', {
      message: err instanceof Error ? err.message : 'Szinkronizálási hiba',
    });
  } finally {
    ctx.setIsSyncing(false);
  }
}

export async function performFullSync(ctx: SyncHandlerContext): Promise<void> {
  const peers = getPairedPeers();
  for (const peer of peers) {
    await performSync(peer, ctx);
  }
}

// ============ Event handlerek beállítása ============

export function setupEventHandlers(ctx: SyncHandlerContext): void {
  clearPeerHandlers();
  clearEngineHandlers();

  onPeerDiscovered((peer) => {
    ctx.peerAddresses.set(peer.id, { ip: peer.ip, port: peer.port });
    ctx.sendToRenderer('sync:peer-discovered', {
      ...peer,
      paired: getPairedPeers().some(pp => pp.peerId === peer.id),
    });

    const pairedPeer = getPairedPeers().find(pp => pp.peerId === peer.id);
    if (pairedPeer && !ctx.getIsSyncing()) {
      ctx.setState('idle');
      performSync(pairedPeer, ctx).catch(err => {
        log.warn('Auto sync hiba:', err);
      });
    }
  });

  onPeerLost((peer) => {
    ctx.peerAddresses.delete(peer.id);
    ctx.sendToRenderer('sync:peer-lost', peer);

    if (ctx.peerAddresses.size === 0 && ctx.getState() !== 'disabled') {
      ctx.setState('searching');
    }
  });

  onProgress((progress) => {
    ctx.sendToRenderer('sync:progress', progress);
  });

  onError((error) => {
    ctx.sendToRenderer('sync:error', { message: error });
  });

  onFileChanged(async (changedFiles) => {
    const peers = getPairedPeers();
    for (const peer of peers) {
      const addr = ctx.peerAddresses.get(peer.peerId);
      if (!addr) continue;

      try {
        await sendNotifyToPeer(addr.ip, addr.port, peer.peerId, peer.psk, changedFiles);
      } catch (err) {
        log.warn(`Peer értesítés hiba (${peer.deviceName}):`, err);
      }
    }
  });
}

// ============ Párosítási HTTP kérés ============

export async function sendPairRequest(
  peer: DiscoveredPeer,
  code: string,
): Promise<{ ok: boolean; deviceName?: string; deviceId?: string; error?: string }> {
  const body = JSON.stringify({
    peerId: getOrCreateDeviceId(),
    deviceName: hostname(),
    code,
  });

  return new Promise((resolve) => {
    const req = http.request({
      hostname: peer.ip,
      port: peer.port,
      path: '/sync/pair',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            ok: result.ok,
            deviceName: result.deviceName,
            deviceId: result.deviceId,
          });
        } catch {
          resolve({ ok: false, error: 'Érvénytelen válasz' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Időtúllépés' });
    });

    req.write(body);
    req.end();
  });
}
