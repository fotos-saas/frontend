# Hiányzók Nyomozása v2 - Backend API

> Verzió: 1.0
> Dátum: 2025-01-19

---

## 📍 Base URL

```
/api/v1
```

---

## 🔍 Missing Users API

### GET /projects/{projectId}/missing

Hiányzó userek listája kategóriánként.

**Request:**
```
GET /projects/123/missing
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "canPoke": true,
    "userRegisteredAt": "2025-01-05T10:00:00Z",
    "dailyPokesUsed": 2,
    "dailyPokeLimit": 5,

    "categories": {
      "voting": {
        "label": "szavazás",
        "icon": "🗳️",
        "count": 8,
        "users": [
          {
            "id": 101,
            "name": "Kiss Béla",
            "registeredAt": "2025-01-10T14:30:00Z",
            "lastActiveAt": "2025-01-16T08:00:00Z",
            "hasLoggedIn": true,
            "pokeable": true,
            "pokeStatus": null,
            "totalPokesReceived": 0
          },
          {
            "id": 102,
            "name": "Tóth Gábor",
            "registeredAt": "2025-01-12T09:00:00Z",
            "lastActiveAt": "2025-01-18T16:30:00Z",
            "hasLoggedIn": true,
            "pokeable": true,
            "pokeStatus": "poked_today",
            "totalPokesReceived": 1
          },
          {
            "id": 103,
            "name": "Szabó Mari",
            "registeredAt": "2025-01-15T11:00:00Z",
            "lastActiveAt": null,
            "hasLoggedIn": false,
            "pokeable": false,
            "pokeReason": "not_logged_in",
            "totalPokesReceived": 0
          }
        ]
      },
      "photoshoot": {
        "label": "fotózás",
        "icon": "📸",
        "count": 3,
        "users": [
          // ...
        ]
      },
      "image_selection": {
        "label": "képválasztás",
        "icon": "🖼️",
        "count": 5,
        "users": [
          // ...
        ]
      }
    }
  }
}
```

**pokeStatus értékek:**
- `null` - bökhető
- `"poked_today"` - ma már bökve
- `"max_pokes_reached"` - 3x bökve összesen

**pokeReason értékek (ha pokeable: false):**
- `"not_logged_in"` - még nem lépett be
- `"is_coordinator"` - tanár/kapcsolattartó
- `"registered_before_you"` - korábban regisztrált mint te
- `"poked_today"` - ma már bökted
- `"max_pokes_reached"` - 3x bökted már

---

## 👉 Pokes API

### POST /pokes

Bökés küldése.

**Request:**
```json
{
  "targetUserId": 101,
  "category": "voting",
  "messageType": "preset",
  "presetKey": "voting_1",
  "customMessage": null
}
```

**VAGY saját üzenettel:**
```json
{
  "targetUserId": 101,
  "category": "voting",
  "messageType": "custom",
  "presetKey": null,
  "customMessage": "holnap lejár légyszi 🙏"
}
```

**Validáció:**
| Mező | Szabály |
|------|---------|
| targetUserId | required, exists:users |
| category | required, in:voting,photoshoot,image_selection |
| messageType | required, in:preset,custom |
| presetKey | required_if:messageType,preset |
| customMessage | required_if:messageType,custom, max:60 |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "targetUser": {
      "id": 101,
      "name": "Kiss Béla"
    },
    "category": "voting",
    "message": {
      "emoji": "💀",
      "text": "szavazz már pls"
    },
    "sentAt": "2025-01-19T10:30:00Z",
    "status": "sent",
    "pushDelivered": true
  }
}
```

**Response 422 (Validation Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot poke this user",
    "details": {
      "targetUserId": ["User has not logged in yet"]
    }
  }
}
```

**Response 429 (Rate Limit):**
```json
{
  "success": false,
  "error": {
    "code": "DAILY_LIMIT_REACHED",
    "message": "Daily poke limit reached (5)",
    "retryAfter": "2025-01-20T00:00:00Z"
  }
}
```

---

### GET /pokes/sent

Küldött bökéseim.

