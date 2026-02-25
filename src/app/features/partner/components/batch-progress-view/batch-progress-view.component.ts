import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { BatchQueueService } from '../../services/batch-queue.service';
import { BatchJobStatus } from '../../models/batch.types';

/**
 * Batch Progress View — futás közben a progress megjelenítése.
 * Progress bar, aktuális job, job lista, pause/resume/cancel gombok.
 */
@Component({
  selector: 'app-batch-progress-view',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './batch-progress-view.component.html',
  styleUrl: './batch-progress-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchProgressViewComponent {
  readonly ICONS = ICONS;
  readonly queueService = inject(BatchQueueService);

  readonly isComplete = computed(() => this.queueService.queueState().status === 'completed');
  readonly jobs = computed(() => this.queueService.queueState().jobs);

  getStatusIcon(status: BatchJobStatus): string {
    switch (status) {
      case 'completed': return this.ICONS.CHECK_CIRCLE;
      case 'failed': return this.ICONS.X_CIRCLE;
      case 'running': return this.ICONS.LOADER;
      case 'cancelled': return this.ICONS.MINUS_CIRCLE;
      case 'pending':
      default: return this.ICONS.CLOCK;
    }
  }

  getStatusClass(status: BatchJobStatus): string {
    switch (status) {
      case 'completed': return 'status--success';
      case 'failed': return 'status--error';
      case 'running': return 'status--running';
      case 'cancelled': return 'status--cancelled';
      case 'pending':
      default: return 'status--pending';
    }
  }

  pause(): void {
    this.queueService.pause();
  }

  resume(): void {
    this.queueService.resume();
  }

  cancel(): void {
    this.queueService.cancel();
  }

  retryJob(jobId: string): void {
    this.queueService.retryJob(jobId);
  }

  clearQueue(): void {
    this.queueService.clearQueue();
  }
}
