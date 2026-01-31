# Hiányzók Nyomozása v2 - Claude Implementációs Útmutató

> **FONTOS**: Ez a dokumentum a Claude Code AI asszisztensnek szól az implementáció során.

---

## Projekt Kontextus

- **Alkalmazás**: Tablókirály - tablófotó rendelési platform
- **Feature**: Hiányzók Nyomozása v2 (Poke rendszer)
- **Cél**: Gen Z-barát peer-to-peer emlékeztető rendszer, ahol a diákok "bökhetik" egymást a hiányzó feladatok elvégzésére

---

## Tech Stack

| Réteg | Technológia | Verzió |
|-------|-------------|--------|
| Frontend | Angular | 19.x |
| State | Signals | built-in |
| Styling | Tailwind CSS | 3.4.x |
| Backend | Laravel | 10.x |
| DB | MySQL | 8.x |
| Real-time | Laravel Reverb | - |
| Push | OneSignal | - |

---

## Implementációs Sorrend

### 1. Backend (Laravel)

#### 1.1 Migrációk

```bash
php artisan make:migration create_pokes_table
php artisan make:migration create_poke_presets_table
php artisan make:migration create_poke_daily_limits_table
```

Lásd: `04-database-schema.md` a teljes séma definícióhoz.

#### 1.2 Modellek

```bash
php artisan make:model Poke
php artisan make:model PokePreset
php artisan make:model PokeDailyLimit
```

**Kritikus relációk:**
- `Poke` belongsTo `User` (from_user_id, target_user_id)
- `Poke` belongsTo `Project`
- `User` hasMany `Poke` (küldött és kapott)

#### 1.3 Seeder

```bash
php artisan make:seeder PokePresetsSeeder
```

Lásd: `04-database-schema.md` a preset adatokért.

#### 1.4 Controller + Routes

```bash
php artisan make:controller Api/V1/PokeController
php artisan make:controller Api/V1/MissingUserController
```

**API végpontok prioritás sorrendben:**
1. `GET /projects/{id}/missing` - Hiányzók listája
2. `POST /pokes` - Bökés küldése
3. `GET /pokes/presets` - Preset üzenetek
4. `GET /pokes/sent` - Küldött bökések
5. `GET /pokes/received` - Kapott bökések
6. `POST /pokes/{id}/reaction` - Reakció
7. `POST /pokes/{id}/read` - Olvasottnak jelölés

#### 1.5 Service osztályok

```php
// app/Services/PokeService.php
class PokeService
{
    public function canUserPoke(User $from, User $target, Project $project): bool|string;
    public function sendPoke(CreatePokeRequest $request): Poke;
    public function getPokeableStatus(User $from, User $target): array;
    public function markResolved(User $user, string $category, Project $project): void;
}

// app/Services/MissingUserService.php
class MissingUserService
{
    public function getMissingByCategory(Project $project, User $currentUser): array;
    public function getVotingMissing(Project $project): Collection;
    public function getPhotoshootMissing(Project $project): Collection;
    public function getImageSelectionMissing(Project $project): Collection;
}
```

#### 1.6 Events + Listeners

```php
// Events
App\Events\PokeReceived::class
App\Events\PokeReaction::class
App\Events\PokeResolved::class

// Listeners
App\Listeners\SendPokePushNotification::class
App\Listeners\BroadcastPokeReceived::class
```

#### 1.7 Broadcasting

```php
// routes/channels.php
Broadcast::channel('user.{userId}.pokes', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
```

---

### 2. Frontend (Angular)

#### 2.1 Mappa struktúra létrehozása

```bash
mkdir -p src/app/features/poke/{services,models,components,pages}
```

#### 2.2 Modellek

Hozd létre a típusdefiníciókat a `05-components.md` alapján:
- `poke.model.ts`
- `missing-user.model.ts`
- `poke-preset.model.ts`

#### 2.3 Services

Implementáld ebben a sorrendben:
1. `poke.service.ts` - HTTP hívások
2. `poke-state.service.ts` - Signals-alapú state management
3. `poke-websocket.service.ts` - Real-time frissítések

#### 2.4 Komponensek (prioritás sorrendben)

1. **Core komponensek:**
   - `MissingPageComponent` - Fő oldal
   - `MissingCategoryComponent` - Kategória accordion
   - `MissingUserCardComponent` - User kártya

2. **Composer:**
   - `PokeComposerComponent` - Üzenet összeállító
   - `PresetSelectorComponent` - Preset választó

3. **Reakciók:**
   - `ReactionPickerComponent` - Emoji picker
   - `PokeReceivedToastComponent` - Kapott bökés toast

