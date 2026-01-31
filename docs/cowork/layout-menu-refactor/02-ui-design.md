# Layout & Menürendszer - UI Design

> Vizuális design specifikáció, színek, méretezés, responsive viselkedés

---

## 1. Layout Struktúra

### 1.1 Desktop Layout (lg: 1024px+)

```
┌──────────────────────────────────────────────────────────────────┐
│                         TOP BAR (64px)                           │
├────────────────┬─────────────────────────────────────────────────┤
│                │                                                 │
│    SIDEBAR     │                                                 │
│    (240px)     │              MAIN CONTENT                       │
│                │              (flex-1)                           │
│                │                                                 │
│                │                                                 │
│    fixed       │              scrollable                         │
│                │                                                 │
│                │                                                 │
└────────────────┴─────────────────────────────────────────────────┘
```

### 1.2 Tablet Layout (md: 768px - 1023px)

```
┌──────────────────────────────────────────────────────────────────┐
│                         TOP BAR (64px)                           │
├──────┬───────────────────────────────────────────────────────────┤
│      │                                                           │
│ SIDE │                    MAIN CONTENT                           │
│ 60px │                    (flex-1)                               │
│      │                                                           │
│ icons│                                                           │
│ only │                                                           │
│      │                                                           │
└──────┴───────────────────────────────────────────────────────────┘
```

### 1.3 Mobile Layout (< 768px)

```
┌────────────────────────────┐
│      TOP BAR (56px)        │
├────────────────────────────┤
│                            │
│       MAIN CONTENT         │
│       (full width)         │
│                            │
│                            │
└────────────────────────────┘

(Sidebar: overlay when open)
```

---

## 2. Méretek (Sizing)

### 2.1 Fő méretek

```typescript
const layoutSizes = {
  topBar: {
    desktop: 64,    // px
    mobile: 56,     // px
  },
  sidebar: {
    expanded: 240,  // px - desktop
    collapsed: 60,  // px - tablet (icons only)
    mobile: '85vw', // mobile overlay
    maxMobile: 320, // px - max width on mobile
  },
  content: {
    maxWidth: 1280, // px (optional)
    padding: {
      desktop: 24,  // px
      tablet: 16,   // px
      mobile: 12,   // px
    }
  }
};
```

### 2.2 Spacing scale (Tailwind)

| Token | Érték | Használat |
|-------|-------|-----------|
| `space-1` | 4px | Icon padding |
| `space-2` | 8px | Small gaps |
| `space-3` | 12px | Menu item padding |
| `space-4` | 16px | Section gaps |
| `space-6` | 24px | Content padding |
| `space-8` | 32px | Large sections |

---

## 3. Színek

### 3.1 Layout színek

```typescript
const layoutColors = {
  topBar: {
    bg: 'bg-white',
    border: 'border-b border-gray-200',
    text: 'text-gray-800',
  },
  sidebar: {
    bg: 'bg-gray-50',           // Világos szürke háttér
    bgDark: 'bg-gray-900',      // Dark mode
    border: 'border-r border-gray-200',
  },
  content: {
    bg: 'bg-white',
    bgAlt: 'bg-gray-50',        // Alternatív sections
  },
  overlay: {
    backdrop: 'bg-black/50',    // 50% átlátszó fekete
  }
};
```

### 3.2 Menu item színek

```typescript
const menuColors = {
  default: {
    bg: 'bg-transparent',
    text: 'text-gray-700',
    icon: 'text-gray-500',
  },
  hover: {
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    icon: 'text-gray-600',
  },
  active: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    border: 'border-l-2 border-blue-600', // Left accent
  },
  disabled: {
    bg: 'bg-transparent',
    text: 'text-gray-400',
    icon: 'text-gray-300',
  }
};
```

### 3.3 Színpaletta (referencia)

