# Frontend-Tablo - Projekt Struktúra

> Kutatás dátuma: 2025-01-19

## Technológiai Stack

| Komponens | Verzió |
|-----------|--------|
| **Angular** | 19.2.17 |
| **TypeScript** | 5.8.3 |
| **Tailwind CSS** | 3.4.19 |
| **RxJS** | 7.8 |
| **Tesztelés** | Vitest + Playwright |
| **Rich Text** | ngx-quill / ngx-editor |

---

## Mappa Struktúra

```
frontend-tablo/
├── src/app/
│   ├── core/
│   │   ├── services/          # 20+ szolgáltatás
│   │   │   ├── auth.service.ts        # Bejelentkezés (3 mód)
│   │   │   ├── guest.service.ts       # Vendég session kezelés
│   │   │   ├── voting.service.ts      # Szavazás API
│   │   │   ├── forum.service.ts       # Fórum API
│   │   │   ├── toast.service.ts       # Értesítések
│   │   │   ├── clipboard.service.ts   # Vágólap
│   │   │   ├── tablo-storage.service.ts # LocalStorage
│   │   │   └── schedule-reminder.service.ts
│   │   ├── guards/            # Route védelem
│   │   │   └── auth.guard.ts
│   │   ├── models/            # TypeScript interfészek
│   │   │   ├── voting.models.ts
│   │   │   ├── forum.models.ts
│   │   │   └── ...
│   │   └── interceptors/      # HTTP interceptor
│   │       └── auth.interceptor.ts
│   │
│   ├── features/              # Főbb modulok
│   │   ├── home/              # Kezdőlap + dashboard
│   │   ├── samples/           # Minták megtekintése + lightbox
│   │   ├── template-chooser/  # Sablon választó
│   │   ├── order-data/        # Megrendelési adatok
│   │   ├── missing-persons/   # Hiányzó személyek
│   │   ├── order-finalization/# Véglegesítés
│   │   ├── voting/            # 🗳️ SZAVAZÁS MODUL
│   │   │   ├── voting-list/
│   │   │   ├── voting-card/
│   │   │   ├── voting-detail/
│   │   │   ├── voting-create-dialog/
│   │   │   ├── voting-edit-dialog/
│   │   │   ├── voting-results/
│   │   │   ├── voting.constants.ts
│   │   │   └── voting.routes.ts
│   │   └── forum/             # 💬 FÓRUM MODUL
│   │       ├── forum-list/
│   │       ├── forum-card/
│   │       ├── forum-detail/
│   │       ├── forum-post/
│   │       ├── create-discussion-dialog/
│   │       └── forum.routes.ts
│   │
│   ├── shared/
│   │   ├── components/        # 17 újrafelhasználható komponens
│   │   │   ├── navbar/
│   │   │   ├── footer/
│   │   │   ├── guest-name-dialog/
│   │   │   ├── confirm-dialog/
│   │   │   ├── rich-text-editor/
│   │   │   ├── schedule-card/
│   │   │   ├── schedule-reminder-dialog/
│   │   │   ├── contact-edit-dialog/
│   │   │   ├── finalization-reminder-dialog/
│   │   │   ├── class-size-dialog/
│   │   │   ├── participants-dialog/
│   │   │   ├── partner-banner/
│   │   │   ├── toast/
│   │   │   ├── zoom-controls/
│   │   │   └── lightbox/
│   │   ├── directives/
│   │   │   └── zoom/
│   │   ├── helpers/
│   │   └── pipes/
│   │
│   ├── layouts/
│   │   └── main-layout/       # Navbar + router outlet
│   │
│   └── pages/                 # Belépési oldalak
│       ├── login.component.ts         # 6 jegyű kód
│       ├── share-login.component.ts   # Megosztó link
│       └── preview-login.component.ts # Admin előnézet
│
├── environments/
│   ├── environment.ts         # Development
│   └── environment.prod.ts    # Production
│
├── docs/                      # Dokumentáció
│   └── research/              # Kutatási anyagok (ez a mappa)
│
├── e2e/                       # Playwright tesztek
├── angular.json               # Port: 4205
├── tailwind.config.js
├── package.json
└── vite.config.mts
```

---

## Főbb Konfigurációk

### Angular.json
- Port: **4205**
- Output: `dist/frontend-tablo/`
- Style: SCSS
- Skip tests: true (alapértelmezett)

### Build Budgets
- Initial bundle: 500kb warning, 1mb error
- Component styles: 6kb warning, 12kb error

### Proxy
```json
{
  "/api": {
    "target": "http://localhost:8000",
    "secure": false
  }
}
```

---

## API Integráció

### Base URL
- Development: `http://localhost:8000/api`
- Production: környezeti változóból

### Endpoint Prefix
- `/tablo-frontend/*` - Tablo-specifikus endpoint-ok
- `/auth/*` - Autentikáció

### HTTP Headers
```typescript
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
X-Guest-Session: <guest_session_token>  // Vendég műveletekhez
withCredentials: true
```
