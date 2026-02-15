import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoggerService } from '@core/services/logger.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PsCheckboxComponent } from '@shared/components/form';
import { SubscriptionService, AccountStatusResponse } from '../../../services/subscription.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ICONS, TEAM_MEMBER_ROLES } from '../../../../../shared/constants';

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
  imports: [DatePipe, FormsModule, LucideAngularModule, MatTooltipModule, PsCheckboxComponent],
  templateUrl: './account-delete.component.html',
  styleUrls: ['./account-delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountDeleteComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
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
    this.subscriptionService.getAccountStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (status) => {
        this.accountStatus.set(status);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Failed to load account status', err);
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
    this.subscriptionService.deleteAccount().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadAccountStatus();
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Failed to delete account', err);
        this.actionLoading.set(false);
      }
    });
  }

  cancelDeletion(): void {
    this.actionLoading.set(true);
    this.subscriptionService.cancelDeletion().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadAccountStatus();
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Failed to cancel deletion', err);
        this.actionLoading.set(false);
      }
    });
  }

}
