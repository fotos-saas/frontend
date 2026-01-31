# Osztály Naptár - Adatbázis Séma

> Verzió: 1.0
> Dátum: 2025-01-19

---

## 📊 ER Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │    projects     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │
│ name            │  │    │ name            │
│ email           │  │    │ ...             │
└─────────────────┘  │    └────────┬────────┘
                     │             │
                     │             │
                     │             ▼
                     │    ┌─────────────────┐
                     │    │     events      │
                     │    ├─────────────────┤
                     │    │ id (PK)         │
                     └───►│ created_by (FK) │
                          │ project_id (FK) │◄───┐
                          │ icon            │    │
                          │ title           │    │
                          │ date            │    │
                          │ start_time      │    │
                          │ end_time        │    │
                          │ location        │    │
                          │ description     │    │
                          └────────┬────────┘    │
                                   │             │
              ┌────────────────────┼─────────────┘
              │                    │
              ▼                    ▼
┌─────────────────────┐  ┌─────────────────────┐
│  event_attendances  │  │  event_reminders    │
├─────────────────────┤  ├─────────────────────┤
│ id (PK)             │  │ id (PK)             │
│ event_id (FK)       │  │ event_id (FK)       │
│ user_id (FK)        │  │ user_id (FK)        │
│ status              │  │ type                │
│ created_at          │  │ scheduled_at        │
└─────────────────────┘  │ sent_at             │
                         └─────────────────────┘
```

---

## 📋 Táblák

### 1. events

Események fő táblája.

```sql
CREATE TABLE events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,

    -- Alap adatok
    icon VARCHAR(10) NOT NULL DEFAULT '📅',
    title VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NULL,

    -- Helyszín
    location VARCHAR(200) NULL,
    location_address VARCHAR(300) NULL,

    -- Leírás
    description TEXT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Soft delete
    deleted_at TIMESTAMP NULL,

    -- Indexek
    INDEX idx_project_date (project_id, date),
    INDEX idx_date (date),

    -- Foreign keys
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2. event_attendances

Ki megy / érdekel.

```sql
CREATE TABLE event_attendances (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,

    -- Státusz: 'going' vagy 'interested'
    status ENUM('going', 'interested') NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Unique constraint (egy user = egy státusz / esemény)
    UNIQUE KEY unique_attendance (event_id, user_id),

    -- Indexek
    INDEX idx_event_status (event_id, status),
    INDEX idx_user (user_id),

    -- Foreign keys
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3. event_reminders

Emlékeztetők.

```sql
CREATE TABLE event_reminders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,

    -- Típus: '1_day', '1_hour', '30_min'
    type ENUM('1_day', '1_hour', '30_min') NOT NULL,

    -- Mikor küldendő
    scheduled_at TIMESTAMP NOT NULL,

    -- Mikor lett elküldve (NULL = még nem)
    sent_at TIMESTAMP NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint
    UNIQUE KEY unique_reminder (event_id, user_id, type),

    -- Indexek
    INDEX idx_scheduled (scheduled_at, sent_at),

    -- Foreign keys
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 📈 Query Példák

### Események listázása (diák szemszögből)

```sql
SELECT
    e.*,

    -- Attendance számok
    (SELECT COUNT(*) FROM event_attendances WHERE event_id = e.id AND status = 'going') as going_count,
    (SELECT COUNT(*) FROM event_attendances WHERE event_id = e.id AND status = 'interested') as interested_count,

    -- Saját attendance
    ea.status as my_attendance,

    -- Saját reminders (GROUP_CONCAT)
    (SELECT GROUP_CONCAT(type) FROM event_reminders WHERE event_id = e.id AND user_id = :userId) as my_reminders

FROM events e

LEFT JOIN event_attendances ea
    ON e.id = ea.event_id AND ea.user_id = :userId

WHERE e.project_id = :projectId
    AND e.deleted_at IS NULL
    AND e.date >= CURDATE()

ORDER BY e.date ASC, e.start_time ASC;
```

### Attendance toggle

```sql
-- Ha már van → UPDATE vagy DELETE
-- Ha nincs → INSERT

INSERT INTO event_attendances (event_id, user_id, status, created_at, updated_at)
VALUES (:eventId, :userId, :status, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    status = :status,
    updated_at = NOW();

-- Vagy törlés
DELETE FROM event_attendances
WHERE event_id = :eventId AND user_id = :userId;
```

### Emlékeztető beállítás

```sql
-- scheduled_at kiszámítása
-- 1_day: event.date - 1 day + event.start_time
-- 1_hour: event.date + event.start_time - 1 hour

INSERT INTO event_reminders (event_id, user_id, type, scheduled_at)
SELECT
    :eventId,
    :userId,
    :type,
    CASE :type
        WHEN '1_day' THEN TIMESTAMP(DATE_SUB(e.date, INTERVAL 1 DAY), e.start_time)
        WHEN '1_hour' THEN DATE_SUB(TIMESTAMP(e.date, e.start_time), INTERVAL 1 HOUR)
        WHEN '30_min' THEN DATE_SUB(TIMESTAMP(e.date, e.start_time), INTERVAL 30 MINUTE)
    END
FROM events e
WHERE e.id = :eventId
ON DUPLICATE KEY UPDATE
    scheduled_at = VALUES(scheduled_at);
```

