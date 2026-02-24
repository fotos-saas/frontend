import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerProjectService } from '../../services/partner-project.service';

interface CreatedPerson {
  id: number;
  name: string;
  type: string;
  archiveLinked: boolean;
  hasPhoto: boolean;
}

@Component({
  selector: 'app-add-persons-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  templateUrl: './add-persons-dialog.component.html',
  styleUrl: './add-persons-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPersonsDialogComponent {
  readonly ICONS = ICONS;

  readonly projectId = input.required<number>();
  readonly type = input.required<'student' | 'teacher'>();

  readonly close = output<void>();
  readonly personsAdded = output<void>();

  private readonly projectService = inject(PartnerProjectService);
  private readonly destroyRef = inject(DestroyRef);

  readonly namesText = signal('');
  readonly submitting = signal(false);
  readonly submitted = signal(false);

  readonly createdPersons = signal<CreatedPerson[]>([]);
  readonly duplicates = signal<string[]>([]);
  readonly archiveMatches = signal(0);
  readonly resultMessage = signal('');

  readonly title = computed(() =>
    this.type() === 'student' ? 'Diákok hozzáadása' : 'Tanárok hozzáadása'
  );

  readonly theme = computed(() =>
    this.type() === 'student' ? 'green' as const : 'amber' as const
  );

  readonly icon = computed(() =>
    this.type() === 'student' ? ICONS.USERS : ICONS.GRADUATION_CAP
  );

  readonly placeholder = computed(() =>
    this.type() === 'student'
      ? 'Kovács Anna\nNagy Péter\nSzabó Eszter\n...'
      : 'Dr. Kiss János (igazgató)\nHorváth Mária (matematikatanár)\n...'
  );

  readonly namesCount = computed(() => {
    const text = this.namesText().trim();
    if (!text) return 0;
    return text.split(/\r?\n/).filter(l => l.trim()).length;
  });

  readonly canSubmit = computed(() => this.namesCount() > 0 && !this.submitting());
  readonly hasPhotoPerson = computed(() => this.createdPersons().some(p => p.hasPhoto));
  readonly withPhotoCount = computed(() => this.createdPersons().filter(p => p.hasPhoto).length);

  submit(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.projectService.addPersons(this.projectId(), this.namesText(), this.type())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.submitted.set(true);
          this.createdPersons.set(res.data.created);
          this.duplicates.set(res.data.duplicates);
          this.archiveMatches.set(res.data.archiveMatches);
          this.resultMessage.set(res.message);
          this.personsAdded.emit();
        },
        error: () => {
          this.submitting.set(false);
        },
      });
  }

  addMore(): void {
    this.submitted.set(false);
    this.namesText.set('');
    this.createdPersons.set([]);
    this.duplicates.set([]);
  }
}