**Request:**
```
GET /pokes/sent?limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "pokes": [
      {
        "id": 456,
        "targetUser": {
          "id": 101,
          "name": "Kiss Béla"
        },
        "category": "voting",
        "message": {
          "emoji": "💀",
          "text": "szavazz már pls"
        },
        "sentAt": "2025-01-19T10:30:00Z",
        "status": "resolved",
        "reaction": "😭",
        "reactedAt": "2025-01-19T11:00:00Z",
        "resolvedAt": "2025-01-19T11:15:00Z"
      },
      {
        "id": 455,
        "targetUser": {
          "id": 102,
          "name": "Tóth Gábor"
        },
        "category": "voting",
        "message": {
          "emoji": "🙏",
          "text": "légyszi 3 katt"
        },
        "sentAt": "2025-01-18T14:00:00Z",
        "status": "pending",
        "reaction": "🫡",
        "reactedAt": "2025-01-18T15:30:00Z",
        "resolvedAt": null
      }
    ],
    "total": 12
  }
}
```

**status értékek:**
- `"sent"` - elküldve, nincs reakció
- `"pending"` - van reakció, de nem csinált semmit
- `"resolved"` - elvégezte a feladatot
- `"expired"` - 7 nap után lejárt

---

### GET /pokes/received

Kapott bökéseim (olvasatlanok).

**Request:**
```
GET /pokes/received?unreadOnly=true
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "pokes": [
      {
        "id": 789,
        "fromUser": {
          "id": 50,
          "name": "Nagy Anna"
        },
        "category": "voting",
        "message": {
          "emoji": "💀",
          "text": "szavazz már pls"
        },
        "sentAt": "2025-01-19T09:00:00Z",
        "isRead": false,
        "myReaction": null,
        "relatedAction": {
          "type": "voting",
          "id": 45,
          "title": "sablon választás",
          "url": "/voting/45"
        }
      }
    ],
    "unreadCount": 1
  }
}
```

---

### POST /pokes/{pokeId}/reaction

Emoji reakció küldése.

**Request:**
```json
{
  "emoji": "🫡"
}
```

**Validáció:**
| Mező | Szabály |
|------|---------|
| emoji | required, in:💀,😭,🫡,❤️,👀 |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "pokeId": 789,
    "reaction": "🫡",
    "reactedAt": "2025-01-19T10:00:00Z"
  }
}
```

---

### POST /pokes/{pokeId}/read

Bökés olvasottnak jelölése.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "pokeId": 789,
    "isRead": true
  }
}
```

---

## 📊 Preset Messages API

### GET /pokes/presets

