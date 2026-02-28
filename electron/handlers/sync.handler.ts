/**
 * sync.handler.ts — LAN szinkronizálás IPC handlerek
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log/main';
import * as fs from 'fs';
import { hostname } from 'os';
import {
  generatePairingCode,
  validatePairingCode,
  derivePsk,
  addPairedPeer,
  removePairedPeer,
  getPairedPeers,
  getPairedPeersPublic,
  getOrCreateDeviceId,
  getSyncStore,
} from '../utils/sync-auth';
import {
  startDiscovery,
  stopDiscovery,
  getDiscoveredPeers,
  clearPeerHandlers,
} from '../utils/sync-discovery';
import {
  startSyncEngine,
  stopSyncEngine,
  getServerPort,
  getWorkspacePath,
  clearEngineHandlers,
  type SyncState,
} from '../utils/sync-engine';
import {
  performSync,
  performFullSync,
  sendPairRequest,
  setupEventHandlers,
  type SyncHandlerContext,
} from './sync-handler-sync';

let mainWindow: BrowserWindow | null = null;
let currentState: SyncState = 'disabled';
let isSyncing = false;
let handlersRegistered = false;
const peerAddresses = new Map<string, { ip: string; port: number }>();

function sendToRenderer(channel: string, data: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

function setState(state: SyncState): void {
  currentState = state;
  sendToRenderer('sync:status-changed', { state });
}

function getContext(): SyncHandlerContext {
  return {
    sendToRenderer,
    setState,
    getState: () => currentState,
    peerAddresses,
    getIsSyncing: () => isSyncing,
    setIsSyncing: (v) => { isSyncing = v; },
  };
}

function getSyncStatus() {
  const pairedIds = getPairedPeers().map(p => p.peerId);
  return {
    state: currentState,
    enabled: getSyncStore().get('syncEnabled'),
    deviceId: getOrCreateDeviceId(),
    deviceName: hostname(),
    serverPort: getServerPort(),
    workspacePath: getWorkspacePath(),
    pairedPeers: getPairedPeersPublic(),
    discoveredPeers: getDiscoveredPeers().map(p => ({
      ...p,
      paired: pairedIds.includes(p.id),
    })),
  };
}

export function registerSyncHandlers(win?: BrowserWindow): void {
  if (win) mainWindow = win;

  if (handlersRegistered) {
    log.warn('Sync handlerek már regisztrálva vannak');
    return;
  }
  handlersRegistered = true;

  const ctx = getContext();

  ipcMain.handle('sync:get-status', async () => {
    try {
      return { success: true, ...getSyncStatus() };
    } catch (err) {
      log.error('sync:get-status hiba:', err);
      return { success: false, error: 'Állapot lekérdezés sikertelen' };
    }
  });

  ipcMain.handle('sync:enable', async (_event, params: {
    userId: string;
    workspacePath: string;
  }) => {
    try {
      if (!params.userId || !params.workspacePath) {
        return { success: false, error: 'Hiányzó paraméterek (userId, workspacePath)' };
      }
      if (!fs.existsSync(params.workspacePath)) {
        return { success: false, error: 'A workspace mappa nem létezik' };
      }

      const port = await startSyncEngine(params.workspacePath);
      startDiscovery(params.userId, port);
      setupEventHandlers(ctx);

      getSyncStore().set('syncEnabled', true);
      setState('searching');

      log.info(`Sync bekapcsolva: userId=${params.userId}, port=${port}`);
      return { success: true, port };
    } catch (err) {
      log.error('sync:enable hiba:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Bekapcsolás sikertelen' };
    }
  });

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

  ipcMain.handle('sync:pair', async (_event, code?: string) => {
    try {
      if (code) {
        return { success: true, mode: 'accept', code };
      }
      const newCode = generatePairingCode();
      return { success: true, mode: 'generate', code: newCode };
    } catch (err) {
      log.error('sync:pair hiba:', err);
      return { success: false, error: 'Párosítás sikertelen' };
    }
  });

  ipcMain.handle('sync:pair-with-peer', async (_event, params: {
    peerId: string;
    code: string;
  }) => {
    try {
      const peer = getDiscoveredPeers().find(p => p.id === params.peerId);
      if (!peer) {
        return { success: false, error: 'Peer nem található' };
      }

      const pairResult = await sendPairRequest(peer, params.code);
      if (!pairResult.ok) {
        return { success: false, error: pairResult.error || 'Párosítás elutasítva' };
      }

      const remotePeerId = pairResult.deviceId || params.peerId;
      const salt = [getOrCreateDeviceId(), remotePeerId].sort().join(':');
      const psk = derivePsk(params.code, salt);

      addPairedPeer({
        peerId: remotePeerId,
        deviceName: pairResult.deviceName || peer.name,
        psk,
        pairedAt: Date.now(),
      });

      const pairedPeer = getPairedPeers().find(p => p.peerId === remotePeerId);
      if (pairedPeer) {
        performSync(pairedPeer, ctx).catch(err => {
          log.warn('Első sync hiba:', err);
        });
      }

      return { success: true };
    } catch (err) {
      log.error('sync:pair-with-peer hiba:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Párosítás sikertelen' };
    }
  });

  ipcMain.handle('sync:accept-pair', async (_event, params: {
    peerId: string;
    code: string;
  }) => {
    try {
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

  ipcMain.handle('sync:get-peers', async () => {
    try {
      const discovered = getDiscoveredPeers();
      const pairedIds = getPairedPeers().map(p => p.peerId);
      return {
        success: true,
        discovered: discovered.map(p => ({
          ...p,
          paired: pairedIds.includes(p.id),
        })),
        paired: getPairedPeersPublic(),
      };
    } catch (err) {
      log.error('sync:get-peers hiba:', err);
      return { success: false, error: 'Peer lista lekérdezés sikertelen' };
    }
  });

  ipcMain.handle('sync:force-sync', async () => {
    try {
      if (isSyncing) {
        return { success: false, error: 'Szinkronizálás már folyamatban' };
      }
      await performFullSync(ctx);
      return { success: true };
    } catch (err) {
      log.error('sync:force-sync hiba:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Szinkronizálás sikertelen' };
    }
  });

  ipcMain.handle('sync:get-settings', async () => {
    try {
      return { success: true, settings: { enabled: getSyncStore().get('syncEnabled'), ignorePatterns: getSyncStore().get('syncIgnorePatterns'), autoSync: true } };
    } catch (err) {
      return { success: false, error: 'Beállítások lekérdezés sikertelen' };
    }
  });

  ipcMain.handle('sync:set-settings', async (_event, settings: { ignorePatterns?: string[] }) => {
    try {
      if (settings.ignorePatterns) getSyncStore().set('syncIgnorePatterns', settings.ignorePatterns);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Beállítások mentése sikertelen' };
    }
  });
}
