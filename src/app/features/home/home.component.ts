import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TabloProject, ContactPerson } from '../../core/services/auth.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ScheduleReminderResult, ScheduleReminderDialogComponent } from '../../shared/components/schedule-reminder-dialog/schedule-reminder-dialog.component';
import { FinalizationReminderResult, FinalizationReminderDialogComponent } from '../../shared/components/finalization-reminder-dialog/finalization-reminder-dialog.component';
import { ContactEditResult, ContactData, ContactEditDialogComponent } from '../../shared/components/contact-edit-dialog/contact-edit-dialog.component';
import { RequireFullAccessDirective } from '../../shared/directives/require-full-access.directive';
import { OnboardingDialogComponent, OnboardingResult } from '../../shared/components/onboarding-dialog/onboarding-dialog.component';
import { PendingVerificationComponent } from '../../shared/components/pending-verification/pending-verification.component';
import { HomeStateService } from './home-state.service';

/**
 * Home Component - Bejelentkezett felhasznalok kezdolapja
 *
 * Uzleti logika: HomeStateService (providedIn: null, komponens szintu).
 */
@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        RouterLink,
        ScheduleReminderDialogComponent,
        FinalizationReminderDialogComponent,
        ContactEditDialogComponent,
        RequireFullAccessDirective,
        OnboardingDialogComponent,
        PendingVerificationComponent,
        AsyncPipe,
    ],
    providers: [HomeStateService],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private readonly state = inject(HomeStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Template-facing delegaciok */
  readonly project$: Observable<TabloProject | null> = this.state.project$;
  readonly guestService = this.state.guestService;

  readonly showOnboardingDialog = this.state.showOnboardingDialog;
  readonly isOnboardingSubmitting = this.state.isOnboardingSubmitting;
  readonly onboardingError = this.state.onboardingError;
  readonly showPendingVerification = this.state.showPendingVerification;

  get showReminderDialog(): boolean { return this.state.showReminderDialog; }
  get showFinalizationReminderDialog(): boolean { return this.state.showFinalizationReminderDialog; }
  get showContactEditDialog(): boolean { return this.state.showContactEditDialog; }
  get isContactSaving(): boolean { return this.state.isContactSaving; }
  get currentContactData(): ContactData { return this.state.currentContactData; }

  ngOnInit(): void {
    this.state.init(this.destroyRef, this.cdr);
  }

  // ─── Template metodus delegaciok ─────────────────────────────

  onReminderResult(result: ScheduleReminderResult): void {
    this.state.onReminderResult(result);
  }

  openScheduleDialog(): void {
    this.state.openScheduleDialog();
  }

  onFinalizationReminderResult(result: FinalizationReminderResult): void {
    this.state.onFinalizationReminderResult(result);
  }

  copyShareLink(shareUrl: string): void {
    this.state.copyShareLink(shareUrl);
  }

  async shareLink(shareUrl: string, projectName: string): Promise<void> {
    await this.state.shareLink(shareUrl, projectName);
  }

  formatPhotoDate(dateString: string | null | undefined): string {
    return this.state.formatPhotoDate(dateString);
  }

  showSamples(project: TabloProject): boolean {
    return this.state.showSamples(project);
  }

  showOrderData(project: TabloProject): boolean {
    return this.state.showOrderData(project);
  }

  showTemplateChooser(project: TabloProject): boolean {
    return this.state.showTemplateChooser(project);
  }

  showMissingPersons(project: TabloProject): boolean {
    return this.state.showMissingPersons(project);
  }

  openContactEditDialog(contact: ContactPerson | null): void {
    this.state.openContactEditDialog(contact);
  }

  onContactEditResult(result: ContactEditResult): void {
    this.state.onContactEditResult(result);
  }

  onOnboardingResult(result: OnboardingResult): void {
    this.state.onOnboardingResult(result);
  }

  onPendingVerificationCancel(): void {
    this.state.onPendingVerificationCancel();
  }
}
