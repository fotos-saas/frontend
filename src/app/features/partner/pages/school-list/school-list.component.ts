import { Component, OnInit, inject, signal, computed, effect, DestroyRef, ChangeDetectionStrategy, ViewContainerRef, viewChild, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgTemplateOutlet } from '@angular/common';
import { PartnerService, SchoolListItem, SchoolItem, SchoolLimits, SchoolGroupRow } from '../../services/partner.service';
import { PartnerSchoolService } from '../../services/partner-school.service';
import { SelectionDownloadResult } from '../../components/selection-download-dialog/selection-download-dialog.component';
import { saveFile } from '../../../../shared/utils/file.util';
import { abbreviateMiddle } from '../../../../shared/utils/string.util';
import { ToastService } from '../../../../core/services/toast.service';
import { SchoolEditModalComponent } from '../../components/school-edit-modal/school-edit-modal.component';
import { SchoolLinkDialogComponent } from '../../components/school-link-dialog/school-link-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UpgradeDialogComponent } from '../../../../shared/components/upgrade-dialog/upgrade-dialog.component';
import { GuidedTourComponent } from '../../../../shared/components/guided-tour/guided-tour.component';
import { GuidedTourService } from '../../../../core/services/guided-tour.service';
import { SCHOOLS_TOUR } from '../../../../shared/components/guided-tour/tours';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { useFilterState, FilterStateApi } from '../../../../shared/utils/use-filter-state';
import { SmartFilterBarComponent, SearchConfig, FilterConfig } from '../../../../shared/components/smart-filter-bar';
import { ListPaginationComponent } from '../../../../shared/components/list-pagination/list-pagination.component';
import { TableHeaderComponent, TableColumn } from '../../../../shared/components/table-header';
import { generateYearOptions, getCurrentGraduationYear } from '../../../../shared/utils/year-options.util';

/**
 * Partner School List - Iskolák listája a partner felületen.
 * Paginált táblázatos nézet, CRUD műveletekkel.
 */
