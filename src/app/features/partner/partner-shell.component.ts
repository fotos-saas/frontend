import { Component, inject, signal, ChangeDetectionStrategy, computed, OnInit, DestroyRef, ElementRef } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { NgClass } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { MobileNavOverlayComponent } from '../../core/layout/components/mobile-nav-overlay/mobile-nav-overlay.component';
import { TopBarComponent } from '../../core/layout/components/top-bar/top-bar.component';
import { MenuItem } from '../../core/layout/models/menu-item.model';
import { SubscriptionService, SubscriptionInfo } from './services/subscription.service';
import { PartnerFinalizationService } from './services/partner-finalization.service';
import { BrandingService } from './services/branding.service';
import { ICONS, TEAM_MEMBER_ROLES, getSubscriptionStatusLabel } from '../../shared/constants';
import { environment } from '../../../environments/environment';
import { HelpFabComponent } from '../help/components/help-fab/help-fab.component';
import { ChatbotPanelComponent } from '../help/components/chatbot-panel/chatbot-panel.component';
import { InviteBannerComponent } from '../../shared/components/invite-banner/invite-banner.component';
import { PartnerSwitcherDropdownComponent } from '../../shared/components/partner-switcher-dropdown/partner-switcher-dropdown.component';


/** Role badge nevek */
const ROLE_BADGES: Record<string, string> = {
  partner: 'Partner',
  designer: 'Grafikus',
  marketer: 'Marketinges',
  printer: 'Nyomdász',
  assistant: 'Ügyintéző',
};

/**
 * Partner Shell - Layout komponens a fotós/partner felülethez.
 * Saját TopBar és Sidebar menüvel.
 * - Desktop (1024px+): 240px sidebar, teljes menü
 * - Tablet (768-1023px): 60px sidebar, csak ikonok + tooltip
 * - Mobile (< 768px): közös MobileNavOverlayComponent
 */
