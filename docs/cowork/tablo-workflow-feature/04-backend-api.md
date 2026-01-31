# Tabló Workflow - Backend API Specifikáció

> Laravel backend API végpontok a tabló workflow-hoz

---

## 📋 Áttekintés

| Method | Endpoint | Leírás |
|--------|----------|--------|
| GET | `/api/tablo/validate/{token}` | Token validálás + teljes state |
| GET | `/api/tablo/progress/{token}` | Progress lekérése |
| POST | `/api/tablo/progress/{token}/claim` | Claimed képek mentése |
| POST | `/api/tablo/progress/{token}/register` | Guest regisztráció |
| POST | `/api/tablo/progress/{token}/retouch` | Retouch képek mentése |
| POST | `/api/tablo/progress/{token}/tablo` | Tablókép mentése |
| POST | `/api/tablo/progress/{token}/complete` | Workflow lezárása |

---

## 🔐 Autentikáció

A tablo workflow **token-alapú** autentikációt használ (nem JWT):
- A token a share link-ben érkezik
- Nincs szükség belépésre a workflow indításához
- Guest user-ek regisztrálhatnak a folyamat közben

```
Header: X-Tablo-Token: {token}
```

Vagy URL parameter:
```
/api/tablo/validate/{token}
```

---

## 📝 Endpoint Részletek

### 1. Token Validálás

**Endpoint**: `GET /api/tablo/validate/{token}`

**Leírás**: Validálja a tokent és visszaadja a teljes workflow state-et.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "workSession": {
      "id": 123,
      "name": "12/A Osztály Tablófotózás",
      "max_retouch_photos": 5,
      "is_tablo_mode": true,
      "album_id": 456
    },
    "album": {
      "id": 456,
      "name": "Tablófotók 2024",
      "photo_count": 48
    },
    "photos": [
      {
        "id": 1,
        "album_id": 456,
        "filename": "IMG_0001.jpg",
        "thumbnail_url": "https://cdn.example.com/thumbs/1.jpg",
        "preview_url": "https://cdn.example.com/preview/1.jpg",
        "full_url": "https://cdn.example.com/full/1.jpg",
        "width": 800,
        "height": 1067
      }
    ],
    "progress": {
      "id": 789,
      "work_session_id": 123,
      "user_id": null,
      "current_step": "claiming",
      "steps_data": null,
      "completed_at": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    },
    "user": null
  }
}
```

**Response** (404 Not Found - Invalid token):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "A megadott link érvénytelen vagy lejárt."
  }
}
```

**Response** (410 Gone - Expired session):
```json
{
  "success": false,
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "A fotózás határideje lejárt."
  }
}
```

---

### 2. Progress Lekérése

**Endpoint**: `GET /api/tablo/progress/{token}`

**Leírás**: Csak a progress objektumot adja vissza (lightweight).

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "progress": {
      "id": 789,
      "work_session_id": 123,
      "user_id": 100,
      "current_step": "retouch",
      "steps_data": {
        "claimed_photo_ids": [1, 3, 5, 7, 9],
        "retouch_photo_ids": [],
        "tablo_photo_id": null
      },
      "completed_at": null
    }
  }
}
```

---

### 3. Claimed Képek Mentése

**Endpoint**: `POST /api/tablo/progress/{token}/claim`

**Request Body**:
```json
{
  "photo_ids": [1, 3, 5, 7, 9]
}
```

**Validáció**:
- `photo_ids` kötelező, array
- `photo_ids.*` létező photo ID a session album-jából
- Minimum 1 kép kötelező

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "progress": {
      "current_step": "registration",
      "steps_data": {
        "claimed_photo_ids": [1, 3, 5, 7, 9]
      }
    }
  }
}
```

