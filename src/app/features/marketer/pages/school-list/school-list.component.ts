import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarketerService, SchoolListItem, PaginatedResponse } from '../../services/marketer.service';
import { useFilterState, FilterStateApi } from '../../../../shared/utils/use-filter-state';
import { SmartFilterBarComponent } from '../../../../shared/components/smart-filter-bar';
import { FilterConfig } from '../../../../shared/components/expandable-filters';
import { ListPaginationComponent } from '../../../../shared/components/list-pagination/list-pagination.component';

/**
 * Marketer School List - Iskolák paginált listája.
 */
@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [FormsModule, RouterModule, SmartFilterBarComponent, ListPaginationComponent],
  templateUrl: './school-list.component.html',
  styleUrls: ['./school-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchoolListComponent implements OnInit {
  private readonly logger = inject(LoggerService);
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

  readonly cityFilterConfigs = computed<FilterConfig[]>(() => {
    const opts = this.cities().map(c => ({ value: c, label: c }));
    return opts.length > 0
      ? [{ id: 'city', label: 'Minden város', options: opts }]
      : [];
  });

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
          this.logger.error('Failed to load cities', err);
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
          this.logger.error('Failed to load schools', err);
          this.filterState.loading.set(false);
        }
      });
  }

  viewSchoolProjects(school: SchoolListItem): void {
    // Navigálás a projektek listára, iskola név szerinti szűréssel
    this.router.navigate(['/marketer/projects'], {
      queryParams: { search: school.name }
    });
  }
}
