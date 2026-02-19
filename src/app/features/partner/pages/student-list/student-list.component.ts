import { Component, OnInit, inject, signal, computed, viewChild, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerStudentService } from '../../services/partner-student.service';
import { PartnerSchoolService } from '../../services/partner-school.service';
import { StudentListItem, StudentInSchool } from '../../models/student.models';
import { SchoolItem } from '../../models/partner.models';
import { ARCHIVE_SERVICE, ArchiveConfig, ArchivePersonInSchool } from '../../models/archive.models';
import { ArchiveEditModalComponent } from '../../components/archive/archive-edit-modal/archive-edit-modal.component';
import { ArchiveBulkImportDialogComponent } from '../../components/archive/archive-bulk-import-dialog/archive-bulk-import-dialog.component';
import { ArchiveBulkPhotoUploadComponent } from '../../components/archive/archive-bulk-photo-upload/archive-bulk-photo-upload.component';
import { ArchivePhotoUploadComponent } from '../../components/archive/archive-photo-upload/archive-photo-upload.component';
import { ArchiveProjectViewComponent } from '../../components/archive/archive-project-view/archive-project-view.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MediaLightboxComponent, LightboxMediaItem } from '../../../../shared/components/media-lightbox';
import { SelectOption } from '@shared/components/form';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { useFilterState } from '../../../../shared/utils/use-filter-state';
import { SmartFilterBarComponent, SearchableFilterDef } from '../../../../shared/components/smart-filter-bar';
import { ListPaginationComponent } from '../../../../shared/components/list-pagination/list-pagination.component';
import { TableHeaderComponent, TableColumn } from '../../../../shared/components/table-header';
import { ViewModeToggleComponent, ViewModeOption } from '../../../../shared/components/view-mode-toggle/view-mode-toggle.component';

