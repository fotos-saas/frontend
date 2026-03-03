import { Component, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { MobileNavOverlayComponent } from '../../core/layout/components/mobile-nav-overlay/mobile-nav-overlay.component';
import { TopBarComponent } from '../../core/layout/components/top-bar/top-bar.component';
import { MenuItem } from '../../core/layout/models/menu-item.model';

/**
 * Print Shop Shell - Layout komponens a nyomdai felülethez.
 * Saját TopBar és Sidebar menüvel.
 */
@Component({
  selector: 'app-print-shop-shell',
  standalone: true,
  imports: [RouterModule, RouterLink, RouterLinkActive, NgClass, LucideAngularModule, MobileNavOverlayComponent, TopBarComponent],
  templateUrl: './print-shop-shell.component.html',
  styleUrls: ['./print-shop-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintShopShellComponent {
  private authService = inject(AuthService);
  protected sidebarState = inject(SidebarStateService);

  navItems: MenuItem[] = [
    { id: 'dashboard', route: '/print-shop/dashboard', label: 'Vezérlőpult', icon: 'home' },
    { id: 'projects', route: '/print-shop/projects', label: 'Projektek', icon: 'folder-open' },
  ];

  mobileMenuItems = computed<MenuItem[]>(() => [...this.navItems]);

  userName = signal<string>('');
  userEmail = signal<string>('');

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
