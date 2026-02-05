import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe, DatePipe } from '@angular/common';
import { OrderDataService, OrderData } from './services/order-data.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
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
    imports: [SafeHtmlPipe, AsyncPipe, DatePipe],
    templateUrl: './order-data.component.html',
    styleUrls: ['./order-data.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDataComponent implements OnInit {
  /** Order data */
  orderData: OrderData | null = null;

  /** Loading state */
  loading = true;

  /** Error message */
  error: string | null = null;

  /** PDF generation in progress */
  generatingPdf = false;

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
            this.orderData = response.data;
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

  /**
   * Whether the order sheet view button should be visible
   * Always visible on the post-order page
   */
  get hasPdf(): boolean {
    return true;
  }

  /**
   * Whether there are any tags
   */
  get hasTags(): boolean {
    return !!this.orderData?.tags && this.orderData.tags.length > 0;
  }

  /**
   * TrackBy function for the tags list
   */
  trackByTag(index: number, tag: string): string {
    return tag;
  }
}
