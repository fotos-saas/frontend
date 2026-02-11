# PhotoStack Component Registry

> **FONTOS:** Mielőtt új komponenst/service-t hoznál létre, MINDIG ellenőrizd ezt a registryt!
> Ha létezik hasonló, HASZNÁLD azt, NE hozz létre újat!

---

## Gyors Keresés (Claude számára)

| Ha ezt akarod... | Használd ezt | Lokáció |
|------------------|--------------|---------|
| Modal/Dialog (egyszerű) | `ConfirmDialogComponent` | `@shared/components/confirm-dialog` |
| Modal/Dialog (komplex) | `DialogWrapperComponent` | `@shared/components/dialog-wrapper` |
| Toast üzenet | `ToastService` | `@core/services/toast.service` |
| Loading spinner | `LoadingSpinnerComponent` | `@shared/components/loading-spinner` |
| Skeleton loading | `SkeletonComponent` | `@shared/components/skeleton` |
| File upload | `FileUploadService` | `@core/services/file-upload.service` |
| Fotó galéria | `GalleryComponent` | `@features/gallery` |
| Lightbox | `LightboxService` | `@core/services/lightbox.service` |
| Form validáció | Angular Reactive Forms | `@angular/forms` |
| HTTP kérések | `HttpClient` + interceptors | `@core/interceptors` |
| Ikonok | `ICONS` konstans + Lucide | `@shared/constants/icons.constants` |
| Tooltip | `matTooltip` | `@angular/material/tooltip` |
| Dropdown/Select | `mat-select` | `@angular/material/select` |
| Dátumválasztó | `mat-datepicker` | `@angular/material/datepicker` |
| Táblázat | `mat-table` | `@angular/material/table` |
| Értesítések (web) | `ToastService` | `@core/services/toast.service` |
| Értesítések (native) | `ElectronService` | `@core/services/electron.service` |
| Auth kezelés | `AuthService` | `@core/services/auth.service` |
| WebSocket | `WebsocketService` | `@core/services/websocket.service` |
| Szűrők tárolása | `FilterPersistenceService` | `@core/services/filter-persistence.service` |
| Vágólap | `ClipboardService` | `@core/services/clipboard.service` |
| Scroll lock | `ScrollLockService` | `@core/services/scroll-lock.service` |
| Platform detection | `ElectronService` | `@core/services/electron.service` |
| Dark mode | `ElectronService.darkModeChanges` | `@core/services/electron.service` |
| Offline queue | `ElectronService.queueRequest()` | `@core/services/electron.service` |
| Logging | `LoggerService` | `@core/services/logger.service` |
| Partner API | `PartnerService` (facade) | `@features/partner/services/partner.service` |
| Guest API | `GuestService` (facade) | `@core/services/guest.service` |

---

## UI Komponensek

### Dialógusok / Modalok

**DialogWrapperComponent (ajánlott komplex dialógusokhoz)**

```typescript
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
```

- **3 header stílus:** hero (gradient+nagy ikon), flat (border-bottom+kis ikon), minimal (csak cím)
- **3 méret:** sm (384px), md (480px), lg (800px)
- **5 téma:** purple, green, blue, red, amber
- **Slotok:** dialogBody, dialogLeft/dialogRight (2-column), dialogFooter, dialogExtra
- **Footer:** end/center/stretch align, Enter submit, ESC close
- **FONTOS:** ng-content projected tartalom a HOST scope-ban stílusozódik

**ConfirmDialogComponent (egyszerű megerősítés)**

```typescript
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog';

this.dialog.open(ConfirmDialogComponent, {
  data: {
    title: 'Törlés megerősítése',
    message: 'Biztosan törölni szeretnéd?',
    confirmText: 'Törlés',
    cancelText: 'Mégse'
  }
});
```

**Meglévő dialog típusok:**
- `ConfirmDialogComponent` - Megerősítő dialógus (törlés, mentés)
- `AlertDialogComponent` - Egyszerű értesítő dialógus
- `InputDialogComponent` - Input mezős dialógus
- `DialogWrapperComponent` - Komplex dialógus wrapper (hero/flat/minimal header)

### Loading / Skeleton

```html
@if (loading()) {
  <app-skeleton [lines]="3" />
}
```

### Ikonok

