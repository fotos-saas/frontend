import { Component, inject, input, output, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PsSearchableSelectComponent, PsInputComponent, PsCheckboxComponent, SelectOption } from '@shared/components/form';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { SchoolItem } from '../../../models/partner.models';
import { ARCHIVE_SERVICE, ArchiveService, BulkPhotoMatch } from '../../../models/archive.models';

@Component({
  selector: 'app-archive-bulk-photo-upload',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent, PsSearchableSelectComponent, PsInputComponent, PsCheckboxComponent],
  templateUrl: './archive-bulk-photo-upload.component.html',
  styleUrl: './archive-bulk-photo-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchiveBulkPhotoUploadComponent {
  private readonly archiveService = inject(ARCHIVE_SERVICE) as ArchiveService;
  private readonly destroyRef = inject(DestroyRef);

  readonly schools = input.required<SchoolItem[]>();
  readonly entityLabel = input<string>('személy');
  readonly close = output<void>();
  readonly uploaded = output<void>();

  readonly ICONS = ICONS;

  // State
  step = signal<1 | 2 | 3>(1);
  selectedSchoolId = signal<number | null>(null);
  year = signal(new Date().getFullYear());
  selectedFiles = signal<File[]>([]);
  matches = signal<BulkPhotoMatch[]>([]);
  matching = signal(false);
  uploading = signal(false);
  setActive = signal(true);
  uploadProgress = signal({ current: 0, total: 0, success: 0, failed: 0, skipped: 0 });
  error = signal('');
  done = signal(false);

  schoolOptions = computed<SelectOption[]>(() =>
    this.schools().map(s => ({ id: s.id, label: s.name, sublabel: s.city ?? undefined }))
  );

  matchSummary = computed(() => {
    const m = this.matches();
    let matched = 0, ambiguous = 0, unmatched = 0, skipped = 0;
    for (const item of m) {
      if (item.skip) { skipped++; continue; }
      if (item.match_type === 'matched') matched++;
      else if (item.match_type === 'ambiguous') ambiguous++;
      else unmatched++;
    }
    return { matched, ambiguous, unmatched, skipped, total: m.length };
  });

  canStartMatch = computed(() =>
    this.selectedSchoolId() !== null
    && this.selectedFiles().length > 0
    && this.year() >= 2000
    && this.year() <= 2100
  );

  canStartUpload = computed(() => {
    const summary = this.matchSummary();
    return (summary.matched + summary.ambiguous) > 0;
  });

  progressPercent = computed(() => {
    const p = this.uploadProgress();
    return p.total > 0 ? Math.round((p.current / p.total) * 100) : 0;
  });

  onSchoolChange(value: string): void {
    this.selectedSchoolId.set(value ? parseInt(value, 10) : null);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const imageFiles = Array.from(input.files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        this.selectedFiles.set(imageFiles);
      }
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      const imageFiles = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        this.selectedFiles.set(imageFiles);
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  clearFiles(): void {
    this.selectedFiles.set([]);
  }

  startMatching(): void {
    const schoolId = this.selectedSchoolId();
    if (!schoolId) return;

    this.matching.set(true);
    this.error.set('');
    const filenames = this.selectedFiles().map(f => f.name);

    this.archiveService.bulkPhotoMatch(schoolId, this.year(), filenames)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.matches.set(res.data.map(m => ({ ...m, skip: m.match_type === 'unmatched' })));
          this.matching.set(false);
          this.step.set(2);
        },
        error: () => {
          this.matching.set(false);
          this.error.set('Hiba történt a párosítás során.');
        },
      });
  }

  toggleSkip(index: number): void {
    this.matches.update(items => items.map((m, i) => i === index ? { ...m, skip: !m.skip } : m));
  }

  overridePerson(index: number, personId: number, personName: string): void {
    this.matches.update(items => items.map((m, i) =>
      i === index ? { ...m, overridden_person_id: personId, person_id: personId, person_name: personName, match_type: 'matched' as const } : m
    ));
  }

  backToStep1(): void {
    this.step.set(1);
    this.matches.set([]);
  }

  startUpload(): void {
    const schoolId = this.selectedSchoolId();
    if (!schoolId) return;

    const activeMatches = this.matches().filter(m => !m.skip && m.person_id);
    const assignments: Record<string, number> = {};
    const photosToUpload: File[] = [];
    const fileMap = new Map<string, File>();

    for (const f of this.selectedFiles()) {
      fileMap.set(f.name, f);
    }

    for (const match of activeMatches) {
      if (match.person_id && fileMap.has(match.filename)) {
        assignments[match.filename] = match.overridden_person_id ?? match.person_id;
        photosToUpload.push(fileMap.get(match.filename)!);
      }
    }

    this.step.set(3);
    this.uploading.set(true);
    this.uploadProgress.set({ current: 0, total: photosToUpload.length, success: 0, failed: 0, skipped: 0 });

    this.archiveService.bulkPhotoUpload(schoolId, this.year(), this.setActive(), assignments, photosToUpload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const s = res.data.summary;
          this.uploadProgress.set({
            current: s.uploaded + s.failed + s.skipped,
            total: s.uploaded + s.failed + s.skipped,
            success: s.uploaded,
            failed: s.failed,
            skipped: s.skipped,
          });
          this.uploading.set(false);
          this.done.set(true);
        },
        error: () => {
          this.uploading.set(false);
          this.error.set('Hiba történt a feltöltés során.');
        },
      });
  }

  finish(): void {
    this.uploaded.emit();
    this.close.emit();
  }
}
