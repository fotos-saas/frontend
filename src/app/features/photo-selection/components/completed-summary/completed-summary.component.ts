import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { WorkflowPhoto, ProgressData, ReviewGroups, ReviewGroup } from '../../models/workflow.models';

/**
 * Completed Summary Component
 *
 * Read-only összesítő nézet a workflow befejezése után.
 * Szolidabb banner + csoportos képmegtekítés (Saját képek / Retusálandó / Tablókép).
 */
@Component({
  selector: 'app-completed-summary',
  standalone: true,
  imports: [],
  templateUrl: './completed-summary.component.html',
  styleUrl: './completed-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletedSummaryComponent {
  /** Progress adatok */
  readonly progress = input.required<ProgressData | null>();

  /** Tablókép (a visible photos-ból) */
  readonly tabloPhoto = input<WorkflowPhoto | null>(null);

  /** Review csoportok (backend-ről) */
  readonly reviewGroups = input<ReviewGroups | null>(null);

  /** Review betöltés folyamatban */
  readonly reviewLoading = input<boolean>(false);

  /** Tablókép kattintás (lightbox) */
  readonly tabloClick = output<WorkflowPhoto>();

  /** Fotó kattintás (lightbox a review group-ból) */
  readonly photoClick = output<{ photos: ReviewGroup[]; index: number }>();

  /** Review lekérés (ha még nincs adat) */
  readonly loadReview = output<void>();

  /** Review nézet megnyitva */
  readonly showReview = signal(false);

  /** Claimed képek száma */
  get claimedCount(): number {
    return this.progress()?.steps_data?.claimed_count || 0;
  }

  /** Retusálandó képek száma */
  get retouchCount(): number {
    return this.progress()?.steps_data?.retouch_count || 0;
  }

  /** Van-e review adat */
  readonly hasReview = computed(() => {
    const groups = this.reviewGroups();
    return groups && (groups.claiming.length > 0 || groups.retouch.length > 0 || groups.tablo.length > 0);
  });

  onToggleReview(): void {
    if (this.showReview()) {
      this.showReview.set(false);
      return;
    }
    this.showReview.set(true);
    if (!this.hasReview()) {
      this.loadReview.emit();
    }
  }

  onTabloClick(): void {
    const photo = this.tabloPhoto();
    if (photo) {
      this.tabloClick.emit(photo);
    }
  }

  onPhotoClick(photos: ReviewGroup[], index: number): void {
    this.photoClick.emit({ photos, index });
  }
}
