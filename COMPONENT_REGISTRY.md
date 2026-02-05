# 📦 PhotoStack Component Registry

> **FONTOS:** Mielőtt új komponenst/service-t hoznál létre, MINDIG ellenőrizd ezt a registryt!
> Ha létezik hasonló, HASZNÁLD azt, NE hozz létre újat!

---

## 🔍 Gyors Keresés (Claude számára)

Mielőtt implementálsz valamit, keresd meg itt:

| Ha ezt akarod... | Használd ezt | Lokáció |
|------------------|--------------|---------|
| Modal/Dialog | `ConfirmDialogComponent` | `@shared/components/confirm-dialog` |
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
| Értesítések (native) | `ElectronService.showNotification()` | `@core/services/electron.service` |
| Auth kezelés | `AuthService` | `@core/services/auth.service` |
| WebSocket | `WebsocketService` | `@core/services/websocket.service` |
| Szűrők tárolása | `FilterPersistenceService` | `@core/services/filter-persistence.service` |
| Vágólap | `ClipboardService` | `@core/services/clipboard.service` |
| Scroll lock | `ScrollLockService` | `@core/services/scroll-lock.service` |
| Platform detection | `ElectronService` | `@core/services/electron.service` |
| Dark mode | `ElectronService.darkModeChanges` | `@core/services/electron.service` |
| Offline queue | `ElectronService.queueRequest()` | `@core/services/electron.service` |

---

## 🧱 UI Komponensek

### Dialógusok / Modalok

```typescript
// ❌ NE CSINÁLJ ILYET - új modal komponens
@Component({ template: `<div class="my-custom-modal">...` })

// ✅ HASZNÁLD EZT
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog';

// Használat:
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

### Loading / Skeleton

```typescript
// ❌ NE CSINÁLJ ILYET
<div *ngIf="loading" class="spinner">...</div>

// ✅ HASZNÁLD EZT
<app-skeleton *ngIf="loading" [lines]="3" />
<app-loading-spinner *ngIf="loading" [size]="'md'" />
```

### Ikonok

```typescript
// ❌ NE CSINÁLJ ILYET
<span>📱</span>  // emoji
<i class="fa fa-plus"></i>  // FontAwesome

// ✅ HASZNÁLD EZT
import { ICONS } from '@shared/constants/icons.constants';

readonly ICONS = ICONS;

// Template:
<lucide-icon [name]="ICONS.PLUS" [size]="18" />
<lucide-icon [name]="ICONS.TRASH" [size]="16" class="text-red-500" />
```

### Tooltip

```typescript
// ❌ NE CSINÁLJ ILYET
<span title="Tooltip szöveg">...</span>
<span data-tooltip="...">...</span>

// ✅ HASZNÁLD EZT
<button matTooltip="Mentés">Save</button>
<button matTooltip="Törlés" matTooltipPosition="above">Delete</button>
```

---

## 🔧 Core Services

### ToastService (Értesítések)

```typescript
// ❌ NE CSINÁLJ ILYET - alert() vagy console.log()
alert('Sikeres mentés!');

// ✅ HASZNÁLD EZT
import { ToastService } from '@core/services/toast.service';

constructor(private toast: ToastService) {}

// Használat:
this.toast.success('Sikeres mentés!');
this.toast.error('Hiba történt!');
this.toast.warning('Figyelmeztetés');
this.toast.info('Információ');
```

### FileUploadService (Fájl feltöltés)

```typescript
// ❌ NE CSINÁLJ ILYET - saját fetch/XMLHttpRequest
const formData = new FormData();
fetch('/upload', { body: formData });

// ✅ HASZNÁLD EZT
import { FileUploadService } from '@core/services/file-upload.service';

constructor(private fileUpload: FileUploadService) {}

// Használat:
this.fileUpload.upload(file, {
  onProgress: (percent) => this.progress = percent,
  onComplete: (response) => this.handleComplete(response),
  onError: (error) => this.handleError(error)
});
```

### LightboxService (Képnagyítás)

```typescript
// ❌ NE CSINÁLJ ILYET - saját modal képhez
<div class="image-modal" *ngIf="showImage">

// ✅ HASZNÁLD EZT
import { LightboxService } from '@core/services/lightbox.service';

