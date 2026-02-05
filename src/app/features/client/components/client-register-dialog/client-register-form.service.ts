import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClientService, RegisterResponse } from '../../services/client.service';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Validációs hiba map típus
 */
export type ValidationErrors = Record<string, string>;

/**
 * Jelszó erősség ellenőrző callback típus
 */
export type PasswordStrengthValidator = () => boolean;

/**
 * Client Register Form Service
 *
 * Form validáció, állapotkezelés és submit logika
 * a kliens regisztrációs dialoghoz.
 *
 * Component-scoped (providedIn: null).
 */
@Injectable({ providedIn: null })
export class ClientRegisterFormService {
  private readonly clientService = inject(ClientService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  /** Form mezők */
  email = '';
  password = '';
  passwordConfirmation = '';

  /** Form állapot */
  readonly isSubmitting = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly errors = signal<ValidationErrors>({});

  /** Form version trigger - forces computed re-evaluation */
  private readonly formVersion = signal(0);

  /** Jelszó erősség ellenőrző - a komponens állítja be */
  private passwordStrengthValidator: PasswordStrengthValidator = () => false;

  /**
   * Password strength validator beállítása.
   * A komponens hívja meg, ha a PasswordStrengthComponent elérhető.
   */
  setPasswordStrengthValidator(validator: PasswordStrengthValidator): void {
    this.passwordStrengthValidator = validator;
  }

  /**
   * Computed: form valid - uses formVersion to track changes
   */
  readonly isFormValid = computed(() => {
    this.formVersion();

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    const passwordValid = this.password.length >= 8;
    const confirmValid = this.password === this.passwordConfirmation
      && this.passwordConfirmation.length > 0;
    const strengthOk = this.passwordStrengthValidator();

    return emailValid && passwordValid && confirmValid && strengthOk;
  });

  /**
   * Input mező változás kezelése - errorok törlése
   */
  onInputChange(): void {
    this.errors.set({});
    this.apiError.set(null);
    this.formVersion.update(v => v + 1);
  }

  /**
   * Form validáció
   */
  validate(): boolean {
    const newErrors: ValidationErrors = {};

    if (!this.email) {
      newErrors['email'] = 'Add meg az email címed!';
      this.errors.set(newErrors);
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      newErrors['email'] = 'Érvénytelen email cím.';
      this.errors.set(newErrors);
      return false;
    }

    if (!this.password) {
      newErrors['password'] = 'Add meg a jelszót!';
      this.errors.set(newErrors);
      return false;
    }

    if (this.password.length < 8) {
      newErrors['password'] = 'A jelszó minimum 8 karakter legyen.';
      this.errors.set(newErrors);
      return false;
    }

    if (!this.passwordStrengthValidator()) {
      newErrors['password'] = 'A jelszó nem elég erős. Teljesítsd az összes követelményt!';
      this.errors.set(newErrors);
      return false;
    }

    if (!this.passwordConfirmation) {
      newErrors['passwordConfirmation'] = 'Erősítsd meg a jelszót!';
      this.errors.set(newErrors);
      return false;
    }

    if (this.password !== this.passwordConfirmation) {
      newErrors['passwordConfirmation'] = 'A két jelszó nem egyezik.';
      this.errors.set(newErrors);
      return false;
    }

    this.errors.set({});
    return true;
  }

  /**
   * Regisztráció submit
   * @returns Observable eredmény a komponensnek (success token)
   */
  submit(onSuccess: (token: string) => void): void {
    if (this.isSubmitting()) return;

    if (!this.validate()) {
      return;
    }

    this.isSubmitting.set(true);
    this.apiError.set(null);

    this.clientService.register(this.email, this.password, this.passwordConfirmation).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response: RegisterResponse) => {
        this.isSubmitting.set(false);
        this.toastService.success(
          'Sikeres regisztráció!',
          'Mostantól email és jelszóval léphetsz be.'
        );
        onSuccess(response.token);
      },
      error: (error: Error) => {
        this.isSubmitting.set(false);
        this.apiError.set(error.message);
      }
    });
  }
}
