import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
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

  /** Tablókép kattintás (lightbox) */
  readonly tabloClick = output<WorkflowPhoto>();

  /** Fotó kattintás (lightbox a review group-ból) */
  readonly photoClick = output<{ photos: ReviewGroup[]; index: number }>();

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
