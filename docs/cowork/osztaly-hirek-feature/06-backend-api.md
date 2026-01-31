# Osztály Hírek - Backend API Specifikáció

> Verzió: 1.0
> Dátum: 2025-01-19
> API verzió: v1

---

## 📍 Base URL

```
Production: https://api.tablokiraly.hu/api/v1
Development: http://localhost:8000/api/v1
```

---

## 🔐 Autentikáció

Minden request-hez szükséges:
```
Headers:
  Authorization: Bearer {jwt_token}
  X-Guest-Session: {guest_session_id}  # Vendég usernek
  Content-Type: application/json
```

---

## 📰 Feed API

### GET /projects/{projectId}/feed

Feed itemek lekérése lapozással.

**Request:**
```
GET /projects/123/feed?page=1&limit=10&type=all
```

**Query Parameters:**
| Param | Típus | Kötelező | Default | Leírás |
|-------|-------|----------|---------|--------|
| page | int | nem | 1 | Oldal szám |
| limit | int | nem | 10 | Elemek száma (max 50) |
| type | string | nem | "all" | Szűrés típusra |
| since | ISO8601 | nem | - | Adott időpont óta |

**Type filter értékek:**
- `all` - minden típus
- `announcement` - csak hirdetmények
- `poll` - szavazás aktivitások
- `forum` - fórum aktivitások
- `samples` - minta feltöltések

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "poll_created",
        "title": "Új szavazás indult",
        "content": "Melyik sablon tetszik?",
        "createdAt": "2025-01-19T10:30:00Z",
        "isRead": false,
        "poll": {
          "id": 45,
          "title": "Sablon választás",
          "totalVoters": 25,
          "currentVotes": 8,
          "endsAt": "2025-01-21T18:00:00Z",
          "hasVoted": false,
          "previewImages": [
            "https://cdn.tablokiraly.hu/samples/thumb1.jpg",
            "https://cdn.tablokiraly.hu/samples/thumb2.jpg"
          ]
        },
        "actionUrl": "/voting/45"
      },
      {
        "id": 2,
        "type": "forum_post",
        "title": "Új hozzászólás",
        "content": "Szerintem a kék háttér jobban passzolna...",
        "createdAt": "2025-01-19T08:15:00Z",
        "isRead": true,
        "author": {
          "id": 78,
          "name": "Kovács Peti",
          "avatarUrl": null
        },
        "post": {
          "id": 234,
          "discussionId": 12,
          "discussionTitle": "Milyen háttér legyen?",
          "likesCount": 3,
          "repliesCount": 2,
          "isLikedByMe": false
        },
        "actionUrl": "/forum/12#post-234"
      },
      {
        "id": 3,
        "type": "announcement",
        "title": "Fontos hirdetmény",
        "content": "Holnap 10:00 fotózás! Fehér ing kell!",
        "createdAt": "2025-01-18T16:00:00Z",
        "isRead": true,
        "announcement": {
          "id": 5,
          "level": "important",
          "viewsCount": 18,
          "createdBy": {
            "id": 1,
            "name": "Tanár Úr"
          }
        }
      },
      {
        "id": 4,
        "type": "samples_added",
        "title": "Új minták érkeztek",
        "content": "4 új minta lett feltöltve",
        "createdAt": "2025-01-17T14:00:00Z",
        "isRead": true,
        "samples": {
          "count": 4,
          "thumbnails": [
            "https://cdn.tablokiraly.hu/samples/s1_thumb.jpg",
            "https://cdn.tablokiraly.hu/samples/s2_thumb.jpg",
            "https://cdn.tablokiraly.hu/samples/s3_thumb.jpg",
            "https://cdn.tablokiraly.hu/samples/s4_thumb.jpg"
          ]
        },
        "actionUrl": "/samples"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "hasMore": true,
      "nextPage": 2
    }
  }
}
```

**Response 401 (Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**Response 403 (Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "No access to this project"
  }
}
```

---

### GET /projects/{projectId}/feed/new-count

Új (olvasatlan) feed itemek száma - polling-hoz.

**Request:**
```
GET /projects/123/feed/new-count?since=2025-01-19T10:00:00Z
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "count": 3,
    "lastChecked": "2025-01-19T10:30:00Z"
  }
}
```

---

### POST /projects/{projectId}/feed/mark-read

Feed itemek olvasottnak jelölése.

**Request:**
```json
{
  "itemIds": [1, 2, 3]
}
```

**Vagy összes:**
```json
{
  "markAll": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "markedCount": 3
  }
}
```

---

## 🔔 Notification API

### GET /notifications

Értesítések lekérése (dropdown-hoz és full page-hez).

**Request:**
```
GET /notifications?limit=5&unreadOnly=true
```

**Query Parameters:**
| Param | Típus | Kötelező | Default | Leírás |
|-------|-------|----------|---------|--------|
| limit | int | nem | 10 | Max elemszám |
| unreadOnly | bool | nem | false | Csak olvasatlanok |
| page | int | nem | 1 | Oldal szám |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 101,
        "type": "poll_created",
        "title": "Új szavazás indult!",
        "message": "Sablon választás - Szavazz most!",
        "isRead": false,
        "createdAt": "2025-01-19T10:30:00Z",
        "actionUrl": "/voting/45",
        "icon": "poll",
        "imageUrl": null
      },
      {
        "id": 102,
        "type": "forum_reply",
        "title": "Kovács Peti válaszolt",
        "message": "\"Szerintem ez jó ötlet...\"",
        "isRead": false,
        "createdAt": "2025-01-19T09:15:00Z",
        "actionUrl": "/forum/12#post-235",
        "icon": "reply",
        "imageUrl": null
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "currentPage": 1,
      "hasMore": true
    }
  }
}
```

---

### POST /notifications/mark-read

Értesítések olvasottnak jelölése.

**Request:**
```json
{
  "notificationIds": [101, 102]
}
```

**Vagy összes:**
```json
{
  "markAll": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "markedCount": 2,
    "remainingUnread": 1
  }
}
```

---

### DELETE /notifications/{id}

Értesítés törlése.

**Response 204:** No Content

---

## 📢 Announcement API

### GET /projects/{projectId}/announcements/active

Aktív banner hirdetmény lekérése.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "level": "important",
    "message": "Holnap 10:00 fotózás! Fehér ing kell!",
    "showBanner": true,
    "createdAt": "2025-01-18T16:00:00Z",
    "createdBy": {
      "id": 1,
      "name": "Tanár Úr"
    },
    "viewsCount": 18,
    "dismissedByMe": false
  }
}
```

