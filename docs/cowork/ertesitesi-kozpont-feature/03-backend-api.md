# Értesítési Központ - Backend API

> Verzió: 1.0
> Dátum: 2025-01-19

---

## Base URL

```
https://api.tablokiraly.hu/api/v1
```

---

## Endpoints Összefoglaló

| Method | Endpoint | Leírás |
|--------|----------|--------|
| GET | `/notifications` | Értesítések listázása |
| GET | `/notifications/unread-count` | Olvasatlan szám |
| POST | `/notifications/{id}/read` | Olvasottnak jelölés |
| POST | `/notifications/read-all` | Mind olvasottnak jelölés |
| DELETE | `/notifications/{id}` | Értesítés törlése |
| GET | `/user/notification-settings` | Beállítások lekérése |
| PUT | `/user/notification-settings` | Beállítások mentése |
| GET | `/user/notification-mode` | Aktuális mód |
| PUT | `/user/notification-mode` | Mód váltás |

---

## 1. Értesítések Listázása

### Request

```http
GET /api/v1/notifications
Authorization: Bearer {token}
```

### Query Parameters

| Param | Type | Default | Leírás |
|-------|------|---------|--------|
| `filter` | string | `null` | Szűrő: `pokes`, `votes`, `announcements`, `mentions` |
| `unread_only` | boolean | `false` | Csak olvasatlanok |
| `cursor` | string | `null` | Cursor pagination |
| `limit` | integer | `20` | Elemek száma (max 50) |

### Response

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 123,
        "type": "poke_received",
        "title": "kiss béla bökött",
        "message": "szavazz már pls",
        "emoji": "👉",
        "isRead": false,
        "createdAt": "2025-01-19T14:30:00Z",
        "readAt": null,
        "actionUrl": "/voting/456",
        "metadata": {
          "fromUser": {
            "id": 789,
            "name": "Kiss Béla"
          },
          "pokeId": 101,
          "category": "voting"
        },
        "actions": [
          {
            "type": "reaction",
            "options": ["💀", "😭", "🫡", "❤️", "👀"]
          },
          {
            "type": "navigate",
            "label": "megnézem",
            "url": "/voting/456"
          }
        ]
      },
      {
        "id": 124,
        "type": "vote_created",
        "title": "új szavazás indult",
        "message": "sablon választás",
        "emoji": "🗳️",
        "isRead": false,
        "createdAt": "2025-01-19T14:15:00Z",
        "readAt": null,
        "actionUrl": "/voting/456",
        "metadata": {
          "votingId": 456,
          "votingTitle": "Sablon választás",
          "totalVoters": 25,
          "currentVotes": 12
        },
        "actions": [
          {
            "type": "navigate",
            "label": "szavazok",
            "url": "/voting/456"
          }
        ]
      },
      {
        "id": 125,
        "type": "announcement",
        "title": "fontos hirdetmény",
        "message": "holnap pótfotózás 10:00-kor",
        "emoji": "📢",
        "isRead": true,
        "createdAt": "2025-01-18T10:00:00Z",
        "readAt": "2025-01-18T12:30:00Z",
        "actionUrl": "/news/789",
        "metadata": {
          "announcementId": 789,
          "level": "important"
        },
        "actions": []
      }
    ],
    "meta": {
      "nextCursor": "eyJpZCI6MTI1fQ==",
      "hasMore": true,
      "total": 47
    }
  }
}
```

### Notification Types

| Type | Emoji | Leírás |
|------|-------|--------|
| `poke_received` | 👉 | Bökést kaptál |
| `poke_reaction` | (varies) | Reakció a bökésedre |
| `vote_created` | 🗳️ | Új szavazás indult |
| `vote_ending` | ⏰ | Szavazás hamarosan zárul |
| `vote_closed` | 📊 | Szavazás lezárult |
| `mention` | 📣 | Valaki említett |
| `reply` | ↩️ | Válasz a hozzászólásodra |
| `announcement` | 📢 | Fontos hirdetmény |
| `event_reminder` | 📅 | Esemény emlékeztető |
| `samples_added` | 🖼️ | Új minták érkeztek |

---

## 2. Olvasatlan Szám

Gyors endpoint a badge-hez.

### Request

```http
GET /api/v1/notifications/unread-count
Authorization: Bearer {token}
```

### Response

```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

---

## 3. Olvasottnak Jelölés (Egy)

### Request

```http
POST /api/v1/notifications/{id}/read
Authorization: Bearer {token}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 123,
    "isRead": true,
    "readAt": "2025-01-19T15:00:00Z"
  }
}
```

### Errors

