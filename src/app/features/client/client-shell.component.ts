import { Component, inject, signal, ChangeDetectionStrategy, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ClientService } from './services/client.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { MobileNavOverlayComponent } from '../../core/layout/components/mobile-nav-overlay/mobile-nav-overlay.component';
import { TopBarComponent } from '../../core/layout/components/top-bar/top-bar.component';
import { ClientRegisterDialogComponent, ClientRegisterResult } from './components/client-register-dialog/client-register-dialog.component';
import { MenuItem } from '../../core/layout/models/menu-item.model';
import { ICONS } from '../../shared/constants/icons.constants';

/**
 * Client Shell - Layout komponens a partner ügyfél felülethez.
 * Saját TopBar és egyszerű Sidebar menüvel.
 * - Desktop (1024px+): 240px sidebar, teljes menü
 * - Tablet (768-1023px): 60px sidebar, csak ikonok + tooltip
 * - Mobile (< 768px): közös MobileNavOverlayComponent
 */
@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, NgClass, LucideAngularModule, MobileNavOverlayComponent, TopBarComponent, ClientRegisterDialogComponent],
  template: `
    <div class="client-layout">
      <!-- Top Bar (közös komponens) -->
      <app-top-bar
        position="sticky"
        logoIcon="📸"
        roleBadge="Ügyfél"
        [showNotifications]="false"
        [showPokeBadge]="false"
        [showUserBadges]="false"
        [showAccountSwitch]="false"
        userInfoMode="inline"
        [externalUserInfo]="userInfo()"
        homeRoute="/client/albums"
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
          @for (item of dynamicNavItems(); track item.id) {
            @if (item.action) {
              <button
                class="nav-item nav-item--action"
                [title]="sidebarState.isTablet() ? item.label : ''"
                (click)="handleNavAction(item.action)"
              >
                <lucide-icon [name]="item.icon!" [size]="20" class="nav-icon"></lucide-icon>
                <span class="nav-label">{{ item.label }}</span>
              </button>
            } @else {
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

          <!-- Kijelentkezés (sidebar alján) -->
          <div class="sidebar-spacer"></div>
          <button
            (click)="logout()"
            class="nav-item nav-item--logout"
            [title]="sidebarState.isTablet() ? 'Kijelentkezés' : ''"
          >
            <lucide-icon [name]="ICONS.LOGOUT" [size]="20" class="nav-icon"></lucide-icon>
            <span class="nav-label">Kijelentkezés</span>
          </button>
        </nav>

        <!-- Mobile Overlay (közös komponens) -->
        <app-mobile-nav-overlay
          [customMenuItems]="mobileMenuItems()"
          [userInfo]="{ name: clientName(), email: '' }"
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

    <!-- Register Dialog -->
    @if (showRegisterDialog()) {
      <app-client-register-dialog
        [initialEmail]="clientEmail()"
        [hasDownloadableAlbum]="hasDownloadableAlbum()"
        (resultEvent)="onRegisterResult($event)"
      />
    }
  `,
  styles: [`
    .client-layout {
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

    .sidebar-spacer {
      flex: 1;
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
      border: none;
      background: transparent;
      cursor: pointer;
      width: calc(100% - 16px);
      text-align: left;
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

    .nav-item--logout {
      color: #dc2626;
      margin-top: 8px;
    }

    .nav-item--logout:hover {
      background: rgba(220, 38, 38, 0.1);
      color: #b91c1c;
    }

    .nav-item--action {
      background: rgba(59, 130, 246, 0.08);
      border: 1px dashed rgba(59, 130, 246, 0.3);
    }

    .nav-item--action:hover {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.5);
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
      .sidebar {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientShellComponent implements OnInit {
  private clientService = inject(ClientService);
  private destroyRef = inject(DestroyRef);
  protected sidebarState = inject(SidebarStateService);
  protected readonly ICONS = ICONS;

  // Base navigation items
  private readonly baseNavItems: MenuItem[] = [
    { id: 'welcome', route: '/client/welcome', label: 'Kezdőlap', icon: 'home' },
    { id: 'albums', route: '/client/albums', label: 'Albumjaim', icon: 'images' },
  ];

  // State
  readonly showRegisterDialog = signal(false);

  // Computed: dynamic nav items based on registration status
  readonly dynamicNavItems = computed<(MenuItem & { action?: string })[]>(() => {
    const items: (MenuItem & { action?: string })[] = [...this.baseNavItems];

    // Ha regisztrált, mutassuk a beállításokat
    if (this.clientService.isRegistered()) {
      items.push({ id: 'settings', route: '/client/settings', label: 'Beállítások', icon: 'settings' });
    }
    // Ha NEM regisztrált, de regisztrálhat, mutassunk regisztráció gombot
    else if (this.clientService.canRegister()) {
      items.push({
        id: 'register',
        route: '',
        label: 'Regisztráció',
        icon: 'user-plus',
        action: 'openRegister'
      });
    }

    return items;
  });

  // Mobile menü items
  readonly mobileMenuItems = computed<MenuItem[]>(() =>
    this.dynamicNavItems().filter(i => !i.action)
  );

  readonly clientName = this.clientService.clientName;
  readonly clientEmail = this.clientService.clientEmail;
  readonly hasDownloadableAlbum = this.clientService.hasDownloadableAlbum;

  /** User info a TopBar inline megjelenítéséhez */
  readonly userInfo = computed(() => ({
    name: this.clientName(),
    email: this.clientService.isRegistered() ? this.clientEmail() : undefined
  }));

  ngOnInit(): void {
    // Profile lekérése a canRegister flag frissítéséhez
    this.clientService.getProfile().subscribe();
    // Albumok lekérése a hasDownloadableAlbum flag frissítéséhez
    this.clientService.getAlbums().subscribe();
  }

  handleNavAction(action: string): void {
    switch (action) {
      case 'openRegister':
        this.showRegisterDialog.set(true);
        break;
    }
  }

  onRegisterResult(result: ClientRegisterResult): void {
    this.showRegisterDialog.set(false);
    // Ha sikeres, a ClientService már frissítette az állapotot
  }

  logout(): void {
    this.sidebarState.close();
    this.clientService.logout();
  }
}
