# Layout & Menürendszer - Claude Implementációs Útmutató

> **FONTOS**: Ez a dokumentum a Claude Code AI asszisztensnek szól az implementáció során.

---

## Projekt Kontextus

- **Alkalmazás**: Tablókirály - tablófotó rendelési platform
- **Feature**: Layout & Menürendszer Refaktor
- **Cél**: 2-oszlopos layout bevezetése (sidebar + main content), partner infó megtartása

---

## Tech Stack

| Réteg | Technológia | Verzió |
|-------|-------------|--------|
| Frontend | Angular | 19.x |
| State | Signals | built-in |
| Styling | Tailwind CSS | 3.4.x |
| Routing | Angular Router | 19.x |

---

## KRITIKUS KÖVETELMÉNY

### Partner infó MINDIG látható marad!

```typescript
// ✅ HELYES - Partner infó a top bar-ban
<header>
  <div>Logo</div>
  <div>Partner: Kiss Béla - 12/A</div>  <!-- KÖTELEZŐ! -->
  <div>Actions</div>
</header>

// ❌ HELYTELEN - Ne rejtsd el a partner infót!
<header>
  <div>Logo</div>
  <!-- Partner infó hiányzik - TILOS! -->
  <div>Actions</div>
</header>
```

**Indoklás**: "idióták ezek és sose tudják ki kicsoda" - user requirement

---

## Implementációs Sorrend

### Fázis 1: Core Services (0.5 nap)

#### 1.1 Models

```bash
# Hozd létre:
mkdir -p src/app/core/layout/models
```

```typescript
// core/layout/models/menu-item.model.ts
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  children?: MenuItem[] | null;
  badge?: number;
  disabled?: boolean;
  position?: 'top' | 'bottom';
}
```

#### 1.2 SidebarStateService

```bash
ng g service core/layout/services/sidebar-state --skip-tests
```

**Implementáld:**
- `isOpen` signal - mobile overlay state
- `expandedSections` signal - array of expanded section IDs
- `isMobile` / `isTablet` computed breakpoint detection
- `mode` computed - 'expanded' | 'collapsed' | 'hidden' | 'overlay'
- localStorage persistence for expanded sections

**Lásd**: `03-components.md` - SidebarStateService

#### 1.3 MenuConfigService

```bash
ng g service core/layout/services/menu-config --skip-tests
```

**Implementáld:**
- `menuItems` signal - fő menü elemek
- `bottomMenuItems` signal - beállítások (sticky alul)
- `findParentByRoute()` method - route → parent mapping

---

### Fázis 2: Layout Components (1 nap)

#### 2.1 AppShellComponent

```bash
ng g component core/layout/components/app-shell --standalone
```

**Struktúra:**
```html
<div class="min-h-screen bg-gray-50">
  <app-top-bar />
  <app-sidebar />
  <main class="pt-14 md:pt-16 md:ml-[60px] lg:ml-[240px]">
    <router-outlet />
  </main>
  <app-mobile-nav-overlay />
</div>
```

#### 2.2 TopBarComponent

```bash
ng g component core/layout/components/top-bar --standalone
```

**FONTOS elemek:**
1. Hamburger gomb (csak mobile)
2. Logo
3. **Partner infó** (KÖTELEZŐ, középen)
4. Notification bell (placeholder)
5. User avatar (placeholder)

```html
<header class="h-14 md:h-16 fixed top-0 left-0 right-0 z-40 bg-white border-b">
  <!-- Left: Hamburger + Logo -->
  <!-- Center: Partner Info - KÖTELEZŐ! -->
  <!-- Right: Bell + Avatar -->
</header>
```

#### 2.3 SidebarComponent

```bash
ng g component core/layout/components/sidebar --standalone
```

**Viselkedés:**
- Desktop (lg+): 240px széles, mindig látható
- Tablet (md): 60px széles, csak ikonok
- Mobile: rejtett

#### 2.4 SidebarMenuItemComponent

```bash
ng g component core/layout/components/sidebar-menu-item --standalone
```

**Két mód:**
1. Simple item (route, no children)
2. Section with children (expandable)

**Inputs:**
- `item: MenuItem` (required)
- `collapsed: boolean` (tablet mode)

#### 2.5 MobileNavOverlayComponent

```bash
ng g component core/layout/components/mobile-nav-overlay --standalone
```

