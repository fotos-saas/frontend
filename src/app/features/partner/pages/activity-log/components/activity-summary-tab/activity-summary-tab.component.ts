import { Component, signal, computed, inject, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { SmartFilterBarComponent, SearchConfig, SortDef } from '@shared/components/smart-filter-bar';
import { FilterConfig } from '@shared/components/expandable-filters';
import { ListPaginationComponent } from '@shared/components/list-pagination/list-pagination.component';
import { useFilterState } from '@shared/utils/use-filter-state';
import {
  PartnerActivityService,
  ProjectActivitySummary,
  ActivitySummaryFilters,
} from '../../../../services/partner-activity.service';
import { TeamService } from '../../../../services/team.service';
import { generateYearOptions, getCurrentGraduationYear } from '@shared/utils/year-options.util';

@Component({
  selector: 'app-activity-summary-tab',
  standalone: true,
  imports: [LucideAngularModule, DatePipe, FormsModule, MatTooltipModule, SmartFilterBarComponent, ListPaginationComponent],
  templateUrl: './activity-summary-tab.component.html',
  styleUrl: './activity-summary-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitySummaryTabComponent implements OnInit {
  private activityService = inject(PartnerActivityService);
  private teamService = inject(TeamService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  readonly ICONS = ICONS;

  items = signal<ProjectActivitySummary[]>([]);
  total = signal(0);
  lastPage = signal(1);
  selectedIds = signal<Set<number>>(new Set());
  private loadSub?: Subscription;

  allSelected = computed(() => {
    const ids = this.selectedIds();
    const all = this.items();
    return all.length > 0 && all.every(i => ids.has(i.project_id));
  });

  hasSelection = computed(() => this.selectedIds().size > 0);

  readonly searchConfig: SearchConfig = {
    placeholder: 'Projekt keresése...',
  };

  readonly yearOptions = generateYearOptions();

  readonly filterConfigs = signal<FilterConfig[]>([
    {
      id: 'graduation_year',
      label: 'Évfolyam',
      icon: 'calendar',
      options: [{ value: '', label: 'Mind' }, ...this.yearOptions],
    },
    {
      id: 'causer_id',
      label: 'Felhasználó',
      icon: 'user',
      options: [{ value: '', label: 'Mindenki' }],
    },
    {
      id: 'reviewed',
      label: 'Állapot',
      icon: 'check-circle',
      options: [
        { value: '', label: 'Mind' },
        { value: 'no', label: 'Új változás' },
        { value: 'yes', label: 'Átnézve' },
      ],
    },
  ]);

  readonly sortDef: SortDef = {
    options: [
      { value: 'last_activity_at', label: 'Utolsó aktivitás' },
      { value: 'activities_count', label: 'Aktivitások száma' },
      { value: 'name', label: 'Név' },
    ],
  };

  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'activity-summary' },
    defaultFilters: { reviewed: '', graduation_year: getCurrentGraduationYear().toString(), causer_id: '' },
    defaultSortBy: 'last_activity_at',
    defaultSortDir: 'desc',
    onStateChange: () => this.loadData(),
  });

  ngOnInit(): void {
    this.loadTeamMembers();
    this.loadData();
  }

  private loadTeamMembers(): void {
    this.teamService.getTeam()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const memberOptions = res.members.map(m => ({
            value: String(m.userId),
            label: m.name,
          }));
          this.filterConfigs.update(configs => configs.map(c =>
            c.id === 'causer_id'
              ? { ...c, options: [{ value: '', label: 'Mindenki' }, ...memberOptions] }
              : c,
          ));
        },
      });
  }

  loadData(): void {
    this.loadSub?.unsubscribe();
    this.filterState.loading.set(true);

    const f = this.filterState.filters();
    const filters: ActivitySummaryFilters = {
      page: this.filterState.page(),
      per_page: 20,
      sort_by: this.filterState.sortBy() || 'last_activity_at',
      sort_dir: this.filterState.sortDir() as 'asc' | 'desc',
    };

    if (this.filterState.search()) filters.search = this.filterState.search();
    if (f['graduation_year']) filters.graduation_year = parseInt(f['graduation_year'], 10);
    if (f['causer_id']) filters.causer_id = parseInt(f['causer_id'], 10);
    if (f['reviewed']) filters.reviewed = f['reviewed'] as 'yes' | 'no';

    this.loadSub = this.activityService.getActivitySummary(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.lastPage.set(res.pagination.last_page);
          this.total.set(res.pagination.total);
          this.filterState.loading.set(false);
        },
        error: () => {
          this.filterState.loading.set(false);
        },
      });
  }

  goToProject(projectId: number): void {
    this.router.navigate(['/partner/projects', projectId]);
  }

  toggleSelect(projectId: number): void {
    this.selectedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.items().map(i => i.project_id)));
    }
  }

  markReviewed(ids: number[]): void {
    this.activityService.toggleProjectReview(ids, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.selectedIds.set(new Set());
          this.loadData();
        },
        error: (err) => console.error('[ActivitySummary] markReviewed hiba:', err),
      });
  }

  unmarkReviewed(ids: number[]): void {
    this.activityService.toggleProjectReview(ids, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.selectedIds.set(new Set());
          this.loadData();
        },
        error: (err) => console.error('[ActivitySummary] unmarkReviewed hiba:', err),
      });
  }

  markSelectedReviewed(): void {
    this.markReviewed([...this.selectedIds()]);
  }
}
