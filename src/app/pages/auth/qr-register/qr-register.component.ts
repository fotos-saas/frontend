import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, QrCodeValidationResponse } from '../../../core/services/auth.service';
import { AuthLayoutComponent } from '../../../shared/components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-qr-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, AuthLayoutComponent],
  templateUrl: './qr-register.component.html',
  styleUrls: ['./qr-register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrRegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  isValidating = signal(true);
  isLoading = signal(false);
  invalidCode = signal(false);
  errorMessage = signal<string | null>(null);
  projectInfo = signal<QrCodeValidationResponse['project'] | null>(null);

  private code = '';

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['']
  });

  ngOnInit() {
    // Get code from query params
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.code = params['code'];

        if (!this.code) {
          this.isValidating.set(false);
          this.invalidCode.set(true);
          this.errorMessage.set('Hiányzó regisztrációs kód.');
          return;
        }

        // Validate code
        this.authService.validateQrCode(this.code)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              this.isValidating.set(false);

              if (response.valid && response.project) {
                this.projectInfo.set(response.project);
              } else {
                this.invalidCode.set(true);
                this.errorMessage.set(response.message || 'Érvénytelen regisztrációs kód.');
              }
            },
            error: (error) => {
              this.isValidating.set(false);
              this.invalidCode.set(true);
              this.errorMessage.set(error.message);
            }
          });
      });
  }

  onSubmit() {
    if (this.form.invalid || !this.code) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.registerFromQr({
      code: this.code,
      name: this.form.value.name!,
      email: this.form.value.email!,
      phone: this.form.value.phone || undefined
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      }
    });
  }
}
