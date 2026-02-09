import { Component, input, output, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { TeacherListItem } from '../../models/teacher.models';
import { SchoolItem } from '../../models/partner.models';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { ICONS } from '../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-teacher-edit-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, SearchableSelectComponent],
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
  newAlias = '';

  saving = signal(false);
  errorMessage = signal<string | null>(null);
  loading = signal(false);

  backdropHandler = createBackdropHandler(() => this.close.emit());

  ngOnInit(): void {
    const teacher = this.teacher();
    if (teacher && this.mode() === 'edit') {
      this.canonicalName = teacher.canonicalName;
      this.titlePrefix = teacher.titlePrefix ?? '';
      this.schoolId = teacher.schoolId;
      this.loadTeacherDetail(teacher.id);
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
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  addAlias(): void {
    const alias = this.newAlias.trim();
    if (alias && this.aliases().length < 10 && !this.aliases().includes(alias)) {
      this.aliases.update(prev => [...prev, alias]);
      this.newAlias = '';
    }
  }

  onSchoolChange(value: string): void {
    this.schoolId = value ? parseInt(value, 10) : null;
  }

  removeAlias(index: number): void {
    this.aliases.update(prev => prev.filter((_, i) => i !== index));
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
        this.saving.set(false);
        if (response.success) {
          this.saved.emit();
        } else {
          this.errorMessage.set(response.message || 'Hiba történt a mentés során.');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Hiba történt a mentés során.');
      },
    });
  }
}
