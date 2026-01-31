import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, TabloProject, ContactPerson } from '../../core/services/auth.service';
import { ProjectModeService } from '../../core/services/project-mode.service';
import { ClipboardService } from '../../core/services/clipboard.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScheduleReminderService } from '../../core/services/schedule-reminder.service';
import { ScheduleReminderResult, ScheduleReminderDialogComponent } from '../../shared/components/schedule-reminder-dialog/schedule-reminder-dialog.component';
import { FinalizationReminderService } from '../../core/services/finalization-reminder.service';
import { FinalizationReminderResult, FinalizationReminderDialogComponent } from '../../shared/components/finalization-reminder-dialog/finalization-reminder-dialog.component';
import { ContactEditResult, ContactData, ContactEditDialogComponent } from '../../shared/components/contact-edit-dialog/contact-edit-dialog.component';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { RequireFullAccessDirective } from '../../shared/directives/require-full-access.directive';
import { GuestService } from '../../core/services/guest.service';
import { OnboardingDialogComponent, OnboardingResult } from '../../shared/components/onboarding-dialog/onboarding-dialog.component';
import { PendingVerificationComponent } from '../../shared/components/pending-verification/pending-verification.component';

/**
 * Home Component - Bejelentkezett felhasználók kezdőlapja
 *
 * Modern, minimalista design a projekt adatok és kontaktok megjelenítésére.
 */
