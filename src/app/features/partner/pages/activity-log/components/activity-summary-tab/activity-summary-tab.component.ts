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

  readonly filterConfigs = signal<FilterConfig[]>([
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
    defaultFilters: { reviewed: '' },
    defaultSortBy: 'last_activity_at',
    defaultSortDir: 'desc',
    onStateChange: () => this.loadData(),
  });

  ngOnInit(): void {
    this.loadData();
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
      .subscribe(() => {
        this.selectedIds.set(new Set());
        this.loadData();
      });
  }

  unmarkReviewed(ids: number[]): void {
    this.activityService.toggleProjectReview(ids, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.selectedIds.set(new Set());
        this.loadData();
      });
  }

  markSelectedReviewed(): void {
    this.markReviewed([...this.selectedIds()]);
  }
}