```typescript
import { ICONS } from '@shared/constants/icons.constants';

readonly ICONS = ICONS;

// Template:
<lucide-icon [name]="ICONS.PLUS" [size]="18" />
```

### Tooltip

```html
<button matTooltip="Mentés">Save</button>
<button matTooltip="Törlés" matTooltipPosition="above">Delete</button>
```

---

## Core Services

### LoggerService (Logging - console.log HELYETT!)

```typescript
import { LoggerService } from '@core/services/logger.service';

private readonly logger = inject(LoggerService);

this.logger.info('Művelet sikeres', { context: 'details' });
this.logger.warn('Figyelmeztetés');
this.logger.error('Hiba', error);
```

### ToastService (Értesítések)

```typescript
import { ToastService } from '@core/services/toast.service';

private readonly toast = inject(ToastService);

this.toast.success('Sikeres mentés!');
this.toast.error('Hiba történt!');
this.toast.warning('Figyelmeztetés');
this.toast.info('Információ');
```

### AuthService (Autentikáció - Signal-based)

```typescript
import { AuthService } from '@core/services/auth.service';

private readonly auth = inject(AuthService);

// Signal-based (ajánlott):
this.auth.isAuthenticated()    // signal<boolean>
this.auth.currentUser()        // signal<User | null>
this.auth.project()            // signal<Project | null>

// Observable (backward compat):
this.auth.isAuthenticated$     // Observable<boolean>
this.auth.currentUser$         // Observable<User>
```

### FileUploadService (Fájl feltöltés)

```typescript
import { FileUploadService } from '@core/services/file-upload.service';

private readonly fileUpload = inject(FileUploadService);

this.fileUpload.upload(file, {
  onProgress: (percent) => this.progress.set(percent),
  onComplete: (response) => this.handleComplete(response),
  onError: (error) => this.handleError(error)
});
```

### LightboxService (Képnagyítás)

```typescript
import { LightboxService } from '@core/services/lightbox.service';

private readonly lightbox = inject(LightboxService);

this.lightbox.open(imageUrl);
this.lightbox.openGallery(images, startIndex);
```

---

## Facade Pattern Services

A nagy service-ek facade + sub-service pattern-nel vannak szétbontva. **MINDIG a facade-on keresztül használd!**

### PartnerService (Facade)

```typescript
import { PartnerService } from '@features/partner/services/partner.service';
```

**Sub-service-ek** (`@features/partner/services/`):

| Service | Felelősség |
|---------|------------|
| `partner-project.service` | Projekt CRUD, beállítások |
| `partner-contact.service` | Kontakt kezelés |
| `partner-album.service` | Album műveletek |
| `partner-gallery.service` | Galéria + monitoring + export |
| `partner-school.service` | Iskola kezelés |
| `partner-guest.service` | Vendég kezelés |
| `partner-orders.service` | Rendelés facade |
| `partner-order-list.service` | Rendelés lista |
| `partner-order-detail.service` | Rendelés részletek |
| `partner-billing.service` | Számlázás |
| `partner-qr.service` | QR kód generálás |
| `partner-service-catalog.service` | Szolgáltatás katalógus |
| `partner-stripe-settings.service` | Stripe konfiguráció |
| `partner-teacher.service` | Tanári adatbázis |
| `partner-webshop.service` | Webshop integráció |

### GuestService (Facade)

```typescript
import { GuestService } from '@core/services/guest.service';
```

**Sub-service-ek** (`@core/services/`):

| Service | Felelősség |
|---------|------------|
| `guest-session.service` | Session kezelés |
| `guest-verification.service` | Email verifikáció |

### ElectronService (Facade)

```typescript
import { ElectronService } from '@core/services/electron.service';
```

**Sub-service-ek** (`@core/services/`):

| Service | Felelősség |
|---------|------------|
| `electron-cache.service` | Offline cache, sync queue |
| `electron-drag.service` | Native drag & drop, Touch Bar |
| `electron-notification.service` | Értesítések, dock badge |
| `electron-payment.service` | Stripe payment, deep links |

### Egyéb Facade-ok

| Facade | Lokáció |
|--------|---------|
| `order-finalization-facade.service` | `@features/order-finalization/services/` |
| `template-chooser-facade.service` | `@features/template-chooser/` |
| `voting-list-facade.service` | `@features/voting/voting-list/` |
| `project-detail-wrapper-facade.service` | `@shared/components/project-detail/` |

