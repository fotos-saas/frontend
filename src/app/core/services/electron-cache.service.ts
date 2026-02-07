import { Injectable } from '@angular/core';

/** Varakozo request interfesz (offline queue) */
export interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body: unknown;
  timestamp: number;
  headers?: Record<string, string>;
}

/**
 * ElectronCacheService - Cache es offline request queue kezeles
 *
 * Funkcionalitas:
 * - Cache API (Electron: IPC, browser: localStorage fallback)
 * - Request queue offline modhoz
 * - Sync timestamp kezeles
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronCacheService {
  private get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  // ============ Cache API ============

  /** Cache ertek lekerdezese */
  async cacheGet<T = unknown>(key: string): Promise<T | null> {
    if (!this.isElectron) {
      try {
        const item = localStorage.getItem(`photostack_cache_${key}`);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.expiry && parsed.expiry < Date.now()) {
            localStorage.removeItem(`photostack_cache_${key}`);
            return null;
          }
          return parsed.value ?? parsed;
        }
      } catch {
        return null;
      }
      return null;
    }
    return window.electronAPI!.cache.get(key) as Promise<T | null>;
  }

  /** Cache ertek beallitasa (ttl: milliszekundum) */
  async cacheSet(key: string, value: unknown, ttl?: number): Promise<boolean> {
    if (!this.isElectron) {
      try {
        const item = ttl
          ? { value, expiry: Date.now() + ttl }
          : { value };
        localStorage.setItem(`photostack_cache_${key}`, JSON.stringify(item));
        return true;
      } catch {
        return false;
      }
    }
    return window.electronAPI!.cache.set(key, value, ttl);
  }

  /** Cache ertek torlese */
  async cacheDelete(key: string): Promise<boolean> {
    if (!this.isElectron) {
      localStorage.removeItem(`photostack_cache_${key}`);
      return true;
    }
    return window.electronAPI!.cache.delete(key);
  }

  /** Teljes cache uritese */
  async cacheClear(): Promise<boolean> {
    if (!this.isElectron) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('photostack_cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    }
    return window.electronAPI!.cache.clear();
  }

  // ============ Request Queue (Offline Mode) ============

  /** Request hozzaadasa az offline queue-hoz */
  async queueRequest(request: {
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    body: unknown;
    headers?: Record<string, string>;
  }): Promise<string | null> {
    if (!this.isElectron) {
      try {
        const queue = JSON.parse(localStorage.getItem('photostack_request_queue') || '[]');
        const newRequest = {
          ...request,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        queue.push(newRequest);
        localStorage.setItem('photostack_request_queue', JSON.stringify(queue));
        return newRequest.id;
      } catch {
        return null;
      }
    }
    return window.electronAPI!.requestQueue.add(request);
  }

  /** Osszes varakozo request lekerdezese */
  async getQueuedRequests(): Promise<QueuedRequest[]> {
    if (!this.isElectron) {
      try {
        return JSON.parse(localStorage.getItem('photostack_request_queue') || '[]');
      } catch {
        return [];
      }
    }
    return window.electronAPI!.requestQueue.getAll() as Promise<QueuedRequest[]>;
  }

  /** Request eltavolitasa a queue-bol */
  async removeQueuedRequest(requestId: string): Promise<boolean> {
    if (!this.isElectron) {
      try {
        const queue = JSON.parse(localStorage.getItem('photostack_request_queue') || '[]');
        const newQueue = queue.filter((req: QueuedRequest) => req.id !== requestId);
        localStorage.setItem('photostack_request_queue', JSON.stringify(newQueue));
        return true;
      } catch {
        return false;
      }
    }
    return window.electronAPI!.requestQueue.remove(requestId);
  }

  /** Request queue uritese */
  async clearRequestQueue(): Promise<boolean> {
    if (!this.isElectron) {
      localStorage.removeItem('photostack_request_queue');
      return true;
    }
    return window.electronAPI!.requestQueue.clear();
  }

  // ============ Sync Status ============

  /** Utolso szinkronizalas idopont mentese */
  async setLastSync(timestamp: number): Promise<boolean> {
    if (!this.isElectron) {
      localStorage.setItem('photostack_last_sync', String(timestamp));
      return true;
    }
    return window.electronAPI!.setLastSync(timestamp);
  }

  /** Utolso szinkronizalas idopont lekerdezese */
  async getLastSync(): Promise<number | null> {
    if (!this.isElectron) {
      const value = localStorage.getItem('photostack_last_sync');
      return value ? parseInt(value, 10) : null;
    }
    return window.electronAPI!.getLastSync();
  }
}