**Response 200 (nincs aktív):**
```json
{
  "success": true,
  "data": null
}
```

---

### POST /projects/{projectId}/announcements

Új hirdetmény létrehozása (csak Kapcsolattartó).

**Request:**
```json
{
  "level": "important",
  "message": "Holnap 10:00 fotózás! Fehér ing kell!",
  "showBanner": true,
  "sendPush": true
}
```

**Level értékek:**
- `important` - Piros (fontos)
- `info` - Sárga (információ)
- `success` - Zöld (siker)

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "level": "important",
    "message": "Holnap 10:00 fotózás! Fehér ing kell!",
    "showBanner": true,
    "createdAt": "2025-01-19T11:00:00Z",
    "createdBy": {
      "id": 1,
      "name": "Tanár Úr"
    },
    "pushSent": true,
    "pushRecipients": 24
  }
}
```

**Response 403 (nem Kapcsolattartó):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only project coordinators can create announcements"
  }
}
```

---

### POST /projects/{projectId}/announcements/{id}/dismiss

Hirdetmény elrejtése (user-nek).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "dismissed": true
  }
}
```

---

### GET /projects/{projectId}/announcements/{id}/stats

Hirdetmény statisztikák (csak Kapcsolattartó).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "viewsCount": 18,
    "dismissCount": 5,
    "pushDelivered": 22,
    "pushOpened": 15,
    "createdAt": "2025-01-18T16:00:00Z"
  }
}
```

---

## 💬 Forum Like API (Feed-hez)

### POST /forum/posts/{postId}/like

Like toggle egy fórum postra.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "postId": 234,
    "isLiked": true,
    "likesCount": 4
  }
}
```

---

## 🔄 Real-time Updates

### WebSocket Connection

```
ws://api.tablokiraly.hu/ws?token={jwt_token}
```

**Subscribe to project feed:**
```json
{
  "action": "subscribe",
  "channel": "project:123:feed"
}
```

**Incoming events:**
```json
{
  "event": "feed:new_item",
  "data": {
    "type": "poll_created",
    "id": 10,
    // ... teljes FeedItem object
  }
}
```

```json
{
  "event": "notification:new",
  "data": {
    "id": 103,
    "type": "forum_mention",
    // ... teljes Notification object
  }
}
```

---

## 📊 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| GET /feed | 60/perc |
| GET /notifications | 60/perc |
| POST /announcements | 10/perc |
| POST /like | 30/perc |
| WS connections | 1/user |

**Response 429 (Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

---

## 🗄️ DTOs (TypeScript)

### Request DTOs

```typescript
// Feed lekérés
interface GetFeedRequest {
  page?: number;
  limit?: number;
  type?: 'all' | 'announcement' | 'poll' | 'forum' | 'samples';
  since?: string; // ISO8601
}

// Hirdetmény létrehozás
interface CreateAnnouncementRequest {
  level: 'important' | 'info' | 'success';
  message: string;
  showBanner: boolean;
  sendPush: boolean;
}

// Olvasottnak jelölés
interface MarkReadRequest {
  itemIds?: number[];
  markAll?: boolean;
}
```

### Response DTOs

```typescript
// API válasz wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Pagination
interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
    nextPage: number | null;
  };
}

// Feed Item
interface FeedItemResponse {
  id: number;
  type: FeedItemType;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;

  // Típus-specifikus
  poll?: PollSummary;
  post?: PostSummary;
  announcement?: AnnouncementSummary;
  samples?: SamplesSummary;
  author?: AuthorSummary;
}

// Notification
interface NotificationResponse {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl: string;
  icon?: string;
  imageUrl?: string;
}
```

---

## ⚠️ Error Codes

| Code | HTTP | Leírás |
|------|------|--------|
| `UNAUTHORIZED` | 401 | Hiányzó vagy érvénytelen token |
| `FORBIDDEN` | 403 | Nincs jogosultság |
| `NOT_FOUND` | 404 | Erőforrás nem található |
| `VALIDATION_ERROR` | 422 | Hibás input |
| `RATE_LIMIT_EXCEEDED` | 429 | Túl sok kérés |
| `INTERNAL_ERROR` | 500 | Szerver hiba |

---

## 📋 Checklist

### Feed
- [ ] GET /projects/{id}/feed
- [ ] GET /projects/{id}/feed/new-count
- [ ] POST /projects/{id}/feed/mark-read

### Notifications
- [ ] GET /notifications
- [ ] POST /notifications/mark-read
- [ ] DELETE /notifications/{id}

### Announcements
- [ ] GET /projects/{id}/announcements/active
- [ ] POST /projects/{id}/announcements
- [ ] POST /projects/{id}/announcements/{id}/dismiss
- [ ] GET /projects/{id}/announcements/{id}/stats

### Forum
- [ ] POST /forum/posts/{id}/like

### Real-time
- [ ] WebSocket connection
- [ ] Feed channel subscription
- [ ] Notification events
