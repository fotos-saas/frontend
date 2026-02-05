import { Injectable, inject, DestroyRef, ChangeDetectorRef, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, distinctUntilChanged, map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { GuestService } from '../../../services/guest.service';
import { ToastService } from '../../../services/toast.service';
import { WebsocketService } from '../../../services/websocket.service';
import { NotificationService } from '../../../services/notification.service';
import { LoggerService } from '../../../services/logger.service';
import {
  PhotoSelectionReminderService,
  ReminderWorkflowStep,
} from '../../../services/photo-selection-reminder.service';
import { PhotoSelectionReminderResult } from '../../../../shared/components/photo-selection-reminder-dialog/photo-selection-reminder-dialog.component';

/**
 * App Shell Service
 *
 * Az AppShellComponent üzleti logikáját tartalmazza:
 * - WebSocket + értesítés init/cleanup
 * - Photo selection reminder kezelése
 * - Session invalidáció figyelése
 */
@Injectable({ providedIn: null })
export class AppShellService {
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly toastService = inject(ToastService);
  private readonly wsService = inject(WebsocketService);
  private readonly notificationService = inject(NotificationService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly photoSelectionReminderService = inject(PhotoSelectionReminderService);

  /** Photo selection reminder dialog láthatósága */
  readonly showReminderDialog = signal(false);

  /** Aktuális képválasztás lépés (dialógushoz) */
  readonly currentStep = signal<ReminderWorkflowStep>('claiming');

  /** Timeout ID-k cleanup-hoz */
  private projectCheckTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private routeCheckTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Photo selection reminder figyelése (projekt változás + route váltás)
   */
  initPhotoSelectionWatchers(cdr: ChangeDetectorRef): void {
    // Projekt változásra reagálunk
    this.authService.project$
      .pipe(
        filter((project) => !!project),
        map((project) => ({
          id: project!.id,
          hasGallery: project!.hasGallery,
          progress: project!.photoSelectionProgress,
          currentStep: project!.photoSelectionCurrentStep,
          finalized: project!.photoSelectionFinalized,
        })),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (!this.router.url.startsWith('/photo-selection')) {
          if (this.projectCheckTimeoutId) clearTimeout(this.projectCheckTimeoutId);
          this.projectCheckTimeoutId = setTimeout(
            () => this.checkPhotoSelectionReminder(cdr),
            100
          );
        }
      });

    // Navigáláskor is ellenőrzés
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter((event) => !event.url.startsWith('/photo-selection')),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.routeCheckTimeoutId) clearTimeout(this.routeCheckTimeoutId);
        this.routeCheckTimeoutId = setTimeout(
          () => this.checkPhotoSelectionReminder(cdr),
          150
        );
      });
  }

  /**
   * Session invalidálás figyelése
   */
  initSessionInvalidationWatcher(): void {
    this.guestService.sessionInvalidated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.reason === 'banned') {
          this.toastService.error('Hozzáférés megtagadva', event.message, 8000);
        } else {
          this.toastService.info('Munkamenet lejárt', event.message, 5000);
        }
        this.authService.clearAuth();
      });
  }

  /**
   * Session polling indítása ha van guest session
   */
  startSessionPollingIfNeeded(): void {
    if (this.guestService.hasRegisteredSession()) {
      this.guestService.startSessionPolling();
    }
  }

  /**
   * WebSocket kapcsolat és értesítések inicializálása
   */
  initWebSocketAndNotifications(): void {
    const project = this.authService.getProject();
    const token = this.authService.getToken();

    if (!project || !token) {
      this.logger.warn('[AppShell] No project or token - skipping WebSocket init');
      return;
    }

    const isGuest = this.authService.isGuest();
    const guestSessionToken = this.guestService.getSessionToken();

    this.wsService.connect(token, isGuest ? guestSessionToken ?? undefined : undefined);

    if (isGuest && guestSessionToken) {
      this.subscribeGuestNotifications(project.id);
    } else if (project.contacts && project.contacts.length > 0) {
      this.subscribeContactNotifications(project.id, project.contacts[0].id);
    } else {
      this.logger.warn('[AppShell] No contact info - cannot subscribe to notifications');
    }
  }

  /**
   * Photo selection reminder eredmény kezelése
   */
  handleReminderResult(result: PhotoSelectionReminderResult, cdr: ChangeDetectorRef): void {
    const project = this.authService.getProject();

    switch (result.action) {
      case 'navigate':
        if (project) {
          this.photoSelectionReminderService.markAsShownForStep(
            project.id,
            this.currentStep()
          );
        }
        this.showReminderDialog.set(false);
        this.router.navigate(['/photo-selection']);
        break;

      case 'snooze':
        if (project) {
          this.photoSelectionReminderService.snoozeForHalfDayForStep(
            project.id,
            this.currentStep()
          );
        }
        this.showReminderDialog.set(false);
        cdr.markForCheck();
        break;

      case 'close':
        if (project) {
          this.photoSelectionReminderService.markAsShownForStep(
            project.id,
            this.currentStep()
          );
        }
        this.showReminderDialog.set(false);
        cdr.markForCheck();
        break;

      case 'backdrop':
        this.showReminderDialog.set(false);
        cdr.markForCheck();
        break;
    }
  }

  /**
   * WebSocket kapcsolat és értesítések lezárása
   */
  cleanup(): void {
    if (this.projectCheckTimeoutId) clearTimeout(this.projectCheckTimeoutId);
    if (this.routeCheckTimeoutId) clearTimeout(this.routeCheckTimeoutId);

    this.guestService.stopSessionPolling();
    this.cleanupWebSocketAndNotifications();
  }

  // --- Private metódusok ---

  private checkPhotoSelectionReminder(cdr: ChangeDetectorRef): void {
    const project = this.authService.getProject();
    const canFinalize = this.authService.canFinalize();

    if (!project || !canFinalize) return;

    const hasGallery = !!project.hasGallery;
    const progress = project.photoSelectionProgress;
    const currentStep = project.photoSelectionCurrentStep as ReminderWorkflowStep | null;
    const photoSelectionFinalized = !!project.photoSelectionFinalized;

    const effectiveStep = this.photoSelectionReminderService.getEffectiveStep(
      currentStep,
      progress,
      photoSelectionFinalized
    );

    if (
      this.photoSelectionReminderService.shouldShowReminder(
        project.id,
        hasGallery,
        effectiveStep
      )
    ) {
      this.currentStep.set(effectiveStep || 'claiming');
      this.showReminderDialog.set(true);
      cdr.markForCheck();
    }
  }

  private subscribeGuestNotifications(projectId: number): void {
    const guestId = this.guestService.getGuestId();

    if (!guestId) {
      this.logger.warn('[AppShell] Guest ID not found - cannot subscribe to notifications');
      return;
    }

    this.logger.info(`[AppShell] Subscribing to guest notifications (guest ID: ${guestId})`);
    this.notificationService.subscribeToNotifications(projectId, 'guest', guestId);
    this.loadNotifications(projectId);
  }

  private subscribeContactNotifications(projectId: number, contactId: number): void {
    this.logger.info(
      `[AppShell] Subscribing to contact notifications (contact ID: ${contactId})`
    );
    this.notificationService.subscribeToNotifications(projectId, 'contact', contactId);
    this.loadNotifications(projectId);
  }

  private loadNotifications(projectId: number): void {
    this.notificationService
      .loadNotifications(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.logger.info('[AppShell] Notifications loaded'),
        error: (error) =>
          this.logger.error('[AppShell] Failed to load notifications:', error),
      });
  }

  private cleanupWebSocketAndNotifications(): void {
    const project = this.authService.getProject();
    if (!project) return;

    const isGuest = this.authService.isGuest();
    const guestSessionToken = this.guestService.getSessionToken();

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

    this.wsService.disconnect();
    this.logger.info('[AppShell] WebSocket disconnected');
  }
}
