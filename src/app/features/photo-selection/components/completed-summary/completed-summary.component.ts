import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { WorkflowPhoto, ProgressData, ReviewGroups, ReviewGroup } from '../../models/workflow.models';

type TabKey = 'tablo' | 'retouch' | 'claiming';

@Component({
  selector: 'app-completed-summary',
  standalone: true,
  imports: [],
  templateUrl: './completed-summary.component.html',
  styleUrl: './completed-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletedSummaryComponent {
  readonly progress = input.required<ProgressData | null>();
  readonly tabloPhoto = input<WorkflowPhoto | null>(null);
  readonly reviewGroups = input<ReviewGroups | null>(null);
  readonly reviewLoading = input<boolean>(false);

  readonly tabloClick = output<WorkflowPhoto>();
  readonly photoClick = output<{ photos: ReviewGroup[]; index: number }>();
  readonly loadReview = output<void>();

  readonly activeTab = signal<TabKey>('tablo');

  readonly hasReview = computed(() => {
    const groups = this.reviewGroups();
    return groups && (groups.claiming.length > 0 || groups.retouch.length > 0 || groups.tablo.length > 0);
  });

  readonly tabs = computed(() => {
    const groups = this.reviewGroups();
    if (!groups) return [];
    return [
      { key: 'tablo' as TabKey, label: 'Tablókép', count: groups.tablo.length },
      { key: 'retouch' as TabKey, label: 'Retusálandó', count: groups.retouch.length },
      { key: 'claiming' as TabKey, label: 'Saját képeim', count: groups.claiming.length },
    ].filter(t => t.count > 0);
  });

  readonly activePhotos = computed(() => {
    const groups = this.reviewGroups();
    if (!groups) return [];
    return groups[this.activeTab()] || [];
  });

  onPhotoClick(photos: ReviewGroup[], index: number): void {
    this.photoClick.emit({ photos, index });
  }
}