@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        ScheduleReminderDialogComponent,
        FinalizationReminderDialogComponent,
        ContactEditDialogComponent,
        RequireFullAccessDirective,
        OnboardingDialogComponent,
        PendingVerificationComponent
    ],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  /** Aktuális projekt */
  project$: Observable<TabloProject | null>;

  /** Emlékeztető dialógus látható (schedule) */
  showReminderDialog = false;

  /** Véglegesítés emlékeztető dialógus látható */
  showFinalizationReminderDialog = false;

  /** Kapcsolattartó szerkesztő dialógus látható */
  showContactEditDialog = false;

  /** Kapcsolattartó szerkesztés mentés folyamatban */
  isContactSaving = false;

  /** Jelenlegi kapcsolattartó adatok a dialoghoz */
  currentContactData: ContactData = { name: '', email: '', phone: '' };

  /** Onboarding dialógus látható (vendég első belépés) */
  showOnboardingDialog = signal(false);

  /** Onboarding submit folyamatban */
  isOnboardingSubmitting = signal(false);

  /** Onboarding hiba üzenet */
  onboardingError = signal<string | null>(null);

  /** Pending verification screen látható */
  showPendingVerification = signal(false);

  /** DestroyRef az automatikus unsubscribe-hoz (Angular 19+) */
  private destroyRef = inject(DestroyRef);

  /** GuestService inject */
  readonly guestService = inject(GuestService);

  constructor(
    private authService: AuthService,
    private clipboardService: ClipboardService,
    private scheduleReminderService: ScheduleReminderService,
    private finalizationReminderService: FinalizationReminderService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
    private projectModeService: ProjectModeService
  ) {
    this.project$ = this.authService.project$;

    // Router NavigationEnd figyelése - ha visszatér a /home route-ra, ellenőrzi az emlékeztetőket
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      filter(event => event.urlAfterRedirects === '/home' || event.urlAfterRedirects.startsWith('/home?')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkAndShowReminders();
    });
  }

  ngOnInit(): void {
    // Első betöltéskor ellenőrizzük az emlékeztetőket
    // (A router subscription a konstruktorban már be van állítva a route váltásokhoz)
    this.checkAndShowReminders();
  }

  /**
   * Emlékeztető dialógusok ellenőrzése és megjelenítése
   * Meghívódik: ngOnInit + NavigationEnd (route váltás /home-ra)
   */
  private checkAndShowReminders(): void {
    const project = this.authService.getProject();
    const canFinalize = this.authService.canFinalize();

    if (!project) return;

    // ÚJ: Share token + nincs session → onboarding szükséges
    if (this.authService.isGuest() && !this.guestService.hasRegisteredSession()) {
      this.showOnboardingDialog.set(true);
      this.cdr.markForCheck();
      return; // Csak onboarding, nincs más dialógus
    }

    // ÚJ: Van session de pending → verification screen
    if (this.authService.isGuest() && this.guestService.isSessionPending()) {
      this.showPendingVerification.set(true);
      this.cdr.markForCheck();
      return; // PendingVerificationComponent maga indítja a pollingot
    }

    // Emlékeztetők csak kódos belépéssel rendelkező felhasználóknak jelennek meg
    // (preview/share felhasználók nem tudnak módosítani, ezért felesleges nekik mutatni)
    if (!canFinalize) return;

    // 1. Ellenőrizzük a fotózás időpont emlékeztetőt
    if (this.scheduleReminderService.shouldShowReminder(project.id, project.photoDate)) {
      // NE jelöljük megjelenítettnek itt! Csak ha a user interaktál a dialógussal.
      this.showReminderDialog = true;
      this.cdr.markForCheck();
      return; // Egyszerre csak egy dialógust mutatunk
    }

    // 2. Ellenőrizzük a véglegesítés emlékeztetőt
    // Ha van minta (samplesCount > 0), nincs szükség véglegesítésre
    const hasSamples = (project.samplesCount ?? 0) > 0;
    const isFinalized = project.isFinalized ?? false;
    if (!hasSamples && this.finalizationReminderService.shouldShowReminder(project.id, isFinalized, canFinalize)) {
      // NE jelöljük megjelenítettnek itt! Csak ha a user interaktál a dialógussal.
      this.showFinalizationReminderDialog = true;
      this.cdr.markForCheck();
    }

    // 3. Photo selection reminder - az AppShellComponent kezeli globálisan
  }

  /**
   * Emlékeztető dialógus eredmény kezelése
   */
  onReminderResult(result: ScheduleReminderResult): void {
    const project = this.authService.getProject();
    if (!project) {
      this.showReminderDialog = false;
      this.cdr.markForCheck();
      return;
    }

    switch (result.action) {
      case 'save':
        // Cooldown aktív
        this.scheduleReminderService.markAsShown(project.id);
        // Mentés API-n keresztül (takeUntilDestroyed: automatikus cleanup komponens destroy-kor)
        this.authService.updatePhotoDate(result.date)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              // Töröljük az emlékeztető állapotát
              this.scheduleReminderService.clearReminder(project.id);
              this.showReminderDialog = false;
              this.cdr.markForCheck();
            },
            error: (err) => {
              this.logger.error('Hiba a dátum mentésekor', err);
              this.showReminderDialog = false;
              this.cdr.markForCheck();
            }
          });
        break;

      case 'snooze':
        // Halasztás beállítása (cooldown is)
        this.scheduleReminderService.markAsShown(project.id);
        this.scheduleReminderService.setDismissal(project.id, result.days);
        this.showReminderDialog = false;
        this.cdr.markForCheck();
        break;

      case 'close':
        // X gomb vagy ESC - cooldown aktív
        this.scheduleReminderService.markAsShown(project.id);
        this.showReminderDialog = false;
        this.cdr.markForCheck();
        break;

      case 'backdrop':
        // Backdrop kattintás - NEM aktivál cooldown-t
        // Route váltás után újra megjelenik a dialógus
        this.showReminderDialog = false;
        this.cdr.markForCheck();
        break;
    }
  }

  /**
   * Dialógus manuális megnyitása (kártya gombról)
   */
  openScheduleDialog(): void {
    this.showReminderDialog = true;
    this.cdr.markForCheck();
  }

  /**
   * Véglegesítés emlékeztető dialógus eredmény kezelése
   */
  onFinalizationReminderResult(result: FinalizationReminderResult): void {
    const project = this.authService.getProject();

    switch (result.action) {
      case 'navigate':
        // Navigálás a véglegesítés oldalra - cooldown aktív
        if (project) {
          this.finalizationReminderService.markAsShown(project.id);
        }
        this.showFinalizationReminderDialog = false;
        this.router.navigate(['/order-finalization']);
        break;

      case 'snooze':
        // Halasztás beállítása
        if (project) {
          this.finalizationReminderService.setDismissal(project.id, result.days);
        }
        this.showFinalizationReminderDialog = false;
        this.cdr.markForCheck();
        break;

      case 'close':
        // X gomb vagy ESC - cooldown aktív
        if (project) {
          this.finalizationReminderService.markAsShown(project.id);
        }
        this.showFinalizationReminderDialog = false;
        this.cdr.markForCheck();
        break;

      case 'backdrop':
        // Backdrop kattintás - NEM aktivál cooldown-t
        // Route váltás után újra megjelenik a dialógus
        this.showFinalizationReminderDialog = false;
        this.cdr.markForCheck();
        break;
    }
  }

  /**
   * Share link másolása a vágólapra (Link másolása gomb)
   */
  copyShareLink(shareUrl: string): void {
    if (shareUrl) {
      this.clipboardService.copyLink(shareUrl);
    }
  }

  /**
   * Native share API használata mobil eszközökön (Megosztás gomb)
   * Ha a user megszakítja a share dialógust, NEM másolunk vágólapra
   */
  async shareLink(shareUrl: string, projectName: string): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: projectName,
          text: 'Tabló projekt megtekintése',
          url: shareUrl
        });
        // Share sikeres - nem kell semmi
      } catch {
        // User cancelled - NEM csinálunk semmit (ne másoljon vágólapra)
      }
    } else {
      // No native share API - megnyitjuk a copy dialógust
      this.copyShareLink(shareUrl);
    }
  }

  /**
   * Fotózás dátum formázása magyar formátumra
   */
  formatPhotoDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Minták kártya látható-e?
   * Delegálva: ProjectModeService
   */
  showSamples(project: TabloProject): boolean {
    return this.projectModeService.showSamples(project);
  }

  /**
   * Megrendelési adatok kártya látható-e?
   * Delegálva: ProjectModeService
   */
  showOrderData(project: TabloProject): boolean {
    return this.projectModeService.showOrderData(project);
  }

  /**
   * Minta Választó kártya látható-e?
   * Delegálva: ProjectModeService
   */
  showTemplateChooser(project: TabloProject): boolean {
    return this.projectModeService.showTemplateChooser(project);
  }

  /**
   * Hiányzó képek kártya látható-e?
   * Delegálva: ProjectModeService
   */
  showMissingPersons(project: TabloProject): boolean {
    return this.projectModeService.showMissingPersons(project);
  }

  /**
   * Kapcsolattartó szerkesztő dialógus megnyitása
   */
  openContactEditDialog(contact: ContactPerson | null): void {
    this.currentContactData = {
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? ''
    };
    this.showContactEditDialog = true;
    this.cdr.markForCheck();
  }

  /**
   * Kapcsolattartó szerkesztő dialógus eredmény kezelése
   */
  onContactEditResult(result: ContactEditResult): void {
    if (result.action === 'save') {
      this.isContactSaving = true;
      this.cdr.markForCheck();

      // Kapcsolattartó frissítés (takeUntilDestroyed: automatikus cleanup komponens destroy-kor)
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

  /**
   * Onboarding dialógus eredmény kezelése (vendég regisztráció)
   */
  onOnboardingResult(result: OnboardingResult): void {
    if (result.action === 'close') {
      // Nem engedjük bezárni regisztráció nélkül - nothing to do
      return;
    }

    this.isOnboardingSubmitting.set(true);
    this.onboardingError.set(null);

    this.guestService.registerWithIdentification(
      result.nickname,
      result.missingPersonId,
      result.email
    ).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (session) => {
        this.isOnboardingSubmitting.set(false);
        this.showOnboardingDialog.set(false);

        // Ha pending, mutassuk a verification screen-t
        if (session.isPending) {
          this.showPendingVerification.set(true);
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isOnboardingSubmitting.set(false);
        this.onboardingError.set(err.message || 'Hiba történt a regisztráció során');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Pending verification cancel kezelése
   */
  onPendingVerificationCancel(): void {
    this.guestService.clearSession();
    this.showPendingVerification.set(false);
    // Újra onboarding
    this.showOnboardingDialog.set(true);
    this.cdr.markForCheck();
  }
}
