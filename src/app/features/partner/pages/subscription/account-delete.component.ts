import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionService, AccountStatusResponse } from '../../services/subscription.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ICONS } from '../../../../shared/constants/icons.constants';

/** Csapattag role-ok */
const TEAM_MEMBER_ROLES = ['designer', 'marketer', 'printer', 'assistant'];

/**
 * Account Delete Page
 *
 * Fiók törlése (danger zone):
 * - Fiók törlés gomb (soft delete, 30 nap retention)
 * - Törlés visszavonása lehetőség
 * - Figyelmeztetések a következményekről
 */
@Component({
  selector: 'app-account-delete',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTooltipModule],
  template: `
    <div class="account-delete-page page-card">
      <h1 class="page-title">
        <lucide-icon [name]="ICONS.ALERT_TRIANGLE" [size]="24" />
        Fiók törlése
      </h1>

      @if (loading()) {
        <div class="loading-state">
          <div class="skeleton-card"></div>
        </div>
      } @else if (accountStatus()?.is_deleted) {
        <!-- Törlés folyamatban -->
        <div class="deletion-pending">
          <div class="pending-icon">
            <lucide-icon [name]="ICONS.CLOCK" [size]="48" />
          </div>
          <h2>Fiók törlés folyamatban</h2>
          <p>
            A fiókod törlésre van ütemezve.
            @if (accountStatus()?.days_until_permanent_deletion) {
              <strong>{{ accountStatus()?.days_until_permanent_deletion }} nap</strong> múlva véglegesen törlődik.
            }
          </p>

          <div class="pending-info">
            <div class="info-item">
              <lucide-icon [name]="ICONS.CALENDAR" [size]="18" />
              <span>Törlés időpontja: {{ formatDate(accountStatus()!.deletion_scheduled_at!) }}</span>
            </div>
          </div>

          <div class="pending-actions">
            <button
              class="btn btn--success"
              (click)="cancelDeletion()"
              [disabled]="actionLoading()"
            >
              @if (actionLoading()) {
                <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
              } @else {
                <lucide-icon [name]="ICONS.CHECK" [size]="18" />
              }
              Törlés visszavonása
            </button>
          </div>
        </div>
      } @else {
        <!-- Fiók törlés űrlap -->
        <div class="danger-zone">
          <div class="warning-banner">
            <lucide-icon [name]="ICONS.ALERT_TRIANGLE" [size]="24" />
            <div class="warning-content">
              <h3>Figyelem! Ez a művelet nem vonható vissza.</h3>
              <p>A fiók törlése után 30 napon belül visszavonhatod a törlést, utána minden adatod véglegesen törlődik.</p>
            </div>
          </div>

          <div class="consequences">
            <h3>A törlés következményei:</h3>
            <ul class="consequences-list">
              @if (isTeamMember()) {
                <!-- Csapattag: csak saját fiók törlése -->
                <li>
                  <lucide-icon [name]="ICONS.X" [size]="16" />
                  A fiókod véglegesen törlődik a rendszerből
                </li>
                <li>
                  <lucide-icon [name]="ICONS.X" [size]="16" />
                  Kilépsz a csapatból
                </li>
                <li>
                  <lucide-icon [name]="ICONS.X" [size]="16" />
                  A bejelentkezési adataid törlődnek
                </li>
              } @else {
                <!-- Partner (tulajdonos): minden törlődik -->
                <li>
                  <lucide-icon [name]="ICONS.X" [size]="16" />
                  Minden projektjed és osztályod törlődik
                </li>
                <li>
                  <lucide-icon [name]="ICONS.X" [size]="16" />
                  Az összes feltöltött kép véglegesen törlődik
                </li>
                <li>
                  <lucide-icon [name]="ICONS.X" [size]="16" />
                  A megrendelési előzmények elvesznek
                </li>
                <li>
                  <lucide-icon [name]="ICONS.X" [size]="16" />
                  Az előfizetésed automatikusan lemondásra kerül
                </li>
                <li>
                  <lucide-icon [name]="ICONS.X" [size]="16" />
                  A számlázási adatok törlődnek
                </li>
              }
            </ul>
          </div>

          <div class="confirmation-section">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [checked]="confirmChecked()"
                (change)="confirmChecked.set(!confirmChecked())"
              />
              <span>Megértettem és elfogadom a következményeket</span>
            </label>

            <button
              class="btn btn--danger"
              (click)="deleteAccount()"
              [disabled]="!confirmChecked() || actionLoading()"
            >
              @if (actionLoading()) {
                <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
              } @else {
                <lucide-icon [name]="ICONS.DELETE" [size]="18" />
              }
              Fiók törlése
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .account-delete-page {
      max-width: 700px;
      margin: 0 auto; /* Középre igazítás */
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.5rem;
      font-weight: 600;
      color: #dc2626;
      margin-bottom: 24px;
    }

    /* Danger Zone */
    .danger-zone {
      border: 2px solid #fecaca;
      border-radius: 12px;
      padding: 24px;
      background: #fef2f2;
    }

    .warning-banner {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #fee2e2;
      border-radius: 8px;
      margin-bottom: 24px;
      color: #dc2626;
    }

    .warning-banner lucide-icon {
      flex-shrink: 0;
    }

    .warning-content h3 {
      margin: 0 0 8px 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .warning-content p {
      margin: 0;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    /* Consequences */
    .consequences {
      margin-bottom: 24px;
    }

    .consequences h3 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 16px 0;
    }

    .consequences-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .consequences-list li {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #475569;
      font-size: 0.9375rem;
    }

    .consequences-list lucide-icon {
      color: #dc2626;
      flex-shrink: 0;
    }

    /* Confirmation */
    .confirmation-section {
      padding-top: 24px;
      border-top: 1px solid #fecaca;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 0.9375rem;
      color: #1e293b;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #dc2626;
    }

    /* Deletion Pending */
    .deletion-pending {
      text-align: center;
      padding: 48px 24px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 12px;
    }

    .pending-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      color: #d97706;
    }

    .deletion-pending h2 {
      font-size: 1.25rem;
      color: #92400e;
      margin: 0 0 12px 0;
    }

    .deletion-pending p {
      color: #a16207;
      margin: 0 0 24px 0;
    }

    .pending-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }

    .info-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #92400e;
      font-size: 0.875rem;
    }

    .pending-actions {
      display: flex;
      justify-content: center;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.9375rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn--danger {
      background: #dc2626;
      color: white;
    }

    .btn--danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn--success {
      background: #16a34a;
      color: white;
    }

    .btn--success:hover:not(:disabled) {
      background: #15803d;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .skeleton-card {
      height: 300px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 12px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton-card,
      .spin {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountDeleteComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly authService = inject(AuthService);
  protected readonly ICONS = ICONS;

  accountStatus = signal<AccountStatusResponse | null>(null);
  loading = signal(true);
  actionLoading = signal(false);
  confirmChecked = signal(false);

  /** Csapattag (nem tulajdonos) */
  protected isTeamMember = computed(() => {
    const roles = this.authService.getCurrentUser()?.roles ?? [];
    return TEAM_MEMBER_ROLES.some(r => roles.includes(r));
  });

  ngOnInit(): void {
    this.loadAccountStatus();
  }

  loadAccountStatus(): void {
    this.loading.set(true);
    this.subscriptionService.getAccountStatus().subscribe({
      next: (status) => {
        this.accountStatus.set(status);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load account status:', err);
        // Ha nincs ilyen endpoint, default érték
        this.accountStatus.set({
          is_deleted: false,
          deletion_scheduled_at: null,
          days_until_permanent_deletion: null
        });
        this.loading.set(false);
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('Biztosan törölni szeretnéd a fiókodat? Ez a művelet 30 napon belül visszavonható.')) {
      return;
    }

    this.actionLoading.set(true);
    this.subscriptionService.deleteAccount().subscribe({
      next: () => {
        this.loadAccountStatus();
        this.actionLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to delete account:', err);
        this.actionLoading.set(false);
      }
    });
  }

  cancelDeletion(): void {
    this.actionLoading.set(true);
    this.subscriptionService.cancelDeletion().subscribe({
      next: () => {
        this.loadAccountStatus();
        this.actionLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to cancel deletion:', err);
        this.actionLoading.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
