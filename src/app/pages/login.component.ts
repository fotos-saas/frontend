import { Component, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { AuthLayoutComponent } from '../shared/components/auth-layout/auth-layout.component';

type LoginTab = 'code' | 'password';

/**
 * Tablo Login - Kombinált beléptető oldal
 * - 6-jegyű kód belépés
 * - Email/Jelszó belépés
 */
@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, AuthLayoutComponent]
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  /** Aktív tab */
  activeTab = signal<LoginTab>('code');

  /** 6-jegyű belépési kód */
  code = '';

  /** Email/Jelszó form */
  passwordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  /** Hibaüzenet */
  error = signal<string | null>(null);

  /** Betöltés állapot */
  loading = signal(false);

  /** Regisztráció engedélyezve (backend settings) */
  registrationEnabled = signal(false);

  /** Subject for unsubscribe pattern */
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // Ellenőrizzük a regisztráció státuszt (opcionális)
    this.checkRegistrationEnabled();
  }

  /**
   * Tab váltás kezelése
   */
  setActiveTab(tab: LoginTab): void {
    this.activeTab.set(tab);
    this.error.set(null);
  }

  /**
   * Kódos bejelentkezés kezelése
   */
  onCodeLogin(): void {
    // Validáció
    if (!this.code || this.code.length !== 6) {
      this.error.set('Add meg a 6-jegyű kódot');
      return;
    }

    // Csak számokat fogadunk el
    if (!/^[0-9]{6}$/.test(this.code)) {
      this.error.set('A kód csak számokat tartalmazhat');
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    // API hívás az AuthService-en keresztül
    this.authService.login(this.code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          // Sikeres bejelentkezés - irányítás a login típus alapján
          if (response.loginType === 'client') {
            // Partner ügyfél → client welcome oldal
            this.router.navigate(['/client/welcome']);
          } else {
            // Tablo diák → tablo workflow
            this.router.navigate(['/home']);
          }
        },
        error: (err: Error) => {
          this.loading.set(false);
          this.error.set(err.message);
        }
      });
  }

  /**
   * Email/Jelszó bejelentkezés kezelése
   */
  onPasswordLogin(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    const { email, password } = this.passwordForm.value;

    this.authService.loginWithPassword(email!, password!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Role-alapú átirányítás
          if (response.user.roles?.includes('partner')) {
            this.router.navigate(['/partner/dashboard']);
          } else if (response.user.roles?.includes('marketer')) {
            this.router.navigate(['/marketer/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (err: Error) => {
          this.loading.set(false);
          this.error.set(err.message);
        }
      });
  }

  /**
   * Regisztráció státusz ellenőrzése
   */
  private checkRegistrationEnabled(): void {
    // TODO: Lehetne backend endpoint ami visszaadja a beállításokat
    // Egyelőre engedélyezzük a linket, backend úgyis ellenőrzi
    this.registrationEnabled.set(true);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
