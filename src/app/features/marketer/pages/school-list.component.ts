import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarketerService, SchoolListItem, PaginatedResponse } from '../services/marketer.service';
import { useFilterState, FilterStateApi } from '../../../shared/utils/use-filter-state';

/**
 * Marketer School List - Iskolák paginált listája.
 */
@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="school-list-page page-card">
      <header class="page-header">
        <h1>Iskolák</h1>
        <p class="subtitle">{{ totalSchools() }} iskola összesen</p>
      </header>

      <!-- Keresés és szűrés -->
      <div class="filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Keresés iskola neve vagy város alapján..."
            [ngModel]="filterState.search()"
            (ngModelChange)="filterState.setSearch($event)"
            class="search-input"
          />
          @if (filterState.search()) {
            <button class="clear-btn" (click)="filterState.clearSearch()">✕</button>
          }
        </div>

        <div class="filter-controls">
          <select [ngModel]="filterState.filters()['city'] || ''" (ngModelChange)="filterState.setFilter('city', $event)" class="filter-select">
            <option value="">Minden város</option>
            @for (city of cities(); track city) {
              <option [value]="city">{{ city }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Lista -->
      @if (filterState.loading()) {
        <div class="loading-state">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="school-card skeleton skeleton-shimmer"></div>
          }
        </div>
      } @else if (schools().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🏫</span>
          <h3>Nincs találat</h3>
          <p>Próbálj más keresési feltételekkel!</p>
        </div>
      } @else {
        <div class="school-grid">
          @for (school of schools(); track school.id; let i = $index) {
            <div
              class="school-card"
              [style.animation-delay]="i * 0.03 + 's'"
              (click)="viewSchoolProjects(school)"
            >
              <div class="school-icon">🏫</div>
              <div class="school-info">
                <h3 class="school-name">{{ school.name }}</h3>
                @if (school.city) {
                  <p class="school-city">📍 {{ school.city }}</p>
                }
              </div>
              <div class="school-stats">
                <span class="projects-count">
                  {{ school.projectsCount }}
                  <span class="count-label">projekt</span>
                </span>
              </div>
            </div>
          }
        </div>

        <!-- Paginálás -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button
              class="page-btn"
              [disabled]="filterState.page() === 1"
              (click)="goToPage(filterState.page() - 1)"
            >
              ← Előző
            </button>

            <div class="page-info">
              {{ filterState.page() }} / {{ totalPages() }} oldal
              <span class="total-count">({{ totalSchools() }} iskola)</span>
            </div>

            <button
              class="page-btn"
              [disabled]="filterState.page() === totalPages()"
              (click)="goToPage(filterState.page() + 1)"
            >
              Következő →
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .school-list-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }

    /* Filters */
    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      font-size: 1rem;
      opacity: 0.5;
    }

    .search-input {
      width: 100%;
      padding: 12px 40px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9375rem;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #1e3a5f;
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 1rem;
    }

    .filter-controls {
      display: flex;
      gap: 8px;
    }

    .filter-select {
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.875rem;
      background: #ffffff;
      cursor: pointer;
      min-width: 180px;
    }

    /* School Grid */
    .school-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .school-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      animation: fadeIn 0.3s ease forwards;
      opacity: 0;
    }

    .school-card:hover {
      border-color: #1e3a5f;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    @keyframes fadeIn {
      to { opacity: 1; }
    }

    .school-icon {
      font-size: 2rem;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .school-info {
      flex: 1;
      min-width: 0;
    }

    .school-name {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .school-city {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
    }

    .school-stats {
      text-align: right;
      flex-shrink: 0;
    }

    .projects-count {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .count-label {
      font-size: 0.6875rem;
      font-weight: 500;
      opacity: 0.9;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 32px;
      padding: 16px;
    }

    .page-btn {
      padding: 10px 20px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .page-btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #1e3a5f;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 0.875rem;
      color: #475569;
    }

    .total-count {
      color: #94a3b8;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 1.125rem;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      color: #64748b;
      margin: 0;
    }

    /* Loading State */
    .loading-state {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .loading-state .school-card {
      height: 96px;
      background: #e2e8f0;
      animation: none;
      opacity: 1;
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

    /* Responsive */
    @media (max-width: 640px) {
      .school-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchoolListComponent implements OnInit {
  private marketerService = inject(MarketerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Filter state - központosított perzisztencia rendszerrel
  readonly filterState = useFilterState({
    context: { type: 'marketer', page: 'schools' },
    defaultFilters: { city: '' },
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    onStateChange: () => this.loadSchools(),
  });

  schools = signal<SchoolListItem[]>([]);
  cities = signal<string[]>([]);
  totalPages = signal(1);
  totalSchools = signal(0);

  ngOnInit(): void {
    this.loadCities();
    this.loadSchools();
  }

  private loadCities(): void {
    this.marketerService.getCities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cities) => {
          this.cities.set(cities);
        },
        error: (err) => {
          console.error('Failed to load cities:', err);
        }
      });
  }

  loadSchools(): void {
    this.filterState.loading.set(true);

    const filters = this.filterState.filters();
    this.marketerService.getSchools({
      page: this.filterState.page(),
      per_page: 18,
      search: this.filterState.search() || undefined,
      city: filters['city'] || undefined
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.schools.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalSchools.set(response.total);
          this.filterState.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load schools:', err);
          this.filterState.loading.set(false);
        }
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filterState.setPage(page);
  }

  viewSchoolProjects(school: SchoolListItem): void {
    // Navigálás a projektek listára, iskola név szerinti szűréssel
    this.router.navigate(['/marketer/projects'], {
      queryParams: { search: school.name }
    });
  }
}