4. **History:**
   - `PokeSentCardComponent` - Küldött bökés kártya
   - `PokeHistoryPageComponent` - Előzmények oldal

5. **Extras:**
   - `DailyLimitBadgeComponent` - Napi limit

#### 2.5 Routes

```typescript
// app.routes.ts
{
  path: 'project/:projectId',
  children: [
    // ...existing routes
    {
      path: 'missing',
      loadChildren: () => import('./features/poke/poke.routes')
        .then(m => m.POKE_ROUTES)
    }
  ]
}
```

---

## Kritikus Üzleti Szabályok

### Bökhetőségi feltételek

Ezeket MINDIG ellenőrizd backend oldalon:

```php
public function canUserPoke(User $from, User $target, Project $project): bool|string
{
    // 1. Target bejelentkezett-e
    if (!$target->has_logged_in) {
        return 'not_logged_in';
    }

    // 2. Target nem tanár/kapcsolattartó
    if ($target->isCoordinator($project)) {
        return 'is_coordinator';
    }

    // 3. From korábban regisztrált mint target
    if ($from->registered_at >= $target->registered_at) {
        return 'registered_before_you';
    }

    // 4. Ma már bökted
    $pokedToday = Poke::where('from_user_id', $from->id)
        ->where('target_user_id', $target->id)
        ->whereDate('created_at', today())
        ->exists();

    if ($pokedToday) {
        return 'poked_today';
    }

    // 5. Összesen 3x bökted
    $totalPokes = Poke::where('from_user_id', $from->id)
        ->where('target_user_id', $target->id)
        ->count();

    if ($totalPokes >= 3) {
        return 'max_pokes_reached';
    }

    // 6. Napi limit (5 bökés/nap)
    $dailyCount = PokeDailyLimit::where('user_id', $from->id)
        ->where('date', today())
        ->value('pokes_sent') ?? 0;

    if ($dailyCount >= 5) {
        return 'daily_limit_reached';
    }

    return true;
}
```

### Emoji reakciók

Csak ezek engedélyezettek:
```php
$allowedReactions = ['💀', '😭', '🫡', '❤️', '👀'];
```

**FONTOS**: NE használj 👍 emojit! A Gen Z számára ez passive-aggressive.

### Üzenet limitek

- Preset: előre definiált, validáld a `key`-t
- Custom: max 60 karakter, UTF-8 (emoji engedélyezett)

---

## Gen Z UI Irányelvek

### Typography
- **Lowercase** címek és gombok: "hiányzók", "bökj", nem "Hiányzók", "Bökj"
- Casual nyelvezet: "pls", "légyszi", nem "kérem"

### Színek
- Primary: `#3B82F6` (blue-500)
- Success: Zöld árnyalatok
- Muted: Gray-400/500

### Animációk
- `transition-all duration-200`
- `hover:scale-105 active:scale-95` gombokon
- Fade-in új elemekhez

### Ikonok
- Emoji-first approach
- 👉 = bökés
- 👀 = megfigyelés
- ✓ = kész

---

## WebSocket Események

### Frontend → Backend

Nincs direkt üzenet, minden HTTP-n keresztül megy.

### Backend → Frontend

```typescript
// Channel: user.{userId}.pokes

// 1. Új bökés érkezett
{
  event: 'poke.received',
  data: Poke
}

// 2. Reakció a bökésemre
{
  event: 'poke.reaction',
  data: {
    pokeId: number,
    reaction: EmojiReaction,
    reactedAt: string
  }
}

// 3. Target megcsinálta a feladatot
{
  event: 'poke.resolved',
  data: {
    pokeId: number,
    resolvedAt: string
  }
}
```

---

## Push Notification

### Bökés érkezésekor

```php
OneSignal::sendNotification([
    'include_player_ids' => [$target->onesignal_player_id],
    'headings' => ['en' => '👉 tablókirály'],
    'contents' => ['en' => "{$from->name}: {$poke->emoji} \"{$poke->text}\""],
    'data' => [
        'type' => 'poke_received',
        'pokeId' => $poke->id
    ]
]);
```

---

## Optimistic UI Pattern

A bökés küldésekor:

```typescript
// 1. Azonnal frissítsd a UI-t
this._sentPokes.update(pokes => [optimisticPoke, ...pokes]);
this._missingData.update(/* mark user as poked */);

// 2. Küld a request-et
try {
  const response = await this.pokeService.sendPoke(request);
  // 3a. Siker: cseréld ki az optimistikus adatot a valósra
  this._sentPokes.update(pokes =>
    pokes.map(p => p.id === optimisticPoke.id ? response : p)
  );
} catch (error) {
  // 3b. Hiba: rollback
  this._sentPokes.update(pokes =>
    pokes.filter(p => p.id !== optimisticPoke.id)
  );
  this._missingData.update(/* restore pokeable status */);
}
```

