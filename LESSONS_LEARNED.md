# 📚 PhotoStack - Tanulságok Adatbázisa

> **Cél:** Gyakori hibák és megoldásaik gyűjtése, hogy Claude ne ismételje meg őket.

---

## 🔴 Memory Leak Minták

### RxJS Subscription Leak
```typescript
// ❌ ROSSZ - subscription leak
this.service.data$.subscribe(data => this.data = data);

// ✅ JÓ - cleanup pattern
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

### Event Listener Leak
```typescript
// ❌ ROSSZ - soha nem távolítjuk el
window.addEventListener('resize', this.onResize);

// ✅ JÓ - cleanup
private resizeListener = this.onResize.bind(this);

ngOnInit() {
  window.addEventListener('resize', this.resizeListener);
}

ngOnDestroy() {
  window.removeEventListener('resize', this.resizeListener);
}
```

### setInterval/setTimeout Leak
```typescript
// ❌ ROSSZ - nem töröljük
setInterval(() => this.refresh(), 5000);

// ✅ JÓ - töröljük
private intervalId?: number;

ngOnInit() {
  this.intervalId = window.setInterval(() => this.refresh(), 5000);
}

ngOnDestroy() {
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
}
```

---

## 🟠 Electron IPC Hibák

### Input Validation Hiányzik
```typescript
// ❌ ROSSZ - nincs validáció
ipcMain.handle('save-file', async (_event, path, content) => {
  fs.writeFileSync(path, content);
});

// ✅ JÓ - teljes validáció
ipcMain.handle('save-file', async (_event, params) => {
  // Típus validáció
  if (typeof params?.path !== 'string' || typeof params?.content !== 'string') {
    return { success: false, error: 'Invalid params' };
  }

  // Méret limit
  if (params.content.length > 10 * 1024 * 1024) {
    return { success: false, error: 'Content too large' };
  }

  // Path traversal védelem
  const safePath = path.resolve(ALLOWED_DIR, path.basename(params.path));

  try {
    fs.writeFileSync(safePath, params.content);
    return { success: true };
  } catch (error) {
    log.error('Save failed:', error);
    return { success: false, error: 'Save failed' };
  }
});
```

### Error Message Information Leak
```typescript
// ❌ ROSSZ - stack trace leak
catch (error) {
  return { success: false, error: error.message };
}

// ✅ JÓ - generic üzenet user-nek, részletes log
catch (error) {
  log.error('Operation failed:', error);
  captureMainException(error);
  return { success: false, error: 'Művelet sikertelen' };
}
```

---

## 🟡 Angular Gyakori Hibák

### Change Detection Probléma
```typescript
// ❌ ROSSZ - OnDefault + gyakori update = lassú
@Component({...})
export class ListComponent {
  items: Item[] = [];
}

// ✅ JÓ - OnPush + trackBy
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  items: Item[] = [];
  trackById = (index: number, item: Item) => item.id;
}
```

```html
<!-- trackBy KÖTELEZŐ ngFor-nál -->
<div *ngFor="let item of items; trackBy: trackById">
```

### FormData String Konverzió
```typescript
// ❌ ROSSZ - FormData stringet küld, Laravel array-t vár
const formData = new FormData();
ids.forEach(id => formData.append('ids[]', id));
// Laravel: $ids = ['1', '2', '3'] - STRINGEK!

// ✅ JÓ - Laravel oldalon intval
// Laravel Controller:
$ids = array_map('intval', $request->input('ids', []));
```

### Service Injection Standalone-ban
```typescript
// ❌ ROSSZ - elfelejtett providedIn
@Injectable()  // HIBA: nincs providedIn!
export class MyService {}

// ✅ JÓ
@Injectable({ providedIn: 'root' })
export class MyService {}
```

---

## 🟢 UI/UX Tanulságok

### Dialog Backdrop Záródás
```typescript
// ❌ ROSSZ - szöveg kijelölés közben bezáródik
@HostListener('click', ['$event'])
onBackdropClick(event: MouseEvent) {
  if (event.target === this.backdrop) {
    this.close.emit();
  }
}

// ✅ JÓ - createBackdropHandler használata
import { createBackdropHandler } from '@shared/utils/dialog.util';

backdropHandler = createBackdropHandler(() => this.close.emit());
```

### Tooltip Rendszer
```html
<!-- ❌ ROSSZ - elavult, nem működik -->
<button data-tooltip="Mentés">Save</button>

<!-- ✅ JÓ - Angular Material -->
<button matTooltip="Mentés">Save</button>
```

### Ikon Használat
```html
<!-- ❌ ROSSZ - emoji -->
<span>📱</span>

<!-- ✅ JÓ - Lucide ikon -->
<lucide-icon [name]="ICONS.SMARTPHONE" [size]="18" />
```

### Page Card Layout
```html
<!-- ❌ ROSSZ - hiányzó page-card -->
<div class="my-component">

<!-- ✅ JÓ -->
<div class="my-component page-card">
```

---

## 🔵 Performance Tanulságok

### Bundle Size
```typescript
// ❌ ROSSZ - teljes library import
import * as _ from 'lodash';
_.map(items, ...);

// ✅ JÓ - csak ami kell
import { map } from 'lodash-es';
map(items, ...);
```

### Lazy Loading
```typescript
// ❌ ROSSZ - minden egyszerre betölt
const routes: Routes = [
  { path: 'admin', component: AdminComponent }
];

// ✅ JÓ - lazy loading
const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component')
      .then(m => m.AdminComponent)
  }
];
```

### Virtual Scrolling
```html
<!-- ❌ ROSSZ - 1000 elem egyszerre renderelve -->
<div *ngFor="let item of items">

<!-- ✅ JÓ - virtual scroll -->
<cdk-virtual-scroll-viewport itemSize="50">
  <div *cdkVirtualFor="let item of items">
</cdk-virtual-scroll-viewport>
```

---

## 📝 Hozzáadás Szabályok

Amikor új tanulságot adsz hozzá:

1. **Kategória:** Válaszd ki a megfelelő szekciót
2. **Formátum:**
   - ❌ ROSSZ kód példa
   - ✅ JÓ kód példa
   - Rövid magyarázat
3. **Severity:**
   - 🔴 Kritikus (crash, security, memory leak)
   - 🟠 Magas (bug, data loss lehetőség)
   - 🟡 Közepes (performance, maintainability)
   - 🟢 Alacsony (style, best practice)
   - 🔵 Info (optimalizálás, tipp)

---

## 📅 Changelog

| Dátum | Hozzáadva | Kategória |
|-------|-----------|-----------|
| 2025-01 | Initial patterns | All |