**Elemek:**
- Backdrop (click to close)
- Slide-in sidebar
- Teljes menü struktúra
- Navigáció után automatikus bezárás

---

### Fázis 3: Route Integration (0.5 nap)

#### 3.1 SidebarRouteService

```bash
ng g service core/layout/services/sidebar-route --skip-tests
```

**Funkció:**
- Figyeli a route változásokat
- Auto-expand a parent szekciót ha child route aktív

```typescript
// Pl: navigáció /tablo/samples → "tabló" szekció kinyílik
```

#### 3.2 AppComponent Update

```typescript
// app.component.ts
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell />`,
})
export class AppComponent {
  // Initialize route watching
  private sidebarRouteService = inject(SidebarRouteService);
}
```

---

## Kritikus Implementációs Szabályok

### 1. Signals Pattern

```typescript
// ✅ HELYES
private _isOpen = signal(false);
readonly isOpen = this._isOpen.asReadonly();

// ❌ HELYTELEN - NE használj BehaviorSubject-et!
private isOpen$ = new BehaviorSubject(false);
```

### 2. Standalone Components

```typescript
// ✅ HELYES
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SidebarMenuItemComponent],
  // ...
})

// ❌ HELYTELEN - NE NgModule-ban
@NgModule({
  declarations: [SidebarComponent],
})
```

### 3. OnPush Change Detection

```typescript
// ✅ HELYES - Minden komponens OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### 4. Gen Z UI Szabályok

```typescript
// ✅ HELYES - lowercase
label = 'beállítások';
menuTitle = 'menü';

// ❌ HELYTELEN
label = 'Beállítások';  // NE nagybetű!
menuTitle = 'MENÜ';     // NE CAPS!
```

### 5. Responsive Classes

```html
<!-- ✅ HELYES - Tailwind responsive prefixes -->
<aside class="hidden md:block md:w-[60px] lg:w-[240px]">

<!-- ❌ HELYTELEN - JS-based hiding -->
<aside *ngIf="!isMobile">
```

### 6. CSS Animációk (nem JS)

```css
/* ✅ HELYES - CSS transitions */
.sidebar-overlay {
  transition: transform 200ms ease-out;
}

/* ❌ HELYTELEN - Angular animations for simple transitions */
@Component({
  animations: [trigger('slideIn', [...])]  // Felesleges egyszerű slide-hoz
})
```

---

## Menü Struktúra (Kezdeti)

```typescript
const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'főoldal',
    icon: '🏠',
    route: '/dashboard',
  },
  {
    id: 'tablo',
    label: 'tabló',
    icon: '📸',
    children: [
      { id: 'gallery', label: 'galéria', route: '/tablo/gallery' },
      { id: 'samples', label: 'minták', route: '/tablo/samples' },
      { id: 'team', label: 'csapat', route: '/tablo/team' },
      { id: 'votes', label: 'szavazások', route: '/tablo/votes' },
    ],
  },
  {
    id: 'order',
    label: 'rendelés',
    icon: '🛒',
    children: [
      { id: 'cart', label: 'kosár', route: '/cart' },
      { id: 'orders', label: 'korábbi', route: '/orders' },
    ],
  },
  {
    id: 'calendar',
    label: 'naptár',
    icon: '📅',
    route: '/calendar',
  },
  {
    id: 'news',
    label: 'hírek',
    icon: '📰',
    route: '/news',
  },
];

const bottomMenuItems: MenuItem[] = [
  {
    id: 'settings',
    label: 'beállítások',
    icon: '⚙️',
    route: '/settings',
  },
];
```

---

## Tailwind Classes Referencia

### Layout

```typescript
const layoutClasses = {
  shell: 'min-h-screen bg-gray-50',
  topBar: 'h-14 md:h-16 bg-white border-b border-gray-200 fixed top-0 inset-x-0 z-40',
  sidebar: 'fixed top-14 md:top-16 left-0 bottom-0 bg-gray-50 border-r border-gray-200',
  sidebarExpanded: 'w-[240px]',
  sidebarCollapsed: 'w-[60px]',
  main: 'pt-14 md:pt-16 md:ml-[60px] lg:ml-[240px] transition-[margin] duration-200',
};
```

### Menu Items

