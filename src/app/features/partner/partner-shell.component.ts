import { Component, inject, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { MobileNavOverlayComponent } from '../../core/layout/components/mobile-nav-overlay/mobile-nav-overlay.component';
import { TopBarComponent } from '../../core/layout/components/top-bar/top-bar.component';
import { MenuItem } from '../../core/layout/models/menu-item.model';
import { SubscriptionService, SubscriptionInfo } from './services/subscription.service';
import { ICONS, getSubscriptionStatusLabel } from '../../shared/constants';

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
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    NgClass,
    LucideAngularModule,
    MatTooltipModule,
    MobileNavOverlayComponent,
    TopBarComponent
  ],
  template: `
    <div class="partner-layout">
      <!-- Top Bar (közös komponens) -->
      <app-top-bar
        position="sticky"
        logoIcon="📷"
        roleBadge="Partner"
        [showNotifications]="false"
        [showPokeBadge]="false"
        [showUserBadges]="false"
        [showAccountSwitch]="false"
        userInfoMode="inline"
        [externalUserInfo]="userInfo()"
        homeRoute="/partner/dashboard"
        [useExternalLogout]="true"
        (logoutEvent)="logout()"
      >
        <!-- Subscription badge slot -->
        @if (subscriptionInfo()) {
          <a
            routerLink="/partner/subscription"
            class="subscription-badge"
            [matTooltip]="getSubscriptionTooltip()"
          >
            <span class="plan-badge" [ngClass]="'plan-badge--' + subscriptionInfo()!.plan">
              {{ subscriptionInfo()!.plan_name }}
            </span>
            @if (subscriptionInfo()!.is_modified) {
              <span class="modified-indicator" matTooltip="Módosított csomag">
                <lucide-icon [name]="ICONS.PLUS_CIRCLE" [size]="14" />
              </span>
            }
            <span
              class="status-dot"
              [ngClass]="'status-dot--' + subscriptionInfo()!.status"
              [matTooltip]="getStatusLabel(subscriptionInfo()!.status)"
            ></span>
          </a>
        }
      </app-top-bar>

      <!-- Content with Sidebar -->
      <div class="main-container">
        <!-- Desktop/Tablet Sidebar -->
        <nav
          class="sidebar"
          [ngClass]="{
            'sidebar--collapsed': sidebarState.isTablet(),
            'sidebar--hidden': sidebarState.isMobile()
          }"
        >
          @for (item of navItems; track item.id) {
            @if (item.children && item.children.length > 0) {
              <!-- Szekció gyermek elemekkel -->
              <div class="nav-section">
                <button
                  class="nav-item nav-item--section"
                  [class.expanded]="isSectionExpanded(item.id)"
                  [title]="sidebarState.isTablet() ? item.label : ''"
                  (click)="toggleSection(item.id)"
                >
                  <lucide-icon [name]="item.icon!" [size]="20" class="nav-icon"></lucide-icon>
                  <span class="nav-label">{{ item.label }}</span>
                  <lucide-icon
                    [name]="isSectionExpanded(item.id) ? 'chevron-up' : 'chevron-down'"
                    [size]="16"
                    class="nav-chevron"
                  ></lucide-icon>
                </button>
                @if (isSectionExpanded(item.id) && !sidebarState.isTablet()) {
                  <div class="nav-children">
                    @for (child of item.children; track child.id) {
                      <a
                        [routerLink]="child.route"
                        routerLinkActive="active"
                        class="nav-child"
                      >
                        {{ child.label }}
                      </a>
                    }
                  </div>
                }
              </div>
            } @else {
              <!-- Egyszerű menüpont -->
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-item"
                [title]="sidebarState.isTablet() ? item.label : ''"
              >
                <lucide-icon [name]="item.icon!" [size]="20" class="nav-icon"></lucide-icon>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            }
          }
        </nav>

        <!-- Mobile Overlay (közös komponens) -->
        <app-mobile-nav-overlay
          [customMenuItems]="mobileMenuItems()"
          [userInfo]="{ name: userName(), email: userEmail() }"
          (logoutEvent)="logout()"
        />

        <!-- Main Content -->
        <main
          class="content"
          [ngClass]="{
            'content--full': sidebarState.isMobile(),
            'content--with-collapsed': sidebarState.isTablet() && !sidebarState.isMobile()
          }"
        >
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .partner-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    /* ============ Main Container ============ */
    .main-container {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    /* ============ Subscription Badge ============ */
    .subscription-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      text-decoration: none;
      transition: background 0.2s ease;
      margin-right: 8px;
    }

    .subscription-badge:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .plan-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .plan-badge--alap {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
    }

    .plan-badge--iskola {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .plan-badge--studio {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-dot--active {
      background: #22c55e;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
    }

    .status-dot--trial {
      background: #3b82f6;
      box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);
    }

    .status-dot--paused {
      background: #f59e0b;
      box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
    }

    .status-dot--canceling {
      background: #ef4444;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
    }

    .status-dot--canceled {
      background: #6b7280;
    }

    .status-dot--pending {
      background: #9ca3af;
    }

    .modified-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #22c55e;
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    /* ============ Desktop/Tablet Sidebar ============ */
    .sidebar {
      width: var(--shell-sidebar-width);
      background: var(--shell-sidebar-bg);
      border-right: 1px solid var(--shell-sidebar-border);
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease;
      flex-shrink: 0;
    }

    .sidebar--collapsed {
      width: var(--shell-sidebar-width-collapsed);
      padding: 12px 0;
    }

    .sidebar--hidden {
      display: none;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 8px 4px 8px;
      padding: 10px 12px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--shell-nav-item-color);
      font-weight: 500;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      white-space: nowrap;
      overflow: hidden;
    }

    .nav-item:hover {
      background: var(--shell-nav-item-hover-bg);
      color: var(--shell-nav-item-hover-color);
    }

    .nav-item.active {
      background: var(--shell-nav-item-active-bg);
      color: var(--shell-nav-item-active-color);
      border-left: 2px solid var(--shell-nav-item-active-border);
    }

    /* ============ Section with children ============ */
    .nav-section {
      margin-bottom: 4px;
    }

    .nav-item--section {
      width: calc(100% - 16px);
      border: none;
      background: transparent;
      cursor: pointer;
      justify-content: flex-start;
    }

    .nav-item--section .nav-chevron {
      margin-left: auto;
      opacity: 0.6;
      transition: transform 0.2s ease;
    }

    .nav-item--section.expanded .nav-chevron {
      transform: rotate(180deg);
    }

    .nav-children {
      margin-left: 20px;
      padding-left: 12px;
      border-left: 1px solid var(--shell-sidebar-border);
    }

    .nav-child {
      display: block;
      padding: 8px 12px;
      margin: 2px 8px 2px 0;
      border-radius: 6px;
      text-decoration: none;
      color: var(--shell-nav-item-color);
      font-size: 0.8125rem;
      transition: all 0.2s ease;
    }

    .nav-child:hover {
      background: var(--shell-nav-item-hover-bg);
      color: var(--shell-nav-item-hover-color);
    }

    .nav-child.active {
      background: var(--shell-nav-item-active-bg);
      color: var(--shell-nav-item-active-color);
      font-weight: 500;
    }

    .sidebar--collapsed .nav-item--section .nav-chevron,
    .sidebar--collapsed .nav-item--section .nav-label {
      display: none;
    }

    .sidebar--collapsed .nav-children {
      display: none;
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .nav-label {
      opacity: 1;
      transition: opacity 0.2s ease;
    }

    .sidebar--collapsed .nav-item {
      justify-content: center;
      padding: 12px;
      margin: 0 8px 4px 8px;
    }

    .sidebar--collapsed .nav-label {
      display: none;
    }

    .sidebar--collapsed .nav-icon {
      width: auto;
    }

    /* Custom scrollbar for sidebar */
    .sidebar {
      scrollbar-width: thin;
      scrollbar-color: rgba(100, 116, 139, 0.5) transparent;
    }

    .sidebar::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar::-webkit-scrollbar-thumb {
      background-color: rgba(100, 116, 139, 0.5);
      border-radius: 3px;
    }

    /* ============ Content Area ============ */
    .content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      max-height: calc(100vh - 64px);
      margin-left: 0;
    }

    .content--full {
      max-height: calc(100vh - 56px);
      padding: 16px;
    }

    .content--with-collapsed {
      /* Tablet: collapsed sidebar mellett */
    }

    /* ============ Reduced Motion ============ */
    @media (prefers-reduced-motion: reduce) {
      .nav-item,
      .sidebar,
      .subscription-badge {
        transition: none;
      }
    }

    /* ============ Mobile ============ */
    @media (max-width: 767px) {
      .subscription-badge {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerShellComponent implements OnInit {
  private authService = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);
  protected sidebarState = inject(SidebarStateService);
  protected readonly ICONS = ICONS;

  // Subscription info
  subscriptionInfo = signal<SubscriptionInfo | null>(null);

  // Menü items (Lucide ikonokkal - desktop, tablet és mobile egyaránt)
  navItems: MenuItem[] = [
    { id: 'dashboard', route: '/partner/dashboard', label: 'Irányítópult', icon: 'home' },
    { id: 'projects', route: '/partner/projects', label: 'Projektek', icon: 'folder-open' },
    { id: 'schools', route: '/partner/schools', label: 'Iskolák', icon: 'school' },
    { id: 'contacts', route: '/partner/contacts', label: 'Kapcsolatok', icon: 'users' },
    { id: 'team', route: '/partner/team', label: 'Csapatom', icon: 'user-plus' },
    { id: 'orders', route: '/partner/orders/clients', label: 'Megrendelések', icon: 'shopping-bag' },
    {
      id: 'subscription',
      label: 'Előfizetésem',
      icon: 'credit-card',
      children: [
        { id: 'subscription-overview', route: '/partner/subscription/overview', label: 'Előfizetés' },
        { id: 'subscription-invoices', route: '/partner/subscription/invoices', label: 'Számlák' },
        { id: 'subscription-addons', route: '/partner/subscription/addons', label: 'Kiegészítők' },
        { id: 'subscription-account', route: '/partner/subscription/account', label: 'Fiók törlése' },
      ]
    },
  ];

  // Kibontott szekciók
  expandedSections = signal<Set<string>>(new Set(['subscription']));

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

  // Mobile menü items (ugyanazok mint desktop, de computed-ként a MobileNavOverlay-hez)
  mobileMenuItems = computed<MenuItem[]>(() => this.navItems);

  userName = signal<string>('');
  userEmail = signal<string>('');

  /** User info a TopBar inline megjelenítéséhez */
  userInfo = computed(() => ({
    name: this.userName(),
    email: this.userEmail() || undefined
  }));

  constructor() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName.set(user.name);
      this.userEmail.set(user.email ?? '');
    }
  }

  ngOnInit(): void {
    this.loadSubscriptionInfo();
  }

  private loadSubscriptionInfo(): void {
    this.subscriptionService.getSubscription().subscribe({
      next: (info) => this.subscriptionInfo.set(info),
      error: (err) => console.error('Failed to load subscription info:', err)
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
