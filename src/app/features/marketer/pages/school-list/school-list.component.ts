import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarketerService, SchoolListItem, PaginatedResponse } from '../../services/marketer.service';
import { useFilterState, FilterStateApi } from '../../../../shared/utils/use-filter-state';

/**
 * Marketer School List - Iskolák paginált listája.
 */
@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './school-list.component.html',
  styleUrls: ['./school-list.component.scss'],
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
