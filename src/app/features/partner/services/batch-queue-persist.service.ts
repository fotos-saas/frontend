import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { ElectronCacheService } from '@core/services/electron-cache.service';
import { ElectronNotificationService } from '@core/services/electron-notification.service';
import { ToastService } from '@core/services/toast.service';
import { BatchQueueState, BatchJobState } from '../models/batch.types';

const CACHE_KEY = 'batch_queue_state';
const PERSIST_DEBOUNCE = 500;

/**
 * Batch Queue perzisztálás és notifikáció kezelés.
 * Felelős: ElectronCache mentés/visszatöltés, badge, és batch befejezés notifikáció.
 */
@Injectable({
  providedIn: 'root',
})
export class BatchQueuePersistService {
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly cacheService = inject(ElectronCacheService);
  private readonly notificationService = inject(ElectronNotificationService);

  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  /** Debounced state mentés ElectronCache-be */
  schedulePersist(state: BatchQueueState): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.cacheService.cacheSet(CACHE_KEY, state);
    }, PERSIST_DEBOUNCE);
  }

  /** Eltárolt állapot visszatöltése app indulásakor */
  async restoreState(): Promise<BatchQueueState | null> {
    try {
      const saved = await this.cacheService.cacheGet<BatchQueueState>(CACHE_KEY);
      if (!saved || !saved.jobs?.length) return null;

      // Félbe szakadt "running" jobokat "failed"-re állítjuk
      const jobs: BatchJobState[] = saved.jobs.map(j =>
        j.status === 'running'
          ? { ...j, status: 'failed' as const, error: 'Megszakadt (app újraindítás)', retryable: true }
          : j,
      );

      const hasPending = jobs.some(j => j.status === 'pending');

      this.logger.info('Batch queue állapot visszatöltve', { jobCount: jobs.length });

      return {
        ...saved,
        jobs,
        status: hasPending ? 'paused' : 'completed',
        currentJobId: null,
      };
    } catch (err) {
      this.logger.warn('Batch queue állapot visszatöltés sikertelen', err);
      return null;
    }
  }

  /** Badge frissítése a hátralévő jobokkal */
  updateBadge(jobs: BatchJobState[]): void {
    const pending = jobs.filter(j => j.status === 'pending' || j.status === 'running').length;
    if (pending > 0) {
      this.notificationService.setBadgeString(`${pending}`);
    } else {
      this.notificationService.clearBadge();
    }
  }

  /** Kezdő badge beállítása */
  async setBadgeCount(count: number): Promise<void> {
    await this.notificationService.setBadgeString(`${count}`);
  }

  /** Badge törlése */
  async clearBadge(): Promise<void> {
    await this.notificationService.clearBadge();
  }

  /** Batch befejezésekor: notification + toast */
  async notifyBatchComplete(summary: {
    total: number;
    completed: number;
    failed: number;
  }): Promise<void> {
    await this.notificationService.clearBadge();

    if (summary.failed > 0) {
      this.toast.warning(
        'Batch befejezve',
        `${summary.completed} sikeres, ${summary.failed} sikertelen a ${summary.total} feladatból`,
      );
      await this.notificationService.showNotification({
        title: 'Batch befejezve',
        body: `${summary.completed} sikeres, ${summary.failed} sikertelen`,
      });
    } else {
      this.toast.success(
        'Batch kész!',
        `Mind a ${summary.total} feladat sikeresen elkészült`,
      );
      await this.notificationService.showNotification({
        title: 'Batch kész!',
        body: `Mind a ${summary.total} feladat sikeresen elkészült`,
      });
    }
  }
}
