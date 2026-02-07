import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  computed,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MobileNavOverlayComponent } from '../mobile-nav-overlay/mobile-nav-overlay.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { FloatingContactComponent } from '../../../../shared/components/floating-contact/floating-contact.component';
import {
  PhotoSelectionReminderDialogComponent,
  PhotoSelectionReminderResult,
} from '../../../../shared/components/photo-selection-reminder-dialog/photo-selection-reminder-dialog.component';
import {
  PasswordSetDialogComponent,
  PasswordSetResult,
} from '../../../../shared/components/password-set-dialog/password-set-dialog.component';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { SidebarRouteService } from '../../services/sidebar-route.service';
import { AuthService } from '../../../services/auth.service';
import { GuestService } from '../../../services/guest.service';
import { ToastService } from '../../../services/toast.service';
import { AppShellService } from './app-shell.service';

/**
 * App Shell Component
 *
 * Fő layout wrapper:
 * - TopBar (logo + partner info + actions)
 * - Sidebar (desktop/tablet)
 * - MobileNavOverlay (mobile)
 * - Main content (router-outlet)
 * - Footer
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    TopBarComponent,
    SidebarComponent,
    MobileNavOverlayComponent,
    FooterComponent,
    FloatingContactComponent,
    PhotoSelectionReminderDialogComponent,
    PasswordSetDialogComponent,
  ],
  providers: [AppShellService],
  templateUrl: './app-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit, OnDestroy {
  private readonly sidebarState = inject(SidebarStateService);
  private readonly sidebarRouteService = inject(SidebarRouteService);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly shellService = inject(AppShellService);

  /** Photo selection reminder dialog - service-ből delegálva */
  readonly showPhotoSelectionReminderDialog = this.shellService.showReminderDialog;

  /** Aktuális képválasztás lépés (dialógushoz) */
  readonly currentPhotoSelectionStep = this.shellService.currentStep;

  /**
   * Password set dialog láthatósága
   * Megjelenik ha a user be van jelentkezve és nincs beállítva jelszó
   */
  readonly showPasswordSetDialog = computed(() => {
    const project = this.authService.getProject();
    const passwordSet = this.authService.passwordSet();
    return project !== null && !passwordSet;
  });

  /** Partner branding neve (ha aktív) */
  readonly brandName = computed(() => this.authService.projectSignal()?.branding?.brandName ?? null);

  /** Partner branding logó URL (ha aktív) */
  readonly brandLogoUrl = computed(() => this.authService.projectSignal()?.branding?.logoUrl ?? null);

  /**
   * Mobil menü user info (kapcsolattartó/vendég neve és email)
   */
  readonly mobileUserInfo = computed(() => {
    const project = this.authService.getProject();
    if (!project) return undefined;

    if (project.contacts && project.contacts.length > 0) {
      const contact = project.contacts[0];
      return {
        name: contact.name || 'Kapcsolattartó',
        email: contact.email ?? undefined,
      };
    }

    if (this.authService.isGuest()) {
      const guestName = this.guestService.guestName();
      return { name: guestName || 'Vendég', email: undefined };
    }

    return undefined;
  });

  ngOnInit(): void {
    this.sidebarRouteService.syncWithCurrentRoute();

    // Üzleti logika delegálása a service-nek
    this.shellService.initPhotoSelectionWatchers(this.cdr);
    this.shellService.initSessionInvalidationWatcher();
    this.shellService.startSessionPollingIfNeeded();
    this.shellService.initWebSocketAndNotifications();
  }

  ngOnDestroy(): void {
    this.shellService.cleanup();
  }

  /** Password set dialógus eredmény kezelése */
  onPasswordSet(result: PasswordSetResult): void {
    if (result.action === 'success') {
      this.toastService.success('Siker', 'Jelszó sikeresen beállítva!');
      this.cdr.markForCheck();
    }
  }

  /** Photo selection reminder dialógus eredmény kezelése */
  onPhotoSelectionReminderResult(result: PhotoSelectionReminderResult): void {
    this.shellService.handleReminderResult(result, this.cdr);
  }

  /** Kijelentkezés kezelése (mobil menüből) */
  onLogout(): void {
    this.sidebarState.close();
    this.authService.logout();
  }
}
