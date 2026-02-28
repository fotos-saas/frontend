/**
 * sync.handler.ts — LAN szinkronizálás IPC handlerek
 *
 * Összefogja a discovery, auth és engine modulokat,
 * és IPC bridge-et biztosít az Angular renderer felé.
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log/main';
import {
  generatePairingCode,
  validatePairingCode,
  getActivePairingCode,
  derivePsk,
  addPairedPeer,
  removePairedPeer,
  getPairedPeers,
  getOrCreateDeviceId,
  getSyncStore,
  type PairedPeer,
} from '../utils/sync-auth';
import {
  startDiscovery,
  stopDiscovery,
  getDiscoveredPeers,
  onPeerDiscovered,
  onPeerLost,
  clearPeerHandlers,
  type DiscoveredPeer,
} from '../utils/sync-discovery';
import {
  startSyncEngine,
  stopSyncEngine,
  getServerPort,
  getWorkspacePath,
  fetchManifestFromPeer,
  downloadFileFromPeer,
  sendNotifyToPeer,
  getManifest,
  onProgress,
  onError,
  onFileChanged,
  clearEngineHandlers,
  emitProgress,
  emitError,
  type ManifestEntry,
  type SyncState,
} from '../utils/sync-engine';
import { hostname } from 'os';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';

// ============ State ============

let mainWindow: BrowserWindow | null = null;
let currentState: SyncState = 'disabled';
let currentUserId: string = '';
let isSyncing = false;

// Peer IP:port mapping (mDNS-ből)
const peerAddresses = new Map<string, { ip: string; port: number }>();

// ============ Helpers ============

function sendToRenderer(channel: string, data: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

function setState(state: SyncState): void {
  currentState = state;
  sendToRenderer('sync:status-changed', { state });
}

function getSyncStatus() {
  return {
    state: currentState,
    enabled: getSyncStore().get('syncEnabled'),
    deviceId: getOrCreateDeviceId(),
    deviceName: hostname(),
    serverPort: getServerPort(),
    workspacePath: getWorkspacePath(),
    pairedPeers: getPairedPeers(),
    discoveredPeers: getDiscoveredPeers().map(p => ({
      ...p,
      paired: getPairedPeers().some(pp => pp.peerId === p.id),
    })),
  };
}

// ============ Sync logika ============

async function performSync(peer: PairedPeer): Promise<void> {
  const addr = peerAddresses.get(peer.peerId);
  if (!addr) {
    log.warn(`Peer cím nem található: ${peer.deviceName}`);
    return;
  }

  setState('syncing');
  isSyncing = true;

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

    // Remote-ban van, lokálisan nincs VAGY különböző hash → letöltés
    for (const [relPath, remoteEntry] of Object.entries(remoteManifest)) {
      const localEntry = localManifest.get(relPath);
      if (!localEntry) {
        toDownload.push(relPath);
      } else if (localEntry.quickHash !== remoteEntry.quickHash) {
        // Last-write-wins: újabb timestamp nyer
        if (remoteEntry.mtimeMs > localEntry.mtimeMs) {
          toDownload.push(relPath);
        } else if (localEntry.mtimeMs > remoteEntry.mtimeMs) {
          toUpload.push(relPath);
        }
        // Ha azonos mtime, a hash különbség ellenére sem csinálunk semmit (ritka eset)
      }
    }

    // Lokálisan van, remote-ban nincs → feltöltés (notify)
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
            sendToRenderer('sync:progress', {
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

    // 5. Saját változások jelzése a peer-nek (hogy az töltse le)
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

    setState('idle');
  } catch (err) {
    log.error('Sync hiba:', err);
    setState('error');
    emitError(err instanceof Error ? err.message : 'Szinkronizálási hiba');
    sendToRenderer('sync:error', {
      message: err instanceof Error ? err.message : 'Szinkronizálási hiba',
    });
  } finally {
    isSyncing = false;
  }
}

async function performFullSync(): Promise<void> {
  const peers = getPairedPeers();
  for (const peer of peers) {
    await performSync(peer);
  }
}

// ============ IPC Handler regisztráció ============

export function registerSyncHandlers(win?: BrowserWindow): void {
  if (win) mainWindow = win;

  // --- Állapot lekérdezés ---
  ipcMain.handle('sync:get-status', async () => {
    try {
      return { success: true, ...getSyncStatus() };
    } catch (err) {
      log.error('sync:get-status hiba:', err);
      return { success: false, error: 'Állapot lekérdezés sikertelen' };
    }
  });

  // --- Bekapcsolás ---
  ipcMain.handle('sync:enable', async (_event, params: {
    userId: string;
    workspacePath: string;
  }) => {
    try {
      if (!params.userId || !params.workspacePath) {
        return { success: false, error: 'Hiányzó paraméterek (userId, workspacePath)' };
      }

      // Workspace mappa ellenőrzése
      if (!fs.existsSync(params.workspacePath)) {
        return { success: false, error: 'A workspace mappa nem létezik' };
      }

      currentUserId = params.userId;

      // Engine indítása
      const port = await startSyncEngine(params.workspacePath);

      // Discovery indítása
      startDiscovery(params.userId, port);

      // Event handlerek beállítása
      setupEventHandlers();

      getSyncStore().set('syncEnabled', true);
      setState('searching');

      log.info(`Sync bekapcsolva: userId=${params.userId}, port=${port}`);
      return { success: true, port };
    } catch (err) {
      log.error('sync:enable hiba:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Bekapcsolás sikertelen' };
    }
  });

  // --- Kikapcsolás ---
  ipcMain.handle('sync:disable', async () => {
    try {
      stopDiscovery();
      stopSyncEngine();
      clearPeerHandlers();
      clearEngineHandlers();
      peerAddresses.clear();

      getSyncStore().set('syncEnabled', false);
      setState('disabled');

      log.info('Sync kikapcsolva');
      return { success: true };
    } catch (err) {
      log.error('sync:disable hiba:', err);
      return { success: false, error: 'Kikapcsolás sikertelen' };
    }
  });

  // --- Párosítási kód generálás ---
  ipcMain.handle('sync:pair', async (_event, code?: string) => {
    try {
      if (code) {
        // Kód elfogadása (távoli gép kódja)
        // A párosítás a discoveryből ismert peer-rel történik
        return { success: true, mode: 'accept', code };
      } else {
        // Új kód generálása
        const newCode = generatePairingCode();
        return { success: true, mode: 'generate', code: newCode };
      }
    } catch (err) {
      log.error('sync:pair hiba:', err);
      return { success: false, error: 'Párosítás sikertelen' };
    }
  });

  // --- Párosítás peer-rel ---
  ipcMain.handle('sync:pair-with-peer', async (_event, params: {
    peerId: string;
    code: string;
  }) => {
    try {
      const peer = getDiscoveredPeers().find(p => p.id === params.peerId);
      if (!peer) {
        return { success: false, error: 'Peer nem található' };
      }

      // PSK deriválás a kódból
      const salt = [getOrCreateDeviceId(), params.peerId].sort().join(':');
      const psk = derivePsk(params.code, salt);

      // Peer-nek küldeni a párosítási kérelmet
      const pairResult = await sendPairRequest(peer, psk);
      if (!pairResult.ok) {
        return { success: false, error: pairResult.error || 'Párosítás elutasítva' };
      }

      // PSK mentése
      addPairedPeer({
        peerId: params.peerId,
        deviceName: pairResult.deviceName || peer.name,
        psk,
        pairedAt: Date.now(),
      });

      // Automatikus első sync
      const pairedPeer = getPairedPeers().find(p => p.peerId === params.peerId);
      if (pairedPeer) {
        performSync(pairedPeer).catch(err => {
          log.warn('Első sync hiba:', err);
        });
      }

      return { success: true };
    } catch (err) {
      log.error('sync:pair-with-peer hiba:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Párosítás sikertelen' };
    }
  });

  // --- Párosítás elfogadása (a másik gép kezdeményezte) ---
  ipcMain.handle('sync:accept-pair', async (_event, params: {
    peerId: string;
    code: string;
  }) => {
    try {
      // Kód validálás
      if (!validatePairingCode(params.code)) {
        return { success: false, error: 'Érvénytelen vagy lejárt kód' };
      }

      const salt = [getOrCreateDeviceId(), params.peerId].sort().join(':');
      const psk = derivePsk(params.code, salt);

      const peer = getDiscoveredPeers().find(p => p.id === params.peerId);
      addPairedPeer({
        peerId: params.peerId,
        deviceName: peer?.name || 'Ismeretlen eszköz',
        psk,
        pairedAt: Date.now(),
      });

      return { success: true };
    } catch (err) {
      log.error('sync:accept-pair hiba:', err);
      return { success: false, error: 'Elfogadás sikertelen' };
    }
  });

  // --- Párosítás törlése ---
  ipcMain.handle('sync:unpair', async (_event, peerId: string) => {
    try {
      if (!peerId || typeof peerId !== 'string') {
        return { success: false, error: 'Érvénytelen peer ID' };
      }
      removePairedPeer(peerId);
      peerAddresses.delete(peerId);
      return { success: true };
    } catch (err) {
      log.error('sync:unpair hiba:', err);
      return { success: false, error: 'Párosítás törlése sikertelen' };
    }
  });

  // --- Peer lista ---
  ipcMain.handle('sync:get-peers', async () => {
    try {
      const discovered = getDiscoveredPeers();
      const paired = getPairedPeers();
      return {
        success: true,
        discovered: discovered.map(p => ({
          ...p,
          paired: paired.some(pp => pp.peerId === p.id),
        })),
        paired,
      };
    } catch (err) {
      log.error('sync:get-peers hiba:', err);
      return { success: false, error: 'Peer lista lekérdezés sikertelen' };
    }
  });

  // --- Kézi szinkronizálás ---
  ipcMain.handle('sync:force-sync', async () => {
    try {
      if (isSyncing) {
        return { success: false, error: 'Szinkronizálás már folyamatban' };
      }
      await performFullSync();
      return { success: true };
    } catch (err) {
      log.error('sync:force-sync hiba:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Szinkronizálás sikertelen' };
    }
  });

  // --- Beállítások lekérdezése ---
  ipcMain.handle('sync:get-settings', async () => {
    try {
      const store = getSyncStore();
      return {
        success: true,
        settings: {
          enabled: store.get('syncEnabled'),
          ignorePatterns: store.get('syncIgnorePatterns'),
          autoSync: true,
        },
      };
    } catch (err) {
      log.error('sync:get-settings hiba:', err);
      return { success: false, error: 'Beállítások lekérdezés sikertelen' };
    }
  });

  // --- Beállítások mentése ---
  ipcMain.handle('sync:set-settings', async (_event, settings: {
    ignorePatterns?: string[];
  }) => {
    try {
      const store = getSyncStore();
      if (settings.ignorePatterns) {
        store.set('syncIgnorePatterns', settings.ignorePatterns);
      }
      return { success: true };
    } catch (err) {
      log.error('sync:set-settings hiba:', err);
      return { success: false, error: 'Beállítások mentése sikertelen' };
    }
  });
}

// ============ Event handlerek beállítása ============

function setupEventHandlers(): void {
  clearPeerHandlers();
  clearEngineHandlers();

  // Discovery események
  onPeerDiscovered((peer) => {
    peerAddresses.set(peer.id, { ip: peer.ip, port: peer.port });
    sendToRenderer('sync:peer-discovered', {
      ...peer,
      paired: getPairedPeers().some(pp => pp.peerId === peer.id),
    });

    // Ha már párosított peer, automatikus sync
    const pairedPeer = getPairedPeers().find(pp => pp.peerId === peer.id);
    if (pairedPeer && !isSyncing) {
      setState('idle');
      performSync(pairedPeer).catch(err => {
        log.warn('Auto sync hiba:', err);
      });
    }
  });

  onPeerLost((peer) => {
    peerAddresses.delete(peer.id);
    sendToRenderer('sync:peer-lost', peer);

    // Ha nincs több aktív peer, searching állapotba
    if (peerAddresses.size === 0 && currentState !== 'disabled') {
      setState('searching');
    }
  });

  // Engine események
  onProgress((progress) => {
    sendToRenderer('sync:progress', progress);
  });

  onError((error) => {
    sendToRenderer('sync:error', { message: error });
  });

  // Fájl változás → peer-ek értesítése
  onFileChanged(async (changedFiles) => {
    const peers = getPairedPeers();
    for (const peer of peers) {
      const addr = peerAddresses.get(peer.peerId);
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

async function sendPairRequest(
  peer: DiscoveredPeer,
  psk: string,
): Promise<{ ok: boolean; deviceName?: string; error?: string }> {
  const body = JSON.stringify({
    peerId: getOrCreateDeviceId(),
    deviceName: hostname(),
    psk,
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
        'X-Sync-Auth': 'pair-request',
        'X-Sync-Peer-Id': getOrCreateDeviceId(),
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ ok: result.ok, deviceName: result.deviceName });
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
