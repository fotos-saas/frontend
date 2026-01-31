# Osztály Hírek - Adatbázis Séma

> Verzió: 1.0
> Dátum: 2025-01-19
> DB: MySQL 8.0 / PostgreSQL 14+

---

## 📊 ER Diagram (ASCII)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │    projects     │       │  project_users  │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │──┐    │ id (PK)         │
│ name            │  │    │ name            │  │    │ user_id (FK)    │──┐
│ email           │  │    │ code            │  └───>│ project_id (FK) │  │
│ created_at      │  │    │ created_at      │       │ role            │  │
└─────────────────┘  │    └─────────────────┘       │ joined_at       │  │
                     │                               └─────────────────┘  │
                     └───────────────────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                     ▼                             ▼
         ┌─────────────────────┐       ┌─────────────────────┐
         │   feed_items        │       │   notifications     │
         ├─────────────────────┤       ├─────────────────────┤
         │ id (PK)             │       │ id (PK)             │
         │ project_id (FK)     │       │ user_id (FK)        │
         │ type                │       │ type                │
         │ title               │       │ title               │
         │ content             │       │ message             │
         │ reference_type      │       │ is_read             │
         │ reference_id        │       │ action_url          │
         │ author_id (FK)      │       │ created_at          │
         │ created_at          │       └─────────────────────┘
         └─────────────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │   feed_item_reads   │
         ├─────────────────────┤
         │ id (PK)             │
         │ feed_item_id (FK)   │
         │ user_id (FK)        │
         │ read_at             │
         └─────────────────────┘
