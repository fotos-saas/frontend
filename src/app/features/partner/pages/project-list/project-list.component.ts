import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy, ViewContainerRef, viewChild, ComponentRef } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { ToastService } from '@core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerService, PartnerProjectListItem, SampleItem, ProjectLimits } from '../../services/partner.service';
import { PartnerTagService } from '../../services/partner-tag.service';
import { PartnerPreliminaryService } from '../../services/partner-preliminary.service';
import { PartnerOrderSyncService } from '../../services/partner-order-sync.service';
import { CreatePreliminaryModalComponent } from '../../components/create-preliminary-modal/create-preliminary-modal.component';
import { LinkPreliminaryDialogComponent } from '../../components/link-preliminary-dialog/link-preliminary-dialog.component';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';
import { PersonsModalComponent } from '../../components/persons-modal';
import { CreateProjectModalComponent } from '../../components/create-project-modal/create-project-modal.component';
import { SharedQrCodeModalComponent } from '../../../../shared/components/qr-code-modal/qr-code-modal.component';
import { IQrCodeService } from '../../../../shared/interfaces/qr-code.interface';
import { PhotoUploadWizardComponent } from '../../components/photo-upload-wizard/photo-upload-wizard/photo-upload-wizard.component';
import { SamplesLightboxComponent, SampleLightboxItem } from '../../../../shared/components/samples-lightbox';
import { FilterConfig, FilterChangeEvent } from '../../../../shared/components/expandable-filters';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { useFilterState } from '../../../../shared/utils/use-filter-state';
import { generateYearOptions, getCurrentGraduationYear } from '../../../../shared/utils/year-options.util';
import { SmartFilterBarComponent, SearchConfig, SortDef } from '../../../../shared/components/smart-filter-bar';
import { TableHeaderComponent, TableColumn } from '../../../../shared/components/table-header';
import { SortOption } from './components/project-mobile-sort/project-mobile-sort.component';
import { ListPaginationComponent } from '../../../../shared/components/list-pagination/list-pagination.component';
import { OrderDataDialogComponent } from '../../components/order-data-dialog/order-data-dialog.component';

/**
 * Partner Project List - Projektek listája a fotós felületen.
 */