@Component({
  selector: 'app-partner-school-list',
  standalone: true,
  imports: [
    FormsModule,
    NgTemplateOutlet,
    LucideAngularModule,
    MatTooltipModule,
    SchoolEditModalComponent,
    SchoolLinkDialogComponent,
    ConfirmDialogComponent,
    UpgradeDialogComponent,
    GuidedTourComponent,
    SmartFilterBarComponent,
    ListPaginationComponent,
    TableHeaderComponent,
  ],
  templateUrl: './school-list.component.html',
  styleUrl: './school-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerSchoolListComponent implements OnInit {
  private readonly partnerService = inject(PartnerService);
  private readonly schoolService = inject(PartnerSchoolService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly tourService = inject(GuidedTourService);

  private readonly downloadDialogContainer = viewChild('downloadDialogContainer', { read: ViewContainerRef });

  readonly ICONS = ICONS;

  readonly tableCols: TableColumn[] = [
    { key: 'name', label: 'Iskola' },
    { key: 'projects', label: 'Projektek', width: '100px', align: 'center' },
    { key: 'actions', label: 'Műveletek', width: '120px', align: 'center' },
  ];
  readonly gridTemplate = computed(() => this.tableCols.map(c => c.width ?? '1fr').join(' '));

  readonly searchConfig: SearchConfig = {
    placeholder: 'Keresés (#ID, "pontos kifejezés", iskola neve vagy város)...',
    features: { id: true, exact: true },
  };

  readonly schoolFilterConfigs: FilterConfig[] = [
    { id: 'graduation_year', label: 'Tanév', icon: 'calendar', options: generateYearOptions() },
  ];

  // Filter state - központosított perzisztencia rendszerrel
  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'schools' },
    defaultFilters: { graduation_year: getCurrentGraduationYear().toString() },
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    onStateChange: () => this.loadSchools(),
  });

  schools = signal<SchoolListItem[]>([]);
  totalPages = signal(1);
  totalSchools = signal(0);
  schoolLimits = signal<SchoolLimits | null>(null);

  // Csoportosított nézet (linked_group alapján)
  readonly groupedSchools = computed<SchoolGroupRow[]>(() => {
    const schools = this.schools();
    const groupMap = new Map<string, SchoolGroupRow>();
    const result: SchoolGroupRow[] = [];
    const seen = new Set<string>();

    for (const s of schools) {
      if (!s.linkedGroup) {
        result.push({ primary: s, members: [], linkedGroup: null });
        continue;
      }
      if (seen.has(s.linkedGroup)) {
        groupMap.get(s.linkedGroup)!.members.push(s);
        continue;
      }
      seen.add(s.linkedGroup);
      const row: SchoolGroupRow = { primary: s, members: [], linkedGroup: s.linkedGroup };
      groupMap.set(s.linkedGroup, row);
      result.push(row);
    }
    return result;
  });

  readonly expandedGroups = signal<Set<string>>(new Set());

  private readonly resetExpandEffect = effect(() => {
    this.schools();
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

  trackByGroup(row: SchoolGroupRow): string | number {
    return row.linkedGroup ?? row.primary.id;
  }

  // Modals
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  showUpgradeDialog = signal(false);
  showLinkDialog = signal(false);
  selectedSchool = signal<SchoolListItem | null>(null);
  modalMode = signal<'create' | 'edit'>('create');

  private readonly tourStartEffect = effect(() => {
    if (!this.filterState.loading()) {
      requestAnimationFrame(() => this.tourService.startIfNeeded(SCHOOLS_TOUR));
    }
  });

  ngOnInit(): void {
    this.loadSchools();
  }

  restartTour(): void {
    this.tourService.start(SCHOOLS_TOUR);
  }

  loadSchools(): void {
    this.filterState.loading.set(true);

    const filters = this.filterState.filters();
    this.partnerService.getSchools({
      page: this.filterState.page(),
      per_page: 18,
      search: this.filterState.search() || undefined,
      graduation_year: filters['graduation_year'] ? parseInt(filters['graduation_year'], 10) : undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.schools.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalSchools.set(response.total);
          this.schoolLimits.set(response.limits ?? null);
          this.filterState.loading.set(false);
        },
        error: () => {
          this.filterState.loading.set(false);
        }
      });
  }

  openSchoolDetail(school: SchoolListItem): void {
    this.router.navigate(['/partner/projects/schools', school.id]);
  }

  onNewSchoolClick(): void {
    if (this.schoolLimits() && !this.schoolLimits()!.can_create) {
      // UpgradeDialog kezeli a csapattag üzenetet is
      this.showUpgradeDialog.set(true);
    } else {
      this.openCreateModal();
    }
  }

  openCreateModal(): void {
    this.selectedSchool.set(null);
    this.modalMode.set('create');
    this.showEditModal.set(true);
  }

  editSchool(school: SchoolListItem): void {
    this.selectedSchool.set(school);
    this.modalMode.set('edit');
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedSchool.set(null);
  }

  onSchoolSaved(updatedSchool: SchoolItem): void {
    this.closeEditModal();
    this.loadSchools();
  }

  confirmDeleteSchool(school: SchoolListItem): void {
    if (school.projectsCount > 0) return;
    this.selectedSchool.set(school);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.selectedSchool.set(null);
  }

  onDeleteConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.deleteSchool();
    } else {
      this.closeDeleteConfirm();
    }
  }

  deleteSchool(): void {
    const school = this.selectedSchool();
    if (!school) return;

    this.partnerService.deleteSchool(school.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeDeleteConfirm();
          this.loadSchools();
        },
        error: () => {
          this.closeDeleteConfirm();
        }
      });
  }

  getLinkedSchoolNames(school: SchoolListItem): string {
    return school.linkedSchools?.map(s => s.name).join(', ') ?? '';
  }

  // === Iskola összekapcsolás ===

  openLinkDialog(school: SchoolListItem): void {
    this.selectedSchool.set(school);
    this.showLinkDialog.set(true);
  }

  closeLinkDialog(): void {
    this.showLinkDialog.set(false);
    this.selectedSchool.set(null);
  }

  onLinkSaved(): void {
    this.closeLinkDialog();
    this.loadSchools();
  }

  unlinkSchool(school: SchoolListItem): void {
    this.partnerService.unlinkSchool(school.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadSchools() });
  }

  // === Tanári fotók letöltése ===

  async openDownloadDialog(school: SchoolListItem): Promise<void> {
    const container = this.downloadDialogContainer();
    if (!container) return;

    this.selectedSchool.set(school);
    container.clear();
    const { SelectionDownloadDialogComponent } = await import(
      '../../components/selection-download-dialog/selection-download-dialog.component'
    );
    const ref = container.createComponent(SelectionDownloadDialogComponent);
    ref.setInput('mode', 'school');
    ref.instance.close.subscribe(() => container.clear());
    ref.instance.download.subscribe((result: SelectionDownloadResult) => {
      container.clear();
      this.downloadTeacherPhotos(school, result.fileNaming, result.allProjects);
    });
  }

  private downloadTeacherPhotos(school: SchoolListItem, fileNaming: string, allProjects = false): void {
    this.schoolService.downloadTeacherPhotosZip(school.id, fileNaming, allProjects)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const name = abbreviateMiddle(school.name, 40);
          saveFile(blob, `${name} - tanarok.zip`);
          this.toast.success('Siker', 'ZIP letöltve');
        },
        error: () => {
          this.toast.error('Hiba', 'A ZIP letöltés nem sikerült');
        },
      });
  }
}
