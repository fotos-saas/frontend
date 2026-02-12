import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  AfterViewInit,
  viewChild,
  ElementRef,
  OnInit,
  inject,
  DestroyRef,
  ChangeDetectorRef,
  signal,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GuestService } from '../../../core/services/guest.service';
import { PersonSearchResult } from '../../../core/models/guest.models';
import { OnboardingFormService, OnboardingStep } from './onboarding-form.service';

/**
 * Dialog eredmény típus
 */
export type OnboardingResult =
  | { action: 'submit'; nickname: string; personId?: number; email?: string }
  | { action: 'close' };

// Re-export for backwards compatibility
export { OnboardingStep } from './onboarding-form.service';

/**
 * Onboarding Dialog Component
 *
 * 3 lépéses stepper a vendég azonosításhoz:
 * 1. Név keresés - autocomplete a tablón szereplő személyekből
 * 2. Becenév - kötelező, előre töltve a keresztnévvel
 * 3. Email - opcionális, átugorható
 */
@Component({
  selector: 'app-onboarding-dialog',
  standalone: true,
  imports: [FormsModule],
  providers: [OnboardingFormService],
  templateUrl: './onboarding-dialog.component.html',
  styleUrls: ['./onboarding-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class OnboardingDialogComponent implements OnInit, AfterViewInit {
  /** Signal-based inputs */
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  /** Signal-based outputs */
  readonly resultEvent = output<OnboardingResult>();

  private readonly guestService = inject(GuestService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly formService = inject(OnboardingFormService);

  /** Form értékek */
  searchQuery = '';
  nickname = '';
  email = '';

  /** ViewChild referenciák */
  readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  readonly nicknameInputRef = viewChild<ElementRef<HTMLInputElement>>('nicknameInput');
  readonly emailInputRef = viewChild<ElementRef<HTMLInputElement>>('emailInput');
  readonly restoreEmailInputRef = viewChild<ElementRef<HTMLInputElement>>('restoreEmailInput');

  /** Restore mode (már regisztráltál korábban?) */
  showRestoreMode = signal(false);
  restoreEmail = '';
  isRestoreSending = signal(false);
  restoreSuccess = signal(false);
  restoreError = signal<string | null>(null);

  private previousActiveElement?: HTMLElement;
  private scrollPosition = 0;
  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      document.body.classList.remove('dialog-open');
      document.body.style.removeProperty('--scroll-position');
      window.scrollTo(0, this.scrollPosition);
    });
  }

  // Service delegálás template-hez - signal referenciák
  readonly currentStep = this.formService.currentStep;
  readonly selectedPerson = this.formService.selectedPerson;
  readonly notFoundSelected = this.formService.notFoundSelected;
  readonly searchResults = this.formService.searchResults;
  readonly isSearching = this.formService.isSearching;
  readonly errors = this.formService.errors;
  clearErrors(): void { this.formService.clearErrors(); }
  readonly stepTitles = this.formService.stepTitles;
  readonly stepDescriptions = this.formService.stepDescriptions;
  readonly stepIndex = this.formService.stepIndex;
  readonly hasSelection = computed(() => this.formService.hasSelection());
  readonly isStepValid = computed(() => this.formService.isStepValid(this.searchQuery, this.nickname, this.email));
  readonly nextButtonText = computed(() => this.formService.getNextButtonText(this.isSubmitting()));

  ngOnInit(): void {
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
      switchMap(query => {
        if (query.length < 2) return [];
        this.formService.isSearching.set(true);
        return this.guestService.searchPersons(query);
      })
    ).subscribe(results => {
      this.formService.searchResults.set(results);
      this.formService.isSearching.set(false);
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.scrollPosition = window.scrollY;
    document.body.style.setProperty('--scroll-position', `-${this.scrollPosition}px`);
    document.body.classList.add('dialog-open');
    setTimeout(() => this.focusCurrentStepInput(), 100);
  }

  private focusCurrentStepInput(): void {
    const step = this.currentStep();
    if (step === 'search') this.searchInputRef()?.nativeElement.focus();
    else if (step === 'nickname') this.nicknameInputRef()?.nativeElement.focus();
    else if (step === 'email') this.emailInputRef()?.nativeElement.focus();
  }

  onSearchInput(): void {
    this.formService.clearSelection();
    this.searchInput$.next(this.searchQuery);
  }

  selectPerson(person: PersonSearchResult): void {
    this.nickname = this.formService.selectPerson(person);
    this.searchQuery = person.name;
  }

  selectNotFound(): void {
    this.nickname = this.formService.selectNotFound(this.searchQuery);
  }

  nextStep(): void {
    // Ha nincs kiválasztás de van query, beállítjuk a nickname-et
    if (!this.formService.hasSelection() && this.searchQuery.trim().length >= 2) {
      this.nickname = this.searchQuery.trim();
    }

    if (this.formService.goToNextStep(this.searchQuery, this.nickname)) {
      setTimeout(() => this.focusCurrentStepInput(), 100);
    }
  }

  prevStep(): void {
    this.formService.goToPrevStep();
    setTimeout(() => this.focusCurrentStepInput(), 100);
  }

  submit(): void {
    if (this.isSubmitting()) return;
    if (!this.formService.validateEmail(this.email)) return;

    this.resultEvent.emit({
      action: 'submit',
      nickname: this.nickname.trim(),
      personId: this.selectedPerson()?.id,
      email: this.email.trim() || undefined
    });
  }

  skipEmail(): void {
    if (this.isSubmitting()) return;
    this.email = '';
    this.submit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      // Ha restore mode-ban vagyunk, lépjünk vissza
      if (this.showRestoreMode()) {
        this.exitRestoreMode();
      }
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      // Restore mode kezelése
      if (this.showRestoreMode()) {
        this.requestRestoreLink();
        return;
      }

      const step = this.currentStep();
      if (step === 'search' || step === 'nickname') {
        this.nextStep();
      } else if (step === 'email') {
        this.submit();
      }
    }
  }

  // ==========================================
  // RESTORE MODE (MÁR REGISZTRÁLTÁL?)
  // ==========================================

  enterRestoreMode(): void {
    this.showRestoreMode.set(true);
    this.restoreEmail = '';
    this.restoreSuccess.set(false);
    this.restoreError.set(null);
    setTimeout(() => this.restoreEmailInputRef()?.nativeElement.focus(), 100);
  }

  exitRestoreMode(): void {
    this.showRestoreMode.set(false);
    this.restoreEmail = '';
    this.restoreSuccess.set(false);
    this.restoreError.set(null);
    this.isRestoreSending.set(false);
    setTimeout(() => this.focusCurrentStepInput(), 100);
  }

  requestRestoreLink(): void {
    if (this.isRestoreSending()) return;

    const email = this.restoreEmail.trim();
    if (!email) {
      this.restoreError.set('Add meg az email címed!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.restoreError.set('Érvénytelen email cím.');
      return;
    }

    this.isRestoreSending.set(true);
    this.restoreError.set(null);

    this.guestService.requestRestoreLink(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.restoreSuccess.set(true);
          this.isRestoreSending.set(false);
          this.cdr.markForCheck();
        },
        error: (err: Error) => {
          this.restoreError.set(err.message);
          this.isRestoreSending.set(false);
          this.cdr.markForCheck();
        }
      });
  }
}
