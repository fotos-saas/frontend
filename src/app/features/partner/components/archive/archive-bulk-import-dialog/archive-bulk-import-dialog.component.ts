import { Component, ChangeDetectionStrategy, inject, signal, computed, input, output, DestroyRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { PsSearchableSelectComponent, PsTextareaComponent, PsFileUploadComponent, SelectOption } from '@shared/components/form';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { SchoolItem } from '../../../models/partner.models';
import {
  ARCHIVE_SERVICE,
  ArchiveConfig,
  ArchiveBulkImportAction,
  ArchiveBulkImportPreviewItem,
  ArchiveBulkImportExecuteItem,
  ArchiveBulkImportExecuteResult,
} from '../../../models/archive.models';

type Phase = 'input' | 'review' | 'done';

interface ReviewRow extends ArchiveBulkImportPreviewItem {
  action: ArchiveBulkImportAction;
}

@Component({
  selector: 'app-archive-bulk-import-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormsModule, LucideAngularModule, PsSearchableSelectComponent, PsTextareaComponent, PsFileUploadComponent, DialogWrapperComponent],
  templateUrl: './archive-bulk-import-dialog.component.html',
  styleUrl: './archive-bulk-import-dialog.component.scss',
})
export class ArchiveBulkImportDialogComponent {
  readonly config = input.required<ArchiveConfig>();
  readonly schools = input.required<SchoolItem[]>();
  readonly close = output<void>();
  readonly imported = output<void>();

  private readonly archiveService = inject(ARCHIVE_SERVICE);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly phase = signal<Phase>('input');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly namesText = signal('');
  readonly selectedSchoolId = signal('');
  readonly selectedFile = signal<File | null>(null);

  readonly reviewRows = signal<ReviewRow[]>([]);
  readonly result = signal<ArchiveBulkImportExecuteResult | null>(null);

  readonly phaseTitle = computed(() => {
    const label = this.config().entityLabel;
    switch (this.phase()) {
      case 'input': return `Tömeges ${label} import`;
      case 'review': return 'Eredmények áttekintése';
      case 'done': return 'Import befejezve';
    }
  });

  readonly schoolOptions = computed<SelectOption[]>(() =>
    this.schools().map(s => ({ id: s.id, label: s.name, sublabel: s.city ?? undefined }))
  );

  readonly hasInput = computed(() =>
    this.namesText().trim().length > 0 || !!this.selectedFile()
  );

  readonly canSubmitPreview = computed(() =>
    this.hasInput() && !!this.selectedSchoolId() && !this.loading()
  );

  readonly reviewStats = computed(() => {
    const rows = this.reviewRows();
    return {
      total: rows.length,
      create: rows.filter(r => r.action === 'create').length,
      update: rows.filter(r => r.action === 'update').length,
      skip: rows.filter(r => r.action === 'skip').length,
    };
  });

  onSchoolChange(value: string): void {
    this.selectedSchoolId.set(value);
  }

  onFileChange(files: File[]): void {
    const file = files[0] ?? null;
    this.selectedFile.set(file);
    if (file) this.namesText.set('');
  }

  clearFile(): void {
    this.selectedFile.set(null);
  }

  onNamesInput(value: string): void {
    this.namesText.set(value);
    if (value.trim()) this.selectedFile.set(null);
  }

  submitPreview(): void {
    if (!this.canSubmitPreview()) return;

    this.loading.set(true);
    this.errorMessage.set('');
    const schoolId = parseInt(this.selectedSchoolId(), 10);
    const file = this.selectedFile();

    const obs = file
      ? this.archiveService.bulkImportPreviewFile(schoolId, file)
      : this.archiveService.bulkImportPreview(schoolId, this.parseNames());

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const rows: ReviewRow[] = res.data.map(item => ({
          ...item,
          action: this.suggestAction(item),
        }));
        this.reviewRows.set(rows);
        this.phase.set('review');
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Hiba történt az előnézet betöltésekor.');
        this.loading.set(false);
      },
    });
  }

  setAction(index: number, action: ArchiveBulkImportAction): void {
    this.reviewRows.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], action };
      return updated;
    });
  }

  submitExecute(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const schoolId = parseInt(this.selectedSchoolId(), 10);

    const items: ArchiveBulkImportExecuteItem[] = this.reviewRows().map(row => ({
      input_name: row.inputName,
      action: row.action,
      match_id: row.matchId,
    }));

    this.archiveService.bulkImportExecute(schoolId, items)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.result.set(res.data);
          this.phase.set('done');
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Hiba történt az import végrehajtásakor.');
          this.loading.set(false);
        },
      });
  }

  onDone(): void {
    this.imported.emit();
    this.close.emit();
  }

  backToInput(): void {
    this.phase.set('input');
    this.reviewRows.set([]);
    this.errorMessage.set('');
  }

  getMatchLabel(type: string): string {
    return this.config().bulkImportMatchLabels[type] ?? type;
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'confidence--high';
    if (confidence >= 0.5) return 'confidence--medium';
    return 'confidence--low';
  }

  private parseNames(): string[] {
    return this.namesText()
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
  }

  private suggestAction(item: ArchiveBulkImportPreviewItem): ArchiveBulkImportAction {
    if (item.matchType === 'no_match') return 'create';
    if (item.matchType === 'exact') return 'skip';
    if (this.config().bulkImportHasConfidence && (item.confidence ?? 0) >= 0.8) return 'skip';
    return this.config().bulkImportHasConfidence ? 'update' : 'skip';
  }
}
