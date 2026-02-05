import {
  Component,
  input,
  inject,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MenuItem } from '../../models/menu-item.model';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { NavigationLoadingService } from '../../../services/navigation-loading.service';

/**
 * Sidebar Menu Item Component
 *
 * Egyetlen menüelem megjelenítése a sidebar-ban.
 * Támogatja:
 * - Egyszerű elemeket (route + icon + label)
 * - Szekciók (children + expand/collapse)
 * - Collapsed mód (csak ikon, tooltip)
 * - Badge megjelenítés
 * - Disabled állapot
 * - Dark theme + gradient active state
 * - Lucide ikonok
 * - A11y: focus-visible, aria-expanded
 */
@Component({
  selector: 'app-sidebar-menu-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, LucideAngularModule],
  templateUrl: './sidebar-menu-item.component.html',
  styleUrls: ['./sidebar-menu-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarMenuItemComponent {
  /** Menüelem adat */
  readonly item = input.required<MenuItem>();

  /** Collapsed mód (csak ikonok látszanak) */
  readonly collapsed = input<boolean>(false);

  private readonly router = inject(Router);
  private readonly sidebarState = inject(SidebarStateService);
  private readonly navigationLoading = inject(NavigationLoadingService);

  /** Szekció kibontott-e */
  readonly isExpanded = computed(() =>
    this.sidebarState.isSectionExpanded(this.item().id)
  );

  /** Pending state - erre a route-ra navigálunk */
  readonly isPending = computed(() => {
    const route = this.item().route;
    if (!route) return false;
    return this.navigationLoading.isPendingRoute(route);
  });

  /**
   * Szekció toggle
   */
  toggleSection(): void {
    this.sidebarState.toggleSection(this.item().id);
  }

  /**
   * Menüpont kattintás - ha aktív, újratöltjük az oldalt
   */
  onMenuClick(event: MouseEvent, isActive: boolean): void {
    if (isActive && this.item().route) {
      event.preventDefault();
      // Újranavigálás ugyanarra a route-ra (onSameUrlNavigation: 'reload' kell a routerben)
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([this.item().route]);
      });
    }
  }
}
