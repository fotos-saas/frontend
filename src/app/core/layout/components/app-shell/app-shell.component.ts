import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  DestroyRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
  computed
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, distinctUntilChanged, map, skip } from 'rxjs/operators';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MobileNavOverlayComponent } from '../mobile-nav-overlay/mobile-nav-overlay.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { FloatingContactComponent } from '../../../../shared/components/floating-contact/floating-contact.component';
import { PhotoSelectionReminderDialogComponent, PhotoSelectionReminderResult } from '../../../../shared/components/photo-selection-reminder-dialog/photo-selection-reminder-dialog.component';
import { PasswordSetDialogComponent, PasswordSetResult } from '../../../../shared/components/password-set-dialog/password-set-dialog.component';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { SidebarRouteService } from '../../services/sidebar-route.service';
import { AuthService, TabloProject } from '../../../services/auth.service';
import { GuestService } from '../../../services/guest.service';
import { ToastService } from '../../../services/toast.service';
import { WebsocketService } from '../../../services/websocket.service';
import { NotificationService } from '../../../services/notification.service';
import { LoggerService } from '../../../services/logger.service';
import { PhotoSelectionReminderService, ReminderWorkflowStep } from '../../../services/photo-selection-reminder.service';

/**
 * App Shell Component
 *
 * Fő layout wrapper:
 * - TopBar (logo + partner info + actions)
 * - Sidebar (desktop/tablet)
 * - MobileNavOverlay (mobile)
 * - Main content (router-outlet)
 * - Footer
 *
 * Struktúra:
 * ```
 * +------------------------------------------+
 * |              TopBar (fixed)              |
 * +----------+-------------------------------+
 * |          |                               |
 * | Sidebar  |        Main Content           |
 * | (fixed)  |       (router-outlet)         |
 * |          |                               |
 * |          |-------------------------------|
 * |          |           Footer              |
 * +----------+-------------------------------+
 * ```
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
  template: `
    <!-- Skip to main content link (A11y) -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2
             focus:z-50 focus:bg-purple-600 focus:text-white focus:px-4 focus:py-2
             focus:rounded-lg focus:shadow-lg"
    >
      Ugrás a tartalomhoz
    </a>

    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <!-- Top Bar (fixed) -->
      <app-top-bar />

      <!-- Sidebar (desktop/tablet, fixed) -->
      <app-sidebar />

      <!-- Main Content -->
      <main
        id="main-content"
        class="min-h-screen flex flex-col pt-14 md:pt-16 md:ml-[60px] lg:ml-[240px]"
        tabindex="-1"
      >
        <!-- Page content with padding -->
        <div class="flex-1 flex flex-col p-3 md:p-4 lg:p-6">
          <router-outlet />
        </div>

        <!-- Footer -->
        <app-footer />
      </main>

      <!-- Mobile Overlay -->
      <app-mobile-nav-overlay
        [userInfo]="mobileUserInfo()"
        (logoutEvent)="onLogout()"
      />

      <!-- Floating Contact FAB -->
      <app-floating-contact />

      <!-- Photo Selection Reminder Dialog (globális, minden oldalon KIVÉVE /photo-selection) -->
      @if (showPhotoSelectionReminderDialog()) {
        <app-photo-selection-reminder-dialog
          [currentStep]="currentPhotoSelectionStep()"
          (resultEvent)="onPhotoSelectionReminderResult($event)"
        />
      }

      <!-- Password Set Dialog (QR regisztráció után kötelező jelszó beállítás) -->
      @if (showPasswordSetDialog()) {
        <app-password-set-dialog
          (passwordSetEvent)="onPasswordSet($event)"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit, OnDestroy {
  protected readonly sidebarState = inject(SidebarStateService);
  private readonly sidebarRouteService = inject(SidebarRouteService);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly toastService = inject(ToastService);
  private readonly wsService = inject(WebsocketService);
  private readonly notificationService = inject(NotificationService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly photoSelectionReminderService = inject(PhotoSelectionReminderService);

  /** Photo selection reminder dialog láthatósága */
  readonly showPhotoSelectionReminderDialog = signal(false);

  /** Aktuális képválasztás lépés (dialógushoz) */
  readonly currentPhotoSelectionStep = signal<ReminderWorkflowStep>('claiming');

  /** Timeout ID-k cleanup-hoz */
  private projectCheckTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private routeCheckTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Password set dialog láthatósága
   * Megjelenik ha:
   * - A user be van jelentkezve (project van)
   * - A passwordSet flag false (QR regisztráció után)
   */
  readonly showPasswordSetDialog = computed(() => {
    const project = this.authService.getProject();
    const passwordSet = this.authService.passwordSet();

    // Csak akkor jelenjen meg ha van projekt és nincs beállítva jelszó
    return project !== null && !passwordSet;
  });

  /**
   * Mobil menü user info (kapcsolattartó/vendég neve és email)
   */
  readonly mobileUserInfo = computed(() => {
    const project = this.authService.getProject();
    if (!project) return undefined;

    // Kapcsolattartó esetén az első contact adatai
    if (project.contacts && project.contacts.length > 0) {
      const contact = project.contacts[0];
      return {
        name: contact.name || 'Kapcsolattartó',
        email: contact.email ?? undefined
      };
    }

    // Vendég esetén
    if (this.authService.isGuest()) {
      const guestName = this.guestService.guestName();
      return {
        name: guestName || 'Vendég',
        email: undefined
      };
    }

    return undefined;
  });

  ngOnInit(): void {
    // Sync sidebar sections with current route on init
    this.sidebarRouteService.syncWithCurrentRoute();

    // Photo selection reminder - figyeljük a projekt változásokat
    // A validateSession frissíti a projektet minden route váltáskor,
    // ezért a project$ változásra reagálunk (nem a router event-re)
    this.authService.project$.pipe(
      filter(project => !!project),
      // Csak a photo selection progress változásra reagálunk
      map(project => ({
        id: project!.id,
        hasGallery: project!.hasGallery,
        progress: project!.photoSelectionProgress,
        currentStep: project!.photoSelectionCurrentStep,
        finalized: project!.photoSelectionFinalized
      })),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      // Csak ha nem /photo-selection oldalon vagyunk
      if (!this.router.url.startsWith('/photo-selection')) {
        // Kis késleltetés hogy a projekt adatok biztosan frissüljenek
        if (this.projectCheckTimeoutId) clearTimeout(this.projectCheckTimeoutId);
        this.projectCheckTimeoutId = setTimeout(() => this.checkPhotoSelectionReminder(), 100);
      }
    });

    // Photo selection reminder - navigáláskor is ellenőrzés
    // Ha a projekt adatok NEM változtak meg (distinctUntilChanged blokkolja),
    // de route váltás történt, akkor is ellenőrizzük a reminder-t
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      filter(event => !event.url.startsWith('/photo-selection')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      // Kis késleltetés hogy a validateSession befejeződjön a guard-ban
      if (this.routeCheckTimeoutId) clearTimeout(this.routeCheckTimeoutId);
      this.routeCheckTimeoutId = setTimeout(() => this.checkPhotoSelectionReminder(), 150);
    });

    // Session invalidálás kezelése - TELJES kijelentkeztetés
    this.guestService.sessionInvalidated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      if (event.reason === 'banned') {
        this.toastService.error('Hozzáférés megtagadva', event.message, 8000);
      } else {
        this.toastService.info('Munkamenet lejárt', event.message, 5000);
      }
      // Teljes auth törlés (token + session + redirect /login-ra)
      this.authService.clearAuth();
    });

    // Session polling indítása ha van guest session
    if (this.guestService.hasRegisteredSession()) {
      this.guestService.startSessionPolling();
    }

    // WebSocket és értesítési rendszer inicializálása
    this.initializeWebSocketAndNotifications();
  }

  ngOnDestroy(): void {
    // Timeout cleanup
    if (this.projectCheckTimeoutId) clearTimeout(this.projectCheckTimeoutId);
    if (this.routeCheckTimeoutId) clearTimeout(this.routeCheckTimeoutId);

    this.guestService.stopSessionPolling();
    this.cleanupWebSocketAndNotifications();
  }

  /**
   * WebSocket kapcsolat és értesítések inicializálása
   */
  private initializeWebSocketAndNotifications(): void {
    const project = this.authService.getProject();
    const token = this.authService.getToken();

    if (!project || !token) {
      this.logger.warn('[AppShell] No project or token - skipping WebSocket init');
      return;
    }

    // Értesítési csatorna feliratkozás
    // Meghatározzuk a recipient típust és ID-t
    const isGuest = this.authService.isGuest();
    const guestSessionToken = this.guestService.getSessionToken();

    // WebSocket kapcsolat létrehozása (guest session tokennel ha vendég)
    this.wsService.connect(token, isGuest ? guestSessionToken ?? undefined : undefined);

    if (isGuest && guestSessionToken) {
      // Vendég felhasználó - guest session alapján
      const guestId = this.guestService.getGuestId();

      if (guestId) {
        this.logger.info(`[AppShell] Subscribing to guest notifications (guest ID: ${guestId})`);

        this.notificationService.subscribeToNotifications(
          project.id,
          'guest',
          guestId
        );

        // Értesítések betöltése
        this.notificationService.loadNotifications(project.id).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => this.logger.info('[AppShell] Notifications loaded'),
          error: (error) => this.logger.error('[AppShell] Failed to load notifications:', error)
        });
      } else {
        this.logger.warn('[AppShell] Guest ID not found - cannot subscribe to notifications');
      }

    } else if (project.contacts && project.contacts.length > 0) {
      // Kapcsolattartó felhasználó - contact ID alapján
      const contact = project.contacts[0];
      this.logger.info(`[AppShell] Subscribing to contact notifications (contact ID: ${contact.id})`);

      this.notificationService.subscribeToNotifications(
        project.id,
        'contact',
        contact.id
      );

      // Értesítések betöltése
      this.notificationService.loadNotifications(project.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => this.logger.info('[AppShell] Notifications loaded'),
        error: (error) => this.logger.error('[AppShell] Failed to load notifications:', error)
      });
    } else {
      this.logger.warn('[AppShell] No contact info - cannot subscribe to notifications');
    }
  }

  /**
   * Photo selection reminder ellenőrzése és megjelenítése
   */
  private checkPhotoSelectionReminder(): void {
    const project = this.authService.getProject();
    const canFinalize = this.authService.canFinalize();

    if (!project) return;

    // Csak kódos belépésnél (canFinalize = true) jelenjen meg
    if (!canFinalize) return;

    const hasGallery = !!project.hasGallery;
    const progress = project.photoSelectionProgress;
    const currentStep = project.photoSelectionCurrentStep as ReminderWorkflowStep | null;
    const photoSelectionFinalized = !!project.photoSelectionFinalized;

    // Effektív step meghatározása a progress alapján
    const effectiveStep = this.photoSelectionReminderService.getEffectiveStep(
      currentStep,
      progress,
      photoSelectionFinalized
    );

    if (this.photoSelectionReminderService.shouldShowReminder(project.id, hasGallery, effectiveStep)) {
      this.currentPhotoSelectionStep.set(effectiveStep || 'claiming');
      this.showPhotoSelectionReminderDialog.set(true);
      this.cdr.markForCheck();
    }
  }

  /**
   * Password set dialógus eredmény kezelése
   */
  onPasswordSet(result: PasswordSetResult): void {
    if (result.action === 'success') {
      this.toastService.success('Siker', 'Jelszó sikeresen beállítva!');
      this.cdr.markForCheck();
    }
  }

  /**
   * Photo selection reminder dialógus eredmény kezelése
   */
  onPhotoSelectionReminderResult(result: PhotoSelectionReminderResult): void {
    const project = this.authService.getProject();

    switch (result.action) {
      case 'navigate':
        // Navigálás a képválasztás oldalra - cooldown aktív
        if (project) {
          this.photoSelectionReminderService.markAsShownForStep(project.id, this.currentPhotoSelectionStep());
        }
        this.showPhotoSelectionReminderDialog.set(false);
        this.router.navigate(['/photo-selection']);
        break;

      case 'snooze':
        // Halasztás (12 óra) - step-specifikus
        if (project) {
          this.photoSelectionReminderService.snoozeForHalfDayForStep(project.id, this.currentPhotoSelectionStep());
        }
        this.showPhotoSelectionReminderDialog.set(false);
        this.cdr.markForCheck();
        break;

      case 'close':
        // X gomb vagy ESC - 12 óra cooldown aktív
        if (project) {
          this.photoSelectionReminderService.markAsShownForStep(project.id, this.currentPhotoSelectionStep());
        }
        this.showPhotoSelectionReminderDialog.set(false);
        this.cdr.markForCheck();
        break;

      case 'backdrop':
        // Backdrop kattintás - NEM aktivál cooldown-t
        this.showPhotoSelectionReminderDialog.set(false);
        this.cdr.markForCheck();
        break;
    }
  }

  /**
   * Kijelentkezés kezelése (mobil menüből)
   */
  onLogout(): void {
    this.sidebarState.close();
    this.authService.logout();
  }

  /**
   * WebSocket kapcsolat és értesítések lezárása
   */
  private cleanupWebSocketAndNotifications(): void {
    const project = this.authService.getProject();
    if (!project) return;

    const isGuest = this.authService.isGuest();
    const guestSessionToken = this.guestService.getSessionToken();

    // Értesítési csatorna leiratkozás
    if (isGuest && guestSessionToken) {
      const guestId = this.guestService.getGuestId();
      if (guestId) {
        this.notificationService.unsubscribeFromNotifications(
          project.id,
          'guest',
          guestId
        );
      }
    } else if (project.contacts && project.contacts.length > 0) {
      const contact = project.contacts[0];
      this.notificationService.unsubscribeFromNotifications(
        project.id,
        'contact',
        contact.id
      );
    }

    // WebSocket kapcsolat bontása
    this.wsService.disconnect();
    this.logger.info('[AppShell] WebSocket disconnected');
  }
}