```typescript
const menuClasses = {
  item: 'flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors',
  itemActive: 'bg-blue-50 text-blue-700 font-medium',
  itemCollapsed: 'justify-center',
  sectionArrow: 'text-gray-400 text-xs transition-transform duration-200',
  sectionArrowExpanded: 'rotate-90',
};
```

### Overlay

```typescript
const overlayClasses = {
  backdrop: 'fixed inset-0 bg-black/50 z-40',
  sidebar: 'fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-white z-50 shadow-xl',
  header: 'h-14 flex items-center justify-between px-4 border-b border-gray-200',
};
```

---

## Z-Index Rétegek

```typescript
const zIndex = {
  sidebar: 'z-30',
  topBar: 'z-40',
  backdrop: 'z-40',
  mobileOverlay: 'z-50',
  dropdown: 'z-60',  // future
  modal: 'z-70',     // future
  toast: 'z-80',     // future
};
```

---

## Breakpoints Emlékeztető

| Breakpoint | Pixel | Sidebar | TopBar |
|------------|-------|---------|--------|
| Default | < 768px | Hidden | Hamburger |
| md | 768px | Collapsed (60px) | No hamburger |
| lg | 1024px | Expanded (240px) | Full |

---

## localStorage Kulcsok

```typescript
const storageKeys = {
  expandedSections: 'sidebar_expanded_sections', // string[] JSON
};
```

---

## Tesztelési Checklist

### Visual Tests

- [ ] Desktop: sidebar 240px, full labels
- [ ] Tablet: sidebar 60px, only icons
- [ ] Mobile: no sidebar, hamburger visible
- [ ] Mobile: overlay opens on hamburger click
- [ ] Mobile: overlay closes on backdrop click
- [ ] Mobile: overlay closes on menu item click

### Interaction Tests

- [ ] Section expand/collapse works
- [ ] Expanded state persists on refresh
- [ ] Active route highlighted
- [ ] Parent section auto-expands on deep link
- [ ] Hover effects on menu items

### Partner Info Tests

- [ ] Partner info visible on desktop
- [ ] Partner info visible on tablet
- [ ] Partner info visible on mobile (truncated)
- [ ] Partner info never hidden!

---

## Fájlstruktúra (Végső)

```
src/app/
├── core/
│   └── layout/
│       ├── components/
│       │   ├── app-shell/
│       │   │   └── app-shell.component.ts
│       │   ├── top-bar/
│       │   │   └── top-bar.component.ts
│       │   ├── sidebar/
│       │   │   └── sidebar.component.ts
│       │   ├── sidebar-menu-item/
│       │   │   └── sidebar-menu-item.component.ts
│       │   └── mobile-nav-overlay/
│       │       └── mobile-nav-overlay.component.ts
│       ├── services/
│       │   ├── sidebar-state.service.ts
│       │   ├── sidebar-route.service.ts
│       │   └── menu-config.service.ts
│       └── models/
│           └── menu-item.model.ts
└── app.component.ts (updated to use AppShellComponent)
```

---

## Dokumentáció Referenciák

| Fájl | Tartalom |
|------|----------|
| `README.md` | Feature overview |
| `01-user-flow.md` | Navigation UX |
| `02-ui-design.md` | Visual specs, responsive |
| `03-components.md` | Angular components |

---

## Checklist

### Services
- [ ] MenuItem model
- [ ] SidebarStateService
- [ ] MenuConfigService
- [ ] SidebarRouteService

### Components
- [ ] AppShellComponent
- [ ] TopBarComponent (with Partner Info!)
- [ ] SidebarComponent
- [ ] SidebarMenuItemComponent
- [ ] MobileNavOverlayComponent

### Features
- [ ] Responsive breakpoints
- [ ] Section expand/collapse
- [ ] localStorage persistence
- [ ] Route → sidebar sync
- [ ] Mobile overlay

### Integration
- [ ] app.component.ts update
- [ ] Router outlet working
- [ ] All routes accessible

---

**FONTOS EMLÉKEZTETŐK:**

1. **Partner infó** - MINDIG látható, top bar-ban, középen
2. **Signals** - NE BehaviorSubject
3. **Standalone** - Minden komponens standalone
4. **OnPush** - Minden komponens OnPush
5. **Gen Z** - Lowercase labels
6. **CSS** - Tailwind responsive classes, CSS transitions
7. **localStorage** - Expanded sections persist
