import { Component, input, output, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerStudentService } from '../../services/partner-student.service';
import { StudentListItem } from '../../models/student.models';
import { SchoolItem } from '../../models/partner.models';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

@Component({
  selector: 'app-student-edit-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, SearchableSelectComponent, DialogWrapperComponent],
  templateUrl: './student-edit-modal.component.html',
  styleUrl: './student-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEditModalComponent {
  private readonly studentService = inject(PartnerStudentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly student = input<StudentListItem | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly schools = input<SchoolItem[]>([]);
  readonly prefillName = input('');
  readonly prefillSchoolId = input<number | null>(null);
  readonly close = output<void>();
  readonly saved = output<void>();

  readonly ICONS = ICONS;

  schoolOptions = computed<SelectOption[]>(() =>
    this.schools().map(s => ({ id: s.id, label: s.name, sublabel: s.city ?? undefined }))
  );

  canonicalName = '';
  className = '';
  schoolId: number | null = null;
  notes = '';
  aliases = signal<string[]>([]);
  // Fotó feltöltés
  currentPhotoUrl = signal<string | null>(null);
  selectedFile: File | null = null;
  photoPreviewUrl = signal<string | null>(null);
  photoYear = new Date().getFullYear();
  setPhotoActive = true;
  uploading = signal(false);

  saving = signal(false);
  errorMessage = signal<string | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const student = this.student();
    if (student && this.mode() === 'edit') {
      this.canonicalName = student.canonicalName;
      this.className = (student as any).className ?? '';
      this.schoolId = student.schoolId;
      this.currentPhotoUrl.set(student.photoThumbUrl ?? null);
      this.loadStudentDetail(student.id);
    } else if (this.prefillName()) {
      this.canonicalName = this.prefillName();
      if (this.prefillSchoolId()) {
        this.schoolId = this.prefillSchoolId();
      }
    }
  }

  private loadStudentDetail(id: number): void {
    this.loading.set(true);
    this.studentService.getStudent(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.className = res.data.className ?? '';
            this.notes = res.data.notes ?? '';
            this.aliases.set(res.data.aliases.map(a => a.aliasName));
            if (res.data.photoUrl) {
              this.currentPhotoUrl.set(res.data.photoUrl);
            }
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.photoPreviewUrl.set(URL.createObjectURL(this.selectedFile));
      this.errorMessage.set(null);
    }
  }

  removeSelectedPhoto(): void {
    this.selectedFile = null;
    this.photoPreviewUrl.set(null);
  }

  onSchoolChange(value: string): void {
    this.schoolId = value ? parseInt(value, 10) : null;
  }

  save(): void {
    if (!this.canonicalName.trim() || !this.schoolId || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = {
      canonical_name: this.canonicalName.trim(),
      class_name: this.className.trim() || null,
      school_id: this.schoolId,
      aliases: this.aliases().length > 0 ? this.aliases() : undefined,
      notes: this.notes.trim() || null,
    };

    const request$ = this.mode() === 'create'
      ? this.studentService.createStudent(payload)
      : this.studentService.updateStudent(this.student()!.id, payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.success) {
          const studentId = response.data?.id ?? this.student()?.id;
          if (this.selectedFile && studentId) {
            this.uploadPhoto(studentId);
          } else {
            this.saving.set(false);
            this.saved.emit();
          }
        } else {
          this.saving.set(false);
          this.errorMessage.set(response.message || 'Hiba történt a mentés során.');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Hiba történt a mentés során.');
      },
    });
  }

  private uploadPhoto(studentId: number): void {
    this.uploading.set(true);
    this.studentService.uploadStudentPhoto(
      studentId,
      this.selectedFile!,
      this.photoYear,
      this.setPhotoActive,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.uploading.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.uploading.set(false);
          this.errorMessage.set(err.error?.message || 'Mentés sikeres, de a fotó feltöltése nem sikerült.');
        },
      });
  }
}
