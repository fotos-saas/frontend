import { Injectable, ChangeDetectorRef, DestroyRef, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, TabloProject, ContactPerson } from '../../core/services/auth.service';
import { ProjectModeService } from '../../core/services/project-mode.service';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ScheduleReminderService } from '../../core/services/schedule-reminder.service';
import { ScheduleReminderResult } from '../../shared/components/schedule-reminder-dialog/schedule-reminder-dialog.component';
import { FinalizationReminderService } from '../../core/services/finalization-reminder.service';
import { FinalizationReminderResult } from '../../shared/components/finalization-reminder-dialog/finalization-reminder-dialog.component';
import { ContactEditResult, ContactData } from '../../shared/components/contact-edit-dialog/contact-edit-dialog.component';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { GuestService } from '../../core/services/guest.service';
import { OnboardingResult } from '../../shared/components/onboarding-dialog/onboarding-dialog.component';

/**
 * HomeComponent allapotkezelo service
 * Felelos: emlekeztetok, kapcsolattarto szerkesztes, onboarding, share link, datum formazas.
 */
@Injectable()
export class HomeStateService {
  private readonly authService = inject(AuthService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly scheduleReminderService = inject(ScheduleReminderService);
  private readonly finalizationReminderService = inject(FinalizationReminderService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly projectModeService = inject(ProjectModeService);
  readonly guestService = inject(GuestService);

  private destroyRef!: DestroyRef;
  private cdr!: ChangeDetectorRef;

  readonly project$: Observable<TabloProject | null> = this.authService.project$;

  showReminderDialog = false;
  showFinalizationReminderDialog = false;
  showContactEditDialog = false;
  isContactSaving = false;
  currentContactData: ContactData = { name: '', email: '', phone: '' };

  readonly showOnboardingDialog = signal(false);
  readonly isOnboardingSubmitting = signal(false);
  readonly onboardingError = signal<string | null>(null);
  readonly showPendingVerification = signal(false);

  /** Inicializalas - komponens konstruktorabol hivando */
  init(destroyRef: DestroyRef, cdr: ChangeDetectorRef): void {
    this.destroyRef = destroyRef;
    this.cdr = cdr;

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      filter(event => event.urlAfterRedirects === '/home' || event.urlAfterRedirects.startsWith('/home?')),
      takeUntilDestroyed(destroyRef)
    ).subscribe(() => this.checkAndShowReminders());

    this.checkAndShowReminders();
  }

  private checkAndShowReminders(): void {
    const project = this.authService.getProject();
    const canFinalize = this.authService.canFinalize();
    if (!project) return;

    if (this.authService.isGuest() && !this.guestService.hasRegisteredSession()) {
      this.showOnboardingDialog.set(true);
      this.cdr.markForCheck();
      return;
    }
    if (this.authService.isGuest() && this.guestService.isSessionPending()) {
      this.showPendingVerification.set(true);
      this.cdr.markForCheck();
      return;
    }
    if (!canFinalize) return;

    if (this.scheduleReminderService.shouldShowReminder(project.id, project.photoDate)) {
      this.showReminderDialog = true;
      this.cdr.markForCheck();
      return;
    }

    const hasSamples = (project.samplesCount ?? 0) > 0;
    const isFinalized = project.isFinalized ?? false;
    if (!hasSamples && this.finalizationReminderService.shouldShowReminder(project.id, isFinalized, canFinalize)) {
      this.showFinalizationReminderDialog = true;
      this.cdr.markForCheck();
    }
  }

  // ─── Schedule Reminder ───────────────────────────────────────

  onReminderResult(result: ScheduleReminderResult): void {
    const project = this.authService.getProject();
    if (!project) {
      this.showReminderDialog = false;
      this.cdr.markForCheck();
      return;
    }

    switch (result.action) {
      case 'save':
        this.scheduleReminderService.markAsShown(project.id);
        this.authService.updatePhotoDate(result.date)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.scheduleReminderService.clearReminder(project.id);
              this.showReminderDialog = false;
              this.cdr.markForCheck();
            },
            error: (err) => {
              this.logger.error('Hiba a datum mentesekor', err);
              this.showReminderDialog = false;
              this.cdr.markForCheck();
            }
          });
        break;
      case 'snooze':
        this.scheduleReminderService.markAsShown(project.id);
        this.scheduleReminderService.setDismissal(project.id, result.days);
        this.showReminderDialog = false;
        this.cdr.markForCheck();
        break;
      case 'close':
        this.scheduleReminderService.markAsShown(project.id);
        this.showReminderDialog = false;
        this.cdr.markForCheck();
        break;
      case 'backdrop':
        this.showReminderDialog = false;
        this.cdr.markForCheck();
        break;
    }
  }

  openScheduleDialog(): void {
    this.showReminderDialog = true;
    this.cdr.markForCheck();
  }

  // ─── Finalization Reminder ───────────────────────────────────

  onFinalizationReminderResult(result: FinalizationReminderResult): void {
    const project = this.authService.getProject();

    switch (result.action) {
      case 'navigate':
        if (project) this.finalizationReminderService.markAsShown(project.id);
        this.showFinalizationReminderDialog = false;
        this.router.navigate(['/order-finalization']);
        break;
      case 'snooze':
        if (project) this.finalizationReminderService.setDismissal(project.id, result.days);
        this.showFinalizationReminderDialog = false;
        this.cdr.markForCheck();
        break;
      case 'close':
        if (project) this.finalizationReminderService.markAsShown(project.id);
        this.showFinalizationReminderDialog = false;
        this.cdr.markForCheck();
        break;
      case 'backdrop':
        this.showFinalizationReminderDialog = false;
        this.cdr.markForCheck();
        break;
    }
  }

  // ─── Share Link ──────────────────────────────────────────────

  copyShareLink(shareUrl: string): void {
    if (shareUrl) this.clipboardService.copyLink(shareUrl);
  }

  async shareLink(shareUrl: string, projectName: string): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({ title: projectName, text: 'Tabló projekt megtekintése', url: shareUrl });
      } catch {
        // User cancelled
      }
    } else {
      this.copyShareLink(shareUrl);
    }
  }

  // ─── Contact Edit ────────────────────────────────────────────

  openContactEditDialog(contact: ContactPerson | null): void {
    this.currentContactData = {
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? ''
    };
    this.showContactEditDialog = true;
    this.cdr.markForCheck();
  }

  onContactEditResult(result: ContactEditResult): void {
    if (result.action === 'save') {
      this.isContactSaving = true;
      this.cdr.markForCheck();
      this.authService.updateContact(result.data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success('Siker', 'Kapcsolattartó sikeresen frissítve!');
            this.showContactEditDialog = false;
            this.isContactSaving = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.toastService.error('Hiba', err.message || 'Hiba történt a mentés során');
            this.isContactSaving = false;
            this.cdr.markForCheck();
          }
        });
    } else {
      this.showContactEditDialog = false;
      this.cdr.markForCheck();
    }
  }

  // ─── Onboarding ──────────────────────────────────────────────

  onOnboardingResult(result: OnboardingResult): void {
    if (result.action === 'close') return;

    this.isOnboardingSubmitting.set(true);
    this.onboardingError.set(null);

    this.guestService.registerWithIdentification(result.nickname, result.personId, result.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.isOnboardingSubmitting.set(false);
          this.showOnboardingDialog.set(false);
          if (session.isPending) this.showPendingVerification.set(true);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isOnboardingSubmitting.set(false);
          this.onboardingError.set(err.message || 'Hiba történt a regisztráció során');
          this.cdr.markForCheck();
        }
      });
  }

  onPendingVerificationCancel(): void {
    this.guestService.clearSession();
    this.showPendingVerification.set(false);
    this.showOnboardingDialog.set(true);
    this.cdr.markForCheck();
  }

  // ─── Utility ─────────────────────────────────────────────────

  formatPhotoDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  showSamples(project: TabloProject): boolean {
    return this.projectModeService.showSamples(project);
  }

  showOrderData(project: TabloProject): boolean {
    return this.projectModeService.showOrderData(project);
  }

  showTemplateChooser(project: TabloProject): boolean {
    return this.projectModeService.showTemplateChooser(project);
  }

  showMissingPersons(project: TabloProject): boolean {
    return this.projectModeService.showMissingPersons(project);
  }
}
