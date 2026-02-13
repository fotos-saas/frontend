import { Component, OnInit, inject, signal, computed, input, output, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerStudentService } from '../../services/partner-student.service';
import {
  StudentSchoolGroup,
  StudentSchoolSummary,
  StudentInSchool,
} from '../../models/student.models';
import { SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';
import { SearchableSelectComponent } from '../../../../shared/components/searchable-select/searchable-select.component';
import { StudentProjectCardComponent } from '../student-project-card/student-project-card.component';
import { ICONS } from '../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-student-project-view',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    SearchableSelectComponent,
    StudentProjectCardComponent,
  ],
  templateUrl: './student-project-view.component.html',
  styleUrl: './student-project-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentProjectViewComponent implements OnInit {
  classYears = input<SelectOption[]>([]);

  private readonly studentService = inject(PartnerStudentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  schoolGroups = signal<StudentSchoolGroup[]>([]);
  summary = signal<StudentSchoolSummary>({ totalSchools: 0, totalStudents: 0, withPhoto: 0, missingPhoto: 0 });
  loading = signal(true);
  initialized = signal(false);

  // Szűrők
  schoolSearch = signal('');
  selectedYear = signal('');
  missingOnly = signal(false);

  // Expand state
  expandedIds = signal<Set<number>>(new Set());

  uploadPhotoRequest = output<StudentInSchool>();
  viewPhotoRequest = output<StudentInSchool>();
  markNoPhotoRequest = output<StudentInSchool>();
  undoNoPhotoRequest = output<StudentInSchool>();

  filteredSchoolGroups = computed(() => {
    const query = this.schoolSearch().toLowerCase().trim();
    const groups = this.schoolGroups();
    if (!query) return groups;
    return groups.filter(g =>
      g.schoolName.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.waitForYearsAndLoad();
  }

  private waitForYearsAndLoad(): void {
    const checkAndLoad = (): void => {
      const years = this.classYears();
      if (years.length > 0 && !this.initialized()) {
        this.selectedYear.set(String(years[0].id));
        this.initialized.set(true);
        this.loadData();
      } else if (!this.initialized()) {
        setTimeout(() => checkAndLoad(), 100);
      }
    };
    checkAndLoad();
  }

  loadData(): void {
    this.loading.set(true);
    const classYear = this.selectedYear();

    this.studentService.getStudentsBySchool({
      class_year: classYear || undefined,
      missing_only: this.missingOnly(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.schoolGroups.set(response.schools);
          this.summary.set(response.summary);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSchoolSearchChange(value: string): void {
    this.schoolSearch.set(value);
  }

  onYearChange(value: string): void {
    this.selectedYear.set(value);
    this.loadData();
  }

  onMissingOnlyChange(): void {
    this.missingOnly.update(v => !v);
    this.loadData();
  }

  toggleSchool(schoolId: number): void {
    this.expandedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(schoolId)) {
        next.delete(schoolId);
      } else {
        next.add(schoolId);
      }
      return next;
    });
  }

  expandAll(): void {
    this.expandedIds.set(new Set(this.schoolGroups().map(s => s.schoolId)));
  }

  collapseAll(): void {
    this.expandedIds.set(new Set());
  }

  isExpanded(schoolId: number): boolean {
    return this.expandedIds().has(schoolId);
  }

  onUploadPhoto(student: StudentInSchool, schoolId: number): void {
    this.uploadPhotoRequest.emit({ ...student, schoolId });
  }

  onViewPhoto(student: StudentInSchool): void {
    this.viewPhotoRequest.emit(student);
  }

  onMarkNoPhoto(student: StudentInSchool): void {
    this.markNoPhotoRequest.emit(student);
  }

  onUndoNoPhoto(student: StudentInSchool): void {
    this.undoNoPhotoRequest.emit(student);
  }

  markStudentNoPhoto(archiveId: number): void {
    this.updateStudentField(archiveId, { noPhotoMarked: true });
  }

  unmarkStudentNoPhoto(archiveId: number): void {
    this.updateStudentField(archiveId, { noPhotoMarked: false });
  }

  private updateStudentField(archiveId: number, patch: Partial<StudentInSchool>): void {
    this.schoolGroups.update(groups =>
      groups.map(group => ({
        ...group,
        students: group.students.map(s =>
          s.archiveId === archiveId ? { ...s, ...patch } : s
        ),
      }))
    );
  }
}
