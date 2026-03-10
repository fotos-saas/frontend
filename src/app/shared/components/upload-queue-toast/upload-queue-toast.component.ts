import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { UploadQueueService, UploadQueueItem } from '../../services/upload-queue.service';

/**
 * Upload Queue Toast — fix pozíciójú floating panel.
 * Minimalizált: ikon + szám. Kinyitott: fájlonkénti progress.
 * 3mp után eltűnik ha minden kész, hibánál marad.
 */
@Component({
  selector: 'app-upload-queue-toast',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './upload-queue-toast.component.html',
  styleUrl: './upload-queue-toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadQueueToastComponent {
  readonly ICONS = ICONS;
  readonly queue = inject(UploadQueueService);

  readonly expanded = signal(false);
  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  /** Látható-e a toast egyáltalán */
  readonly visible = computed(() => this.queue.items().length > 0);

  /** A FAB badge szövege */
  readonly badgeText = computed(() => {
    const errors = this.queue.errorCount();
    if (errors > 0) return `${errors}`;
    const active = this.queue.activeCount() + this.queue.pendingCount();
    return active > 0 ? `${active}` : '';
  });

  /** FAB állapot */
  readonly fabState = computed<'uploading' | 'error' | 'done'>(() => {
    if (this.queue.errorCount() > 0) return 'error';
    if (this.queue.hasActive()) return 'uploading';
    return 'done';
  });

  constructor() {
    // Auto-hide: ha minden kész és nincs hiba → 3mp után clear
    effect(() => {
      const items = this.queue.items();
      const hasActive = this.queue.hasActive();
      const hasErrors = this.queue.errorCount() > 0;

      if (this.autoHideTimer) {
        clearTimeout(this.autoHideTimer);
        this.autoHideTimer = null;
      }

      if (items.length > 0 && !hasActive && !hasErrors) {
        this.autoHideTimer = setTimeout(() => {
          this.queue.clearDone();
          this.expanded.set(false);
        }, 3000);
      }
    });
  }

  toggle(): void {
    this.expanded.update(v => !v);
  }

  retryItem(item: UploadQueueItem): void {
    this.queue.retry(item.id);
  }

  removeItem(item: UploadQueueItem): void {
    this.queue.remove(item.id);
  }

  getStatusIcon(item: UploadQueueItem): string {
    switch (item.status) {
      case 'uploading': return this.ICONS.LOADER;
      case 'done': return this.ICONS.CHECK_CIRCLE;
      case 'error': return this.ICONS.ALERT_CIRCLE;
      default: return this.ICONS.UPLOAD;
    }
  }
}