**Response** (422 Validation Error):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Legalább 1 képet ki kell választanod.",
    "details": {
      "photo_ids": ["A photo_ids mező kötelező."]
    }
  }
}
```

---

### 4. Guest Regisztráció

**Endpoint**: `POST /api/tablo/progress/{token}/register`

**Request Body**:
```json
{
  "name": "Kovács Anna",
  "email": "anna@example.com",
  "phone": "+36301234567"
}
```

**Validáció**:
- `name` kötelező, string, 2-100 karakter
- `email` kötelező, valid email, unique (soft)
- `phone` opcionális, string, valid magyar telefonszám

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 100,
      "name": "Kovács Anna",
      "email": "anna@example.com",
      "phone": "+36301234567",
      "is_registered": true
    },
    "progress": {
      "current_step": "retouch",
      "user_id": 100
    }
  }
}
```

**Response** (422 - Email már használatban):
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Ez az e-mail cím már regisztrálva van. Kérlek jelentkezz be!",
    "login_url": "/login?redirect=/tablo/{token}"
  }
}
```

**Backend Logic**:
```php
// TabloController.php
public function register(Request $request, string $token)
{
    $validated = $request->validate([
        'name' => 'required|string|min:2|max:100',
        'email' => 'required|email',
        'phone' => 'nullable|string|regex:/^\+?36[0-9]{9}$/'
    ]);

    $progress = TabloProgress::whereToken($token)->firstOrFail();

    // Check existing user
    $existingUser = User::where('email', $validated['email'])->first();

    if ($existingUser && $existingUser->password !== null) {
        // Registered user - require login
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'EMAIL_EXISTS',
                'message' => 'Ez az e-mail cím már regisztrálva van.',
                'login_url' => "/login?redirect=/tablo/{$token}"
            ]
        ], 422);
    }

    // Create or update guest user
    $user = $existingUser ?? User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'phone' => $validated['phone'] ?? null,
        'type' => 'guest'
    ]);

    // Update progress
    $progress->update([
        'user_id' => $user->id,
        'current_step' => 'retouch'
    ]);

    // Send confirmation email
    Mail::to($user)->queue(new TabloRegistrationConfirmation($progress));

    return response()->json([
        'success' => true,
        'data' => [
            'user' => new UserResource($user),
            'progress' => new TabloProgressResource($progress)
        ]
    ]);
}
```

---

### 5. Retouch Képek Mentése

**Endpoint**: `POST /api/tablo/progress/{token}/retouch`

**Request Body**:
```json
{
  "photo_ids": [1, 3, 5]
}
```

**Validáció**:
- `photo_ids` kötelező, array
- `photo_ids.*` csak claimed képek közül
- **Minimum 1 kép kötelező** (nincs "nem kérek" opció!)
- Maximum: `workSession.max_retouch_photos`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "progress": {
      "current_step": "tablo",
      "steps_data": {
        "claimed_photo_ids": [1, 3, 5, 7, 9],
        "retouch_photo_ids": [1, 3, 5]
      }
    }
  }
}
```

**Response** (422 - Túl sok kép):
```json
{
  "success": false,
  "error": {
    "code": "RETOUCH_LIMIT_EXCEEDED",
    "message": "Maximum 5 képet választhatsz retusálásra.",
    "max_allowed": 5,
    "selected": 7
  }
}
```

**Response** (422 - Minimum 1 kötelező):
```json
{
  "success": false,
  "error": {
    "code": "RETOUCH_MINIMUM_REQUIRED",
    "message": "Legalább 1 képet ki kell választanod retusálásra."
  }
}
```

**Backend Validation**:
```php
// TabloController.php
public function saveRetouch(Request $request, string $token)
{
    $progress = TabloProgress::whereToken($token)->firstOrFail();
    $workSession = $progress->workSession;

    $validated = $request->validate([
        'photo_ids' => 'required|array|min:1',
        'photo_ids.*' => [
            'required',
            'integer',
            Rule::in($progress->steps_data['claimed_photo_ids'] ?? [])
        ]
    ]);

    // Check max limit
    $maxRetouch = $workSession->max_retouch_photos;
    if (count($validated['photo_ids']) > $maxRetouch) {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'RETOUCH_LIMIT_EXCEEDED',
                'message' => "Maximum {$maxRetouch} képet választhatsz retusálásra.",
                'max_allowed' => $maxRetouch,
                'selected' => count($validated['photo_ids'])
            ]
        ], 422);
    }

    // Update progress
    $stepsData = $progress->steps_data ?? [];
    $stepsData['retouch_photo_ids'] = $validated['photo_ids'];

    $progress->update([
        'steps_data' => $stepsData,
        'current_step' => 'tablo'
    ]);

    return response()->json([
        'success' => true,
        'data' => ['progress' => new TabloProgressResource($progress)]
    ]);
}
```

