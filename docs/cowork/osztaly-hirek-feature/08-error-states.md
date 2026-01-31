# Osztály Hírek - Error States & Edge Cases

> Verzió: 1.0
> Dátum: 2025-01-19
> Cél: Minden lehetséges hiba és edge case kezelése

---

## 🚫 Feed Error States

### 1. Hálózati Hiba (Network Error)

**Mikor:** Nincs internet vagy API nem elérhető

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      📡                                     │
│                                                             │
│              Nincs internetkapcsolat                        │
│                                                             │
│     Ellenőrizd a hálózati beállításokat                    │
│     és próbáld újra.                                        │
│                                                             │
│              [Újrapróbálom]                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Kezelés:**
```typescript
// news.service.ts
loadFeed().pipe(
  retry({ count: 3, delay: 1000 }),
  catchError(err => {
    if (!navigator.onLine) {
      return throwError(() => new NetworkError('offline'));
    }
    return throwError(() => new NetworkError('server_unreachable'));
  })
);
```

**UX:**
- Toast üzenet: "Nincs internet kapcsolat"
- Retry gomb látható
- Cached adat megjelenítése ha van

---

### 2. API Hiba (500 Server Error)

**Mikor:** Backend hiba

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      ⚠️                                     │
│                                                             │
│              Valami hiba történt                            │
│                                                             │
│     A szerver nem válaszol. Próbáld újra                   │
│     pár perc múlva.                                         │
│                                                             │
│              [Újrapróbálom]                                 │
│                                                             │
│     ───────────────────────────────────────                 │
│     Hiba kód: ERR_500_INTERNAL                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Kezelés:**
- Log error to monitoring (Sentry/LogRocket)
- Show user-friendly message
- Provide retry option

---

### 3. Jogosultsági Hiba (403 Forbidden)

**Mikor:** User nincs a projektben

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      🔒                                     │
│                                                             │
│              Nincs hozzáférésed                             │
│                                                             │
│     Ehhez a projekthez nincs jogosultságod.                │
│     Kérd meg a kapcsolattartót, hogy adjon hozzá.          │
│                                                             │
│              [Vissza a főoldalra]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Üres Feed (Empty State)

**Mikor:** Nincs még aktivitás a projektben

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      📰                                     │
│                                                             │
│              Még nincsenek hírek                           │
│                                                             │
│     Amint történik valami az osztállyal,                   │
│            itt fogod látni!                                │
│                                                             │
│     ───────────────────────────────────────                 │
│     Kapcsolattartónak:                                      │
│     [+ Első hirdetmény közzététele]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Betöltési Hiba (Load More Error)

**Mikor:** "Több betöltése" gomb sikertelen

```
┌─────────────────────────────────────────────────────────────┐
│ [Feed Item 1]                                               │
│ [Feed Item 2]                                               │
│ [Feed Item 3]                                               │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│  ⚠️ Nem sikerült több elemet betölteni                     │
│                                                             │
│  [Újra] vagy [Mégse]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Kezelés:**
- Inline hiba (nem modal)
- Meglévő elemek maradnak
- Retry lehetőség

---

### 6. Rate Limit (429)

**Mikor:** Túl sok request

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      ⏳                                     │
│                                                             │
│              Túl sok kérés                                  │
│                                                             │
│     Kérlek várj egy kicsit mielőtt frissítesz.             │
│     Automatikus újratöltés: 45 másodperc                   │
│                                                             │
│              [░░░░░░░████████████]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Kezelés:**
- Auto-retry countdown timer
- Disable refresh button temporarily

---

## 🔔 Notification Error States

### 1. Push Permission Denied

**Mikor:** User nem engedélyezte a push-t

```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Értesítési beállítások                                   │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│  ⚠️ Push értesítések blokkolva                             │
│                                                             │
│  A böngésződben letiltottad az értesítéseket.              │
│  Engedélyezd a beállításokban:                             │
│                                                             │
│  1. Kattints a 🔒 ikonra a címsorban                       │
│  2. Értesítések → Engedélyezés                             │
│                                                             │
│  [Segítség kérése]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Dropdown Load Error

**Mikor:** Értesítések nem töltődnek

```
┌─────────────────────────────────────────────────────────────┐
│ Értesítések                                                 │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│  ⚠️ Nem sikerült betölteni                                 │
│                                                             │
│  [Újra]                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Mark Read Error

**Mikor:** "Mindet láttam" sikertelen

```
Toast: "⚠️ Nem sikerült olvasottnak jelölni. Próbáld újra."
```

**Kezelés:**
- Optimistic update rollback
- Toast notification
- Badge visszaállítása

---

## 📢 Announcement Error States

### 1. Banner Dismiss Error

**Mikor:** X gomb nem működik

```
Toast: "⚠️ Nem sikerült elrejteni. Próbáld újra."
```

**Kezelés:**
- Banner marad látható
- Toast hiba
- Retry automatic (silent)

---

### 2. Create Announcement Error

**Mikor:** Hirdetmény létrehozás sikertelen

```
┌─────────────────────────────────────────────────────────────┐
│              HIRDETMÉNY LÉTREHOZÁS                          │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│  ⚠️ Hiba történt a közzétételnél                           │
│                                                             │
│  [Hiba részletei ▼]                                         │
│  "A szerver nem válaszol (500)"                            │
│                                                             │
│  [Mégse]  [Újrapróbálom]                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Validation Error

**Mikor:** Üres vagy túl hosszú üzenet

