import { Injectable, OnDestroy, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, interval, filter, switchMap, from, catchError, of, firstValueFrom } from 'rxjs';
import { ElectronService, QueuedRequest } from './electron.service';
import { ToastService } from './toast.service';

/**
 * Cache kulcsok konstansai
 */
export const CACHE_KEYS = {
  USER_PROFILE: 'userProfile',
  PROJECT_LIST: 'projectList',
  RECENT_ORDERS: 'recentOrders',
} as const;

/**
 * Cache TTL (Time To Live) konstansok milliszekundumban
 */
export const CACHE_TTL = {
  USER_PROFILE: 24 * 60 * 60 * 1000, // 24 ora
  PROJECT_LIST: 30 * 60 * 1000,      // 30 perc
  RECENT_ORDERS: 15 * 60 * 1000,     // 15 perc
} as const;

/**
 * Szinkronizalasi statusz
 */
export interface SyncStatus {
  pendingRequests: number;
  lastSync: Date | null;
  isSyncing: boolean;
}

/**
 * OfflineService - Offline mod es local cache kezeles
 *
 * Funkcionalitas:
 * - Online/offline allapot figyeles
 * - Automatikus ujracsatlakozas detektalasa
 * - Request queue offline modban
 * - Conflict resolution (last-write-wins)
 * - Cached adatok kezelese
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineService implements OnDestroy {
  private electronService = inject(ElectronService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  // Signals
  private _isOnline = signal<boolean>(true);
  private _isSyncing = signal<boolean>(false);
  private _pendingRequests = signal<number>(0);
  private _lastSync = signal<Date | null>(null);

  // Public computed signals
  readonly isOnline = this._isOnline.asReadonly();
  readonly isOffline = computed(() => !this._isOnline());
  readonly isSyncing = this._isSyncing.asReadonly();
  readonly pendingRequests = this._pendingRequests.asReadonly();
  readonly lastSync = this._lastSync.asReadonly();

  readonly syncStatus = computed<SyncStatus>(() => ({
    pendingRequests: this._pendingRequests(),
    lastSync: this._lastSync(),
    isSyncing: this._isSyncing(),
  }));

  private subscriptions: Subscription[] = [];
  private syncInterval: Subscription | null = null;

  constructor() {
    this.init();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.syncInterval?.unsubscribe();
  }

  private async init(): Promise<void> {
    // Kezdeti online allapot beallitasa
    this._isOnline.set(this.electronService.isOnline);

    // Feliratkozas az online allapot valtozasaira
    const onlineSub = this.electronService.onlineStatusChanges.subscribe(isOnline => {
      const wasOffline = !this._isOnline();
      this._isOnline.set(isOnline);

      if (wasOffline && isOnline) {
        // Visszatert online - szinkronizalas inditasa
        this.onReconnect();
      } else if (!isOnline) {
        this.toast.warning('Offline mod', 'A valtozasok szinkronizalodnak, ha ujra online leszel.');
      }
    });
    this.subscriptions.push(onlineSub);

    // Pending requests szam betoltese
    await this.updatePendingRequestsCount();

    // Utolso sync idopont betoltese
    const lastSyncTimestamp = await this.electronService.getLastSync();
    if (lastSyncTimestamp) {
      this._lastSync.set(new Date(lastSyncTimestamp));
    }

    // Periodikus sync kiserlet (minden 30 masodpercben, ha online)
    this.syncInterval = interval(30000).pipe(
      filter(() => this._isOnline() && this._pendingRequests() > 0)
    ).subscribe(() => {
      this.processQueue();
    });
  }

  /**
   * Visszateres online allapotba - queue feldolgozasa
   */
  private async onReconnect(): Promise<void> {
    this.toast.success('Ujra online', 'Valtozasok szinkronizalasa...');
    await this.processQueue();
  }

  /**
   * Request hozzaadasa a queue-hoz (offline modban)
   */
  async queueRequest(request: {
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    body: unknown;
    headers?: Record<string, string>;
  }): Promise<string | null> {
    const requestId = await this.electronService.queueRequest(request);
    await this.updatePendingRequestsCount();
    return requestId;
  }

  /**
   * Queue feldolgozasa - elkuldeni a varakozo requesteket
   * Last-write-wins conflict resolution strategia
   */
  async processQueue(): Promise<void> {
    if (this._isSyncing() || !this._isOnline()) {
      return;
    }

    this._isSyncing.set(true);

    try {
      const requests = await this.electronService.getQueuedRequests();

      if (requests.length === 0) {
        this._isSyncing.set(false);
        return;
      }

      // Rendezd idobelyeg szerint (legkorabbi eloszor)
      const sortedRequests = [...requests].sort((a, b) => a.timestamp - b.timestamp);

      // Conflict resolution: ugyanarra az URL-re erkezo requestek kozul csak a legujabbat kuldd
      const deduplicatedRequests = this.deduplicateRequests(sortedRequests);

      let successCount = 0;
      let failCount = 0;

      for (const request of deduplicatedRequests) {
        try {
          await this.executeRequest(request);
          await this.electronService.removeQueuedRequest(request.id);
          successCount++;
        } catch (error) {
          console.error('Failed to process queued request:', error);
          failCount++;

          // Ha 401/403, akkor ne probalkozz tovabbi requestekkel
          if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
            break;
          }
        }
      }

      await this.updatePendingRequestsCount();
      await this.electronService.setLastSync(Date.now());
      this._lastSync.set(new Date());

      if (successCount > 0) {
        this.toast.success('Szinkronizalas kesz', `${successCount} valtozas sikeresen szinkronizalva.`);
      }
      if (failCount > 0) {
        this.toast.error('Szinkronizalas sikertelen', `${failCount} valtozas szinkronizalasa sikertelen.`);
      }
    } finally {
      this._isSyncing.set(false);
    }
  }

  /**
   * Deduplikalas - ugyanarra az URL-re erkezo requestek kozul a legujabbat tartsd meg
   * Ez a "last-write-wins" strategia
   */
  private deduplicateRequests(requests: QueuedRequest[]): QueuedRequest[] {
    const urlMap = new Map<string, QueuedRequest>();

    for (const request of requests) {
      const key = `${request.method}:${request.url}`;
      const existing = urlMap.get(key);

      // Ha nincs meg ilyen, vagy ez ujabb, akkor mentsd
      if (!existing || request.timestamp > existing.timestamp) {
        urlMap.set(key, request);
      }
    }

    return Array.from(urlMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Request vegrehajtas
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    const options: {
      body?: unknown;
      headers?: Record<string, string>;
    } = {};

    if (request.body) {
      options.body = request.body;
    }
    if (request.headers) {
      options.headers = request.headers;
    }

    const result = this.http.request(request.method, request.url, options).pipe(
      catchError(error => {
        throw error;
      })
    );

    await firstValueFrom(result);
  }

  /**
   * Pending requests szam frissitese
   */
  private async updatePendingRequestsCount(): Promise<void> {
    const requests = await this.electronService.getQueuedRequests();
    this._pendingRequests.set(requests.length);
  }

  /**
   * Queue uritese
   */
  async clearQueue(): Promise<void> {
    await this.electronService.clearRequestQueue();
    await this.updatePendingRequestsCount();
  }

  // ============ Cache API Wrapper ============

  /**
   * Adat cache-elese
   */
  async cache<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.electronService.cacheSet(key, value, ttl);
  }

  /**
   * Cached adat lekerdezese
   */
  async getCached<T>(key: string): Promise<T | null> {
    return this.electronService.cacheGet<T>(key);
  }

  /**
   * Cache torlese
   */
  async clearCache(key?: string): Promise<void> {
    if (key) {
      await this.electronService.cacheDelete(key);
    } else {
      await this.electronService.cacheClear();
    }
  }

  // ============ Specifikus cache metodusok ============

  /**
   * Felhasznaloi profil cache-elese
   */
  async cacheUserProfile(profile: Record<string, unknown>): Promise<void> {
    await this.cache(CACHE_KEYS.USER_PROFILE, profile, CACHE_TTL.USER_PROFILE);
  }

  /**
   * Cached felhasznaloi profil lekerdezese
   */
  async getCachedUserProfile(): Promise<Record<string, unknown> | null> {
    return this.getCached(CACHE_KEYS.USER_PROFILE);
  }

  /**
   * Projekt lista cache-elese
   */
  async cacheProjectList(projects: Record<string, unknown>[]): Promise<void> {
    await this.cache(CACHE_KEYS.PROJECT_LIST, projects, CACHE_TTL.PROJECT_LIST);
  }

  /**
   * Cached projekt lista lekerdezese
   */
  async getCachedProjectList(): Promise<Record<string, unknown>[] | null> {
    return this.getCached(CACHE_KEYS.PROJECT_LIST);
  }

  /**
   * Megrendelesek cache-elese
   */
  async cacheRecentOrders(orders: Record<string, unknown>[]): Promise<void> {
    await this.cache(CACHE_KEYS.RECENT_ORDERS, orders, CACHE_TTL.RECENT_ORDERS);
  }

  /**
   * Cached megrendelesek lekerdezese
   */
  async getCachedRecentOrders(): Promise<Record<string, unknown>[] | null> {
    return this.getCached(CACHE_KEYS.RECENT_ORDERS);
  }
}
