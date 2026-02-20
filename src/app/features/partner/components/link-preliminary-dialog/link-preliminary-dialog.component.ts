import { Component, ChangeDetectionStrategy, input, output, inject, signal, computed, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerPreliminaryService } from '../../services/partner-preliminary.service';
import type {
  PartnerProjectListItem,
  LinkCandidate,
  LinkPreview,
  LinkConflict,
} from '../../models/partner.models';

type Step = 'select' | 'preview' | 'confirm';

@Component({
  selector: 'app-link-preliminary-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  templateUrl: './link-preliminary-dialog.component.html',
  styleUrl: './link-preliminary-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkPreliminaryDialogComponent {
  readonly ICONS = ICONS;
  private destroyRef = inject(DestroyRef);
  private preliminaryService = inject(PartnerPreliminaryService);

  readonly project = input.required<PartnerProjectListItem>();

  readonly close = output<void>();
  readonly linked = output<void>();

  step = signal<Step>('select');
  searchQuery = signal('');
  candidates = signal<LinkCandidate[]>([]);
  selectedTarget = signal<LinkCandidate | null>(null);
  preview = signal<LinkPreview | null>(null);
  conflictActions = signal<Record<number, 'skip' | 'transfer_photo'>>({});
  isLoading = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly stepTitle = computed(() => {
    switch (this.step()) {
      case 'select': return 'Cél projekt kiválasztása';
      case 'preview': return 'Összekapcsolás előnézet';
      case 'confirm': return 'Megerősítés';
    }
  });

  readonly transferSummary = computed(() => {
    const p = this.preview();
    if (!p) return null;
    const students = p.transferable.filter(t => t.type === 'student').length;
    const teachers = p.transferable.filter(t => t.type === 'teacher').length;
    return { students, teachers, photos: p.photosCount, conflicts: p.conflicts.length };
  });

  searchCandidates(): void {
    this.isLoading.set(true);
    this.preliminaryService.getLinkCandidates(this.searchQuery() || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.candidates.set(res.data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  selectTarget(candidate: LinkCandidate): void {
    this.selectedTarget.set(candidate);
    this.loadPreview(candidate.id);
  }

  private loadPreview(targetId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.preliminaryService.getLinkPreview(this.project().id, targetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.preview.set(res.data);
          // Default: minden ütközés "skip"
          const actions: Record<number, 'skip' | 'transfer_photo'> = {};
          for (const c of res.data.conflicts) {
            actions[c.sourcePersonId] = 'skip';
          }
          this.conflictActions.set(actions);
          this.step.set('preview');
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'Nem sikerült betölteni az előnézetet.');
        },
      });
  }

  setConflictAction(personId: number, action: 'skip' | 'transfer_photo'): void {
    this.conflictActions.update(prev => ({ ...prev, [personId]: action }));
  }

  goToConfirm(): void {
    this.step.set('confirm');
  }

  goBack(): void {
    const current = this.step();
    if (current === 'confirm') {
      this.step.set('preview');
    } else if (current === 'preview') {
      this.step.set('select');
      this.selectedTarget.set(null);
      this.preview.set(null);
    }
  }

  submitLink(): void {
    const target = this.selectedTarget();
    const prev = this.preview();
    if (!target || !prev) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const conflictResolution = prev.conflicts.map(c => ({
      person_id: c.sourcePersonId,
      action: this.conflictActions()[c.sourcePersonId] || 'skip' as const,
    }));

    this.preliminaryService.linkProject(this.project().id, {
      target_project_id: target.id,
      conflict_resolution: conflictResolution,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.linked.emit();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.message || 'Hiba történt az összekapcsolás során.');
        },
      });
  }

  ngOnInit(): void {
    this.searchCandidates();
  }
}
