import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
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
import { SmartFilterBarComponent, SortDef } from '../../../../shared/components/smart-filter-bar';

/**
 * Marketer Project List - Projektek paginált listája.
 */
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterModule, FormsModule, LucideAngularModule, SharedQrCodeModalComponent, QrButtonComponent, AddButtonComponent, SmartFilterBarComponent],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private marketerService = inject(MarketerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /** ICONS konstansok a template-hez */
  readonly ICONS = ICONS;

  /** QR Service interface a shared modalhoz */
  readonly qrService: IQrCodeService = this.marketerService;

  readonly marketerSortDef: SortDef = {
    options: [
      { value: 'created_at', label: 'Létrehozás dátuma' },
      { value: 'class_year', label: 'Évfolyam' },
    ],
  };

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
          this.logger.error('Failed to load projects', err);
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