@Component({
  selector: 'app-partner-shell',
  standalone: true,
  imports: [
    RouterModule,
    RouterLink,
    RouterLinkActive,
    NgClass,
    LucideAngularModule,
    MatTooltipModule,
    MobileNavOverlayComponent,
    TopBarComponent,
    HelpFabComponent,
    ChatbotPanelComponent,
    InviteBannerComponent,
    PartnerSwitcherDropdownComponent,
  ],
  templateUrl: './partner-shell.component.html',
  styleUrl: './partner-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeFlyout()',
  },
})
export class PartnerShellComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private authService = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);
  private finalizationService = inject(PartnerFinalizationService);
  protected readonly brandingService = inject(BrandingService);
  private router = inject(Router);
  protected sidebarState = inject(SidebarStateService);
  protected readonly ICONS = ICONS;
  protected chatOpen = signal(false);
  private readonly elementRef = inject(ElementRef);

  /** Flyout almenü — melyik szekció van nyitva collapsed módban */
  protected activeFlyout = signal<string | null>(null);

  /** Flyout panel pozíció */
  protected flyoutPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  /** Base URL a route-okhoz - role alapján */
  protected baseUrl = computed(() => {
    const roles = this.userRoles();
    // Csapattagok saját URL-t kapnak
    if (roles.includes('designer')) return '/designer';
    if (roles.includes('printer')) return '/printer';
    if (roles.includes('assistant')) return '/assistant';
    // Marketer marad a /marketer shell-en, ide nem jut el
    return '/partner';
  });

  // Subscription info
  subscriptionInfo = signal<SubscriptionInfo | null>(null);
  // Nyomdában lévő projektek száma (badge)
  inPrintCount = signal(0);

  // User role info - azonnal inicializálva a computed-ok miatt
  private userRoles = signal<string[]>(this.authService.getCurrentUser()?.roles ?? []);
  partnerName = signal<string>(''); // Főnök neve csapattagok számára

  /** Több partnerhez tartozik-e a user */
  hasMultiplePartners = computed(() => {
    const user = this.authService.getCurrentUser();
    return (user?.partners_count ?? 0) > 1;
  });

  /** Jelenlegi partner ID */
  currentPartnerId = computed(() => {
    const user = this.authService.getCurrentUser();
    return user?.partner_id ?? null;
  });

  /** Aktuális role badge (Partner, Grafikus, stb.) */
  roleBadge = computed(() => {
    const roles = this.userRoles();
    for (const role of TEAM_MEMBER_ROLES) {
      if (roles.includes(role)) {
        return ROLE_BADGES[role] || role;
      }
    }
    return ROLE_BADGES['partner'];
  });

  /** Partner tulajdonos-e (nem csapattag) */
  isOwner = computed(() => {
    const roles = this.userRoles();
    return roles.includes('partner') && !TEAM_MEMBER_ROLES.some(r => roles.includes(r));
  });

  /** Csapattag-e */
  isTeamMember = computed(() => {
    const roles = this.userRoles();
    return TEAM_MEMBER_ROLES.some(r => roles.includes(r));
  });

  /** Szűrt menü a role és baseUrl alapján */
  navItems = computed<MenuItem[]>(() => {
    const base = this.baseUrl();

    // Teljes menü (partner tulajdonosnak)
    const allItems: MenuItem[] = [
      { id: 'dashboard', route: `${base}/dashboard`, label: 'Irányítópult', icon: 'home' },
      {
        id: 'projects',
        label: 'Projektek',
        icon: 'folder-open',
        children: [
          { id: 'projects-list', route: `${base}/projects`, label: 'Projektek' },
          { id: 'finalizations', route: `${base}/projects/finalizations`, label: 'Véglegesítések', badge: this.inPrintCount() || undefined },
          { id: 'schools', route: `${base}/projects/schools`, label: 'Iskolák' },
          { id: 'teachers', route: `${base}/projects/teachers`, label: 'Tanárok' },
          { id: 'students', route: `${base}/projects/students`, label: 'Diákok' },
          { id: 'settings', route: `${base}/projects/settings`, label: 'Beállítások' },
        ]
      },
      { id: 'contacts', route: `${base}/contacts`, label: 'Kapcsolatok', icon: 'users' },
      { id: 'team', route: `${base}/team`, label: 'Csapatom', icon: 'user-plus' },
      { id: 'orders', route: `${base}/orders/clients`, label: 'Megrendelések', icon: 'shopping-bag', devBadge: true },
      {
        id: 'webshop',
        label: 'Webshop',
        icon: 'store',
        devBadge: true,
        children: [
          { id: 'webshop-settings', route: `${base}/webshop/settings`, label: 'Beállítások', devBadge: true },
          { id: 'webshop-products', route: `${base}/webshop/products`, label: 'Termékek és árak', devBadge: true },
          { id: 'webshop-orders', route: `${base}/webshop/orders`, label: 'Rendelések', devBadge: true },
        ]
      },
      {
        id: 'customization',
        label: 'Testreszabás',
        icon: 'palette',
        children: [
          { id: 'branding', route: `${base}/customization/branding`, label: 'Márkajelzés' },
        ]
      },
      {
        id: 'subscription',
        label: 'Előfizetésem',
        icon: 'credit-card',
        children: [
          { id: 'subscription-overview', route: `${base}/subscription/overview`, label: 'Előfizetés' },
          { id: 'subscription-invoices', route: `${base}/subscription/invoices`, label: 'Számlák' },
          { id: 'subscription-addons', route: `${base}/subscription/addons`, label: 'Kiegészítők' },
          { id: 'subscription-account', route: `${base}/subscription/account`, label: 'Fiók törlése' },
        ]
      },
      {
        id: 'partner-settings',
        label: 'Beállítások',
        icon: 'settings',
        children: [
          { id: 'billing', route: `${base}/settings/billing`, label: 'Számlázás és fizetés', devBadge: true },
        ]
      },
    ];

    let items: MenuItem[];

    if (this.isOwner()) {
      items = allItems;
    } else {
      // Csapattagok: nincs Csapatom, nincs Testreszabás, nincs Előfizetésem (de van Fiók törlése + Beállítások)
      items = allItems
        .filter(item => !['team', 'customization', 'subscription', 'partner-settings'].includes(item.id))
        .concat([
          { id: 'settings', route: `${base}/projects/settings`, label: 'Beállítások', icon: 'settings' },
          { id: 'account-delete', route: `${base}/account`, label: 'Fiók törlése', icon: 'user-x' },
        ]);
    }

    // Production-ben a devBadge menüpontok elrejtése
    if (environment.production) {
      items = items
        .filter(item => !item.devBadge)
        .map(item => {
          if (item.children) {
            const filtered = item.children.filter(c => !c.devBadge);
            return filtered.length ? { ...item, children: filtered } : null;
          }
          return item;
        })
        .filter((item): item is MenuItem => item !== null);
    }

    return items;
  });

  private readonly destroyRef = inject(DestroyRef);

  /** Hibajelentés link - sidebar aljára rögzítve */
  bugReportLink = computed(() => `${this.baseUrl()}/bugs`);

  /** Route szegmens → szekció ID mapping az auto-expand-hez */
  private readonly routeToSectionMap: Record<string, string> = {
    '/projects': 'projects',
    '/subscription': 'subscription',
    '/customization': 'customization',
    '/settings': 'partner-settings',
    '/webshop': 'webshop',
  };

  // Mobile menü items (desktop + hibajelentés)
  mobileMenuItems = computed<MenuItem[]>(() => [
    ...this.navItems(),
    { id: 'bugs', route: this.bugReportLink(), label: 'Hibajelentés', icon: 'bug' },
  ]);

  userName = signal<string>('');
  userEmail = signal<string>('');

  /** User info a TopBar inline megjelenítéséhez */
  userInfo = computed(() => {
    const baseInfo = {
      name: this.userName(),
      email: this.userEmail() || undefined
    };

    // Csapattagoknál mutassuk a főnök nevét
    if (this.isTeamMember() && this.partnerName()) {
      return {
        ...baseInfo,
        subtitle: `@ ${this.partnerName()}`
      };
    }

    return baseInfo;
  });

  constructor() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName.set(user.name);
      this.userEmail.set(user.email ?? '');
      // userRoles már inicializálva van a deklarációnál
    }
  }

  ngOnInit(): void {
    // Sidebar scope beállítása + persistence betöltése
    this.sidebarState.setScope('partner', []);

    // Route-alapú auto-expand: aktuális URL-re
    this.sidebarState.expandSectionForRoute(this.router.url, this.routeToSectionMap);

    // Route-alapú auto-expand: navigáció figyelése
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.sidebarState.expandSectionForRoute(e.urlAfterRedirects, this.routeToSectionMap);
    });

    this.loadSubscriptionInfo();
    this.loadBranding();
    this.loadInPrintCount();
  }

  private loadSubscriptionInfo(): void {
    this.subscriptionService.getSubscription().subscribe({
      next: (info) => {
        this.subscriptionInfo.set(info);
        // Partner név beállítása (csapattagoknak a főnök neve)
        if (info.partner_name) {
          this.partnerName.set(info.partner_name);
        }
      },
      error: (err) => this.logger.error('Failed to load subscription info', err)
    });
  }

  private loadInPrintCount(): void {
    this.finalizationService.getInPrintCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.inPrintCount.set(res.count),
        error: () => {},
      });
  }

  private loadBranding(): void {
    this.brandingService.getBranding().subscribe({
      next: (response) => {
        // Csak akkor alkalmazzuk a branding-et a headerben, ha a feature aktív ÉS a branding be van kapcsolva
        const isEffective = response.feature_active && response.branding?.is_active;
        this.brandingService.updateState(isEffective ? response.branding : null);
      },
      error: () => {} // 403 vagy egyéb hiba - nem baj, marad az alapértelmezett
    });
  }

  // Központi konstansból
  getStatusLabel = getSubscriptionStatusLabel;

  getSubscriptionTooltip(): string {
    const info = this.subscriptionInfo();
    if (!info) return 'Előfizetés kezelése';

    const parts: string[] = [`${info.plan_name} csomag`];

    if (info.has_extra_storage) {
      parts.push(`+${info.extra_storage_gb} GB extra tárhely`);
    }

    if (info.has_addons && info.active_addons?.length) {
      const addonNames: Record<string, string> = {
        'community_pack': 'Közösségi csomag'
      };
      const addons = info.active_addons.map(key => addonNames[key] || key).join(', ');
      parts.push(`Addonok: ${addons}`);
    }

    parts.push('Kattints a kezeléshez');
    return parts.join(' • ');
  }

  /** Szülő szekció aktív-e (valamelyik gyerek route-ja egyezik az aktuális URL-lel) */
  isSectionActive(item: MenuItem): boolean {
    if (!item.children?.length) return false;
    const url = this.router.url;
    return item.children.some(child => child.route && url.startsWith(child.route));
  }

  /** Szekció kattintás — tablet módban flyout toggle, egyébként section toggle */
  toggleSectionOrFlyout(sectionId: string, event: MouseEvent): void {
    if (this.sidebarState.isTablet()) {
      if (this.activeFlyout() === sectionId) {
        this.activeFlyout.set(null);
      } else {
        const button = (event.currentTarget as HTMLElement);
        const rect = button.getBoundingClientRect();
        this.flyoutPosition.set({
          top: rect.top,
          left: rect.right + 4,
        });
        this.activeFlyout.set(sectionId);
      }
    } else {
      this.sidebarState.toggleSection(sectionId);
    }
  }

  /** Flyout bezárása */
  closeFlyout(): void {
    this.activeFlyout.set(null);
  }

  /** Flyout navigáció — bezárás + menü bezárás */
  onFlyoutNavigate(): void {
    this.activeFlyout.set(null);
  }

  /** Kívülre kattintás — flyout bezárás */
  onDocumentClick(event: MouseEvent): void {
    if (!this.activeFlyout()) return;
    const sidebar = this.elementRef.nativeElement.querySelector('.sidebar');
    if (sidebar && !sidebar.contains(event.target as Node)) {
      this.activeFlyout.set(null);
    }
  }

  logout(): void {
    this.sidebarState.close();
    this.authService.logoutPartner();
  }
}
