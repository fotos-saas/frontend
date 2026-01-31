# Layout & Menürendszer - Angular Components

> Komponensek specifikációja Angular 19 + Signals alapon

---

## 1. Komponens Hierarchia

```
AppComponent
└── AppShellComponent
    ├── TopBarComponent
    │   ├── LogoComponent
    │   ├── PartnerInfoComponent
    │   └── TopBarActionsComponent
    │       ├── NotificationBellComponent (placeholder)
    │       └── UserAvatarComponent (placeholder)
    ├── SidebarComponent
    │   ├── SidebarMenuComponent
    │   │   └── SidebarMenuItemComponent (recursive)
    │   └── SidebarFooterComponent
    ├── MobileNavOverlayComponent
    │   └── (same menu structure)
    └── MainContentComponent
        └── <router-outlet>
```

---

## 2. Services

### 2.1 SidebarStateService

```typescript
// core/layout/services/sidebar-state.service.ts
import { Injectable, signal, computed } from '@angular/core';

export type SidebarMode = 'expanded' | 'collapsed' | 'hidden' | 'overlay';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  // Private writable signals
  private _isOpen = signal(false);
  private _expandedSections = signal<string[]>([]);
  private _isMobile = signal(false);
  private _isTablet = signal(false);

  // Public readonly signals
  readonly isOpen = this._isOpen.asReadonly();
  readonly expandedSections = this._expandedSections.asReadonly();
  readonly isMobile = this._isMobile.asReadonly();
  readonly isTablet = this._isTablet.asReadonly();

  // Computed
  readonly mode = computed<SidebarMode>(() => {
    if (this._isMobile()) {
      return this._isOpen() ? 'overlay' : 'hidden';
    }
    if (this._isTablet()) {
      return 'collapsed';
    }
    return 'expanded';
  });

  readonly sidebarWidth = computed(() => {
    const mode = this.mode();
    switch (mode) {
      case 'expanded': return 240;
      case 'collapsed': return 60;
      case 'overlay': return Math.min(window.innerWidth * 0.85, 320);
      default: return 0;
    }
  });

  constructor() {
    this.initResponsiveListeners();
    this.loadExpandedSections();
  }

  // Actions
  toggle(): void {
    this._isOpen.update(v => !v);
  }

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  toggleSection(sectionId: string): void {
    this._expandedSections.update(sections => {
      const isExpanded = sections.includes(sectionId);
      const newSections = isExpanded
        ? sections.filter(s => s !== sectionId)
        : [...sections, sectionId];

      // Persist to localStorage
      localStorage.setItem('sidebar_expanded_sections', JSON.stringify(newSections));

      return newSections;
    });
  }

  expandSection(sectionId: string): void {
    this._expandedSections.update(sections => {
      if (!sections.includes(sectionId)) {
        const newSections = [...sections, sectionId];
        localStorage.setItem('sidebar_expanded_sections', JSON.stringify(newSections));
        return newSections;
      }
      return sections;
    });
  }

  isSectionExpanded(sectionId: string): boolean {
    return this._expandedSections().includes(sectionId);
  }

  // Private methods
  private initResponsiveListeners(): void {
    const checkBreakpoints = () => {
      this._isMobile.set(window.innerWidth < 768);
      this._isTablet.set(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);
  }

  private loadExpandedSections(): void {
    try {
      const saved = localStorage.getItem('sidebar_expanded_sections');
      if (saved) {
        this._expandedSections.set(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
  }
}
```

---

### 2.2 MenuConfigService

```typescript
// core/layout/services/menu-config.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from '../models/menu-item.model';

@Injectable({
  providedIn: 'root'
})
export class MenuConfigService {
  private _menuItems = signal<MenuItem[]>([
    {
      id: 'home',
      label: 'főoldal',
      icon: '🏠',
      route: '/dashboard',
      children: null,
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
      children: null,
    },
    {
      id: 'news',
      label: 'hírek',
      icon: '📰',
      route: '/news',
      children: null,
    },
  ]);

  private _bottomMenuItems = signal<MenuItem[]>([
    {
      id: 'settings',
      label: 'beállítások',
      icon: '⚙️',
      route: '/settings',
      children: null,
    },
  ]);

  readonly menuItems = this._menuItems.asReadonly();
  readonly bottomMenuItems = this._bottomMenuItems.asReadonly();

  readonly flatMenuItems = computed(() => {
    const flatten = (items: MenuItem[]): MenuItem[] => {
      return items.flatMap(item =>
        item.children ? [item, ...flatten(item.children)] : [item]
      );
    };
    return flatten([...this._menuItems(), ...this._bottomMenuItems()]);
  });

  findParentByRoute(route: string): MenuItem | null {
    for (const item of this._menuItems()) {
      if (item.children) {
        const child = item.children.find(c => c.route === route);
        if (child) return item;
      }
    }
    return null;
  }
}
```