@Component({
  selector: 'app-partner-student-list',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    ArchiveEditModalComponent,
    ArchiveBulkImportDialogComponent,
    ArchiveBulkPhotoUploadComponent,
    ArchivePhotoUploadComponent,
    ArchiveProjectViewComponent,
    ConfirmDialogComponent,
    MediaLightboxComponent,
    SmartFilterBarComponent,
    ListPaginationComponent,
    TableHeaderComponent,
    ViewModeToggleComponent,
  ],
  providers: [{ provide: ARCHIVE_SERVICE, useExisting: PartnerStudentService }],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerStudentListComponent implements OnInit {
  private readonly studentService = inject(PartnerStudentService);
  private readonly schoolService = inject(PartnerSchoolService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ICONS = ICONS;

  readonly tableCols: TableColumn[] = [
    { key: 'name', label: 'Diák' },
    { key: 'class', label: 'Osztály', width: '100px', align: 'center' },
    { key: 'school', label: 'Iskola', width: '200px' },
    { key: 'actions', label: 'Műveletek', width: '100px', align: 'center' },
  ];
  readonly gridTemplate = computed(() => this.tableCols.map(c => c.width ?? '1fr').join(' '));

  readonly viewModeOptions: ViewModeOption[] = [
    { value: 'flat', label: 'Diák nézet', icon: ICONS.LIST },
    { value: 'project', label: 'Projekt nézet', icon: ICONS.FOLDER },
  ];

  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'students' },
    defaultFilters: { school_id: '', class_name: '' },
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    onStateChange: () => this.loadStudents(),
  });

  viewMode = signal<'flat' | 'project'>(
    (sessionStorage.getItem('student-list-view') as 'flat' | 'project') || 'flat'
  );

  students = signal<StudentListItem[]>([]);
  totalPages = signal(1);
  totalStudents = signal(0);
  schools = signal<SchoolItem[]>([]);
  classYears = signal<SelectOption[]>([]);

  schoolOptions = computed<SelectOption[]>(() =>
    this.schools().map(s => ({
      id: s.id,
      label: s.name,
      sublabel: s.city ?? undefined,
    }))
  );

  readonly studentSearchableFilters = computed<SearchableFilterDef[]>(() => [{
    id: 'school_id',
    placeholder: 'Iskola keresése...',
    allLabel: 'Minden iskola',
    options: this.schoolOptions(),
  }]);

  // Lightbox
  lightboxMedia = signal<LightboxMediaItem[]>([]);

  // ArchiveConfig a diákhoz
  readonly archiveConfig: ArchiveConfig = {
    entityLabel: 'diák',
    entityLabelPlural: 'diák',
    icon: ICONS.GRADUATION_CAP,
    isSyncable: false,
    placeholderName: 'Pl. Kiss Anna',
    extraFields: [
      { name: 'class_name', label: 'Osztály', type: 'text', placeholder: 'pl. 12.c' },
    ],
    bulkImportMatchLabels: {
      exact: 'Pontos egyezés',
      no_match: 'Nem található',
    },
    bulkImportHasConfidence: false,
    bulkImportTextareaLabel: 'Diáknevek (soronként egy)',
    bulkImportTextareaPlaceholder: 'Kiss Anna\nNagy Péter\nHorváth László\n...',
  };

  // Project view: upload, create, no-photo
  uploadTarget = signal<StudentInSchool | null>(null);
  showCreateForProject = signal(false);
  createForStudent = signal<StudentInSchool | null>(null);
  noPhotoTarget = signal<StudentInSchool | null>(null);
  private readonly projectView = viewChild(ArchiveProjectViewComponent);

  // Modals
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  showBulkImport = signal(false);
  showBulkPhotoUpload = signal(false);
  selectedStudent = signal<StudentListItem | null>(null);
  modalMode = signal<'create' | 'edit'>('create');

  ngOnInit(): void {
    this.loadSchools();
    this.loadClassYears();
    this.loadStudents();
  }

  loadSchools(): void {
    this.schoolService.getAllSchools()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.schools.set(data) });
  }

  loadClassYears(): void {
    this.studentService.getClassYears()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (years) => this.classYears.set(
          years.map(y => ({ id: y, label: y }))
        ),
      });
  }

  loadStudents(): void {
    this.filterState.loading.set(true);
    const schoolId = this.filterState.filters().school_id;
    const className = this.filterState.filters().class_name;

    this.studentService.getStudents({
      page: this.filterState.page(),
      per_page: 18,
      search: this.filterState.search() || undefined,
      school_id: schoolId ? parseInt(schoolId, 10) : undefined,
      class_name: className || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.students.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalStudents.set(response.total);
          this.filterState.loading.set(false);
        },
        error: () => this.filterState.loading.set(false),
      });
  }

  setViewMode(mode: string): void {
    const m = mode as 'flat' | 'project';
    this.viewMode.set(m);
    sessionStorage.setItem('student-list-view', m);
  }

  onSchoolFilterChange(value: string): void {
    this.filterState.setFilter('school_id', value);
  }

  onClassNameChange(value: string): void {
    this.filterState.setFilter('class_name', value);
  }

  openCreateModal(): void {
    this.selectedStudent.set(null);
    this.modalMode.set('create');
    this.showEditModal.set(true);
  }

  editStudent(student: StudentListItem): void {
    this.selectedStudent.set(student);
    this.modalMode.set('edit');
    this.showEditModal.set(true);
  }

  viewStudent(student: StudentListItem): void {
    this.router.navigate([student.id], { relativeTo: this.route });
  }

  openAvatarLightbox(student: StudentListItem, event: MouseEvent): void {
    if (!student.photoUrl) return;
    event.stopPropagation();
    this.lightboxMedia.set([{
      id: student.id,
      url: student.photoUrl,
      fileName: student.canonicalName,
    }]);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedStudent.set(null);
  }

  onStudentSaved(): void {
    this.closeEditModal();
    this.loadStudents();
  }

  confirmDeleteStudent(student: StudentListItem): void {
    this.selectedStudent.set(student);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.selectedStudent.set(null);
  }

  onDeleteConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.deleteStudent();
    } else {
      this.closeDeleteConfirm();
    }
  }

  deleteStudent(): void {
    const student = this.selectedStudent();
    if (!student) return;

    this.studentService.deleteStudent(student.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeDeleteConfirm();
          this.loadStudents();
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
    this.loadStudents();
  }

  openBulkPhotoUpload(): void {
    this.showBulkPhotoUpload.set(true);
  }

  onBulkPhotoUploaded(): void {
    this.showBulkPhotoUpload.set(false);
    this.loadStudents();
    this.projectView()?.loadData();
  }

  onUploadPhotoFromProject(item: ArchivePersonInSchool): void {
    if (item.archiveId) {
      this.uploadTarget.set(item as any);
    } else {
      this.createForStudent.set(item as any);
      this.showCreateForProject.set(true);
    }
  }

  onProjectPhotoUploaded(): void {
    this.uploadTarget.set(null);
    this.projectView()?.loadData();
  }

  onProjectStudentCreated(): void {
    this.showCreateForProject.set(false);
    this.createForStudent.set(null);
    this.projectView()?.loadData();
  }

  onViewPhotoFromProject(item: ArchivePersonInSchool): void {
    if (item.photoUrl) {
      this.lightboxMedia.set([{
        id: item.archiveId,
        url: item.photoUrl,
        fileName: item.name,
      }]);
    }
  }

  onMarkNoPhotoFromProject(item: ArchivePersonInSchool): void {
    this.noPhotoTarget.set(item as any);
  }

  onConfirmNoPhoto(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action === 'confirm') {
      const student = this.noPhotoTarget();
      if (student) {
        this.studentService.markNoPhoto(student.archiveId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.projectView()?.markItemNoPhoto(student.archiveId));
      }
    }
    this.noPhotoTarget.set(null);
  }

  onUndoNoPhotoFromProject(item: ArchivePersonInSchool): void {
    this.studentService.undoNoPhoto(item.archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.projectView()?.unmarkItemNoPhoto(item.archiveId));
  }
}
