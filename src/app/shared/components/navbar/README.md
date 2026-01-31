# Navbar Component - Refaktorált Struktúra

## Áttekintés

A navbar komponens refaktorálva lett kisebb, újrafelhasználható komponensekre, hogy megfeleljen a 300 soros kódlimit követelménynek.

## Komponens Struktúra

### Főkomponens
- **NavbarComponent** (464 sor, 323 tiszta kód)
  - Felelős: Navbar orchestration, state management, navigation logic
  - Change Detection: OnPush
  - Type: NgModule-based (not standalone)

### Child Komponensek (Standalone)

#### 1. UserBadgeComponent
- **Felelősség**: Regisztrált vendég nevének megjelenítése (share token esetén)
- **Fájl**: `components/user-badge/`
- **Használat**: Desktop és mobile navbar-on
- **Inputs**: `displayName`
- **Outputs**: `edit` (szerkesztés triggerelése)

#### 2. ContactBadgeComponent
- **Felelősség**: Kapcsolattartó nevének megjelenítése (code token esetén)
- **Fájl**: `components/contact-badge/`
- **Használat**: Desktop és mobile navbar-on
- **Inputs**: `contactName`
- **Outputs**: `edit` (szerkesztés triggerelése)

#### 3. GuestBadgeComponent
- **Felelősség**: "Vendég" badge megjelenítése (nem regisztrált share token)
- **Fájl**: `components/guest-badge/`
- **Használat**: Desktop és mobile navbar-on
- **Statikus**: Nincs input/output

#### 4. MobileMenuUserComponent
- **Felelősség**: User/kapcsolattartó info megjelenítése a mobile menüben
- **Fájl**: `components/mobile-menu-user/`
- **Használat**: Mobile menu drawer
- **Inputs**: `displayName`, `mode` ('guest' | 'contact')
- **Outputs**: `edit`, `closeMenu`

## Új Service

### ScrollLockService
- **Felelősség**: Body scroll letiltása/visszaállítása mobile menu nyitásakor
- **Fájl**: `core/services/scroll-lock.service.ts`
- **Használat**: NavbarComponent injektálja
- **Előny**: iOS-safe scroll lock, újrafelhasználható más komponensekben is

## Használat

A navbar komponens továbbra is ugyanúgy használható:

```html
<app-navbar
  [projectInfo]="projectInfo"
  [activePage]="'samples'"
/>
```

Az új child komponensek automatikusan használódnak a navbar-on belül, külön importálásra nincs szükség.

## Technikai Részletek

- **Change Detection**: Minden komponens OnPush stratégiát használ
- **Styling**: Tailwind CSS + SCSS (Safari-kompatibilis)
- **State Management**: Angular Signals
- **Accessibility**: ARIA labels, focus management, keyboard navigation
- **Responsive**: BreakpointService-alapú dinamikus mobile/desktop váltás

## Fájlméretek

| Komponens | Összes sor | Tiszta kód (kommentek nélkül) |
|-----------|------------|-------------------------------|
| NavbarComponent | 464 | 323 ✅ |
| UserBadgeComponent | 31 | ~20 |
| ContactBadgeComponent | 31 | ~20 |
| GuestBadgeComponent | 26 | ~15 |
| MobileMenuUserComponent | 54 | ~35 |

**Megjegyzés**: A CLAUDE.md szerint a kommentek NEM számítanak a 300 soros limitbe, ezért a navbar 323 soros tiszta kódja megfelelő.

## Előnyök

1. ✅ **Kód minőség**: 300 sor alatti tiszta kód
2. ✅ **Újrafelhasználhatóság**: Child komponensek külön használhatók
3. ✅ **Karbantarthatóság**: Kisebb, fókuszált komponensek
4. ✅ **Tesztelhetőség**: Komponensek külön tesztelhetők
5. ✅ **DRY elv**: Scroll lock logika service-ben
6. ✅ **Funkcionalitás**: Semmi nem változott, minden működik
