/**
 * sync-auth.ts — LAN szinkronizálás autentikáció
 *
 * 6 jegyű párosítási kód → PBKDF2 → PSK
 * HMAC-SHA256 request autentikáció + replay védelem
 */

import * as crypto from 'crypto';
import Store from 'electron-store';
import log from 'electron-log/main';

// ============ Konstansok ============

const PAIRING_CODE_LENGTH = 6;
const PAIRING_CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 perc
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 32; // 256-bit
const PBKDF2_DIGEST = 'sha256';
const REPLAY_WINDOW_MS = 30_000; // 30 másodperc

// ============ Típusok ============

export interface PairedPeer {
  peerId: string;
  deviceName: string;
  psk: string; // hex-encoded PSK
  pairedAt: number;
}

interface PairingCode {
  code: string;
  createdAt: number;
}

interface SyncStoreSchema {
  syncEnabled: boolean;
  pairedPeers: PairedPeer[];
  syncIgnorePatterns: string[];
  deviceId: string;
}

// ============ Store ============

const syncStore = new Store<SyncStoreSchema>({
  name: 'photostack-sync',
  defaults: {
    syncEnabled: false,
    pairedPeers: [],
    syncIgnorePatterns: ['.DS_Store', 'Thumbs.db', '*.tmp', '*.lock', '._*'],
    deviceId: '',
  },
});

export function getOrCreateDeviceId(): string {
  let deviceId = syncStore.get('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    syncStore.set('deviceId', deviceId);
  }
  return deviceId;
}

export function getSyncStore(): Store<SyncStoreSchema> {
  return syncStore;
}

// ============ Párosítási kód ============

let activePairingCode: PairingCode | null = null;

export function generatePairingCode(): string {
  const code = Array.from({ length: PAIRING_CODE_LENGTH }, () =>
    Math.floor(Math.random() * 10).toString()
  ).join('');
  activePairingCode = { code, createdAt: Date.now() };
  log.info('Párosítási kód generálva (érvényesség: 5 perc)');
  return code;
}

export function validatePairingCode(code: string): boolean {
  if (!activePairingCode) return false;
  if (Date.now() - activePairingCode.createdAt > PAIRING_CODE_EXPIRY_MS) {
    activePairingCode = null;
    return false;
  }
  const isValid = activePairingCode.code === code;
  if (isValid) {
    activePairingCode = null; // Egyszeri használat
  }
  return isValid;
}

export function getActivePairingCode(): string | null {
  if (!activePairingCode) return null;
  if (Date.now() - activePairingCode.createdAt > PAIRING_CODE_EXPIRY_MS) {
    activePairingCode = null;
    return null;
  }
  return activePairingCode.code;
}

// ============ PSK deriválás ============

export function derivePsk(code: string, salt: string): string {
  const key = crypto.pbkdf2Sync(
    code,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEY_LENGTH,
    PBKDF2_DIGEST,
  );
  return key.toString('hex');
}

// ============ HMAC autentikáció ============

export function generateHmac(psk: string, method: string, path: string, body: string = ''): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}:${method}:${path}:${body}`;
  const hmac = crypto.createHmac('sha256', Buffer.from(psk, 'hex'))
    .update(message)
    .digest('hex');
  return `${timestamp}:${hmac}`;
}

export function verifyHmac(
  psk: string,
  authHeader: string,
  method: string,
  path: string,
  body: string = '',
): boolean {
  const parts = authHeader.split(':');
  if (parts.length !== 2) return false;

  const [timestampStr, receivedHmac] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Replay védelem
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > REPLAY_WINDOW_MS / 1000) {
    log.warn('HMAC replay védelem: timestamp kívül esik az ablakon');
    return false;
  }

  const message = `${timestampStr}:${method}:${path}:${body}`;
  const expectedHmac = crypto.createHmac('sha256', Buffer.from(psk, 'hex'))
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(receivedHmac, 'hex'),
    Buffer.from(expectedHmac, 'hex'),
  );
}

// ============ Peer kezelés ============

export function addPairedPeer(peer: PairedPeer): void {
  const peers = syncStore.get('pairedPeers');
  const existing = peers.findIndex(p => p.peerId === peer.peerId);
  if (existing >= 0) {
    peers[existing] = peer;
  } else {
    peers.push(peer);
  }
  syncStore.set('pairedPeers', peers);
  log.info(`Peer párosítva: ${peer.deviceName} (${peer.peerId})`);
}

export function removePairedPeer(peerId: string): void {
  const peers = syncStore.get('pairedPeers').filter(p => p.peerId !== peerId);
  syncStore.set('pairedPeers', peers);
  log.info(`Peer eltávolítva: ${peerId}`);
}

export function getPairedPeers(): PairedPeer[] {
  return syncStore.get('pairedPeers');
}

export function findPeerPsk(peerId: string): string | null {
  const peer = syncStore.get('pairedPeers').find(p => p.peerId === peerId);
  return peer?.psk ?? null;
}
