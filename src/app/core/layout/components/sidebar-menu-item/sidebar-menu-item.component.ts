import {
  Component,
  input,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
  ElementRef,
  DestroyRef
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
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
 * - Collapsed mód: flyout almenü (sidebar jobb oldalán)
 * - Badge megjelenítés
 * - Disabled állapot
 * - Dark theme + gradient active state
 * - Lucide ikonok
 * - A11y: focus-visible, aria-expanded, Escape bezárás
 */
@Component({
  selector: 'app-sidebar-menu-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, LucideAngularModule],
  templateUrl: './sidebar-menu-item.component.html',
  styleUrls: ['./sidebar-menu-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeFlyout()',
  },
})
export class SidebarMenuItemComponent {
  /** Menüelem adat */
  readonly item = input.required<MenuItem>();

  /** Collapsed mód (csak ikonok látszanak) */
  readonly collapsed = input<boolean>(false);

  private readonly router = inject(Router);
  private readonly sidebarState = inject(SidebarStateService);
  private readonly navigationLoading = inject(NavigationLoadingService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Aktuális URL (signal, NavigationEnd-re frissül) */
  private readonly currentUrl = signal(this.router.url);

  /** Szekció kibontott-e */
  readonly isExpanded = computed(() =>
    this.sidebarState.isSectionExpanded(this.item().id)
  );

  /** Szülő szekció aktív-e (valamelyik gyerek route-ja egyezik az aktuális URL-lel) */
  readonly isSectionActive = computed(() => {
    const children = this.item().children;
    if (!children?.length) return false;
    const url = this.currentUrl();
    return children.some(child => child.route && url.startsWith(child.route));
  });

  /** Flyout almenü nyitva van-e (collapsed módban) */
  readonly flyoutOpen = signal(false);

  /** Flyout panel pozíciója (fixed) */
  readonly flyoutPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => this.currentUrl.set(e.urlAfterRedirects));
  }

  /** Pending state - erre a route-ra navigálunk */
  readonly isPending = computed(() => {
    const route = this.item().route;
    if (!route) return false;
    return this.navigationLoading.isPendingRoute(route);
  });

  /**
   * Szekció toggle — collapsed módban flyout-ot nyit/zár
   */
  toggleSection(event: MouseEvent): void {
    if (this.collapsed()) {
      if (this.flyoutOpen()) {
        this.flyoutOpen.set(false);
      } else {
        const button = (event.currentTarget as HTMLElement);
        const rect = button.getBoundingClientRect();
        this.flyoutPosition.set({
          top: rect.top,
          left: rect.right + 4,
        });
        this.flyoutOpen.set(true);
      }
    } else {
      this.sidebarState.toggleSection(this.item().id);
    }
  }

  /**
   * Flyout bezárása
   */
  closeFlyout(): void {
    this.flyoutOpen.set(false);
  }

  /**
   * Flyout menüpont navigáció
   */
  onFlyoutNavigate(): void {
    this.flyoutOpen.set(false);
  }

  /**
   * Kívülre kattintás — flyout bezárás
   */
  onDocumentClick(event: MouseEvent): void {
    if (!this.flyoutOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.flyoutOpen.set(false);
    }
  }

  /**
   * Menüpont kattintás - ha aktív, újratöltjük az oldalt
   */
  onMenuClick(event: MouseEvent, isActive: boolean): void {
    if (isActive && this.item().route) {
      event.preventDefault();
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([this.item().route]);
      });
    }
  }
}