```css
/* Primary Blue */
--blue-50:  #eff6ff;
--blue-100: #dbeafe;
--blue-500: #3b82f6;
--blue-600: #2563eb;
--blue-700: #1d4ed8;

/* Gray Scale */
--gray-50:  #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

---

## 4. Typography

### 4.1 Top Bar

```typescript
const topBarTypography = {
  logo: 'text-xl font-bold text-gray-900',
  partnerInfo: 'text-sm text-gray-600',
};
```

### 4.2 Sidebar Menu

```typescript
const sidebarTypography = {
  sectionLabel: 'text-sm font-medium text-gray-900',   // Parent items
  menuItem: 'text-sm text-gray-700',                    // Child items
  menuItemActive: 'text-sm font-medium text-blue-700',  // Active
  sectionDivider: 'text-xs uppercase text-gray-400 tracking-wider',
};
```

### 4.3 Gen Z szabály

```typescript
// ✅ HELYES - lowercase
const labels = {
  home: 'főoldal',
  settings: 'beállítások',
  gallery: 'galéria',
};

// ❌ HELYTELEN
const labels = {
  home: 'Főoldal',     // NE nagybetű!
  settings: 'BEÁLLÍTÁSOK', // NE CAPS!
};
```

---

## 5. Top Bar Design

### 5.1 Desktop Top Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│ 24px │ [🎓] Tablókirály │ Partner: Kiss Béla - 12/A │ [🔔] [👤] │ 24px │
└─────────────────────────────────────────────────────────────────────┘
         ↑                  ↑                          ↑
        Logo            Partner info              Actions
        (left)          (center)                  (right)
```

```html
<!-- Top Bar Structure -->
<header class="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
  <div class="h-full flex items-center justify-between px-6">
    <!-- Left: Logo -->
    <div class="flex items-center gap-3">
      <span class="text-2xl">🎓</span>
      <span class="text-xl font-bold text-gray-900 hidden sm:block">
        Tablókirály
      </span>
    </div>

    <!-- Center: Partner Info (KÖTELEZŐ!) -->
    <div class="text-sm text-gray-600 truncate max-w-[300px]">
      Partner: <span class="font-medium">Kiss Béla - 12/A</span>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2">
      <button class="p-2 hover:bg-gray-100 rounded-full relative">
        <span class="text-xl">🔔</span>
        <!-- Badge -->
        <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500
                     text-white text-xs rounded-full flex items-center justify-center">
          3
        </span>
      </button>
      <button class="p-2 hover:bg-gray-100 rounded-full">
        <span class="text-xl">👤</span>
      </button>
    </div>
  </div>
</header>
```

### 5.2 Mobile Top Bar

```
┌───────────────────────────────────┐
│ [☰] │ [🎓] │ Partner... │ [👤]   │
└───────────────────────────────────┘
```

```html
<!-- Mobile: Hamburger visible, partner truncated -->
<header class="h-14 md:h-16 ...">
  <div class="flex items-center">
    <!-- Hamburger (mobile only) -->
    <button class="p-2 md:hidden">
      <span class="text-xl">☰</span>
    </button>

    <!-- Logo -->
    <span class="text-2xl">🎓</span>

    <!-- Partner (truncated on mobile) -->
    <div class="text-sm text-gray-600 truncate flex-1 mx-2">
      <span class="hidden sm:inline">Partner: </span>
      <span class="font-medium">Kiss Béla...</span>
    </div>

    <!-- Actions -->
    <button class="p-2">👤</button>
  </div>
</header>
```

---

## 6. Sidebar Design

### 6.1 Expanded Sidebar (Desktop)

```
┌────────────────────────────────┐
│         TOP PADDING (64px)     │  ← Top bar magasság
├────────────────────────────────┤
│                                │
│  🏠 főoldal                    │
│                                │
│  📸 tabló                  [▼] │
│     galéria                    │
│     minták                     │  ← Active: blue bg
│     csapat                     │
│     szavazások                 │
│                                │
│  🛒 rendelés               [▶] │  ← Collapsed
│                                │
│  📅 naptár                     │
│                                │
│  📰 hírek                      │
│                                │
│  ─────────────────────────     │  ← Divider
│                                │
│  ⚙️ beállítások                │  ← Sticky bottom
│                                │
└────────────────────────────────┘
       240px width
```

### 6.2 Menu Item Variants

