# Értesítési Központ - Claude Implementációs Útmutató

> **FONTOS**: Ez a dokumentum a Claude Code AI asszisztensnek szól az implementáció során.

---

## Projekt Kontextus

- **Alkalmazás**: Tablókirály - tablófotó rendelési platform
- **Feature**: Értesítési Központ (Notification Center)
- **Cél**: Egységes értesítési rendszer: in-app inbox, toast/snackbar, notification modes

---

## Tech Stack

| Réteg | Technológia | Verzió |
|-------|-------------|--------|
| Frontend | Angular | 20+ |
| State | Signals | built-in |
| Styling | Tailwind CSS | 4.x |
| Backend | Laravel | 12.x |
| DB | PostgreSQL | 16+ |
| Real-time | Laravel Reverb | (meglévő `WebsocketService`) |
| Push | OneSignal | (meglévő) |

### Meglévő Szolgáltatások (BŐVÍTENDŐ, nem új!)

```typescript
// core/services/toast.service.ts - MÁR LÉTEZIK
// Bővíteni kell: queue, action callback, warning type

// core/services/websocket.service.ts - MÁR LÉTEZIK
// Használni kell a notification eseményekhez
```

---

## Implementációs Sorrend

### Fázis 1: Core Services Bővítése (0.5 nap)

#### 1.1 Toast Service BŐVÍTÉSE

**FONTOS:** A `ToastService` már létezik! (`core/services/toast.service.ts`)

Jelenlegi állapot:
```typescript
// Létező ToastService - BŐVÍTENI KELL:
export class ToastService {
  toast = signal<Toast | null>(null);
  success(title: string, message: string, duration?: number): void { ... }
  error(title: string, message: string, duration?: number): void { ... }
  info(title: string, message: string, duration?: number): void { ... }
}
```

Bővítendő funkciók:
```typescript
// Hozzáadandó:
- warning(message: string): void  // Új típus
- showWithAction(message: string, action: ToastAction): void
- showWithUndo(message: string, undoCallback: () => void): void
- private toastQueue: Toast[]  // Több toast kezelése
```

**Tesztelés:**
```typescript
this.toastService.success('működik!');
this.toastService.showWithUndo('bökés elküldve', () => this.undoPoke());
```

#### 1.2 Toast Components

```bash
ng g component shared/components/toast-container --standalone
ng g component shared/components/toast --standalone
```

**Fontos:**
- ToastContainerComponent-et add hozzá az `app.component.ts`-hez
- Position: `fixed bottom-6 left-1/2 -translate-x-1/2 z-50`

---

### Fázis 2: Notification Bell (1.5 nap)

#### 2.1 Backend: Notifications API

```bash
php artisan make:controller Api/V1/NotificationController
php artisan make:model Notification -m
php artisan make:model UserNotificationSettings -m
```

**Végpontok implementálása:**
1. `GET /notifications` - lista (cursor pagination)
2. `GET /notifications/unread-count` - badge szám
3. `POST /notifications/{id}/read` - olvasottnak jelölés
4. `POST /notifications/read-all` - mind olvasott

Lásd: `03-backend-api.md`

#### 2.2 Frontend Services

```bash
ng g service core/services/notification --skip-tests
ng g service core/services/notification-state --skip-tests
```

```typescript
// NotificationService - HTTP hívások
// NotificationStateService - Signals state management
// Lásd: 05-components.md
```

#### 2.3 Bell Component

```bash
ng g component shared/components/notification-bell --standalone
ng g component shared/components/notification-dropdown --standalone
ng g component shared/components/notification-item --standalone
```

**Navbar integráció:**
```html
<!-- layout/navbar.component.html -->
<app-notification-bell />
```

**Bell animáció:**
```css
@keyframes bell-ring {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  /* ... lásd: 02-ui-design.md */
}
```

---

### Fázis 3: WebSocket Integration (0.5 nap)

#### 3.1 WebSocket Service - MEGLÉVŐ HASZNÁLATA

**FONTOS:** A `WebsocketService` már létezik! (`core/services/websocket.service.ts`)

```typescript
// Meglévő WebsocketService - HASZNÁLD EZT:
export class WebsocketService {
  readonly connectionState = signal<ConnectionState>('disconnected');
  readonly isConnected = computed(() => this.connectionState() === 'connected');

  // Privát csatorna létrehozása
  private(channelName: string): ReturnType<Echo<'reverb'>['private']> | null

  // Csatorna elhagyása
  leave(channelName: string): void
}
```

