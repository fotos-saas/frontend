/**
 * Tab title resolver — route data-bol vagy URL-bol kinyeri a tab cimet es ikont
 */

import { inject, Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ICONS } from '@shared/constants/icons.constants';
import type { TabRouteData } from '../models/tab.model';

/** URL alapu cim mapping (fallback ha nincs route data title) */
const URL_TITLE_MAP: Record<string, { title: string; icon: string }> = {
  '/partner/dashboard': { title: 'Vezerlopult', icon: ICONS.LAYOUT_DASHBOARD },
  '/partner/projects': { title: 'Projektek', icon: ICONS.FOLDER },
  '/partner/schools': { title: 'Iskolak', icon: ICONS.SCHOOL },
  '/partner/contacts': { title: 'Kapcsolatok', icon: ICONS.USERS },
  '/partner/billing': { title: 'Szamlazas', icon: ICONS.CREDIT_CARD },
  '/partner/settings': { title: 'Beallitasok', icon: ICONS.SETTINGS },
  '/partner/templates': { title: 'Sablonok', icon: ICONS.LAYOUT_TEMPLATE },
  '/partner/notifications': { title: 'Ertesitesek', icon: ICONS.INBOX },
  '/partner/bookings': { title: 'Foglalasok', icon: ICONS.CALENDAR_DAYS },
  '/partner/email': { title: 'Email', icon: ICONS.MAIL },
  '/partner/forum': { title: 'Forum', icon: ICONS.MESSAGE_CIRCLE },
  '/partner/webshop': { title: 'Webshop', icon: ICONS.STORE },
  '/partner/help': { title: 'Segitseg', icon: ICONS.HELP_CIRCLE },
};

@Injectable({ providedIn: 'root' })
export class TabTitleResolver {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  /** Route data-bol vagy URL-bol kinyeri a tab infot */
  resolveFromUrl(url: string): TabRouteData {
    // Pontos egyezes
    const exact = URL_TITLE_MAP[url];
    if (exact) return exact;

    // Prefix egyezes (pl. /partner/projects/42 → Projektek)
    for (const [prefix, data] of Object.entries(URL_TITLE_MAP)) {
      if (url.startsWith(prefix + '/')) {
        return data;
      }
    }

    // Fallback: URL utolso szegmensebol
    const segments = url.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || 'Uj tab';
    const title = (last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')).slice(0, 50);
    return { title, icon: ICONS.FILE };
  }

  /** Aktualis route-bol kinyeri a title-t */
  resolveFromCurrentRoute(): TabRouteData {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const data = route.snapshot.data;
    if (data['title']) {
      return {
        title: data['title'] as string,
        icon: (data['icon'] as string) || this.resolveFromUrl(this.router.url).icon,
      };
    }

    return this.resolveFromUrl(this.router.url);
  }
}
