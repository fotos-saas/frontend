import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy, ViewContainerRef, viewChild, ComponentRef } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { ToastService } from '@core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerService, PartnerProjectListItem, SampleItem, ProjectLimits } from '../../services/partner.service';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';
import { PersonsModalComponent } from '../../components/persons-modal';
import { CreateProjectModalComponent } from '../../components/create-project-modal/create-project-modal.component';
import { SharedQrCodeModalComponent } from '../../../../shared/components/qr-code-modal/qr-code-modal.component';
import { IQrCodeService } from '../../../../shared/interfaces/qr-code.interface';
import { PhotoUploadWizardComponent } from '../../components/photo-upload-wizard/photo-upload-wizard/photo-upload-wizard.component';
import { SamplesLightboxComponent, SampleLightboxItem } from '../../../../shared/components/samples-lightbox';
import { ExpandableFiltersComponent, FilterConfig, FilterChangeEvent } from '../../../../shared/components/expandable-filters';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { useFilterState } from '../../../../shared/utils/use-filter-state';
import { SmartFilterBarComponent, SearchConfig, SortDef } from '../../../../shared/components/smart-filter-bar';
import { ProjectTableHeaderComponent } from './components/project-table-header/project-table-header.component';
import { ProjectMobileSortComponent, SortOption } from './components/project-mobile-sort/project-mobile-sort.component';
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
    ExpandableFiltersComponent,
    ConfirmDialogComponent,
    SmartFilterBarComponent,
    ProjectTableHeaderComponent,
    ProjectMobileSortComponent,
    ListPaginationComponent,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerProjectListComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly ICONS = ICONS;
  readonly qrService: IQrCodeService = this.partnerService;

  readonly searchConfig: SearchConfig = {
    placeholder: 'Keresés (#ID, @ügyintéző, "pontos kifejezés")...',
    features: { id: true, assignee: true, exact: true },
  };

  // Tanév opciók generálása (aktuális évtől visszafelé)
  private readonly currentYear = new Date().getFullYear();
  readonly yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = this.currentYear - i;
    return { value: year.toString(), label: `${year}` };
  });

  // Filter state
  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'projects' },
    defaultFilters: { status: '', aware: '', draft: '', school_id: '', graduation_year: this.currentYear.toString() },
    defaultSortBy: 'created_at',
    defaultSortDir: 'desc',
    validation: {
      sortByOptions: ['created_at', 'photo_date', 'class_year', 'school_name', 'tablo_status', 'missing_count', 'samples_count'],
      filterOptions: {
        aware: ['true', 'false'],
        draft: ['true', 'false'],
      }
    },
    onStateChange: () => this.loadProjects(),
  });

  projects = signal<PartnerProjectListItem[]>([]);
  totalPages = signal(1);
  totalProjects = signal(0);
  projectLimits = signal<ProjectLimits | null>(null);

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

  readonly filterConfigs: FilterConfig[] = [
    { id: 'graduation_year', label: 'Tanév', icon: 'calendar', options: this.yearOptions },
    { id: 'status', label: 'Összes státusz', icon: 'filter', options: this.statusOptions },
    { id: 'draft', label: 'Draft képek?', options: [
      { value: 'true', label: 'Van draft' },
      { value: 'false', label: 'Nincs draft' }
    ]},
    { id: 'aware', label: 'Tudnak róla?', options: [
      { value: 'true', label: 'Tudnak róla' },
      { value: 'false', label: 'Nem tudnak róla' }
    ]}
  ];

  readonly sortOptions: SortOption[] = [
    { value: 'school_name', label: 'Iskola' },
    { value: 'tablo_status', label: 'Státusz' },
    { value: 'missing_count', label: 'Hiányzó' },
    { value: 'created_at', label: 'Létrehozva' },
  ];

  readonly sortDef: SortDef = {
    options: this.sortOptions,
  };

  // Modals
  showMissingModal = signal(false);
  showCreateModal = signal(false);
  showQrModal = signal(false);
  showUploadWizard = signal(false);
  selectedProject = signal<PartnerProjectListItem | null>(null);

  // Delete Confirm
  showDeleteConfirm = signal(false);
  deletingProjectName = signal('');
  isDeleting = signal(false);
  private deletingProjectId = signal<number | null>(null);

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

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.filterState.loading.set(true);

    const filters = this.filterState.filters();
    this.partnerService.getProjects({
      page: this.filterState.page(),
      per_page: 12,
      search: this.filterState.search() || undefined,
      sort_by: this.filterState.sortBy() as 'created_at' | 'photo_date' | 'class_year' | 'school_name' | 'tablo_status' | 'missing_count' | 'samples_count',
      sort_dir: this.filterState.sortDir(),
      status: filters['status'] || undefined,
      is_aware: filters['aware'] ? filters['aware'] === 'true' : undefined,
      has_draft: filters['draft'] ? filters['draft'] === 'true' : undefined,
      school_id: filters['school_id'] ? parseInt(filters['school_id'], 10) : undefined,
      graduation_year: filters['graduation_year'] ? parseInt(filters['graduation_year'], 10) : undefined
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

  openUploadWizardFromMissing(): void {
    this.showMissingModal.set(false);
    this.showUploadWizard.set(true);
  }

  closeUploadWizard(): void {
    this.showUploadWizard.set(false);
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
}
