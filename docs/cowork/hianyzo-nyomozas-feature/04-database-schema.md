# Hiányzók Nyomozása v2 - Adatbázis Séma

> Verzió: 1.0
> Dátum: 2025-01-19

---

## ER Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │    projects     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │
│ name            │  │    │ name            │
│ email           │  │    │ ...             │
│ registered_at   │  │    └────────┬────────┘
│ last_active_at  │  │             │
│ has_logged_in   │  │             │
└─────────────────┘  │             │
                     │             │
         ┌───────────┴─────────────┤
         │                         │
         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐
│       pokes         │   │   poke_presets      │
├─────────────────────┤   ├─────────────────────┤
│ id (PK)             │   │ id (PK)             │
│ from_user_id (FK)   │   │ category            │
│ target_user_id (FK) │   │ key                 │
│ project_id (FK)     │   │ emoji               │
│ category            │   │ text                │
│ message_type        │   │ sort_order          │
│ preset_key          │   └─────────────────────┘
│ custom_message      │
│ emoji               │
│ text                │
│ status              │
│ reaction            │
│ reacted_at          │
│ resolved_at         │
│ is_read             │
│ push_delivered      │
│ created_at          │
└─────────────────────┘
```

---

## Táblák

### 1. pokes

Bökések fő táblája.

```sql
CREATE TABLE pokes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Kapcsolatok
    from_user_id BIGINT UNSIGNED NOT NULL,
    target_user_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NOT NULL,

    -- Kategória
    category ENUM('voting', 'photoshoot', 'image_selection', 'general') NOT NULL,

    -- Üzenet
    message_type ENUM('preset', 'custom') NOT NULL,
    preset_key VARCHAR(30) NULL,
    custom_message VARCHAR(60) NULL,

    -- Megjelenített üzenet (preset-ből vagy custom-ból)
    emoji VARCHAR(10) NOT NULL,
    text VARCHAR(60) NOT NULL,

    -- Állapot
    status ENUM('sent', 'pending', 'resolved', 'expired') NOT NULL DEFAULT 'sent',

    -- Reakció
    reaction ENUM('💀', '😭', '🫡', '❤️', '👀') NULL,
    reacted_at TIMESTAMP NULL,

    -- Megoldás
    resolved_at TIMESTAMP NULL,

    -- Olvasottság (target szemszögéből)
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP NULL,

    -- Push státusz
    push_delivered BOOLEAN NOT NULL DEFAULT FALSE,
    push_delivered_at TIMESTAMP NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Soft delete (ha kell)
    deleted_at TIMESTAMP NULL,

    -- Indexek
    INDEX idx_from_user (from_user_id),
    INDEX idx_target_user (target_user_id),
    INDEX idx_project_category (project_id, category),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_target_unread (target_user_id, is_read),

    -- Unique constraint: naponta 1x bökhet ugyanazt
    -- (PHP-ben ellenőrizzük, mert DATE()-el kell)

    -- Foreign keys
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2. poke_presets

Előre megírt üzenetek (seeder-ből töltjük).

```sql
CREATE TABLE poke_presets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Kategória
    category ENUM('voting', 'photoshoot', 'image_selection', 'general') NOT NULL,

    -- Kulcs (azonosító)
    `key` VARCHAR(30) NOT NULL UNIQUE,

    -- Tartalom
    emoji VARCHAR(10) NOT NULL,
    text VARCHAR(60) NOT NULL,

    -- Sorrend
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,

    -- Aktív-e
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexek
    INDEX idx_category_active (category, is_active, sort_order)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3. poke_daily_limits

Napi limitek követése (opcionális, cache-ből is megoldható).

```sql
CREATE TABLE poke_daily_limits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    date DATE NOT NULL,
    pokes_sent INT UNSIGNED NOT NULL DEFAULT 0,

    -- Unique: user + nap
    UNIQUE KEY unique_user_date (user_id, date),

    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Query Példák

### Hiányzó userek listázása (egy kategóriához)