---

### 6. Tablókép Mentése

**Endpoint**: `POST /api/tablo/progress/{token}/tablo`

**Request Body**:
```json
{
  "photo_id": 5
}
```

**Validáció**:
- `photo_id` kötelező, integer
- `photo_id` csak claimed képek közül
- Pontosan 1 kép (nem array!)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "progress": {
      "current_step": "completed",
      "steps_data": {
        "claimed_photo_ids": [1, 3, 5, 7, 9],
        "retouch_photo_ids": [1, 3, 5],
        "tablo_photo_id": 5
      }
    }
  }
}
```

---

### 7. Workflow Lezárása

**Endpoint**: `POST /api/tablo/progress/{token}/complete`

**Request Body**: üres (opcionális feedback)
```json
{
  "feedback": "Köszönöm a lehetőséget!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "progress": {
      "current_step": "completed",
      "completed_at": "2024-01-15T14:30:00Z"
    },
    "summary": {
      "claimed_photos": 5,
      "retouch_photos": 3,
      "tablo_photo": {
        "id": 5,
        "thumbnail_url": "https://cdn.example.com/thumbs/5.jpg"
      },
      "next_steps": "A fotós értesítést kap a kiválasztásról. Az elkészült tablót hamarosan megkapod!",
      "order_photos_url": "/gallery?session=123"
    }
  }
}
```

**Backend Logic**:
```php
public function complete(Request $request, string $token)
{
    $progress = TabloProgress::whereToken($token)->firstOrFail();

    // Validate all steps completed
    $stepsData = $progress->steps_data ?? [];

    if (empty($stepsData['claimed_photo_ids'])) {
        return $this->errorResponse('INCOMPLETE_WORKFLOW', 'Nincs kiválasztott kép.');
    }

    if (empty($stepsData['retouch_photo_ids'])) {
        return $this->errorResponse('INCOMPLETE_WORKFLOW', 'Nem választottál retusálandó képet.');
    }

    if (empty($stepsData['tablo_photo_id'])) {
        return $this->errorResponse('INCOMPLETE_WORKFLOW', 'Nem választottál tablóképet.');
    }

    // Mark as completed
    $progress->update([
        'current_step' => 'completed',
        'completed_at' => now()
    ]);

    // Notify photographer
    $photographer = $progress->workSession->photographer;
    $photographer->notify(new TabloSelectionCompleted($progress));

    // Log activity
    activity()
        ->performedOn($progress)
        ->causedBy($progress->user)
        ->log('Tabló workflow befejezve');

    return response()->json([
        'success' => true,
        'data' => [
            'progress' => new TabloProgressResource($progress),
            'summary' => $this->buildSummary($progress)
        ]
    ]);
}
```

---

## 🗃️ Database Schema

### tablo_progress tábla

```sql
CREATE TABLE tablo_progress (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    work_session_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    current_step ENUM('claiming', 'registration', 'retouch', 'tablo', 'completed') DEFAULT 'claiming',
    steps_data JSON NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (work_session_id) REFERENCES work_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_token (token),
    INDEX idx_work_session (work_session_id),
    INDEX idx_current_step (current_step)
);
```

### steps_data JSON struktúra

```json
{
  "claimed_photo_ids": [1, 3, 5, 7, 9],
  "retouch_photo_ids": [1, 3, 5],
  "tablo_photo_id": 5
}
```

### work_sessions tábla bővítés

```sql
ALTER TABLE work_sessions
ADD COLUMN max_retouch_photos INT UNSIGNED DEFAULT 5,
ADD COLUMN is_tablo_mode BOOLEAN DEFAULT FALSE;
```

---

## 🔔 Events & Notifications

### Events

```php
// app/Events/TabloWorkflowCompleted.php
class TabloWorkflowCompleted
{
    public function __construct(
        public TabloProgress $progress
    ) {}
}
```

### Listeners

```php
// app/Listeners/NotifyPhotographerOnTabloComplete.php
class NotifyPhotographerOnTabloComplete
{
    public function handle(TabloWorkflowCompleted $event): void
    {
        $photographer = $event->progress->workSession->photographer;

        $photographer->notify(new TabloSelectionNotification(
            studentName: $event->progress->user->name,
            tabloPhotoId: $event->progress->steps_data['tablo_photo_id'],
            retouchPhotoIds: $event->progress->steps_data['retouch_photo_ids']
        ));
    }
}
```

### Email Templates

```php
// resources/views/emails/tablo/selection-completed.blade.php
@component('mail::message')
# Új tablókép kiválasztás!

