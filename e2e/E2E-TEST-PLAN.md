# PhotoStack SaaS — E2E Tesztterv

> **Branch:** `feature/e2e-tests` (frontend + backend)
> **Készült:** 2026-03-12
> **Technológia:** Playwright + Docker Compose (teszt környezet) + Mailpit (email)

---

## 1. Cél

Éjszakánként automatikusan lefutó, teljes felhasználói folyamat tesztelés, ami:

- **Üres adatbázisból indul** — minden tesztciklus elején `migrate:fresh`
- **Seeder-ek töltik fel** — sok adat, valósághű terhelés
- **Minden user role-t végigpróbál** — partner, csapattag, szülő, nyomdász, admin, marketinges
- **Egymásra épülő flow-k** — amit az egyik user csinál, azt látja-e a másik
- **Email-eket ellenőriz** — Mailpit SMTP trap + REST API
- **Reggeli riportot küld** — ha bármi elbukik, értesítés (Slack/email/GitHub Summary)

---

## 2. Architektúra

### 2.1. Teszt környezet (Docker Compose)

```
docker-compose.e2e.yml
┌───────────────────────────────────────────────────┐
│                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Laravel     │  │ Angular     │  │ PostgreSQL│ │
│  │ (test-app)  │  │ (test-fe)   │  │ (test-db) │ │
│  │ :8000       │  │ :4205       │  │ :5432     │ │
│  └─────────────┘  └─────────────┘  └───────────┘ │
│                                                   │
│  ┌─────────────┐  ┌─────────────┐                 │
│  │ Redis       │  │ Mailpit     │ ← fake SMTP    │
│  │ (test-redis)│  │ :1025/:8025 │   + REST API   │
│  │ :6379       │  │             │                 │
│  └─────────────┘  └─────────────┘                 │
│                                                   │
└───────────────────────────────────────────────────┘
         ↑
    Playwright rácsatlakozik
```

**Mailpit** — SMTP-t kap a Laravel-től, REST API-n le tudjuk kérdezni:
- `GET /api/v1/messages` — összes email listázása
- `GET /api/v1/message/{id}` — email tartalom + HTML
- `DELETE /api/v1/messages` — inbox ürítése (teszt előtt)

### 2.2. Futtatási módok

| Mód | Parancs | Mikor |
|-----|---------|-------|
| **Lokális UI** | `npm run e2e:ui` | Fejlesztés közben, interaktív |
| **Lokális headless** | `npm run e2e` | Gyors ellenőrzés, commit előtt |
| **CI éjszakai** | GitHub Actions cron (02:00 UTC) | Minden éjjel automatikusan |
| **CI PR-re** | GitHub Actions on push | Csak a "smoke" teszt subset |

### 2.3. Teszt adatbázis lifecycle

```
1. migrate:fresh          → üres DB
2. db:seed --class=E2ESeeder  → alap adat (admin, planok, email template-ek)
3. Playwright tesztek futnak → közben API-n + UI-n is épül az adat
4. Tesztek között NEM resetelünk — a tesztek egymásra épülnek (journey)
```

---

## 3. User role-ok és tesztelendő flow-k

### 3.1. Partner (fotós/stúdió tulajdonos)

A rendszer fő felhasználója. Mindent ő kezel.

