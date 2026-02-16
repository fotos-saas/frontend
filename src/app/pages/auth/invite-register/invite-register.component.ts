import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthLayoutComponent } from '../../../shared/components/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/services/auth.service';
import { PsInputComponent } from '@shared/components/form';

interface InvitationValidationResponse {
  valid: boolean;
  message?: string;
  invitation?: {
    email: string;
    role: string;
    roleName: string;
    partnerName: string;
    expiresAt: string;
  };
  user_exists?: boolean;
}

interface InviteRegisterResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  token?: string;
}

/**
 * Meghívó kóddal történő regisztráció
 * URL: /auth/invite?code=INVITE-XXXXXX
 */
@Component({
  selector: 'app-invite-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, AuthLayoutComponent, PsInputComponent],
  templateUrl: './invite-register.component.html',
  styleUrls: ['./invite-register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InviteRegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  isValidating = signal(true);
  isLoading = signal(false);
  invalidCode = signal(false);
  registrationSuccess = signal(false);
  errorMessage = signal<string | null>(null);
  invitationInfo = signal<InvitationValidationResponse['invitation'] | null>(null);
  userExists = signal(false);

  /** Be van-e jelentkezve a user */
  isLoggedIn = signal(false);

  private code = '';

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required, this.passwordMatchValidator.bind(this)]]
  });

  ngOnInit() {
    // Bejelentkezett user ellenőrzése
    this.isLoggedIn.set(this.authService.hasToken());

    // Get code from query params
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.code = params['code'];

        if (!this.code) {
          this.isValidating.set(false);
          this.invalidCode.set(true);
          this.errorMessage.set('Hiányzó meghívó kód.');
          return;
        }

        // Validate code
        this.authService.validateInviteCode(this.code)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              this.isValidating.set(false);

              if (response.valid && response.invitation) {
                this.invitationInfo.set(response.invitation);
                this.userExists.set(!!response.user_exists);
                // Pre-fill email from invitation
                if (response.invitation.email) {
                  this.form.patchValue({ email: response.invitation.email });
                }
              } else {
                this.invalidCode.set(true);
                this.errorMessage.set(response.message || 'Érvénytelen vagy lejárt meghívó kód.');
              }
            },
            error: (error) => {
              this.isValidating.set(false);
              this.invalidCode.set(true);
              this.errorMessage.set(error.error?.message || 'Hiba történt a meghívó ellenőrzése során.');
            }
          });
      });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.form) return null;
    const password = this.form.get('password')?.value;
    const confirmPassword = control.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /** Bejelentkezett user meghívó elfogadása (auth:sanctum) — token rotáció + auto-switch */
  onAcceptAsLoggedIn() {
    if (!this.code) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.acceptInviteAsLoggedIn(this.code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.isLoading.set(false);
          if (response.token && response.user) {
            // Token + user frissítés sessionStorage-ban
            sessionStorage.setItem('marketer_token', response.token);
            sessionStorage.setItem('marketer_user', JSON.stringify(response.user));
            // Reload → új partner context
            window.location.href = '/partner/dashboard';
          } else {
            this.registrationSuccess.set(true);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Hiba történt a meghívó elfogadása során.');
        }
      });
  }

  /** Nem bejelentkezett, de létező user → accept_existing flag */
  onAcceptInvite() {
    if (!this.code || !this.invitationInfo()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.registerWithInvite({
      code: this.code,
      name: '',
      email: this.invitationInfo()!.email,
      password: '',
      password_confirmation: '',
      accept_existing: true
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.registrationSuccess.set(true);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Hiba történt a meghívó elfogadása során.');
        }
      });
  }

  onSubmit() {
    if (this.form.invalid || !this.code) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.registerWithInvite({
      code: this.code,
      name: this.form.value.name ?? '',
      email: this.form.value.email ?? '',
      password: this.form.value.password ?? '',
      password_confirmation: this.form.value.password_confirmation ?? ''
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.registrationSuccess.set(true);
        },
        error: (error) => {
          this.isLoading.set(false);
          if (error.error?.errors) {
            // Laravel validation errors
            const errors = error.error.errors;
            const firstError = Object.values(errors)[0];
            this.errorMessage.set(Array.isArray(firstError) ? firstError[0] : String(firstError));
          } else {
            this.errorMessage.set(error.error?.message || 'Hiba történt a regisztráció során.');
          }
        }
      });
  }
}