```sql
-- Voting kategória: akik nem szavaztak
SELECT
    u.id,
    u.name,
    u.registered_at,
    u.last_active_at,
    u.has_logged_in,

    -- Bökhető-e (az aktuális user szemszögéből)
    CASE
        WHEN u.has_logged_in = FALSE THEN FALSE
        WHEN u.role = 'coordinator' THEN FALSE
        WHEN u.registered_at < :currentUserRegisteredAt THEN FALSE
        WHEN (
            SELECT COUNT(*) FROM pokes
            WHERE from_user_id = :currentUserId
            AND target_user_id = u.id
            AND DATE(created_at) = CURDATE()
        ) > 0 THEN FALSE
        WHEN (
            SELECT COUNT(*) FROM pokes
            WHERE from_user_id = :currentUserId
            AND target_user_id = u.id
        ) >= 3 THEN FALSE
        ELSE TRUE
    END as pokeable,

    -- Poke státusz
    CASE
        WHEN (
            SELECT COUNT(*) FROM pokes
            WHERE from_user_id = :currentUserId
            AND target_user_id = u.id
            AND DATE(created_at) = CURDATE()
        ) > 0 THEN 'poked_today'
        WHEN (
            SELECT COUNT(*) FROM pokes
            WHERE from_user_id = :currentUserId
            AND target_user_id = u.id
        ) >= 3 THEN 'max_pokes_reached'
        ELSE NULL
    END as poke_status,

    -- Összes kapott bökés
    (
        SELECT COUNT(*) FROM pokes
        WHERE target_user_id = u.id
    ) as total_pokes_received

FROM users u
JOIN project_users pu ON u.id = pu.user_id
WHERE pu.project_id = :projectId
    AND u.id NOT IN (
        -- Akik már szavaztak
        SELECT user_id FROM votes WHERE voting_id = :votingId
    )
ORDER BY u.name ASC;
```

### Bökés küldése

```sql
-- 1. Ellenőrzések (PHP-ben)
-- - Target bejelentkezett-e
-- - Nem tanár-e
-- - Nem bökted-e ma
-- - Nem bökted-e 3x összesen
-- - Nem érted el a napi limitet

-- 2. Bökés mentése
INSERT INTO pokes (
    from_user_id,
    target_user_id,
    project_id,
    category,
    message_type,
    preset_key,
    custom_message,
    emoji,
    text,
    status,
    created_at
) VALUES (
    :fromUserId,
    :targetUserId,
    :projectId,
    :category,
    :messageType,
    :presetKey,
    :customMessage,
    :emoji,
    :text,
    'sent',
    NOW()
);

-- 3. Napi limit növelése
INSERT INTO poke_daily_limits (user_id, date, pokes_sent)
VALUES (:fromUserId, CURDATE(), 1)
ON DUPLICATE KEY UPDATE pokes_sent = pokes_sent + 1;
```

### Küldött bökéseim

```sql
SELECT
    p.*,
    u.id as target_id,
    u.name as target_name

FROM pokes p
JOIN users u ON p.target_user_id = u.id
WHERE p.from_user_id = :userId
ORDER BY p.created_at DESC
LIMIT :limit;
```

### Kapott bökéseim (olvasatlanok)

```sql
SELECT
    p.*,
    u.id as from_id,
    u.name as from_name,

    -- Related action info
    CASE p.category
        WHEN 'voting' THEN (
            SELECT JSON_OBJECT('type', 'voting', 'id', v.id, 'title', v.title, 'url', CONCAT('/voting/', v.id))
            FROM votings v
            WHERE v.project_id = p.project_id
            AND v.status = 'active'
            LIMIT 1
        )
        -- ... más kategóriák
    END as related_action

FROM pokes p
JOIN users u ON p.from_user_id = u.id
WHERE p.target_user_id = :userId
    AND p.is_read = FALSE
ORDER BY p.created_at DESC;
```

### Reakció küldése

```sql
UPDATE pokes
SET
    reaction = :emoji,
    reacted_at = NOW(),
    status = 'pending',
    updated_at = NOW()
WHERE id = :pokeId
    AND target_user_id = :userId
    AND reaction IS NULL;
```

### Poke resolved (target elvégezte a feladatot)

```sql
-- Trigger vagy Observer: amikor target szavaz/fotózik/választ
UPDATE pokes
SET
    status = 'resolved',
    resolved_at = NOW(),
    updated_at = NOW()
WHERE target_user_id = :userId
    AND project_id = :projectId
    AND category = :category
    AND status IN ('sent', 'pending')
    AND resolved_at IS NULL;
```

### Napi limit ellenőrzés

