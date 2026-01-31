# Osztály Hírek - Caching Stratégia

> Verzió: 1.0
> Dátum: 2025-01-19
> Cél: Gyors betöltés, offline támogatás, friss adat

---

## 🎯 Caching Elvek

### Prioritások

| Prioritás | Cél |
|-----------|-----|
| 1. | Gyors első betöltés (< 1s perceived) |
| 2. | Stale-while-revalidate (régi adat mutatása, háttérben frissítés) |
| 3. | Offline működés (cached adat ha nincs net) |
| 4. | Adatkonzisztencia (ne legyen outdated adat) |

### Cache Rétegek

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Angular Signal Store (Memory)                  │
│                   - Feed items                               │
│                   - Notifications                            │
│                   TTL: Session (page refresh clears)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   IndexedDB (Persistent)                     │
│                   - Offline feed data                        │
│                   - User preferences                         │
│                   TTL: 24 hours                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   HTTP Cache (Browser)                       │
│                   - Static assets                            │
│                   - Images                                   │
│                   TTL: varies (see below)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API                                │
│                   - Fresh data                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Memory Cache (Angular Signals)

### NewsService State

```typescript
@Injectable({ providedIn: 'root' })
export class NewsService {
  // === Memory Cache (Signals) ===
  private readonly _feed = signal<FeedItem[]>([]);
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _activeAnnouncement = signal<Announcement | null>(null);

  // Cache metadata
  private readonly _feedLastFetched = signal<Date | null>(null);
  private readonly _feedPage = signal<number>(1);

  // === Public Readonly ===
  readonly feed = this._feed.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.isRead).length
  );

  // === Cache Config ===
  private readonly CACHE_TTL = 60_000; // 1 minute

  // === Methods ===
  loadFeed(forceRefresh = false): Observable<void> {
    const lastFetched = this._feedLastFetched();
    const isCacheValid = lastFetched &&
      (Date.now() - lastFetched.getTime()) < this.CACHE_TTL;

    if (!forceRefresh && isCacheValid && this._feed().length > 0) {
      // Return cached data immediately
      return of(void 0);
    }

    return this.http.get<FeedResponse>('/api/v1/feed').pipe(
      tap(response => {
        this._feed.set(response.items);
        this._feedLastFetched.set(new Date());
      }),
      map(() => void 0)
    );
  }

  // Optimistic update for like
  toggleLike(postId: number): void {
    // Instant UI update
    this._feed.update(items =>
      items.map(item => {
        if (item.post?.id === postId) {
          return {
            ...item,
            post: {
              ...item.post,
              isLikedByMe: !item.post.isLikedByMe,
              likesCount: item.post.isLikedByMe
                ? item.post.likesCount - 1
                : item.post.likesCount + 1
            }
          };
        }
        return item;
      })
    );

    // Background API call
    this.http.post(`/api/v1/forum/posts/${postId}/like`, {}).pipe(
      catchError(err => {
        // Rollback on error
        this.toggleLike(postId);
        return throwError(() => err);
      })
    ).subscribe();
  }
}
```

---

## 💾 IndexedDB Cache (Persistent)

### Database Schema

```typescript
// indexed-db.service.ts
import Dexie, { Table } from 'dexie';

interface CachedFeedItem {
  id: number;
  projectId: number;
  data: FeedItem;
  cachedAt: Date;
}

interface CachedNotification {
  id: number;
  userId: number;
  data: Notification;
  cachedAt: Date;
}

class NewsDatabase extends Dexie {
  feed!: Table<CachedFeedItem>;
  notifications!: Table<CachedNotification>;

  constructor() {
    super('TablokirályNews');
    this.version(1).stores({
      feed: '++id, projectId, cachedAt',
      notifications: '++id, userId, cachedAt'
    });
  }
}

@Injectable({ providedIn: 'root' })
export class IndexedDBService {
  private db = new NewsDatabase();

  // === Feed Cache ===
  async cacheFeed(projectId: number, items: FeedItem[]): Promise<void> {
    // Clear old cache
    await this.db.feed.where('projectId').equals(projectId).delete();

    // Store new items
    const cachedItems = items.map(item => ({
      projectId,
      data: item,
      cachedAt: new Date()
    }));

    await this.db.feed.bulkAdd(cachedItems);
  }

  async getCachedFeed(projectId: number): Promise<FeedItem[]> {
    const items = await this.db.feed
      .where('projectId')
      .equals(projectId)
      .toArray();

    // Check TTL (24 hours)
    const validItems = items.filter(item =>
      (Date.now() - item.cachedAt.getTime()) < 24 * 60 * 60 * 1000
    );

    return validItems.map(item => item.data);
  }

  async clearExpiredCache(): Promise<void> {
    const expirationDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await this.db.feed
      .where('cachedAt')
      .below(expirationDate)
      .delete();

    await this.db.notifications
      .where('cachedAt')
      .below(expirationDate)
      .delete();
  }
}
```