| # | Flow | Leírás | Prioritás |
|---|------|--------|-----------|
| P1 | Regisztráció | Email + jelszó → megerősítő email → bejelentkezés | 🔴 Kritikus |
| P2 | Bejelentkezés | Email + jelszó, hibás jelszó (3x → lockout) | 🔴 Kritikus |
| P3 | Projekt létrehozás | Új tablóprojekt + iskola + osztályok | 🔴 Kritikus |
| P4 | Diákok felvétele | Manuális + CSV import + névlista paste | 🔴 Kritikus |
| P5 | Fotó feltöltés | Chunked upload, progress bar, EXIF megjelenítés | 🔴 Kritikus |
| P6 | Galéria monitoring | Megtekintések, kiválasztások statisztikája | 🟡 Fontos |
| P7 | Export (Excel + ZIP) | Monitoring export, letöltés ellenőrzés | 🟡 Fontos |
| P8 | Sablon kezelés | Sablon létrehozás, kategória választás | 🟡 Fontos |
| P9 | Csapattag meghívás | Email küldés → meghívó link → regisztráció | 🔴 Kritikus |
| P10 | Értesítések | Notification bell, badge szám, olvasottá tétel | 🟡 Fontos |
| P11 | Beállítások | Branding, logo, email beállítások | 🟢 Normál |
| P12 | Előfizetés kezelés | Csomag megtekintés, limit ellenőrzés | 🟡 Fontos |
| P13 | Kapcsolatok kezelés | Szülő/kapcsolattartó hozzáadás, email küldés | 🔴 Kritikus |
| P14 | Webshop termékek | Termék létrehozás, árazás, elérhetőség | 🟡 Fontos |
| P15 | Rendelés kezelés | Rendelés megtekintés, státusz változtatás | 🟡 Fontos |
| P16 | Nyomdász kapcsolat | Nyomdász meghívás, finalizálás küldés | 🟡 Fontos |

### 3.2. Csapattag (designer / nyomdász / asszisztens)

Partner által meghívott felhasználó, korlátozott jogokkal.

| # | Flow | Leírás | Prioritás |
|---|------|--------|-----------|
| T1 | Meghívó elfogadás | Email link → regisztráció → dashboard | 🔴 Kritikus |
| T2 | Jogosultság ellenőrzés | Designer ≠ nyomdász ≠ asszisztens jogok | 🔴 Kritikus |
| T3 | Projekt hozzáférés | Csak a hozzárendelt projekteket látja | 🔴 Kritikus |
| T4 | Számlázás rejtett | Billing/subscription szekció NEM látható | 🔴 Kritikus |

### 3.3. Szülő / Vendég (képválasztó felhasználó)

Tabló frontend — kódos vagy share link-es belépés.

| # | Flow | Leírás | Prioritás |
|---|------|--------|-----------|
| G1 | Kódos belépés | Work session kód → azonosítás → galéria | 🔴 Kritikus |
| G2 | Share link belépés | Token alapú automatikus belépés | 🔴 Kritikus |
| G3 | Fotó böngészés | Galéria, szűrés, rendezés | 🔴 Kritikus |
| G4 | Képválasztás | Fotók kijelölése, mentés, limit ellenőrzés | 🔴 Kritikus |
| G5 | Véglegesítés | Kiválasztás véglegesítése, PDF generálás | 🔴 Kritikus |
| G6 | Fórum | Hozzászólás írás, válasz, like (feature-gated) | 🟡 Fontos |
| G7 | Szavazás | Poll kitöltés, eredmény megtekintés (feature-gated) | 🟡 Fontos |
| G8 | Hírfolyam | Bejegyzés olvasás, komment (feature-gated) | 🟡 Fontos |
| G9 | Webshop rendelés | Kosár → fizetés → rendelés | 🟡 Fontos |
| G10 | Értesítés a partnernek | Partner látja, hogy a szülő választott | 🔴 Kritikus |

### 3.4. Marketinges

Értékesítő, aki projekteket hoz létre iskoláknak.

| # | Flow | Leírás | Prioritás |
|---|------|--------|-----------|
| M1 | Bejelentkezés | Saját login + dashboard | 🟡 Fontos |
| M2 | Projekt létrehozás | Iskola kiválasztás, osztályok, QR kód | 🟡 Fontos |
| M3 | Kapcsolatok kezelés | Kapcsolattartó felvétel projekthez | 🟡 Fontos |
| M4 | QR kód generálás | QR kód + pin megjelenítés | 🟡 Fontos |

### 3.5. Super Admin

Rendszer adminisztrátor.

| # | Flow | Leírás | Prioritás |
|---|------|--------|-----------|
| A1 | Előfizető kezelés | Lista, keresés, csomag módosítás | 🟡 Fontos |
| A2 | Email sablonok | Sablon szerkesztés, preview | 🟢 Normál |
| A3 | Hibajelentések | Bug report lista, státusz, prioritás | 🟢 Normál |
| A4 | Help rendszer | KB cikk szerkesztés, guided tour kezelés | 🟢 Normál |

