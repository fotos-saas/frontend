import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, QrCodeValidationResponse } from '../../../core/services/auth.service';
import { AuthLayoutComponent } from '../../../shared/components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-qr-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AuthLayoutComponent],
  template: `
    <app-auth-layout>
      <div class="auth-card">
        @if (isValidating()) {
          <div class="loading-state">
            <span class="spinner-large"></span>
            <h2>Kód ellenőrzése...</h2>
          </div>
        } @else if (invalidCode()) {
          <div class="error-state">
            <div class="icon-circle error">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd" />
              </svg>
            </div>
            <h2>Érvénytelen kód</h2>
            <p>{{ errorMessage() }}</p>
            <a routerLink="/login" class="btn-secondary">Vissza a bejelentkezéshez</a>
          </div>
        } @else {
          <!-- Valid code - show registration form -->
          <header class="auth-header">
            <h1>Regisztráció</h1>
            @if (projectInfo()) {
              <div class="project-info">
                <span class="project-badge">{{ projectInfo()!.schoolName }}</span>
                <span class="project-class">{{ projectInfo()!.className }} {{ projectInfo()!.classYear }}</span>
              </div>
            }
            <p class="auth-subtitle">Add meg az adataidat a csatlakozáshoz</p>
          </header>

          @if (errorMessage()) {
            <div class="alert alert-error" role="alert">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="name">Neved</label>
              <input
                type="text"
                id="name"
                formControlName="name"
                placeholder="Teljes neved"
                autocomplete="name"
                [class.invalid]="form.get('name')?.invalid && form.get('name')?.touched"
              />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <span class="error-text">Add meg a neved (min. 2 karakter)</span>
              }
            </div>

            <div class="form-group">
              <label for="email">Email címed</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                placeholder="pelda@email.hu"
                autocomplete="email"
                [class.invalid]="form.get('email')?.invalid && form.get('email')?.touched"
              />
              @if (form.get('email')?.errors?.['email'] && form.get('email')?.touched) {
                <span class="error-text">Érvénytelen email cím</span>
              }
            </div>

            <div class="form-group">
              <label for="phone">Telefonszámod (opcionális)</label>
              <input
                type="tel"
                id="phone"
                formControlName="phone"
                placeholder="+36 30 123 4567"
                autocomplete="tel"
              />
            </div>

            <button type="submit" class="btn-primary" [disabled]="isLoading() || form.invalid">
              @if (isLoading()) {
                <span class="spinner"></span>
                Csatlakozás...
              } @else {
                Csatlakozás
              }
            </button>
          </form>

          <footer class="auth-footer">
            <p>Már regisztráltál? <a routerLink="/login">Jelentkezz be</a></p>
          </footer>
        }
      </div>
    </app-auth-layout>
  `,
  styles: [`
    .auth-card {
      background: rgba(255, 255, 255, 0.95);
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -2px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(255, 255, 255, 0.5) inset;
    }

    .loading-state,
    .error-state {
      text-align: center;
      padding: 1rem 0;
    }

    .loading-state h2,
    .error-state h2 {
      font-size: 1.25rem;
      color: #1f2937;
      margin: 1rem 0 0.5rem 0;
    }

    .error-state p {
      color: #6b7280;
      margin: 0 0 1.5rem 0;
    }

    .icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }

    .icon-circle svg {
      width: 36px;
      height: 36px;
    }

    .icon-circle.error {
      background: #fef2f2;
      color: #ef4444;
    }

    .spinner-large {
      display: block;
      width: 48px;
      height: 48px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.75rem 0;
    }

    .auth-subtitle {
      color: #6b7280;
      margin: 0;
    }

    .project-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .project-badge {
      background: #eff6ff;
      color: #2563eb;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .project-class {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      font-size: 1rem;
      background: white;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input.invalid {
      border-color: #ef4444;
    }

    .error-text {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      display: block;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .alert svg {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }

    .alert-error {
      background: #fef2f2;
      color: #991b1b;
    }

    .btn-primary {
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-primary:active:not(:disabled) {
      transform: scale(0.98);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #f3f4f6;
      color: #374151;
      border: none;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: background 0.2s;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .auth-footer p {
      color: #6b7280;
      margin: 0;
    }

    .auth-footer a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }

    @media (max-width: 640px) {
      .auth-card {
        padding: 1.5rem;
        border-radius: 20px;
      }
    }
  `],
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
