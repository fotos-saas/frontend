import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
  effect,
  input,
  output,
  computed
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { MenuConfigService } from '../../services/menu-config.service';
import { ScrollLockService } from '../../../services/scroll-lock.service';
import { MenuItem } from '../../models/menu-item.model';
import { PartnerSwitchService } from '../../../services/auth/partner-switch.service';
import type { PartnerOption } from '../../../models/auth.models';

/**
 * User info interface a mobil menü alsó részéhez
 */
export interface MobileNavUserInfo {
  name: string;
  email?: string;
}

/**
 * Mobile Nav Overlay Component
 *
 * Mobil nézetben a hamburger menüből kinyíló overlay.
 * - Dark theme backdrop + slide-in sidebar
 * - Navigáció után automatikus bezárás
 * - Escape billentyű bezárás
 * - Lucide ikonok
 * - A11y: Focus trap, aria-expanded
 * - Opcionális user section (marketinges stílusban)
 * - Opcionális egyedi menüelemek (customMenuItems)
 */
@Component({
  selector: 'app-mobile-nav-overlay',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, LucideAngularModule],
  templateUrl: './mobile-nav-overlay.component.html',
  styleUrls: ['./mobile-nav-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class MobileNavOverlayComponent {
  protected readonly sidebarState = inject(SidebarStateService);
  protected readonly menuConfig = inject(MenuConfigService);
  private readonly scrollLockService = inject(ScrollLockService);
  private readonly partnerSwitchService = inject(PartnerSwitchService);
  private readonly destroyRef = inject(DestroyRef);

  // Opcionális egyedi menüelemek (ha nincs megadva, MenuConfigService-ből jön)
  customMenuItems = input<MenuItem[]>();

  // User section adatok (opcionális - ha megadva, megjelenik az alsó rész)
  userInfo = input<MobileNavUserInfo>();

  // Partner switcher (opcionális)
  showPartnerSwitcher = input<boolean>(false);
  currentPartnerId = input<number | null>(null);

  // Partner lista state
  readonly partners = signal<PartnerOption[]>([]);
  readonly partnersLoaded = signal(false);
  readonly switchingPartnerId = signal<number | null>(null);

  // Logout callback (opcionális - ha megadva, megjelenik a kijelentkezés gomb)
  logoutEvent = output<void>();

  // Computed: aktuális menüelemek (custom vagy MenuConfig)
  protected menuItems = computed(() => {
    const custom = this.customMenuItems();
    return custom && custom.length > 0 ? custom : this.menuConfig.menuItems();
  });

  // Computed: bottom menüelemek (csak ha nincs custom)
  protected bottomMenuItems = computed(() => {
    const custom = this.customMenuItems();
    // Ha custom menu van, nem használunk bottom items-et
    return custom && custom.length > 0 ? [] : this.menuConfig.bottomMenuItems();
  });

  constructor() {
    // Body scroll lock effect
    effect(() => {
      if (this.sidebarState.isOpen() && this.sidebarState.isMobile()) {
        this.scrollLockService.lock();
      } else {
        this.scrollLockService.unlock();
      }
    });

    // Partner lista betöltése sidebar megnyitásakor
    effect(() => {
      if (this.sidebarState.isOpen() && this.showPartnerSwitcher() && !this.partnersLoaded()) {
        this.loadPartners();
      }
    });
  }

  /**
   * Escape billentyű bezárja az overlay-t
   */
  onEscapeKey(): void {
    if (this.sidebarState.isOpen()) {
      this.sidebarState.close();
    }
  }

  /**
   * Szekció toggle
   */
  toggleSection(id: string): void {
    this.sidebarState.toggleSection(id);
  }

  /**
   * Szekció kibontott-e
   */
  isExpanded(id: string): boolean {
    return this.sidebarState.isSectionExpanded(id);
  }

  /**
   * Navigáció után bezárás
   */
  onNavigate(): void {
    this.sidebarState.close();
  }

  /**
   * Kijelentkezés kezelése
   */
  onLogout(): void {
    this.sidebarState.close();
    this.logoutEvent.emit();
  }

  /**
   * Partner lista betöltése
   */
  private loadPartners(): void {
    this.partnerSwitchService.getMyPartners()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.partners.set(response.partners);
          this.partnersLoaded.set(true);
        },
      });
  }

  /**
   * Partner váltás
   */
  switchPartner(partner: PartnerOption): void {
    if (this.switchingPartnerId() || partner.partner_id === this.currentPartnerId()) return;

    this.switchingPartnerId.set(partner.partner_id);
    this.partnerSwitchService.switchPartner(partner.partner_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          sessionStorage.setItem('marketer_token', response.token);
          sessionStorage.setItem('marketer_user', JSON.stringify(response.user));
          window.location.reload();
        },
        error: () => {
          this.switchingPartnerId.set(null);
        }
      });
  }

  isCurrentPartner(partner: PartnerOption): boolean {
    return partner.partner_id === this.currentPartnerId();
  }
}