### 3.6. Nyomdász (Print Shop)

| # | Flow | Leírás | Prioritás |
|---|------|--------|-----------|
| PS1 | Projekt lista | Hozzárendelt projektek megtekintése | 🟡 Fontos |
| PS2 | Finalizálás | Print-ready fájl letöltés | 🟡 Fontos |

---

## 4. Journey-k (egymásra épülő tesztek)

A tesztek NEM függetlenek — egy nagy történetet mesélnek el, mint egy valódi használat.

### Journey 1: Teljes tablófolyamat (FÓKUSZ — ez fut először)

```
Lépés  Szerep      Mit csinál
─────────────────────────────────────────────────────────────
 1.    Partner     Regisztrál → email megerősítés (Mailpit)
 2.    Partner     Bejelentkezik
 3.    Partner     Létrehoz egy iskolát
 4.    Partner     Létrehoz egy projektet 2 osztállyal
 5.    Seeder      30 diák/osztály + 60 fotó feltöltés (API-n)
 6.    Partner     Meghív egy csapattagot (designer)
 7.    Email       Csapattag meghívó megérkezik (Mailpit)
 8.    Designer    Elfogadja a meghívót, regisztrál
 9.    Designer    Belép → látja a projektet, NEM látja a számlázást
10.    Partner     Beállít egy kapcsolattartót (szülő email)
11.    Partner     Aktiválja a képválasztót → szülő email megy (Mailpit)
12.    Szülő       Megnyitja a képválasztó linket
13.    Szülő       Belép kóddal → böngészi a galériát
14.    Szülő       Kiválaszt 3 fotót → véglegesít
15.    Partner     Monitoring: látja az 1/30 kiválasztást
16.    Partner     Kap értesítést (notification bell)
17.    Partner     Exportál Excel-t + ZIP-et → letöltés OK
```

### Journey 2: Jogosultság és biztonság

```
Lépés  Szerep        Mit csinál
─────────────────────────────────────────────────────────────
 1.    Támadó       Rossz jelszó 3x → lockout ellenőrzés
 2.    Vendég       Lejárt token → redirect login-ra
 3.    Designer     Próbál számlázást elérni → 403
 4.    Marketinges  Próbál admin felületet elérni → 403
 5.    Vendég       Más projekt fotóihoz hozzáférni → 403
```

### Journey 3: Előfizetési limitek

```
Lépés  Szerep      Mit csinál
─────────────────────────────────────────────────────────────
 1.    Seeder      Partner "Alap" csomaggal (max 10 osztály)
 2.    Partner     10 osztály létrehozása → OK
 3.    Partner     11. osztály → hibaüzenet (limit elérve)
 4.    Admin       Csomag upgrade "Iskola"-ra
 5.    Partner     11. osztály → most már OK
```

### Journey 4: Webshop + fizetés

```
Lépés  Szerep      Mit csinál
─────────────────────────────────────────────────────────────
 1.    Partner     Webshop terméket hoz létre (fotónyomat)
 2.    Szülő       Böngészi a webshopot
 3.    Szülő       Kosárba tesz 2 terméket
 4.    Szülő       Megrendelés → visszaigazoló email (Mailpit)
 5.    Partner     Látja az új rendelést a dashboardon
```

### Journey 5: Közösségi funkciók (feature-gated)

```
Lépés  Szerep      Mit csinál
─────────────────────────────────────────────────────────────
 1.    Seeder      Partner "Iskola" csomag (fórum + szavazás engedélyezve)
 2.    Szülő       Fórum bejegyzést ír
 3.    Másik szülő Válaszol rá
 4.    Partner     Szavazást indít (3 opció)
 5.    Szülő       Szavaz → eredmény megjelenítés
 6.    Szülő       Hírfolyamban megjelenik az aktivitás
```

### Journey 6: Terheléses teszt (seeder-ekkel)

```
Lépés  Leírás
─────────────────────────────────────────────────────────────
 1.    Seeder: 5 iskola, 50 osztály, 1500 diák, 3000 fotó
 2.    Partner dashboard betöltés < 3 sec
 3.    Galéria lapozás (infinite scroll) → nincs lag
 4.    Monitoring oldal 1500 diákkal → renderel < 2 sec
 5.    Excel export 1500 sorral → letöltés < 10 sec
```

