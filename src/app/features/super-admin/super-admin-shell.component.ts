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
import { HelpFabComponent } from '../help/components/help-fab/help-fab.component';
import { ChatbotPanelComponent } from '../help/components/chatbot-panel/chatbot-panel.component';

/**
 * Super Admin Shell - Layout komponens a super admin felulEthez.
 * Sajat TopBar es Sidebar menuvel.
 * - Desktop (1024px+): 240px sidebar, teljes menu
 * - Tablet (768-1023px): 60px sidebar, csak ikonok + tooltip
 * - Mobile (< 768px): kozos MobileNavOverlayComponent
 */
@Component({
  selector: 'app-super-admin-shell',
  standalone: true,
  imports: [RouterModule, RouterLink, RouterLinkActive, NgClass, LucideAngularModule, MobileNavOverlayComponent, TopBarComponent, HelpFabComponent, ChatbotPanelComponent],
  templateUrl: './super-admin-shell.component.html',
  styleUrls: ['./super-admin-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperAdminShellComponent implements OnInit {
  private authService = inject(AuthService);
  protected sidebarState = inject(SidebarStateService);
  protected chatOpen = signal(false);

  readonly bugReportService = inject(BugReportService);

  // Menu items (Lucide ikonokkal - desktop, tablet es mobile egyarant)
  navItems: MenuItem[] = [
    { id: 'dashboard', route: '/super-admin/dashboard', label: 'Irányítópult', icon: 'home' },
    { id: 'subscribers', route: '/super-admin/subscribers', label: 'Előfizetők', icon: 'credit-card' },
    { id: 'settings', route: '/super-admin/settings', label: 'Beállítások', icon: 'settings' },
  ];

  // Mobile menu items (desktop + hibajelentesek)
  mobileMenuItems = computed<MenuItem[]>(() => [
    ...this.navItems,
    { id: 'bugs', route: '/super-admin/bugs', label: 'Hibajelentések', icon: 'bug' },
  ]);

  userName = signal<string>('');
  userEmail = signal<string>('');

  /** User info a TopBar inline megjeleniteshez */
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
