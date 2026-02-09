import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { PartnerSchoolService } from '../../services/partner-school.service';
import { TeacherListItem } from '../../models/teacher.models';
import { SchoolItem } from '../../models/partner.models';
import { TeacherEditModalComponent } from '../../components/teacher-edit-modal/teacher-edit-modal.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { useFilterState } from '../../../../shared/utils/use-filter-state';

@Component({
  selector: 'app-partner-teacher-list',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    TeacherEditModalComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './teacher-list.component.html',
  styleUrl: './teacher-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerTeacherListComponent implements OnInit {
  private readonly teacherService = inject(PartnerTeacherService);
  private readonly schoolService = inject(PartnerSchoolService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ICONS = ICONS;

  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'teachers' },
    defaultFilters: { school_id: '' },
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    onStateChange: () => this.loadTeachers(),
  });

  teachers = signal<TeacherListItem[]>([]);
  totalPages = signal(1);
  totalTeachers = signal(0);
  schools = signal<SchoolItem[]>([]);

  // Modals
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  selectedTeacher = signal<TeacherListItem | null>(null);
  modalMode = signal<'create' | 'edit'>('create');

  ngOnInit(): void {
    this.loadSchools();
    this.loadTeachers();
  }

  loadSchools(): void {
    this.schoolService.getAllSchools()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (data) => this.schools.set(data) });
  }

  loadTeachers(): void {
    this.filterState.loading.set(true);
    const schoolId = this.filterState.filters().school_id;

    this.teacherService.getTeachers({
      page: this.filterState.page(),
      per_page: 18,
      search: this.filterState.search() || undefined,
      school_id: schoolId ? parseInt(schoolId, 10) : undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.teachers.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalTeachers.set(response.total);
          this.filterState.loading.set(false);
        },
        error: () => this.filterState.loading.set(false),
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filterState.setPage(page);
  }

  onSchoolFilterChange(value: string): void {
    this.filterState.setFilter('school_id', value);
  }

  openCreateModal(): void {
    this.selectedTeacher.set(null);
    this.modalMode.set('create');
    this.showEditModal.set(true);
  }

  editTeacher(teacher: TeacherListItem): void {
    this.selectedTeacher.set(teacher);
    this.modalMode.set('edit');
    this.showEditModal.set(true);
  }

  viewTeacher(teacher: TeacherListItem): void {
    this.router.navigate([teacher.id], { relativeTo: this.route });
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedTeacher.set(null);
  }

  onTeacherSaved(): void {
    this.closeEditModal();
    this.loadTeachers();
  }

  confirmDeleteTeacher(teacher: TeacherListItem): void {
    this.selectedTeacher.set(teacher);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.selectedTeacher.set(null);
  }

  onDeleteConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.deleteTeacher();
    } else {
      this.closeDeleteConfirm();
    }
  }

  deleteTeacher(): void {
    const teacher = this.selectedTeacher();
    if (!teacher) return;

    this.teacherService.deleteTeacher(teacher.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeDeleteConfirm();
          this.loadTeachers();
        },
        error: () => this.closeDeleteConfirm(),
      });
  }
}
