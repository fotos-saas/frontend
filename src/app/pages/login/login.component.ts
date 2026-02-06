import { Component, OnInit, signal, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout.component';
import { BiometricService } from '../../core/services/biometric.service';
import { CapacitorService } from '../../core/services/capacitor.service';
import { ElectronService } from '../../core/services/electron.service';
import { LucideAngularModule } from 'lucide-angular';

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
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, RouterModule, AuthLayoutComponent, LucideAngularModule]
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly biometricService = inject(BiometricService);
  readonly capacitorService = inject(CapacitorService);
  readonly electronService = inject(ElectronService);

  /** Aktív tab */
  activeTab = signal<LoginTab>('code');

  /** Biometrikus bejelentkezés elérhető (mobil) */
  biometricAvailable = signal(false);

  /** Biometrikus bejelentkezés betöltés */
  biometricLoading = signal(false);

  /** Electron auto-login elérhető */
  electronAutoLoginAvailable = signal(false);

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

  constructor() {
    // Árva fiók hiba kezelése (error interceptor / partner guard redirect)
    const errorParam = this.route.snapshot.queryParamMap.get('error');
    if (errorParam === 'no_partner') {
      this.error.set('Érvénytelen fiók. Kérjük, lépj kapcsolatba az adminisztrátorral.');
      this.activeTab.set('password');
    }

    // Ellenőrizzük a regisztráció státuszt (opcionális)
    this.checkRegistrationEnabled();
  }

  async ngOnInit(): Promise<void> {
    // Check biometric availability on mobile
    await this.checkBiometricAvailability();

    // Check Electron auto-login availability
    await this.checkElectronAutoLogin();
  }

  /**
   * Check if biometric login is available (mobile)
   */
  private async checkBiometricAvailability(): Promise<void> {
    if (!this.capacitorService.isNative()) {
      return;
    }

    const isAvailable = await this.biometricService.checkAvailability();
    if (isAvailable) {
      const hasCredentials = await this.biometricService.hasStoredCredentials();
      this.biometricAvailable.set(hasCredentials);
    }
  }

  /**
   * Check if Electron auto-login is available (desktop)
   * Tries to auto-login if credentials are stored
   */
  private async checkElectronAutoLogin(): Promise<void> {
    if (!this.electronService.isElectron) {
      return;
    }

    const hasCredentials = await this.electronService.hasCredentials();
    if (hasCredentials) {
      this.electronAutoLoginAvailable.set(true);
      // Auto-login on desktop app start
      this.performElectronAutoLogin();
    }
  }

  /**
   * Auto-login using stored Keychain credentials (Electron)
   */
  private async performElectronAutoLogin(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const credentials = await this.electronService.getCredentials();
      if (!credentials) {
        this.loading.set(false);
        return;
      }

      this.authService.loginWithPassword(credentials.username, credentials.password)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.loading.set(false);
            this.navigateByRole(response.user.roles);
          },
          error: async (err: Error) => {
            this.loading.set(false);
            // Credentials might be outdated - delete them
            await this.electronService.deleteCredentials();
            this.electronAutoLoginAvailable.set(false);
            // Auto-login failed, credentials cleared
          }
        });
    } catch {
      this.loading.set(false);
    }
  }

  /**
   * Biometrikus bejelentkezés kezelése
   */
  async onBiometricLogin(): Promise<void> {
    this.biometricLoading.set(true);
    this.error.set(null);

    try {
      const credentials = await this.biometricService.biometricLogin();

      if (!credentials) {
        this.biometricLoading.set(false);
        return; // User cancelled or auth failed
      }

      // Login with stored credentials
      this.authService.loginWithPassword(credentials.username, credentials.password)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.biometricLoading.set(false);
            this.navigateByRole(response.user.roles);
          },
          error: (err: Error) => {
            this.biometricLoading.set(false);
            this.error.set(err.message);
            // If login fails, credentials might be outdated - delete them
            this.biometricService.deleteCredentials();
            this.biometricAvailable.set(false);
          }
        });
    } catch {
      this.biometricLoading.set(false);
      this.error.set('Biometrikus azonosítás sikertelen');
    }
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (response) => {
          this.loading.set(false);

          // Store credentials for biometric login (mobile) or Keychain (desktop)
          if (this.passwordForm.value.rememberMe) {
            if (this.biometricService.isAvailable()) {
              await this.biometricService.storeCredentials(email!, password!);
            }
            if (this.electronService.isElectron) {
              await this.electronService.storeCredentials(email!, password!);
            }
          }

          this.navigateByRole(response.user.roles);
        },
        error: (err: Error) => {
          this.loading.set(false);
          this.error.set(err.message);
        }
      });
  }

  /**
   * Role-alapú átirányítás
   */
  private navigateByRole(roles?: string[]): void {
    if (roles?.includes('super_admin')) {
      this.router.navigate(['/super-admin/dashboard']);
    } else if (roles?.includes('partner')) {
      this.router.navigate(['/partner/dashboard']);
    } else if (roles?.includes('designer')) {
      this.router.navigate(['/designer/dashboard']);
    } else if (roles?.some(r => ['marketer', 'printer', 'assistant'].includes(r))) {
      // Többi csapattag egyelőre partner URL-en (később saját URL)
      this.router.navigate(['/partner/dashboard']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  /**
   * Regisztráció státusz ellenőrzése
   */
  private checkRegistrationEnabled(): void {
    // TODO: Lehetne backend endpoint ami visszaadja a beállításokat
    // Egyelőre engedélyezzük a linket, backend úgyis ellenőrzi
    this.registrationEnabled.set(true);
  }
}
