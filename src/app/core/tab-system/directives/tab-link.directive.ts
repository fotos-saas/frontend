/**
 * TabLinkDirective — routerLink-re kozepso kattintas figyelo
 *
 * Ha Electron modban kozepso egergombot nyomnak egy routerLink-en,
 * uj tab-ban nyilik meg az URL (nem navigal az aktiv tab-ban).
 */

import { Directive, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TabManagerService } from '../services/tab-manager.service';

@Directive({
  selector: '[routerLink]',
  standalone: true,
})
export class TabLinkDirective {
  private readonly tabManager = inject(TabManagerService);
  private readonly routerLink = inject(RouterLink, { self: true, optional: true });

  @HostListener('auxclick', ['$event'])
  onAuxClick(event: MouseEvent): void {
    // Csak kozepso gomb (button === 1) es csak Electron tab modban
    if (event.button !== 1) return;
    if (!this.tabManager.isTabSystemEnabled()) return;
    if (!this.routerLink) return;

    event.preventDefault();
    event.stopPropagation();

    const url = this.routerLink.urlTree?.toString();
    if (url) {
      this.tabManager.createTab(url, { activate: false });
    }
  }
}