### Esedékes emlékeztetők (cron job)

```sql
SELECT
    er.*,
    e.title as event_title,
    e.date as event_date,
    e.start_time as event_time,
    e.location as event_location,
    u.name as user_name,
    -- push token from notification_settings
    ns.onesignal_player_id

FROM event_reminders er

JOIN events e ON er.event_id = e.id
JOIN users u ON er.user_id = u.id
LEFT JOIN notification_settings ns ON er.user_id = ns.user_id

WHERE er.sent_at IS NULL
    AND er.scheduled_at <= NOW()
    AND e.deleted_at IS NULL
    AND e.date >= CURDATE();
```

### Attendance statisztika

```sql
SELECT
    COUNT(CASE WHEN ea.status = 'going' THEN 1 END) as going,
    COUNT(CASE WHEN ea.status = 'interested' THEN 1 END) as interested,
    (
        SELECT COUNT(*)
        FROM project_users pu
        WHERE pu.project_id = e.project_id
    ) - COUNT(ea.id) as not_responded

FROM events e

LEFT JOIN event_attendances ea ON e.id = ea.event_id

WHERE e.id = :eventId

GROUP BY e.id;
```

### Résztvevők listája (kapcsolattartónak)

```sql
-- Going
SELECT u.id, u.name, ea.created_at as attended_at
FROM event_attendances ea
JOIN users u ON ea.user_id = u.id
WHERE ea.event_id = :eventId AND ea.status = 'going'
ORDER BY ea.created_at DESC;

-- Interested
SELECT u.id, u.name, ea.created_at as attended_at
FROM event_attendances ea
JOIN users u ON ea.user_id = u.id
WHERE ea.event_id = :eventId AND ea.status = 'interested'
ORDER BY ea.created_at DESC;

-- Not responded
SELECT u.id, u.name
FROM project_users pu
JOIN users u ON pu.user_id = u.id
WHERE pu.project_id = :projectId
    AND u.id NOT IN (
        SELECT user_id FROM event_attendances WHERE event_id = :eventId
    )
ORDER BY u.name ASC;
```

---

## 🔄 Migrációk

```bash
# 1. Events tábla
php artisan make:migration create_events_table

# 2. Attendances tábla
php artisan make:migration create_event_attendances_table

# 3. Reminders tábla
php artisan make:migration create_event_reminders_table
```

### Laravel Migration: events

```php
public function up(): void
{
    Schema::create('events', function (Blueprint $table) {
        $table->id();
        $table->foreignId('project_id')->constrained()->cascadeOnDelete();
        $table->foreignId('created_by')->constrained('users')->restrictOnDelete();

        $table->string('icon', 10)->default('📅');
        $table->string('title', 100);
        $table->date('date');
        $table->time('start_time');
        $table->time('end_time')->nullable();

        $table->string('location', 200)->nullable();
        $table->string('location_address', 300)->nullable();

        $table->text('description')->nullable();

        $table->timestamps();
        $table->softDeletes();

        $table->index(['project_id', 'date']);
        $table->index('date');
    });
}
```

### Laravel Migration: event_attendances

```php
public function up(): void
{
    Schema::create('event_attendances', function (Blueprint $table) {
        $table->id();
        $table->foreignId('event_id')->constrained()->cascadeOnDelete();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();

        $table->enum('status', ['going', 'interested']);

        $table->timestamps();

        $table->unique(['event_id', 'user_id']);
        $table->index(['event_id', 'status']);
    });
}
```

### Laravel Migration: event_reminders

```php
public function up(): void
{
    Schema::create('event_reminders', function (Blueprint $table) {
        $table->id();
        $table->foreignId('event_id')->constrained()->cascadeOnDelete();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();

        $table->enum('type', ['1_day', '1_hour', '30_min']);
        $table->timestamp('scheduled_at');
        $table->timestamp('sent_at')->nullable();

        $table->timestamp('created_at')->useCurrent();

        $table->unique(['event_id', 'user_id', 'type']);
        $table->index(['scheduled_at', 'sent_at']);
    });
}
```

---

## 📊 Becsült Méret

Feltételezés: 100 projekt, 30 user/projekt, 20 esemény/projekt

| Tábla | Sorok | Méret |
|-------|-------|-------|
| `events` | ~2,000 | ~500 KB |
| `event_attendances` | ~40,000 | ~2 MB |
| `event_reminders` | ~10,000 | ~500 KB |

**Összesen: ~3 MB** (kis méret)

---

## ✅ Checklist

### Táblák
- [ ] events
- [ ] event_attendances
- [ ] event_reminders

### Indexek
- [ ] project_date index
- [ ] event_status index
- [ ] scheduled reminder index

### Migrációk
- [ ] Migráció fájlok létrehozva
- [ ] Seed data (test)
- [ ] Rollback tesztelve

### Models
- [ ] Event model
- [ ] EventAttendance model
- [ ] EventReminder model
- [ ] Relationships defined