@Component({
  selector: 'app-partner-project-list',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    ProjectCardComponent,
    PersonsModalComponent,
    CreateProjectModalComponent,
    SharedQrCodeModalComponent,
    PhotoUploadWizardComponent,
    SamplesLightboxComponent,
    ConfirmDialogComponent,
    SmartFilterBarComponent,
    TableHeaderComponent,
    ListPaginationComponent,
    CreatePreliminaryModalComponent,
    LinkPreliminaryDialogComponent,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerProjectListComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly partnerService = inject(PartnerService);
  private readonly tagService = inject(PartnerTagService);
  private readonly preliminaryService = inject(PartnerPreliminaryService);
  private readonly orderSyncService = inject(PartnerOrderSyncService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly ICONS = ICONS;

  readonly tableCols: TableColumn[] = [
    { key: 'sample', label: '', width: '48px' },
    { key: 'school_name', label: 'Iskola / Osztály', sortable: true },
    { key: 'aware', label: '', width: '24px', align: 'center', icon: 'check-circle', tooltip: 'Tudnak róla' },
    { key: 'photos_uploaded', label: '', width: '24px', align: 'center', icon: 'package-check', tooltip: 'Feltöltve' },
    { key: 'tablo_status', label: 'Státusz', width: '110px', align: 'center', sortable: true },
    { key: 'missing_count', label: 'Hiányzó', width: '75px', align: 'center', sortable: true },
    { key: 'actions', label: '', width: '56px' },
  ];
  readonly gridTemplate = this.tableCols.map(c => c.width ?? '1fr').join(' ');
  readonly qrService: IQrCodeService = this.partnerService;

  readonly searchConfig: SearchConfig = {
    placeholder: 'Keresés (#ID, @ügyintéző, "pontos kifejezés")...',
    features: { id: true, assignee: true, exact: true },
  };

  readonly yearOptions = generateYearOptions();

  // Filter state
  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'projects' },
    defaultFilters: { status: '', aware: '', draft: '', school_id: '', graduation_year: getCurrentGraduationYear().toString(), is_preliminary: '', photos_uploaded: '', tag_ids: '' },
    defaultSortBy: 'created_at',
    defaultSortDir: 'desc',
    validation: {
      sortByOptions: ['created_at', 'photo_date', 'class_year', 'school_name', 'tablo_status', 'missing_count', 'samples_count', 'order_submitted_at', 'last_content_update'],
      filterOptions: {
        aware: ['true', 'false'],
        draft: ['true', 'false'],
        photos_uploaded: ['true', 'false'],
      }
    },
    onStateChange: () => this.loadProjects(),
  });

  projects = signal<PartnerProjectListItem[]>([]);
  totalPages = signal(1);
  totalProjects = signal(0);
  projectLimits = signal<ProjectLimits | null>(null);
  syncing = signal(false);
  pendingSyncCount = signal<number | null>(null);

  // Státusz opciók
  readonly statusOptions = [
    { value: '', label: 'Mind' },
    { value: 'not_started', label: 'Nincs elkezdve' },
    { value: 'should_finish', label: 'Be kellene fejeznem' },
    { value: 'waiting_for_response', label: 'Válaszra várok' },
    { value: 'done', label: 'Kész' },
    { value: 'waiting_for_finalization', label: 'Véglegesítésre várok' },
    { value: 'in_print', label: 'Nyomdában' },
    { value: 'waiting_for_photos', label: 'Képekre várok' },
    { value: 'got_response', label: 'Kaptam választ' },
    { value: 'needs_forwarding', label: 'Tovább kell küldeni' },
    { value: 'at_teacher_for_finalization', label: 'Osztályfőnöknél véglegesítésen' },
    { value: 'needs_call', label: 'Fel kell hívni, mert nem válaszol' },
    { value: 'sos_waiting_for_photos', label: 'SOS képekre vár' },
    { value: 'push_could_be_done', label: 'Nyomni, mert kész lehetne' },
  ];

  filterConfigs = signal<FilterConfig[]>([
    { id: 'graduation_year', label: 'Tanév', icon: 'calendar', options: this.yearOptions },
    { id: 'status', label: 'Összes státusz', icon: 'filter', options: this.statusOptions },
    { id: 'is_preliminary', label: 'Típus', options: [
      { value: 'false', label: 'Rendes projektek' },
      { value: 'true', label: 'Előzetes projektek' },
    ]},
    { id: 'draft', label: 'Draft képek?', options: [
      { value: 'true', label: 'Van draft' },
      { value: 'false', label: 'Nincs draft' }
    ]},
    { id: 'aware', label: 'Tudnak róla?', options: [
      { value: 'true', label: 'Tudnak róla' },
      { value: 'false', label: 'Nem tudnak róla' }
    ]},
    { id: 'photos_uploaded', label: 'Feltöltve?', options: [
      { value: 'true', label: 'Feltöltve' },
      { value: 'false', label: 'Nincs feltöltve' }
    ]}
  ]);

  readonly sortOptions: SortOption[] = [
    { value: 'school_name', label: 'Iskola' },
    { value: 'tablo_status', label: 'Státusz' },
    { value: 'missing_count', label: 'Hiányzó' },
    { value: 'created_at', label: 'Létrehozva' },
    { value: 'order_submitted_at', label: 'Leadva' },
    { value: 'last_content_update', label: 'Módosítva' },
  ];

  readonly sortDef: SortDef = {
    options: this.sortOptions,
  };

  // Modals
  showMissingModal = signal(false);
  showCreateModal = signal(false);
  showQrModal = signal(false);
  showUploadWizard = signal(false);
  uploadWizardAlbum = signal<'students' | 'teachers' | undefined>(undefined);
  selectedProject = signal<PartnerProjectListItem | null>(null);

  // Delete Confirm
  showDeleteConfirm = signal(false);
  deletingProjectName = signal('');
  isDeleting = signal(false);
  private deletingProjectId = signal<number | null>(null);

  // Preliminary Project Modals
  showCreatePreliminaryModal = signal(false);
  showLinkDialog = signal(false);
  linkingProject = signal<PartnerProjectListItem | null>(null);

  // Order Data Dialog
  private orderDataContainer = viewChild('orderDataContainer', { read: ViewContainerRef });
  private orderDataRef: ComponentRef<OrderDataDialogComponent> | null = null;

  // Samples Lightbox
  samplesLightboxIndex = signal<number | null>(null);
  private samplesData = signal<SampleItem[]>([]);
  readonly lightboxSamples = computed<SampleLightboxItem[]>(() =>
    this.samplesData().map(s => ({
      id: s.id,
      url: s.url,
      thumbUrl: s.thumbnailUrl,
      fileName: s.name,
      createdAt: s.createdAt || new Date().toISOString(),
      description: s.description
    }))
  );

  toggleOrderSort(): void {
    if (this.filterState.sortBy() === 'order_submitted_at') {
      this.filterState.setSortBy('created_at');
    } else {
      this.filterState.setSortBy('order_submitted_at');
    }
  }

  toggleContentSort(): void {
    if (this.filterState.sortBy() === 'last_content_update') {
      this.filterState.setSortBy('created_at');
    } else {
      this.filterState.setSortBy('last_content_update');
    }
  }

  ngOnInit(): void {
    this.loadProjects();
    this.checkSyncInBackground();
    this.loadTagsForFilter();
  }

  private loadTagsForFilter(): void {
    this.tagService.getTags()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const tags = response.data;
          if (tags.length > 0) {
            const tagFilter: FilterConfig = {
              id: 'tag_ids',
              label: 'Címke',
              icon: 'tag',
              options: [
                ...tags.map(t => ({ value: t.id.toString(), label: t.name })),
              ],
            };
            this.filterConfigs.update(configs => [...configs, tagFilter]);
          }
        },
      });
  }

  loadProjects(): void {
    this.filterState.loading.set(true);

    const filters = this.filterState.filters();
    this.partnerService.getProjects({
      page: this.filterState.page(),
      per_page: 12,
      search: this.filterState.search() || undefined,
      sort_by: this.filterState.sortBy() as 'created_at' | 'photo_date' | 'class_year' | 'school_name' | 'tablo_status' | 'missing_count' | 'samples_count' | 'order_submitted_at' | 'last_content_update',
      sort_dir: this.filterState.sortDir(),
      status: filters['status'] || undefined,
      is_aware: filters['aware'] ? filters['aware'] === 'true' : undefined,
      has_draft: filters['draft'] ? filters['draft'] === 'true' : undefined,
      school_id: filters['school_id'] ? parseInt(filters['school_id'], 10) : undefined,
      graduation_year: filters['graduation_year'] ? parseInt(filters['graduation_year'], 10) : undefined,
      is_preliminary: filters['is_preliminary'] || undefined,
      photos_uploaded: filters['photos_uploaded'] || undefined,
      tag_ids: filters['tag_ids'] || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.projects.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalProjects.set(response.total);
          this.projectLimits.set(response.limits ?? null);
          this.filterState.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to load projects', err);
          this.filterState.loading.set(false);
        }
      });
  }

  viewProject(project: PartnerProjectListItem): void {
    this.router.navigate(['/partner/projects', project.id]);
  }

  // Samples Lightbox handlers
  openSamplesModal(project: PartnerProjectListItem): void {
    this.selectedProject.set(project);
    this.partnerService.getProjectSamples(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            this.samplesData.set(response.data);
            this.samplesLightboxIndex.set(0);
          }
        },
        error: (err) => this.logger.error('Failed to load samples', err)
      });
  }

  closeSamplesLightbox(): void {
    this.samplesLightboxIndex.set(null);
    this.samplesData.set([]);
    this.selectedProject.set(null);
  }

  // Modal handlers
  openMissingModal(project: PartnerProjectListItem): void {
    this.selectedProject.set(project);
    this.showMissingModal.set(true);
  }

  closeMissingModal(): void {
    this.showMissingModal.set(false);
    this.selectedProject.set(null);
    this.loadProjects();
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onProjectCreated(project: PartnerProjectListItem): void {
    this.closeCreateModal();
    this.loadProjects();
  }

  openQrModal(project: PartnerProjectListItem): void {
    this.selectedProject.set(project);
    this.showQrModal.set(true);
  }

  closeQrModal(): void {
    this.showQrModal.set(false);
    this.selectedProject.set(null);
  }

  onQrCodeChanged(): void {
    this.loadProjects();
  }

  openUploadWizardFromMissing(personType: 'student' | 'teacher'): void {
    this.showMissingModal.set(false);
    this.uploadWizardAlbum.set(personType === 'student' ? 'students' : 'teachers');
    this.showUploadWizard.set(true);
  }

  closeUploadWizard(): void {
    this.showUploadWizard.set(false);
    this.uploadWizardAlbum.set(undefined);
    this.selectedProject.set(null);
  }

  onUploadWizardCompleted(result: { assignedCount: number }): void {
    this.closeUploadWizard();
    this.loadProjects();
  }

  onStatusChange(event: { projectId: number; status: string; label: string; color: string }): void {
    this.partnerService.updateProject(event.projectId, { status: event.status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.projects.update(projects =>
            projects.map(p =>
              p.id === event.projectId
                ? { ...p, status: event.status, statusLabel: event.label, statusColor: event.color }
                : p
            )
          );
        },
        error: (err) => this.logger.error('Failed to update status', err)
      });
  }

  toggleAware(project: PartnerProjectListItem): void {
    this.partnerService.toggleProjectAware(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.projects.update(projects =>
            projects.map(p =>
              p.id === project.id ? { ...p, isAware: response.isAware } : p
            )
          );
        },
        error: (err) => this.logger.error('Failed to toggle aware', err)
      });
  }

  togglePhotosUploaded(project: PartnerProjectListItem): void {
    const prev = project.photosUploaded;
    this.projects.update(projects =>
      projects.map(p => p.id === project.id ? { ...p, photosUploaded: !prev } : p)
    );
    this.partnerService.togglePhotosUploaded(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.projects.update(projects =>
            projects.map(p => p.id === project.id ? { ...p, photosUploaded: prev } : p)
          );
        }
      });
  }

  // Order Data Dialog
  openOrderDataDialog(project: PartnerProjectListItem): void {
    const container = this.orderDataContainer();
    if (!container) return;

    container.clear();
    this.orderDataRef = container.createComponent(OrderDataDialogComponent);
    this.orderDataRef.setInput('projectId', project.id);
    this.orderDataRef.instance.close.subscribe(() => this.closeOrderDataDialog());
  }

  closeOrderDataDialog(): void {
    this.orderDataRef?.destroy();
    this.orderDataRef = null;
  }

  // Delete Project
  confirmDeleteProject(project: PartnerProjectListItem): void {
    this.deletingProjectId.set(project.id);
    this.deletingProjectName.set(project.name || project.schoolName || 'Ismeretlen');
    this.showDeleteConfirm.set(true);
  }

  onDeleteResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.executeDeleteProject();
    } else {
      this.showDeleteConfirm.set(false);
      this.deletingProjectId.set(null);
    }
  }

  private executeDeleteProject(): void {
    const projectId = this.deletingProjectId();
    if (!projectId) return;

    this.isDeleting.set(true);
    this.partnerService.deleteProject(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.showDeleteConfirm.set(false);
          this.projects.update(list => list.filter(p => p.id !== projectId));
          this.totalProjects.update(t => t - 1);
          this.deletingProjectId.set(null);
          this.toast.success('Törölve', 'A projekt sikeresen törölve.');
        },
        error: (err) => {
          this.isDeleting.set(false);
          this.showDeleteConfirm.set(false);
          this.logger.error('Failed to delete project', err);
          this.toast.error('Hiba', 'Nem sikerült törölni a projektet.');
        }
      });
  }

  // Preliminary Project handlers
  openCreatePreliminaryModal(): void {
    this.showCreatePreliminaryModal.set(true);
  }

  closeCreatePreliminaryModal(): void {
    this.showCreatePreliminaryModal.set(false);
  }

  onPreliminaryCreated(): void {
    this.closeCreatePreliminaryModal();
    this.loadProjects();
    this.toast.success('Létrehozva', 'Előzetes projekt sikeresen létrehozva.');
  }

  openLinkDialog(project: PartnerProjectListItem): void {
    this.linkingProject.set(project);
    this.showLinkDialog.set(true);
  }

  closeLinkDialog(): void {
    this.showLinkDialog.set(false);
    this.linkingProject.set(null);
  }

  onPreliminaryLinked(): void {
    this.closeLinkDialog();
    this.loadProjects();
    this.toast.success('Összekapcsolva', 'Az előzetes projekt sikeresen összekapcsolva.');
  }

  private checkSyncInBackground(): void {
    this.orderSyncService.checkSync()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.pendingSyncCount.set(res.data?.pending_count ?? 0);
        },
        error: () => {
          this.pendingSyncCount.set(0);
        },
      });
  }

  triggerSync(): void {
    if (this.syncing()) return;

    const pending = this.pendingSyncCount();

    // Ha nincs pending vagy 0 → frissítsd a check-et
    if (pending === null || pending === 0) {
      this.syncing.set(true);
      this.orderSyncService.checkSync()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.syncing.set(false);
            const count = res.data?.pending_count ?? 0;
            this.pendingSyncCount.set(count);
            if (count === 0) {
              this.toast.info('Naprakész', 'Nincs új szinkronizálandó projekt');
            }
          },
          error: () => {
            this.syncing.set(false);
            this.toast.error('Hiba', 'Nem sikerült ellenőrizni a régi rendszert');
          },
        });
      return;
    }

    // Ha van pending → szinkronizálás
    this.syncing.set(true);
    this.orderSyncService.triggerSync()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.syncing.set(false);
          this.pendingSyncCount.set(0);
          if (res.data?.created > 0) {
            this.toast.success('Szinkronizálva', res.message);
            this.loadProjects();
          } else {
            this.toast.info('Kész', res.message);
          }
        },
        error: (err) => {
          this.syncing.set(false);
          this.pendingSyncCount.set(null);
          this.toast.error('Hiba', err.error?.message || 'Szinkronizálás sikertelen');
          this.logger.error('Sync trigger error', err);
        },
      });
  }
}
