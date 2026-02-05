import {
  Component,
  output,
  ChangeDetectionStrategy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { PasswordStrengthComponent } from '../password-strength/password-strength.component';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Dialog eredmény típus
 */
export type PasswordSetResult = { action: 'success' };

/**
 * Password Set Dialog Component
 *
 * Jelszó beállító dialog QR regisztráció után.
 * FONTOS: Ez a dialog NEM ZÁRHATÓ:
 * - Nincs X gomb
 * - ESC nem működik
 * - Backdrop kattintás nem zár
 *
 * A user-nek BE KELL állítania a jelszót a folytatáshoz.
 *
 * BaseDialogComponent-et bővíti a közös funkcionalitásért.
 */
@Component({
  selector: 'app-password-set-dialog',
  standalone: true,
  imports: [FormsModule, PasswordStrengthComponent],
  templateUrl: './password-set-dialog.component.html',
  styleUrls: ['./password-set-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordSetDialogComponent extends BaseDialogComponent implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  /** Signal-based outputs */
  readonly passwordSetEvent = output<PasswordSetResult>();

  /** Form adatok */
  password = '';
  passwordConfirmation = '';

  /** Jelszó láthatóság */
  readonly showPassword = signal(false);
  readonly showPasswordConfirmation = signal(false);

  /** Validációs hibák */
  errors: { password?: string; passwordConfirmation?: string } = {};

  /** ViewChild referenciák */
  @ViewChild('firstInput') firstInput?: ElementRef<HTMLInputElement>;
  @ViewChild(PasswordStrengthComponent) passwordStrength?: PasswordStrengthComponent;

  /** Computed: Jelszó erősség OK (min 8 karakter + összes követelmény teljesül) */
  readonly isPasswordStrong = computed(() => {
    return this.passwordStrength?.isValid() ?? false;
  });

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    // Focus az első input mezőre
    setTimeout(() => {
      this.firstInput?.nativeElement.focus();
    }, 100);
  }

  /**
   * Input change - töröljük a hibát
   */
  onInputChange(): void {
    this.errors = {};
    this.clearError();
  }

  /**
   * Jelszó láthatóság toggle
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Megerősítés láthatóság toggle
   */
  toggleConfirmationVisibility(): void {
    this.showPasswordConfirmation.update(v => !v);
  }

  /**
   * Validáció
   */
  private validate(): boolean {
    this.errors = {};

    if (!this.password) {
      this.errors.password = 'Add meg a jelszót!';
      return false;
    }

    if (this.password.length < 8) {
      this.errors.password = 'A jelszó minimum 8 karakter legyen.';
      return false;
    }

    // Ellenőrizzük a jelszó erősséget
    if (this.passwordStrength && !this.passwordStrength.isValid()) {
      this.errors.password = 'A jelszó nem elég erős. Teljesítsd az összes követelményt!';
      return false;
    }

    if (!this.passwordConfirmation) {
      this.errors.passwordConfirmation = 'Erősítsd meg a jelszót!';
      return false;
    }

    if (this.password !== this.passwordConfirmation) {
      this.errors.passwordConfirmation = 'A két jelszó nem egyezik.';
      return false;
    }

    return true;
  }

  /**
   * Form érvényes-e (gomb engedélyezéséhez)
   */
  get isFormValid(): boolean {
    return this.password.length >= 8 &&
           this.passwordConfirmation.length >= 1 &&
           this.password === this.passwordConfirmation;
  }

  // ============================================================================
  // BaseDialogComponent override-ok - NEM ZÁRHATÓ DIALOG
  // ============================================================================

  /**
   * ESC billentyű kezelés - LETILTVA
   */
  protected override handleEscapeKey(event: Event): void {
    // NEM csinálunk semmit - a dialog nem zárható ESC-cel
    event.preventDefault();
  }

  /**
   * Backdrop kattintás - LETILTVA
   */
  override onBackdropClick(event: MouseEvent): void {
    // NEM csinálunk semmit - a dialog nem zárható backdrop kattintással
  }

  /**
   * Close metódus - LETILTVA
   */
  override close(): void {
    // NEM csinálunk semmit - a dialog nem zárható
  }

  // ============================================================================
  // BaseDialogComponent abstract metódusok implementálása
  // ============================================================================

  protected onSubmit(): void {
    // FONTOS: A BaseDialogComponent.submit() már beállította _isSubmitting = true-ra
    // Tehát itt NEM ellenőrizzük újra, mert az mindig true lenne!

    if (!this.validate()) {
      this._isSubmitting.set(false);
      return;
    }

    this.authService.setPassword(this.password, this.passwordConfirmation).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.submitSuccess();
        this.passwordSetEvent.emit({ action: 'success' });
      },
      error: (error) => {
        this.submitError(error.message || 'Hiba történt a jelszó beállítása közben.');
      }
    });
  }

  protected onClose(): void {
    // NEM csinálunk semmit - a dialog nem zárható
  }
}