```
┌─────────────────────────────────────────────────────────────┐
│ Üzenet:                                                     │
│ ┌───────────────────────────────────────────────────────┐  │
│ │                                                       │  │
│ └───────────────────────────────────────────────────────┘  │
│ ⚠️ Az üzenet nem lehet üres                                │
│                                                             │
│ VAGY                                                        │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Lorem ipsum dolor sit amet...                         │  │
│ └───────────────────────────────────────────────────────┘  │
│ ⚠️ Maximum 500 karakter (jelenleg: 523)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Edge Cases

### 1. Concurrent Updates

**Mikor:** Valaki más is módosít közben

**Szcenárió:** User A és B egyszerre nézik a feed-et, B posztol

**Kezelés:**
```typescript
// Real-time update via WebSocket
websocket.on('feed:new_item', (item) => {
  // Új elem hozzáadása a lista elejére
  feedItems.update(items => [item, ...items]);

  // Subtle notification
  showToast('Új aktivitás a feedben', { action: 'Megnézem' });
});
```

---

### 2. Stale Data (Régi adat)

**Mikor:** User sokáig nem frissít

**Kezelés:**
- Background polling 60 másodpercenként
- Badge update az új elemekről
- Pull-to-refresh hint

```
┌─────────────────────────────────────────────────────────────┐
│ ↓ 3 új aktivitás - húzd le a frissítéshez                  │
│ ─────────────────────────────────────────────────────────── │
│ [Régebbi Feed Item 1]                                       │
│ [Régebbi Feed Item 2]                                       │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Deleted Reference

**Mikor:** Feed item hivatkozik törölt elemre (pl. törölt szavazás)

**Kezelés:**
```typescript
if (item.type === 'poll_created' && !item.poll) {
  // Szavazás törölve lett
  return (
    <FeedCard disabled>
      <span class="text-muted">Ez a szavazás már nem elérhető</span>
    </FeedCard>
  );
}
```

---

### 4. Long Content

**Mikor:** Túl hosszú szöveg

**Kezelés:**
- Max 3 sor megjelenítés
- "tovább..." link
- CSS: `line-clamp: 3;`

```scss
.feed-card__content {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

### 5. Gyors Egymás Utáni Kattintások

**Mikor:** User spam-eli a gombot

**Kezelés:**
```typescript
// Debounce like
const handleLike = debounce((postId: number) => {
  likePost(postId);
}, 300);

// Disable button during API call
<button
  [disabled]="isLiking()"
  (click)="handleLike(post.id)"
>
  Like
</button>
```

---

### 6. Offline → Online Transition

**Mikor:** User visszakapcsolódik

**Kezelés:**
```typescript
window.addEventListener('online', () => {
  // Sync pending actions
  syncPendingLikes();

  // Refresh feed
  refreshFeed();

  // Show toast
  showToast('Újra online! Frissítés...', 'success');
});
```

---

### 7. Session Expired

**Mikor:** JWT lejárt

**Kezelés:**
```typescript
interceptor.handle(req).pipe(
  catchError(err => {
    if (err.status === 401) {
      // Try refresh token
      return refreshToken().pipe(
        switchMap(newToken => {
          // Retry original request
          return next.handle(req.clone({
            headers: req.headers.set('Authorization', `Bearer ${newToken}`)
          }));
        }),
        catchError(() => {
          // Refresh failed, logout
          logout();
          router.navigate(['/login']);
          return throwError(() => err);
        })
      );
    }
    return throwError(() => err);
  })
);
```

---

### 8. Pagination Boundary

**Mikor:** Pont az utolsó oldalon vagyunk

**Kezelés:**
```typescript
// "Több betöltése" gomb hide
@if (hasMore()) {
  <button (click)="loadMore()">Több betöltése</button>
} @else {
  <p class="text-muted text-center">
    Ez az összes aktivitás
  </p>
}
```

---

### 9. Conflicting Notifications

**Mikor:** Több notification ugyanarról

**Szcenárió:** Poll created + Poll ending ugyanarról a szavazásról

**Kezelés:**
- Backend: Csoportosítás, de-duplication
- Frontend: Legújabb megjelenítése

---

### 10. Time Zone Issues

**Mikor:** User más időzónában

**Kezelés:**
```typescript
// Mindig relatív idő
formatRelativeTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} perce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} órája`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} napja`;

  // Dátum lokalizálva
  return date.toLocaleDateString('hu-HU');
}
```

---

## 📱 Device-Specific Edge Cases

### Small Screen (< 320px)

```scss
@media (max-width: 320px) {
  .feed-card {
    padding: 12px;

    &__header {
      flex-wrap: wrap;
    }

    &__timestamp {
      width: 100%;
      margin-top: 4px;
    }
  }
}
```

### Slow Connection (3G)

**Kezelés:**
- Skeleton loaders
- Image lazy loading
- Reduced image quality
- Text-first loading

```typescript
// Detect slow connection
if (navigator.connection?.effectiveType === '2g' ||
    navigator.connection?.effectiveType === 'slow-2g') {
  // Load low-res images
  imageQuality = 'low';
}
```

---

## ✅ Error Handling Checklist

### Feed
- [ ] Network offline
- [ ] Server error (500)
- [ ] Forbidden (403)
- [ ] Empty state
- [ ] Load more error
- [ ] Rate limit (429)
- [ ] Stale data hint

### Notifications
- [ ] Push permission denied
- [ ] Dropdown load error
- [ ] Mark read error
- [ ] WebSocket disconnect

### Announcements
- [ ] Banner dismiss error
- [ ] Create error
- [ ] Validation errors

### Edge Cases
- [ ] Concurrent updates
- [ ] Deleted references
- [ ] Long content truncation
- [ ] Double-click prevention
- [ ] Offline → Online sync
- [ ] Session expired
- [ ] Pagination boundary
- [ ] Timezone handling