#### 3.2 NotificationWebSocketService (új - wrapper)

```bash
ng g service core/services/notification-websocket --skip-tests
```

Ez a service a meglévő `WebsocketService`-t használja:

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationWebSocketService {
  private readonly websocket = inject(WebsocketService);
  private readonly notificationState = inject(NotificationStateService);
  private readonly toastService = inject(ToastService);

  initializeForUser(userId: number): void {
    // A meglévő WebsocketService.private() metódusát használjuk
    const channel = this.websocket.private(`user.${userId}.notifications`);

    if (channel) {
      // Események figyelése a csatornán
      channel.listen('notification.new', (data: NotificationEvent) => {
        this.handleNewNotification(data);
      });
    }
  }

  private handleNewNotification(event: NotificationEvent): void {
    // Implementáció...
  }
}
```

**Események:**
- `notification.new` → state update + toast + bell animation
- `notification.read` → state update (másik device)
- `unread_count.updated` → badge update

#### 3.2 Laravel Broadcasting

```php
// app/Events/NotificationCreated.php
class NotificationCreated implements ShouldBroadcast
{
    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->notification->user_id . '.notifications')];
    }

    public function broadcastAs(): string
    {
        return 'notification.new';
    }
}
```

```php
// routes/channels.php
Broadcast::channel('user.{userId}.notifications', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
```

---

### Fázis 4: Notification Modes - V1 Egyszerűsített (0.5 nap)

#### 4.1 Backend Settings

```bash
php artisan make:migration add_notification_settings_to_users
```

Vagy külön tábla: `user_notification_settings`

```php
// config/notifications.php - V1: CSAK 2 MÓD
return [
    'modes' => [
        'normal' => [
            'key' => 'normal',
            'emoji' => '🔔',
            'label' => 'normál',
            'description' => 'Szavazások, bökések, válaszok, hirdetmények',
            'maxPushPerDay' => 3,
            'categories' => ['announcements', 'mentions', 'votes', 'pokes', 'replies'],
        ],
        'quiet' => [
            'key' => 'quiet',
            'emoji' => '🔕',
            'label' => 'csendes',
            'description' => 'Csak kritikus értesítések',
            'maxPushPerDay' => 1,
            'categories' => ['announcements', 'mentions'],
        ],
        // V2-ben: 'chill', 'active', 'all' módok
    ],
];
```

#### 4.2 Frontend Settings Page

```bash
ng g component features/notifications/pages/notification-settings-page --standalone
ng g component features/notifications/components/notification-mode-selector --standalone
```

---

### Fázis 5: Full Notifications Page (1 nap)

```bash
ng g component features/notifications/pages/notifications-page --standalone
ng g component features/notifications/components/notification-filter-tabs --standalone
```

**Features:**
- Filter tabs: mind, bökések, szavazások, hirdetmények
- Infinite scroll (Intersection Observer)
- Pull to refresh (mobile)
- Date grouping (ma, tegnap, régebbi)

---

### Fázis 6: Sticky Banner - V2-BEN (KIHAGYVA V1-BŐL)

> **MEGJEGYZÉS:** A Sticky Banner komponens a V2 scope-ba került a V1 egyszerűsítése érdekében.

```bash
# V2-ben:
# ng g component shared/components/sticky-banner --standalone
```

**V2 Trigger példák:**
- Szavazás 1 órán belül zárul
- Fontos hirdetmény
- Pótfotózás holnap

---

## Kritikus Implementációs Szabályok

### 1. Signals Pattern (Angular 20+)

```typescript
// ✅ HELYES - State management
private _notifications = signal<Notification[]>([]);
readonly notifications = this._notifications.asReadonly();

// ✅ HELYES - Component inputs/outputs (Angular 20+)
notification = input.required<Notification>();
dismissed = output<void>();

// ❌ HELYTELEN - NE használj BehaviorSubject-et új kódban
private notifications$ = new BehaviorSubject<Notification[]>([]);

// ❌ HELYTELEN - NE használj @Input/@Output decorator-okat (elavult!)
@Input() notification!: Notification;
@Output() dismissed = new EventEmitter<void>();
```

### 2. Optimistic Updates

```typescript
async markAsRead(id: number): Promise<void> {
  // 1. Optimistic update
  this._notifications.update(n => n.map(x =>
    x.id === id ? { ...x, isRead: true } : x
  ));
  this._unreadCount.update(c => Math.max(0, c - 1));

  try {
    // 2. API call
    await this.api.markAsRead(id).toPromise();
  } catch {
    // 3. Rollback on error
    this._notifications.update(/* restore previous */);
    this._unreadCount.update(c => c + 1);
  }
}
```

### 3. Cascade Logic (Push vs In-App)

```php
// NotificationService.php
public function send(User $user, Notification $notification): void
{
    // Always save to DB
    $notification->save();

    // Always broadcast via WebSocket
    broadcast(new NotificationCreated($notification));

    // Only push if user is OFFLINE
    if (!$this->isUserOnline($user)) {
        $this->sendPush($user, $notification);
    }
}
```

### 4. Gen Z UI Szabályok

```typescript
// ✅ Lowercase
title = 'értesítések';
buttonText = 'megnézem';

// ❌ Uppercase
title = 'Értesítések';  // NE!
buttonText = 'Megnézem'; // NE!

// ✅ Casual tone
emptyMessage = 'még nincs értesítésed';

// ❌ Formal
emptyMessage = 'Nincsenek értesítései.'; // NE!
```

### 5. Animációk

Minden animáció CSS-ben, nem JS-ben:

```css
/* Toast slide in */
@keyframes toast-in {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Bell ring */
@keyframes bell-ring { /* ... */ }

/* Badge pop */
@keyframes badge-pop { /* ... */ }

/* Dropdown open */
@keyframes dropdown-open { /* ... */ }
```

---

## WebSocket Event Handling

### Frontend → Backend Flow

```
User action (mark as read)
    ↓
HTTP POST /notifications/{id}/read
    ↓
Backend saves to DB
    ↓
Backend broadcasts: notification.read
    ↓
Other devices receive update
```

### Backend → Frontend Flow

```
Event occurs (new poke)
    ↓
Backend creates notification
    ↓
Backend broadcasts: notification.new
    ↓
Frontend WebSocket receives
    ↓
Check: user online?
    ↓
Yes: Show toast + update badge
No: Push already sent by backend
```

---

## Toast Usage Guide

### Mikor melyiket használd

```typescript
// Simple success feedback - MEGLÉVŐ ToastService 2 paramétert vár!
this.toastService.success('szavazat elküldve', '');

// With undo action (snackbar) - BŐVÍTETT showWithUndo metódus
this.toastService.showWithUndo('bökés elküldve', () => {
  // Undo logic
  this.pokeService.deletePoke(pokeId);
});

// Error with retry - BŐVÍTETT show metódus action-nel
this.toastService.show('hiba történt', {
  type: 'error',
  action: { label: 'újra', callback: () => this.retry() }
});

// Info (from WebSocket) - MEGLÉVŐ 2 paraméterrel
this.toastService.info('👉 kiss béla bökött', 'szavazz már pls');
```

### Toast Types

| Type | Szín | Auto-dismiss | Mikor |
|------|------|--------------|-------|
| success | green | 3s | Sikeres akció |
| error | red | 5s (vagy manual) | Hiba |
| warning | amber | 5s | Figyelmeztetés |
| info | blue | 3s | Információ |

---

## Notification Types Mapping

```typescript
const typeConfig: Record<NotificationType, { emoji: string; category: string }> = {
  poke_received: { emoji: '👉', category: 'pokes' },
  poke_reaction: { emoji: '💀', category: 'pokes' }, // dynamic emoji
  vote_created: { emoji: '🗳️', category: 'votes' },
  vote_ending: { emoji: '⏰', category: 'votes' },
  vote_closed: { emoji: '📊', category: 'votes' },
  mention: { emoji: '📣', category: 'mentions' },
  reply: { emoji: '↩️', category: 'replies' },
  announcement: { emoji: '📢', category: 'announcements' },
  event_reminder: { emoji: '📅', category: 'events' },
  samples_added: { emoji: '🖼️', category: 'samples' },
};
```

---

## Mobile Considerations

### Bottom Sheet (helyett Dropdown)

```typescript
// Detektálás
isMobile = signal(window.innerWidth < 768);

// Template
@if (isMobile()) {
  <app-notification-bottom-sheet />
} @else {
  <app-notification-dropdown />
}
```

### Touch Targets

```html
<!-- Minimum 44x44px -->
<button class="min-w-[44px] min-h-[44px]">
```

### Haptic Feedback

```typescript
// notification-websocket.service.ts
if (event.data.vibrate && navigator.vibrate) {
  navigator.vibrate(event.data.vibrate);
}
```

---

## Error States

### No Connection

```html
@if (connectionError()) {
  <div class="text-center py-8">
    <span class="text-2xl">⚠️</span>
    <p class="text-gray-500 mt-2">nincs kapcsolat</p>
    <button (click)="retry()" class="mt-2 text-blue-600">újrapróbálás</button>
  </div>
}
```

### Empty State

```html
@if (notifications().length === 0) {
  <div class="text-center py-12">
    <span class="text-4xl">🔔</span>
    <p class="mt-2 text-gray-500">még nincs értesítésed</p>
    <p class="text-sm text-gray-400">majd szólunk ha történik valami!</p>
  </div>
}
```

---

## Dokumentáció Referenciák

| Fájl | Tartalom |
|------|----------|
| `01-user-flow.md` | Teljes UX flow |
| `02-ui-design.md` | UI specs, animációk, színek |
| `03-backend-api.md` | REST API + WebSocket |
| `04-database-schema.md` | DB táblák, Laravel models |
| `05-components.md` | Angular komponensek |

---

## Tesztelés Checklist

### Unit Tests

```typescript
describe('ToastService', () => {
  it('should add toast to queue');
  it('should auto-dismiss after duration');
  it('should limit visible toasts to 3');
  it('should execute action callback');
});

describe('NotificationStateService', () => {
  it('should load notifications');
  it('should mark as read optimistically');
  it('should rollback on error');
  it('should group by date');
});
```

### E2E Tests

```typescript
it('should show badge when unread notifications exist');
it('should open dropdown on bell click');
it('should mark as read on item click');
it('should show toast on new WebSocket notification');
it('should update badge in real-time');
```

---

## Checklist

### Backend
- [ ] Notifications tábla migráció
- [ ] UserNotificationSettings tábla
- [ ] NotificationController
- [ ] NotificationService
- [ ] Broadcasting events
- [ ] Channel authorization
- [ ] Push cascade logic

### Frontend - Core
- [ ] ToastService
- [ ] ToastContainerComponent
- [ ] ToastComponent
- [ ] NotificationService (HTTP)
- [ ] NotificationStateService (Signals)
- [ ] NotificationWebSocketService

### Frontend - Bell & Dropdown
- [ ] NotificationBellComponent
- [ ] NotificationDropdownComponent
- [ ] NotificationItemComponent
- [ ] Bell animation
- [ ] Badge animation
- [ ] Dropdown animation

### Frontend - Pages
- [ ] NotificationsPageComponent
- [ ] NotificationSettingsPageComponent
- [ ] NotificationModeSelectorComponent
- [ ] NotificationFilterTabsComponent

### Frontend - Extras
- [ ] StickyBannerComponent
- [ ] Mobile bottom sheet (optional)
- [ ] Haptic feedback
- [ ] Empty/Error states

### Integration
- [ ] WebSocket connection
- [ ] Real-time badge updates
- [ ] Toast on new notification
- [ ] Cascade push/in-app logic

---

**FONTOS EMLÉKEZTETŐK:**

1. **Signals (Angular 20+)** - `input()`, `output()`, `signal()`, `computed()` használat (NEM `@Input/@Output`, NEM `BehaviorSubject`)
2. **Standalone** - Minden komponens `standalone: true`
3. **OnPush** - Minden komponens `changeDetection: ChangeDetectionStrategy.OnPush`
4. **Gen Z stílus** - Lowercase, emoji-first, casual
5. **Optimistic UI** - Azonnal frissíts, rollback hiba esetén
6. **Cascade** - User online = in-app only, offline = push
7. **Animációk** - CSS keyframes, nem JS
8. **Meglévő szolgáltatások** - ToastService és WebsocketService BŐVÍTÉSE, nem új létrehozása!
9. **PostgreSQL** - Nem MySQL! Lásd: 04-database-schema.md
10. **WebSocket API** - `websocket.private(channelName)` + `channel.listen(event, callback)` (NEM `subscribeToPrivateChannel`!)
11. **Toast API** - Minden metódus 2 paramétert vár: `(title, message, duration?)`

---

## 🚨 DOKUMENTÁCIÓ JAVÍTÁSOK (2026-01-23)

Az eredeti dokumentációban **kritikus hibák** voltak! Lásd: `ANGULAR-20-FIXES.md`

**Fő javítások:**
- ❌ WebSocket: `subscribeToPrivateChannel()` **NEM LÉTEZIK** → ✅ `private()` + `listen()`
- ❌ Toast: 1 paraméter → ✅ 2 paraméter kötelező
- ❌ `@Input/@Output` → ✅ `input()` és `output()`
