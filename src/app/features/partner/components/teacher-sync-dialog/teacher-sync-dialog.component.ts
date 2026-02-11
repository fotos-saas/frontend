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

  // Kijelölés kezelés
  readonly selectedIds = signal<Set<number>>(new Set());

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly allSelected = computed(() => {
    const syncable = this.syncableDetails();
    if (syncable.length === 0) return false;
    const selected = this.selectedIds();
    return syncable.every(d => selected.has(d.personId));
  });

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

  readonly noPhotoDetails = computed(() =>
    (this.preview()?.details ?? []).filter(d => d.status === 'no_photo')
  );

  readonly canSync = computed(() =>
    this.selectedCount() > 0 && this.phase() === 'preview'
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
          // Alapból mind kijelölve
          const syncable = (res.data.details ?? []).filter(d => d.status === 'syncable');
          this.selectedIds.set(new Set(syncable.map(d => d.personId)));
          this.phase.set('preview');
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Hiba történt az előnézet betöltésekor.');
          this.phase.set('preview');
        },
      });
  }

  togglePerson(id: number): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      const all = this.syncableDetails().map(d => d.personId);
      this.selectedIds.set(new Set(all));
    }
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  executeSync(): void {
    this.phase.set('syncing');
    this.errorMessage.set('');

    const ids = [...this.selectedIds()];

    this.teacherService.executeSync({
      school_id: this.schoolId(),
      class_year: this.classYear(),
      person_ids: ids,
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
