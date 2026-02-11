import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerSchoolService } from '../../services/partner-school.service';
import type { SchoolListItem, SchoolItem } from '../../models/partner.models';

@Component({
  selector: 'app-school-link-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  templateUrl: './school-link-dialog.component.html',
  styleUrl: './school-link-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolLinkDialogComponent {
  private readonly schoolService = inject(PartnerSchoolService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  /** Az iskola, amiből a dialog nyílt */
  readonly school = input.required<SchoolListItem>();

  /** Partner összes iskolája */
  readonly allSchools = input.required<SchoolListItem[]>();

  readonly closeEvent = output<void>();
  readonly savedEvent = output<void>();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Kijelölt iskola ID-k (checkbox-ok) */
  readonly selectedIds = signal<Set<number>>(new Set());

  /** Elérhető iskolák (kiindulási iskola nélkül) */
  readonly availableSchools = computed(() => {
    const current = this.school();
    return this.allSchools().filter(s => s.id !== current.id);
  });

  /** Legalább 1 másik iskola ki van-e jelölve */
  readonly canSubmit = computed(() => this.selectedIds().size > 0);

  /** Van-e már csoportja a kiindulási iskolának */
  readonly hasExistingGroup = computed(() => !!this.school().linkedGroup);

  ngOnInit(): void {
    // Ha már csoportban van, előre kijelöljük a csoporttársakat
    const linked = this.school().linkedSchools ?? [];
    if (linked.length > 0) {
      const ids = new Set(linked.map(s => s.id));
      this.selectedIds.set(ids);
    }
  }

  toggleSchool(schoolId: number): void {
    const current = new Set(this.selectedIds());
    if (current.has(schoolId)) {
      current.delete(schoolId);
    } else {
      current.add(schoolId);
    }
    this.selectedIds.set(current);
  }

  isSelected(schoolId: number): boolean {
    return this.selectedIds().has(schoolId);
  }

  onSubmit(): void {
    if (!this.canSubmit() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const schoolIds = [this.school().id, ...Array.from(this.selectedIds())];

    this.schoolService.linkSchools(schoolIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.savedEvent.emit();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Hiba az összekapcsolás során.');
        },
      });
  }
}
