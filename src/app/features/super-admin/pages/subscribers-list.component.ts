import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SuperAdminService, SubscriberListItem } from '../services/super-admin.service';
import { ICONS, PLAN_FILTER_OPTIONS } from '../../../shared/constants';
import { useFilterState } from '../../../shared/utils/use-filter-state';

/**
 * Előfizetők lista - Super Admin felületen.
 * Partner modellek megjelenítése előfizetési adatokkal.
 */
@Component({
  selector: 'app-subscribers-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule
  ],
  templateUrl: './subscribers-list.component.html',
  styleUrl: './subscribers-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscribersListComponent implements OnInit {
  private readonly service = inject(SuperAdminService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly ICONS = ICONS;

  // Szűrő opciók - központi konstansból
  readonly planOptions = PLAN_FILTER_OPTIONS;

  readonly statusOptions = [
    { value: '', label: 'Összes státusz' },
    { value: 'active', label: 'Aktív' },
    { value: 'trial', label: 'Próba' },
    { value: 'paused', label: 'Szünetel' },
    { value: 'canceling', label: 'Lemondva' },
  ];

  // Filter state - központosított perzisztencia rendszerrel
  readonly filterState = useFilterState({
    context: { type: 'super-admin', page: 'subscribers' },
    defaultFilters: { plan: '', status: '' },
    defaultSortBy: 'created_at',
    defaultSortDir: 'desc',
    validation: {
      sortByOptions: ['name', 'email', 'plan', 'subscription_ends_at', 'created_at'],
      filterOptions: {
        plan: ['alap', 'iskola', 'studio'],
        status: ['active', 'paused', 'canceling', 'trial'],
      }
    },
    onStateChange: () => this.loadSubscribers(),
  });

  subscribers = signal<SubscriberListItem[]>([]);
  totalPages = signal(1);
  totalSubscribers = signal(0);

  ngOnInit(): void {
    this.loadSubscribers();
  }

  loadSubscribers(): void {
    this.filterState.loading.set(true);

    this.service.getSubscribers({
      page: this.filterState.page(),
      per_page: 18,
      search: this.filterState.search() || undefined,
      plan: this.filterState.filters().plan || undefined,
      status: this.filterState.filters().status || undefined,
      sort_by: this.filterState.sortBy(),
      sort_dir: this.filterState.sortDir(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.subscribers.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalSubscribers.set(response.total);
          this.filterState.loading.set(false);
        },
        error: () => {
          this.filterState.loading.set(false);
        }
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filterState.setPage(page);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Aktív',
      trial: 'Próba',
      paused: 'Szünetel',
      canceling: 'Lemondva',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'status-badge--green',
      trial: 'status-badge--blue',
      paused: 'status-badge--yellow',
      canceling: 'status-badge--red',
    };
    return classes[status] || '';
  }

  getPlanClass(plan: string): string {
    const classes: Record<string, string> = {
      alap: 'plan-badge--gray',
      iskola: 'plan-badge--blue',
      studio: 'plan-badge--purple',
    };
    return classes[plan] || '';
  }

  formatPrice(price: number, cycle: string): string {
    const formatted = new Intl.NumberFormat('hu-HU').format(price);
    const suffix = cycle === 'yearly' ? '/év' : '/hó';
    return `${formatted} Ft${suffix}`;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Trial tooltip szöveg számítása
   */
  getTrialTooltip(subscriber: SubscriberListItem): string {
    if (subscriber.subscriptionStatus !== 'trial' || !subscriber.subscriptionEndsAt) {
      return '';
    }
    const endDate = new Date(subscriber.subscriptionEndsAt);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return `Próba: ${daysRemaining} nap van hátra`;
  }

  /**
   * Navigálás az előfizető részletekhez
   */
  openSubscriber(subscriber: SubscriberListItem): void {
    this.router.navigate(['/super-admin/subscribers', subscriber.id]);
  }
}
