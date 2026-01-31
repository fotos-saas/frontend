# Angular 20+ Javítások - Értesítési Központ Dokumentáció

> Dátum: 2026-01-23
> Projekt: Tablókirály - Értesítési Központ Feature
> Verzió: 1.1

---

## 📋 ELVÉGZETT JAVÍTÁSOK

### ✅ 1. WebSocket Service Használat

**❌ ELŐTTE** (hibás dokumentáció):
```typescript
// NEM LÉTEZŐ metódus a WebsocketService-ben!
this.websocketService.subscribeToPrivateChannel<NotificationEvent>(
  `user.${userId}.notifications`,
  'notification.new',
  (data) => this.handleNewNotification(data)
);
```

**✅ UTÁNA** (helyes használat):
```typescript
// A MEGLÉVŐ WebsocketService.private() metódusát használjuk
const channel = this.websocket.private(`user.${userId}.notifications`);

if (channel) {
  // Események figyelése a csatornán
  channel.listen('notification.new', (data: NotificationEvent) => {
    this.handleNewNotification(data);
  });
}
```

**Indoklás:**
- A meglévő `WebsocketService` **NEM** tartalmaz `subscribeToPrivateChannel()` metódust
- A helyes API: `private(channelName: string)` + `listen(event, callback)`
- A dokumentáció kitalált metódust hivatkozott

---

### ✅ 2. Toast Service Signature Javítás

**❌ ELŐTTE** (hibás dokumentáció):
```typescript
success(message: string): void;
error(title: string, message?: string): void;
info(message: string): void;
```

**✅ UTÁNA** (helyes signature):
```typescript
success(title: string, message: string, duration?: number): void;
error(title: string, message: string, duration?: number): void;
info(title: string, message: string, duration?: number): void;
```

**Indoklás:**
- A MEGLÉVŐ `ToastService` **MINDEN** metódusa 2 kötelező paramétert vár: `title` és `message`
- Az `error` metódusnál a `message` **NEM** opcionális
- A dokumentáció tévesen 1 paraméteres hívást javasolt

**Használat ELŐTTE:**
```typescript
this.toastService.success('szavazat elküldve'); // ❌ NEM működik!
this.toastService.info('👉 kiss béla bökött'); // ❌ NEM működik!
```

**Használat UTÁNA:**
```typescript
this.toastService.success('szavazat elküldve', ''); // ✅ Működik
this.toastService.info('👉 kiss béla bökött', 'szavazz már pls'); // ✅ Működik
```

---

### ✅ 3. Signal API Használat (Angular 20+)

**Hozzáadva** a kritikus szabályokhoz:

```typescript
// ✅ HELYES - Component inputs/outputs (Angular 20+)
notification = input.required<Notification>();
dismissed = output<void>();

// ❌ HELYTELEN - NE használj @Input/@Output decorator-okat (elavult!)
@Input() notification!: Notification;
@Output() dismissed = new EventEmitter<void>();
```

**Indoklás:**
- Angular 20+ **Signal-alapú inputs/outputs** használata kötelező
- `@Input/@Output` decorator-ok elavultak, de még működnek
- A dokumentációban ez eddig nem volt expliciten kihangsúlyozva

---

### ✅ 4. OnPush Change Detection

**Ellenőrzés:**
- ✅ Minden komponensben `changeDetection: ChangeDetectionStrategy.OnPush` van
- ✅ Helyes használat

---

### ✅ 5. Standalone Components

**Ellenőrzés:**
- ✅ Minden komponens `standalone: true`
- ✅ Helyes használat

---

## 🔍 JAVÍTOTT FÁJLOK

| Fájl | Változás |
|------|----------|
| `05-components.md` | WebSocket használat, Toast Service signature, OnPush javítás |
| `CLAUDE-INSTRUCTIONS.md` | WebSocket használat, Toast Service signature, Signal API szabályok |
| `README.md` | Tech stack frissítés, kritikus megjegyzés hozzáadása |

---

## 📦 MEGLÉVŐ SZOLGÁLTATÁSOK (BŐVÍTENDŐ!)

### ToastService
- **Lokáció:** `core/services/toast.service.ts`
- **Jelenlegi állapot:** Singleton toast (1 toast egyszerre)
- **Bővítendő:**
  - Toast queue (több toast kezelése)
  - `warning()` metódus
  - `showWithUndo()` metódus (snackbar)
  - `show()` általános metódus action callback-kel

### WebsocketService
- **Lokáció:** `core/services/websocket.service.ts`
- **Jelenlegi állapot:** Teljes Echo/Reverb integráció
- **API:**
  - `private(channelName: string)` - privát csatorna létrehozása
  - `leave(channelName: string)` - csatorna elhagyása
  - `connectionState` signal
  - `isConnected` computed signal

---

## ⚠️ KRITIKUS SZABÁLYOK

1. **MINDIG** a meglévő `WebsocketService.private()` metódust használd
2. **MINDIG** 2 paramétert adj át a Toast Service metódusoknak
3. **MINDIG** használj `input()` és `output()` a komponensekben (NEM `@Input/@Output`)
4. **MINDIG** `OnPush` change detection
5. **MINDIG** `standalone: true`
6. **SOHA** ne használj `BehaviorSubject`-et új kódban (Signal-t használj)

---

## 🚀 KÖVETKEZŐ LÉPÉSEK

1. **Backend API implementáció** (03-backend-api.md szerint)
2. **NotificationStateService** implementáció (05-components.md szerint)
3. **NotificationWebSocketService** implementáció (JAVÍTOTT verzió szerint!)
4. **Toast Service BŐVÍTÉSE** (NEM új létrehozása!)
5. **Komponensek implementálása** Signal API-val

---

**Elkészítette:** Claude Code AI Assistant
**Dátum:** 2026-01-23
