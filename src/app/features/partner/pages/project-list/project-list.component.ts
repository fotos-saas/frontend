import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy, ViewContainerRef, viewChild, ComponentRef, HostListener } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerService, PartnerProjectListItem, ProjectLimits } from '../../services/partner.service';
import { PartnerTagService } from '../../services/partner-tag.service';
import { PsdStatusService } from '../../services/psd-status.service';
import { ElectronService } from '../../../../core/services/electron.service';
import { AuthService } from '@core/services/auth.service';
import { CreatePreliminaryModalComponent } from '../../components/create-preliminary-modal/create-preliminary-modal.component';
import { LinkPreliminaryDialogComponent } from '../../components/link-preliminary-dialog/link-preliminary-dialog.component';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';
import { PersonsModalComponent } from '../../components/persons-modal';
import { CreateProjectModalComponent } from '../../components/create-project-modal/create-project-modal.component';
import { CreateProjectWizardDialogComponent } from '../../components/create-project-wizard-dialog/create-project-wizard-dialog.component';
import { SharedQrCodeModalComponent } from '../../../../shared/components/qr-code-modal/qr-code-modal.component';
import { IQrCodeService } from '../../../../shared/interfaces/qr-code.interface';
import { PhotoUploadWizardComponent } from '../../components/photo-upload-wizard/photo-upload-wizard/photo-upload-wizard.component';
import { SamplesLightboxComponent } from '../../../../shared/components/samples-lightbox';
import { FilterConfig } from '../../../../shared/components/expandable-filters';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { useFilterState } from '../../../../shared/utils/use-filter-state';
import { generateYearOptions, getCurrentGraduationYear } from '../../../../shared/utils/year-options.util';
import { SmartFilterBarComponent, SearchConfig, SortDef } from '../../../../shared/components/smart-filter-bar';
import { TableHeaderComponent, TableColumn } from '../../../../shared/components/table-header';
import { SortOption } from './components/project-mobile-sort/project-mobile-sort.component';
import { ListPaginationComponent } from '../../../../shared/components/list-pagination/list-pagination.component';
import { OrderDataDialogComponent } from '../../components/order-data-dialog/order-data-dialog.component';
import { ProjectListActionsService } from './project-list-actions.service';
import { ExpandedTeacherViewComponent } from '../../components/expanded-teacher-view/expanded-teacher-view.component';
import { SyncDialogComponent } from '../../components/sync-dialog/sync-dialog.component';
import { SendToPrintDialogComponent } from '../../components/send-to-print-dialog/send-to-print-dialog.component';
import { PaginationPreferencesService } from '@core/services/pagination-preferences.service';

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
    CreateProjectWizardDialogComponent,
    SharedQrCodeModalComponent,
    PhotoUploadWizardComponent,
    SamplesLightboxComponent,
    ConfirmDialogComponent,
    SmartFilterBarComponent,
    TableHeaderComponent,
    ListPaginationComponent,
    CreatePreliminaryModalComponent,
    LinkPreliminaryDialogComponent,
    ExpandedTeacherViewComponent,
    SyncDialogComponent,
    SendToPrintDialogComponent,
  ],
  providers: [ProjectListActionsService],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerProjectListComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly partnerService = inject(PartnerService);
  private readonly tagService = inject(PartnerTagService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly psdStatusService = inject(PsdStatusService);
  private readonly electronService = inject(ElectronService);
  private readonly authService = inject(AuthService);
  private readonly paginationPrefs = inject(PaginationPreferencesService);

  /** Kiemelt akciók service */
  readonly actions = inject(ProjectListActionsService);

  readonly ICONS = ICONS;
  readonly isDevPartner = computed(() => this.authService.currentUserSignal()?.partner_id === 24);
  readonly isElectron = this.electronService.isElectron;

  readonly tableCols: TableColumn[] = [
    { key: 'sample', label: '', width: '48px' },
    { key: 'school_name', label: 'Iskola / Osztály', sortable: true },
    { key: 'aware', label: '', width: '24px', align: 'center', icon: 'check-circle', tooltip: 'Tudnak róla' },
    { key: 'photos_uploaded', label: '', width: '24px', align: 'center', icon: 'package-check', tooltip: 'Feltöltve' },
    { key: 'tablo_status', label: 'Státusz', width: '110px', align: 'center', sortable: true },
    { key: 'missing_count', label: 'Hiányzó', width: '75px', align: 'center', sortable: true },
    ...(this.electronService.isElectron ? [
      { key: 'psd', label: 'PSD', width: '110px', align: 'center' as const },
    ] : []),
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
      sortByOptions: ['created_at', 'photo_date', 'class_year', 'school_name', 'tablo_status', 'missing_count', 'samples_count', 'order_submitted_at', 'last_content_update', 'last_activity_at'],
      filterOptions: {
        aware: ['true', 'false'],
        draft: ['true', 'false'],
        photos_uploaded: ['true', 'false'],
      }
    },
    onStateChange: () => this.loadProjects(),
  });

  perPage = signal(this.paginationPrefs.getPerPage(12));

  projects = signal<PartnerProjectListItem[]>([]);
  totalPages = signal(1);
  totalProjects = signal(0);
  projectLimits = signal<ProjectLimits | null>(null);
  psdFilterActive = signal(false);
  /** Módosult PSD batch check betöltés jelző */
  readonly psdBatchLoading = this.psdStatusService.batchCheckLoading;
  /** Aktív projektek szűrő — kizárja a "Kész" és "Nyomdában" státuszokat */
  activeOnly = signal(localStorage.getItem('ps_active_filter') === 'true');

  /** Projektek — ha PSD szűrő aktív, a backend már szűrve adja (server-side) */
  readonly displayedProjects = computed(() => this.projects());

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
    { value: 'last_content_update', label: 'Legújabb fotó' },
    { value: 'last_activity_at', label: 'Módosítva' },
  ];

  readonly sortDef: SortDef = { options: this.sortOptions };

  // Projekt létrehozás módja
  projectCreationMode = signal<'simple' | 'wizard'>('simple');

  // Order Data Dialog
  private orderDataContainer = viewChild('orderDataContainer', { read: ViewContainerRef });
  private orderDataRef: ComponentRef<OrderDataDialogComponent> | null = null;

  // Computed-ok amik a service-t hívják
  readonly selectedProjects = computed(() => this.actions.selectedProjects(this.projects()));

  onPerPageChange(value: number): void {
    this.perPage.set(value);
    this.paginationPrefs.setPerPage(value);
    this.loadProjects();
  }

  toggleOrderSort(): void {
    this.filterState.setSortBy(this.filterState.sortBy() === 'order_submitted_at' ? 'created_at' : 'order_submitted_at');
  }

  toggleContentSort(): void {
    this.filterState.setSortBy(this.filterState.sortBy() === 'last_content_update' ? 'created_at' : 'last_content_update');
  }

  toggleActivitySort(): void {
    this.filterState.setSortBy(this.filterState.sortBy() === 'last_activity_at' ? 'created_at' : 'last_activity_at');
  }

  async togglePsdFilter(): Promise<void> {
    const newActive = !this.psdFilterActive();
    this.psdFilterActive.set(newActive);

    if (newActive) {
      // Batch check: az összes cache-elt placed-photos ellenőrzése a backenddel
      const ids = await this.psdStatusService.runBatchCheck();
      if (ids.length === 0) {
        // Ha nincs módosult, visszaállítjuk a szűrőt
        this.psdFilterActive.set(false);
        return;
      }
    }

    // Újratöltjük a projekt listát (a loadProjects kezeli a project_ids szűrőt)
    this.filterState.setPage(1);
    this.loadProjects();
  }

  toggleActiveFilter(): void {
    const newVal = !this.activeOnly();
    this.activeOnly.set(newVal);
    localStorage.setItem('ps_active_filter', String(newVal));
    this.filterState.setPage(1);
    this.loadProjects();
  }

  ngOnInit(): void {
    this.actions.init(this.projects, this.totalProjects, () => this.loadProjects());
    this.loadProjects();
    this.actions.checkSyncInBackground();
    this.loadTagsForFilter();
    this.loadProjectCreationMode();
  }

  private loadProjectCreationMode(): void {
    this.partnerService.getGlobalSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.projectCreationMode.set(res.data.project_creation_mode ?? 'simple'),
      });
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
              options: tags.map(t => ({ value: t.id.toString(), label: t.name })),
            };
            this.filterConfigs.update(configs => [...configs, tagFilter]);
          }
        },
      });
  }

  loadProjects(): void {
    this.actions.clearSelection();
    this.filterState.loading.set(true);

    const filters = this.filterState.filters();

    // Ha PSD szűrő aktív, a módosult projekt ID-kat server-side filterként küldjük
    const psdProjectIds = this.psdFilterActive() ? this.psdStatusService.modifiedProjectIds() : [];

    this.partnerService.getProjects({
      page: this.filterState.page(),
      per_page: this.perPage(),
      search: this.filterState.search() || undefined,
      sort_by: this.filterState.sortBy() as 'created_at' | 'photo_date' | 'class_year' | 'school_name' | 'tablo_status' | 'missing_count' | 'samples_count' | 'order_submitted_at' | 'last_content_update' | 'last_activity_at',
      sort_dir: this.filterState.sortDir(),
      status: filters['status'] || undefined,
      is_aware: filters['aware'] ? filters['aware'] === 'true' : undefined,
      has_draft: filters['draft'] ? filters['draft'] === 'true' : undefined,
      school_id: filters['school_id'] ? parseInt(filters['school_id'], 10) : undefined,
      graduation_year: filters['graduation_year'] ? parseInt(filters['graduation_year'], 10) : undefined,
      is_preliminary: filters['is_preliminary'] || undefined,
      photos_uploaded: filters['photos_uploaded'] || undefined,
      tag_ids: filters['tag_ids'] || undefined,
      project_ids: psdProjectIds.length > 0 ? psdProjectIds.join(',') : undefined,
      exclude_statuses: this.activeOnly() ? 'done,in_print' : undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.projects.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalProjects.set(response.total);
          this.projectLimits.set(response.limits ?? null);
          this.filterState.loading.set(false);
          this.psdStatusService.checkProjects(response.data);
        },
        error: (err) => {
          this.logger.error('Failed to load projects', err);
          this.filterState.loading.set(false);
        }
      });
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.actions.selectedProjectIds().size > 0) {
      this.actions.clearSelection();
    }
  }


  // Szinkronizálás dialógus
  showSyncDialog = signal(false);

  openSyncDialog(): void {
    this.showSyncDialog.set(true);
  }

  closeSyncDialog(): void {
    this.showSyncDialog.set(false);
  }

  onSyncCompleted(): void {
    this.loadProjects();
    this.actions.checkSyncInBackground();
  }

  // Bővített tanári nézet
  showExpandedTeacherView = signal(false);
  expandedTeacherViewProjectId = signal<number | null>(null);

  openExpandedTeacherView(data: { projectId: number }): void {
    this.actions.closeMissingModal();
    this.expandedTeacherViewProjectId.set(data.projectId);
    this.showExpandedTeacherView.set(true);
  }

  closeExpandedTeacherView(): void {
    this.showExpandedTeacherView.set(false);
    this.loadProjects();
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
}