| Code | HTTP | Leírás |
|------|------|--------|
| `NOT_FOUND` | 404 | Értesítés nem található |
| `ALREADY_READ` | 200 | Már olvasott (sikeres, idempotens) |

---

## 4. Mind Olvasottnak Jelölés

### Request

```http
POST /api/v1/notifications/read-all
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body (opcionális filter)

```json
{
  "filter": "pokes"
}
```

Üres body = összes értesítés.

### Response

```json
{
  "success": true,
  "data": {
    "markedCount": 5,
    "readAt": "2025-01-19T15:00:00Z"
  }
}
```

---

## 5. Értesítés Törlése

### Request

```http
DELETE /api/v1/notifications/{id}
Authorization: Bearer {token}
```

### Response

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## 6. Beállítások Lekérése

### Request

```http
GET /api/v1/user/notification-settings
Authorization: Bearer {token}
```

### Response

```json
{
  "success": true,
  "data": {
    "pushEnabled": true,
    "mode": "active",
    "categories": {
      "votes": true,
      "pokes": true,
      "mentions": true,
      "announcements": true,
      "dailyDigest": false
    },
    "quietHours": {
      "enabled": false,
      "start": "23:00",
      "end": "07:00"
    }
  }
}
```

---

## 7. Beállítások Mentése

### Request

```http
PUT /api/v1/user/notification-settings
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body

```json
{
  "pushEnabled": true,
  "categories": {
    "votes": true,
    "pokes": true,
    "mentions": true,
    "announcements": true,
    "dailyDigest": false
  },
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "updated": true,
    "settings": { ... }
  }
}
```

---

## 8. Notification Mode Lekérése

### Request

```http
GET /api/v1/user/notification-mode
Authorization: Bearer {token}
```

### Response

```json
{
  "success": true,
  "data": {
    "mode": "active",
    "modes": {
      "chill": {
        "key": "chill",
        "emoji": "😴",
        "label": "chill",
        "description": "Csak kritikus értesítések",
        "maxPushPerDay": 1,
        "categories": ["announcements", "mentions"]
      },
      "active": {
        "key": "active",
        "emoji": "⚡",
        "label": "aktív",
        "description": "Szavazások, bökések, válaszok",
        "maxPushPerDay": 3,
        "categories": ["announcements", "mentions", "votes", "pokes", "replies"]
      },
      "all": {
        "key": "all",
        "emoji": "🔥",
        "label": "mindent",
        "description": "Minden értesítés",
        "maxPushPerDay": 5,
        "categories": ["all"]
      },
      "custom": {
        "key": "custom",
        "emoji": "⚙️",
        "label": "egyéni",
        "description": "Saját beállítások",
        "maxPushPerDay": null,
        "categories": null
      }
    }
  }
}
```

---

## 9. Notification Mode Váltás

### Request

```http
PUT /api/v1/user/notification-mode
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body

```json
{
  "mode": "chill"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "mode": "chill",
    "appliedCategories": ["announcements", "mentions"],
    "maxPushPerDay": 1
  }
}
```

---

## WebSocket Events

### Channel

```
Private channel: user.{userId}.notifications
```

### Authentication

```javascript
// Laravel Echo / Reverb
Echo.private(`user.${userId}.notifications`)
  .listen('NotificationCreated', (e) => { ... })
  .listen('NotificationRead', (e) => { ... });
```

### Events

#### notification.new

Új értesítés érkezett.

```json
{
  "event": "notification.new",
  "data": {
    "id": 123,
    "type": "poke_received",
    "title": "kiss béla bökött",
    "message": "szavazz már pls",
    "emoji": "👉",
    "isRead": false,
    "createdAt": "2025-01-19T14:30:00Z",
    "actionUrl": "/voting/456",
    "metadata": { ... },
    "actions": [ ... ],
    "showToast": true,
    "playSound": false,
    "vibrate": [10]
  }
}
```

#### notification.read

Értesítés olvasottá vált (másik eszközön).

```json
{
  "event": "notification.read",
  "data": {
    "id": 123,
    "readAt": "2025-01-19T15:00:00Z"
  }
}
```

#### notification.read_all

Összes olvasottá vált.

```json
{
  "event": "notification.read_all",
  "data": {
    "readAt": "2025-01-19T15:00:00Z",
    "filter": null
  }
}
```

#### notification.deleted

Értesítés törölve.

```json
{
  "event": "notification.deleted",
  "data": {
    "id": 123
  }
}
```

#### unread_count.updated

Olvasatlan szám változott.

```json
{
  "event": "unread_count.updated",
  "data": {
    "count": 5
  }
}
```

---

## TypeScript Interfaces

```typescript
// Notification types
export type NotificationType =
  | 'poke_received'
  | 'poke_reaction'
  | 'vote_created'
  | 'vote_ending'
  | 'vote_closed'
  | 'mention'
  | 'reply'
  | 'announcement'
  | 'event_reminder'
  | 'samples_added';

