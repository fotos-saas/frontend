import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

/**
 * Preview Login - Admin előnézeti linkkel történő bejelentkezés
 *
 * Egyszer használatos token - frissítésnél kijelentkeztet.
 */
@Component({
    selector: 'app-preview-login',
    standalone: true,
    imports: [],
    template: `
    <div class="preview-login">
      <div class="preview-login__card">
        <!-- Loading state -->
        @if (loading) {
        <div class="preview-login__loading">
          <svg class="preview-login__spinner" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"></circle>
          </svg>
          <span class="preview-login__text">Admin előnézet betöltése...</span>
        </div>
        }

        <!-- Error state -->
        @if (error) {
        <div class="preview-login__error">
          <svg class="preview-login__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span class="preview-login__text">{{ error }}</span>
          <p class="preview-login__hint">Az előnézeti link egyszer használatos.<br>Kérj új linket az adminisztrátortól.</p>
        </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .preview-login {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 1rem;
    }

    .preview-login__card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      text-align: center;
      min-width: 300px;
      border: 2px solid #f59e0b;
    }

    .preview-login__loading,
    .preview-login__error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .preview-login__spinner {
      width: 48px;
      height: 48px;
      color: #f59e0b;
      animation: spin 1s linear infinite;
    }

    .preview-login__spinner circle {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: 0;
      animation: dash 1.5s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes dash {
      0% {
        stroke-dasharray: 1, 150;
        stroke-dashoffset: 0;
      }
      50% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -35;
      }
      100% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -124;
      }
    }

    .preview-login__icon {
      width: 48px;
      height: 48px;
      color: #ef4444;
    }

    .preview-login__text {
      font-size: 1rem;
      color: #64748b;
    }

    .preview-login__hint {
      font-size: 0.875rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewLoginComponent implements OnInit {
  loading = true;
  error: string | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Token kinyerése az URL-ből
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.loading = false;
      this.error = 'Érvénytelen előnézeti link';
      return;
    }

    // Token validálása (64 karakter, hex)
    if (token.length !== 64 || !/^[a-f0-9]+$/i.test(token)) {
      this.loading = false;
      this.error = 'Érvénytelen előnézeti link formátum';
      return;
    }

    // Bejelentkezés a preview tokennel (egyszer használatos)
    this.authService.loginWithPreviewToken(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (err: Error) => {
          this.loading = false;
          this.error = err.message;
        }
      });
  }
}