### Cache-First Strategy

```typescript
// news.service.ts
loadFeedWithCache(): Observable<FeedItem[]> {
  return from(this.indexedDB.getCachedFeed(this.projectId)).pipe(
    switchMap(cachedItems => {
      if (cachedItems.length > 0) {
        // Show cached immediately
        this._feed.set(cachedItems);
      }

      // Fetch fresh in background
      return this.http.get<FeedResponse>('/api/v1/feed').pipe(
        tap(response => {
          this._feed.set(response.items);
          this.indexedDB.cacheFeed(this.projectId, response.items);
        }),
        map(response => response.items),
        catchError(err => {
          // If offline, return cached
          if (!navigator.onLine) {
            return of(cachedItems);
          }
          return throwError(() => err);
        })
      );
    })
  );
}
```

---

## 🌐 HTTP Cache Headers

### API Response Headers

```
# Feed API - rövid cache, gyakori változás
Cache-Control: private, max-age=60, stale-while-revalidate=300
ETag: "abc123"

# Notification count - nagyon rövid
Cache-Control: private, max-age=10, must-revalidate

# Static images (thumbnails)
Cache-Control: public, max-age=86400, immutable

# User avatar
Cache-Control: public, max-age=3600

# Announcement banner
Cache-Control: private, max-age=300, stale-while-revalidate=60
```

### Angular HTTP Interceptor

```typescript
// cache.interceptor.ts
@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<any>>();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // Check if URL should be cached
    const cacheable = this.isCacheable(req.url);
    if (!cacheable) {
      return next.handle(req);
    }

    // Return cached response if exists and valid
    const cachedResponse = this.cache.get(req.url);
    if (cachedResponse && this.isValid(cachedResponse)) {
      return of(cachedResponse.clone());
    }

    // Fetch and cache
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.set(req.url, event.clone());
        }
      })
    );
  }

  private isCacheable(url: string): boolean {
    const cacheablePatterns = [
      /\/api\/v1\/projects\/\d+\/announcements\/active/,
      /\/api\/v1\/samples/,
    ];
    return cacheablePatterns.some(pattern => pattern.test(url));
  }
}
```

---

## 🔄 Real-time Invalidation

### WebSocket Cache Updates

```typescript
// news.service.ts
private setupWebSocket(): void {
  this.websocket.on('feed:new_item', (item: FeedItem) => {
    // Prepend to cache
    this._feed.update(items => [item, ...items]);

    // Update IndexedDB
    this.indexedDB.addFeedItem(this.projectId, item);
  });

  this.websocket.on('notification:new', (notification: Notification) => {
    this._notifications.update(items => [notification, ...items]);
  });

  this.websocket.on('announcement:updated', (announcement: Announcement) => {
    this._activeAnnouncement.set(announcement);
  });

  this.websocket.on('feed:item_deleted', (itemId: number) => {
    this._feed.update(items => items.filter(i => i.id !== itemId));
    this.indexedDB.deleteFeedItem(itemId);
  });
}
```

### Manual Invalidation

```typescript
// Használat másik komponensből
export class VotingComponent {
  onVoteSubmitted(): void {
    // Invalidate feed cache to show updated vote count
    this.newsService.invalidateFeedCache();
  }
}

// news.service.ts
invalidateFeedCache(): void {
  this._feedLastFetched.set(null);

  // Force refresh
  this.loadFeed(true).subscribe();
}
```