```html
<!-- Default State -->
<a class="flex items-center gap-3 px-4 py-3 text-gray-700
          hover:bg-gray-100 rounded-lg mx-2 transition-colors">
  <span class="text-lg">🏠</span>
  <span class="text-sm">főoldal</span>
</a>

<!-- Active State -->
<a class="flex items-center gap-3 px-4 py-3
          bg-blue-50 text-blue-700 font-medium
          border-l-2 border-blue-600
          rounded-r-lg mx-2">
  <span class="text-lg">📸</span>
  <span class="text-sm">galéria</span>
</a>

<!-- Section with Children -->
<div class="mx-2">
  <button class="flex items-center justify-between w-full px-4 py-3
                 text-gray-700 hover:bg-gray-100 rounded-lg">
    <div class="flex items-center gap-3">
      <span class="text-lg">📸</span>
      <span class="text-sm font-medium">tabló</span>
    </div>
    <span class="text-gray-400 transition-transform"
          [class.rotate-90]="isExpanded">▶</span>
  </button>

  <!-- Children (animated) -->
  <div class="ml-8 space-y-1 overflow-hidden"
       [@expandCollapse]="isExpanded ? 'expanded' : 'collapsed'">
    <a class="block px-4 py-2 text-sm text-gray-600
              hover:bg-gray-100 rounded-lg">galéria</a>
    <a class="block px-4 py-2 text-sm text-gray-600
              hover:bg-gray-100 rounded-lg">minták</a>
  </div>
</div>
```

### 6.3 Collapsed Sidebar (Tablet)

```
┌──────┐
│      │
│  🏠  │  ← Only icons, 60px width
│  📸  │
│  🛒  │
│  📅  │
│  📰  │
│  ──  │
│  ⚙️  │
│      │
└──────┘
```

```html
<!-- Collapsed item -->
<a class="flex items-center justify-center p-3
          hover:bg-gray-100 rounded-lg mx-1"
   [title]="'főoldal'">
  <span class="text-xl">🏠</span>
</a>
```

---

## 7. Mobile Overlay

### 7.1 Overlay struktura

```
┌───────────────────────────────────┐
│ TOP BAR (fixed)                   │
├─────────────────┬─────────────────┤
│                 │                 │
│    SIDEBAR      │    BACKDROP     │
│    (slide-in)   │    (fade-in)    │
│    85vw         │    clickable    │
│    max 320px    │    to close     │
│                 │                 │
│                 │                 │
└─────────────────┴─────────────────┘
```

### 7.2 Overlay CSS

```css
/* Backdrop */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
  opacity: 0;
  transition: opacity 150ms ease;
}

.sidebar-backdrop.open {
  opacity: 1;
}

/* Sidebar Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 85vw;
  max-width: 320px;
  background: white;
  z-index: 50;
  transform: translateX(-100%);
  transition: transform 200ms ease-out;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
}

.sidebar-overlay.open {
  transform: translateX(0);
}
```

### 7.3 Overlay Header

```html
<!-- Mobile overlay header -->
<div class="h-14 flex items-center justify-between px-4 border-b border-gray-200">
  <span class="text-lg font-medium">menü</span>
  <button (click)="close()" class="p-2 hover:bg-gray-100 rounded-full">
    <span class="text-xl">✕</span>
  </button>
</div>
```

---

## 8. Animációk

### 8.1 Sidebar Expand/Collapse

```css
/* Section children expand */
@keyframes expand-down {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 200px; /* Adjust based on content */
  }
}

.section-children {
  animation: expand-down 200ms ease forwards;
}

/* Arrow rotation */
.expand-arrow {
  transition: transform 200ms ease;
}

.expand-arrow.expanded {
  transform: rotate(90deg);
}
```

### 8.2 Hover Effects

```css
/* Menu item hover */
.menu-item {
  transition: background-color 100ms ease, color 100ms ease;
}

/* Active indicator slide */
.active-indicator {
  transition: transform 150ms ease, opacity 150ms ease;
}
```

### 8.3 Mobile Overlay