---

## Layout Komponensek

### Page Layout

```html
<div class="my-component page-card">
  <!-- Tartalom -->
</div>
```

### App Shell

```typescript
// Használd az AppShellComponent-et minden oldalon
// Automatikusan kezeli: sidebar, topbar, mobile nav
```

### Sidebar

```typescript
import { SidebarComponent } from '@core/layout/components/sidebar';
import { MenuConfigService } from '@core/layout/services/menu-config.service';

this.menuConfig.setMenuItems([...]);
```

---

## Shared Utilities

### Dialog Utils

```typescript
import { createBackdropHandler } from '@shared/utils/dialog.util';

// Dialógus backdrop kezelés (szöveg kijelölés közben ne záródjon)
backdropHandler = createBackdropHandler(() => this.close.emit());
```

### Date Utils

```typescript
import { formatDate, parseDate, isToday } from '@shared/utils/date.util';
```

### Validators

```typescript
import { CustomValidators } from '@shared/validators';

this.form = this.fb.group({
  email: ['', [Validators.required, CustomValidators.email]],
  phone: ['', CustomValidators.hungarianPhone],
});
```

---

## CSS Osztályok

### Dialog Panel Méretek

| Class | Max-width | Használat |
|-------|-----------|-----------|
| `dialog-panel` | 400px | Confirm, alert |
| `dialog-panel--md` | 480px | Form, QR modal |
| `dialog-panel--lg` | 600px | Részletes form |

### Animációk

```css
.fade-enter { animation: fadeIn 0.2s ease; }
.slide-up { animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.stagger-item { animation-delay: calc(var(--index) * 0.05s); }
```

---

## Patterns (Minták)

### Cleanup Pattern (KÖTELEZŐ - Modern)

```typescript
// Angular 21+ - takeUntilDestroyed()
private readonly destroyRef = inject(DestroyRef);

constructor() {
  this.service.data$
    .pipe(takeUntilDestroyed())
    .subscribe(data => this.handleData(data));
}
```

### Signal State Pattern (AJÁNLOTT)

```typescript
// Signal-based state (NEM BehaviorSubject!)
private readonly _items = signal<Item[]>([]);
readonly items = this._items.asReadonly();
readonly activeItems = computed(() => this._items().filter(i => i.active));
```

### Loading State Pattern

```typescript
readonly loading = signal(false);
readonly error = signal<string | null>(null);

async loadData() {
  this.loading.set(true);
  this.error.set(null);

  try {
    const data = await this.service.getData();
    this._items.set(data);
  } catch (err) {
    this.error.set('Hiba az adatok betöltésekor');
    this.toast.error(this.error());
  } finally {
    this.loading.set(false);
  }
}
```

### Form Pattern

```typescript
form = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]],
});

onSubmit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  // Submit logic...
}
```

---

## Anti-Patterns (KERÜLENDŐ)

```typescript
// 1. any típus
const data: any = response;              // signal<Data> + proper typing

// 2. Subscription leak
this.service.data$.subscribe(d => ...);  // takeUntilDestroyed()!

// 3. Console.log
console.log('Debug:', data);             // LoggerService!

// 4. Magyar változónév
const felhasznaloNeve = user.name;       // angol változónevek!

// 5. Inline style
<div style="color: red;">               // SCSS class!

// 6. Emoji ikon
<span>...</span>                         // Lucide icon!

// 7. Régi cleanup pattern
private destroy$ = new Subject<void>();  // takeUntilDestroyed()!

// 8. BehaviorSubject state-hez
new BehaviorSubject<T>(initial);         // signal<T>(initial)!

// 9. Saját modal/toast/spinner implementáció
// 10. Hardcoded API URL
```

---

## Mikor Hozz Létre Újat?

Csak akkor hozz létre új komponenst/service-t, ha:

1. Átnézted ezt a registryt és NINCS megfelelő
2. A meglévő NEM bővíthető az igényedhez
3. Legalább 3 helyen fogod használni (újrahasználható)
4. Megbeszélted a döntést (review)

Ha új komponenst hozol létre:
1. ADD HOZZÁ EZT A REGISTRYT!
2. Dokumentáld a használatot
3. Adj példakódot
