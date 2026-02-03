import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService, PartnerProjectListItem, SampleItem, ProjectLimits } from '../services/partner.service';
import { ProjectCardComponent } from '../components/project-card.component';
import { MissingPersonsModalComponent } from '../components/missing-persons-modal';
import { CreateProjectModalComponent } from '../components/create-project-modal.component';
import { QrCodeModalComponent } from '../components/qr-code-modal.component';
import { PhotoUploadWizardComponent } from '../components/photo-upload-wizard/photo-upload-wizard.component';
import { SamplesLightboxComponent, SampleLightboxItem } from '../../../shared/components/samples-lightbox';
import { ExpandableFiltersComponent, FilterConfig, FilterChangeEvent } from '../../../shared/components/expandable-filters';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../shared/constants/icons.constants';
import { useFilterState, FilterStateApi } from '../../../shared/utils/use-filter-state';

/**
 * Partner Project List - Projektek listája a fotós felületen.
 */
@Component({
  selector: 'app-partner-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    ProjectCardComponent,
    MissingPersonsModalComponent,
    CreateProjectModalComponent,
    QrCodeModalComponent,
    PhotoUploadWizardComponent,
    SamplesLightboxComponent,
    ExpandableFiltersComponent,
  ],
  template: `
    <div class="project-list-page page-card">
      <header class="page-header">
        <div class="header-content">
          <h1>Projektek</h1>
          @if (projectLimits()?.max !== null) {
            <p class="subtitle">{{ projectLimits()?.current }} / {{ projectLimits()?.max }} projekt</p>
          } @else {
            <p class="subtitle">{{ totalProjects() }} projekt összesen</p>
          }
        </div>
        <button
          type="button"
          class="btn-primary"
          [disabled]="projectLimits() && !projectLimits()!.can_create"
          [matTooltip]="projectLimits() && !projectLimits()!.can_create ? 'Elérted a csomagodban elérhető maximum projektszámot' : ''"
          (click)="openCreateModal()"
        >
          <lucide-icon [name]="ICONS.PLUS" [size]="18" />
          Új projekt
        </button>
      </header>

      <!-- Keresés és szűrők -->
      <div class="filters">
        <div class="search-box">
          <lucide-icon [name]="ICONS.SEARCH" class="search-icon" [size]="16" />
          <input
            type="text"
            placeholder='Keresés (#ID, @ügyintéző, "pontos kifejezés")...'
            [ngModel]="filterState.search()"
            (ngModelChange)="filterState.setSearch($event)"
            class="search-input"
          />
          @if (filterState.search()) {
            <button class="clear-btn" (click)="filterState.clearSearch()">
              <lucide-icon [name]="ICONS.X" [size]="14" />
            </button>
          }
        </div>

        <div class="filter-controls">
          <app-expandable-filters
            [filters]="filterConfigs"
            [values]="filterState.filters()"
            [visibleCount]="1"
            (filterChange)="onFilterChange($event)"
          />
        </div>
      </div>

      <!-- Lista -->
      @if (filterState.loading()) {
        <div class="loading-state">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="skeleton-card skeleton-shimmer"></div>
          }
        </div>
      } @else if (projects().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <lucide-icon [name]="ICONS.FOLDER_OPEN" [size]="48" />
          </div>
          <h3>Nincs találat</h3>
          @if (filterState.search()) {
            <p>Próbálj más keresési feltételekkel!</p>
          } @else {
            <p>Még nincsenek projektek. Hozz létre egyet!</p>
            <button type="button" class="btn-primary mt-4" (click)="openCreateModal()">
              <lucide-icon [name]="ICONS.PLUS" [size]="18" />
              Új projekt létrehozása
            </button>
          }
        </div>
      } @else {
        <!-- Mobil rendezés sáv (640px alatt látszik) -->
        <div class="mobile-sort-bar">
          <div class="mobile-sort-group">
            <label class="mobile-sort-label">Rendezés:</label>
            <div class="mobile-sort-dropdown">
              <button
                type="button"
                class="mobile-sort-trigger"
                (click)="toggleMobileSortDropdown()"
              >
                <span>{{ getCurrentSortLabel() }}</span>
                <lucide-icon [name]="ICONS.CHEVRON_DOWN" [size]="16" />
              </button>
              @if (showMobileSortDropdown()) {
                <div class="mobile-sort-options">
                  @for (opt of sortOptions; track opt.value) {
                    <button
                      type="button"
                      class="mobile-sort-option"
                      [class.mobile-sort-option--active]="filterState.sortBy() === opt.value"
                      (click)="selectMobileSort(opt.value)"
                    >
                      @if (filterState.sortBy() === opt.value) {
                        <lucide-icon [name]="ICONS.CHECK" [size]="14" />
                      }
                      {{ opt.label }}
                    </button>
                  }
                </div>
              }
            </div>
            <button
              type="button"
              class="mobile-sort-dir-btn"
              (click)="filterState.toggleSortDir()"
              [attr.aria-label]="filterState.sortDir() === 'asc' ? 'Növekvő sorrend' : 'Csökkenő sorrend'"
            >
              <lucide-icon [name]="filterState.sortDir() === 'asc' ? ICONS.ARROW_UP : ICONS.ARROW_DOWN" [size]="16" />
            </button>
          </div>
        </div>

        <!-- Asztali fejléc (640px felett látszik) -->
        <div class="table-header">
          <span class="th th-sample"></span>
          <button class="th th-school" [class.th--active]="filterState.sortBy() === 'school_name'" (click)="filterState.setSortBy('school_name')">
            Iskola / Osztály
            @if (filterState.sortBy() === 'school_name') {
              <lucide-icon [name]="filterState.sortDir() === 'asc' ? ICONS.ARROW_UP : ICONS.ARROW_DOWN" [size]="12" />
            }
          </button>
          <span class="th th-aware" data-tooltip="Tudnak róla">
            <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="12" />
          </span>
          <button class="th th-status" [class.th--active]="filterState.sortBy() === 'tablo_status'" (click)="filterState.setSortBy('tablo_status')">
            Státusz
            @if (filterState.sortBy() === 'tablo_status') {
              <lucide-icon [name]="filterState.sortDir() === 'asc' ? ICONS.ARROW_UP : ICONS.ARROW_DOWN" [size]="12" />
            }
          </button>
          <button class="th th-num" [class.th--active]="filterState.sortBy() === 'missing_count'" (click)="filterState.setSortBy('missing_count')">
            Hiányzó
            @if (filterState.sortBy() === 'missing_count') {
              <lucide-icon [name]="filterState.sortDir() === 'asc' ? ICONS.ARROW_UP : ICONS.ARROW_DOWN" [size]="12" />
            }
          </button>
          <span class="th th-qr">QR</span>
        </div>

        <!-- Projekt sorok -->
        <div class="project-grid">
          @for (project of projects(); track project.id; let i = $index) {
            <app-partner-project-card
              [project]="project"
              [style.animation-delay]="i * 0.05 + 's'"
              (cardClick)="viewProject($event)"
              (samplesClick)="openSamplesModal($event)"
              (missingClick)="openMissingModal($event)"
              (qrClick)="openQrModal($event)"
            />
          }
        </div>

        <!-- Paginálás -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button
              class="page-btn"
              [disabled]="filterState.page() === 1"
              (click)="goToPage(filterState.page() - 1)"
            >
              <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="16" />
              Előző
            </button>

            <div class="page-info">
              {{ filterState.page() }} / {{ totalPages() }} oldal
              <span class="total-count">({{ totalProjects() }} projekt)</span>
            </div>

            <button
              class="page-btn"
              [disabled]="filterState.page() === totalPages()"
              (click)="goToPage(filterState.page() + 1)"
            >
              Következő
              <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
            </button>
          </div>
        }
      }
    </div>

    <!-- Samples Lightbox - közvetlenül megnyílik -->
    @if (samplesLightboxIndex() !== null) {
      <app-samples-lightbox
        [samples]="lightboxSamples()"
        [currentIndex]="samplesLightboxIndex()!"
        (close)="closeSamplesLightbox()"
        (navigate)="samplesLightboxIndex.set($event)"
      />
    }

    <!-- Missing Persons Modal -->
    @if (showMissingModal()) {
      <app-missing-persons-modal
        [projectId]="selectedProject()!.id"
        [projectName]="selectedProject()!.name"
        (close)="closeMissingModal()"
        (openUploadWizard)="openUploadWizardFromMissing()"
      />
    }

    <!-- Photo Upload Wizard -->
    @if (showUploadWizard()) {
      <app-photo-upload-wizard
        [projectId]="selectedProject()!.id"
        [projectName]="selectedProject()!.name"
        (close)="closeUploadWizard()"
        (completed)="onUploadWizardCompleted($event)"
      />
    }

    <!-- Create Project Modal -->
    @if (showCreateModal()) {
      <app-create-project-modal
        (close)="closeCreateModal()"
        (projectCreated)="onProjectCreated($event)"
      />
    }

    <!-- QR Code Modal -->
    @if (showQrModal()) {
      <app-qr-code-modal
        [projectId]="selectedProject()!.id"
        [projectName]="selectedProject()!.name"
        (close)="closeQrModal()"
        (qrCodeChanged)="onQrCodeChanged()"
      />
    }
  `,
  styles: [`
    .project-list-page {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--color-primary, #1e3a5f);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #152a45);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Filters */
    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      align-items: center;
    }

    .search-box {
      flex: 1;
      min-width: 200px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      color: #94a3b8;
    }

    .search-input {
      width: 100%;
      padding: 12px 40px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9375rem;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .clear-btn:hover {
      color: #64748b;
      background: #f1f5f9;
    }

    .filter-controls {
      display: flex;
      align-items: center;
    }

    /* Table Header */
    .table-header {
      display: grid;
      grid-template-columns: 48px 1fr 24px 110px 75px 32px;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 4px;
    }

    .th-sample {
      /* üres oszlop a minta kép helyén */
    }

    .th {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      background: none;
      border: none;
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .th:hover {
      background: #f1f5f9;
      color: #475569;
    }

    .th--active {
      color: var(--color-primary, #1e3a5f);
      background: #e0f2fe;
    }

    .th-school { justify-content: flex-start; }
    .th-aware {
      justify-content: center;
      cursor: default;
      color: #94a3b8;
    }
    .th-aware:hover {
      background: none;
      color: #94a3b8;
    }
    .th-status { justify-content: center; }
    .th-num { justify-content: center; }
    .th-qr {
      justify-content: center;
      cursor: default;
    }
    .th-qr:hover {
      background: none;
      color: #64748b;
    }

    /* Project List */
    .project-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .empty-icon {
      color: #94a3b8;
      margin-bottom: 16px;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .empty-state h3 {
      font-size: 1.125rem;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      color: #64748b;
      margin: 0;
    }

    .mt-4 {
      margin-top: 16px;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-card {
      height: 72px;
      background: #e2e8f0;
      border-radius: 10px;
    }

    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      padding: 16px;
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .page-btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: var(--color-primary, #1e3a5f);
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 0.875rem;
      color: #475569;
    }

    .total-count {
      color: #94a3b8;
    }

    /* Mobile Sort Bar */
    .mobile-sort-bar {
      display: none; /* Alapból rejtett, csak mobilon látszik */
      padding: 12px;
      background: #f8fafc;
      border-radius: 10px;
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
    }

    .mobile-sort-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mobile-sort-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      white-space: nowrap;
    }

    .mobile-sort-dropdown {
      position: relative;
      flex: 1;
    }

    .mobile-sort-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .mobile-sort-trigger:hover {
      border-color: #cbd5e1;
    }

    .mobile-sort-trigger:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .mobile-sort-options {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 100;
      overflow: hidden;
      animation: dropdownFadeIn 0.15s ease;
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .mobile-sort-option {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border: none;
      background: transparent;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      text-align: left;
      transition: background 0.1s ease;
    }

    .mobile-sort-option:hover {
      background: #f1f5f9;
    }

    .mobile-sort-option--active {
      background: #e0f2fe;
      color: var(--color-primary, #1e3a5f);
      font-weight: 500;
    }

    .mobile-sort-option--active:hover {
      background: #bae6fd;
    }

    .mobile-sort-dir-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      color: #64748b;
      transition: all 0.15s ease;
    }

    .mobile-sort-dir-btn:hover {
      background: #f1f5f9;
      border-color: var(--color-primary, #1e3a5f);
      color: var(--color-primary, #1e3a5f);
    }

    .mobile-sort-dir-btn:active {
      transform: scale(0.95);
    }

    /* Responsive */
    @media (max-width: 640px) {
      /* Mobil: sort bar látszik, fejléc rejtve */
      .mobile-sort-bar {
        display: block;
      }

      .table-header {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .filter-controls {
        display: none;
      }

      .project-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-content h1 {
        font-size: 1.25rem;
      }

      .btn-primary {
        justify-content: center;
      }

      .filters {
        flex-direction: column;
        align-items: stretch;
      }

      .search-box {
        max-width: 100%;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerProjectListComponent implements OnInit {
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  /** ICONS konstansok */
  readonly ICONS = ICONS;

  // Filter state - központosított perzisztencia rendszerrel
  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'projects' },
    defaultFilters: { status: '', aware: '', draft: '' },
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

  // Státusz opciók (TabloProjectStatus enum alapján)
  readonly statusOptions = [
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

  // Szűrő konfigurációk az ExpandableFilters komponenshez
  // Sorrend: Státusz kívül (inline), Draft + Tudnak róla a "További"-ban
  readonly filterConfigs: FilterConfig[] = [
    {
      id: 'status',
      label: 'Összes státusz',
      icon: 'filter',
      options: this.statusOptions
    },
    {
      id: 'draft',
      label: 'Draft képek?',
      options: [
        { value: 'true', label: 'Van draft' },
        { value: 'false', label: 'Nincs draft' }
      ]
    },
    {
      id: 'aware',
      label: 'Tudnak róla?',
      options: [
        { value: 'true', label: 'Tudnak róla' },
        { value: 'false', label: 'Nem tudnak róla' }
      ]
    }
  ];

  // Rendezési opciók (mobil sort bar-hoz)
  readonly sortOptions = [
    { value: 'school_name', label: 'Iskola' },
    { value: 'tablo_status', label: 'Státusz' },
    { value: 'missing_count', label: 'Hiányzó' },
    { value: 'created_at', label: 'Létrehozva' },
  ];

  // Mobil sort dropdown
  showMobileSortDropdown = signal(false);

  // Modals
  showMissingModal = signal(false);
  showCreateModal = signal(false);
  showQrModal = signal(false);
  showUploadWizard = signal(false);
  selectedProject = signal<PartnerProjectListItem | null>(null);

  // Samples Lightbox - közvetlenül nyílik a modal helyett
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
    // useFilterState már betölti a perzisztált állapotot, csak az adatokat kell lekérni
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
      has_draft: filters['draft'] ? filters['draft'] === 'true' : undefined
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
          console.error('Failed to load projects:', err);
          this.filterState.loading.set(false);
        }
      });
  }

  /**
   * Egységes szűrő változás handler az ExpandableFilters komponenshez
   */
  onFilterChange(event: FilterChangeEvent): void {
    this.filterState.setFilter(event.id as 'status' | 'aware' | 'draft', event.value);
  }

  // Mobil sort dropdown kezelése
  toggleMobileSortDropdown(): void {
    this.showMobileSortDropdown.update(v => !v);
  }

  getCurrentSortLabel(): string {
    const opt = this.sortOptions.find(o => o.value === this.filterState.sortBy());
    return opt?.label || 'Rendezés';
  }

  selectMobileSort(value: string): void {
    this.showMobileSortDropdown.set(false);
    this.filterState.setSortBy(value);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.mobile-sort-dropdown')) {
      this.showMobileSortDropdown.set(false);
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filterState.setPage(page);
  }

  viewProject(project: PartnerProjectListItem): void {
    // Navigálás a projekt részletes nézethez
    this.router.navigate(['/partner/projects', project.id]);
  }

  // Samples Lightbox handlers - közvetlenül betölti a mintákat és megnyitja a lightboxot
  openSamplesModal(project: PartnerProjectListItem): void {
    this.selectedProject.set(project);
    // Betöltjük a mintákat és rögtön megnyitjuk a lightboxot
    this.partnerService.getProjectSamples(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            this.samplesData.set(response.data);
            this.samplesLightboxIndex.set(0); // Első képnél nyitjuk
          }
        },
        error: (err) => {
          console.error('Failed to load samples:', err);
        }
      });
  }

  closeSamplesLightbox(): void {
    this.samplesLightboxIndex.set(null);
    this.samplesData.set([]);
    this.selectedProject.set(null);
  }

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

  // Upload Wizard handlers
  openUploadWizardFromMissing(): void {
    // Bezárjuk a missing modal-t és megnyitjuk a wizard-ot
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
}
