import { Component, OnInit, inject, signal, effect, DestroyRef, ChangeDetectionStrategy, ViewContainerRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerService, SchoolListItem, SchoolItem, SchoolLimits } from '../../services/partner.service';
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

/**
 * Partner School List - Iskolák listája a partner felületen.
 * Paginált táblázatos nézet, CRUD műveletekkel.
 */
@Component({
  selector: 'app-partner-school-list',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    SchoolEditModalComponent,
    SchoolLinkDialogComponent,
    ConfirmDialogComponent,
    UpgradeDialogComponent,
    GuidedTourComponent,
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

  // Filter state - központosított perzisztencia rendszerrel
  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'schools' },
    defaultFilters: {},
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    onStateChange: () => this.loadSchools(),
  });

  schools = signal<SchoolListItem[]>([]);
  totalPages = signal(1);
  totalSchools = signal(0);
  schoolLimits = signal<SchoolLimits | null>(null);

  // Modals
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  showUpgradeDialog = signal(false);
  showLinkDialog = signal(false);
  selectedSchool = signal<SchoolListItem | null>(null);
  modalMode = signal<'create' | 'edit'>('create');

  private readonly tourStartEffect = effect(() => {
    // Tour indítás, ha a loading befejeződött és vannak iskolák
    if (!this.filterState.loading() && this.schools().length > 0) {
      // requestAnimationFrame: DOM renderelés után
      requestAnimationFrame(() => this.tourService.startIfNeeded(SCHOOLS_TOUR));
    }
  });

  ngOnInit(): void {
    this.loadSchools();
  }

  loadSchools(): void {
    this.filterState.loading.set(true);

    this.partnerService.getSchools({
      page: this.filterState.page(),
      per_page: 18,
      search: this.filterState.search() || undefined
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

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filterState.setPage(page);
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
