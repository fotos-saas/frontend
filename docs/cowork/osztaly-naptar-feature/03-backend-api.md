# Osztály Naptár - Backend API Specifikáció

> Verzió: 1.0
> Dátum: 2025-01-19

---

## 📍 Base URL

```
/api/v1
```

---

## 📅 Events API

### GET /projects/{projectId}/events

Események listázása.

**Request:**
```
GET /projects/123/events?from=2025-01-01&to=2025-12-31
```

**Query Parameters:**
| Param | Típus | Kötelező | Default | Leírás |
|-------|-------|----------|---------|--------|
| from | date | nem | today | Kezdő dátum (YYYY-MM-DD) |
| to | date | nem | +1 year | Befejező dátum |
| includePast | bool | nem | false | Múltbeli események is |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "icon": "📸",
        "title": "Tabló fotózás",
        "date": "2025-01-31",
        "startTime": "10:00",
        "endTime": "12:00",
        "location": "Iskolai tornaterem",
        "locationAddress": null,
        "description": "Fehér ing és sötét nadrág szükséges.",
        "createdBy": {
          "id": 1,
          "name": "Kovács Tanár Úr"
        },
        "createdAt": "2025-01-10T14:30:00Z",
        "attendance": {
          "going": 22,
          "interested": 3,
          "notResponded": 5
        },
        "myAttendance": "going",
        "myReminders": ["1_day"]
      },
      {
        "id": 2,
        "icon": "💃",
        "title": "Szalagavató",
        "date": "2025-02-14",
        "startTime": "18:00",
        "endTime": "23:00",
        "location": "Városi Művelődési Ház",
        "locationAddress": "Kossuth tér 5, Budapest 1054",
        "description": "Öltözet: fiúk öltöny, lányok estélyi...",
        "createdBy": {
          "id": 1,
          "name": "Kovács Tanár Úr"
        },
        "createdAt": "2025-01-05T10:00:00Z",
        "attendance": {
          "going": 25,
          "interested": 2,
          "notResponded": 3
        },
        "myAttendance": null,
        "myReminders": []
      }
    ],
    "total": 2
  }
}
```

---

### GET /events/{eventId}

Egy esemény részletei.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "icon": "💃",
    "title": "Szalagavató",
    "date": "2025-02-14",
    "startTime": "18:00",
    "endTime": "23:00",
    "location": "Városi Művelődési Ház",
    "locationAddress": "Kossuth tér 5, Budapest 1054",
    "description": "Öltözet: fiúk öltöny, lányok estélyi. Érkezés 17:30-kor a hátsó bejáratnál. Szülők 19:00-tól csatlakozhatnak.",
    "createdBy": {
      "id": 1,
      "name": "Kovács Tanár Úr"
    },
    "createdAt": "2025-01-05T10:00:00Z",
    "updatedAt": "2025-01-12T09:15:00Z",
    "attendance": {
      "going": 25,
      "interested": 2,
      "notResponded": 3
    },
    "myAttendance": "interested",
    "myReminders": ["1_day", "1_hour"],
    "attendees": {
      "going": [
        { "id": 10, "name": "Kovács Péter" },
        { "id": 11, "name": "Nagy Anna" }
      ],
      "interested": [
        { "id": 12, "name": "Tóth Gábor" }
      ],
      "notResponded": [
        { "id": 13, "name": "Fekete Kata" }
      ]
    }
  }
}
```

**Megjegyzés:** `attendees` lista csak kapcsolattartónak jön vissza.

---

### POST /projects/{projectId}/events

Új esemény létrehozása (csak Kapcsolattartó).

**Request:**
```json
{
  "icon": "💃",
  "title": "Szalagavató",
  "date": "2025-02-14",
  "startTime": "18:00",
  "endTime": "23:00",
  "location": "Városi Művelődési Ház",
  "locationAddress": "Kossuth tér 5, Budapest 1054",
  "description": "Öltözet: fiúk öltöny, lányok estélyi.",
  "sendPushNow": true,
  "addToFeed": true
}
```

**Validáció:**
| Mező | Szabály |
|------|---------|
| icon | required, max 4 char (emoji) |
| title | required, max 100 char |
| date | required, date, after_or_equal:today |
| startTime | required, time format HH:mm |
| endTime | nullable, time, after:startTime |
| location | nullable, max 200 char |
| locationAddress | nullable, max 300 char |
| description | nullable, max 500 char |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "icon": "💃",
    "title": "Szalagavató",
    "date": "2025-02-14",
    "startTime": "18:00",
    "endTime": "23:00",
    "location": "Városi Művelődési Ház",
    "locationAddress": "Kossuth tér 5, Budapest 1054",
    "description": "Öltözet: fiúk öltöny, lányok estélyi.",
    "createdBy": {
      "id": 1,
      "name": "Kovács Tanár Úr"
    },
    "createdAt": "2025-01-19T15:30:00Z",
    "pushSent": true,
    "pushRecipients": 28,
    "feedItemId": 156
  }
}
```

**Response 403:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only project coordinators can create events"
  }
}
```

---

### PUT /events/{eventId}

Esemény módosítása (csak Kapcsolattartó).

**Request:**
```json
{
  "icon": "💃",
  "title": "Szalagavató 2025",
  "date": "2025-02-14",
  "startTime": "18:00",
  "endTime": "23:30",
  "location": "Városi Művelődési Ház",
  "locationAddress": "Kossuth tér 5, Budapest 1054",
  "description": "Öltözet: fiúk öltöny, lányok estélyi. FRISSÍTVE: Kezdés 18:00!",
  "notifyAttendees": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "icon": "💃",
    "title": "Szalagavató 2025",
    // ... frissített mezők
    "updatedAt": "2025-01-19T16:00:00Z",
    "notificationsSent": 27
  }
}
```

