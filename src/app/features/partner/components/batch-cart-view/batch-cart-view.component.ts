import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { BatchWorkspaceService } from '../../services/batch-workspace.service';
import { BatchQueueService } from '../../services/batch-queue.service';
import { BATCH_WORKFLOW_LABELS, BatchWorkflowType } from '../../models/batch.types';

/**
 * Batch Cart View — kosár nézet.
 * Feladat lista checkboxokkal, projektenként csoportosítva.
 */
@Component({
  selector: 'app-batch-cart-view',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './batch-cart-view.component.html',
  styleUrl: './batch-cart-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchCartViewComponent {
  readonly ICONS = ICONS;
  readonly workspaceService = inject(BatchWorkspaceService);
  private readonly queueService = inject(BatchQueueService);

  readonly isEmpty = computed(() => this.workspaceService.itemCount() === 0);

  /** Csoportosított lista megjelenítéshez */
  readonly groups = computed(() => {
    const grouped = this.workspaceService.groupedByProject();
    return Array.from(grouped.entries()).map(([projectId, group]) => ({
      projectId,
      ...group,
    }));
  });

  isSelected(itemId: string): boolean {
    return this.workspaceService.selectedIds().includes(itemId);
  }

  getWorkflowLabel(type: BatchWorkflowType): string {
    return BATCH_WORKFLOW_LABELS[type];
  }

  getWorkflowBadgeClass(type: BatchWorkflowType): string {
    switch (type) {
      case 'generate-psd': return 'badge--purple';
      case 'generate-sample': return 'badge--blue';
      case 'finalize': return 'badge--green';
      default: return 'badge--gray';
    }
  }

  toggleItem(itemId: string): void {
    this.workspaceService.toggleSelect(itemId);
  }

  toggleAll(): void {
    if (this.workspaceService.allSelected()) {
      this.workspaceService.deselectAll();
    } else {
      this.workspaceService.selectAll();
    }
  }

  removeItem(itemId: string): void {
    this.workspaceService.removeItem(itemId);
  }

  clearAll(): void {
    this.workspaceService.clearAll();
  }

  startBatch(): void {
    const selected = this.workspaceService.selectedItems();
    if (selected.length === 0) return;
    this.queueService.startBatch(selected);
    // Kosárból a kijelölt elemeket töröljük
    for (const item of selected) {
      this.workspaceService.removeItem(item.id);
    }
  }
}