export type NotificationMode = 'chill' | 'active' | 'all' | 'custom';

export type NotificationCategory =
  | 'votes'
  | 'pokes'
  | 'mentions'
  | 'announcements'
  | 'replies'
  | 'events'
  | 'samples'
  | 'dailyDigest';

// Action types
export interface NotificationAction {
  type: 'reaction' | 'navigate' | 'dismiss';
  label?: string;
  url?: string;
  options?: string[];
}

// Main notification interface
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  emoji: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  actions: NotificationAction[];
}

// API Response
export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    meta: {
      nextCursor: string | null;
      hasMore: boolean;
      total: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

// Settings
export interface NotificationSettings {
  pushEnabled: boolean;
  mode: NotificationMode;
  categories: Record<NotificationCategory, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// Mode config
export interface NotificationModeConfig {
  key: NotificationMode;
  emoji: string;
  label: string;
  description: string;
  maxPushPerDay: number | null;
  categories: NotificationCategory[] | null;
}

// WebSocket event payloads
export interface WsNotificationNew {
  event: 'notification.new';
  data: Notification & {
    showToast: boolean;
    playSound: boolean;
    vibrate: number[] | null;
  };
}

export interface WsNotificationRead {
  event: 'notification.read';
  data: {
    id: number;
    readAt: string;
  };
}

export interface WsUnreadCountUpdated {
  event: 'unread_count.updated';
  data: {
    count: number;
  };
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Értesítés nem található",
    "details": null
  }
}
```

### Error Codes

| Code | HTTP | Leírás |
|------|------|--------|
| `UNAUTHORIZED` | 401 | Nincs bejelentkezve |
| `NOT_FOUND` | 404 | Erőforrás nem található |
| `VALIDATION_ERROR` | 422 | Hibás request body |
| `RATE_LIMITED` | 429 | Túl sok kérés |
| `SERVER_ERROR` | 500 | Szerver hiba |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| GET /notifications | 60/perc |
| GET /notifications/unread-count | 120/perc |
| POST /notifications/{id}/read | 60/perc |
| POST /notifications/read-all | 10/perc |
| PUT /user/notification-settings | 10/perc |

---

## Caching Strategy

### Client-side

```typescript
// unread-count: 30s cache
// notifications list: no cache (real-time WebSocket)
// settings: 5 perc cache
```

### Server-side

```php
// unread_count: Redis cache, 30s TTL
// invalidate on new notification / read
Cache::remember("user:{$userId}:unread_count", 30, fn() => ...);
```

---

## Cascade Logic (Push vs In-App)

### Backend Implementation

```php
// NotificationService.php
public function send(User $user, Notification $notification): void
{
    // 1. Always save to DB
    $notification->save();

    // 2. Always broadcast via WebSocket
    broadcast(new NotificationCreated($notification));

    // 3. Check if user is online
    $isOnline = $this->presenceService->isOnline($user->id);

    if ($isOnline) {
        // User online → only in-app notification
        // WebSocket already sent above
        return;
    }

    // 4. User offline → check push settings
    if (!$this->canSendPush($user, $notification)) {
        return;
    }

    // 5. Send push notification
    $this->pushService->send($user, $notification);
}

private function canSendPush(User $user, Notification $notification): bool
{
    // Check mode
    $mode = $user->notification_mode;
    $modeConfig = $this->getModeConfig($mode);

    // Check category allowed
    if (!in_array($notification->category, $modeConfig->categories)) {
        return false;
    }

    // Check daily limit
    $todayCount = $this->getTodayPushCount($user);
    if ($todayCount >= $modeConfig->maxPushPerDay) {
        return false;
    }

    // Check quiet hours
    if ($this->isQuietHours($user)) {
        return false;
    }

    // Check minimum gap (2 hours)
    $lastPush = $this->getLastPushTime($user);
    if ($lastPush && $lastPush->diffInHours(now()) < 2) {
        // Queue for later instead of dropping
        $this->queuePush($user, $notification, $lastPush->addHours(2));
        return false;
    }

    return true;
}
```

---

## API Versioning

```
/api/v1/notifications  ← Current
/api/v2/notifications  ← Future (if breaking changes needed)
```

Header alternative:
```http
Accept: application/vnd.tablokiraly.v1+json
```