---

## 5. Technikai részletek

### 5.1. Mappastruktúra

```
frontend/
├── e2e/
│   ├── playwright.config.ts        # Playwright config
│   ├── global-setup.ts             # DB migrate + seed, Mailpit reset
│   ├── global-teardown.ts          # Cleanup
│   │
│   ├── helpers/
│   │   ├── api.helper.ts           # Közvetlen API hívások (seeder, gyors setup)
│   │   ├── mailpit.helper.ts       # Mailpit REST API wrapper
│   │   ├── db.helper.ts            # DB seed/reset parancsok
│   │   └── auth.helper.ts          # Login + token kezelés
│   │
│   ├── pages/                      # Page Object Model-ek
│   │   ├── partner/
│   │   │   ├── dashboard.page.ts
│   │   │   ├── project.page.ts
│   │   │   ├── gallery.page.ts
│   │   │   ├── monitoring.page.ts
│   │   │   ├── settings.page.ts
│   │   │   └── team.page.ts
│   │   ├── guest/
│   │   │   ├── selection.page.ts
│   │   │   ├── forum.page.ts
│   │   │   └── webshop.page.ts
│   │   ├── admin/
│   │   │   └── subscribers.page.ts
│   │   ├── marketer/
│   │   │   └── projects.page.ts
│   │   └── auth/
│   │       ├── login.page.ts
│   │       └── register.page.ts
│   │
│   ├── journeys/                   # Egymásra épülő flow tesztek
│   │   ├── 01-full-workflow.spec.ts
│   │   ├── 02-security.spec.ts
│   │   ├── 03-subscription-limits.spec.ts
│   │   ├── 04-webshop.spec.ts
│   │   ├── 05-community.spec.ts
│   │   └── 06-load-test.spec.ts
│   │
│   ├── smoke/                      # Gyors smoke tesztek (PR-ekhez)
│   │   ├── login.smoke.ts
│   │   ├── dashboard.smoke.ts
│   │   └── gallery.smoke.ts
│   │
│   └── fixtures/
│       ├── test-users.ts           # Fix teszt felhasználók
│       ├── test-photos/            # Minta fotók (kicsi, teszt célú)
│       └── test-csv/               # Minta CSV importok

backend/
├── docker-compose.e2e.yml          # Teszt környezet Docker
├── database/
│   └── seeders/
│       └── E2ESeeder.php           # E2E-specifikus seeder
├── .env.e2e                        # Teszt környezet config (Mailpit SMTP, stb.)
└── tests/
    └── E2E/                        # Backend-oldali E2E segédletek
        └── ResetDatabase.php       # Artisan parancs: e2e:reset
```

### 5.2. Backend `.env.e2e`

```env
APP_ENV=e2e
DB_DATABASE=photostack_e2e
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_ENCRYPTION=null
QUEUE_CONNECTION=sync          # Emailek azonnal mennek, nem queue-ba
```

### 5.3. Playwright config kulcsbeállítások

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './journeys',
  fullyParallel: false,          // Journey-k SORBAN futnak!
  retries: 1,                    // 1 retry bukás esetén
  workers: 1,                    // 1 worker (mert egymásra épülnek)
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:4205',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});
```

### 5.4. Smoke tesztek (PR-ekhez — gyors, párhuzamos)

```typescript
// Külön config: playwright.smoke.config.ts
export default defineConfig({
  testDir: './smoke',
  fullyParallel: true,           // Smoke tesztek PÁRHUZAMOSAN
  workers: 4,
  retries: 0,
});
```

### 5.5. Mailpit helper

```typescript
// e2e/helpers/mailpit.helper.ts
export class MailpitHelper {
  constructor(private baseUrl = 'http://localhost:8025') {}

