import { Component, ChangeDetectionStrategy, inject, signal, computed, input, output, DestroyRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { SchoolItem } from '../../models/partner.models';
import {
  BulkImportPreviewItem,
  BulkImportAction,
  BulkImportExecuteItem,
  BulkImportExecuteResult,
} from '../../models/teacher.models';

type Phase = 'input' | 'review' | 'done';

interface ReviewRow extends BulkImportPreviewItem {
  action: BulkImportAction;
}

@Component({
  selector: 'app-teacher-bulk-import-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormsModule, LucideAngularModule, SearchableSelectComponent, DialogWrapperComponent],
  templateUrl: './teacher-bulk-import-dialog.component.html',
  styleUrl: './teacher-bulk-import-dialog.component.scss',
})
export class TeacherBulkImportDialogComponent {
  readonly schools = input.required<SchoolItem[]>();
  readonly close = output<void>();
  readonly imported = output<void>();

  private readonly teacherService = inject(PartnerTeacherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  // State
  readonly phase = signal<Phase>('input');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  // Input phase
  readonly namesText = signal('');
  readonly selectedSchoolId = signal('');
  readonly selectedFile = signal<File | null>(null);

  // Review phase
  readonly reviewRows = signal<ReviewRow[]>([]);

  // Done phase
  readonly result = signal<BulkImportExecuteResult | null>(null);

  readonly phaseTitle = computed(() => {
    switch (this.phase()) {
      case 'input': return 'Tömeges tanár import';
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
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
      ? this.teacherService.bulkImportPreviewFile(schoolId, file)
      : this.teacherService.bulkImportPreview(schoolId, this.parseNames());

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

  setAction(index: number, action: BulkImportAction): void {
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

    const items: BulkImportExecuteItem[] = this.reviewRows().map(row => ({
      input_name: row.inputName,
      action: row.action,
      teacher_id: row.teacherId,
    }));

    this.teacherService.bulkImportExecute(schoolId, items)
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

  private parseNames(): string[] {
    return this.namesText()
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
  }

  private suggestAction(item: BulkImportPreviewItem): BulkImportAction {
    if (item.matchType === 'no_match') return 'create';
    if (item.matchType === 'exact') return 'skip';
    if (item.confidence >= 0.8) return 'skip';
    return 'update';
  }

  getMatchLabel(type: string): string {
    const labels: Record<string, string> = {
      exact: 'Pontos egyezés',
      fuzzy: 'Hasonló név',
      ai: 'AI azonosítás',
      ai_sonnet: 'AI azonosítás',
      no_match: 'Nem található',
    };
    return labels[type] ?? type;
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'confidence--high';
    if (confidence >= 0.5) return 'confidence--medium';
    return 'confidence--low';
  }
}