Előre megírt üzenetek listája.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "voting": [
      { "key": "voting_1", "emoji": "💀", "text": "szavazz már pls" },
      { "key": "voting_2", "emoji": "🙏", "text": "légyszi 3 katt" },
      { "key": "voting_3", "emoji": "⏰", "text": "lejár hamarosan help" },
      { "key": "voting_4", "emoji": "👀", "text": "látunk téged" }
    ],
    "photoshoot": [
      { "key": "photo_1", "emoji": "📸", "text": "pótfotózás when?" },
      { "key": "photo_2", "emoji": "🖼️", "text": "nélküled cringe lesz a tabló" },
      { "key": "photo_3", "emoji": "📅", "text": "írj a fotósnak asap" }
    ],
    "image_selection": [
      { "key": "image_1", "emoji": "🤔", "text": "válassz egyet bármelyik jó" },
      { "key": "image_2", "emoji": "✨", "text": "döntsd el pls" },
      { "key": "image_3", "emoji": "⏰", "text": "lezárul mindjárt" }
    ],
    "general": [
      { "key": "general_1", "emoji": "👋", "text": "hol vagy?" },
      { "key": "general_2", "emoji": "🫠", "text": "hiányzol" },
      { "key": "general_3", "emoji": "🏃", "text": "mindenki vár" }
    ]
  }
}
```

---

## 🔔 WebSocket Events

### Channel

```
user.{userId}.pokes
```

### poke.received

Új bökés érkezett.

```json
{
  "event": "poke.received",
  "data": {
    "id": 789,
    "fromUser": {
      "id": 50,
      "name": "Nagy Anna"
    },
    "message": {
      "emoji": "💀",
      "text": "szavazz már pls"
    },
    "category": "voting",
    "relatedAction": {
      "type": "voting",
      "id": 45,
      "title": "sablon választás",
      "url": "/voting/45"
    }
  }
}
```

### poke.reaction

Reakció érkezett a bökésemre.

```json
{
  "event": "poke.reaction",
  "data": {
    "pokeId": 456,
    "targetUser": {
      "id": 101,
      "name": "Kiss Béla"
    },
    "reaction": "😭",
    "reactedAt": "2025-01-19T11:00:00Z"
  }
}
```

### poke.resolved

A bököttje elvégezte a feladatot.

```json
{
  "event": "poke.resolved",
  "data": {
    "pokeId": 456,
    "targetUser": {
      "id": 101,
      "name": "Kiss Béla"
    },
    "resolvedAction": "voted",
    "resolvedAt": "2025-01-19T11:15:00Z"
  }
}
```

---

## 📱 Push Notification

### Bökés érkezésekor

```json
{
  "title": "👉 tablókirály",
  "body": "Nagy Anna: 💀 \"szavazz már pls\"",
  "data": {
    "type": "poke_received",
    "pokeId": 789
  }
}
```

---

## ⚠️ Error Codes

| Code | HTTP | Leírás |
|------|------|--------|
| `UNAUTHORIZED` | 401 | Nem bejelentkezett |
| `FORBIDDEN` | 403 | Nincs joga bökni |
| `NOT_FOUND` | 404 | User/poke nem található |
| `VALIDATION_ERROR` | 422 | Hibás input |
| `DAILY_LIMIT_REACHED` | 429 | Napi limit elérve |
| `TARGET_NOT_POKEABLE` | 422 | Célpont nem bökhető |
| `ALREADY_POKED_TODAY` | 422 | Ma már bökted |
| `MAX_POKES_REACHED` | 422 | 3x bökted már összesen |

---

## 📋 TypeScript Interfaces

```typescript
// Poke types
interface Poke {
  id: number;
  targetUser: UserSummary;
  fromUser?: UserSummary;
  category: PokeCategory;
  message: PokeMessage;
  sentAt: string;
  status: PokeStatus;
  reaction: EmojiReaction | null;
  reactedAt: string | null;
  resolvedAt: string | null;
  isRead?: boolean;
  relatedAction?: RelatedAction;
}

type PokeCategory = 'voting' | 'photoshoot' | 'image_selection';
type PokeStatus = 'sent' | 'pending' | 'resolved' | 'expired';
type EmojiReaction = '💀' | '😭' | '🫡' | '❤️' | '👀';

interface PokeMessage {
  emoji: string;
  text: string;
}

interface RelatedAction {
  type: string;
  id: number;
  title: string;
  url: string;
}

// Missing user types
interface MissingUser {
  id: number;
  name: string;
  registeredAt: string;
  lastActiveAt: string | null;
  hasLoggedIn: boolean;
  pokeable: boolean;
  pokeStatus: 'poked_today' | 'max_pokes_reached' | null;
  pokeReason?: string;
  totalPokesReceived: number;
}

interface MissingCategory {
  label: string;
  icon: string;
  count: number;
  users: MissingUser[];
}

// Request types
interface CreatePokeRequest {
  targetUserId: number;
  category: PokeCategory;
  messageType: 'preset' | 'custom';
  presetKey?: string;
  customMessage?: string;
}

interface SendReactionRequest {
  emoji: EmojiReaction;
}
```

---

## ✅ API Checklist

### Missing
- [ ] GET /projects/{id}/missing

### Pokes
- [ ] POST /pokes
- [ ] GET /pokes/sent
- [ ] GET /pokes/received
- [ ] POST /pokes/{id}/reaction
- [ ] POST /pokes/{id}/read
- [ ] GET /pokes/presets

### WebSocket
- [ ] poke.received
- [ ] poke.reaction
- [ ] poke.resolved

### Push
- [ ] Bökés notification
