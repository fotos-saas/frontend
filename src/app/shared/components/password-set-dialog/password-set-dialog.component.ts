import {
  Component,
  output,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  inject,
  signal,
  computed,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PasswordStrengthComponent } from '../password-strength/password-strength.component';
import { HeroDialogWrapperComponent } from '../hero-dialog-wrapper/hero-dialog-wrapper.component';
import { Router } from '@angular/router';
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
 */
@Component({
  selector: 'app-password-set-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PasswordStrengthComponent, HeroDialogWrapperComponent],
  templateUrl: './password-set-dialog.component.html',
  styleUrls: ['./password-set-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordSetDialogComponent {
  readonly ICONS = ICONS;

  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  /** Signal-based outputs */
  readonly passwordSetEvent = output<PasswordSetResult>();

  /** Form adatok */
  password = '';
  passwordConfirmation = '';

  /** Jelszó láthatóság */
  readonly showPassword = signal(false);
  readonly showPasswordConfirmation = signal(false);

  /** Állapotok */
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Validációs hibák */
  errors: { password?: string; passwordConfirmation?: string } = {};

  /** ViewChild referenciák */
  readonly passwordStrength = viewChild(PasswordStrengthComponent);

  /** Computed: Jelszó erősség OK (min 8 karakter + összes követelmény teljesül) */
  readonly isPasswordStrong = computed(() => {
    return this.passwordStrength()?.isValid() ?? false;
  });

  /**
   * Input change - töröljük a hibát
   */
  onInputChange(): void {
    this.errors = {};
    this.errorMessage.set(null);
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
    if (this.passwordStrength() && !this.passwordStrength()!.isValid()) {
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

  /**
   * Submit
   */
  submit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    if (!this.validate()) {
      this.isSubmitting.set(false);
      return;
    }

    this.authService.setPassword(this.password, this.passwordConfirmation).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.passwordSetEvent.emit({ action: 'success' });
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.message || 'Hiba történt a jelszó beállítása közben.');
      }
    });
  }

  /**
   * Kilépés - kijelentkezés és átirányítás a login oldalra
   */
  doLogout(): void {
    this.authService.logout().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
