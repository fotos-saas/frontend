import { ipcRenderer, IpcRendererEvent } from 'electron';

// Type for cleanup function
type CleanupFn = () => void;

/**
 * LAN Sync API: peer discovery, pairing, file synchronization, settings
 */
export function buildSyncApi() {
  return {
    sync: {
      getStatus: () =>
        ipcRenderer.invoke('sync:get-status') as Promise<{ success: boolean; state: string; enabled: boolean; deviceId: string; deviceName: string; serverPort: number; workspacePath: string; pairedPeers: unknown[]; discoveredPeers: unknown[]; error?: string }>,
      enable: (params: { userId: string; workspacePath: string }) =>
        ipcRenderer.invoke('sync:enable', params) as Promise<{ success: boolean; port?: number; error?: string }>,
      disable: () =>
        ipcRenderer.invoke('sync:disable') as Promise<{ success: boolean; error?: string }>,
      pair: (code?: string) =>
        ipcRenderer.invoke('sync:pair', code) as Promise<{ success: boolean; mode: 'generate' | 'accept'; code: string; error?: string }>,
      pairWithPeer: (params: { peerId: string; code: string }) =>
        ipcRenderer.invoke('sync:pair-with-peer', params) as Promise<{ success: boolean; error?: string }>,
      acceptPair: (params: { peerId: string; code: string }) =>
        ipcRenderer.invoke('sync:accept-pair', params) as Promise<{ success: boolean; error?: string }>,
      unpair: (peerId: string) =>
        ipcRenderer.invoke('sync:unpair', peerId) as Promise<{ success: boolean; error?: string }>,
      getPeers: () =>
        ipcRenderer.invoke('sync:get-peers') as Promise<{ success: boolean; discovered: unknown[]; paired: unknown[]; error?: string }>,
      forceSync: () =>
        ipcRenderer.invoke('sync:force-sync') as Promise<{ success: boolean; error?: string }>,
      getSettings: () =>
        ipcRenderer.invoke('sync:get-settings') as Promise<{ success: boolean; settings?: { enabled: boolean; ignorePatterns: string[]; autoSync: boolean }; error?: string }>,
      setSettings: (settings: { ignorePatterns?: string[] }) =>
        ipcRenderer.invoke('sync:set-settings', settings) as Promise<{ success: boolean; error?: string }>,
      onStatusChanged: (callback: (data: { state: string }) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, data: { state: string }) => callback(data);
        ipcRenderer.on('sync:status-changed', handler);
        return () => ipcRenderer.removeListener('sync:status-changed', handler);
      },
      onPeerDiscovered: (callback: (peer: unknown) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, peer: unknown) => callback(peer);
        ipcRenderer.on('sync:peer-discovered', handler);
        return () => ipcRenderer.removeListener('sync:peer-discovered', handler);
      },
      onPeerLost: (callback: (peer: unknown) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, peer: unknown) => callback(peer);
        ipcRenderer.on('sync:peer-lost', handler);
        return () => ipcRenderer.removeListener('sync:peer-lost', handler);
      },
      onProgress: (callback: (progress: { fileName: string; percent: number; bytesTransferred: number; totalBytes: number; overallPercent?: number }) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, progress: { fileName: string; percent: number; bytesTransferred: number; totalBytes: number; overallPercent?: number }) => callback(progress);
        ipcRenderer.on('sync:progress', handler);
        return () => ipcRenderer.removeListener('sync:progress', handler);
      },
      onError: (callback: (data: { message: string }) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, data: { message: string }) => callback(data);
        ipcRenderer.on('sync:error', handler);
        return () => ipcRenderer.removeListener('sync:error', handler);
      },
    },
  };
}
