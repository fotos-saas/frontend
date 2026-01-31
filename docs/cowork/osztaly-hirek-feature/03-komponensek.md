# Osztály Hírek - Komponensek Listája

> Verzió: 1.0
> Dátum: 2025-01-19

---

## 📦 Új Komponensek

### 1. `news-feed` (Feature Component)
**Útvonal:** `src/app/features/news-feed/`

```
news-feed/
├── news-feed.component.ts       # Fő feed komponens
├── news-feed.component.html
├── news-feed.component.scss
├── news-feed.state.ts           # Feed state management
└── news-feed.routes.ts
```

**Felelősség:**
- Feed itemek betöltése és megjelenítése
- Pull-to-refresh kezelés
- Infinite scroll
- Empty state

---

### 2. `feed-item` (Shared Component)
**Útvonal:** `src/app/shared/components/feed-item/`

```
feed-item/
├── feed-item.component.ts
├── feed-item.component.html
├── feed-item.component.scss
└── feed-item.types.ts           # FeedItem interface
```

**Input-ok:**
```typescript
@Input() item: FeedItem;
@Input() isNew: boolean = false;  // Kiemelés ha új
```

**Output-ok:**
```typescript
@Output() action = new EventEmitter<FeedItemAction>();
@Output() like = new EventEmitter<number>();  // postId
```

---

### 3. `notification-bell` (Shared Component)
**Útvonal:** `src/app/shared/components/notification-bell/`

```
notification-bell/
├── notification-bell.component.ts
├── notification-bell.component.html
├── notification-bell.component.scss
└── notification-dropdown/
    ├── notification-dropdown.component.ts
    ├── notification-dropdown.component.html
    └── notification-dropdown.component.scss
```

**Felelősség:**
- Harang ikon badge-dzsel
- Dropdown panel megnyitás/zárás
- Click outside kezelés

---

### 4. `notification-item` (Shared Component)
**Útvonal:** `src/app/shared/components/notification-item/`

```
notification-item/
├── notification-item.component.ts
├── notification-item.component.html
└── notification-item.component.scss
```

**Input-ok:**
```typescript
@Input() notification: Notification;
@Input() compact: boolean = false;  // Dropdown vs full page
```

---

### 5. `announcement-banner` (Shared Component)
**Útvonal:** `src/app/shared/components/announcement-banner/`

```
announcement-banner/
├── announcement-banner.component.ts
├── announcement-banner.component.html
└── announcement-banner.component.scss
```

**Input-ok:**
```typescript
@Input() announcement: Announcement;
@Input() dismissible: boolean = true;
```

**Output-ok:**
```typescript
@Output() dismiss = new EventEmitter<number>();  // announcementId
```

---

### 6. `create-announcement-dialog` (Shared Component)
**Útvonal:** `src/app/shared/components/create-announcement-dialog/`

```
create-announcement-dialog/
├── create-announcement-dialog.component.ts
├── create-announcement-dialog.component.html
└── create-announcement-dialog.component.scss
```

**Felelősség:**
- Hirdetmény típus választó
- Rich text editor
- Banner és push checkbox
- Validáció

---

## 🔧 Új Service-ek

### 1. `notification.service.ts`
**Útvonal:** `src/app/core/services/notification.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  // State
  notifications$ = signal<Notification[]>([]);
  unreadCount$ = computed(() =>
    this.notifications$().filter(n => !n.isRead).length
  );

  // Methods
  loadNotifications(): Observable<Notification[]>;
  markAsRead(id: number): Observable<void>;
  markAllAsRead(): Observable<void>;
  deleteNotification(id: number): Observable<void>;
}
```

---

### 2. `feed.service.ts`
**Útvonal:** `src/app/core/services/feed.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class FeedService {
  // Methods
  getFeedItems(page: number, limit: number): Observable<FeedResponse>;
  refreshFeed(): Observable<FeedItem[]>;
}
```

---

### 3. `announcement.service.ts`
**Útvonal:** `src/app/core/services/announcement.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  // State
  activeAnnouncement$ = signal<Announcement | null>(null);

  // Methods
  getActiveAnnouncement(): Observable<Announcement | null>;
  createAnnouncement(data: CreateAnnouncementDto): Observable<Announcement>;
  dismissAnnouncement(id: number): Observable<void>;
}
```

---

## 📝 Interfészek / Típusok

### `feed.types.ts`
**Útvonal:** `src/app/core/models/feed.types.ts`

