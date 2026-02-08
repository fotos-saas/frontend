import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../constants/icons.constants';

@Component({
  selector: 'app-expand-detail-panel',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './expand-detail-panel.component.html',
  styleUrl: './expand-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandDetailPanelComponent {
  /** Betöltési állapot - skeleton shimmer-t mutat */
  readonly loading = input<boolean>(false);

  /** Üres állapot - ha true, az emptyText-et mutatja */
  readonly empty = input<boolean>(false);

  /** Üres állapot szövege */
  readonly emptyText = input<string>('Nincs megjeleníthető adat');

  /** Üres állapot ikon neve (ICONS konstansból) */
  readonly emptyIcon = input<string>(ICONS.INFO);

  /** Skeleton sorok száma loading állapotban */
  readonly skeletonRows = input<number>(2);

  readonly ICONS = ICONS;
}
