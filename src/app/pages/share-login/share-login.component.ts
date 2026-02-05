import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

/**
 * Share Login - Megosztási linkkel történő bejelentkezés
 *
 * Automatikusan bejelentkezteti a felhasználót a share token alapján.
 */
@Component({
    selector: 'app-share-login',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="share-login">
      <div class="share-login__card">
        <!-- Loading state -->
        <div class="share-login__loading" *ngIf="loading">
          <svg class="share-login__spinner" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"></circle>
          </svg>
          <span class="share-login__text">Bejelentkezés...</span>
        </div>

        <!-- Error state -->
        <div class="share-login__error" *ngIf="error">
          <svg class="share-login__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span class="share-login__text">{{ error }}</span>
          <a routerLink="/login" class="share-login__link">Belépés kóddal</a>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .share-login {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 1rem;
    }

    .share-login__card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      text-align: center;
      min-width: 280px;
    }

    .share-login__loading,
    .share-login__error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .share-login__spinner {
      width: 48px;
      height: 48px;
      color: #3b82f6;
      animation: spin 1s linear infinite;
    }

    .share-login__spinner circle {
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

    .share-login__icon {
      width: 48px;
      height: 48px;
      color: #f59e0b;
    }

    .share-login__text {
      font-size: 1rem;
      color: #64748b;
    }

    .share-login__link {
      display: inline-block;
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      background: #3b82f6;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.15s;
    }

    .share-login__link:hover {
      background: #2563eb;
    }
  `]
})
export class ShareLoginComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Token kinyerése az URL-ből
    const token = this.route.snapshot.paramMap.get('token');

    // Restore token kinyerése query paraméterből (magic link restore esetén)
    const restoreToken = this.route.snapshot.queryParamMap.get('restore');

    if (!token) {
      this.loading = false;
      this.error = 'Érvénytelen megosztási link';
      return;
    }

    // Token validálása (64 karakter, hex)
    if (token.length !== 64 || !/^[a-f0-9]+$/i.test(token)) {
      this.loading = false;
      this.error = 'Érvénytelen megosztási link formátum';
      return;
    }

    // Restore token validálása ha van (64 karakter, alphanumerikus)
    if (restoreToken && (restoreToken.length !== 64 || !/^[a-zA-Z0-9]+$/.test(restoreToken))) {
      // Érvénytelen restore token, figyelmen kívül hagyjuk
      console.warn('Invalid restore token format, ignoring');
    }

    // Bejelentkezés a share tokennel (és opcionálisan restore tokennel)
    const validRestoreToken = restoreToken && restoreToken.length === 64 && /^[a-zA-Z0-9]+$/.test(restoreToken)
      ? restoreToken
      : null;

    this.authService.loginWithShareToken(token, validRestoreToken)
      .pipe(takeUntil(this.destroy$))
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