```typescript
export type FeedItemType =
  | 'announcement'
  | 'poll_created'
  | 'poll_ending'
  | 'poll_closed'
  | 'forum_post'
  | 'forum_reply'
  | 'forum_mention'
  | 'samples_added'
  | 'guest_joined';

export interface FeedItem {
  id: number;
  type: FeedItemType;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;

  // Típus-specifikus
  poll?: PollSummary;
  post?: PostSummary;
  samples?: SampleSummary[];
  author?: AuthorSummary;

  // Interakciók
  actionUrl?: string;
  actionLabel?: string;
  likesCount?: number;
  isLikedByMe?: boolean;
}

export interface FeedResponse {
  items: FeedItem[];
  hasMore: boolean;
  nextPage: number | null;
}
```

---

### `notification.types.ts`
**Útvonal:** `src/app/core/models/notification.types.ts`

```typescript
export type NotificationType =
  | 'poll_created'
  | 'poll_ending'
  | 'poll_closed'
  | 'forum_reply'
  | 'forum_mention'
  | 'announcement'
  | 'samples_added';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl: string;

  // Extra
  icon?: string;
  imageUrl?: string;
}
```

---

### `announcement.types.ts`
**Útvonal:** `src/app/core/models/announcement.types.ts`

```typescript
export type AnnouncementLevel = 'important' | 'info' | 'success';

export interface Announcement {
  id: number;
  level: AnnouncementLevel;
  message: string;
  showBanner: boolean;
  createdAt: string;
  createdBy: {
    id: number;
    name: string;
  };
  viewsCount: number;
  dismissedByMe: boolean;
}

export interface CreateAnnouncementDto {
  level: AnnouncementLevel;
  message: string;
  showBanner: boolean;
  sendPush: boolean;
}
```

---

## 🎨 Meglévő Komponensek Módosítása

### 1. `navbar.component`
**Változás:** Harang ikon hozzáadása

```html
<!-- Meglévő navbar-ba -->
<app-notification-bell />
```

---

### 2. `home.component`
**Változás:** Feed integráció

```html
<!-- Banner helye -->
<app-announcement-banner
  *ngIf="activeAnnouncement()"
  [announcement]="activeAnnouncement()"
  (dismiss)="onDismissAnnouncement($event)"
/>

<!-- Feed helye -->
<app-news-feed />
```

---

### 3. `main-layout.component`
**Változás:** Notification polling indítása

```typescript
ngOnInit() {
  // Meglévő kód...

  // Új: notification polling
  this.notificationService.startPolling();
}
```

---

## 📂 Teljes Struktúra Összefoglaló

```
src/app/
├── core/
│   ├── models/
│   │   ├── feed.types.ts              # ÚJ
│   │   ├── notification.types.ts      # ÚJ
│   │   └── announcement.types.ts      # ÚJ
│   └── services/
│       ├── feed.service.ts            # ÚJ
│       ├── notification.service.ts    # ÚJ
│       └── announcement.service.ts    # ÚJ
│
├── features/
│   ├── news-feed/                     # ÚJ FEATURE
│   │   ├── news-feed.component.ts
│   │   ├── news-feed.component.html
│   │   ├── news-feed.component.scss
│   │   ├── news-feed.state.ts
│   │   └── news-feed.routes.ts
│   └── ...
│
├── shared/
│   └── components/
│       ├── feed-item/                 # ÚJ
│       ├── notification-bell/         # ÚJ
│       │   └── notification-dropdown/
│       ├── notification-item/         # ÚJ
│       ├── announcement-banner/       # ÚJ
│       ├── create-announcement-dialog/# ÚJ
│       └── ...
│
└── ...
```

---

## ✅ Checklist Implementációhoz

### Komponensek
- [ ] `news-feed` feature component
- [ ] `feed-item` shared component
- [ ] `notification-bell` shared component
- [ ] `notification-dropdown` sub-component
- [ ] `notification-item` shared component
- [ ] `announcement-banner` shared component
- [ ] `create-announcement-dialog` shared component

### Service-ek
- [ ] `feed.service.ts`
- [ ] `notification.service.ts`
- [ ] `announcement.service.ts`

### Típusok
- [ ] `feed.types.ts`
- [ ] `notification.types.ts`
- [ ] `announcement.types.ts`

### Integrációk
- [ ] Navbar módosítás (harang)
- [ ] Home módosítás (banner + feed)
- [ ] MainLayout módosítás (polling)

### Stílusok
- [ ] Feed item stílusok (7 típus)
- [ ] Notification dropdown stílusok
- [ ] Banner stílusok (3 szín)
- [ ] Responsive breakpoints
- [ ] Dark mode támogatás