```sql
SELECT
    COALESCE(pdl.pokes_sent, 0) as daily_pokes_used,
    5 as daily_poke_limit,
    CASE
        WHEN COALESCE(pdl.pokes_sent, 0) >= 5 THEN FALSE
        ELSE TRUE
    END as can_poke

FROM users u
LEFT JOIN poke_daily_limits pdl
    ON u.id = pdl.user_id
    AND pdl.date = CURDATE()
WHERE u.id = :userId;
```

### Lejárt bökések (cron job - 7 nap után)

```sql
UPDATE pokes
SET
    status = 'expired',
    updated_at = NOW()
WHERE status IN ('sent', 'pending')
    AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### Statisztikák (admin/debug)

```sql
-- Projektenkénti bökés statisztika
SELECT
    p.project_id,
    COUNT(*) as total_pokes,
    COUNT(CASE WHEN p.status = 'resolved' THEN 1 END) as resolved,
    COUNT(CASE WHEN p.reaction IS NOT NULL THEN 1 END) as with_reaction,
    AVG(TIMESTAMPDIFF(HOUR, p.created_at, p.resolved_at)) as avg_resolve_hours

FROM pokes p
WHERE p.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.project_id;
```

---

## Laravel Migrációk

### Migration: create_pokes_table

```php
public function up(): void
{
    Schema::create('pokes', function (Blueprint $table) {
        $table->id();

        // Kapcsolatok
        $table->foreignId('from_user_id')->constrained('users')->cascadeOnDelete();
        $table->foreignId('target_user_id')->constrained('users')->cascadeOnDelete();
        $table->foreignId('project_id')->constrained()->cascadeOnDelete();

        // Kategória
        $table->enum('category', ['voting', 'photoshoot', 'image_selection', 'general']);

        // Üzenet
        $table->enum('message_type', ['preset', 'custom']);
        $table->string('preset_key', 30)->nullable();
        $table->string('custom_message', 60)->nullable();

        // Megjelenített
        $table->string('emoji', 10);
        $table->string('text', 60);

        // Állapot
        $table->enum('status', ['sent', 'pending', 'resolved', 'expired'])->default('sent');

        // Reakció
        $table->string('reaction', 10)->nullable();
        $table->timestamp('reacted_at')->nullable();

        // Megoldás
        $table->timestamp('resolved_at')->nullable();

        // Olvasottság
        $table->boolean('is_read')->default(false);
        $table->timestamp('read_at')->nullable();

        // Push
        $table->boolean('push_delivered')->default(false);
        $table->timestamp('push_delivered_at')->nullable();

        $table->timestamps();
        $table->softDeletes();

        // Indexek
        $table->index('from_user_id');
        $table->index('target_user_id');
        $table->index(['project_id', 'category']);
        $table->index('status');
        $table->index('created_at');
        $table->index(['target_user_id', 'is_read']);
    });
}
```

### Migration: create_poke_presets_table

```php
public function up(): void
{
    Schema::create('poke_presets', function (Blueprint $table) {
        $table->id();

        $table->enum('category', ['voting', 'photoshoot', 'image_selection', 'general']);
        $table->string('key', 30)->unique();
        $table->string('emoji', 10);
        $table->string('text', 60);
        $table->unsignedInteger('sort_order')->default(0);
        $table->boolean('is_active')->default(true);

        $table->timestamps();

        $table->index(['category', 'is_active', 'sort_order']);
    });
}
```

### Migration: create_poke_daily_limits_table

```php
public function up(): void
{
    Schema::create('poke_daily_limits', function (Blueprint $table) {
        $table->id();

        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->date('date');
        $table->unsignedInteger('pokes_sent')->default(0);

        $table->unique(['user_id', 'date']);
    });
}
```

---

## Seeder: PokePresetsSeeder

```php
public function run(): void
{
    $presets = [
        // Voting
        ['category' => 'voting', 'key' => 'voting_1', 'emoji' => '💀', 'text' => 'szavazz már pls', 'sort_order' => 1],
        ['category' => 'voting', 'key' => 'voting_2', 'emoji' => '🙏', 'text' => 'légyszi 3 katt', 'sort_order' => 2],
        ['category' => 'voting', 'key' => 'voting_3', 'emoji' => '⏰', 'text' => 'lejár hamarosan help', 'sort_order' => 3],
        ['category' => 'voting', 'key' => 'voting_4', 'emoji' => '👀', 'text' => 'látunk téged', 'sort_order' => 4],

        // Photoshoot
        ['category' => 'photoshoot', 'key' => 'photo_1', 'emoji' => '📸', 'text' => 'pótfotózás when?', 'sort_order' => 1],
        ['category' => 'photoshoot', 'key' => 'photo_2', 'emoji' => '🖼️', 'text' => 'nélküled cringe lesz a tabló', 'sort_order' => 2],
        ['category' => 'photoshoot', 'key' => 'photo_3', 'emoji' => '📅', 'text' => 'írj a fotósnak asap', 'sort_order' => 3],

        // Image selection
        ['category' => 'image_selection', 'key' => 'image_1', 'emoji' => '🤔', 'text' => 'válassz egyet bármelyik jó', 'sort_order' => 1],
        ['category' => 'image_selection', 'key' => 'image_2', 'emoji' => '✨', 'text' => 'döntsd el pls', 'sort_order' => 2],
        ['category' => 'image_selection', 'key' => 'image_3', 'emoji' => '⏰', 'text' => 'lezárul mindjárt', 'sort_order' => 3],

        // General
        ['category' => 'general', 'key' => 'general_1', 'emoji' => '👋', 'text' => 'hol vagy?', 'sort_order' => 1],
        ['category' => 'general', 'key' => 'general_2', 'emoji' => '🫠', 'text' => 'hiányzol', 'sort_order' => 2],
        ['category' => 'general', 'key' => 'general_3', 'emoji' => '🏃', 'text' => 'mindenki vár', 'sort_order' => 3],
    ];

    foreach ($presets as $preset) {
        PokePreset::updateOrCreate(
            ['key' => $preset['key']],
            $preset + ['is_active' => true]
        );
    }
}
```

---

## Laravel Models

### Poke Model

```php
class Poke extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'from_user_id',
        'target_user_id',
        'project_id',
        'category',
        'message_type',
        'preset_key',
        'custom_message',
        'emoji',
        'text',
        'status',
        'reaction',
        'reacted_at',
        'resolved_at',
        'is_read',
        'read_at',
        'push_delivered',
        'push_delivered_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'push_delivered' => 'boolean',
        'reacted_at' => 'datetime',
        'resolved_at' => 'datetime',
        'read_at' => 'datetime',
        'push_delivered_at' => 'datetime',
    ];

    // Relations
    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    // Scopes
    public function scopeSent(Builder $query): Builder
    {
        return $query->where('status', 'sent');
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('is_read', false);
    }

    public function scopeFromUser(Builder $query, int $userId): Builder
    {
        return $query->where('from_user_id', $userId);
    }

    public function scopeToUser(Builder $query, int $userId): Builder
    {
        return $query->where('target_user_id', $userId);
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('created_at', today());
    }
}
```

### PokePreset Model

```php
class PokePreset extends Model
{
    protected $fillable = [
        'category',
        'key',
        'emoji',
        'text',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }
}
```

---

## Becsült Méret

Feltételezés: 100 projekt, 30 user/projekt, aktív bökés időszak

| Tábla | Sorok | Méret |
|-------|-------|-------|
| `pokes` | ~10,000 | ~2 MB |
| `poke_presets` | ~20 | ~5 KB |
| `poke_daily_limits` | ~5,000 | ~200 KB |

**Összesen: ~2.5 MB** (kis méret)

---

## Cleanup Job

```php
// app/Console/Commands/CleanupExpiredPokes.php

class CleanupExpiredPokes extends Command
{
    protected $signature = 'pokes:cleanup';
    protected $description = 'Mark old pokes as expired';

    public function handle(): void
    {
        $count = Poke::query()
            ->whereIn('status', ['sent', 'pending'])
            ->where('created_at', '<', now()->subDays(7))
            ->update([
                'status' => 'expired',
                'updated_at' => now(),
            ]);

        $this->info("Marked {$count} pokes as expired.");
    }
}

// Schedule: daily
// $schedule->command('pokes:cleanup')->daily();
```

---

## Checklist

### Táblák
- [ ] pokes
- [ ] poke_presets
- [ ] poke_daily_limits

### Indexek
- [ ] from_user_id index
- [ ] target_user_id index
- [ ] project_category index
- [ ] target_unread index

### Migrációk
- [ ] Migráció fájlok létrehozva
- [ ] Seed data (presets)
- [ ] Rollback tesztelve

### Models
- [ ] Poke model
- [ ] PokePreset model
- [ ] Relationships defined
- [ ] Scopes defined

### Jobs
- [ ] Cleanup expired pokes (daily cron)
