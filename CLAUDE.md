# PhotoStack SaaS - Fotós Platform

> **Részletes dokumentáció:** [`docs/`](docs/README.md)

## Projekt Infó

| | |
|---|---|
| **Projekt neve** | PhotoStack SaaS (tablóstúdió + képválasztó) |
| **Domének** | tablostudio.hu, kepvalaszto.hu |
| **Szerver** | 89.167.19.19 (Hetzner CPX22, Helsinki) |
| **Hosting** | Coolify (self-hosted PaaS) |
| **GitHub** | github.com/fotos-saas |

---

## 🚨 KRITIKUS SZABÁLYOK

| # | Szabály | Részletek |
|---|---------|-----------|
| 1 | **BACKUP** adatbázis műveletek előtt | |
| 2 | **MINDEN UI szöveg MAGYAR** | |
| 3 | **Fájlméret limit** | Komponens max 300 sor |
| 4 | **Redundancia csökkentés** | Duplikált kód → service/helper |
| 5 | **ConfirmDialog törléshez** | Destruktív műveleteknél `ConfirmDialogComponent` |
| 6 | **FormData ID→intval** | `array_map('intval', $ids)` mert FormData stringet küld |
| 7 | **`page-card` class MINDEN oldalon** | Fő container-hez: `<div class="my-page page-card">` |
| 8 | **Dialógusok page-card KÍVÜL** | backdrop-filter stacking context miatt! |
| 9 | **`dialog-backdrop` + `dialog-panel` class** | Egységes dialógus stílus |
| 10 | **Lucide ikonok `ICONS` konstanssal** | NEM emoji! `import { ICONS } from '@shared/constants'` |
| 11 | **`matTooltip` tooltiphez** | Angular Material tooltip |
| 12 | **`createBackdropHandler` dialógusokhoz** | Szöveg kijelölés közben NE záródjon be! |

---

## 🏗️ TECH STACK

| Layer | Technológia |
|-------|-------------|
| **Backend** | Laravel 11 + PHP 8.3 |
| **Frontend** | Angular 17+ Standalone + Tailwind CSS |
| **Database** | PostgreSQL 17 |
| **Cache/Queue** | Redis 7.2 |
| **Hosting** | Coolify + Docker |
| **DNS/CDN** | Cloudflare |

---

## 🚀 DEPLOYMENT (Coolify)

### URLs
| Komponens | URL |
|-----------|-----|
| Frontend | https://tablostudio.hu |
| Backend API | https://api.tablostudio.hu |
| Coolify Dashboard | http://89.167.19.19:8000 |

### Deploy folyamat
1. Git push → GitHub
2. Coolify webhookkal automatikusan deployol VAGY
3. Coolify Dashboard → Redeploy gomb

### Parancsok
```bash
# SSH a szerverre
ssh root@89.167.19.19

# Coolify logok
docker logs -f <container_name>
```

---

## 💬 TOOLTIP RENDSZER (ANGULAR MATERIAL)

```typescript
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  imports: [MatTooltipModule],
})
```

```html
<button matTooltip="Mentés">Save</button>
<button matTooltip="Szöveg" matTooltipPosition="above">Felül</button>
```

⚠️ **NE használd:** `data-tooltip` - ELAVULT!

---

## 🎨 IKON RENDSZER (LUCIDE)

```typescript
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';

@Component({
  imports: [LucideAngularModule],
})
export class MyComponent {
  readonly ICONS = ICONS;
}
```

```html
<lucide-icon [name]="ICONS.PLUS" [size]="18" />
```

⚠️ **NE használd:** Emojikat (`📱`, `✕`) - Lucide ikont használj!

---

## 🪟 DIALOG RENDSZER

```typescript
import { createBackdropHandler } from '@shared/utils/dialog.util';

@Component({...})
export class MyDialogComponent {
  @Output() close = new EventEmitter<void>();
  backdropHandler = createBackdropHandler(() => this.close.emit());
}
```

### Panel méretek
| Class | Max-width | Használat |
|-------|-----------|-----------|
| `dialog-panel` | 400px | Confirm, alert |
| `dialog-panel--md` | 480px | Form, QR modal |
| `dialog-panel--lg` | 600px | Részletes form |

---

## ✨ UI/UX ANIMÁCIÓK

### Loading States
- **Skeleton loading** spinner helyett (shimmer effekttel)

### Lista Animációk
- **Staggered entry**: Kártyák egymás után (0.05s delay)
- **Hover**: translateY(-2px) + shadow növelés

### Dialog/Modal
- **Backdrop**: fadeIn 0.2s
- **Content**: slideUp 0.3s cubic-bezier

### A11y - KÖTELEZŐ!
```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📦 PAGE-CARD LAYOUT

```html
<div class="my-component page-card">
  <!-- Tartalom -->
</div>
```

---

## 🔧 LOKÁLIS FEJLESZTÉS

```bash
# Frontend
cd frontend && npm run start

# Backend (ha lokálisan fut)
cd backend && php artisan serve
```

---

## Megjegyzések
- Multi-brand architektúra (több domain, egy rendszer)
- Magyar nyelv elsődleges
- GDPR kompatibilis
