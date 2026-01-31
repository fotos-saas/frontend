# Értesítési Központ - Adatbázis Séma

> Verzió: 1.0
> Dátum: 2025-01-19

---

## ER Diagram

```
┌─────────────────┐       ┌─────────────────────────┐
│     users       │       │      notifications      │
├─────────────────┤       ├─────────────────────────┤
│ id (PK)         │──┐    │ id (PK)                 │
│ name            │  │    │ user_id (FK)            │←─┐
│ email           │  │    │ type                    │  │
│ ...             │  │    │ title                   │  │
└─────────────────┘  │    │ message                 │  │
                     │    │ emoji                   │  │
                     │    │ is_read                 │  │
                     │    │ read_at                 │  │
                     │    │ action_url              │  │
                     │    │ metadata                │  │
                     │    │ created_at              │  │
                     │    └─────────────────────────┘  │
                     │                                 │
                     └─────────────────────────────────┘

┌─────────────────────────────────┐
│   user_notification_settings    │
├─────────────────────────────────┤
│ id (PK)                         │
│ user_id (FK) UNIQUE             │
│ push_enabled                    │
│ mode                            │
│ categories (JSON)               │
│ quiet_hours_enabled             │
│ quiet_hours_start               │
│ quiet_hours_end                 │
│ created_at                      │
│ updated_at                      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│      push_notification_logs     │
├─────────────────────────────────┤
│ id (PK)                         │
│ user_id (FK)                    │
│ notification_id (FK)            │
│ sent_at                         │
│ delivered                       │
│ clicked                         │
│ clicked_at                      │
└─────────────────────────────────┘
```

---

## Táblák

### 1. notifications

Fő értesítések tábla.

```sql
-- PostgreSQL 18 szintaxis
-- Megjegyzés: PostgreSQL 18+ esetén használhatsz UUID v7-et is (sortable, timestamp-based):
-- id UUID PRIMARY KEY DEFAULT uuidv7(),
-- De BIGSERIAL is teljesen jó, ha nem publikus azonosító!

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,

    -- Kapcsolat
    user_id BIGINT NOT NULL,

    -- Típus
    type VARCHAR(50) NOT NULL,
    -- Lehetséges értékek:
    -- 'poke_received', 'poke_reaction', 'vote_created', 'vote_ending',
    -- 'vote_closed', 'mention', 'reply', 'announcement',
    -- 'event_reminder', 'samples_added'

    -- Tartalom
    title VARCHAR(100) NOT NULL,
    message VARCHAR(255) NULL,
    emoji VARCHAR(10) NOT NULL DEFAULT '🔔',

    -- Állapot
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ NULL,

    -- Action
    action_url VARCHAR(255) NULL,

    -- Extra adatok (JSONB - PostgreSQL natív JSON típus)
    metadata JSONB NULL,
    -- Példák:
    -- poke_received: {"fromUser": {"id": 1, "name": "Kiss Béla"}, "pokeId": 123}
    -- vote_created: {"votingId": 456, "votingTitle": "Sablon választás"}
    -- announcement: {"announcementId": 789, "level": "important"}

    -- Timestamps (TIMESTAMPTZ - timezone aware!)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Soft delete (opcionális, ha user törölheti)
    deleted_at TIMESTAMPTZ NULL,

    -- Foreign key
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexek külön (PostgreSQL stílus)
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- GIN index JSONB metadata-hoz (ha keresel benne: WHERE metadata @> '{"votingId": 123}')
CREATE INDEX idx_notifications_metadata ON notifications USING GIN(metadata);

-- PostgreSQL Trigger: updated_at automatikus frissítése
-- Megjegyzés: Laravel már kezeli ezt app szinten, de ha tisztán SQL-ben dolgozol:
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. user_notification_settings

User értesítési beállítások.

```sql
-- PostgreSQL szintaxis
-- V1: Egyszerűsített (normal/quiet mód)

