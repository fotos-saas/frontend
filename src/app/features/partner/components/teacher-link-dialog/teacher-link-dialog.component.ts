import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '@shared/constants/icons.constants';
import { PsInputComponent } from '@shared/components/form';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import type { TeacherListItem, LinkTeachersResponse } from '../../models/teacher.models';

@Component({
  selector: 'app-teacher-link-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent, PsInputComponent],
  templateUrl: './teacher-link-dialog.component.html',
  styleUrl: './teacher-link-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherLinkDialogComponent implements OnInit {
  private readonly teacherService = inject(PartnerTeacherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  /** A tanár, amiből a dialog nyílt */
  readonly teacher = input.required<TeacherListItem>();

  /** Partner összes tanárja (flat nézet lista) */
  readonly allTeachers = input.required<TeacherListItem[]>();

  readonly closeEvent = output<void>();
  readonly savedEvent = output<LinkTeachersResponse | void>();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');

  /** Kijelölt tanár ID-k (checkbox-ok) */
  readonly selectedIds = signal<Set<number>>(new Set());

  /** Elérhető tanárok (kiindulási tanár nélkül, kereséssel szűrve) */
  readonly filteredTeachers = computed(() => {
    const current = this.teacher();
    const query = this.searchQuery().toLowerCase().trim();
    let list = this.allTeachers().filter(t => t.id !== current.id);

    if (query) {
      list = list.filter(t =>
        t.fullDisplayName.toLowerCase().includes(query) ||
        (t.schoolName?.toLowerCase().includes(query) ?? false)
      );
    }

    return list;
  });

  /** Legalább 1 másik tanár ki van-e jelölve */
  readonly canSubmit = computed(() => this.selectedIds().size > 0);

  ngOnInit(): void {
    // Ha már csoportban van, előre kijelöljük a csoporttársakat
    const current = this.teacher();
    if (current.linkedGroup) {
      const linkedPeers = this.allTeachers().filter(
        t => t.id !== current.id && t.linkedGroup === current.linkedGroup
      );
      if (linkedPeers.length > 0) {
        this.selectedIds.set(new Set(linkedPeers.map(t => t.id)));
      }
    }
  }

  toggleTeacher(teacherId: number): void {
    const current = new Set(this.selectedIds());
    if (current.has(teacherId)) {
      current.delete(teacherId);
    } else {
      current.add(teacherId);
    }
    this.selectedIds.set(current);
  }

  isSelected(teacherId: number): boolean {
    return this.selectedIds().has(teacherId);
  }

  onSubmit(): void {
    if (!this.canSubmit() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const teacherIds = [this.teacher().id, ...Array.from(this.selectedIds())];

    this.teacherService.linkTeachers(teacherIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.savedEvent.emit(res.data);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Hiba az összekapcsolás során.');
        },
      });
  }
}
