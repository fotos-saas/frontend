import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MarketerService, ProjectListItem, PaginatedResponse } from '../../services/marketer.service';
import { SharedQrCodeModalComponent } from '../../../../shared/components/qr-code-modal/qr-code-modal.component';
import { IQrCodeService } from '../../../../shared/interfaces/qr-code.interface';
import { QrButtonComponent, AddButtonComponent } from '../../../../shared/components/action-buttons';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { useFilterState, FilterStateApi } from '../../../../shared/utils/use-filter-state';

/**
 * Marketer Project List - Projektek paginált listája.
 */
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterModule, FormsModule, LucideAngularModule, SharedQrCodeModalComponent, QrButtonComponent, AddButtonComponent],
  template: `
    <div class="project-list-page page-card">
      <header class="page-header">
        <div class="header-content">
          <h1>Projektek</h1>
          <p class="subtitle">{{ totalProjects() }} projekt összesen</p>
        </div>
        <app-add-button
          [label]="'Új projekt'"
          [variant]="'primary'"
          (clicked)="createProject()"
        />
      </header>

      <!-- Keresés -->
      <div class="filters">
        <div class="search-box">
          <lucide-icon [name]="ICONS.SEARCH" class="search-icon" [size]="16" />
          <input
            type="text"
            placeholder="Keresés iskola vagy osztály neve alapján..."
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
          <select [ngModel]="filterState.sortBy()" (ngModelChange)="filterState.setSortBy($event)" class="filter-select">
            <option value="created_at">Létrehozás dátuma</option>
            <option value="class_year">Évfolyam</option>
          </select>

          <button class="sort-dir-btn" (click)="filterState.toggleSortDir()">
            <lucide-icon [name]="filterState.sortDir() === 'desc' ? ICONS.ARROW_DOWN : ICONS.ARROW_UP" [size]="16" />
          </button>
        </div>
      </div>

      <!-- Lista -->
      @if (filterState.loading()) {
        <div class="loading-state">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="project-row skeleton skeleton-shimmer"></div>
          }
        </div>
      } @else if (projects().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <h3>Nincs találat</h3>
          <p>Próbálj más keresési feltételekkel!</p>
        </div>
      } @else {
        <!-- Táblázat fejléc -->
        <div class="table-header">
          <div class="col-school">Iskola / Osztály</div>
          <div class="col-contact">Kapcsolattartó</div>
          <div class="col-actions">Műveletek</div>
        </div>

        <!-- Projekt sorok -->
        <div class="project-list">
          @for (project of projects(); track project.id; let i = $index) {
            <div
              class="project-row"
              [style.animation-delay]="i * 0.03 + 's'"
              (click)="viewProject(project)"
            >
              <div class="col-school">
                <span class="school-name">{{ project.schoolName ?? 'Ismeretlen iskola' }}</span>
                <span class="class-info">
                  {{ project.className }} {{ project.classYear }}
                </span>
              </div>

              <div class="col-contact">
                @if (project.contact) {
                  <span class="contact-name">{{ project.contact.name }}</span>
                  <span class="contact-email">{{ project.contact.email }}</span>
                } @else {
                  <span class="no-contact">-</span>
                }
              </div>

              <div class="col-actions" (click)="$event.stopPropagation()">
                <app-qr-button
                  [isActive]="project.hasActiveQrCode"
                  [variant]="'icon-only'"
                  (clicked)="openQrModal(project)"
                />
              </div>
            </div>
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
              ← Előző
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
              Következő →
            </button>
          </div>
        }
      }
    </div>

    <!-- QR Code Modal -->
    @if (showQrModal()) {
      <app-shared-qr-code-modal
        [projectId]="selectedProjectId()!"
        [projectName]="selectedProjectName()"
        [qrService]="qrService"
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


    /* Filters */
    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
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
      border-color: #1e3a5f;
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

      &:hover {
        color: #64748b;
        background: #f1f5f9;
      }
    }

    .filter-controls {
      display: flex;
      gap: 8px;
    }

    .filter-select {
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.875rem;
      background: #ffffff;
      cursor: pointer;
    }

    .sort-dir-btn {
      width: 44px;
      height: 44px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;

      &:hover {
        background: #f8fafc;
        color: #1e293b;
        border-color: #cbd5e1;
      }
    }

    /* Table Header */
    .table-header {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr;
      gap: 16px;
      padding: 12px 20px;
      background: #f8fafc;
      border-radius: 10px 10px 0 0;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      .col-actions {
        text-align: right;
      }
    }

    /* Project List */
    .project-list {
      background: #ffffff;
      border-radius: 0 0 10px 10px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-top: none;
    }

    .project-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: all 0.15s ease;
      animation: fadeIn 0.3s ease forwards;
      opacity: 0;
    }

    .project-row:nth-child(even) {
      background: #f8fafc;
    }

    .project-row:hover {
      background: #f1f5f9;
    }

    .project-row:last-child {
      border-bottom: none;
    }

    @keyframes fadeIn {
      to { opacity: 1; }
    }

    /* Column Styles */
    .col-school,
    .col-contact {
      display: flex;
      flex-direction: column;
    }

    .school-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9375rem;
    }

    .class-info {
      font-size: 0.8125rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .city-badge {
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.6875rem;
    }

    .contact-name {
      font-weight: 500;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .contact-email {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .no-contact {
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .col-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
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
      padding: 10px 20px;
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
      border-color: #1e3a5f;
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

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 16px;
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

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .loading-state .project-row {
      height: 72px;
      background: #e2e8f0;
      border-radius: 10px;
      animation: none;
      opacity: 1;
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

    /* Responsive - Tablet */
    @media (max-width: 1024px) {
      .table-header {
        display: none;
      }

      .filter-controls {
        display: none;
      }

      .project-row {
        grid-template-columns: 1fr auto;
        gap: 8px;
        padding: 12px 16px;
        align-items: center;
      }

      .col-school {
        grid-column: 1;
        grid-row: 1;
      }

      .col-contact {
        grid-column: 1;
        grid-row: 2;
        flex-direction: row;
        gap: 8px;
        font-size: 0.8125rem;
      }

      .contact-name {
        font-size: 0.8125rem;
      }

      .contact-name::after {
        content: '·';
        margin-left: 8px;
        color: #94a3b8;
      }

      .col-actions {
        grid-column: 2;
        grid-row: 1 / 3;

        // QR button nagyobb méret tableten
        app-qr-button ::ng-deep .qr-button--icon-only {
          width: 48px;
          height: 48px;

          lucide-icon {
            transform: scale(1.3);
          }
        }
      }
    }

    /* Responsive - Mobile */
    @media (max-width: 640px) {
      .project-row {
        grid-template-columns: 1fr;
        gap: 6px;
      }

      .col-actions {
        grid-column: 1;
        grid-row: 3;
        flex-direction: row;
        justify-content: flex-end;
        margin-top: 6px;
        padding-top: 8px;
        border-top: 1px solid #f1f5f9;
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
export class ProjectListComponent implements OnInit {
  private marketerService = inject(MarketerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /** ICONS konstansok a template-hez */
  readonly ICONS = ICONS;

  /** QR Service interface a shared modalhoz */
  readonly qrService: IQrCodeService = this.marketerService;

  // Filter state - központosított perzisztencia rendszerrel
  readonly filterState = useFilterState({
    context: { type: 'marketer', page: 'projects' },
    defaultFilters: {},
    defaultSortBy: 'created_at',
    defaultSortDir: 'desc',
    validation: {
      sortByOptions: ['created_at', 'class_year'],
    },
    onStateChange: () => this.loadProjects(),
  });

  projects = signal<ProjectListItem[]>([]);
  totalPages = signal(1);
  totalProjects = signal(0);

  // QR Modal
  showQrModal = signal(false);
  selectedProjectId = signal<number | null>(null);
  selectedProjectName = signal('');

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.filterState.loading.set(true);

    this.marketerService.getProjects({
      page: this.filterState.page(),
      per_page: 15,
      search: this.filterState.search() || undefined,
      sort_by: this.filterState.sortBy() as 'created_at' | 'class_year',
      sort_dir: this.filterState.sortDir()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.projects.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalProjects.set(response.total);
          this.filterState.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load projects:', err);
          this.filterState.loading.set(false);
        }
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filterState.setPage(page);
  }

  viewProject(project: ProjectListItem): void {
    this.router.navigate(['/marketer/projects', project.id]);
  }

  openQrModal(project: ProjectListItem): void {
    this.selectedProjectId.set(project.id);
    this.selectedProjectName.set(project.name);
    this.showQrModal.set(true);
  }

  closeQrModal(): void {
    this.showQrModal.set(false);
    this.selectedProjectId.set(null);
  }

  onQrCodeChanged(): void {
    // Frissítjük a listát, mert QR kód változott
    this.loadProjects();
  }

  createProject(): void {
    this.router.navigate(['/marketer/projects/new']);
  }
}
