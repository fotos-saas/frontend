import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { WorkflowPhoto, ProgressData, ReviewGroups, ReviewGroup, ModificationInfo } from '../../models/workflow.models';
import { SelectionGridComponent } from '../selection-grid/selection-grid.component';

export interface WebshopInfo {
  enabled: boolean;
  shopUrl: string | null;
}

type TabKey = 'tablo' | 'retouch' | 'claiming';

@Component({
  selector: 'app-completed-summary',
  standalone: true,
  imports: [SelectionGridComponent, LucideAngularModule],
  templateUrl: './completed-summary.component.html',
  styleUrl: './completed-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletedSummaryComponent {
  readonly progress = input.required<ProgressData | null>();
  readonly reviewGroups = input<ReviewGroups | null>(null);
  readonly reviewLoading = input<boolean>(false);
  readonly modificationInfo = input<ModificationInfo | null>(null);
  readonly webshopInfo = input<WebshopInfo | null>(null);

  readonly photoClick = output<{ photos: ReviewGroup[]; index: number }>();
  readonly modifyClick = output<void>();

  readonly ICONS = ICONS;
  readonly activeTab = signal<TabKey>('tablo');

  readonly billingEnabled = computed(() => {
    return this.modificationInfo()?.billing_enabled ?? false;
  });

  readonly isWithinFreeWindow = computed(() => {
    return this.modificationInfo()?.is_within_free_window ?? false;
  });

  readonly remainingTimeFormatted = computed(() => {
    const info = this.modificationInfo();
    if (!info || !info.remaining_seconds) return '';
    const totalSeconds = info.remaining_seconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} óra ${minutes} perc`;
    }
    return `${minutes} perc`;
  });

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

  /** ReviewGroup[] → WorkflowPhoto[] mapping a selection-grid-hez */
  readonly activePhotos = computed<WorkflowPhoto[]>(() => {
    const groups = this.reviewGroups();
    if (!groups) return [];
    const raw = groups[this.activeTab()] || [];
    return raw.map(p => ({
      id: p.id,
      url: p.url,
      thumbnailUrl: p.thumbnail_url,
      filename: p.filename,
    }));
  });

  /** Eredeti ReviewGroup[] az aktív tabhoz (lightbox-hoz) */
  private get activeReviewPhotos(): ReviewGroup[] {
    const groups = this.reviewGroups();
    if (!groups) return [];
    return groups[this.activeTab()] || [];
  }

  onZoomClick(event: { photo: WorkflowPhoto; index: number }): void {
    this.photoClick.emit({ photos: this.activeReviewPhotos, index: event.index });
  }
}