```

---

## 📋 Táblák Részletesen

### 1. feed_items

A központi feed tábla - minden aktivitás ide kerül.

```sql
CREATE TABLE feed_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    type ENUM(
        'announcement',
        'poll_created',
        'poll_ending',
        'poll_closed',
        'forum_post',
        'forum_reply',
        'forum_mention',
        'samples_added',
        'guest_joined'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,

    -- Polymorphic relation (melyik entitásra vonatkozik)
    reference_type VARCHAR(50) NULL,  -- 'poll', 'forum_post', 'announcement', 'sample_batch'
    reference_id BIGINT UNSIGNED NULL,

    -- Ki generálta (null ha system)
    author_id BIGINT UNSIGNED NULL,

    -- Meta adatok (JSON)
    metadata JSON NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexek
    INDEX idx_project_created (project_id, created_at DESC),
    INDEX idx_type (type),
    INDEX idx_reference (reference_type, reference_id),

    -- Foreign keys
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Metadata JSON példák:**

```json
// poll_created
{
  "pollId": 45,
  "pollTitle": "Sablon választás",
  "totalVoters": 25,
  "endsAt": "2025-01-21T18:00:00Z",
  "previewImages": ["url1", "url2"]
}

// forum_post
{
  "postId": 234,
  "discussionId": 12,
  "discussionTitle": "Milyen háttér legyen?",
  "preview": "Szerintem a kék háttér..."
}

// samples_added
{
  "count": 4,
  "sampleIds": [101, 102, 103, 104],
  "thumbnails": ["url1", "url2", "url3", "url4"]
}
```

---

### 2. feed_item_reads

Ki olvasta melyik feed itemet.

```sql
CREATE TABLE feed_item_reads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    feed_item_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint
    UNIQUE KEY unique_read (feed_item_id, user_id),

    -- Indexek
    INDEX idx_user_read (user_id, read_at DESC),

    -- Foreign keys
    FOREIGN KEY (feed_item_id) REFERENCES feed_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3. notifications

User-specifikus értesítések.

```sql
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NULL,  -- NULL ha globális

    type ENUM(
        'poll_created',
        'poll_ending',
        'poll_closed',
        'forum_reply',
        'forum_mention',
        'announcement',
        'samples_added'
    ) NOT NULL,

    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_url VARCHAR(500) NOT NULL,

    -- Olvasottsági státusz
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,

    -- Polymorphic relation
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT UNSIGNED NULL,

    -- Extra
    icon VARCHAR(50) NULL,
    image_url VARCHAR(500) NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexek
    INDEX idx_user_unread (user_id, is_read, created_at DESC),
    INDEX idx_user_created (user_id, created_at DESC),

    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4. announcements

Hirdetmények külön tábla (részletes adatok).

```sql
CREATE TABLE announcements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,

    level ENUM('important', 'info', 'success') NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,

    -- Megjelenítési opciók
    show_banner BOOLEAN DEFAULT FALSE,
    banner_active BOOLEAN DEFAULT TRUE,  -- Kapcsolattartó kikapcsolhatja

    -- Push notification
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMP NULL,
    push_recipients INT UNSIGNED DEFAULT 0,

    -- Statisztikák
    views_count INT UNSIGNED DEFAULT 0,
    dismiss_count INT UNSIGNED DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexek
    INDEX idx_project_active (project_id, banner_active, created_at DESC),

    -- Foreign keys
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 5. announcement_dismissals

Ki rejtette el melyik hirdetményt.

```sql
CREATE TABLE announcement_dismissals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    announcement_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    dismissed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint
    UNIQUE KEY unique_dismissal (announcement_id, user_id),

    -- Foreign keys
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 6. announcement_views

Hirdetmény megtekintések.

```sql
CREATE TABLE announcement_views (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    announcement_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint (user csak egyszer számít)
    UNIQUE KEY unique_view (announcement_id, user_id),

    -- Foreign keys
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 7. notification_settings

User értesítési beállításai.

```sql
CREATE TABLE notification_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,

    -- Push beállítások
    push_enabled BOOLEAN DEFAULT TRUE,
    push_polls BOOLEAN DEFAULT TRUE,
    push_replies BOOLEAN DEFAULT TRUE,
    push_mentions BOOLEAN DEFAULT TRUE,
    push_announcements BOOLEAN DEFAULT TRUE,
    push_samples BOOLEAN DEFAULT FALSE,
    push_digest BOOLEAN DEFAULT FALSE,

    -- Email beállítások (későbbre)
    email_enabled BOOLEAN DEFAULT FALSE,
    email_digest_frequency ENUM('daily', 'weekly', 'never') DEFAULT 'never',

    -- OneSignal player ID
    onesignal_player_id VARCHAR(255) NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Unique constraint
    UNIQUE KEY unique_user (user_id),

    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔄 Migrációs Sorrend

```bash
# 1. Alap táblák (ha még nincs)
# users, projects, project_users

# 2. Feed rendszer
php artisan make:migration create_feed_items_table
php artisan make:migration create_feed_item_reads_table

# 3. Notification rendszer
php artisan make:migration create_notifications_table
php artisan make:migration create_notification_settings_table

# 4. Announcement rendszer
php artisan make:migration create_announcements_table
php artisan make:migration create_announcement_dismissals_table
php artisan make:migration create_announcement_views_table
```

---

## 📈 Query Példák

### Feed lekérés olvasottsági státusszal

```sql
SELECT
    fi.*,
    CASE WHEN fir.id IS NOT NULL THEN TRUE ELSE FALSE END as is_read
FROM feed_items fi
LEFT JOIN feed_item_reads fir
    ON fi.id = fir.feed_item_id
    AND fir.user_id = :userId
WHERE fi.project_id = :projectId
ORDER BY fi.created_at DESC
LIMIT :limit OFFSET :offset;
```

### Olvasatlan értesítések száma

```sql
SELECT COUNT(*) as unread_count
FROM notifications
WHERE user_id = :userId
    AND is_read = FALSE;
```

### Aktív banner hirdetmény

```sql
SELECT a.*,
    CASE WHEN ad.id IS NOT NULL THEN TRUE ELSE FALSE END as dismissed_by_me
FROM announcements a
LEFT JOIN announcement_dismissals ad
    ON a.id = ad.announcement_id
    AND ad.user_id = :userId
WHERE a.project_id = :projectId
    AND a.show_banner = TRUE
    AND a.banner_active = TRUE
    AND ad.id IS NULL
ORDER BY a.created_at DESC
LIMIT 1;
```

### Feed item olvasottnak jelölés (batch)

```sql
INSERT INTO feed_item_reads (feed_item_id, user_id, read_at)
SELECT id, :userId, NOW()
FROM feed_items
WHERE project_id = :projectId
    AND id IN (:itemIds)
ON DUPLICATE KEY UPDATE read_at = NOW();
```

---

## 🔧 Indexelési Stratégia

### Legfontosabb indexek

| Tábla | Index | Cél |
|-------|-------|-----|
| `feed_items` | `(project_id, created_at DESC)` | Feed listázás |
| `feed_item_reads` | `(user_id, feed_item_id)` | Olvasottság check |
| `notifications` | `(user_id, is_read, created_at DESC)` | Olvasatlan lista |
| `announcements` | `(project_id, banner_active, created_at)` | Aktív banner |

### Teljesítmény tippek

1. **Partícionálás** - `feed_items` és `notifications` havi partíció
2. **Archiválás** - 90 napnál régebbi feed itemek archív táblába
3. **Soft delete** - Értesítéseknél `deleted_at` mező

---

## 📊 Becsült Méret

Feltételezés: 100 projekt, 25 user/projekt, 6 hónap

| Tábla | Sorok | Méret |
|-------|-------|-------|
| `feed_items` | ~50,000 | ~10 MB |
| `feed_item_reads` | ~500,000 | ~20 MB |
| `notifications` | ~250,000 | ~30 MB |
| `announcements` | ~1,000 | ~1 MB |

**Összesen: ~60-100 MB** (indexekkel)

---

## ✅ Checklist

### Táblák
- [ ] feed_items
- [ ] feed_item_reads
- [ ] notifications
- [ ] notification_settings
- [ ] announcements
- [ ] announcement_dismissals
- [ ] announcement_views

### Indexek
- [ ] Feed listázás index
- [ ] Olvasottság check index
- [ ] Notification unread index
- [ ] Banner query index

### Migrációk
- [ ] Migráció fájlok létrehozva
- [ ] Seed data (test)
- [ ] Rollback tesztelve
