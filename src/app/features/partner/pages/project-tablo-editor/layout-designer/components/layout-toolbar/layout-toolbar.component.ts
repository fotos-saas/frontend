import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { SnapshotListItem } from '@core/services/electron.types';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerActionsService } from '../../layout-designer-actions.service';
import { LayoutDesignerGridService } from '../../layout-designer-grid.service';

/**
 * Layout Toolbar — eszköztár a vizuális szerkesztő tetején.
 * Dokumentum info, grid toggle, fotó behelyezés, link/unlink, mentés + bezárás.
 * Az igazítás gombok a floating toolbar-ban vannak (LayoutFloatingToolbarComponent).
 */
@Component({
  selector: 'app-layout-toolbar',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './layout-toolbar.component.html',
  styleUrl: './layout-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutToolbarComponent {
  readonly state = inject(LayoutDesignerStateService);
  readonly actions = inject(LayoutDesignerActionsService);
  readonly gridService = inject(LayoutDesignerGridService);
  protected readonly ICONS = ICONS;

  readonly alignPanelOpen = signal(false);

  readonly refreshing = input<boolean>(false);
  readonly syncing = input<boolean>(false);
  readonly arrangingNames = input<boolean>(false);
  readonly snapshots = input<SnapshotListItem[]>([]);
  readonly switchingSnapshot = input<boolean>(false);
  readonly nameGapCm = input<number>(0.5);
  readonly nameBreakAfter = input<number>(1);
  readonly textAlign = input<string>('center');
  readonly updatingPositions = input<boolean>(false);
  readonly positionGapCm = input<number>(0.15);
  readonly positionFontSize = input<number>(18);
  readonly pickerOpen = signal(false);
  readonly nameSettingsOpen = signal(false);
  readonly positionSettingsOpen = signal(false);

  readonly saveClicked = output<void>();
  readonly closeClicked = output<void>();
  readonly refreshClicked = output<void>();
  readonly syncClicked = output<void>();
  readonly arrangeNamesClicked = output<void>();
  readonly nameGapChanged = output<number>();
  readonly nameBreakChanged = output<number>();
  readonly textAlignChanged = output<string>();
  readonly updatePositionsClicked = output<void>();
  readonly positionGapChanged = output<number>();
  readonly positionFontSizeChanged = output<number>();
  readonly snapshotSelected = output<SnapshotListItem>();

  formatDate(isoDate: string | null): string {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }

  onPickLivePsd(): void {
    this.pickerOpen.set(false);
    this.refreshClicked.emit();
  }

  onPickSnapshot(snap: SnapshotListItem): void {
    this.pickerOpen.set(false);
    this.snapshotSelected.emit(snap);
  }

}