**{{ $studentName }}** befejezte a tablókép kiválasztását.

**Tablókép**: #{{ $tabloPhotoId }}
**Retusálandó képek**: {{ count($retouchPhotoIds) }} db

@component('mail::button', ['url' => $adminUrl])
Megtekintés az adminban
@endcomponent

Üdvözlettel,
{{ config('app.name') }}
@endcomponent
```

---

## 🧪 API Tesztelés

### Postman Collection

```json
{
  "info": {
    "name": "Tablo Workflow API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8000/api"
    },
    {
      "key": "token",
      "value": "test-token-12345"
    }
  ],
  "item": [
    {
      "name": "1. Validate Token",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/tablo/validate/{{token}}"
      }
    },
    {
      "name": "2. Save Claims",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/tablo/progress/{{token}}/claim",
        "body": {
          "mode": "raw",
          "raw": "{\"photo_ids\": [1, 3, 5, 7, 9]}",
          "options": { "raw": { "language": "json" } }
        }
      }
    }
  ]
}
```

### PHPUnit Tests

```php
// tests/Feature/TabloWorkflowTest.php
class TabloWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_validate_token_returns_full_state(): void
    {
        $workSession = WorkSession::factory()
            ->has(Album::factory()->has(Photo::factory()->count(10)))
            ->create(['is_tablo_mode' => true]);

        $progress = TabloProgress::factory()->create([
            'work_session_id' => $workSession->id,
            'token' => 'valid-token'
        ]);

        $response = $this->getJson('/api/tablo/validate/valid-token');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'workSession',
                    'album',
                    'photos',
                    'progress',
                    'user'
                ]
            ]);
    }

    public function test_claim_requires_minimum_one_photo(): void
    {
        $progress = TabloProgress::factory()->create();

        $response = $this->postJson(
            "/api/tablo/progress/{$progress->token}/claim",
            ['photo_ids' => []]
        );

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => ['code' => 'VALIDATION_ERROR']
            ]);
    }

    public function test_retouch_enforces_max_limit(): void
    {
        $workSession = WorkSession::factory()->create([
            'max_retouch_photos' => 3
        ]);

        $progress = TabloProgress::factory()->create([
            'work_session_id' => $workSession->id,
            'steps_data' => ['claimed_photo_ids' => [1, 2, 3, 4, 5, 6, 7]]
        ]);

        $response = $this->postJson(
            "/api/tablo/progress/{$progress->token}/retouch",
            ['photo_ids' => [1, 2, 3, 4, 5]] // 5 > max 3
        );

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => ['code' => 'RETOUCH_LIMIT_EXCEEDED']
            ]);
    }
}
```

---

## 🚀 Deployment Checklist

- [ ] Migration futtatva (`tablo_progress` tábla)
- [ ] `work_sessions` tábla bővítve
- [ ] Routes regisztrálva (`routes/api.php`)
- [ ] Rate limiting beállítva (60/perc/token)
- [ ] CORS engedélyezve a frontend domain-re
- [ ] Email templates létrehozva
- [ ] Queue worker fut (notifications)
- [ ] Logging beállítva (activity log)
