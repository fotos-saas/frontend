import { Component, inject, signal, ChangeDetectionStrategy, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoggerService } from '@core/services/logger.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PsCheckboxComponent } from '@shared/components/form';
import { SubscriptionService } from '../../../services/subscription.service';
import { ICONS } from '../../../../../shared/constants';

/**
 * Fiók szüneteltetés oldal
 *
 * - Ha NEM szünetel: info kártya + megerősítő checkbox + gomb
 * - Ha MÁR szünetel: szünetelés infó + újraaktiválás gomb
 */
@Component({
  selector: 'app-account-pause',
  standalone: true,
  imports: [RouterLink, FormsModule, LucideAngularModule, PsCheckboxComponent],
  templateUrl: './account-pause.component.html',
  styleUrls: ['./account-pause.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountPauseComponent {
  private readonly logger = inject(LoggerService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  loading = signal(true);
  actionLoading = signal(false);
  confirmChecked = signal(false);

  /** Szüneteltetett-e a fiók */
  isPaused = signal(false);

  /** Mióta szünetel (ISO string) */
  pausedAt = signal<string | null>(null);

  /** Szüneteltetés óta eltelt napok */
  pausedDays = computed(() => {
    const paused = this.pausedAt();
    if (!paused) return 0;
    const diff = Date.now() - new Date(paused).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  });

  constructor() {
    this.loadSubscriptionStatus();
  }

  private loadSubscriptionStatus(): void {
    this.loading.set(true);
    this.subscriptionService.clearCache();
    this.subscriptionService.getSubscription().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (info) => {
        this.isPaused.set(info.status === 'paused');
        this.pausedAt.set(info.paused_at ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Nem sikerült betölteni az előfizetés adatait', err);
        this.loading.set(false);
      }
    });
  }

  pauseAccount(): void {
    this.actionLoading.set(true);
    this.subscriptionService.pause().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.subscriptionService.clearCache();
        this.loadSubscriptionStatus();
        this.confirmChecked.set(false);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Nem sikerült szüneteltetni a fiókot', err);
        this.actionLoading.set(false);
      }
    });
  }

  unpauseAccount(): void {
    this.actionLoading.set(true);
    this.subscriptionService.unpause().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.subscriptionService.clearCache();
        this.loadSubscriptionStatus();
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Nem sikerült újraaktiválni a fiókot', err);
        this.actionLoading.set(false);
      }
    });
  }
}
