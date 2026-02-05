import { Component, ChangeDetectionStrategy } from '@angular/core';
/**
 * Guest Badge Component
 *
 * Megjeleníti a "Vendég" badge-t (share token esetén, amikor nincs regisztrált session).
 * Statikus megjelenítés, nem kattintható.
 */
@Component({
  selector: 'app-guest-badge',
  standalone: true,
  imports: [],
  template: `
    <span
      class="navbar__guest-badge"
      role="status"
      aria-label="Vendég módban böngészel, korlátozott hozzáféréssel"
    >
      Vendég
    </span>
  `,
  styleUrls: ['./guest-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuestBadgeComponent {}
