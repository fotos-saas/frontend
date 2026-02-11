import { Component, OnInit, inject, signal, computed, viewChild, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { PartnerSchoolService } from '../../services/partner-school.service';
import { TeacherListItem, TeacherInSchool } from '../../models/teacher.models';
import { SchoolItem } from '../../models/partner.models';
import { TeacherEditModalComponent } from '../../components/teacher-edit-modal/teacher-edit-modal.component';
import { TeacherBulkImportDialogComponent } from '../../components/teacher-bulk-import-dialog/teacher-bulk-import-dialog.component';
import { TeacherPhotoUploadComponent } from '../../components/teacher-photo-upload/teacher-photo-upload.component';
import { TeacherProjectViewComponent } from '../../components/teacher-project-view/teacher-project-view.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MediaLightboxComponent, LightboxMediaItem } from '../../../../shared/components/media-lightbox';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { useFilterState } from '../../../../shared/utils/use-filter-state';

@Component({
  selector: 'app-partner-teacher-list',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    TeacherEditModalComponent,
    TeacherBulkImportDialogComponent,
    TeacherPhotoUploadComponent,
    TeacherProjectViewComponent,
    ConfirmDialogComponent,
    MediaLightboxComponent,
    SearchableSelectComponent,
  ],
  templateUrl: './teacher-list.component.html',
  styleUrl: './teacher-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerTeacherListComponent implements OnInit {
  private readonly teacherService = inject(PartnerTeacherService);
  private readonly schoolService = inject(PartnerSchoolService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ICONS = ICONS;

  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'teachers' },
    defaultFilters: { school_id: '', class_year: '' },
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    onStateChange: () => this.loadTeachers(),
  });

  viewMode = signal<'flat' | 'project'>(
    (sessionStorage.getItem('teacher-list-view') as 'flat' | 'project') || 'flat'
  );

  teachers = signal<TeacherListItem[]>([]);
  totalPages = signal(1);
  totalTeachers = signal(0);
  schools = signal<SchoolItem[]>([]);
  classYears = signal<SelectOption[]>([]);

  /** Iskolák SelectOption formátumban */
  schoolOptions = computed<SelectOption[]>(() =>
    this.schools().map(s => ({
      id: s.id,
      label: s.name,
      sublabel: s.city ?? undefined,
    }))
  );

  // Lightbox
  lightboxMedia = signal<LightboxMediaItem[]>([]);

  // Project view: sync loading state
  syncingSchoolId = signal(0);

  // Project view: upload, create, no-photo
  uploadTarget = signal<TeacherInSchool | null>(null);
  showCreateForProject = signal(false);
  createForTeacher = signal<TeacherInSchool | null>(null);
  noPhotoTarget = signal<TeacherInSchool | null>(null);
  private readonly projectView = viewChild(TeacherProjectViewComponent);

  // Modals
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  showBulkImport = signal(false);
  selectedTeacher = signal<TeacherListItem | null>(null);
  modalMode = signal<'create' | 'edit'>('create');

  ngOnInit(): void {
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
        next: (years) => this.classYears.set(
          years.map(y => ({ id: y, label: y }))
        ),
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

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filterState.setPage(page);
  }

  setViewMode(mode: 'flat' | 'project'): void {
    this.viewMode.set(mode);
    sessionStorage.setItem('teacher-list-view', mode);
  }

  onSchoolFilterChange(value: string): void {
    this.filterState.setFilter('school_id', value);
  }

  onClassYearChange(value: string): void {
    this.filterState.setFilter('class_year', value);
  }

  openCreateModal(): void {
    this.selectedTeacher.set(null);
    this.modalMode.set('create');
    this.showEditModal.set(true);
  }

  editTeacher(teacher: TeacherListItem): void {
    this.selectedTeacher.set(teacher);
    this.modalMode.set('edit');
    this.showEditModal.set(true);
  }

  viewTeacher(teacher: TeacherListItem): void {
    this.router.navigate([teacher.id], { relativeTo: this.route });
  }

  openAvatarLightbox(teacher: TeacherListItem, event: MouseEvent): void {
    if (!teacher.photoUrl) return;
    event.stopPropagation();
    this.lightboxMedia.set([{
      id: teacher.id,
      url: teacher.photoUrl,
      fileName: teacher.fullDisplayName,
    }]);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedTeacher.set(null);
  }

  onTeacherSaved(): void {
    this.closeEditModal();
    this.loadTeachers();
  }

  confirmDeleteTeacher(teacher: TeacherListItem): void {
    this.selectedTeacher.set(teacher);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.selectedTeacher.set(null);
  }

  onDeleteConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.deleteTeacher();
    } else {
      this.closeDeleteConfirm();
    }
  }

  deleteTeacher(): void {
    const teacher = this.selectedTeacher();
    if (!teacher) return;

    this.teacherService.deleteTeacher(teacher.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeDeleteConfirm();
          this.loadTeachers();
        },
        error: () => this.closeDeleteConfirm(),
      });
  }

  openBulkImport(): void {
    this.showBulkImport.set(true);
  }

  closeBulkImport(): void {
    this.showBulkImport.set(false);
  }

  onBulkImported(): void {
    this.closeBulkImport();
    this.loadTeachers();
  }

  onUploadPhotoFromProject(teacher: TeacherInSchool): void {
    if (teacher.archiveId) {
      this.uploadTarget.set(teacher);
    } else {
      this.createForTeacher.set(teacher);
      this.showCreateForProject.set(true);
    }
  }

  onProjectPhotoUploaded(): void {
    this.uploadTarget.set(null);
    this.projectView()?.loadData();
  }

  onProjectTeacherCreated(): void {
    this.showCreateForProject.set(false);
    this.createForTeacher.set(null);
    this.projectView()?.loadData();
  }

  onViewPhotoFromProject(teacher: TeacherInSchool): void {
    if (teacher.photoUrl) {
      this.lightboxMedia.set([{
        id: teacher.archiveId,
        url: teacher.photoUrl,
        fileName: teacher.name,
      }]);
    }
  }

  onMarkNoPhotoFromProject(teacher: TeacherInSchool): void {
    this.noPhotoTarget.set(teacher);
  }

  onConfirmNoPhoto(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action === 'confirm') {
      const teacher = this.noPhotoTarget();
      if (teacher) {
        this.teacherService.markNoPhoto(teacher.archiveId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.projectView()?.markTeacherNoPhoto(teacher.archiveId));
      }
    }
    this.noPhotoTarget.set(null);
  }

  onSyncPhotosFromProject(event: { schoolId: number; classYear?: string }): void {
    this.syncingSchoolId.set(event.schoolId);
    this.teacherService.executeSync({
      school_id: event.schoolId,
      class_year: event.classYear,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.syncingSchoolId.set(0);
          this.projectView()?.loadData();
        },
        error: () => this.syncingSchoolId.set(0),
      });
  }

  onUndoNoPhotoFromProject(teacher: TeacherInSchool): void {
    this.teacherService.undoNoPhoto(teacher.archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.projectView()?.unmarkTeacherNoPhoto(teacher.archiveId));
  }
}
