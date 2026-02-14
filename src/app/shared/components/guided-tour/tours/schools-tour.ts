import { Tour } from '../guided-tour.types';

export const SCHOOLS_TOUR: Tour = {
  id: 'partner-schools-list',
  name: 'Iskolák lista bemutató',
  autoStart: true,
  steps: [
    // === v1 — Üres oldal is megjeleníthető ===
    {
      since: 1,
      title: 'Üdvözlünk az Iskolák oldalon!',
      description: 'Ez az oldal segít az összes iskolád kezelésében. Mutatjuk a legfontosabb funkciókat!',
      placement: 'center',
      highlightType: 'none',
    },
    {
      since: 1,
      targetSelector: '.page-header .btn-primary',
      title: 'Új iskola hozzáadása',
      description: 'Ezzel a gombbal tudsz új iskolát felvenni a rendszerbe. Kattintás után add meg az iskola nevét és típusát.',
      placement: 'bottom',
      highlightType: 'spotlight',
      spotlightPadding: 6,
    },
    {
      since: 1,
      targetSelector: '.search-box',
      title: 'Keresés az iskolák között',
      description: 'Gépelj be ide egy nevet, és azonnal szűrjük a listát. Név szerint keres.',
      placement: 'bottom',
      highlightType: 'spotlight',
      spotlightPadding: 4,
    },

    // === v2 — Akkor jelenik meg, ha van legalább egy iskola ===
    {
      since: 2,
      targetSelector: '.school-row:first-child .projects-badge',
      requiredSelector: '.school-row',
      title: 'Projektek száma',
      description: 'Itt látod, hány aktív/összes projekt tartozik az iskolához. A kék badge aktív projekteket jelez. Kattints a sorra a részletekhez!',
      placement: 'bottom',
      highlightType: 'spotlight',
      spotlightPadding: 6,
    },
    {
      since: 2,
      targetSelector: '.school-row:first-child .school-actions',
      requiredSelector: '.school-row',
      title: 'Iskola műveletek',
      description: 'Összekapcsolás, tanári fotók letöltése, szerkesztés és törlés — minden művelet egy helyen.',
      placement: 'left',
      highlightType: 'border',
      spotlightPadding: 6,
    },

    // === Outro — Mindig megjelenik (ha van normál step) ===
    {
      isOutro: true,
      title: 'Kész!',
      description: 'Most már ismered az alapokat. Ha bármikor újra szeretnéd nézni, keresd a Súgó menüben a Bemutatókat.',
      placement: 'center',
      highlightType: 'none',
    },
  ],
};
