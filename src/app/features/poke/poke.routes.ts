import { Routes } from '@angular/router';

export const POKE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./missing-page/missing-page.component')
      .then(m => m.MissingPageComponent)
  }
];

export default POKE_ROUTES;
