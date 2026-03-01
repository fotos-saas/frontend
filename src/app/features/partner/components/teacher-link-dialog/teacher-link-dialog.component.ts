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
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '@shared/constants/icons.constants';
import { PsInputComponent } from '@shared/components/form';
import { ElectronService } from '@core/services/electron.service';
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
  private readonly electronService = inject(ElectronService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly isElectron = this.electronService.isElectron;

  /** A tanár, amiből a dialog nyílt */
  readonly teacher = input.required<TeacherListItem>();

  /** Partner összes tanárja (kezdeti lista — fallback) */
  readonly allTeachers = input.required<TeacherListItem[]>();

  readonly closeEvent = output<void>();
  readonly savedEvent = output<LinkTeachersResponse | void>();
  readonly photoChooserEvent = output<string>();
  readonly deletedEvent = output<void>();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly searchLoading = signal(false);
  readonly deletingTeacherId = signal<number | null>(null);

  /** Szerver-oldali keresés eredménye */
  readonly searchResults = signal<TeacherListItem[]>([]);

  /** Kijelölt tanár ID-k (checkbox-ok) */
  readonly selectedIds = signal<Set<number>>(new Set());

  private readonly searchSubject = new Subject<string>();
  private initialLinkedApplied = false;

  /** Elérhető tanárok (kereséssel szűrve, aktuális tanár jelölve de nem kiszűrve) */
  readonly filteredTeachers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const results = this.searchResults();

    // Ha van keresés eredmény, azt használjuk
    if (results.length > 0 || query) {
      return results;
    }

    // Nincs keresés → allTeachers fallback
    return this.allTeachers();
  });

  /** Van-e már linked group */
  readonly hasLinkedGroup = computed(() => !!this.teacher().linkedGroup);

  /** Legalább 1 másik tanár ki van-e jelölve (nem önmaga) */
  readonly canSubmit = computed(() => {
    const currentId = this.teacher().id;
    const ids = this.selectedIds();
    // Legalább 1 MÁSIK tanár kell
    return Array.from(ids).some(id => id !== currentId);
  });

  /** Mind ki van-e jelölve a szűrt listából (aktuális tanáron kívül) */
  readonly allSelected = computed(() => {
    const filtered = this.filteredTeachers().filter(t => t.id !== this.teacher().id);
    if (filtered.length === 0) return false;
    return filtered.every(t => this.selectedIds().has(t.id));
  });

  ngOnInit(): void {
    const current = this.teacher();

    // Szerver-oldali keresés debounce-szal
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query.trim()) {
          this.searchLoading.set(false);
          this.searchResults.set([]);
          return [];
        }
        this.searchLoading.set(true);
        return this.teacherService.getAllTeachers({ search: query });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (results) => {
        if (Array.isArray(results)) {
          this.searchResults.set(results);
          // Ha már csoportban van, előre kijelöljük a csoporttársakat
          if (current.linkedGroup && !this.initialLinkedApplied) {
            this.initialLinkedApplied = true;
            const linkedPeers = results.filter(
              t => t.linkedGroup === current.linkedGroup && t.id !== current.id
            );
            if (linkedPeers.length > 0) {
              this.selectedIds.set(new Set(linkedPeers.map(t => t.id)));
            }
          }
        }
        this.searchLoading.set(false);
      },
      error: () => this.searchLoading.set(false),
    });

    // Ha már csoportban van és az allTeachers-ben is vannak linked peers, jelöljük be
    if (current.linkedGroup) {
      const linkedPeers = this.allTeachers().filter(
        t => t.linkedGroup === current.linkedGroup && t.id !== current.id
      );
      if (linkedPeers.length > 0) {
        this.initialLinkedApplied = true;
        this.selectedIds.set(new Set(linkedPeers.map(t => t.id)));
      }
    }

    // Alapértelmezett keresés = a tanár neve
    const name = current.canonicalName || current.fullDisplayName;
    this.searchQuery.set(name);
    this.searchSubject.next(name);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
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

  isCurrent(teacherId: number): boolean {
    return teacherId === this.teacher().id;
  }

  toggleAll(): void {
    const filtered = this.filteredTeachers().filter(t => t.id !== this.teacher().id);
    if (this.allSelected()) {
      const current = new Set(this.selectedIds());
      for (const t of filtered) current.delete(t.id);
      this.selectedIds.set(current);
    } else {
      const current = new Set(this.selectedIds());
      for (const t of filtered) current.add(t.id);
      this.selectedIds.set(current);
    }
  }

  confirmDeleteTeacher(id: number): void {
    this.deletingTeacherId.set(id);
  }

  cancelDeleteTeacher(): void {
    this.deletingTeacherId.set(null);
  }

  executeDeleteTeacher(id: number): void {
    this.teacherService.deleteTeacher(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingTeacherId.set(null);
          this.searchResults.update(list => list.filter(t => t.id !== id));
          this.selectedIds.update(ids => {
            const next = new Set(ids);
            next.delete(id);
            return next;
          });
          this.deletedEvent.emit();
        },
        error: () => {
          this.deletingTeacherId.set(null);
          this.errorMessage.set('Hiba a tanár törlése során.');
        },
      });
  }

  onOpenPhotoChooser(): void {
    const group = this.teacher().linkedGroup;
    if (group) {
      this.closeEvent.emit();
      this.photoChooserEvent.emit(group);
    }
  }

  onSubmit(): void {
    if (!this.canSubmit() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const teacherIds = [this.teacher().id, ...Array.from(this.selectedIds()).filter(id => id !== this.teacher().id)];

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
