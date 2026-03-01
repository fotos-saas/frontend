import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { OrderDataService, OrderData } from './services/order-data.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { LinkifyPipe } from '../../shared/pipes/linkify.pipe';
import { isSecureUrl, openSecureUrl } from '../../core/utils/url-validator.util';

/**
 * Order Data Component - Megrendelési adatok oldal
 *
 * Megjeleníti a megrendeléskor leadott adatokat.
 *
 * Lazy-loaded standalone komponens.
 */
@Component({
    selector: 'app-order-data',
    standalone: true,
    imports: [SafeHtmlPipe, LinkifyPipe, DatePipe],
    templateUrl: './order-data.component.html',
    styleUrls: ['./order-data.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDataComponent implements OnInit {
  /** Order data */
  readonly orderData = signal<OrderData | null>(null);

  /** Loading state */
  loading = true;

  /** Error message */
  error: string | null = null;

  /** PDF generation in progress */
  generatingPdf = false;

  /** Névsor szinkronizáció állapota */
  readonly rosterSyncStatus = signal<string | null>(null);
  readonly rosterSyncResult = signal<{ created: number; updated: number; deleted: number; warnings: string[] } | null>(null);

  /** DestroyRef for automatic subscription cleanup */
  private destroyRef = inject(DestroyRef);

  constructor(
    private orderDataService: OrderDataService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadOrderData();
  }

  /**
   * Load order data
   */
  loadOrderData(): void {
    this.loading = true;
    this.error = null;

    this.orderDataService.getOrderData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.orderData.set(response.data);
            this.updateSyncState(response.data);
          } else {
            this.error = response.message || 'Nem sikerült betölteni az adatokat';
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Hiba történt az adatok betöltésekor';
          this.loading = false;
          this.cdr.markForCheck();
          this.logger.error('Order data load error', err);
        }
      });
  }

  /**
   * Szinkronizációs állapot frissítése és polling indítása ha kell
   */
  private updateSyncState(data: OrderData | null): void {
    if (!data) return;

    this.rosterSyncStatus.set(data.rosterSyncStatus);
    this.rosterSyncResult.set(data.rosterSyncResult);

    if (data.rosterSyncStatus === 'processing') {
      this.startSyncPolling();
    }
  }

  /**
   * Polling: 3 mp-enként amíg processing, max 60 mp
   */
  private startSyncPolling(): void {
    let elapsed = 0;
    const intervalMs = 3000;
    const maxMs = 60000;

    timer(intervalMs, intervalMs).pipe(
      takeUntilDestroyed(this.destroyRef),
      takeWhile(() => elapsed < maxMs && this.rosterSyncStatus() === 'processing'),
      switchMap(() => {
        elapsed += intervalMs;
        return this.orderDataService.getOrderData();
      }),
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rosterSyncStatus.set(response.data.rosterSyncStatus);
          this.rosterSyncResult.set(response.data.rosterSyncResult);
          this.cdr.markForCheck();
        }
      },
    });
  }

  /**
   * Generate and open PDF view
   * Uses the view-pdf endpoint which is accessible by all authenticated users
   * (including guests and admin preview)
   */
  openPdf(): void {
    if (this.generatingPdf) return;

    this.generatingPdf = true;
    this.cdr.markForCheck();

    this.orderDataService.viewOrderPdf()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.pdfUrl && isSecureUrl(response.pdfUrl)) {
            openSecureUrl(response.pdfUrl);
          } else {
            this.toastService.error('Hiba', response.message || 'Hiba a PDF generálásakor');
          }
          this.generatingPdf = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.logger.error('View PDF generation failed', err);
          this.toastService.error('Hiba', 'Hiba történt a PDF generálásakor');
          this.generatingPdf = false;
          this.cdr.markForCheck();
        }
      });
  }

  /** Sync banner szöveg */
  readonly syncBannerText = computed(() => {
    const result = this.rosterSyncResult();
    if (!result) return '';
    const parts: string[] = [];
    if (result.created > 0) parts.push(`${result.created} hozzáadva`);
    if (result.updated > 0) parts.push(`${result.updated} frissítve`);
    if (result.deleted > 0) parts.push(`${result.deleted} törölve`);
    return parts.join(', ');
  });

  /**
   * Whether the order sheet view button should be visible
   * Always visible on the post-order page
   */
  readonly hasPdf = computed(() => true);

  /**
   * Whether there are any tags
   */
  readonly hasTags = computed(() => {
    const data = this.orderData();
    return !!data?.tags && data.tags.length > 0;
  });

  /**
   * TrackBy function for the tags list
   */
  trackByTag(index: number, tag: string): string {
    return tag;
  }
}
