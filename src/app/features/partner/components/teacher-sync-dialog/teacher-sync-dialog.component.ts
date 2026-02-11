import { Component, ChangeDetectionStrategy, inject, signal, computed, input, output, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { SyncPreviewResponse } from '../../models/teacher.models';

type Phase = 'loading' | 'preview' | 'syncing' | 'done';

@Component({
  selector: 'app-teacher-sync-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, DialogWrapperComponent],
  templateUrl: './teacher-sync-dialog.component.html',
  styleUrl: './teacher-sync-dialog.component.scss',
})
export class TeacherSyncDialogComponent {
  readonly schoolId = input.required<number>();
  readonly classYear = input<string | undefined>(undefined);
  readonly close = output<void>();
  readonly synced = output<void>();

  private readonly teacherService = inject(PartnerTeacherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly phase = signal<Phase>('loading');
  readonly errorMessage = signal('');
  readonly preview = signal<SyncPreviewResponse | null>(null);
  readonly syncedCount = signal(0);

  readonly phaseTitle = computed(() => {
    switch (this.phase()) {
      case 'loading': return 'Tanár fotók szinkronizálása';
      case 'preview': return 'Szinkronizálás előnézet';
      case 'syncing': return 'Szinkronizálás folyamatban...';
      case 'done': return 'Szinkronizálás kész';
    }
  });

  readonly syncableDetails = computed(() =>
    (this.preview()?.details ?? []).filter(d => d.status === 'syncable')
  );

  readonly noMatchDetails = computed(() =>
    (this.preview()?.details ?? []).filter(d => d.status === 'no_match')
  );

  readonly canSync = computed(() =>
    (this.preview()?.syncable ?? 0) > 0 && this.phase() === 'preview'
  );

  ngOnInit(): void {
    this.loadPreview();
  }

  loadPreview(): void {
    this.phase.set('loading');
    this.errorMessage.set('');

    this.teacherService.previewSync({
      school_id: this.schoolId(),
      class_year: this.classYear(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.preview.set(res.data);
          this.phase.set('preview');
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Hiba történt az előnézet betöltésekor.');
          this.phase.set('preview');
        },
      });
  }

  executeSync(): void {
    this.phase.set('syncing');
    this.errorMessage.set('');

    this.teacherService.executeSync({
      school_id: this.schoolId(),
      class_year: this.classYear(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.syncedCount.set(res.data.synced);
          this.phase.set('done');
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Hiba történt a szinkronizálás során.');
          this.phase.set('preview');
        },
      });
  }

  onDone(): void {
    this.synced.emit();
    this.close.emit();
  }

  getMatchLabel(type: string): string {
    const labels: Record<string, string> = {
      exact: 'Pontos',
      fuzzy: 'Hasonló',
      ai: 'AI',
      ai_sonnet: 'AI',
    };
    return labels[type] ?? type;
  }

  getConfidencePercent(confidence?: number): string {
    if (!confidence) return '';
    return Math.round(confidence * 100) + '%';
  }
}
