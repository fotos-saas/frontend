import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DevLoginService, DevLoginConsumeResponse } from '../../core/services/dev-login.service';
import { TabloAuthService } from '../../core/services/auth/tablo-auth.service';

@Component({
  selector: 'app-dev-login',
  standalone: true,
  imports: [],
  template: `
    <div class="dev-login">
      <div class="dev-login__card">
        @if (loading) {
          <div class="dev-login__loading">
            <svg class="dev-login__spinner" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"></circle>
            </svg>
            <span class="dev-login__text">Dev bejelentkezés...</span>
          </div>
        }
        @if (error) {
          <div class="dev-login__error">
            <svg class="dev-login__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span class="dev-login__text">{{ error }}</span>
            <p class="dev-login__hint">A dev login link egyszer használatos és 5 percig érvényes.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dev-login {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      padding: 1rem;
    }
    .dev-login__card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      text-align: center;
      min-width: 300px;
      border: 2px solid #3b82f6;
    }
    .dev-login__loading,
    .dev-login__error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .dev-login__spinner {
      width: 48px;
      height: 48px;
      color: #3b82f6;
      animation: spin 1s linear infinite;
    }
    .dev-login__spinner circle {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: 0;
      animation: dash 1.5s ease-in-out infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes dash {
      0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
      50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
    }
    .dev-login__icon {
      width: 48px;
      height: 48px;
      color: #ef4444;
    }
    .dev-login__text {
      font-size: 1rem;
      color: #64748b;
    }
    .dev-login__hint {
      font-size: 0.875rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DevLoginComponent implements OnInit {
  loading = true;
  error: string | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private readonly devLoginService = inject(DevLoginService);
  private readonly tabloAuth = inject(TabloAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.loading = false;
      this.error = 'Érvénytelen dev login link';
      return;
    }

    this.devLoginService.consumeDevLogin(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.handleLoginResponse(response),
        error: (err: Error) => {
          this.loading = false;
          this.error = err.message || 'Hiba történt a bejelentkezés során';
        }
      });
  }

  private handleLoginResponse(response: DevLoginConsumeResponse): void {
    switch (response.loginType) {
      case 'tablo':
        this.tabloAuth.storeAuthData(response as any, 'code');
        this.router.navigate(['/home']);
        break;

      case 'client':
        if (response.token && response.client) {
          sessionStorage.setItem('client_token', response.token);
          sessionStorage.setItem('client_info', JSON.stringify(response.client));
          if (response.albums) {
            sessionStorage.setItem('client_albums', JSON.stringify(response.albums));
          }
        }
        this.router.navigate(['/client/welcome']);
        break;

      default:
        // Partner/team member login
        sessionStorage.setItem('marketer_token', response.token);
        sessionStorage.setItem('marketer_user', JSON.stringify(response.user));
        this.router.navigate(['/partner/dashboard']);
        break;
    }
  }
}
