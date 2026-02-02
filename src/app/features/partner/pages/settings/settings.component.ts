import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionService, SubscriptionInfo } from '../../services/subscription.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { SubscriptionCardComponent } from './components/subscription-card.component';
import { SubscriptionActionsComponent } from './components/subscription-actions.component';
import { DeleteAccountDialogComponent } from './components/delete-account-dialog.component';

/**
 * Partner Settings Page
 *
 * Partner beállítások oldal:
 * - Előfizetés kezelés (csomag, státusz, műveletek)
 * - Fiók törlés (GDPR-kompatibilis soft delete)
 */
@Component({
  selector: 'app-partner-settings',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    SubscriptionCardComponent,
    SubscriptionActionsComponent,
    DeleteAccountDialogComponent
  ],
  template: `
    <div class="settings-page page-card">
      <header class="page-header">
        <h1>Beállítások</h1>
      </header>

      <!-- Előfizetés szekció -->
      <section class="settings-section">
        <h2>
          <lucide-icon [name]="ICONS.CREDIT_CARD" [size]="20" />
          Előfizetés
        </h2>

        @if (isLoading()) {
          <div class="loading-skeleton">
            <div class="skeleton-card"></div>
          </div>
        } @else if (subscriptionInfo()) {
          <app-subscription-card
            [info]="subscriptionInfo()!"
            (openPortal)="handleOpenPortal()"
          />

          <app-subscription-actions
            [info]="subscriptionInfo()!"
            [isActionLoading]="isActionLoading()"
            (onPause)="handlePause()"
            (onUnpause)="handleUnpause()"
            (onCancel)="handleCancel()"
            (onResume)="handleResume()"
          />
        } @else {
          <div class="empty-state">
            <p>Előfizetési adatok nem elérhetők.</p>
          </div>
        }
      </section>

      <!-- Veszélyes zóna szekció -->
      <section class="settings-section settings-section--danger">
        <h2>
          <lucide-icon [name]="ICONS.ALERT_TRIANGLE" [size]="20" />
          Veszélyes zóna
        </h2>
        <p class="section-description">
          A fiók törlése visszavonhatatlan. Minden adatod véglegesen törlődik 30 napon belül.
        </p>
        <button
          class="btn btn--danger"
          (click)="openDeleteDialog()"
          [disabled]="isActionLoading()"
        >
          <lucide-icon [name]="ICONS.DELETE" [size]="18" />
          Fiók törlése
        </button>
      </section>
    </div>

    <!-- Fiók törlés dialógus - page-card KÍVÜL! -->
    @if (showDeleteDialog()) {
      <app-delete-account-dialog
        [isSubmitting]="isDeleting()"
        (close)="closeDeleteDialog()"
        (confirm)="handleDeleteAccount()"
      />
    }
  `,
  styles: [`
    .settings-page {
      max-width: 800px;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }

    /* ============ Sections ============ */
    .settings-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .settings-section h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0 0 16px 0;
    }

    .section-description {
      color: var(--text-secondary, #64748b);
      font-size: 0.875rem;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    /* ============ Danger Section ============ */
    .settings-section--danger {
      border: 1px solid var(--color-danger-light, #fecaca);
      background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
    }

    .settings-section--danger h2 {
      color: var(--color-danger, #dc2626);
    }

    /* ============ Buttons ============ */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn--danger {
      background: var(--color-danger, #dc2626);
      color: white;
    }

    .btn--danger:hover:not(:disabled) {
      background: var(--color-danger-dark, #b91c1c);
    }

    /* ============ Loading ============ */
    .loading-skeleton {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .skeleton-card {
      height: 200px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      border-radius: 12px;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ============ Empty State ============ */
    .empty-state {
      text-align: center;
      padding: 32px;
      color: var(--text-secondary, #64748b);
    }

    /* ============ Reduced Motion ============ */
    @media (prefers-reduced-motion: reduce) {
      .btn,
      .skeleton-card {
        transition: none;
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerSettingsComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private toastService = inject(ToastService);

  protected readonly ICONS = ICONS;

  // State
  subscriptionInfo = signal<SubscriptionInfo | null>(null);
  isLoading = signal(true);
  isActionLoading = signal(false);
  showDeleteDialog = signal(false);
  isDeleting = signal(false);

  ngOnInit(): void {
    this.loadSubscriptionInfo();
  }

  private loadSubscriptionInfo(): void {
    this.isLoading.set(true);
    this.subscriptionService.getSubscription().subscribe({
      next: (info) => {
        this.subscriptionInfo.set(info);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load subscription:', err);
        this.isLoading.set(false);
        this.toastService.error('Hiba', 'Nem sikerült betölteni az előfizetési adatokat.');
      }
    });
  }

  handleOpenPortal(): void {
    this.isActionLoading.set(true);
    this.subscriptionService.openPortal().subscribe({
      next: (response) => {
        window.open(response.portal_url, '_blank');
        this.isActionLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to open portal:', err);
        this.toastService.error('Hiba', 'Nem sikerült megnyitni a fiókkezelőt.');
        this.isActionLoading.set(false);
      }
    });
  }

  handlePause(): void {
    this.isActionLoading.set(true);
    this.subscriptionService.pause().subscribe({
      next: (response) => {
        this.toastService.success('Siker', response.message);
        this.loadSubscriptionInfo();
        this.isActionLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to pause:', err);
        this.toastService.error('Hiba', 'Nem sikerült szüneteltetni az előfizetést.');
        this.isActionLoading.set(false);
      }
    });
  }

  handleUnpause(): void {
    this.isActionLoading.set(true);
    this.subscriptionService.unpause().subscribe({
      next: (response) => {
        this.toastService.success('Siker', response.message);
        this.loadSubscriptionInfo();
        this.isActionLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to unpause:', err);
        this.toastService.error('Hiba', 'Nem sikerült feloldani a szüneteltetést.');
        this.isActionLoading.set(false);
      }
    });
  }

  handleCancel(): void {
    this.isActionLoading.set(true);
    this.subscriptionService.cancel().subscribe({
      next: (response) => {
        this.toastService.success('Siker', response.message);
        this.loadSubscriptionInfo();
        this.isActionLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to cancel:', err);
        this.toastService.error('Hiba', 'Nem sikerült lemondani az előfizetést.');
        this.isActionLoading.set(false);
      }
    });
  }

  handleResume(): void {
    this.isActionLoading.set(true);
    this.subscriptionService.resume().subscribe({
      next: (response) => {
        this.toastService.success('Siker', response.message);
        this.loadSubscriptionInfo();
        this.isActionLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to resume:', err);
        this.toastService.error('Hiba', 'Nem sikerült folytatni az előfizetést.');
        this.isActionLoading.set(false);
      }
    });
  }

  openDeleteDialog(): void {
    this.showDeleteDialog.set(true);
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
  }

  handleDeleteAccount(): void {
    this.isDeleting.set(true);
    this.subscriptionService.deleteAccount().subscribe({
      next: (response) => {
        this.toastService.success('Fiók törölve', response.message);
        this.closeDeleteDialog();
        this.isDeleting.set(false);
        // Logout after deletion
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      },
      error: (err) => {
        console.error('Failed to delete account:', err);
        this.toastService.error('Hiba', 'Nem sikerült törölni a fiókot.');
        this.isDeleting.set(false);
      }
    });
  }
}
