import { Component, inject, signal, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { BugReportService } from '../../shared/services/bug-report.service';
import { MobileNavOverlayComponent } from '../../core/layout/components/mobile-nav-overlay/mobile-nav-overlay.component';
import { TopBarComponent } from '../../core/layout/components/top-bar/top-bar.component';
import { MenuItem } from '../../core/layout/models/menu-item.model';

/**
 * Super Admin Shell - Layout komponens a super admin felülethez.
 * Saját TopBar és Sidebar menüvel.
 * - Desktop (1024px+): 240px sidebar, teljes menü
 * - Tablet (768-1023px): 60px sidebar, csak ikonok + tooltip
 * - Mobile (< 768px): közös MobileNavOverlayComponent
 */
@Component({
  selector: 'app-super-admin-shell',
  standalone: true,
  imports: [RouterModule, RouterLink, RouterLinkActive, NgClass, LucideAngularModule, MobileNavOverlayComponent, TopBarComponent],
  template: `
    <div class="super-admin-layout">
      <!-- Top Bar (közös komponens) -->
      <app-top-bar
        position="sticky"
        logoIcon=""
        roleBadge="Super Admin"
        [showNotifications]="false"
        [showPokeBadge]="false"
        [showUserBadges]="false"
        [showAccountSwitch]="false"
        userInfoMode="inline"
        [externalUserInfo]="userInfo()"
        homeRoute="/super-admin/dashboard"
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

          <!-- Hibajelentések - sidebar aljára rögzítve -->
          <div class="sidebar-bottom">
            <a
              routerLink="/super-admin/bugs"
              routerLinkActive="active"
              class="nav-item nav-item--bottom"
              [title]="sidebarState.isTablet() ? 'Hibajelentések' : ''"
            >
              <lucide-icon name="bug" [size]="20" class="nav-icon"></lucide-icon>
              <span class="nav-label">Hibajelentések</span>
              @if (bugReportService.hasUnread()) {
                <span class="nav-badge">{{ bugReportService.unreadCount() }}</span>
              }
            </a>
          </div>
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
    .super-admin-layout {
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

    /* ============ Sidebar Bottom ============ */
    .sidebar-spacer {
      flex: 1;
    }

    .sidebar-bottom {
      border-top: 1px solid var(--shell-sidebar-border);
      padding-top: 8px;
      margin-top: 8px;
    }

    .sidebar-bottom .nav-item--bottom {
      opacity: 0.75;
      font-size: 0.8125rem;
      position: relative;
    }

    .sidebar-bottom .nav-item--bottom:hover,
    .sidebar-bottom .nav-item--bottom.active {
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

    /* ============ Badge ============ */
    .nav-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: #dc2626;
      color: #ffffff;
      border-radius: 9px;
      font-size: 0.6875rem;
      font-weight: 700;
      margin-left: auto;
    }

    .sidebar--collapsed .nav-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 8px;
      height: 8px;
      padding: 0;
      font-size: 0;
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
export class SuperAdminShellComponent implements OnInit {
  private authService = inject(AuthService);
  protected sidebarState = inject(SidebarStateService);

  readonly bugReportService = inject(BugReportService);

  // Menü items (Lucide ikonokkal - desktop, tablet és mobile egyaránt)
  navItems: MenuItem[] = [
    { id: 'dashboard', route: '/super-admin/dashboard', label: 'Irányítópult', icon: 'home' },
    { id: 'subscribers', route: '/super-admin/subscribers', label: 'Előfizetők', icon: 'credit-card' },
    { id: 'settings', route: '/super-admin/settings', label: 'Beállítások', icon: 'settings' },
  ];

  // Mobile menü items (ugyanazok mint desktop, de computed-ként a MobileNavOverlay-hez)
  // Mobile menü items (desktop + hibajelentések)
  mobileMenuItems = computed<MenuItem[]>(() => [
    ...this.navItems,
    { id: 'bugs', route: '/super-admin/bugs', label: 'Hibajelentések', icon: 'bug' },
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

  ngOnInit(): void {
    this.bugReportService.fetchUnreadCount();
  }

  logout(): void {
    this.sidebarState.close();
    this.authService.logoutSuperAdmin();
  }
}
