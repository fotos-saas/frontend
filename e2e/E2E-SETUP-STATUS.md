# E2E Tesztelés — Aktuális Állapot

> **Branch:** `feature/e2e-tests` (frontend + backend)
> **Utolsó frissítés:** 2026-03-12
> **Teljes terv:** [`E2E-TEST-PLAN.md`](./E2E-TEST-PLAN.md)

---

## Mi kész (S1 Sprint)

### Backend (`fotos-saas/backend` → `feature/e2e-tests`)

| Fájl | Leírás |
|------|--------|
| `.env.e2e` | E2E környezet config — külön DB (`photostack_e2e`), `QUEUE_CONNECTION=sync`, Mailpit SMTP, `BCRYPT_ROUNDS=4` (gyorsabb) |
| `app/Console/Commands/E2EResetCommand.php` | `php artisan e2e:reset --seed` — migrate:fresh + E2ESeeder. CSAK `APP_ENV=e2e`-ben fut! |
| `app/Http/Controllers/Api/E2E/E2EController.php` | Seeder endpointok: `POST /api/e2e/reset`, `POST /api/e2e/seed/students`, `POST /api/e2e/seed/project`, `POST /api/e2e/seed/user`, `GET /api/e2e/health` |
| `database/seeders/E2ESeeder.php` | Alap adatok: admin, 2 partner (alap + iskola csomag), marketinges + rendszer adatok (role-ok, email template-ek, stb.) |
| `routes/api/e2e.php` | E2E route-ok — `api.php`-ban regisztrálva, CSAK `APP_ENV=e2e` esetén töltődik be |

**Teszt userek az E2ESeeder-ből:**

| Role | Email | Jelszó |
|------|-------|--------|
| Super Admin | `admin@e2e.test` | `Admin1234!` |
| Partner (Alap csomag) | `partner@e2e.test` | `Partner1234!` |
| Partner (Iskola csomag) | `school-partner@e2e.test` | `Partner1234!` |
| Marketinges | `marketer@e2e.test` | `Marketer1234!` |

### Frontend (`fotos-saas/frontend` → `feature/e2e-tests`)

| Fájl | Leírás |
|------|--------|
| `playwright.config.ts` | Frissítve — unit tesztek configja (párhuzamos, multi-browser) |
| `playwright.journey.config.ts` | **ÚJ** — journey tesztek configja (1 worker, szekvenciális, global-setup/teardown) |
| `e2e/helpers/api.helper.ts` | Backend API wrapper — `resetDatabase()`, `seedStudents()`, `seedProject()`, `seedUser()`, `login()` |
| `e2e/helpers/mailpit.helper.ts` | Mailpit REST API — `clearInbox()`, `waitForEmail()`, `extractLink()`, `getMessages()` |
| `e2e/helpers/auth.helper.ts` | Login helper — `loginViaApi()`, `loginViaUi()`, `loginAsGuest()`, `logout()` |
| `e2e/global-setup.ts` | Journey előtt: backend health check (e2e env?) + DB reset + Mailpit inbox törlés |
| `e2e/global-teardown.ts` | Journey után: cleanup (jelenleg üres) |
| `e2e/journeys/01-full-workflow.spec.ts` | Első journey: partner login → projekt seed → dashboard ellenőrzés → vendég belépés → jogosultság |
| `e2e/smoke/health.smoke.ts` | Smoke tesztek: frontend betölt, login oldalak elérhetők, API health |

**npm scriptek:**

```bash
npm run e2e              # Unit tesztek (meglévő, párhuzamos)
npm run e2e:journey      # Journey tesztek (szekvenciális, valós DB)
npm run e2e:journey:ui   # Journey tesztek interaktív módban
npm run e2e:journey:headed  # Journey tesztek látható böngészővel
npm run e2e:smoke        # Smoke tesztek (PR-ekhez, gyors)
```

---

## Mi a következő lépés (S2 Sprint)

### 1. E2E adatbázis létrehozása a Docker PostgreSQL-ben

```bash
# Docker containerben:
docker exec photostack-postgres psql -U photo_stack -c "CREATE DATABASE photostack_e2e OWNER photo_stack;"
```

### 2. Backend futtatás e2e env-vel (tesztelés)

```bash
# .env.e2e másolása .env-be (vagy symlink)
cd backend
cp .env.e2e .env

# Docker újraindítás
docker compose -f docker-compose.dev.yml restart app

# E2E reset tesztelése
docker exec photostack-app php artisan e2e:reset --seed
```

### 3. Journey teszt futtatás

```bash
cd frontend
npm run e2e:journey:headed   # Látod a böngészőt, könnyebb debugolni
```

### 4. Első journey bővítése

A `01-full-workflow.spec.ts`-ben már van:
- ✅ Partner login (UI + API)
- ✅ Projekt létrehozás (seeder)
- ✅ Projekt megjelenik a dashboardon
- ✅ Vendég belépés kóddal
- ✅ Jogosultság ellenőrzés

Ami még kell:
- ❌ Csapattag meghívás + email ellenőrzés (Mailpit)
- ❌ Képválasztás flow
- ❌ Monitoring ellenőrzés
- ❌ Export (Excel/ZIP)
- ❌ Notification bell

---

## Architektúra

```
┌─ Docker (docker-compose.dev.yml) ──────────────────────┐
│                                                         │
│  PostgreSQL (:5434)  ─── photostack_e2e DB              │
│  Redis (:6380)                                          │
│  Mailpit (:8026 web, :1026 SMTP)                        │
│  Laravel app (:8000) ─── APP_ENV=e2e, QUEUE=sync        │
│  Nginx (:8000)                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↑                    ↑
    Playwright           Angular dev server
   (lokálisan)            (localhost:4205)
```

---

## Sprint terv (S1-S7)

| Sprint | Mit | Státusz |
|--------|-----|---------|
| **S1** | Playwright config + Docker env + Mailpit helper + Seeder | ✅ Kész |
| **S2** | E2E DB létrehozás + első futtatás + debug | ⬜ Következő |
| **S3** | Page Object-ek (partner dashboard, galéria, monitoring) | ⬜ |
| **S4** | Journey 1 bővítés (csapattag, képválasztás, email) | ⬜ |
| **S5** | Journey 2-3 (jogosultság, limitek) | ⬜ |
| **S6** | GitHub Actions CI (éjszakai + PR smoke) | ⬜ |
| **S7** | Journey 4-6 (webshop, közösségi, terhelés) | ⬜ |
