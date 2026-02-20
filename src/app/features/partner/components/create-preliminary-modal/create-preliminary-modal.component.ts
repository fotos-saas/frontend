import { Component, ChangeDetectionStrategy, output, inject, signal, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerPreliminaryService } from '../../services/partner-preliminary.service';
import { PartnerService } from '../../services/partner.service';
import type { SchoolListItem } from '../../models/partner.models';

@Component({
  selector: 'app-create-preliminary-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  templateUrl: './create-preliminary-modal.component.html',
  styleUrl: './create-preliminary-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePreliminaryModalComponent {
  readonly ICONS = ICONS;
  private destroyRef = inject(DestroyRef);
  private preliminaryService = inject(PartnerPreliminaryService);
  private partnerService = inject(PartnerService);

  readonly close = output<void>();
  readonly created = output<void>();

  schoolName = signal('');
  selectedSchoolId = signal<number | null>(null);
  className = signal('');
  classYear = signal('');
  note = signal('');
  expectedClassSize = signal<number | null>(null);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Iskola keresés
  schoolSuggestions = signal<SchoolListItem[]>([]);
  showSuggestions = signal(false);

  onSchoolNameInput(value: string): void {
    this.schoolName.set(value);
    this.selectedSchoolId.set(null);

    if (value.length >= 2) {
      this.partnerService.getSchools({ search: value, per_page: 10 })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.schoolSuggestions.set(res.data ?? []);
            this.showSuggestions.set((res.data ?? []).length > 0);
          },
        });
    } else {
      this.schoolSuggestions.set([]);
      this.showSuggestions.set(false);
    }
  }

  selectSchool(school: SchoolListItem): void {
    this.schoolName.set(school.name);
    this.selectedSchoolId.set(school.id);
    this.showSuggestions.set(false);
  }

  hideSchoolSuggestions(): void {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  submit(): void {
    if (!this.schoolName().trim()) {
      this.errorMessage.set('Az iskola neve kötelező.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.preliminaryService.createProject({
      school_name: this.schoolName().trim(),
      school_id: this.selectedSchoolId(),
      class_name: this.className().trim() || null,
      class_year: this.classYear().trim() || null,
      note: this.note().trim() || null,
      expected_class_size: this.expectedClassSize(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.created.emit();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.message || 'Hiba történt a létrehozás során.');
        },
      });
  }
}