CREATE TABLE user_notification_settings (
    id BIGSERIAL PRIMARY KEY,

    -- Kapcsolat (1:1 user-rel)
    user_id BIGINT NOT NULL UNIQUE,

    -- Push master switch
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Mode (V1: normal/quiet, V2-ben bővíthető: chill/active/all/custom)
    mode VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (mode IN ('normal', 'quiet')),

    -- Kategóriák (custom mode-hoz - V2-ben használatos)
    categories JSONB NOT NULL DEFAULT '{"votes":true,"pokes":true,"mentions":true,"announcements":true,"replies":true,"events":true,"samples":false,"dailyDigest":false}',

    -- Quiet hours
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start TIME NULL DEFAULT '23:00:00',
    quiet_hours_end TIME NULL DEFAULT '07:00:00',

    -- Timestamps (TIMESTAMPTZ - timezone aware!)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_user_notification_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. push_notification_logs

Push küldések logolása (rate limiting, analytics).

```sql
-- PostgreSQL szintaxis
CREATE TABLE push_notification_logs (
    id BIGSERIAL PRIMARY KEY,

    -- Kapcsolatok
    user_id BIGINT NOT NULL,
    notification_id BIGINT NULL,

    -- Küldés adatai
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    onesignal_id VARCHAR(100) NULL,

    -- Státusz
    delivered BOOLEAN NULL,
    delivered_at TIMESTAMPTZ NULL,
    clicked BOOLEAN NOT NULL DEFAULT FALSE,
    clicked_at TIMESTAMPTZ NULL,

    -- Foreign keys
    CONSTRAINT fk_push_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_push_logs_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE SET NULL
);

-- Indexek
CREATE INDEX idx_push_logs_user_sent ON push_notification_logs(user_id, sent_at DESC);
CREATE INDEX idx_push_logs_user_today ON push_notification_logs(user_id, sent_at);
```

### 4. notification_dismissals (Banner dismissals) - V2

> **MEGJEGYZÉS:** Ez a tábla a V2-ben kerül implementálásra a Sticky Banner feature-rel együtt.

Sticky bannerek elrejtése.

```sql
-- PostgreSQL szintaxis (V2-ben)
CREATE TABLE notification_dismissals (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    -- Mit rejtett el
    dismissal_type VARCHAR(50) NOT NULL,
    -- 'banner_vote_ending_123', 'banner_announcement_456'

    dismissal_key VARCHAR(100) NOT NULL,
    -- 'voting_123', 'announcement_456'

    -- Mikor
    dismissed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Unique: user + key
    CONSTRAINT unique_user_dismissal UNIQUE (user_id, dismissal_key),

    -- Foreign key
    CONSTRAINT fk_dismissals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Query Példák

### Értesítések listázása (cursor pagination)

```sql
SELECT
    n.*,
    (
        SELECT COUNT(*)
        FROM notifications
        WHERE user_id = :userId AND is_read = FALSE
    ) as total_unread

FROM notifications n
WHERE n.user_id = :userId
    AND n.deleted_at IS NULL
    AND (:cursor IS NULL OR n.id < :cursor)
ORDER BY n.created_at DESC
LIMIT :limit;
```

### Olvasatlan szám

```sql
SELECT COUNT(*) as count
FROM notifications
WHERE user_id = :userId
    AND is_read = FALSE
    AND deleted_at IS NULL;
```

### Olvasottnak jelölés

```sql
UPDATE notifications
SET
    is_read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
WHERE id = :notificationId
    AND user_id = :userId;
```

### Mind olvasottnak jelölés

```sql
UPDATE notifications
SET
    is_read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
WHERE user_id = :userId
    AND is_read = FALSE
    AND deleted_at IS NULL
    AND (:filter IS NULL OR type IN (:filterTypes));
```

### Mai push-ok száma (rate limiting)

```sql
-- PostgreSQL szintaxis
SELECT COUNT(*) as count
FROM push_notification_logs
WHERE user_id = :userId
    AND DATE(sent_at) = CURRENT_DATE;
```

### Utolsó push időpontja

```sql
SELECT sent_at
FROM push_notification_logs
WHERE user_id = :userId
ORDER BY sent_at DESC
LIMIT 1;
```

### Settings lekérése (create if not exists)

```sql
-- PostgreSQL szintaxis (UPSERT)
INSERT INTO user_notification_settings (user_id, push_enabled, mode)
VALUES (:userId, TRUE, 'normal')
ON CONFLICT (user_id) DO NOTHING;

SELECT * FROM user_notification_settings WHERE user_id = :userId;
```

### Banner dismissal ellenőrzés

```sql
SELECT 1
FROM notification_dismissals
WHERE user_id = :userId
    AND dismissal_key = :key
LIMIT 1;
```

### JSONB metadata keresés (PostgreSQL specifikus)

```sql
-- Keresés JSONB-ben: @> operátor (contains)
SELECT *
FROM notifications
WHERE user_id = :userId
    AND metadata @> '{"votingId": 123}';

-- Konkrét kulcs érték alapján (->)
SELECT *
FROM notifications
WHERE user_id = :userId
    AND metadata->>'type' = 'urgent';

-- Array elemek JSONB-ben
SELECT *
FROM notifications
WHERE user_id = :userId
    AND metadata->'tags' ? 'important';
```

### Régi értesítések törlése (cleanup job)

```sql
-- PostgreSQL szintaxis
-- 90 napnál régebbi olvasott értesítések törlése
DELETE FROM notifications
WHERE is_read = TRUE
    AND created_at < NOW() - INTERVAL '90 days';

-- 30 napnál régebbi push logok törlése
DELETE FROM push_notification_logs
WHERE sent_at < NOW() - INTERVAL '30 days';
```

---

## Laravel Migrációk

### Migration: create_notifications_table

```php
public function up(): void
{
    Schema::create('notifications', function (Blueprint $table) {
        $table->id();

        // Kapcsolat
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();

        // Típus és tartalom
        $table->string('type', 50);
        $table->string('title', 100);
        $table->string('message', 255)->nullable();
        $table->string('emoji', 10)->default('🔔');

        // Állapot
        $table->boolean('is_read')->default(false);
        $table->timestamp('read_at')->nullable();

        // Action
        $table->string('action_url', 255)->nullable();

        // Metadata (JSONB - PostgreSQL optimalizált JSON típus)
        $table->jsonb('metadata')->nullable();

        $table->timestamps();
        $table->softDeletes();

        // Indexek (PostgreSQL partial index-et Laravel Blueprint nem támogatja, DB::statement-tel kell)
        $table->index(['user_id', 'created_at']);
        $table->index('type');
        $table->index('created_at');
    });

    // PostgreSQL partial index olvasatlan értesítésekhez (nem támogatott Blueprint-ben!)
    DB::statement('CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE');

    // GIN index JSONB metadata-hoz (ha keresel benne)
    DB::statement('CREATE INDEX idx_notifications_metadata ON notifications USING GIN(metadata)');
}

public function down(): void
{
    // PostgreSQL indexek törlése
    DB::statement('DROP INDEX IF EXISTS idx_notifications_user_unread');
    DB::statement('DROP INDEX IF EXISTS idx_notifications_metadata');
    Schema::dropIfExists('notifications');
}
```

### Migration: create_user_notification_settings_table

```php
public function up(): void
{
    Schema::create('user_notification_settings', function (Blueprint $table) {
        $table->id();

        $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

        $table->boolean('push_enabled')->default(true);
        // V1: normal/quiet mód, PostgreSQL-ben string + CHECK constraint
        $table->string('mode', 20)->default('normal');
        $table->jsonb('categories')->default('{"votes":true,"pokes":true,"mentions":true,"announcements":true,"replies":true,"events":true,"samples":false,"dailyDigest":false}');

        $table->boolean('quiet_hours_enabled')->default(false);
        $table->time('quiet_hours_start')->nullable()->default('23:00:00');
        $table->time('quiet_hours_end')->nullable()->default('07:00:00');

        $table->timestamps();
    });

    // PostgreSQL CHECK constraint a mode mezőre
    DB::statement("ALTER TABLE user_notification_settings ADD CONSTRAINT check_mode CHECK (mode IN ('normal', 'quiet'))");
}

public function down(): void
{
    Schema::dropIfExists('user_notification_settings');
}
```

### Migration: create_push_notification_logs_table

```php
public function up(): void
{
    Schema::create('push_notification_logs', function (Blueprint $table) {
        $table->id();

        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->foreignId('notification_id')->nullable()->constrained()->nullOnDelete();

        $table->timestamp('sent_at')->useCurrent();
        $table->string('onesignal_id', 100)->nullable();

        $table->boolean('delivered')->nullable();
        $table->timestamp('delivered_at')->nullable();
        $table->boolean('clicked')->default(false);
        $table->timestamp('clicked_at')->nullable();

        $table->index(['user_id', 'sent_at']);
    });
}

public function down(): void
{
    Schema::dropIfExists('push_notification_logs');
}
```

### Migration: create_notification_dismissals_table

```php
public function up(): void
{
    Schema::create('notification_dismissals', function (Blueprint $table) {
        $table->id();

        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('dismissal_type', 50);
        $table->string('dismissal_key', 100);
        $table->timestamp('dismissed_at')->useCurrent();

        $table->unique(['user_id', 'dismissal_key']);
    });
}

public function down(): void
{
    Schema::dropIfExists('notification_dismissals');
}
```

---

## Laravel Models

### Notification Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'emoji',
        'is_read',
        'read_at',
        'action_url',
        'metadata',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'metadata' => 'array',
    ];

    // Relations
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Methods
    public function markAsRead(): void
    {
        if (!$this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
    }
}
```

### UserNotificationSettings Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotificationSettings extends Model
{
    protected $fillable = [
        'user_id',
        'push_enabled',
        'mode',
        'categories',
        'quiet_hours_enabled',
        'quiet_hours_start',
        'quiet_hours_end',
    ];

    protected $casts = [
        'push_enabled' => 'boolean',
        'categories' => 'array', // JSONB -> array
        'quiet_hours_enabled' => 'boolean',
        // PostgreSQL TIME típus, Laravel-ben cast nélkül string formátumban jön (HH:MM:SS)
        // Ha kell: Carbon::createFromTimeString($this->quiet_hours_start)
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isCategoryEnabled(string $category): bool
    {
        // V1: normal/quiet módok
        // V2-ben bővíthető: 'all', 'custom' módokkal

        // Mode-based categories
        $modeCategories = config("notifications.modes.{$this->mode}.categories", []);
        return in_array($category, $modeCategories) || in_array('all', $modeCategories);
    }

    public function getMaxPushPerDay(): int
    {
        return config("notifications.modes.{$this->mode}.maxPushPerDay", 3);
    }
}
```

### PushNotificationLog Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PushNotificationLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'notification_id',
        'sent_at',
        'onesignal_id',
        'delivered',
        'delivered_at',
        'clicked',
        'clicked_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'delivered' => 'boolean',
        'delivered_at' => 'datetime',
        'clicked' => 'boolean',
        'clicked_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function notification(): BelongsTo
    {
        return $this->belongsTo(Notification::class);
    }

    public static function getTodayCountForUser(int $userId): int
    {
        // PostgreSQL: DATE(sent_at) = CURRENT_DATE vagy whereDate() (Laravel konvertálja)
        return static::where('user_id', $userId)
            ->whereDate('sent_at', today()) // Laravel: DATE(sent_at) = ?
            ->count();
    }

    public static function getLastSentForUser(int $userId): ?static
    {
        return static::where('user_id', $userId)
            ->orderBy('sent_at', 'desc')
            ->first();
    }
}
```

---

## Config File

```php
// config/notifications.php
// V1: Egyszerűsített, 2 mód
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
        // V2-ben bővíthető:
        // 'chill' => [...],
        // 'active' => [...],
        // 'all' => [...],
    ],

    'type_to_category' => [
        'poke_received' => 'pokes',
        'poke_reaction' => 'pokes',
        'vote_created' => 'votes',
        'vote_ending' => 'votes',
        'vote_closed' => 'votes',
        'mention' => 'mentions',
        'reply' => 'replies',
        'announcement' => 'announcements',
        'event_reminder' => 'events',
        'samples_added' => 'samples',
    ],

    'cleanup' => [
        'read_after_days' => 90,
        'push_logs_after_days' => 30,
    ],

    'rate_limits' => [
        'min_gap_hours' => 2,
    ],
];
```

---

## Becsült Méret

Feltételezés: 1000 user, aktív használat

| Tábla | Sorok/hó | Méret/hó |
|-------|----------|----------|
| `notifications` | ~50,000 | ~10 MB |
| `user_notification_settings` | 1,000 | ~100 KB |
| `push_notification_logs` | ~10,000 | ~1 MB |
| `notification_dismissals` | ~2,000 | ~100 KB |

**Összesen: ~12 MB/hó** (cleanup job-bal stabil marad)

---

## Cleanup Job

```php
// app/Console/Commands/CleanupNotifications.php

class CleanupNotifications extends Command
{
    protected $signature = 'notifications:cleanup';
    protected $description = 'Clean up old notifications and logs';

    public function handle(): void
    {
        $readDays = config('notifications.cleanup.read_after_days');
        $pushLogsDays = config('notifications.cleanup.push_logs_after_days');

        // Régi olvasott értesítések
        $notifCount = Notification::where('is_read', true)
            ->where('created_at', '<', now()->subDays($readDays))
            ->delete();

        $this->info("Deleted {$notifCount} old read notifications.");

        // Régi push logok
        $logCount = PushNotificationLog::where('sent_at', '<', now()->subDays($pushLogsDays))
            ->delete();

        $this->info("Deleted {$logCount} old push logs.");

        // Régi dismissals (6 hónap)
        $dismissCount = NotificationDismissal::where('dismissed_at', '<', now()->subMonths(6))
            ->delete();

        $this->info("Deleted {$dismissCount} old dismissals.");
    }
}

// Schedule: weekly
// $schedule->command('notifications:cleanup')->weekly();
```

---

## Checklist

### Táblák
- [ ] notifications
- [ ] user_notification_settings
- [ ] push_notification_logs
- [ ] notification_dismissals

### Indexek
- [ ] user_id + created_at (notifications)
- [ ] user_id + is_read + created_at (notifications)
- [ ] user_id + sent_at (push_logs)

### Models
- [ ] Notification
- [ ] UserNotificationSettings
- [ ] PushNotificationLog
- [ ] NotificationDismissal

### Jobs
- [ ] Cleanup command (weekly cron)

---

## PostgreSQL Specifikus Optimalizációk

### ✅ Használt PostgreSQL Feature-ök

1. **BIGSERIAL** - Auto-increment PRIMARY KEY (64-bit)
2. **JSONB** - Natív JSON típus indexelhető, gyorsabb mint JSON
3. **TIMESTAMPTZ** - Timezone-aware timestamp (UTC tárolás)
4. **CHECK constraint** - Enum helyett (`mode IN ('normal', 'quiet')`)
5. **Partial index** - `WHERE is_read = FALSE` (kisebb index, gyorsabb!)
6. **GIN index** - JSONB metadata kereséshez (`@>` operátor)
7. **INTERVAL szintaxis** - `NOW() - INTERVAL '90 days'`
8. **UPSERT** - `ON CONFLICT DO NOTHING` (PostgreSQL 9.5+)
9. **TIME típus** - Quiet hours tárolásához (HH:MM:SS)
10. **CASCADE/SET NULL** - Foreign key akcióknál

### 🚀 PostgreSQL 18 Újdonságok (Opcionális)

```sql
-- UUID v7 használata BIGSERIAL helyett (sortable, timestamp-based!)
-- Csak ha publikus azonosító kell (API-ban expozálva)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    ...
);
```

**Előnyök:**
- Időrendben sortable (nincs random insert)
- Jobb B-tree index teljesítmény
- Timestamp kinyerhető a UUID-ből

**Mikor NEM kell:**
- Internal ID-k (user_id, notification_id)
- Nem publikus API-ban

### 📊 Index Stratégia

```sql
-- B-tree composite (user + timestamp) - leggyakoribb query
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Partial index - csak olvasatlan értesítésekre (NAGYON hatékony!)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC)
WHERE is_read = FALSE;

-- GIN index - JSONB kereséshez
CREATE INDEX idx_notifications_metadata ON notifications USING GIN(metadata);
```

**Miért hatékony?**
- Partial index kisebb → gyorsabb scan, kevesebb disk I/O
- GIN index JSONB-hez 5-10x gyorsabb keresés
- Composite index: user + timestamp egyetlen index scan
