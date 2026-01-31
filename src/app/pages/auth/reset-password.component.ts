import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { PasswordStrengthComponent } from '../../shared/components/password-strength/password-strength.component';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PasswordStrengthComponent, AuthLayoutComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  invalidToken = signal(false);

  private token = '';

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required]
  }, {
    validators: this.passwordMatchValidator
  });

  ngOnInit() {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.token = params['token'];
        const email = params['email'];

        if (!this.token || !email) {
          this.invalidToken.set(true);
          return;
        }

        this.form.patchValue({ email });
      });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmation = form.get('password_confirmation')?.value;

    if (password && confirmation && password !== confirmation) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword({
      token: this.token,
      email: this.form.value.email!,
      password: this.form.value.password!,
      password_confirmation: this.form.value.password_confirmation!
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set(response.message);

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      }
    });
  }
}
