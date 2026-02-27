import { Component, signal, computed, inject, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ICONS } from '@shared/constants/icons.constants';
import {
  PartnerActivityService,
  ActivityLogItem,
  ActivityLogFilters,
} from '../../services/partner-activity.service';
import { PartnerService, ProjectAutocompleteItem } from '../../services/partner.service';

interface LogCategory {
  value: string;
  label: string;
}

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [LucideAngularModule, FormsModule, DatePipe],
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
  loading = signal(false);
  currentPage = signal(1);
  lastPage = signal(1);
  total = signal(0);

  // Projekt szűrő
  projectOptions = signal<Array<{ id: number; name: string }>>([]);
  selectedProjectId = signal<number | null>(null);

  // Szűrők
  selectedCategory = signal('');
  selectedEvent = signal('');
  searchQuery = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  readonly categories: LogCategory[] = [
    { value: '', label: 'Összes kategória' },
    { value: 'partner', label: 'Partner' },
    { value: 'project', label: 'Projekt' },
    { value: 'photo', label: 'Fotó' },
    { value: 'album', label: 'Album' },
    { value: 'tablo', label: 'Tabló' },
    { value: 'billing', label: 'Számlázás' },
    { value: 'order', label: 'Rendelés' },
    { value: 'export', label: 'Export' },
    { value: 'email', label: 'E-mail' },
  ];

  readonly events = [
    { value: '', label: 'Összes esemény' },
    { value: 'created', label: 'Létrehozva' },
    { value: 'updated', label: 'Módosítva' },
    { value: 'deleted', label: 'Törölve' },
  ];

  hasFilters = computed(() =>
    !!this.selectedCategory() || !!this.selectedEvent() || !!this.searchQuery() || !!this.dateFrom() || !!this.dateTo() || !!this.selectedProjectId()
  );

  ngOnInit(): void {
    this.loadData();
    this.loadProjects();
  }

  private loadProjects(): void {
    this.partnerService.getProjectsAutocomplete()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => this.projectOptions.set(projects.map(p => ({ id: p.id, name: p.name }))),
      });
  }

  goToProject(projectId: number): void {
    this.router.navigate(['/partner/projects', projectId]);
  }

  loadData(page = 1): void {
    this.loading.set(true);
    this.currentPage.set(page);

    const filters: ActivityLogFilters = {
      page,
      per_page: 20,
    };

    if (this.selectedCategory()) filters.log_name = this.selectedCategory();
    if (this.selectedEvent()) filters.event = this.selectedEvent();
    if (this.selectedProjectId()) filters.project_id = this.selectedProjectId()!;
    if (this.searchQuery()) filters.search = this.searchQuery();
    if (this.dateFrom()) filters.date_from = this.dateFrom();
    if (this.dateTo()) filters.date_to = this.dateTo();

    this.activityService.getActivityLog(filters).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.lastPage.set(res.pagination.last_page);
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.loadData(1);
  }

  onSearch(): void {
    this.loadData(1);
  }

  clearFilters(): void {
    this.selectedCategory.set('');
    this.selectedEvent.set('');
    this.selectedProjectId.set(null);
    this.searchQuery.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.loadData(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.lastPage()) {
      this.loadData(page);
    }
  }

  getCategoryLabel(logName: string): string {
    return this.categories.find(c => c.value === logName)?.label ?? logName;
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
    if (changes.old && changes.attributes) {
      for (const key of Object.keys(changes.attributes)) {
        const oldVal = changes.old[key] ?? '—';
        const newVal = changes.attributes[key] ?? '—';
        parts.push(`${key}: ${oldVal} → ${newVal}`);
      }
    }
    return parts.join(', ');
  }
}