  async clearInbox() { /* DELETE /api/v1/messages */ }
  async waitForEmail(opts: { to: string, subject: RegExp, timeout?: number }) { /* poll */ }
  async getLatestEmail(to: string) { /* GET /api/v1/messages?to=... */ }
  async extractLink(emailId: string, pattern: RegExp): string { /* link kinyerés HTML-ből */ }
}
```

### 5.6. API helper (seeder shortcut)

```typescript
// e2e/helpers/api.helper.ts
export class ApiHelper {
  constructor(private baseUrl = 'http://localhost:8000') {}

  async seedStudents(projectId: number, className: string, count: number) { /* POST /e2e/seed/students */ }
  async seedPhotos(projectId: number, count: number) { /* POST /e2e/seed/photos */ }
  async resetDatabase() { /* POST /e2e/reset */ }
  async getAuthToken(email: string, password: string): Promise<string> { /* POST /api/auth/login */ }
}
```

> **FONTOS:** Az `/e2e/*` route-ok CSAK `APP_ENV=e2e` esetén léteznek! Production-ben nem elérhetők.

---

## 6. CI/CD integráció

### 6.1. GitHub Actions — éjszakai futtatás

```yaml
# .github/workflows/e2e-nightly.yml
name: E2E Éjszakai Tesztek

on:
  schedule:
    - cron: '0 22 * * *'        # 22:00 UTC = 23:00 CET
  workflow_dispatch:              # Kézi indítás is lehessen

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_DB: photostack_e2e
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7.2
      mailpit:
        image: axllent/mailpit
        ports: ['8025:8025', '1025:1025']

    steps:
      - uses: actions/checkout@v4
      - name: Backend setup (migrate + seed)
      - name: Frontend build
      - name: Playwright install
      - name: E2E tesztek futtatása
      - name: Riport feltöltés (artifact)
        if: always()
      - name: Értesítés ha bukik (Slack/email)
        if: failure()
```

### 6.2. GitHub Actions — PR smoke teszt

```yaml
# .github/workflows/e2e-smoke.yml
name: E2E Smoke

on: [pull_request]

jobs:
  smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Smoke tesztek (csak login + dashboard + galéria)
```

### 6.3. Riport formátum

Bukott teszteknél automatikusan generálódik:
- **HTML riport** — `playwright-report/index.html`
- **Screenshot** — minden bukott teszt lépésénél
- **Video** — az egész teszt session felvétele
- **Trace** — Playwright Trace Viewer-ben visszajátszható

---

## 7. data-testid stratégia

A meglévő e2e README szerint `data-testid`-t kerüljük, de a **Journey tesztekhez** mégis kellenek stabil selectorok. Kompromisszum:

| Selector típus | Mikor használjuk |
|----------------|------------------|
| `getByRole()` | Gombok, linkek, input-ok — elsődleges |
| `getByText()` | Magyar szövegek alapján — ha egyértelmű |
| `getByTestId()` | Komplex/dinamikus elemek, ahol a role/text nem elég |
| CSS class | Soha (törékeny, változhat) |

A `data-testid`-ket fokozatosan adjuk a komponensekhez, ahogy teszteket írunk.

---

## 8. Implementációs sorrend

| Sprint | Mit | Becsült scope |
|--------|-----|---------------|
| **S1** | Playwright config + Docker Compose e2e + Mailpit | Infra alap |
| **S2** | Backend: E2E seeder + `/e2e/*` route-ok (csak e2e env-ben) | Laravel |
| **S3** | Page Object-ek: auth, partner dashboard, galéria | Frontend |
| **S4** | Journey 1: Teljes tablófolyamat (17 lépés) | Fő teszt |
| **S5** | Journey 2: Jogosultság + Journey 3: Limitek | Biztonság |
| **S6** | Smoke tesztek + GitHub Actions CI | CI/CD |
| **S7** | Journey 4-6: Webshop, közösségi, terhelés | Kiegészítők |

---

## 9. Nyitott kérdések

- [ ] Külön gépen fut az éjszakai teszt (pl. VPS), vagy GitHub Actions runner?
- [ ] Kell-e Slack értesítés, vagy elég a GitHub email?
- [ ] Stripe fizetés tesztelése → Stripe test mode, vagy mock?
- [ ] Visual regression (screenshot összehasonlítás) kell-e?
- [ ] Mennyi teszt fotó legyen a fixture-ben (méret vs sebesség)?
