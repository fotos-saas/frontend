import { Tour } from '../guided-tour.types';

export const SCHOOLS_TOUR: Tour = {
  id: 'partner-schools-list',
  name: 'Iskolák lista bemutató',
  autoStart: true,
  steps: [
    {
      title: 'Üdvözlünk az Iskolák oldalon!',
      description: 'Ez az oldal segít az összes iskolád kezelésében. Mutatjuk a legfontosabb funkciókat!',
      placement: 'center',
      highlightType: 'none',
    },
    {
      targetSelector: '.page-header .btn-primary',
      title: 'Új iskola hozzáadása',
      description: 'Ezzel a gombbal tudsz új iskolát felvenni a rendszerbe. Kattintás után add meg az iskola nevét és típusát.',
      placement: 'bottom',
      highlightType: 'spotlight',
      spotlightPadding: 6,
    },
    {
      targetSelector: '.search-box',
      title: 'Keresés az iskolák között',
      description: 'Gépelj be ide egy nevet, és azonnal szűrjük a listát. Név szerint keres.',
      placement: 'bottom',
      highlightType: 'spotlight',
      spotlightPadding: 4,
    },
    {
      targetSelector: '.list-row:first-child .school-actions',
      title: 'Iskola műveletek',
      description: 'Minden iskolánál elérheted a szerkesztést, összekapcsolást és törlést. Kattints egy iskolára a részletekhez!',
      placement: 'left',
      highlightType: 'border',
      spotlightPadding: 6,
    },
    {
      title: 'Kész!',
      description: 'Most már ismered az alapokat. Ha bármikor újra szeretnéd nézni, keresd a Súgó menüben a Bemutatókat.',
      placement: 'center',
      highlightType: 'none',
    },
  ],
};
