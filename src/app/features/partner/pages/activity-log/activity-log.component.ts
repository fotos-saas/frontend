import { Component, signal, inject, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICONS } from '@shared/constants/icons.constants';
import { SmartFilterBarComponent, SearchConfig, SortDef, SearchableFilterDef } from '@shared/components/smart-filter-bar';
import { FilterConfig } from '@shared/components/expandable-filters';
import { PsInputComponent } from '@shared/components/form/ps-input/ps-input.component';
import { ListPaginationComponent } from '@shared/components/list-pagination/list-pagination.component';
import { useFilterState } from '@shared/utils/use-filter-state';
import {
  PartnerActivityService,
  ActivityLogItem,
  ActivityLogFilters,
} from '../../services/partner-activity.service';
import { PartnerService } from '../../services/partner.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [LucideAngularModule, DatePipe, FormsModule, SmartFilterBarComponent, ListPaginationComponent, PsInputComponent],
  templateUrl: './activity-log.component.html',
  styleUrl: './activity-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogComponent implements OnInit {
  private activityService = inject(PartnerActivityService);
  private partnerService = inject(PartnerService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  readonly ICONS = ICONS;

  items = signal<ActivityLogItem[]>([]);
  total = signal(0);
  lastPage = signal(1);
  private loadSub?: Subscription;

  readonly searchConfig: SearchConfig = {
    placeholder: 'Keresés a naplóban...',
  };

  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'activity-log' },
    defaultFilters: {
      log_name: '',
      event: '',
      project_id: '',
      date_from: '',
      date_to: '',
    },
    defaultSortBy: '',
    defaultSortDir: 'desc',
    onStateChange: () => this.loadData(),
  });

  readonly filterConfigs = signal<FilterConfig[]>([
    {
      id: 'log_name',
      label: 'Kategória',
      icon: 'layers',
      options: [
        { value: '', label: 'Mind' },
        { value: 'partner', label: 'Partner' },
        { value: 'project', label: 'Projekt' },
        { value: 'photo', label: 'Fotó' },
        { value: 'album', label: 'Album' },
        { value: 'tablo', label: 'Tabló' },
        { value: 'billing', label: 'Számlázás' },
        { value: 'order', label: 'Rendelés' },
        { value: 'export', label: 'Export' },
        { value: 'email', label: 'E-mail' },
      ],
    },
    {
      id: 'event',
      label: 'Esemény',
      icon: 'zap',
      options: [
        { value: '', label: 'Mind' },
        { value: 'created', label: 'Létrehozva' },
        { value: 'updated', label: 'Módosítva' },
        { value: 'deleted', label: 'Törölve' },
        { value: 'other', label: 'Egyéb (pl. feltöltés)' },
      ],
    },
  ]);

  readonly projectSearchFilter = signal<SearchableFilterDef>({
    id: 'project_id',
    placeholder: 'Projekt keresése...',
    allLabel: 'Összes projekt',
    options: [],
  });

  readonly sortDef: SortDef = {
    options: [],
  };

  ngOnInit(): void {
    this.loadProjects();
    this.loadData();
  }

  private loadProjects(): void {
    this.partnerService.getProjectsAutocomplete()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => {
          this.projectSearchFilter.update(f => ({
            ...f,
            options: projects.map(p => ({ id: String(p.id), value: String(p.id), label: p.name })),
          }));
        },
      });
  }

  goToProject(projectId: number): void {
    this.router.navigate(['/partner/projects', projectId]);
  }

  loadData(): void {
    this.loadSub?.unsubscribe();
    this.filterState.loading.set(true);

    const f = this.filterState.filters();
    const filters: ActivityLogFilters = {
      page: this.filterState.page(),
      per_page: 20,
    };

    if (this.filterState.search()) filters.search = this.filterState.search();
    if (f['log_name']) filters.log_name = f['log_name'];
    if (f['event']) filters.event = f['event'];
    if (f['project_id']) filters.project_id = Number(f['project_id']);
    if (f['date_from']) filters.date_from = f['date_from'];
    if (f['date_to']) filters.date_to = f['date_to'];

    this.loadSub = this.activityService.getActivityLog(filters)
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

  getCategoryLabel(logName: string): string {
    const opt = this.filterConfigs().find(c => c.id === 'log_name')?.options?.find(o => o.value === logName);
    return opt?.label ?? logName;
  }

  getEventLabel(event: string | null): string {
    if (!event) return '';
    const map: Record<string, string> = {
      created: 'Létrehozva',
      updated: 'Módosítva',
      deleted: 'Törölve',
    };
    return map[event] ?? event;
  }

  getEventClass(event: string | null): string {
    const map: Record<string, string> = {
      created: 'badge-green',
      updated: 'badge-blue',
      deleted: 'badge-red',
    };
    return map[event ?? ''] ?? 'badge-gray';
  }

  formatChanges(changes: ActivityLogItem['changes']): string {
    if (!changes) return '';
    const parts: string[] = [];

    // Spatie diff: old → attributes
    if (changes.old && changes.attributes) {
      for (const key of Object.keys(changes.attributes)) {
        const oldVal = changes.old[key] ?? '—';
        const newVal = changes.attributes[key] ?? '—';
        parts.push(`${key}: ${oldVal} → ${newVal}`);
      }
    }

    // Kontextuális meta (pl. filename, version)
    if (changes.meta) {
      for (const [key, val] of Object.entries(changes.meta)) {
        parts.push(`${key}: ${val}`);
      }
    }

    // Forrás (overlay, desktop stb.)
    if (changes.source) {
      parts.push(`forrás: ${changes.source}`);
    }

    return parts.join(' · ');
  }
}
