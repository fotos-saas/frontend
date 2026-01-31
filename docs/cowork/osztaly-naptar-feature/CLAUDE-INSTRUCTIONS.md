# Claude Code Instructions - Osztály Naptár Feature

> OLVASD EL ELŐSZÖR: frontend-tablo/claude.md (projekt szabályok)

---

## 🎯 Feature Összefoglaló

**Mi ez:** Eseménynaptár ahol diákok látják az osztály fontos dátumait (szalagavató, ballagás, fotózás, érettségi).

**Fő funkciók:**
- Lista nézet események időrendben
- "Érdekel" / "Megyek" gombok
- Kapcsolattartó: CRUD események
- Push emlékeztető

---

## 📁 Létrehozandó Fájlok

```
src/app/
├── core/
│   ├── models/
│   │   └── event.models.ts           ← LÉTREHOZNI
│   └── services/
│       └── event.service.ts          ← LÉTREHOZNI
│
├── shared/
│   └── components/
│       ├── icon-picker/
│       │   ├── icon-picker.component.ts
│       │   └── icon-picker.component.scss
│       └── attendance-buttons/
│           ├── attendance-buttons.component.ts
│           └── attendance-buttons.component.scss
│
└── features/
    └── calendar/
        ├── calendar.routes.ts
        ├── event-list/
        │   ├── event-list.component.ts
        │   └── event-list.component.scss
        ├── event-card/
        │   ├── event-card.component.ts
        │   └── event-card.component.scss
        ├── event-details-modal/
        │   ├── event-details-modal.component.ts
        │   └── event-details-modal.component.scss
        ├── event-form-modal/
        │   ├── event-form-modal.component.ts
        │   └── event-form-modal.component.scss
        └── month-divider/
            ├── month-divider.component.ts
            └── month-divider.component.scss
```

---

## 🚀 Implementációs Fázisok

### FÁZIS 1: Models & Service (~0.5 nap)

**Fájlok:**
- [ ] `core/models/event.models.ts`
- [ ] `core/services/event.service.ts`

**Feladatok:**
1. Interfaces létrehozása (Event, AttendanceSummary, etc.)
2. EventService signals alapú state management
3. API hívások (mock data-val kezdve)
4. Optimistic update az attendance-hez

**KÉSZ FELTÉTEL:**
```typescript
// Működik:
eventService.loadEvents().subscribe();
eventService.eventsByMonth(); // grouped signal
eventService.setAttendance(1, 'going'); // optimistic
```

---

### FÁZIS 2: Shared Components (~0.5 nap)

**Fájlok:**
- [ ] `shared/components/attendance-buttons/`
- [ ] `shared/components/icon-picker/`

**Feladatok:**
1. AttendanceButtons - "Érdekel" / "Megyek" toggle
2. IconPicker - Emoji grid választó

**KÉSZ FELTÉTEL:**
- Chrome-ban tesztelve
- Gombok toggle-ölnek
- Ikon választó működik

---

### FÁZIS 3: Event Card & List (~1 nap)

**Fájlok:**
- [ ] `features/calendar/event-card/`
- [ ] `features/calendar/month-divider/`
- [ ] `features/calendar/event-list/`
- [ ] `features/calendar/calendar.routes.ts`

**Feladatok:**
1. EventCard komponens (ikon, cím, dátum, attendance)
2. MonthDivider (hónap elválasztó)
3. EventList (fő lista, hónap csoportosítás)
4. Routes bekötés

**KÉSZ FELTÉTEL:**
- `/calendar` URL működik
- Lista renderelődik mock data-val
- Attendance gombok működnek
- Hónap elválasztók megjelennek

---

### FÁZIS 4: Details Modal (~0.5 nap)

**Fájlok:**
- [ ] `features/calendar/event-details-modal/`

**Feladatok:**
1. Modal megjelenítés
2. Részletek: dátum, idő, hely, leírás
3. Attendance gombok
4. Emlékeztető checkbox-ok
5. Kapcsolattartónak: Szerkesztés/Törlés gombok

**KÉSZ FELTÉTEL:**
- Kártya kattintás → modal megnyílik
- Részletek helyesek
- ESC / X bezárja

---

### FÁZIS 5: Form Modal (~1 nap)

**Fájlok:**
- [ ] `features/calendar/event-form-modal/`

**Feladatok:**
1. Új esemény form
2. Szerkesztés form (pre-filled)
3. Validáció
4. Icon picker integration
5. Dátum/idő picker

**KÉSZ FELTÉTEL:**
- Új esemény létrehozható
- Szerkesztés működik
- Validáció működik

---

### FÁZIS 6: Polish & Navigation (~0.5 nap)

**Feladatok:**
1. Navbar menüpont hozzáadása
2. Empty state
3. Loading skeleton
4. Error handling
5. Responsive check

**KÉSZ FELTÉTEL:**
- Teljes flow működik
- Mobil responsive
- Nincs console error

---

## ⚠️ FONTOS Szabályok

