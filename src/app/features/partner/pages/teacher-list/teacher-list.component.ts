import { Component, OnInit, inject, signal, computed, viewChild, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { PartnerSchoolService } from '../../services/partner-school.service';
import { TeacherListItem, TeacherInSchool, SyncResultItem } from '../../models/teacher.models';
import { SchoolItem } from '../../models/partner.models';
import { ARCHIVE_SERVICE, ArchiveConfig, ArchivePersonInSchool } from '../../models/archive.models';
import { ArchiveEditModalComponent } from '../../components/archive/archive-edit-modal/archive-edit-modal.component';
import { ArchiveBulkImportDialogComponent } from '../../components/archive/archive-bulk-import-dialog/archive-bulk-import-dialog.component';
import { ArchiveBulkPhotoUploadComponent } from '../../components/archive/archive-bulk-photo-upload/archive-bulk-photo-upload.component';
import { TeacherLinkDialogComponent } from '../../components/teacher-link-dialog/teacher-link-dialog.component';
import { ArchivePhotoUploadComponent } from '../../components/archive/archive-photo-upload/archive-photo-upload.component';
import { ArchiveProjectViewComponent } from '../../components/archive/archive-project-view/archive-project-view.component';
import { TeacherUploadHistoryComponent } from '../../components/teacher-upload-history/teacher-upload-history.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MediaLightboxComponent, LightboxMediaItem } from '../../../../shared/components/media-lightbox';
import { PsSearchableSelectComponent, SelectOption } from '@shared/components/form';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { useFilterState } from '../../../../shared/utils/use-filter-state';
import { SmartFilterBarComponent, SearchableFilterDef } from '../../../../shared/components/smart-filter-bar';
import { ListPaginationComponent } from '../../../../shared/components/list-pagination/list-pagination.component';
import { TableHeaderComponent, TableColumn } from '../../../../shared/components/table-header';
import { ViewModeToggleComponent, ViewModeOption } from '../../../../shared/components/view-mode-toggle/view-mode-toggle.component';

@Component({
  selector: 'app-partner-teacher-list',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    ArchiveEditModalComponent,
    ArchiveBulkImportDialogComponent,
    ArchiveBulkPhotoUploadComponent,
    TeacherLinkDialogComponent,
    ArchivePhotoUploadComponent,
    ArchiveProjectViewComponent,
    TeacherUploadHistoryComponent,
    ConfirmDialogComponent,
    MediaLightboxComponent,
    PsSearchableSelectComponent,
    SmartFilterBarComponent,
    ListPaginationComponent,
    TableHeaderComponent,
    ViewModeToggleComponent,
  ],
  providers: [{ provide: ARCHIVE_SERVICE, useExisting: PartnerTeacherService }],
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

  readonly tableCols: TableColumn[] = [
    { key: 'name', label: 'Tanár' },
    { key: 'school', label: 'Iskola', width: '200px' },
    { key: 'actions', label: 'Műveletek', width: '120px', align: 'center' },
  ];
  readonly gridTemplate = computed(() => this.tableCols.map(c => c.width ?? '1fr').join(' '));

  readonly viewModeOptions: ViewModeOption[] = [
    { value: 'flat', label: 'Tanár nézet', icon: ICONS.LIST },
    { value: 'project', label: 'Projekt nézet', icon: ICONS.FOLDER },
    { value: 'history', label: 'Előzmények', icon: ICONS.HISTORY },
  ];

  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'teachers' },
    defaultFilters: { school_id: '', class_year: '' },
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    onStateChange: () => this.loadTeachers(),
  });

  viewMode = signal<'flat' | 'project' | 'history'>(
    (sessionStorage.getItem('teacher-list-view') as 'flat' | 'project' | 'history') || 'flat'
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

  readonly teacherSearchableFilters = computed<SearchableFilterDef[]>(() => [
    {
      id: 'school_id',
      placeholder: 'Iskola keresése...',
      allLabel: 'Minden iskola',
      options: this.schoolOptions(),
    },
    {
      id: 'class_year',
      placeholder: 'Évfolyam...',
      allLabel: 'Minden évfolyam',
      options: this.classYears(),
    },
  ]);

  // Lightbox
  lightboxMedia = signal<LightboxMediaItem[]>([]);

  // Project view: sync loading state
  syncingSchoolId = signal(0);

  // ArchiveConfig a tanárhoz
  readonly archiveConfig: ArchiveConfig = {
    entityLabel: 'tanár',
    entityLabelPlural: 'tanár',
    icon: ICONS.USER,
    isSyncable: true,
    placeholderName: 'Pl. Kiss János',
    extraFields: [
      { name: 'title_prefix', label: 'Titulus', type: 'text', placeholder: 'pl. Dr., PhD...', gridSize: 'sm' },
      { name: 'position', label: 'Pozíció', type: 'text', placeholder: 'pl. igazgató, angol nyelv...' },
    ],
    bulkImportMatchLabels: {
      exact: 'Pontos egyezés',
      fuzzy: 'Hasonló név',
      ai: 'AI azonosítás',
      ai_sonnet: 'AI azonosítás',
      no_match: 'Nem található',
    },
    bulkImportHasConfidence: true,
    bulkImportTextareaLabel: 'Tanárnevek (soronként egy)',
    bulkImportTextareaPlaceholder: 'Kiss János\nDr. Nagy Anna\nHorváth Péterné\n...',
  };

  // Project view: upload, create, no-photo
  uploadTarget = signal<TeacherInSchool | null>(null);
  showCreateForProject = signal(false);
  createForTeacher = signal<TeacherInSchool | null>(null);
  noPhotoTarget = signal<TeacherInSchool | null>(null);
  private readonly projectView = viewChild(ArchiveProjectViewComponent);

  // Modals
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  showBulkImport = signal(false);
  showBulkPhotoUpload = signal(false);
  showLinkDialog = signal(false);
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

  setViewMode(mode: string): void {
    const m = mode as 'flat' | 'project' | 'history';
    this.viewMode.set(m);
    sessionStorage.setItem('teacher-list-view', m);
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

  openBulkPhotoUpload(): void {
    this.showBulkPhotoUpload.set(true);
  }

  onBulkPhotoUploaded(): void {
    this.showBulkPhotoUpload.set(false);
    this.loadTeachers();
    this.projectView()?.loadData();
  }

  // Link dialog
  openLinkDialog(teacher: TeacherListItem): void {
    this.selectedTeacher.set(teacher);
    this.showLinkDialog.set(true);
  }

  closeLinkDialog(): void {
    this.showLinkDialog.set(false);
    this.selectedTeacher.set(null);
  }

  onTeacherLinked(): void {
    this.closeLinkDialog();
    this.loadTeachers();
  }

  unlinkTeacher(teacher: TeacherListItem): void {
    this.teacherService.unlinkTeacher(teacher.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadTeachers() });
  }

  onUploadPhotoFromProject(item: ArchivePersonInSchool): void {
    if (item.archiveId) {
      this.uploadTarget.set(item as any);
    } else {
      this.createForTeacher.set(item as any);
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
      const teacher = this.noPhotoTarget();
      if (teacher) {
        this.teacherService.markNoPhoto(teacher.archiveId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.projectView()?.markItemNoPhoto(teacher.archiveId));
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
        next: (res) => {
          this.syncingSchoolId.set(0);
          for (const detail of (res.data.details as SyncResultItem[])) {
            if (detail.status === 'synced') {
              this.projectView()?.updateItemField(detail.archiveId, {
                hasPhoto: true,
                hasSyncablePhoto: false,
                photoUrl: detail.photoUrl ?? null,
                photoThumbUrl: detail.photoThumbUrl ?? null,
                photoFileName: detail.photoFileName ?? null,
                photoTakenAt: detail.photoTakenAt ?? null,
              });
            }
          }
        },
        error: () => this.syncingSchoolId.set(0),
      });
  }

  onUndoNoPhotoFromProject(item: ArchivePersonInSchool): void {
    this.teacherService.undoNoPhoto(item.archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.projectView()?.unmarkItemNoPhoto(item.archiveId));
  }
}
