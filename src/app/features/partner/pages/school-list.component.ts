import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService, SchoolListItem, SchoolItem } from '../services/partner.service';
import { SchoolEditModalComponent } from '../components/school-edit-modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../shared/constants/icons.constants';
import { useFilterState, FilterStateApi } from '../../../shared/utils/use-filter-state';

/**
 * Partner School List - Iskolák listája a partner felületen.
 * Paginált táblázatos nézet, CRUD műveletekkel.
 */
@Component({
  selector: 'app-partner-school-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    SchoolEditModalComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './school-list.component.html',
  styleUrl: './school-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerSchoolListComponent implements OnInit {
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

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

  // Modals
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  selectedSchool = signal<SchoolListItem | null>(null);
  modalMode = signal<'create' | 'edit'>('create');

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

  viewSchoolProjects(school: SchoolListItem): void {
    this.router.navigate(['/partner/projects'], {
      queryParams: { search: school.name }
    });
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
}