### TypeScript
```typescript
// ✅ HELYES: Signals
private readonly _events = signal<Event[]>([]);
readonly events = this._events.asReadonly();

// ❌ ROSSZ: BehaviorSubject
private events$ = new BehaviorSubject<Event[]>([]);
```

### Komponensek
```typescript
// ✅ HELYES: Standalone, OnPush
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})

// ✅ HELYES: input/output
event = input.required<Event>();
click = output<void>();

// ❌ ROSSZ: @Input/@Output decorator
@Input() event!: Event;
@Output() click = new EventEmitter();
```

### Fájl méret
- Max 300 sor / fájl
- Ha nagyobb → bontsd szét

### Tesztelés
- Minden fázis végén: Chrome teszt
- Mobile responsive check

---

## 🎨 Design Tokens

```scss
// Színek
$color-going: #22C55E;      // Zöld
$color-interested: #3B82F6;  // Kék
$color-text: #1E293B;
$color-meta: #64748B;
$color-border: #E2E8F0;
$color-bg: #F8FAFC;

// Spacing
$space-xs: 4px;
$space-sm: 8px;
$space-md: 16px;
$space-lg: 24px;

// Border radius
$radius-sm: 8px;
$radius-md: 12px;
```

---

## 📱 Responsive Breakpoints

```scss
// Mobile first
.event-card {
  padding: $space-md;
}

// Tablet
@media (min-width: 768px) {
  .event-card {
    padding: $space-lg;
  }
}

// Desktop
@media (min-width: 1024px) {
  .event-list {
    max-width: 600px;
    margin: 0 auto;
  }
}
```

---

## 🧪 Mock Data

```typescript
// Használd fejlesztéshez:
const MOCK_EVENTS: Event[] = [
  {
    id: 1,
    icon: '📸',
    title: 'Tabló fotózás',
    date: '2025-01-31',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Iskolai tornaterem',
    locationAddress: null,
    description: 'Fehér ing és sötét nadrág szükséges.',
    createdBy: { id: 1, name: 'Kovács Tanár Úr' },
    createdAt: '2025-01-10T14:30:00Z',
    updatedAt: null,
    attendance: { going: 22, interested: 3, notResponded: 5 },
    myAttendance: 'going',
    myReminders: ['1_day']
  },
  {
    id: 2,
    icon: '💃',
    title: 'Szalagavató',
    date: '2025-02-14',
    startTime: '18:00',
    endTime: '23:00',
    location: 'Városi Művelődési Ház',
    locationAddress: 'Kossuth tér 5, Budapest',
    description: 'Öltözet: fiúk öltöny, lányok estélyi.',
    createdBy: { id: 1, name: 'Kovács Tanár Úr' },
    createdAt: '2025-01-05T10:00:00Z',
    updatedAt: null,
    attendance: { going: 25, interested: 2, notResponded: 3 },
    myAttendance: null,
    myReminders: []
  },
  {
    id: 3,
    icon: '🎓',
    title: 'Ballagás',
    date: '2025-05-02',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Iskola díszterem',
    locationAddress: null,
    description: null,
    createdBy: { id: 1, name: 'Kovács Tanár Úr' },
    createdAt: '2025-01-02T09:00:00Z',
    updatedAt: null,
    attendance: { going: 28, interested: 0, notResponded: 2 },
    myAttendance: 'going',
    myReminders: []
  }
];
```

---

## ✅ Végső Checklist

### Funkciók
- [ ] Lista nézet működik
- [ ] Hónap csoportosítás
- [ ] Érdekel/Megyek gombok
- [ ] Részletek modal
- [ ] Emlékeztető beállítás
- [ ] Új esemény (kapcsolattartó)
- [ ] Szerkesztés (kapcsolattartó)
- [ ] Törlés (kapcsolattartó)

### Technikai
- [ ] Signals használva (nem RxJS BehaviorSubject)
- [ ] OnPush change detection
- [ ] Standalone components
- [ ] Nincs 300+ soros fájl
- [ ] Strict TypeScript (no `any`)

### Tesztelés
- [ ] Chrome desktop OK
- [ ] Chrome mobile OK
- [ ] Nincs console error
- [ ] Optimistic UI működik

---

## 🔗 Kapcsolódó Dokumentumok

- [01-user-flow.md](./01-user-flow.md) - Teljes UX flow
- [02-ui-design.md](./02-ui-design.md) - UI komponensek
- [03-backend-api.md](./03-backend-api.md) - API spec
- [04-database-schema.md](./04-database-schema.md) - DB táblák
- [05-components.md](./05-components.md) - Angular komponensek

---

## 💡 LATER - Widget Home-on

Későbbi fejlesztéshez jegyzet (most NEM kell):

```
┌─────────────────────────────────────────────┐
│ ⏱️ KÖVETKEZŐ ESEMÉNY                        │
│ ┌─────────────────────────────────────────┐ │
│ │  📸 Tabló fotózás           12 nap 🔥  │ │
│ │      Jan 31. 10:00 • Tornaterem        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

Ez majd a Home oldalon jelenne meg, de egyelőre skip.
