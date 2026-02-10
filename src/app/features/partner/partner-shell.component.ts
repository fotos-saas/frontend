import { Component, inject, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { NgClass } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { MobileNavOverlayComponent } from '../../core/layout/components/mobile-nav-overlay/mobile-nav-overlay.component';
import { TopBarComponent } from '../../core/layout/components/top-bar/top-bar.component';
import { MenuItem } from '../../core/layout/models/menu-item.model';
import { SubscriptionService, SubscriptionInfo } from './services/subscription.service';
import { BrandingService } from './services/branding.service';
import { ICONS, getSubscriptionStatusLabel } from '../../shared/constants';
import { HelpFabComponent } from '../help/components/help-fab/help-fab.component';
import { ChatbotPanelComponent } from '../help/components/chatbot-panel/chatbot-panel.component';


/** Role badge nevek */
const ROLE_BADGES: Record<string, string> = {
  partner: 'Partner',
  designer: 'Grafikus',
  marketer: 'Marketinges',
  printer: 'Nyomdász',
  assistant: 'Ügyintéző',
};

/** Csapattag role-ok (nem partner tulajdonos) */
const TEAM_MEMBER_ROLES = ['designer', 'marketer', 'printer', 'assistant'];

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
  ],
  templateUrl: './partner-shell.component.html',
  styleUrl: './partner-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerShellComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private authService = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);
  protected readonly brandingService = inject(BrandingService);
  private router = inject(Router);
  protected sidebarState = inject(SidebarStateService);
  protected readonly ICONS = ICONS;
  protected chatOpen = signal(false);

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

  // User role info - azonnal inicializálva a computed-ok miatt
  private userRoles = signal<string[]>(this.authService.getCurrentUser()?.roles ?? []);
  partnerName = signal<string>(''); // Főnök neve csapattagok számára

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
          { id: 'schools', route: `${base}/projects/schools`, label: 'Iskolák' },
          { id: 'teachers', route: `${base}/projects/teachers`, label: 'Tanárok' },
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

    if (this.isOwner()) {
      return allItems;
    }

    // Csapattagok: nincs Csapatom, nincs Testreszabás, nincs Előfizetésem (de van Fiók törlése + Beállítások)
    return allItems
      .filter(item => !['team', 'customization', 'subscription', 'partner-settings'].includes(item.id))
      .concat([
        { id: 'settings', route: `${base}/projects/settings`, label: 'Beállítások', icon: 'settings' },
        { id: 'account-delete', route: `${base}/account`, label: 'Fiók törlése', icon: 'user-x' },
      ]);
  });

  /** Hibajelentés link - sidebar aljára rögzítve */
  bugReportLink = computed(() => `${this.baseUrl()}/bugs`);

  // Kibontott szekciók
  expandedSections = signal<Set<string>>(new Set(['projects', 'subscription', 'customization', 'partner-settings', 'webshop']));

  toggleSection(sectionId: string): void {
    const current = this.expandedSections();
    const updated = new Set(current);
    if (updated.has(sectionId)) {
      updated.delete(sectionId);
    } else {
      updated.add(sectionId);
    }
    this.expandedSections.set(updated);
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections().has(sectionId);
  }

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
    this.loadSubscriptionInfo();
    this.loadBranding();
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

  logout(): void {
    this.sidebarState.close();
    this.authService.logoutPartner();
  }
}
