import { Component, inject, signal, ChangeDetectionStrategy, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
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
  imports: [RouterModule, RouterLink, RouterLinkActive, NgClass, LucideAngularModule, MobileNavOverlayComponent, TopBarComponent, ClientRegisterDialogComponent],
  templateUrl: './client-shell.component.html',
  styleUrls: ['./client-shell.component.scss'],
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

  /** Partner branding */
  readonly brandName = computed(() => this.clientService.branding()?.brandName ?? null);
  readonly brandLogoUrl = computed(() => this.clientService.branding()?.logoUrl ?? null);

  /** User info a TopBar inline megjelenítéséhez */
  readonly userInfo = computed(() => ({
    name: this.clientName(),
    email: this.clientService.isRegistered() ? this.clientEmail() : undefined
  }));

  ngOnInit(): void {
    // Profile lekérése a canRegister flag frissítéséhez
    this.clientService.getProfile().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
    // Albumok lekérése a hasDownloadableAlbum flag frissítéséhez
    this.clientService.getAlbums().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
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