constructor(private lightbox: LightboxService) {}

// Használat:
this.lightbox.open(imageUrl);
this.lightbox.openGallery(images, startIndex);
```

### AuthService (Autentikáció)

```typescript
import { AuthService } from '@core/services/auth.service';

// Ellenőrzések:
this.authService.isAuthenticated$  // Observable<boolean>
this.authService.currentUser$      // Observable<User>
this.authService.hasRole('admin')  // boolean

// Műveletek:
this.authService.login(credentials)
this.authService.logout()
this.authService.refreshToken()
```

### ElectronService (Desktop Native API)

```typescript
import { ElectronService } from '@core/services/electron.service';

// Platform check
if (this.electronService.isElectron) { ... }
if (this.electronService.isMac) { ... }

// Native notification
await this.electronService.showNotification({
  title: 'PhotoStack',
  body: 'Sikeres feltöltés!',
  hasReply: true  // macOS reply
});

// Offline support
if (!this.electronService.isOnline) {
  await this.electronService.queueRequest({ method: 'POST', url, body });
}

// Dark mode
this.electronService.darkModeChanges.subscribe(isDark => ...);

// Dock badge (macOS)
await this.electronService.setBadgeCount(5);

// Auto-update
this.electronService.autoUpdate.checkForUpdates();
```

---

## 🏗️ Layout Komponensek

### Page Layout

```html
<!-- ❌ NE CSINÁLJ ILYET -->
<div class="my-custom-page">

<!-- ✅ HASZNÁLD EZT -->
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

// Menü konfiguráció:
this.menuConfig.setMenuItems([...]);
```

---

## 📋 Shared Utilities

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

// Használat:
this.form = this.fb.group({
  email: ['', [Validators.required, CustomValidators.email]],
  phone: ['', CustomValidators.hungarianPhone],
});
```

---

## 🎨 CSS Osztályok

### Dialog Panel Méretek

| Class | Max-width | Használat |
|-------|-----------|-----------|
| `dialog-panel` | 400px | Confirm, alert |
| `dialog-panel--md` | 480px | Form, QR modal |
| `dialog-panel--lg` | 600px | Részletes form |

### Animációk

```css
/* Fade in */
.fade-enter { animation: fadeIn 0.2s ease; }

/* Slide up */
.slide-up { animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

/* Staggered list */
.stagger-item { animation-delay: calc(var(--index) * 0.05s); }
```

---

## 🔄 Patterns (Minták)

### Cleanup Pattern (KÖTELEZŐ)

```typescript
// MINDEN komponensben ami subscription-t használ:
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.data$
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Loading State Pattern

```typescript
loading = false;
error: string | null = null;

async loadData() {
  this.loading = true;
  this.error = null;

  try {
    this.data = await this.service.getData();
  } catch (err) {
    this.error = 'Hiba az adatok betöltésekor';
    this.toast.error(this.error);
  } finally {
    this.loading = false;
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

## 🚫 Anti-Patterns (KERÜLENDŐ)

```typescript
// ❌ NE CSINÁLJ ILYET:

// 1. any típus
const data: any = response;

// 2. Subscription leak
this.service.data$.subscribe(d => this.data = d);  // nincs unsubscribe!

// 3. Console.log production-ben
console.log('Debug:', data);

// 4. Magyar változónév
const felhasznaloNeve = user.name;

// 5. Inline style
<div style="color: red; margin: 10px">

// 6. Emoji ikon helyett
<span>✅</span>

// 7. Saját modal implementáció
// 8. Saját toast implementáció
// 9. Saját loading spinner
// 10. Hardcoded API URL
```

---

## 📊 Mikor Hozz Létre Újat?

Csak akkor hozz létre új komponenst/service-t, ha:

1. ✅ Átnézted ezt a registryt és NINCS megfelelő
2. ✅ A meglévő NEM bővíthető az igényedhez
3. ✅ Legalább 3 helyen fogod használni (újrahasználható)
4. ✅ Megbeszélted a döntést (review)

Ha új komponenst hozol létre:
1. ADD HOZZÁ EZT A REGISTRYT!
2. Dokumentáld a használatot
3. Adj példakódot
