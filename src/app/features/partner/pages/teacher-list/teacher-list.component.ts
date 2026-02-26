import { Component, OnInit, inject, signal, computed, effect, viewChild, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TeacherListItem, TeacherGroupRow, SyncResultItem, LinkTeachersResponse, LinkedGroupPhoto } from '../../models/teacher.models';
import { ARCHIVE_SERVICE, ArchiveConfig, ArchivePersonInSchool, ArchiveSchoolGroup } from '../../models/archive.models';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { ArchiveEditModalComponent } from '../../components/archive/archive-edit-modal/archive-edit-modal.component';
import { ArchiveBulkImportDialogComponent } from '../../components/archive/archive-bulk-import-dialog/archive-bulk-import-dialog.component';
import { ArchiveBulkPhotoUploadComponent } from '../../components/archive/archive-bulk-photo-upload/archive-bulk-photo-upload.component';
import { TeacherLinkDialogComponent } from '../../components/teacher-link-dialog/teacher-link-dialog.component';
import { TeacherPhotoChooserDialogComponent } from '../../components/teacher-photo-chooser-dialog/teacher-photo-chooser-dialog.component';
import { ArchivePhotoUploadComponent } from '../../components/archive/archive-photo-upload/archive-photo-upload.component';
import { ArchiveDownloadDialogComponent, ArchiveDownloadOptions } from '../../components/archive/archive-download-dialog/archive-download-dialog.component';
import { ArchiveProjectViewComponent } from '../../components/archive/archive-project-view/archive-project-view.component';
import { TeacherUploadHistoryComponent } from '../../components/teacher-upload-history/teacher-upload-history.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MediaLightboxComponent, LightboxMediaItem } from '../../../../shared/components/media-lightbox';
import { SelectOption } from '@shared/components/form';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { SmartFilterBarComponent, SearchableFilterDef } from '../../../../shared/components/smart-filter-bar';
import { ListPaginationComponent } from '../../../../shared/components/list-pagination/list-pagination.component';
import { TableHeaderComponent, TableColumn } from '../../../../shared/components/table-header';
import { ViewModeToggleComponent, ViewModeOption } from '../../../../shared/components/view-mode-toggle/view-mode-toggle.component';
import { TeacherListStateService } from './teacher-list-state.service';

