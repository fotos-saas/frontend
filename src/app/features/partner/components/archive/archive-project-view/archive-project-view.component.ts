import { Component, OnInit, inject, signal, computed, input, output, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import {
  ARCHIVE_SERVICE,
  ArchiveSchoolGroup,
  ArchiveSchoolSummary,
  ArchivePersonInSchool,
  ArchiveConfig,
} from '../../../models/archive.models';
import { SelectOption } from '../../../../../shared/components/searchable-select/searchable-select.component';
import { SearchableSelectComponent } from '../../../../../shared/components/searchable-select/searchable-select.component';
import { ArchiveProjectCardComponent } from '../archive-project-card/archive-project-card.component';
import { ListPaginationComponent } from '../../../../../shared/components/list-pagination/list-pagination.component';
import { ICONS } from '../../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-archive-project-view',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    SearchableSelectComponent,
    ArchiveProjectCardComponent,
    ListPaginationComponent,
  ],
  templateUrl: './archive-project-view.component.html',
  styleUrl: './archive-project-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchiveProjectViewComponent implements OnInit {
  config = input.required<ArchiveConfig>();
  classYears = input<SelectOption[]>([]);
  syncingSchoolId = input(0);

  private readonly archiveService = inject(ARCHIVE_SERVICE);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  schoolGroups = signal<ArchiveSchoolGroup[]>([]);
  summary = signal<ArchiveSchoolSummary>({ totalSchools: 0, totalItems: 0, withPhoto: 0, missingPhoto: 0 });
  loading = signal(true);
  initialized = signal(false);

  schoolSearch = signal('');
  selectedYear = signal('');
  missingOnly = signal(false);

  expandedIds = signal<Set<number>>(new Set());

  currentPage = signal(1);
  readonly perPage = 10;

  uploadPhotoRequest = output<ArchivePersonInSchool>();
  syncPhotosRequest = output<{ schoolId: number; classYear?: string }>();
  syncSingleItemRequest = output<ArchivePersonInSchool>();
  viewPhotoRequest = output<ArchivePersonInSchool>();
  markNoPhotoRequest = output<ArchivePersonInSchool>();
  undoNoPhotoRequest = output<ArchivePersonInSchool>();

  filteredSchoolGroups = computed(() => {
    const query = this.schoolSearch().toLowerCase().trim();
    const groups = this.schoolGroups();
    if (!query) return groups;
    return groups.filter(g => g.schoolName.toLowerCase().includes(query));
  });

  totalPages = computed(() => Math.ceil(this.filteredSchoolGroups().length / this.perPage));
  totalSchoolCount = computed(() => this.filteredSchoolGroups().length);

  paginatedSchoolGroups = computed(() => {
    const start = (this.currentPage() - 1) * this.perPage;
    return this.filteredSchoolGroups().slice(start, start + this.perPage);
  });

  ngOnInit(): void {
    this.waitForYearsAndLoad();
  }

  private waitForYearsAndLoad(): void {
    const checkAndLoad = (): void => {
      const years = this.classYears();
      if (years.length > 0 && !this.initialized()) {
        this.selectedYear.set(String(years[0].id));
        this.initialized.set(true);
        this.loadData();
      } else if (!this.initialized()) {
        setTimeout(() => checkAndLoad(), 100);
      }
    };
    checkAndLoad();
  }

  loadData(): void {
    this.loading.set(true);
    const classYear = this.selectedYear();

    this.archiveService.getBySchool({
      class_year: classYear || undefined,
      missing_only: this.missingOnly(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.schoolGroups.set(response.schools);
          this.summary.set(response.summary);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSchoolSearchChange(value: string): void {
    this.schoolSearch.set(value);
    this.currentPage.set(1);
  }

  onYearChange(value: string): void {
    this.selectedYear.set(value);
    this.currentPage.set(1);
    this.loadData();
  }

  onMissingOnlyChange(): void {
    this.missingOnly.update(v => !v);
    this.currentPage.set(1);
    this.loadData();
  }

  setPage(page: number): void {
    this.currentPage.set(page);
  }

  toggleSchool(schoolId: number): void {
    this.expandedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(schoolId)) {
        next.delete(schoolId);
      } else {
        next.add(schoolId);
      }
      return next;
    });
  }

  expandAll(): void {
    this.expandedIds.update(ids => {
      const next = new Set(ids);
      for (const s of this.paginatedSchoolGroups()) {
        next.add(s.schoolId);
      }
      return next;
    });
  }

  collapseAll(): void {
    this.expandedIds.update(ids => {
      const next = new Set(ids);
      for (const s of this.paginatedSchoolGroups()) {
        next.delete(s.schoolId);
      }
      return next;
    });
  }

  isExpanded(schoolId: number): boolean {
    return this.expandedIds().has(schoolId);
  }

  onUploadPhoto(item: ArchivePersonInSchool, schoolId: number): void {
    this.uploadPhotoRequest.emit({ ...item, schoolId });
  }

  onViewPhoto(item: ArchivePersonInSchool): void {
    this.viewPhotoRequest.emit(item);
  }

  onMarkNoPhoto(item: ArchivePersonInSchool): void {
    this.markNoPhotoRequest.emit(item);
  }

  onUndoNoPhoto(item: ArchivePersonInSchool): void {
    this.undoNoPhotoRequest.emit(item);
  }

  onSyncPhotos(school: ArchiveSchoolGroup): void {
    this.syncPhotosRequest.emit({
      schoolId: school.schoolId,
      classYear: this.selectedYear() || undefined,
    });
  }

  onSyncSingleItem(item: ArchivePersonInSchool): void {
    this.syncSingleItemRequest.emit(item);
  }

  /** Lokálisan frissíti egy elem mezőjét újratöltés nélkül. */
  markItemNoPhoto(archiveId: number): void {
    this.updateItemField(archiveId, { noPhotoMarked: true });
  }

  unmarkItemNoPhoto(archiveId: number): void {
    this.updateItemField(archiveId, { noPhotoMarked: false });
  }

  /** Lokálisan frissíti egy elem state-jét (pl. sync után). */
  updateItemField(archiveId: number, patch: Partial<ArchivePersonInSchool>): void {
    this.schoolGroups.update(groups =>
      groups.map(group => ({
        ...group,
        items: group.items.map(item =>
          item.archiveId === archiveId ? { ...item, ...patch } : item
        ),
      }))
    );
  }
}
