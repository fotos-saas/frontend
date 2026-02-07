import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import {
  DASHBOARD_SERVICE,
  DASHBOARD_ROUTE_PREFIX,
  DASHBOARD_SUBTITLE,
  DASHBOARD_STAT_CARDS,
  DASHBOARD_QUICK_ACTIONS,
} from './dashboard.tokens';
import { DashboardStats, DashboardProjectItem, StatCardConfig, QuickActionConfig } from './dashboard.types';

/**
 * Generikus Dashboard Wrapper - közös irányítópult komponens.
 *
 * Használat:
 * ```typescript
 * @Component({
 *   providers: [
 *     { provide: DASHBOARD_SERVICE, useExisting: PartnerService },
 *     { provide: DASHBOARD_ROUTE_PREFIX, useValue: '/partner' },
 *     { provide: DASHBOARD_SUBTITLE, useValue: 'Üdvözöljük!' },
 *     { provide: DASHBOARD_STAT_CARDS, useValue: [...] },
 *     { provide: DASHBOARD_QUICK_ACTIONS, useValue: [...] },
 *   ],
 *   template: `<app-dashboard-wrapper />`
 * })
 * ```
 */
@Component({
  selector: 'app-dashboard-wrapper',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './dashboard-wrapper.component.html',
  styleUrls: ['./dashboard-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardWrapperComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private dashboardService = inject(DASHBOARD_SERVICE);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly routePrefix = inject(DASHBOARD_ROUTE_PREFIX);
  readonly subtitle = inject(DASHBOARD_SUBTITLE);
  readonly statCards = inject(DASHBOARD_STAT_CARDS);
  readonly quickActions = inject(DASHBOARD_QUICK_ACTIONS);

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  recentProjects = signal<DashboardProjectItem[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Stats betöltése
    this.dashboardService.getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
          this.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to load dashboard stats', err);
          this.loading.set(false);
        },
      });

    // Legutóbbi projektek
    this.dashboardService.getProjects({ per_page: 5, sort_by: 'created_at', sort_dir: 'desc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.recentProjects.set(response.data as DashboardProjectItem[]);
        },
        error: (err) => {
          this.logger.error('Failed to load recent projects', err);
        },
      });
  }

  getStatValue(key: string): number | string {
    return this.stats()?.[key] ?? 0;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
