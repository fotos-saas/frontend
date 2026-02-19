import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { PartnerSchoolService } from '../../services/partner-school.service';
import { TeacherListItem, SyncResultItem } from '../../models/teacher.models';
import { SchoolItem } from '../../models/partner.models';
import { ArchivePersonInSchool, ArchiveSchoolGroup } from '../../models/archive.models';
import { SelectOption } from '@shared/components/form';
import { saveFile } from '../../../../shared/utils/file.util';
import { useFilterState } from '../../../../shared/utils/use-filter-state';

/**
 * Teacher List State Service
 * Adatbetöltés, CRUD műveletek, sync és download kezelés.
 * Komponens-szintű provider.
 */
@Injectable()
export class TeacherListStateService {
  private readonly teacherService = inject(PartnerTeacherService);
  private readonly schoolService = inject(PartnerSchoolService);
  private readonly destroyRef = inject(DestroyRef);

  readonly teachers = signal<TeacherListItem[]>([]);
  readonly totalPages = signal(1);
  readonly totalTeachers = signal(0);
  readonly schools = signal<SchoolItem[]>([]);
  readonly classYears = signal<SelectOption[]>([]);
  readonly syncingSchoolId = signal(0);
  readonly downloading = signal(false);
  readonly downloadingSchoolId = signal(0);

  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'teachers' },
    defaultFilters: { school_id: '', class_year: '' },
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    onStateChange: () => this.loadTeachers(),
  });

  init(): void {
    this.loadSchools();
    this.loadClassYears();
    this.loadTeachers();
  }

  loadSchools(): void {
    this.schoolService.getAllSchools()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.schools.set(data) });
  }

  loadClassYears(): void {
    this.teacherService.getClassYears()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (years) => this.classYears.set(years.map(y => ({ id: y, label: y }))),
      });
  }

  loadTeachers(): void {
    this.filterState.loading.set(true);
    const schoolId = this.filterState.filters().school_id;
    const classYear = this.filterState.filters().class_year;

    this.teacherService.getTeachers({
      page: this.filterState.page(),
      per_page: 18,
      search: this.filterState.search() || undefined,
      school_id: schoolId ? parseInt(schoolId, 10) : undefined,
      class_year: classYear || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.teachers.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalTeachers.set(response.total);
          this.filterState.loading.set(false);
        },
        error: () => this.filterState.loading.set(false),
      });
  }

  deleteTeacher(id: number): void {
    this.teacherService.deleteTeacher(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadTeachers() });
  }

  unlinkTeacher(id: number): void {
    this.teacherService.unlinkTeacher(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadTeachers() });
  }

  markNoPhoto(archiveId: number, callback: () => void): void {
    this.teacherService.markNoPhoto(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => callback());
  }

  undoNoPhoto(archiveId: number, callback: () => void): void {
    this.teacherService.undoNoPhoto(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => callback());
  }

  syncPhotos(event: { schoolId: number; classYear?: string }, onDetail: (detail: SyncResultItem) => void): void {
    this.syncingSchoolId.set(event.schoolId);
    this.teacherService.executeSync({
      school_id: event.schoolId,
      class_year: event.classYear,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.syncingSchoolId.set(0);
          for (const detail of (res.data.details as SyncResultItem[])) {
            if (detail.status === 'synced') onDetail(detail);
          }
        },
        error: () => this.syncingSchoolId.set(0),
      });
  }

  syncSingleItem(archiveId: number, onSuccess: (data: { photoUrl: string; photoThumbUrl: string }) => void): void {
    this.teacherService.syncCrossSchool(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => onSuccess(res.data) });
  }

  downloadSchoolZip(school: ArchiveSchoolGroup, fileNaming: string): void {
    this.downloadingSchoolId.set(school.schoolId);
    this.schoolService.downloadTeacherPhotosZip(school.schoolId, fileNaming)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          saveFile(blob, `tanarok-${school.schoolId}.zip`);
          this.downloadingSchoolId.set(0);
        },
        error: () => this.downloadingSchoolId.set(0),
      });
  }

  downloadAllZip(classYear: string | undefined, fileNaming: string): void {
    this.downloading.set(true);
    this.teacherService.downloadArchiveZip(classYear, fileNaming)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          saveFile(blob, `tanarok-${classYear || 'osszes'}.zip`);
          this.downloading.set(false);
        },
        error: () => this.downloading.set(false),
      });
  }
}