@Component({
  selector: 'app-partner-teacher-list',
  standalone: true,
  imports: [
    FormsModule, NgTemplateOutlet, LucideAngularModule, MatTooltipModule,
    ArchiveEditModalComponent, ArchiveBulkImportDialogComponent, ArchiveBulkPhotoUploadComponent,
    TeacherLinkDialogComponent, TeacherPhotoChooserDialogComponent,
    ArchivePhotoUploadComponent, ArchiveDownloadDialogComponent,
    ArchiveProjectViewComponent, TeacherUploadHistoryComponent, ConfirmDialogComponent,
    MediaLightboxComponent, SmartFilterBarComponent,
    ListPaginationComponent, TableHeaderComponent, ViewModeToggleComponent,
  ],
  providers: [
    TeacherListStateService,
    { provide: ARCHIVE_SERVICE, useExisting: PartnerTeacherService },
  ],
  templateUrl: './teacher-list.component.html',
  styleUrl: './teacher-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerTeacherListComponent implements OnInit {
  protected readonly state = inject(TeacherListStateService);
  private readonly teacherService = inject(PartnerTeacherService);
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

  readonly schoolOptions = computed<SelectOption[]>(() =>
    this.state.schools().map(s => ({ id: s.id, label: s.name, sublabel: s.city ?? undefined }))
  );

  readonly teacherSearchableFilters = computed<SearchableFilterDef[]>(() => [
    { id: 'school_id', placeholder: 'Iskola keresése...', allLabel: 'Minden iskola', options: this.schoolOptions() },
    { id: 'class_year', placeholder: 'Évfolyam...', allLabel: 'Minden évfolyam', options: this.state.classYears() },
  ]);

  readonly archiveConfig: ArchiveConfig = {
    entityLabel: 'tanár', entityLabelPlural: 'tanár', icon: ICONS.USER, isSyncable: true,
    placeholderName: 'Pl. Kiss János',
    extraFields: [
      { name: 'title_prefix', label: 'Titulus', type: 'text', placeholder: 'pl. Dr., PhD...', gridSize: 'sm' },
      { name: 'position', label: 'Pozíció', type: 'text', placeholder: 'pl. igazgató, angol nyelv...' },
    ],
    bulkImportMatchLabels: { exact: 'Pontos egyezés', fuzzy: 'Hasonló név', ai: 'AI azonosítás', ai_sonnet: 'AI azonosítás', no_match: 'Nem található' },
    bulkImportHasConfidence: true, bulkImportTextareaLabel: 'Tanárnevek (soronként egy)',
    bulkImportTextareaPlaceholder: 'Kiss János\nDr. Nagy Anna\nHorváth Péterné\n...',
  };

  // Group expand state
  readonly expandedGroups = signal<Set<string>>(new Set());

  private readonly resetExpandEffect = effect(() => {
    this.state.teachers(); // track dependency
    this.expandedGroups.set(new Set());
  });

  toggleGroup(linkedGroup: string): void {
    const s = new Set(this.expandedGroups());
    s.has(linkedGroup) ? s.delete(linkedGroup) : s.add(linkedGroup);
    this.expandedGroups.set(s);
  }

  isExpanded(linkedGroup: string): boolean {
    return this.expandedGroups().has(linkedGroup);
  }

  trackByGroup(row: TeacherGroupRow): string | number {
    return row.linkedGroup ?? row.primary.id;
  }

  // View & UI state
  viewMode = signal<'flat' | 'project' | 'history'>(
    (sessionStorage.getItem('teacher-list-view') as 'flat' | 'project' | 'history') || 'flat'
  );
  lightboxMedia = signal<LightboxMediaItem[]>([]);
  showMoreMenu = signal(false);
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  showBulkImport = signal(false);
  showBulkPhotoUpload = signal(false);
  showLinkDialog = signal(false);
  showCreateForProject = signal(false);
  showDownloadDialog = signal(false);
  selectedTeacher = signal<TeacherListItem | null>(null);
  modalMode = signal<'create' | 'edit'>('create');
  uploadTarget = signal<ArchivePersonInSchool | null>(null);
  createForTeacher = signal<ArchivePersonInSchool | null>(null);
  noPhotoTarget = signal<ArchivePersonInSchool | null>(null);
  downloadSchoolTarget = signal<ArchiveSchoolGroup | null>(null);
  showPhotoChooser = signal(false);
  photoChooserData = signal<{ photos: LinkedGroupPhoto[]; linkedGroup: string } | null>(null);
  private readonly projectView = viewChild(ArchiveProjectViewComponent);

  ngOnInit(): void { this.state.init(); }

  setViewMode(mode: string): void {
    const m = mode as 'flat' | 'project' | 'history';
    this.viewMode.set(m);
    sessionStorage.setItem('teacher-list-view', m);
  }

  toggleMoreMenu(): void { this.showMoreMenu.update(v => !v); }
  closeMoreMenu(): void { this.showMoreMenu.set(false); }

  // CRUD modals
  openCreateModal(): void { this.selectedTeacher.set(null); this.modalMode.set('create'); this.showEditModal.set(true); }
  editTeacher(t: TeacherListItem): void { this.selectedTeacher.set(t); this.modalMode.set('edit'); this.showEditModal.set(true); }
  viewTeacher(t: TeacherListItem): void { this.router.navigate([t.id], { relativeTo: this.route }); }
  closeEditModal(): void { this.showEditModal.set(false); this.selectedTeacher.set(null); }
  onTeacherSaved(): void { this.closeEditModal(); this.state.loadTeachers(); }

  confirmDeleteTeacher(t: TeacherListItem): void { this.selectedTeacher.set(t); this.showDeleteConfirm.set(true); }
  closeDeleteConfirm(): void { this.showDeleteConfirm.set(false); this.selectedTeacher.set(null); }
  onDeleteConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      const t = this.selectedTeacher();
      if (t) this.state.deleteTeacher(t.id);
    }
    this.closeDeleteConfirm();
  }

  openAvatarLightbox(t: TeacherListItem, event: MouseEvent): void {
    if (!t.photoUrl) return;
    event.stopPropagation();
    this.lightboxMedia.set([{ id: t.id, url: t.photoUrl, fileName: t.fullDisplayName }]);
  }

  // Bulk operations
  openBulkImport(): void { this.showBulkImport.set(true); }
  closeBulkImport(): void { this.showBulkImport.set(false); }
  onBulkImported(): void { this.closeBulkImport(); this.state.loadTeachers(); }
  openBulkPhotoUpload(): void { this.showBulkPhotoUpload.set(true); }
  onBulkPhotoUploaded(): void { this.showBulkPhotoUpload.set(false); this.state.loadTeachers(); this.projectView()?.loadData(); }

  // Link dialog
  openLinkDialog(t: TeacherListItem): void { this.selectedTeacher.set(t); this.showLinkDialog.set(true); }
  closeLinkDialog(): void { this.showLinkDialog.set(false); this.selectedTeacher.set(null); }
  onTeacherLinked(data?: LinkTeachersResponse | void): void {
    this.closeLinkDialog();
    this.state.loadTeachers();
    if (data && data.photos && data.photos.length > 1) {
      this.photoChooserData.set({ photos: data.photos, linkedGroup: data.linkedGroup });
      this.showPhotoChooser.set(true);
    }
  }
  onOpenPhotoChooserFromLink(groupId: string): void {
    this.closeLinkDialog();
    this.teacherService.getLinkedGroupPhotos(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (res.data?.length > 0) {
          this.photoChooserData.set({ photos: res.data, linkedGroup: groupId });
          this.showPhotoChooser.set(true);
        }
      });
  }
  closePhotoChooser(): void { this.showPhotoChooser.set(false); this.photoChooserData.set(null); }
  onPhotoChosen(): void { this.closePhotoChooser(); this.state.loadTeachers(); }
  unlinkTeacher(t: TeacherListItem): void { this.state.unlinkTeacher(t.id); }

  // Project view actions
  onUploadPhotoFromProject(item: ArchivePersonInSchool): void {
    if (item.archiveId) { this.uploadTarget.set(item); }
    else { this.createForTeacher.set(item); this.showCreateForProject.set(true); }
  }
  onProjectPhotoUploaded(): void { this.uploadTarget.set(null); this.projectView()?.loadData(); }
  onProjectTeacherCreated(): void { this.showCreateForProject.set(false); this.createForTeacher.set(null); this.projectView()?.loadData(); }
  onViewPhotoFromProject(item: ArchivePersonInSchool): void {
    if (item.photoUrl) this.lightboxMedia.set([{ id: item.archiveId, url: item.photoUrl, fileName: item.name }]);
  }
  onMarkNoPhotoFromProject(item: ArchivePersonInSchool): void { this.noPhotoTarget.set(item); }
  onConfirmNoPhoto(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action === 'confirm') {
      const t = this.noPhotoTarget();
      if (t) this.state.markNoPhoto(t.archiveId, () => this.projectView()?.markItemNoPhoto(t.archiveId));
    }
    this.noPhotoTarget.set(null);
  }
  onUndoNoPhotoFromProject(item: ArchivePersonInSchool): void {
    this.state.undoNoPhoto(item.archiveId, () => this.projectView()?.unmarkItemNoPhoto(item.archiveId));
  }

  // Sync
  onSyncPhotosFromProject(event: { schoolId: number; classYear?: string }): void {
    this.state.syncPhotos(event, (detail: SyncResultItem) => {
      this.projectView()?.updateItemField(detail.archiveId, {
        hasPhoto: true, hasSyncablePhoto: false,
        photoUrl: detail.photoUrl ?? null, photoThumbUrl: detail.photoThumbUrl ?? null,
        photoFileName: detail.photoFileName ?? null, photoTakenAt: detail.photoTakenAt ?? null,
      });
    });
  }
  onSyncSingleItem(item: ArchivePersonInSchool): void {
    if (!item.archiveId) return;
    this.state.syncSingleItem(item.archiveId, (data) => {
      this.projectView()?.updateItemField(item.archiveId, {
        hasPhoto: true, hasSyncablePhoto: false, photoUrl: data.photoUrl, photoThumbUrl: data.photoThumbUrl,
      });
    });
  }

  // Download
  onDownloadAllRequest(): void { this.downloadSchoolTarget.set(null); this.showDownloadDialog.set(true); }
  onDownloadSchoolRequest(school: ArchiveSchoolGroup): void { this.downloadSchoolTarget.set(school); this.showDownloadDialog.set(true); }
  onDownloadConfirm(options: ArchiveDownloadOptions): void {
    this.showDownloadDialog.set(false);
    const target = this.downloadSchoolTarget();
    if (target) {
      this.state.downloadSchoolZip(target, options.fileNaming);
    } else {
      this.state.downloadAllZip(this.projectView()?.selectedYear() || undefined, options.fileNaming);
    }
  }
}