---

## 3. Models

### 3.1 MenuItem Interface

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

---

## 4. Components

### 4.1 AppShellComponent

```typescript
// core/layout/components/app-shell/app-shell.component.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MobileNavOverlayComponent } from '../mobile-nav-overlay/mobile-nav-overlay.component';
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    TopBarComponent,
    SidebarComponent,
    MobileNavOverlayComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Top Bar -->
      <app-top-bar />

      <!-- Sidebar (desktop/tablet) -->
      <app-sidebar />

      <!-- Main Content -->
      <main
        class="min-h-screen pt-14 md:pt-16 transition-[margin] duration-200"
        [class.md:ml-[60px]]="sidebarState.isTablet()"
        [class.lg:ml-[240px]]="!sidebarState.isMobile() && !sidebarState.isTablet()"
      >
        <div class="p-3 md:p-4 lg:p-6">
          <router-outlet />
        </div>
      </main>

      <!-- Mobile Overlay -->
      <app-mobile-nav-overlay />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly sidebarState = inject(SidebarStateService);
}
```

---

### 4.2 TopBarComponent

```typescript
// core/layout/components/top-bar/top-bar.component.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [],
  template: `
    <header
      class="h-14 md:h-16 bg-white border-b border-gray-200
             fixed top-0 left-0 right-0 z-40"
    >
      <div class="h-full flex items-center justify-between px-4 md:px-6">
        <!-- Left: Hamburger + Logo -->
        <div class="flex items-center gap-2 md:gap-4">
          <!-- Hamburger (mobile only) -->
          <button
            class="p-2 hover:bg-gray-100 rounded-lg md:hidden"
            (click)="sidebarState.toggle()"
            aria-label="Menü megnyitása"
          >
            <span class="text-xl">☰</span>
          </button>

          <!-- Logo -->
          <a href="/" class="flex items-center gap-2">
            <span class="text-2xl">🎓</span>
            <span class="text-lg md:text-xl font-bold text-gray-900 hidden sm:block">
              Tablókirály
            </span>
          </a>
        </div>

        <!-- Center: Partner Info (KÖTELEZŐ!) -->
        <div
          class="text-xs md:text-sm text-gray-600 truncate
                 max-w-[120px] sm:max-w-[200px] md:max-w-[300px]"
        >
          <span class="hidden sm:inline">Partner: </span>
          <span class="font-medium">{{ partnerName }}</span>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-1 md:gap-2">
          <!-- Notification Bell (placeholder) -->
          <button
            class="p-2 hover:bg-gray-100 rounded-full relative"
            aria-label="Értesítések"
          >
            <span class="text-lg md:text-xl">🔔</span>
            @if (unreadNotifications > 0) {
              <span
                class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
                       bg-red-500 text-white text-xs font-medium
                       rounded-full flex items-center justify-center px-1"
              >
                {{ unreadNotifications > 99 ? '99+' : unreadNotifications }}
              </span>
            }
          </button>

          <!-- User Avatar (placeholder) -->
          <button
            class="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Profil"
          >
            <span class="text-lg md:text-xl">👤</span>
          </button>
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  protected readonly sidebarState = inject(SidebarStateService);

  // TODO: Inject from actual services
  partnerName = 'Kiss Béla - 12/A';
  unreadNotifications = 3;
}
```

---

### 4.3 SidebarComponent

```typescript
// core/layout/components/sidebar/sidebar.component.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { MenuConfigService } from '../../services/menu-config.service';
import { SidebarMenuItemComponent } from '../sidebar-menu-item/sidebar-menu-item.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarMenuItemComponent],
  template: `
    <aside
      class="fixed top-14 md:top-16 left-0 bottom-0
             hidden md:flex flex-col
             bg-gray-50 border-r border-gray-200
             transition-all duration-200 z-30"
      [class.w-[60px]]="sidebarState.isTablet()"
      [class.w-[240px]]="!sidebarState.isTablet()"
    >
      <!-- Menu Items (scrollable) -->
      <nav class="flex-1 overflow-y-auto py-4">
        @for (item of menuConfig.menuItems(); track item.id) {
          <app-sidebar-menu-item
            [item]="item"
            [collapsed]="sidebarState.isTablet()"
          />
        }
      </nav>

      <!-- Bottom Items (sticky) -->
      <div class="border-t border-gray-200 py-2">
        @for (item of menuConfig.bottomMenuItems(); track item.id) {
          <app-sidebar-menu-item
            [item]="item"
            [collapsed]="sidebarState.isTablet()"
          />
        }
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly sidebarState = inject(SidebarStateService);
  protected readonly menuConfig = inject(MenuConfigService);
}
```

---

### 4.4 SidebarMenuItemComponent