```typescript
// Angular animations
export const sidebarAnimation = trigger('slideInOut', [
  state('closed', style({
    transform: 'translateX(-100%)'
  })),
  state('open', style({
    transform: 'translateX(0)'
  })),
  transition('closed <=> open', [
    animate('200ms ease-out')
  ])
]);

export const backdropAnimation = trigger('fadeInOut', [
  state('closed', style({
    opacity: 0,
    visibility: 'hidden'
  })),
  state('open', style({
    opacity: 1,
    visibility: 'visible'
  })),
  transition('closed <=> open', [
    animate('150ms ease')
  ])
]);
```

---

## 9. Responsive Breakpoints

### 9.1 Tailwind breakpoints használata

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};
```

### 9.2 Layout változások

| Breakpoint | Sidebar | Top Bar | Partner Info |
|------------|---------|---------|--------------|
| < 768px | Hidden (overlay) | Hamburger visible | Truncated |
| 768px - 1023px | Collapsed (60px) | No hamburger | Shorter |
| 1024px+ | Expanded (240px) | Full | Full |

```html
<!-- Responsive sidebar -->
<aside class="
  fixed top-16 left-0 bottom-0

  /* Mobile: hidden, shown via overlay */
  hidden md:block

  /* Tablet: collapsed */
  md:w-[60px]

  /* Desktop: expanded */
  lg:w-[240px]

  bg-gray-50 border-r border-gray-200
  transition-all duration-200
">
```

---

## 10. Z-Index Layers

```typescript
const zIndexLayers = {
  content: 0,
  sidebar: 30,
  topBar: 40,
  backdrop: 45,
  mobileOverlay: 50,
  dropdown: 60,
  modal: 70,
  toast: 80,
};
```

---

## 11. Dark Mode (Optional - Later)

```typescript
const darkModeColors = {
  topBar: {
    bg: 'dark:bg-gray-900',
    border: 'dark:border-gray-700',
    text: 'dark:text-gray-100',
  },
  sidebar: {
    bg: 'dark:bg-gray-800',
    border: 'dark:border-gray-700',
  },
  menuItem: {
    default: 'dark:text-gray-300',
    hover: 'dark:bg-gray-700 dark:text-white',
    active: 'dark:bg-blue-900 dark:text-blue-300',
  }
};
```

---

## 12. Icons

### 12.1 Emoji icons (Gen Z style)

```typescript
const menuIcons = {
  home: '🏠',
  tablo: '📸',
  gallery: '🖼️',
  samples: '✨',
  team: '👥',
  votes: '🗳️',
  order: '🛒',
  cart: '🛍️',
  history: '📋',
  calendar: '📅',
  news: '📰',
  settings: '⚙️',
  profile: '👤',
  notifications: '🔔',
  logout: '👋',
};
```

### 12.2 UI icons (system)

```typescript
// Heroicons vagy más icon library
const systemIcons = {
  expand: 'chevron-right',   // ▶
  collapse: 'chevron-down',  // ▼
  close: 'x',                // ✕
  menu: 'bars-3',            // ☰
};
```

---

## 13. Component Quick Reference

### AppShell

```html
<div class="min-h-screen bg-gray-50">
  <app-top-bar />
  <app-sidebar />
  <main class="pt-16 md:ml-[60px] lg:ml-[240px] min-h-screen">
    <div class="p-4 md:p-6">
      <router-outlet />
    </div>
  </main>
  <app-mobile-nav-overlay />
</div>
```

### TopBar

```html
<header class="h-14 md:h-16 bg-white border-b border-gray-200
               fixed top-0 left-0 right-0 z-40
               flex items-center justify-between px-4 md:px-6">
  <!-- Left: Hamburger + Logo -->
  <!-- Center: Partner Info -->
  <!-- Right: Actions -->
</header>
```

### Sidebar

```html
<aside class="fixed top-14 md:top-16 left-0 bottom-0
              hidden md:flex flex-col
              w-[60px] lg:w-[240px]
              bg-gray-50 border-r border-gray-200
              transition-all duration-200">
  <nav class="flex-1 overflow-y-auto py-4">
    <!-- Menu items -->
  </nav>
  <div class="border-t border-gray-200 py-2">
    <!-- Settings (sticky bottom) -->
  </div>
</aside>
```
