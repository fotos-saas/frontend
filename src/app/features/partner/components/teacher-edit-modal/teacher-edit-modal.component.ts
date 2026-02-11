import { Component, input, output, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { TeacherListItem } from '../../models/teacher.models';
import { SchoolItem } from '../../models/partner.models';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

@Component({
  selector: 'app-teacher-edit-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, SearchableSelectComponent, DialogWrapperComponent],
  templateUrl: './teacher-edit-modal.component.html',
  styleUrl: './teacher-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherEditModalComponent {
  private readonly teacherService = inject(PartnerTeacherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly teacher = input<TeacherListItem | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly schools = input<SchoolItem[]>([]);
  readonly prefillName = input('');
  readonly close = output<void>();
  readonly saved = output<void>();

  readonly ICONS = ICONS;

  schoolOptions = computed<SelectOption[]>(() =>
    this.schools().map(s => ({ id: s.id, label: s.name, sublabel: s.city ?? undefined }))
  );

  canonicalName = '';
  titlePrefix = '';
  position = '';
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
    const teacher = this.teacher();
    if (teacher && this.mode() === 'edit') {
      this.canonicalName = teacher.canonicalName;
      this.titlePrefix = teacher.titlePrefix ?? '';
      this.schoolId = teacher.schoolId;
      this.currentPhotoUrl.set(teacher.photoThumbUrl ?? null);
      this.loadTeacherDetail(teacher.id);
    } else if (this.prefillName()) {
      this.canonicalName = this.prefillName();
    }
  }

  private loadTeacherDetail(id: number): void {
    this.loading.set(true);
    this.teacherService.getTeacher(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.position = res.data.position ?? '';
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
      title_prefix: this.titlePrefix.trim() || null,
      position: this.position.trim() || null,
      school_id: this.schoolId,
      aliases: this.aliases().length > 0 ? this.aliases() : undefined,
      notes: this.notes.trim() || null,
    };

    const request$ = this.mode() === 'create'
      ? this.teacherService.createTeacher(payload)
      : this.teacherService.updateTeacher(this.teacher()!.id, payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.success) {
          const teacherId = response.data?.id ?? this.teacher()?.id;
          if (this.selectedFile && teacherId) {
            this.uploadPhoto(teacherId);
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

  private uploadPhoto(teacherId: number): void {
    this.uploading.set(true);
    this.teacherService.uploadTeacherPhoto(
      teacherId,
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