```typescript
// core/layout/components/sidebar-menu-item/sidebar-menu-item.component.ts
import {
  Component,
  input,
  inject,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../../models/menu-item.model';
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'app-sidebar-menu-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (item().children && item().children!.length > 0) {
      <!-- Section with children -->
      <div class="mx-2 mb-1">
        <!-- Parent button -->
        <button
          class="flex items-center w-full px-3 py-2.5
                 text-gray-700 hover:bg-gray-100 rounded-lg
                 transition-colors"
          [class.justify-center]="collapsed()"
          [class.justify-between]="!collapsed()"
          (click)="toggleSection()"
          [attr.title]="collapsed() ? item().label : null"
        >
          <div class="flex items-center gap-3">
            @if (item().icon) {
              <span class="text-lg">{{ item().icon }}</span>
            }
            @if (!collapsed()) {
              <span class="text-sm font-medium">{{ item().label }}</span>
            }
          </div>
          @if (!collapsed()) {
            <span
              class="text-gray-400 text-xs transition-transform duration-200"
              [class.rotate-90]="isExpanded()"
            >
              ▶
            </span>
          }
        </button>

        <!-- Children (animated) -->
        @if (!collapsed() && isExpanded()) {
          <div class="ml-6 mt-1 space-y-0.5 animate-expand-down">
            @for (child of item().children; track child.id) {
              <a
                [routerLink]="child.route"
                routerLinkActive="bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600"
                class="block px-3 py-2 text-sm text-gray-600
                       hover:bg-gray-100 rounded-lg transition-colors"
                [class.opacity-50]="child.disabled"
                [class.pointer-events-none]="child.disabled"
              >
                {{ child.label }}
              </a>
            }
          </div>
        }
      </div>
    } @else {
      <!-- Simple item (no children) -->
      <div class="mx-2 mb-1">
        <a
          [routerLink]="item().route"
          routerLinkActive="bg-blue-50 text-blue-700 font-medium"
          class="flex items-center gap-3 px-3 py-2.5
                 text-gray-700 hover:bg-gray-100 rounded-lg
                 transition-colors"
          [class.justify-center]="collapsed()"
          [attr.title]="collapsed() ? item().label : null"
        >
          @if (item().icon) {
            <span class="text-lg">{{ item().icon }}</span>
          }
          @if (!collapsed()) {
            <span class="text-sm">{{ item().label }}</span>
          }
          @if (item().badge && !collapsed()) {
            <span
              class="ml-auto px-2 py-0.5 text-xs font-medium
                     bg-red-100 text-red-600 rounded-full"
            >
              {{ item().badge }}
            </span>
          }
        </a>
      </div>
    }
  `,
  styles: [`
    @keyframes expand-down {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-expand-down {
      animation: expand-down 200ms ease forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarMenuItemComponent {
  readonly item = input.required<MenuItem>();
  readonly collapsed = input<boolean>(false);

  private readonly sidebarState = inject(SidebarStateService);
  private readonly router = inject(Router);

  readonly isExpanded = computed(() =>
    this.sidebarState.isSectionExpanded(this.item().id)
  );

  toggleSection(): void {
    this.sidebarState.toggleSection(this.item().id);
  }
}
```

---

### 4.5 MobileNavOverlayComponent

```typescript
// core/layout/components/mobile-nav-overlay/mobile-nav-overlay.component.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { MenuConfigService } from '../../services/menu-config.service';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-mobile-nav-overlay',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (sidebarState.isMobile()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-150"
        [class.opacity-0]="!sidebarState.isOpen()"
        [class.opacity-100]="sidebarState.isOpen()"
        [class.pointer-events-none]="!sidebarState.isOpen()"
        (click)="sidebarState.close()"
      ></div>

      <!-- Sidebar Overlay -->
      <aside
        class="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px]
               bg-white z-50 shadow-xl
               transition-transform duration-200 ease-out"
        [class.-translate-x-full]="!sidebarState.isOpen()"
        [class.translate-x-0]="sidebarState.isOpen()"
      >
        <!-- Header -->
        <div class="h-14 flex items-center justify-between px-4 border-b border-gray-200">
          <span class="text-lg font-medium text-gray-900">menü</span>
          <button
            class="p-2 hover:bg-gray-100 rounded-full"
            (click)="sidebarState.close()"
            aria-label="Menü bezárása"
          >
            <span class="text-xl">✕</span>
          </button>
        </div>

        <!-- Menu Items -->
        <nav class="flex-1 overflow-y-auto py-4">
          @for (item of menuConfig.menuItems(); track item.id) {
            <div class="px-2 mb-1">
              @if (item.children && item.children.length > 0) {
                <!-- Section with children -->
                <button
                  class="flex items-center justify-between w-full px-4 py-3
                         text-gray-700 hover:bg-gray-100 rounded-lg"
                  (click)="toggleSection(item.id)"
                >
                  <div class="flex items-center gap-3">
                    @if (item.icon) {
                      <span class="text-lg">{{ item.icon }}</span>
                    }
                    <span class="text-sm font-medium">{{ item.label }}</span>
                  </div>
                  <span
                    class="text-gray-400 text-xs transition-transform duration-200"
                    [class.rotate-90]="isExpanded(item.id)"
                  >
                    ▶
                  </span>
                </button>

                @if (isExpanded(item.id)) {
                  <div class="ml-8 mt-1 space-y-0.5">
                    @for (child of item.children; track child.id) {
                      <a
                        [routerLink]="child.route"
                        routerLinkActive="bg-blue-50 text-blue-700 font-medium"
                        class="block px-4 py-2.5 text-sm text-gray-600
                               hover:bg-gray-100 rounded-lg"
                        (click)="onNavigate()"
                      >
                        {{ child.label }}
                      </a>
                    }
                  </div>
                }
              } @else {
                <!-- Simple item -->
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-blue-50 text-blue-700 font-medium"
                  class="flex items-center gap-3 px-4 py-3
                         text-gray-700 hover:bg-gray-100 rounded-lg"
                  (click)="onNavigate()"
                >
                  @if (item.icon) {
                    <span class="text-lg">{{ item.icon }}</span>
                  }
                  <span class="text-sm">{{ item.label }}</span>
                </a>
              }
            </div>
          }

          <!-- Divider -->
          <div class="my-4 mx-4 border-t border-gray-200"></div>

          <!-- Bottom Items -->
          @for (item of menuConfig.bottomMenuItems(); track item.id) {
            <div class="px-2 mb-1">
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-blue-50 text-blue-700 font-medium"
                class="flex items-center gap-3 px-4 py-3
                       text-gray-700 hover:bg-gray-100 rounded-lg"
                (click)="onNavigate()"
              >
                @if (item.icon) {
                  <span class="text-lg">{{ item.icon }}</span>
                }
                <span class="text-sm">{{ item.label }}</span>
              </a>
            </div>
          }
        </nav>
      </aside>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNavOverlayComponent {
  protected readonly sidebarState = inject(SidebarStateService);
  protected readonly menuConfig = inject(MenuConfigService);

  toggleSection(id: string): void {
    this.sidebarState.toggleSection(id);
  }

  isExpanded(id: string): boolean {
    return this.sidebarState.isSectionExpanded(id);
  }

  onNavigate(): void {
    // Close overlay after navigation
    this.sidebarState.close();
  }
}
```

---

## 5. Route Integration

### 5.1 Auto-expand on Route Change

```typescript
// core/layout/services/sidebar-route.service.ts
import { Injectable, inject, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarStateService } from './sidebar-state.service';
import { MenuConfigService } from './menu-config.service';

@Injectable({
  providedIn: 'root'
})
export class SidebarRouteService {
  private router = inject(Router);
  private sidebarState = inject(SidebarStateService);
  private menuConfig = inject(MenuConfigService);

  constructor() {
    this.watchRouteChanges();
  }

  private watchRouteChanges(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const currentRoute = event.urlAfterRedirects;
      const parent = this.menuConfig.findParentByRoute(currentRoute);

      if (parent) {
        // Auto-expand parent section when navigating to child route
        this.sidebarState.expandSection(parent.id);
      }
    });
  }
}
```

### 5.2 Bootstrap in AppComponent

```typescript
// app.component.ts
import { Component, inject } from '@angular/core';
import { AppShellComponent } from './core/layout/components/app-shell/app-shell.component';
import { SidebarRouteService } from './core/layout/services/sidebar-route.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell />`,
})
export class AppComponent {
  // Inject to initialize route watching
  private sidebarRouteService = inject(SidebarRouteService);
}
```

---

## 6. File Structure Summary

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
└── app.component.ts
```

---

## 7. Usage

### 7.1 Wrap your app

```typescript
// app.component.ts
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell />`,
})
export class AppComponent {}
```

### 7.2 Add routes

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'tablo/gallery', component: GalleryComponent },
  { path: 'tablo/samples', component: SamplesComponent },
  // ... etc
];
```

---

## 8. Customization

### 8.1 Add new menu item

```typescript
// In menu-config.service.ts, add to _menuItems:
{
  id: 'pokes',
  label: 'bökések',
  icon: '👉',
  route: '/pokes',
  badge: 5, // Optional badge
  children: null,
}
```

### 8.2 Change colors

Update the Tailwind classes in components:
- Active: `bg-blue-50 text-blue-700 border-blue-600`
- Hover: `hover:bg-gray-100`
- Default: `text-gray-700`

### 8.3 Add disabled state

```typescript
{
  id: 'premium',
  label: 'prémium',
  icon: '💎',
  route: '/premium',
  disabled: true, // Will show grayed out
}
```
