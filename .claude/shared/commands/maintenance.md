---
name: maintenance
description: Heti kód-audit orchestrator — párhuzamos ágensekkel ellenőrzi a kódminőséget, biztonságot, és clean code szabályokat
user_invocable: true
---

# PhotoStack SaaS — Karbantartási Audit

Futtass párhuzamos audit-ot a teljes kódbázison. Használj Agent tool-t minden kategóriához PÁRHUZAMOSAN.

## 1. Fájlméret Audit (Agent 1)
Keresd meg az összes fájlt ami megsérti a méretkorlátokat:
- Komponens/Service/Controller: >400 sor → FIGYELMEZTETÉS, >500 sor → HIBA
- Adat fájlok (.data.ts, .routes.ts, .models.ts): >800 sor → HIBA
- Metódusok: >50 sor → FIGYELMEZTETÉS
Ellenőrizd: `frontend/src/` és `backend/app/`

## 2. Security Audit (Agent 2)
Keresd a biztonsági problémákat:
- `shell_exec`, `exec(`, `system(` használat (Symfony Process kell helyette)
- `localStorage` token tárolás (sessionStorage kell)
- Hiányzó `safeLikePattern()` ILIKE lekérdezéseknél
- `dd(`, `dump(`, `var_dump` maradványok
- Hiányzó Policy-k (minden Model-hez kell)
- Inline validáció FormRequest helyett (>3 szabály esetén)
- Rate limiting hiány publikus endpoint-okon

## 3. Clean Code Audit (Agent 3)
- `console.log` maradványok (kivéve test fájlok)
- Redundáns kód (ugyanaz a logika 3+ helyen)
- BehaviorSubject ami Signal lehetne
- takeUntil + destroy$ pattern (DestroyRef kell helyette)
- *ngIf, *ngFor használat (@if, @for kell)
- Hiányzó OnPush change detection
- CommonModule import (explicit importok kellenek)

## 4. Teszt Coverage Audit (Agent 4)
- Hány .spec.ts fájl van vs hány komponens/service
- Backend: hány controller-hez van teszt vs hány controller összesen
- Hiányzó tesztek kritikus területeken: auth, fizetés, jogosultságok, export

## 5. Redundancia Audit (Agent 5)
- Ugyanaz a HTTP hívás minta 2+ helyen
- Ugyanaz a validáció 2+ helyen
- Copy-paste kód blokkok keresése
- Hasonló nevű service metódusok különböző service-ekben

## Kimenet
Minden agent eredménye után készíts egy **priorizált összefoglaló táblázatot**:

| # | Prioritás | Kategória | Fájl | Probléma | Javítás |
|---|-----------|-----------|------|----------|---------|

Prioritás: 🔴 KRITIKUS (security), 🟠 FONTOS (clean code megsértés), 🟡 AJÁNLOTT (improvement)

Kérdezd meg a usert: melyik problémákat javítsam most?
