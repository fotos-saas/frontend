# Notifications Feature

Értesítések (Notifications) funkció implementáció a TablóStúdió Angular 21+ alkalmazáshoz.

## 📁 Komponensek

### NotificationsListComponent
**Fájl:** `notifications-list/notifications-list.component.ts`

Értesítések lista oldal:
- Összes értesítés megjelenítése
- Szűrés típus szerint (poke, reply, mention, like, badge)
- "Összes olvasottnak jelölése" funkció
- Skeleton loading states
- Empty state animáció
- Signal-based reactive state management

**API integráció:**
- `NotificationService.loadNotifications()` - Értesítések betöltése
- `NotificationService.markAllAsRead()` - Összes olvasottnak jelölés
- `NotificationService.markAsRead()` - Egyedi értesítés olvasottnak jelölés

### NotificationCardComponent
**Fájl:** `notification-card/notification-card.component.ts`

Egyedi értesítés kártya:
- Ikon típus szerint (emoji + színes háttér)
- Cím és szöveg megjelenítés
- Relatív idő (pl. "5 perce", "2 órája", "3 napja")
- Olvasott/olvasatlan státusz vizualizáció
- Hover micro-interactions

**Input Signals:**
- `notification` - Notification objektum

## 🎨 Értesítés Típusok

| Típus | Emoji | Szín | Leírás |
|-------|-------|------|--------|
| `poke` | 👉 | Sárga | Bökések |
| `poke_reaction` | 😀 | Sárga | Bökés reakciók |
| `reply` | 💬 | Kék | Válaszok |
| `mention` | 📢 | Lila | Említések (@) |
| `like` | ❤️ | Rózsaszín | Reakciók (like) |
| `badge` | 🏆 | Arany | Kitüntetések |

## 🚀 Route Konfiguráció

**URL:** `/notifications`

**Lazy Loading:**
```typescript
{
  path: 'notifications',
  loadChildren: () => import('./features/notifications/notifications.routes')
    .then(m => m.NOTIFICATIONS_ROUTES),
  canActivate: [AuthGuard, GuestNameGuard],
  data: { page: 'notifications' }
}
```

## 🎯 Sidebar Menu

Az Értesítések link a sidebar-ban:
```typescript
{
  id: 'notifications',
  label: 'Értesítések',
  icon: 'bell',
  route: '/notifications',
}
```

**Ikon:** Lucide `Bell` ikon (regisztrálva az `app.module.ts`-ben)

## ✨ UI/UX Animációk

### Loading States
- **Skeleton shimmer** - Betöltés alatt shimmer effekt
- **Staggered entry** - Értesítések egymás után animálódnak be (0.05s delay)

### Interaktív Elemek
- **Card hover** - translateY(-2px) + box-shadow növelés
- **Icon scale** - Hover-re az ikon 1.1x méret
- **Badge shine** - Arany badge csillanás effekt (2s loop)
- **Pulse indicator** - Olvasatlan jelző pulsing animáció

### Empty State
- **Float animáció** - A 🔔 ikon lebeg (3s ease-in-out infinite)

### Accessibility
```scss
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

## 📊 State Management

**Service:** `NotificationService` (`core/services/notification.service.ts`)

**Signals:**
- `notifications` - Értesítések listája
- `unreadCount` - Olvasatlan értesítések száma
- `loading` - Betöltés állapot

**Computed:**
- `hasUnread` - Van-e olvasatlan értesítés?
- `recentNotifications` - Legfrissebb 5 értesítés

## 🔔 Real-time Frissítések

A `NotificationService` WebSocket-en keresztül figyeli az új értesítéseket:

```typescript
subscribeToNotifications(projectId, recipientType, recipientId)
```

**Channel:** `notifications.{projectId}.{recipientType}.{recipientId}`
**Event:** `.new.notification`

## 📱 Responsive Design

- **Mobile (< 768px):** Teljes szélesség, 1rem padding
- **Desktop (≥ 768px):** Max 768px szélesség, középre igazítva, 2rem padding

## 🧪 Tesztelés

### Manuális Tesztek
1. Értesítések betöltése
2. Szűrők váltása (összes, bökések, válaszok, stb.)
3. Olvasottnak jelölés (egyedi kattintás)
4. "Összes olvasva" gomb
5. Empty state megjelenítés
6. Loading skeleton animáció

### E2E Tesztek
- [ ] Route navigáció működik
- [ ] Szűrők megfelelően működnek
- [ ] Olvasottnak jelölés frissíti a UI-t
- [ ] Real-time értesítés érkezik és megjelenik
- [ ] Empty state megjelenik üres lista esetén

## 🎓 Modern Angular 21+ Patterns

- ✅ Standalone komponensek
- ✅ Signal API (`signal`, `computed`, `input`)
- ✅ Modern control flow (`@if`, `@for`)
- ✅ OnPush change detection
- ✅ `takeUntilDestroyed()` - automatikus unsubscribe
- ✅ Typed signals és computed values
- ✅ Lazy loading routes

## 🔗 Kapcsolódó Fájlok

- **Service:** `core/services/notification.service.ts`
- **Routes:** `app-routing.module.ts`
- **Menu:** `core/layout/services/menu-config.service.ts`
- **Icons:** `app.module.ts` (Lucide Bell ikon regisztráció)