---

## 📱 Offline Support

### Service Worker Cache

```typescript
// ngsw-config.json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(png|jpg|jpeg|svg|gif)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-feed",
      "urls": [
        "/api/v1/projects/*/feed"
      ],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "strategy": "freshness",
        "timeout": "5s"
      }
    },
    {
      "name": "api-notifications",
      "urls": [
        "/api/v1/notifications"
      ],
      "cacheConfig": {
        "maxSize": 50,
        "maxAge": "30m",
        "strategy": "freshness",
        "timeout": "3s"
      }
    }
  ]
}
```

### Offline Detection

```typescript
// offline.service.ts
@Injectable({ providedIn: 'root' })
export class OfflineService {
  readonly isOnline = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }

  private async syncPendingActions(): Promise<void> {
    const pendingLikes = await this.indexedDB.getPendingLikes();

    for (const like of pendingLikes) {
      try {
        await firstValueFrom(this.http.post(`/api/v1/forum/posts/${like.postId}/like`, {}));
        await this.indexedDB.removePendingLike(like.id);
      } catch (err) {
        console.error('Failed to sync like:', err);
      }
    }
  }
}
```

---

## 📊 Cache Monitoring

### Metrics

```typescript
// cache-metrics.service.ts
@Injectable({ providedIn: 'root' })
export class CacheMetricsService {
  private hits = 0;
  private misses = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  reportMetrics(): void {
    // Send to analytics
    analytics.track('cache_performance', {
      hitRate: this.getHitRate(),
      totalHits: this.hits,
      totalMisses: this.misses
    });
  }
}
```

### Debug Panel (Dev Only)

```typescript
// cache-debug.component.ts
@Component({
  selector: 'app-cache-debug',
  template: `
    @if (isDev) {
      <div class="cache-debug-panel">
        <h3>Cache Debug</h3>
        <p>Memory: {{ memoryCache().size }} items</p>
        <p>IndexedDB: {{ indexedDBCount() }} items</p>
        <p>Hit Rate: {{ hitRate() | percent }}</p>
        <button (click)="clearAll()">Clear All Cache</button>
      </div>
    }
  `
})
export class CacheDebugComponent {
  isDev = !environment.production;
}
```

---

## ⚡ Performance Optimizations

### Pagination Cache

```typescript
// Csak az első 3 oldalt cache-eljük
private readonly MAX_CACHED_PAGES = 3;

loadPage(page: number): Observable<FeedItem[]> {
  if (page <= this.MAX_CACHED_PAGES) {
    // Use cache strategy
    return this.loadFeedWithCache();
  } else {
    // Skip cache for deep pages
    return this.http.get<FeedResponse>(`/api/v1/feed?page=${page}`).pipe(
      map(response => response.items)
    );
  }
}
```

### Image Lazy Loading

```typescript
// feed-card.component.ts
@Component({
  template: `
    <img
      [src]="thumbnail()"
      loading="lazy"
      decoding="async"
      [alt]="altText()"
    />
  `
})
export class FeedCardComponent {
  // Low-quality placeholder first
  thumbnail = computed(() => {
    if (this.imageLoaded()) {
      return this.item().imageUrl;
    }
    return this.item().thumbnailUrl || '/assets/placeholder.svg';
  });
}
```

---

## ✅ Caching Checklist

### Memory Cache
- [ ] Feed items in Signal store
- [ ] Notifications in Signal store
- [ ] TTL: 1 minute for feed
- [ ] Optimistic updates for likes

### IndexedDB
- [ ] Dexie.js setup
- [ ] Feed persistence
- [ ] Notification persistence
- [ ] TTL: 24 hours
- [ ] Expired cache cleanup

### HTTP Cache
- [ ] Interceptor for GET requests
- [ ] ETag support
- [ ] Stale-while-revalidate

### Service Worker
- [ ] ngsw-config.json setup
- [ ] Asset caching
- [ ] API data caching
- [ ] Offline fallback

### Real-time
- [ ] WebSocket cache invalidation
- [ ] New item prepend
- [ ] Delete item remove

### Offline
- [ ] Online/offline detection
- [ ] Pending action queue
- [ ] Sync on reconnect