---

### DELETE /events/{eventId}

Esemény törlése (csak Kapcsolattartó).

**Request:**
```
DELETE /events/3?notifyAttendees=true
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "notificationsSent": 27
  }
}
```

---

## 👥 Attendance API

### POST /events/{eventId}/attendance

Részvétel jelzése.

**Request:**
```json
{
  "status": "going"
}
```

**Status értékek:**
- `going` - Megyek
- `interested` - Érdekel

**Response 200:**
```json
{
  "success": true,
  "data": {
    "eventId": 2,
    "status": "going",
    "attendance": {
      "going": 26,
      "interested": 1,
      "notResponded": 3
    }
  }
}
```

---

### DELETE /events/{eventId}/attendance

Részvétel visszavonása.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "eventId": 2,
    "status": null,
    "attendance": {
      "going": 25,
      "interested": 2,
      "notResponded": 3
    }
  }
}
```

---

### GET /events/{eventId}/attendees

Résztvevők listája (csak Kapcsolattartó).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "going": [
      { "id": 10, "name": "Kovács Péter", "attendedAt": "2025-01-15T10:30:00Z" },
      { "id": 11, "name": "Nagy Anna", "attendedAt": "2025-01-15T11:00:00Z" }
    ],
    "interested": [
      { "id": 12, "name": "Tóth Gábor", "attendedAt": "2025-01-16T09:00:00Z" }
    ],
    "notResponded": [
      { "id": 13, "name": "Fekete Kata" },
      { "id": 14, "name": "Molnár Ádám" }
    ],
    "summary": {
      "going": 25,
      "interested": 2,
      "notResponded": 3,
      "total": 30
    }
  }
}
```

---

## 🔔 Reminder API

### POST /events/{eventId}/reminder

Emlékeztető beállítása.

**Request:**
```json
{
  "type": "1_day"
}
```

**Type értékek:**
- `1_day` - 1 nappal előtte
- `1_hour` - 1 órával előtte
- `30_min` - 30 perccel előtte

**Response 200:**
```json
{
  "success": true,
  "data": {
    "eventId": 2,
    "reminders": ["1_day"],
    "scheduledAt": "2025-02-13T18:00:00Z"
  }
}
```

---

### DELETE /events/{eventId}/reminder/{type}

Emlékeztető törlése.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "eventId": 2,
    "reminders": []
  }
}
```

---

## 📊 WebSocket Events

### Channels

```
project.{projectId}.events
```

### Events

**event.created**
```json
{
  "event": "event.created",
  "data": {
    "id": 3,
    "icon": "💃",
    "title": "Szalagavató",
    // ... full event object
  }
}
```

**event.updated**
```json
{
  "event": "event.updated",
  "data": {
    "id": 3,
    "changes": {
      "title": "Szalagavató 2025",
      "endTime": "23:30"
    }
  }
}
```

**event.deleted**
```json
{
  "event": "event.deleted",
  "data": {
    "id": 3
  }
}
```

**event.attendance_changed**
```json
{
  "event": "event.attendance_changed",
  "data": {
    "eventId": 2,
    "attendance": {
      "going": 26,
      "interested": 1,
      "notResponded": 3
    }
  }
}
```

---

## ⚠️ Error Codes

| Code | HTTP | Leírás |
|------|------|--------|
| `UNAUTHORIZED` | 401 | Hiányzó vagy érvénytelen token |
| `FORBIDDEN` | 403 | Nincs jogosultság (nem kapcsolattartó) |
| `NOT_FOUND` | 404 | Esemény nem található |
| `VALIDATION_ERROR` | 422 | Hibás input |
| `PAST_DATE` | 422 | Múltbeli dátum nem engedélyezett |

---

## 📋 TypeScript Interfaces

```typescript
// Event types
interface Event {
  id: number;
  icon: string;
  title: string;
  date: string;           // YYYY-MM-DD
  startTime: string;      // HH:mm
  endTime: string | null; // HH:mm
  location: string | null;
  locationAddress: string | null;
  description: string | null;
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string | null;
  attendance: AttendanceSummary;
  myAttendance: AttendanceStatus | null;
  myReminders: ReminderType[];
}

interface AttendanceSummary {
  going: number;
  interested: number;
  notResponded: number;
}

type AttendanceStatus = 'going' | 'interested';
type ReminderType = '1_day' | '1_hour' | '30_min';

// Request types
interface CreateEventRequest {
  icon: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  locationAddress?: string;
  description?: string;
  sendPushNow?: boolean;
  addToFeed?: boolean;
}

interface UpdateEventRequest extends Partial<CreateEventRequest> {
  notifyAttendees?: boolean;
}

interface SetAttendanceRequest {
  status: AttendanceStatus;
}

interface SetReminderRequest {
  type: ReminderType;
}
```

---

## ✅ API Checklist

### Events
- [ ] GET /projects/{id}/events
- [ ] GET /events/{id}
- [ ] POST /projects/{id}/events
- [ ] PUT /events/{id}
- [ ] DELETE /events/{id}

### Attendance
- [ ] POST /events/{id}/attendance
- [ ] DELETE /events/{id}/attendance
- [ ] GET /events/{id}/attendees

### Reminders
- [ ] POST /events/{id}/reminder
- [ ] DELETE /events/{id}/reminder/{type}

### WebSocket
- [ ] event.created
- [ ] event.updated
- [ ] event.deleted
- [ ] event.attendance_changed