---

## Cron Jobs

### Lejárt bökések

```php
// app/Console/Kernel.php
$schedule->command('pokes:cleanup')->daily();
```

```php
// 7 napnál régebbi sent/pending → expired
Poke::whereIn('status', ['sent', 'pending'])
    ->where('created_at', '<', now()->subDays(7))
    ->update(['status' => 'expired']);
```

### Napi limitek tisztítása (opcionális)

```php
// 30 napnál régebbi limitek törlése
$schedule->command('pokes:cleanup-limits')->weekly();
```

---

## Tesztelés

### Backend Unit Tests

```php
// tests/Feature/PokeTest.php
public function test_user_can_poke_missing_user(): void;
public function test_cannot_poke_user_who_has_not_logged_in(): void;
public function test_cannot_poke_coordinator(): void;
public function test_cannot_poke_same_user_twice_same_day(): void;
public function test_cannot_exceed_daily_poke_limit(): void;
public function test_cannot_exceed_total_poke_limit_per_user(): void;
public function test_can_send_reaction_to_received_poke(): void;
public function test_poke_resolved_when_target_completes_action(): void;
```

### Frontend Unit Tests

```typescript
// poke-state.service.spec.ts
describe('PokeStateService', () => {
  it('should load missing users');
  it('should send poke and update state optimistically');
  it('should handle WebSocket poke received');
  it('should calculate daily limit correctly');
});
```

---

## Hibakezelés

### Backend Error Codes

| Code | HTTP | Leírás |
|------|------|--------|
| `DAILY_LIMIT_REACHED` | 429 | Napi 5 bökés elérve |
| `TARGET_NOT_POKEABLE` | 422 | Nem bökhető (nincs push, stb.) |
| `ALREADY_POKED_TODAY` | 422 | Ma már bökted |
| `MAX_POKES_REACHED` | 422 | 3x bökted összesen |
| `INVALID_PRESET` | 422 | Nem létező preset key |
| `MESSAGE_TOO_LONG` | 422 | Custom üzenet > 60 char |

### Frontend Error States

```html
@if (error()) {
  <div class="p-4 bg-red-50 text-red-700 rounded-xl">
    {{ error() }}
    <button (click)="retry()" class="underline ml-2">újra</button>
  </div>
}
```

---

## Dokumentáció Referenciák

| Fájl | Tartalom |
|------|----------|
| `01-user-flow.md` | Teljes UX flow |
| `02-ui-design.md` | UI komponensek, Gen Z stílus |
| `03-backend-api.md` | REST API specifikáció |
| `04-database-schema.md` | DB táblák, migrációk |
| `05-components.md` | Angular komponensek |

---

## Checklist az Implementációhoz

### Backend
- [ ] Migrációk létrehozva és futtatva
- [ ] Modellek + relációk
- [ ] Seeder (presets)
- [ ] PokeController
- [ ] MissingUserController
- [ ] PokeService
- [ ] MissingUserService
- [ ] Events + Listeners
- [ ] Broadcasting channels
- [ ] Push notification integration
- [ ] Cron job (cleanup)
- [ ] Unit tests

### Frontend
- [ ] Modellek (TypeScript interfaces)
- [ ] PokeService
- [ ] PokeStateService
- [ ] PokeWebSocketService
- [ ] MissingPageComponent
- [ ] MissingCategoryComponent
- [ ] MissingUserCardComponent
- [ ] PokeComposerComponent
- [ ] PresetSelectorComponent
- [ ] ReactionPickerComponent
- [ ] DailyLimitBadgeComponent
- [ ] PokeReceivedToastComponent
- [ ] Routes konfigurálva
- [ ] Unit tests

### Integration
- [ ] WebSocket működik
- [ ] Push notification működik
- [ ] Poke → resolved flow tesztelve
- [ ] Rate limiting működik
- [ ] E2E tesztek

---

**FONTOS EMLÉKEZTETŐK:**

1. **Signals használata** - NE használj BehaviorSubject-et, Angular 19-ben Signals a standard
2. **Standalone komponensek** - Minden komponens standalone: true
3. **OnPush** - Minden komponens OnPush change detection
4. **Gen Z stílus** - Lowercase, emoji-first, casual tone
5. **Validáció** - Minden üzleti szabály BACKEND-en is validálva legyen
6. **Optimistic UI** - Azonnali feedback, majd rollback hiba esetén
