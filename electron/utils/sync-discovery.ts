/**
 * sync-discovery.ts — mDNS/Bonjour felderítés LAN szinkronizáláshoz
 *
 * Service típus: _photostack-sync._tcp
 * Csak azonos userId-jű peer-ek jelennek meg
 */

import Bonjour, { type Service, type Browser } from 'bonjour-service';
import log from 'electron-log/main';
import { getOrCreateDeviceId } from './sync-auth';
import { hostname } from 'os';

// ============ Típusok ============

export interface DiscoveredPeer {
  id: string;
  name: string;
  host: string;
  ip: string;
  port: number;
  userId: string;
  version: string;
}

export type PeerEventHandler = (peer: DiscoveredPeer) => void;

// ============ Konstansok ============

const SERVICE_TYPE = 'photostack-sync';
const SERVICE_NAME_PREFIX = 'PhotoStack-';

// ============ Discovery Manager ============

let bonjourInstance: InstanceType<typeof Bonjour> | null = null;
let publishedService: Service | null = null;
let browser: Browser | null = null;
let currentUserId: string = '';

const discoveredPeers = new Map<string, DiscoveredPeer>();
const onPeerDiscoveredHandlers: PeerEventHandler[] = [];
const onPeerLostHandlers: PeerEventHandler[] = [];

function getDeviceName(): string {
  return hostname() || 'PhotoStack eszköz';
}

function parsePeer(service: Service): DiscoveredPeer | null {
  const txt = service.txt as Record<string, string> | undefined;
  if (!txt) return null;

  const deviceId = txt['deviceId'] || txt['deviceid'];
  const userId = txt['userId'] || txt['userid'];
  const version = txt['version'] || '1';

  if (!deviceId || !userId) return null;
  if (deviceId === getOrCreateDeviceId()) return null; // Sajt magunk kiszűrése
  if (userId !== currentUserId) return null; // Más user kiszűrése

  // IP cím: referer = első IPv4 cím
  const ip = service.addresses?.find(a => a.includes('.')) || service.host || '';

  return {
    id: deviceId,
    name: service.name.replace(SERVICE_NAME_PREFIX, '') || service.host || 'Ismeretlen',
    host: service.host || '',
    ip,
    port: service.port,
    userId,
    version,
  };
}

// ============ Publikus API ============

export function startDiscovery(userId: string, port: number): void {
  currentUserId = userId;
  const deviceId = getOrCreateDeviceId();
  const deviceName = getDeviceName();

  bonjourInstance = new Bonjour();

  // Szolgáltatás hirdetése
  publishedService = bonjourInstance.publish({
    name: `${SERVICE_NAME_PREFIX}${deviceName}`,
    type: SERVICE_TYPE,
    port,
    txt: {
      deviceId,
      userId,
      version: '1',
    },
  });
  log.info(`mDNS hirdetés elindítva: ${SERVICE_TYPE}, port ${port}`);

  // Peer-ek keresése
  browser = bonjourInstance.find({ type: SERVICE_TYPE }, (service) => {
    const peer = parsePeer(service);
    if (!peer) return;

    if (!discoveredPeers.has(peer.id)) {
      discoveredPeers.set(peer.id, peer);
      log.info(`Peer felfedezve: ${peer.name} (${peer.ip}:${peer.port})`);
      onPeerDiscoveredHandlers.forEach(h => h(peer));
    }
  });

  // Service down figyelés
  browser.on('down', (service: Service) => {
    const txt = service.txt as Record<string, string> | undefined;
    const deviceId = txt?.['deviceId'] || txt?.['deviceid'];
    if (!deviceId) return;

    const peer = discoveredPeers.get(deviceId);
    if (peer) {
      discoveredPeers.delete(deviceId);
      log.info(`Peer eltűnt: ${peer.name}`);
      onPeerLostHandlers.forEach(h => h(peer));
    }
  });
}

export function stopDiscovery(): void {
  if (browser) {
    browser.stop();
    browser = null;
  }
  if (publishedService) {
    publishedService.stop?.();
    publishedService = null;
  }
  if (bonjourInstance) {
    bonjourInstance.destroy();
    bonjourInstance = null;
  }
  discoveredPeers.clear();
  log.info('mDNS felderítés leállítva');
}

export function getDiscoveredPeers(): DiscoveredPeer[] {
  return Array.from(discoveredPeers.values());
}

export function onPeerDiscovered(handler: PeerEventHandler): void {
  onPeerDiscoveredHandlers.push(handler);
}

export function onPeerLost(handler: PeerEventHandler): void {
  onPeerLostHandlers.push(handler);
}

export function clearPeerHandlers(): void {
  onPeerDiscoveredHandlers.length = 0;
  onPeerLostHandlers.length = 0;
}

export function updatePublishedPort(port: number): void {
  if (!bonjourInstance || !currentUserId) return;

  // Régi szolgáltatás leállítása, új indítása az új porttal
  if (publishedService) {
    publishedService.stop?.();
  }

  const deviceId = getOrCreateDeviceId();
  const deviceName = getDeviceName();

  publishedService = bonjourInstance.publish({
    name: `${SERVICE_NAME_PREFIX}${deviceName}`,
    type: SERVICE_TYPE,
    port,
    txt: {
      deviceId,
      userId: currentUserId,
      version: '1',
    },
  });
  log.info(`mDNS hirdetés frissítve: port ${port}`);
}
