import { Component, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { MobileNavOverlayComponent } from '../../core/layout/components/mobile-nav-overlay/mobile-nav-overlay.component';
import { TopBarComponent } from '../../core/layout/components/top-bar/top-bar.component';
import { MenuItem } from '../../core/layout/models/menu-item.model';
import { HelpFabComponent } from '../help/components/help-fab/help-fab.component';
import { ChatbotPanelComponent } from '../help/components/chatbot-panel/chatbot-panel.component';

/**
 * Marketer Shell - Layout komponens a marketinges felülethez.
 * Saját TopBar és Sidebar menüvel.
 * - Desktop (1024px+): 240px sidebar, teljes menü
 * - Tablet (768-1023px): 60px sidebar, csak ikonok + tooltip
 * - Mobile (< 768px): közös MobileNavOverlayComponent
 */
@Component({
  selector: 'app-marketer-shell',
  standalone: true,
  imports: [RouterModule, RouterLink, RouterLinkActive, NgClass, LucideAngularModule, MobileNavOverlayComponent, TopBarComponent, HelpFabComponent, ChatbotPanelComponent],
  template: `
    <div class="marketer-layout">
      <!-- Top Bar (közös komponens) -->
      <app-top-bar
        position="sticky"
        logoIcon="📊"
        roleBadge="Marketinges"
        [showNotifications]="false"
        [showPokeBadge]="false"
        [showUserBadges]="false"
        [showAccountSwitch]="false"
        [showPartnerSwitcher]="hasMultiplePartners()"
        [currentPartnerId]="currentPartnerId()"
        userInfoMode="inline"
        [externalUserInfo]="userInfo()"
        homeRoute="/marketer/dashboard"
        [useExternalLogout]="true"
        (logoutEvent)="logout()"
      />

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

          <!-- Spacer -->
          <div class="sidebar-spacer"></div>

          <!-- Hibajelentés - sidebar aljára rögzítve -->
          <div class="sidebar-bottom">
            <a
              routerLink="/marketer/bugs"
              routerLinkActive="active"
              class="nav-item nav-item--bottom"
              [title]="sidebarState.isTablet() ? 'Hibajelentés' : ''"
            >
              <lucide-icon name="bug" [size]="20" class="nav-icon"></lucide-icon>
              <span class="nav-label">Hibajelentés</span>
            </a>
          </div>
        </nav>

        <!-- Mobile Overlay (közös komponens) -->
        <app-mobile-nav-overlay
          [customMenuItems]="mobileMenuItems()"
          [userInfo]="{ name: userName(), email: userEmail() }"
          [showPartnerSwitcher]="hasMultiplePartners()"
          [currentPartnerId]="currentPartnerId()"
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

    <!-- Help rendszer (page-card KÍVÜL!) -->
    @if (!chatOpen()) {
      <app-help-fab (toggleChat)="chatOpen.set(true)" />
    }
    <app-chatbot-panel [isOpen]="chatOpen()" (closePanel)="chatOpen.set(false)" />
  `,
  styles: [`
    .marketer-layout {
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

    /* Custom scrollbar for dark sidebar */
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

    /* ============ Sidebar Bottom ============ */
    .sidebar-spacer {
      flex: 1;
    }

    .sidebar-bottom {
      border-top: 1px solid var(--shell-sidebar-border);
      padding-top: 8px;
      margin-top: 8px;
    }

    .nav-item--bottom {
      opacity: 0.75;
      font-size: 0.8125rem;
    }

    .nav-item--bottom:hover,
    .nav-item--bottom.active {
      opacity: 1;
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
      .sidebar {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketerShellComponent {
  private authService = inject(AuthService);
  protected sidebarState = inject(SidebarStateService);
  protected chatOpen = signal(false);

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

  // Menü items (Lucide ikonokkal - desktop, tablet és mobile egyaránt)
  navItems: MenuItem[] = [
    { id: 'dashboard', route: '/marketer/dashboard', label: 'Irányítópult', icon: 'home' },
    { id: 'projects', route: '/marketer/projects', label: 'Projektek', icon: 'folder-open' },
    { id: 'schools', route: '/marketer/schools', label: 'Iskolák', icon: 'graduation-cap' },
  ];

  // Mobile menü items (desktop + hibajelentés)
  mobileMenuItems = computed<MenuItem[]>(() => [
    ...this.navItems,
    { id: 'bugs', route: '/marketer/bugs', label: 'Hibajelentés', icon: 'bug' },
  ]);

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

  logout(): void {
    this.sidebarState.close();
    this.authService.logoutMarketer();
  }
}
