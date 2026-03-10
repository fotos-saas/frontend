import { Injectable, signal, computed } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FileUploadResponse } from '../../features/order-finalization/models/order-finalization.models';

export type UploadItemStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadQueueItem {
  id: string;
  file: File;
  projectId: number;
  type: 'background' | 'attachment';
  status: UploadItemStatus;
  progress: number;
  retries: number;
  error?: string;
  addedAt: number;
  uploadFn: (file: File) => Observable<FileUploadResponse>;
  onSuccess?: (response: FileUploadResponse) => void;
}

/**
 * Upload Queue Service — háttérben futó feltöltési sor.
 *
 * - providedIn: root → dialógus bezárása után is él
 * - Max 2 párhuzamos feltöltés
 * - Retry: max 3×, exponential backoff (2s, 4s, 8s)
 * - Duplikáció védelem: file.name + file.size + projectId
 */
@Injectable({ providedIn: 'root' })
export class UploadQueueService {
  private static readonly MAX_CONCURRENT = 2;
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY_MS = 2000;
  private static readonly RATE_LIMIT_DELAY_MS = 10000;

  private readonly _items = signal<UploadQueueItem[]>([]);
  private readonly activeSubscriptions = new Map<string, Subscription>();

  /** Összes queue elem */
  readonly items = this._items.asReadonly();

  /** Aktív (feltöltés alatt álló) elemek száma */
  readonly activeCount = computed(() =>
    this._items().filter(i => i.status === 'uploading').length
  );

  /** Hibás elemek száma */
  readonly errorCount = computed(() =>
    this._items().filter(i => i.status === 'error').length
  );

  /** Várakozó elemek száma */
  readonly pendingCount = computed(() =>
    this._items().filter(i => i.status === 'pending').length
  );

  /** Van-e bármilyen aktív vagy várakozó elem */
  readonly hasActive = computed(() =>
    this._items().some(i => i.status === 'pending' || i.status === 'uploading')
  );

  /** Összesített progress (0-100) az aktív elemekre */
  readonly totalProgress = computed(() => {
    const active = this._items().filter(i => i.status !== 'done');
    if (!active.length) return 100;
    return Math.round(active.reduce((sum, i) => sum + i.progress, 0) / active.length);
  });

  /**
   * Elem hozzáadása a queue-hoz.
   * Duplikáció védelem: file.name + file.size + projectId.
   */
  enqueue(params: {
    file: File;
    projectId: number;
    type: 'background' | 'attachment';
    uploadFn: (file: File) => Observable<FileUploadResponse>;
    onSuccess?: (response: FileUploadResponse) => void;
  }): void {
    const hash = `${params.file.name}_${params.file.size}_${params.projectId}_${params.type}`;
    const existing = this._items().find(i =>
      `${i.file.name}_${i.file.size}_${i.projectId}_${i.type}` === hash
      && i.status !== 'done' && i.status !== 'error'
    );
    if (existing) return;

    const item: UploadQueueItem = {
      id: crypto.randomUUID(),
      file: params.file,
      projectId: params.projectId,
      type: params.type,
      status: 'pending',
      progress: 0,
      retries: 0,
      addedAt: Date.now(),
      uploadFn: params.uploadFn,
      onSuccess: params.onSuccess,
    };

    this._items.update(items => [...items, item]);
    this.processNext();
  }

  /** Hibás elem újrapróbálása */
  retry(id: string): void {
    this.updateItem(id, { status: 'pending', progress: 0, retries: 0, error: undefined });
    this.processNext();
  }

  /** Elem eltávolítása (cancel vagy kész) */
  remove(id: string): void {
    const sub = this.activeSubscriptions.get(id);
    if (sub) {
      sub.unsubscribe();
      this.activeSubscriptions.delete(id);
    }
    this._items.update(items => items.filter(i => i.id !== id));
    this.processNext();
  }

  /** Kész elemek törlése */
  clearDone(): void {
    this._items.update(items => items.filter(i => i.status !== 'done'));
  }

  private processNext(): void {
    const items = this._items();
    const activeCount = items.filter(i => i.status === 'uploading').length;
    const available = UploadQueueService.MAX_CONCURRENT - activeCount;

    if (available <= 0) return;

    const pending = items.filter(i => i.status === 'pending');
    const toStart = pending.slice(0, available);

    for (const item of toStart) {
      this.startUpload(item);
    }
  }

  private startUpload(item: UploadQueueItem): void {
    this.updateItem(item.id, { status: 'uploading', progress: 10 });

    const sub = item.uploadFn(item.file).subscribe({
      next: (response) => {
        this.updateItem(item.id, { status: 'done', progress: 100 });
        try {
          item.onSuccess?.(response);
        } catch {
          // Komponens destroyed — callback elavult, ignoráljuk
        }
        this.activeSubscriptions.delete(item.id);
        this.processNext();
      },
      error: (err) => {
        this.activeSubscriptions.delete(item.id);
        const currentItem = this._items().find(i => i.id === item.id);
        if (!currentItem) return;

        const status = err?.status;
        const isRateLimited = status === 429;
        const isRetryable = !status || status >= 500;

        // 429: mindig retry, korlátlan alkalommal, növekvő várakozással (max 60s)
        if (isRateLimited) {
          const delay = Math.min(
            UploadQueueService.RATE_LIMIT_DELAY_MS * Math.pow(2, currentItem.retries),
            60000,
          );
          this.updateItem(item.id, {
            status: 'pending',
            progress: 0,
            retries: currentItem.retries + 1,
          });
          setTimeout(() => this.processNext(), delay);
        } else if (isRetryable && currentItem.retries < UploadQueueService.MAX_RETRIES) {
          const delay = UploadQueueService.BASE_DELAY_MS * Math.pow(2, currentItem.retries);
          this.updateItem(item.id, {
            status: 'pending',
            progress: 0,
            retries: currentItem.retries + 1,
          });
          setTimeout(() => this.processNext(), delay);
        } else {
          this.updateItem(item.id, {
            status: 'error',
            progress: 0,
            error: err?.message || 'Feltöltés sikertelen',
          });
          this.processNext();
        }
      },
    });

    this.activeSubscriptions.set(item.id, sub);
  }

  private updateItem(id: string, patch: Partial<UploadQueueItem>): void {
    this._items.update(items =>
      items.map(i => i.id === id ? { ...i, ...patch } : i)
    );
  }
}
