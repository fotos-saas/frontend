import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { BatchWorkspaceService } from '../../services/batch-workspace.service';
import { BatchQueueService } from '../../services/batch-queue.service';
import { ElectronService } from '@core/services/electron.service';
import { BatchCartViewComponent } from '../batch-cart-view/batch-cart-view.component';
import { BatchProgressViewComponent } from '../batch-progress-view/batch-progress-view.component';

/**
 * Batch Workspace Panel — fix pozíció jobb alsó sarokban.
 * Kosár ikon badge-dzsel, kattintásra panel nyit/zár.
 * Futás közben automatikusan progress nézetre vált.
 */
@Component({
  selector: 'app-batch-workspace-panel',
  standalone: true,
  imports: [LucideAngularModule, BatchCartViewComponent, BatchProgressViewComponent],
  templateUrl: './batch-workspace-panel.component.html',
  styleUrl: './batch-workspace-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchWorkspacePanelComponent {
  readonly ICONS = ICONS;
  readonly workspaceService = inject(BatchWorkspaceService);
  readonly queueService = inject(BatchQueueService);
  private readonly electronService = inject(ElectronService);

  readonly isElectron = this.electronService.isElectron;

  readonly showBadge = computed(() => {
    const itemCount = this.workspaceService.itemCount();
    const hasJobs = this.queueService.hasJobs();
    return itemCount > 0 || hasJobs;
  });

  readonly badgeText = computed(() => {
    if (this.queueService.hasJobs()) {
      const s = this.queueService.summary();
      return `${s.completed + s.failed}/${s.total}`;
    }
    return `${this.workspaceService.itemCount()}`;
  });

  togglePanel(): void {
    this.workspaceService.togglePanel();
  }
}
