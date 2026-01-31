# Felhasználói Szerepkörök és Jogosultságok

> Kutatás dátuma: 2025-01-19

## Szerepkörök Áttekintése

| Szerep | Token típus | Belépési mód | Leírás |
|--------|-------------|--------------|--------|
| **Kapcsolattartó** | `code` | 6 jegyű kód | Teljes hozzáférés - az osztály felelőse |
| **Admin előnézet** | `preview` | Preview token | Admin által generált előnézet |
| **Vendég/Diák** | `share` | 64 karakteres token | Megosztó linkkel belépő diák |

---

## Jogosultságok Mátrix

### Szavazás Modul

| Funkció | Kapcsolattartó | Vendég/Diák |
|---------|:--------------:|:-----------:|
| Szavazások listázása | ✅ | ✅ |
| Szavazat leadása | ✅ | ✅ |
| Szavazat visszavonása | ✅ | ✅ |
| Eredmények megtekintése (aktív) | ✅ | ❌* |
| Eredmények megtekintése (lezárt) | ✅ | ✅ |
| Szavazás létrehozása | ✅ | ❌ |
| Szavazás szerkesztése | ✅ | ❌ |
| Szavazás törlése | ✅ | ❌ |
| Szavazás lezárása/újranyitása | ✅ | ❌ |
| Osztálylétszám beállítása | ✅ | ❌ |
| Résztvevők listája | ✅ | ✅** |

*\* Beállítástól függ (`showResultsBeforeVote`)*
*\*\* Korlátozott nézet*

### Fórum Modul

| Funkció | Kapcsolattartó | Vendég/Diák |
|---------|:--------------:|:-----------:|
| Beszélgetések listázása | ✅ | ✅ |
| Beszélgetés megtekintése | ✅ | ✅ |
| Hozzászólás írása | ✅ | ✅ |
| Hozzászólás szerkesztése | ✅ | ✅* |
| Hozzászólás törlése (saját) | ✅ | ✅ |
| Hozzászólás törlése (bármely) | ✅ | ❌ |
| Like-olás | ✅ | ✅ |
| Beszélgetés létrehozása | ✅ | ❌ |
| Kitűzés (pin/unpin) | ✅ | ❌ |
| Zárolás (lock/unlock) | ✅ | ❌ |
| Válasz (nested replies) | ✅ | ✅ |
| Említések (@mention) | ✅ | ✅ |
| Média csatolás | ✅ | ✅ |

*\* 15 perc időkorláttal*

### Általános Funkciók

| Funkció | Kapcsolattartó | Vendég/Diák |
|---------|:--------------:|:-----------:|
| Dashboard megtekintése | ✅ | ✅ |
| Minták megtekintése | ✅ | ✅ |
| Sablon választó | ✅ | ✅ |
| Megrendelési adatok | ✅ | ✅ |
| Hiányzó személyek lista | ✅ | ✅ |
| Véglegesítés | ✅ | ❌ |
| Projekt adatok szerkesztése | ✅ | ❌ |
| Megosztó link generálása | ✅ | ❌ |

---

## Autentikációs Flow-k

### 1. Kapcsolattartó Belépés (Code)
```
1. User → /login oldal
2. 6 jegyű kód megadása
3. POST /auth/login-tablo-code
4. Token mentése localStorage-ba
5. Redirect → /home
```

### 2. Vendég Belépés (Share)
```
1. User → /share/:token link
2. Token validálás automatikusan
3. POST /auth/login-tablo-share
4. Név bekérése (GuestNameDialog)
5. POST /tablo-frontend/guest/register
6. Session token mentése
7. Redirect → /home
```

### 3. Admin Előnézet (Preview)
```
1. Admin → generál preview token-t
2. User → /preview/:token link
3. POST /auth/login-tablo-preview
4. Token mentése
5. Redirect → /home (read-only jelzéssel)
```

---

## Vendég Session Rendszer

### Session Létrehozás
```typescript
interface GuestSession {
  sessionToken: string;    // Egyedi session azonosító
  guestName: string;       // Vendég neve (kötelező)
  guestEmail: string | null; // Email (opcionális)
}
```

### Device Fingerprint
- User agent
- Nyelv
- Képernyő méret
- Timezone
- Canvas fingerprint

### Session Életciklus
1. **Regisztráció** - Név megadásakor
2. **Validálás** - Oldal újratöltéskor
3. **Polling** - 30mp-ként status check
4. **Heartbeat** - Aktivitás jelzés
5. **Invalidálás** - Ban/törlés esetén

### LocalStorage Kulcsok
```
tablo:{projectId}:{sessionType}:guest_session  → session token
tablo:{projectId}:{sessionType}:guest_name     → vendég neve
```

---

## Jogosultság Ellenőrzés Kódban

### Frontend Guard
```typescript
// auth.guard.ts
canActivate(): Observable<boolean> {
  return this.authService.validateSession().pipe(
    map(response => response.valid)
  );
}
```

### Szerepkör Ellenőrzés
```typescript
// Komponensekben
get hasFullAccess(): boolean {
  return this.authService.getTokenType() !== 'share';
}

// Vagy signal-alapú
readonly isCoordinator = computed(() =>
  this.authService.tokenType() === 'code'
);
```

### API Szintű Védelem
- Backend ellenőrzi a token típusát
- `X-Guest-Session` header vendég műveletekhez
- 403 Forbidden ha nincs jogosultság
