import { Component, Input, Output, EventEmitter, inject, signal, DestroyRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService, SchoolItem } from '../../services/partner.service';
import { ProjectDetailData } from '../../../../shared/components/project-detail';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';

/**
 * Project Edit Modal - Projekt adatok szerkesztése.
 * Iskola, osztály, évfolyam, dátumok módosítása.
 */
@Component({
  selector: 'app-project-edit-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './project-edit-modal.component.html',
  styleUrl: './project-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectEditModalComponent implements OnInit {
  readonly ICONS = ICONS;
  backdropHandler = createBackdropHandler(() => this.close.emit());

  @Input() project!: ProjectDetailData;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private partnerService = inject(PartnerService);
  private destroyRef = inject(DestroyRef);

  schools = signal<SchoolItem[]>([]);
  schoolsLoading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  schoolSearch = '';
  showSchoolDropdown = false;
  selectedSchool: SchoolItem | null = null;

  formData = {
    school_id: null as number | null,
    class_name: null as string | null,
    class_year: null as string | null,
    photo_date: null as string | null,
    deadline: null as string | null,
  };

  private schoolSearchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    // Inicializálás a meglévő adatokkal
    if (this.project) {
      this.formData.school_id = this.project.school?.id ?? null;
      this.formData.class_name = this.project.className ?? null;
      this.formData.class_year = this.project.classYear ?? null;
      this.formData.photo_date = this.project.photoDate ?? null;
      this.formData.deadline = this.project.deadline ?? null;

      if (this.project.school) {
        this.selectedSchool = {
          id: this.project.school.id,
          name: this.project.school.name,
          city: this.project.school.city ?? null,
        };
        this.schoolSearch = this.project.school.name + (this.project.school.city ? ` (${this.project.school.city})` : '');
      }
    }
  }

  onSchoolFocus(): void {
    this.showSchoolDropdown = true;
    if (this.schools().length === 0) {
      this.loadSchools();
    }
  }

  onSchoolBlur(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('.school-dropdown')) {
      return;
    }
    this.showSchoolDropdown = false;
  }

  onSchoolSearch(): void {
    if (this.schoolSearchTimeout) {
      clearTimeout(this.schoolSearchTimeout);
    }
    this.schoolSearchTimeout = setTimeout(() => {
      this.loadSchools();
    }, 300);
  }

  private loadSchools(): void {
    this.schoolsLoading.set(true);
    this.partnerService.getAllSchools(this.schoolSearch || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (schools) => {
          this.schools.set(schools);
          this.schoolsLoading.set(false);
          this.showSchoolDropdown = true;
        },
        error: () => {
          this.schools.set([]);
          this.schoolsLoading.set(false);
        }
      });
  }

  selectSchool(school: SchoolItem): void {
    this.selectedSchool = school;
    this.formData.school_id = school.id;
    this.schoolSearch = school.name + (school.city ? ` (${school.city})` : '');
    this.showSchoolDropdown = false;
  }

  clearSchool(): void {
    this.selectedSchool = null;
    this.formData.school_id = null;
    this.schoolSearch = '';
  }

  onSubmit(): void {
    this.error.set(null);
    this.submitting.set(true);

    this.partnerService.updateProject(this.project.id, this.formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err.error?.message ?? 'Hiba történt a mentés során');
        }
      });
  }
}
