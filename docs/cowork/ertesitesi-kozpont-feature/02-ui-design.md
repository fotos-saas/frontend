# Értesítési Központ - UI Design

> Verzió: 1.0
> Dátum: 2025-01-19

---

## Tartalomjegyzék

1. [Design Alapelvek](#1-design-alapelvek)
2. [Bell Icon & Badge](#2-bell-icon--badge)
3. [Notification Dropdown](#3-notification-dropdown)
4. [Toast/Snackbar System](#4-toastsnackbar-system)
5. [Notification Modes](#5-notification-modes)
6. [Full Notifications Page](#6-full-notifications-page)
7. [Animációk](#7-animációk)
8. [Mobile Specifikus](#8-mobile-specifikus)
9. [Dark Mode](#9-dark-mode)

---

## 1. Design Alapelvek

### Gen Z Stílus

| Elem | Szabály | Példa |
|------|---------|-------|
| Typography | Lowercase | "értesítések", nem "Értesítések" |
| Tone | Casual | "még nincs értesítésed", nem "Nincsenek értesítései" |
| Icons | Emoji-first | 👉🗳️📸 az ikonok helyett |
| Feedback | Instant | Azonnali vizuális reakció minden kattintásra |

### Színpaletta

```
Primary Blue:     #3B82F6 (blue-500)
Success Green:    #22C55E (green-500)
Error Red:        #EF4444 (red-500)
Warning Orange:   #F59E0B (amber-500)

Background:       #F9FAFB (gray-50)
Card:             #FFFFFF
Text Primary:     #111827 (gray-900)
Text Secondary:   #6B7280 (gray-500)
Text Muted:       #9CA3AF (gray-400)

Badge Red:        #EF4444
Badge Text:       #FFFFFF

Unread BG:        #EFF6FF (blue-50)
```

### Spacing

```
Base unit:        4px
XS:               4px
SM:               8px
MD:               12px
LG:               16px
XL:               24px
2XL:              32px
```

### Border Radius

```
Small:            8px   (buttons, badges)
Medium:           12px  (cards, inputs)
Large:            16px  (modals, dropdowns)
Full:             9999px (pills, avatars)
```

---

## 2. Bell Icon & Badge

### Alapállapot (0 olvasatlan)

```
    ┌─────┐
    │  🔔 │    32x32px touch target
    └─────┘    (min 44x44px mobile-on)

CSS:
- color: gray-500
- hover: gray-700
- cursor: pointer
```

### Olvasatlan badge

```
    ┌─────┐
    │  🔔 │③   ← piros badge, jobb felső sarok
    └─────┘

Badge specs:
- min-width: 18px
- height: 18px
- padding: 0 5px
- font-size: 11px
- font-weight: 600
- background: #EF4444
- color: white
- border-radius: 9999px
- position: absolute
- top: -4px
- right: -4px
- border: 2px solid white (outline)
```

### Badge variációk

```
1-9:    ③          (szám)
10+:    9+         (max display)
99+:    99+        (extreme case)
```

### States

```
Default:    🔔     gray-500
Hover:      🔔     gray-700, scale(1.05)
Active:     🔔     gray-800, scale(0.95)
With badge: 🔔③    + badge
Animating:  🔔③    ring animation (új értesítés)
```

---

## 3. Notification Dropdown

### Desktop Layout

```
┌───────────────────────────────────────────────────┐
│ értesítések                            [mind ✓]   │  ← Header: 48px height
├───────────────────────────────────────────────────┤
│                                                   │
│ ── ma ──────────────────────────────────────────  │  ← Date divider
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ 👉  kiss béla bökött                      2p  │ │  ← Unread: blue-50 bg
│ │     "szavazz már pls"                         │ │
│ │     [💀] [😭] [🫡] [❤️] [👀]                  │ │  ← Quick reactions
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ 🗳️  új szavazás indult                   15p  │ │
│ │     sablon választás                          │ │
│ │                            [megnézem →]       │ │  ← CTA button
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ ── tegnap ──────────────────────────────────────  │
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ 📸  pótfotózás holnap                     1n  │ │  ← Read: white bg
│ │     ne felejtsd el                            │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
├───────────────────────────────────────────────────┤
│ összes értesítés →                                │  ← Footer link
└───────────────────────────────────────────────────┘

Specs:
- width: 380px
- max-height: 480px
- overflow-y: auto
- border-radius: 16px
- box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
- position: absolute
- top: calc(100% + 8px)
- right: 0
```

### Notification Item Anatomy

```
┌─────────────────────────────────────────────────────┐
│ [Icon]  [Title]                         [Time]      │
│         [Subtitle/Message]                          │
│         [Actions]                                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  👉     kiss béla bökött                     2p     │  40px line
│         "szavazz már pls"                           │  20px line
│         [💀] [😭] [🫡] [❤️] [👀]                    │  32px line
└─────────────────────────────────────────────────────┘

Padding: 12px 16px
Gap between items: 4px
Icon size: 24px (emoji)
```

### Item States

```css
/* Olvasatlan */
.notification-item--unread {
  background: #EFF6FF;        /* blue-50 */
  border-left: 3px solid #3B82F6;
}

/* Olvasott */
.notification-item--read {
  background: white;
}

/* Hover */
.notification-item:hover {
  background: #F3F4F6;        /* gray-100 */
}

/* Active/Press */
.notification-item:active {
  background: #E5E7EB;        /* gray-200 */
}
```

### Quick Action Buttons (Emoji reactions)

```
[💀] [😭] [🫡] [❤️] [👀]

Button specs:
- width: 36px
- height: 32px
- font-size: 18px
- border-radius: 8px
- background: gray-100
- hover: gray-200
- active: scale(0.9), background: blue-100
- gap: 4px
```

### CTA Button

```
[megnézem →]

Specs:
- padding: 6px 12px
- font-size: 13px
- font-weight: 500
- color: blue-600
- background: transparent
- border: 1px solid blue-200
- border-radius: 8px
- hover: background blue-50
```

### Date Divider

```
── ma ──

Specs:
- font-size: 11px
- font-weight: 500
- color: gray-400
- text-transform: lowercase
- padding: 8px 16px
- display: flex
- align-items: center

With lines:
- ::before, ::after
- flex: 1
- height: 1px
- background: gray-200
- margin: 0 8px
```

### Header

```
┌───────────────────────────────────────────────────┐
│ értesítések                            [mind ✓]   │
└───────────────────────────────────────────────────┘

Title:
- font-size: 16px
- font-weight: 600
- color: gray-900

"Mind ✓" button:
- font-size: 13px
- color: blue-600
- hover: underline
- cursor: pointer
```

### Footer

```
┌───────────────────────────────────────────────────┐
│ összes értesítés →                                │
└───────────────────────────────────────────────────┘

Specs:
- padding: 12px 16px
- font-size: 14px
- font-weight: 500
- color: blue-600
- text-align: center
- border-top: 1px solid gray-100
- hover: background gray-50
```

---

## 4. Toast/Snackbar System

### Toast Anatomy

```
┌──────────────────────────────────────────────────┐
│ [Icon]  [Message]                      [Action?] │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░  (timer)   │
└──────────────────────────────────────────────────┘
```

### Success Toast

```
┌──────────────────────────────────────────┐
│ ✓ szavazat elküldve                      │
└──────────────────────────────────────────┘

Specs:
- background: #DCFCE7 (green-100)
- border-left: 4px solid #22C55E (green-500)
- icon color: #22C55E
- text color: #166534 (green-800)
```

### Snackbar (with action)

```
┌──────────────────────────────────────────┐
│ ✓ bökés elküldve                [vissza] │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░           │
└──────────────────────────────────────────┘

Specs:
- background: #1F2937 (gray-800)
- text color: white
- action button: blue-400
- progress bar: blue-500 → gray-600
- border-radius: 12px
```

### Error Toast

```
┌──────────────────────────────────────────┐
│ ✗ hiba történt               [újra]      │
└──────────────────────────────────────────┘

Specs:
- background: #FEE2E2 (red-100)
- border-left: 4px solid #EF4444 (red-500)
- icon color: #EF4444
- text color: #991B1B (red-800)
- action: red-600
```

### Warning Toast

```
┌──────────────────────────────────────────┐
│ ⚠️ szavazás hamarosan zárul              │
└──────────────────────────────────────────┘

Specs:
- background: #FEF3C7 (amber-100)
- border-left: 4px solid #F59E0B (amber-500)
- icon color: #F59E0B
- text color: #92400E (amber-800)
```

### Info Toast

```
┌──────────────────────────────────────────┐
│ ℹ️ új értesítés érkezett                 │
└──────────────────────────────────────────┘

Specs:
- background: #DBEAFE (blue-100)
- border-left: 4px solid #3B82F6 (blue-500)
- icon color: #3B82F6
- text color: #1E40AF (blue-800)
```

### Banner (Sticky Warning)

```
┌──────────────────────────────────────────────────────────┐
│ ⚠️ szavazás 1 órán belül zárul!              [megnézem] │
└──────────────────────────────────────────────────────────┘

Specs:
- position: sticky / fixed
- top: 0 (or below navbar)
- width: 100%
- background: #FEF3C7 (amber-100)
- border-bottom: 1px solid #FCD34D (amber-300)
- padding: 12px 16px
- display: flex
- justify-content: center
- align-items: center
- gap: 12px
- z-index: 40
```

### Toast Positioning

```
Desktop:
- position: fixed
- bottom: 24px
- left: 50%
- transform: translateX(-50%)
- OR bottom-right: bottom: 24px, right: 24px

Mobile:
- position: fixed
- bottom: 80px (above nav)
- left: 16px
- right: 16px
- width: auto
```

### Toast Stack (Multiple)

```
             ┌──────────────────────┐
             │ ✓ harmadik akció     │
             └──────────────────────┘
          ┌──────────────────────────┐
          │ ✓ második akció          │
          └──────────────────────────┘
       ┌───────────────────────────────┐
       │ ✓ első akció                  │
       └───────────────────────────────┘

Max 3 visible, gap: 8px between
Newest on top
```

---

## 5. Notification Modes

### Mode Selector Card

```
┌─────────────────────────────────────────────────────┐
│ 🔔 értesítési mód                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│   │ 😴        │  │ ⚡        │  │ 🔥        │      │
│   │ chill     │  │ aktív     │  │ mindent   │      │
│   └───────────┘  └─────●─────┘  └───────────┘      │
│                        ↑                            │
│                   kiválasztva                       │
│                                                     │
│ ────────────────────────────────────────────────── │
│                                                     │
│ ⚡ aktív mód:                                       │
│ • szavazások, határidők                             │
│ • bökések, említések                                │
│ • fontos hirdetmények                               │
│ • max 3 push/nap                                    │
│                                                     │
│ [részletes beállítások →]                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Mode Button

```
Inactive:
┌───────────┐
│ 😴        │     64x72px
│ chill     │     border: 2px solid gray-200
└───────────┘     background: white
                  border-radius: 12px

Active:
┌───────────┐
│ ⚡        │     border: 2px solid blue-500
│ aktív     │     background: blue-50
└─────●─────┘     + bottom dot indicator
```

### Toggle Switch

```
OFF:  [○════════]   gray-300 bg
ON:   [════════●]   blue-500 bg

Specs:
- width: 48px
- height: 24px
- border-radius: 12px
- transition: 0.2s
- thumb: 20px circle, white
```

### Checkbox List

```
☑️ szavazások
   új szavazás, lejárat, eredmény

☐ napi összefoglaló
   18:00-kor összesítés

Checkbox specs:
- 20x20px
- border-radius: 4px
- checked: blue-500 bg, white checkmark
- unchecked: white bg, gray-300 border
```

---

## 6. Full Notifications Page

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ ← értesítések                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [mind] [bökések] [szavazások] [hirdetmények]           │
│   ↑                                                     │
│ aktív tab                                               │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ ma                                                      │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ • 👉 kiss béla bökött                           2p  │ │
│ │      "szavazz már pls"                              │ │
│ │      [💀] [😭] [🫡] [❤️] [👀]         [megnézem →] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ • 🗳️ új szavazás indult                        15p  │ │
│ │      sablon választás                               │ │
│ │      12/25 szavazott               [szavazok →]     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ tegnap                                                  │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ○ 📸 pótfotózás emlékeztető                     1n  │ │
│ │      holnap 10:00-kor a suliban                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ○ 📢 fontos hirdetmény                          2n  │ │
│ │      szalagavató részletek frissítve                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                  ◌ betöltés...                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Filter Tabs

```
[mind] [bökések] [szavazások] [hirdetmények]

Active tab:
- background: blue-500
- color: white
- font-weight: 600

Inactive tab:
- background: gray-100
- color: gray-600
- hover: gray-200

Tab specs:
- padding: 8px 16px
- border-radius: 9999px
- font-size: 14px
- gap: 8px
```

### Empty State

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                       🔔                            │
│                                                     │
│              még nincs értesítésed                  │
│                                                     │
│         majd szólunk ha történik valami             │
│                    érdekes!                         │
│                                                     │
└─────────────────────────────────────────────────────┘

Specs:
- padding: 64px 24px
- text-align: center
- emoji: 48px
- title: 18px, gray-900
- subtitle: 14px, gray-500
```

### Filtered Empty State

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                       🗳️                            │
│                                                     │
│           nincs szavazással kapcsolatos             │
│                  értesítésed                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 7. Animációk

### Bell Ring (Új értesítés)

```css
@keyframes bell-ring {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  30% { transform: rotate(10deg); }
  40% { transform: rotate(-10deg); }
  50% { transform: rotate(5deg); }
  60% { transform: rotate(-5deg); }
  70% { transform: rotate(0deg); }
}

.bell--ringing {
  animation: bell-ring 0.8s ease-in-out;
}
```

### Badge Pop

```css
@keyframes badge-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

.badge--new {
  animation: badge-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Dropdown Open

```css
@keyframes dropdown-open {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dropdown--opening {
  animation: dropdown-open 0.2s ease-out forwards;
}
```

### Toast Slide In

```css
@keyframes toast-slide-in {
  0% {
    opacity: 0;
    transform: translateY(100%) translateX(-50%);
  }
  100% {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
}

.toast--entering {
  animation: toast-slide-in 0.3s ease-out forwards;
}
```

### Toast Slide Out

```css
@keyframes toast-slide-out {
  0% {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
  100% {
    opacity: 0;
    transform: translateY(100%) translateX(-50%);
  }
}

.toast--leaving {
  animation: toast-slide-out 0.2s ease-in forwards;
}
```

### Toast Progress Bar

```css
@keyframes progress-shrink {
  0% { width: 100%; }
  100% { width: 0%; }
}

.toast__progress {
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  animation: progress-shrink var(--duration) linear forwards;
}
```

### Notification Item Pulse (Új)

```css
@keyframes notification-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
}

.notification-item--new {
  animation: notification-pulse 2s ease-in-out 2;
}
```

### Mark as Read Transition

```css
.notification-item {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.notification-item--unread {
  background: #EFF6FF;
  border-left-color: #3B82F6;
}

.notification-item--read {
  background: white;
  border-left-color: transparent;
}
```

---

## 8. Mobile Specifikus

### Bottom Sheet (helyett Dropdown)

```
┌─────────────────────────────────────────────────────┐
│ ═══════════════════════════════════════════════════ │  ← Drag handle
│                                                     │
│ értesítések                              [mind ✓]   │
│                                                     │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ • 👉 kiss béla bökött                          2p   │
│   "szavazz már pls"                                 │
│   [💀] [😭] [🫡] [❤️] [👀]                          │
│                                                     │
│ • 🗳️ új szavazás indult                       15p   │
│   sablon választás                                  │
│                               [megnézem →]          │
│                                                     │
│ [összes értesítés →]                                │
│                                                     │
└─────────────────────────────────────────────────────┘

Specs:
- position: fixed
- bottom: 0
- left: 0
- right: 0
- max-height: 70vh
- border-radius: 24px 24px 0 0
- box-shadow: 0 -10px 40px rgba(0,0,0,0.2)
```

### Drag Handle

```
═══════════════════════════════════════════════════

Specs:
- width: 40px
- height: 4px
- background: gray-300
- border-radius: 2px
- margin: 12px auto
```

### Touch Targets

```
Minden interaktív elem:
- min-height: 44px
- min-width: 44px
- padding megfelelően

Emoji reaction buttons (mobile):
- width: 44px
- height: 44px
- font-size: 22px
```

### Toast (Mobile)

```
┌────────────────────────────────────────────────────┐
│ ✓ szavazat elküldve                                │
└────────────────────────────────────────────────────┘

Position:
- bottom: 80px (bottom nav felett)
- left: 16px
- right: 16px
- (nem centered, hanem full width - padding)
```

### Swipe to Dismiss

```
User balra swipe-ol
      ↓
Toast követi az ujjat
      ↓
Ha >50% szélesség → dismiss
Ha <50% → snap back
      ↓
Dismiss: slide ki + fade out
```

---

## 9. Dark Mode

### Színpaletta (Dark)

```
Background:       #111827 (gray-900)
Card:             #1F2937 (gray-800)
Card Elevated:    #374151 (gray-700)
Text Primary:     #F9FAFB (gray-50)
Text Secondary:   #9CA3AF (gray-400)
Text Muted:       #6B7280 (gray-500)

Border:           #374151 (gray-700)
Divider:          #374151 (gray-700)

Unread BG:        #1E3A5F (blue-900/custom)
```

### Component Variants (Dark)

```css
/* Bell */
.dark .bell {
  color: #9CA3AF; /* gray-400 */
}
.dark .bell:hover {
  color: #F9FAFB; /* gray-50 */
}

/* Dropdown */
.dark .dropdown {
  background: #1F2937;
  border: 1px solid #374151;
}

/* Notification Item */
.dark .notification-item--unread {
  background: #1E3A5F;
}
.dark .notification-item--read {
  background: #1F2937;
}
.dark .notification-item:hover {
  background: #374151;
}

/* Toast */
.dark .toast--success {
  background: #064E3B; /* green-900 */
  border-color: #10B981;
  color: #D1FAE5;
}
.dark .toast--error {
  background: #7F1D1D; /* red-900 */
  border-color: #EF4444;
  color: #FEE2E2;
}

/* Snackbar */
.dark .snackbar {
  background: #374151;
  color: #F9FAFB;
}
```

---

## Icon Reference

### Notification Type Icons

| Type | Emoji | Alternatív (ha kell) |
|------|-------|---------------------|
| Poke received | 👉 | - |
| Poke reaction | (reaction emoji) | - |
| Vote created | 🗳️ | - |
| Vote ending | ⏰ | - |
| Vote closed | 📊 | - |
| Mention | 📣 | @ |
| Reply | ↩️ | - |
| Announcement | 📢 | - |
| Event reminder | 📅 | - |
| Samples added | 🖼️ | - |

### Toast Type Icons

| Type | Icon |
|------|------|
| Success | ✓ (checkmark) |
| Error | ✗ (x mark) |
| Warning | ⚠️ |
| Info | ℹ️ |

### UI Icons

| Purpose | Icon |
|---------|------|
| Bell | 🔔 |
| Mark all read | ✓ |
| Close | ✕ |
| Arrow right | → |
| Back | ← |
| Settings | ⚙️ |

---

## Responsive Breakpoints

```css
/* Mobile first */
.dropdown { /* mobile styles */ }

/* Tablet */
@media (min-width: 768px) {
  .dropdown {
    width: 380px;
    /* dropdown position */
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .dropdown {
    /* hover states, etc */
  }
}
```

### Mobile (<768px)
- Bottom sheet helyett dropdown
- Full-width toasts
- Larger touch targets

### Tablet (768px - 1024px)
- Dropdown (positioned)
- Standard toast width

### Desktop (>1024px)
- Dropdown with hover states
- Keyboard navigation
