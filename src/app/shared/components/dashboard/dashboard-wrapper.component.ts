import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
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
  template: `
    <div class="dashboard page-card">
      <header class="dashboard-header">
        <h1>Irányítópult</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </header>

      <!-- Stats Cards -->
      @if (loading()) {
        <div class="stats-grid skeleton">
          @for (card of statCards; track card.valueKey) {
            <div class="stat-card skeleton-shimmer"></div>
          }
        </div>
      } @else {
        <div class="stats-grid">
          @for (card of statCards; track card.valueKey) {
            <div
              class="stat-card"
              [class.stat-card--clickable]="card.clickable"
              (click)="card.clickable ? navigateTo(routePrefix + '/projects') : null"
            >
              <div class="stat-icon">
                <lucide-icon [name]="card.icon" [size]="28"></lucide-icon>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ getStatValue(card.valueKey) }}</span>
                <span class="stat-label">{{ card.label }}</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Quick Actions -->
      <section class="actions-section">
        <h2>Gyors műveletek</h2>
        <div class="actions-grid">
          @for (action of quickActions; track action.route) {
            <button
              class="action-btn"
              [class.action-btn--primary]="action.primary"
              [class.action-btn--secondary]="!action.primary"
              (click)="navigateTo(routePrefix + action.route)"
            >
              <lucide-icon [name]="action.icon" [size]="action.primary ? 22 : 20" class="action-icon"></lucide-icon>
              <span class="action-label">{{ action.label }}</span>
            </button>
          }
        </div>
      </section>

      <!-- Recent Projects -->
      @if (recentProjects().length > 0) {
        <section class="recent-section">
          <h2>Legutóbbi projektek</h2>
          <div class="recent-list">
            @for (project of recentProjects(); track project.id) {
              <div class="recent-item" (click)="navigateTo(routePrefix + '/projects/' + project.id)">
                <div class="recent-info">
                  <span class="recent-name">{{ project.name }}</span>
                  <span class="recent-school">{{ project.schoolName ?? 'Ismeretlen iskola' }}</span>
                </div>
                <div class="recent-meta">
                  @if (project.hasActiveQrCode) {
                    <span class="qr-badge">QR</span>
                  }
                </div>
              </div>
            }
          </div>
          <button class="view-all-btn" (click)="navigateTo(routePrefix + '/projects')">
            Összes projekt megtekintése →
          </button>
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 32px;
    }

    .dashboard-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .subtitle {
      color: #64748b;
      font-size: 1rem;
      margin: 0;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
    }

    .stat-card--clickable {
      cursor: pointer;
    }

    .stat-card--clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary, #2563eb);
      flex-shrink: 0;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Sections */
    .actions-section,
    .recent-section {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }

    .actions-section h2,
    .recent-section h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 16px 0;
    }

    /* Actions Grid */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border: none;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn--primary {
      background: var(--color-primary, #2563eb);
      color: #ffffff;
      padding: 20px 32px;
      font-size: 1rem;
    }

    .action-btn--primary:hover {
      background: var(--color-primary-light, #3b82f6);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
    }

    .action-btn--secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .action-btn--secondary:hover {
      background: #e2e8f0;
    }

    .action-btn--secondary .action-icon {
      color: #64748b;
    }

    .action-btn--primary .action-icon {
      color: #ffffff;
    }

    /* Recent Projects */
    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .recent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .recent-item:hover {
      background: #f1f5f9;
    }

    .recent-info {
      display: flex;
      flex-direction: column;
    }

    .recent-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9375rem;
    }

    .recent-school {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .recent-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .qr-badge {
      background: #dcfce7;
      color: #16a34a;
      font-size: 0.6875rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .view-all-btn {
      margin-top: 16px;
      background: none;
      border: none;
      color: #1e3a5f;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }

    .view-all-btn:hover {
      text-decoration: underline;
    }

    /* Skeleton Loading */
    .skeleton .stat-card {
      height: 100px;
      background: #e2e8f0;
    }

    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardWrapperComponent implements OnInit {
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
          console.error('Failed to load dashboard stats:', err);
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
          console.error('Failed to load recent projects:', err);
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
