import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService } from '../../services/partner.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SafeHtmlPipe } from '../../../../shared/pipes/safe-html.pipe';
import { LinkifyPipe } from '../../../../shared/pipes/linkify.pipe';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { isSecureUrl, openSecureUrl } from '../../../../core/utils/url-validator.util';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { OrderSyncPanelComponent } from '../order-sync-panel/order-sync-panel.component';
import { OrderData } from '../../../order-data/services/order-data.service';

@Component({
  selector: 'app-order-data-dialog',
  standalone: true,
  imports: [DatePipe, LucideAngularModule, SafeHtmlPipe, LinkifyPipe, DialogWrapperComponent, OrderSyncPanelComponent],
  templateUrl: './order-data-dialog.component.html',
  styleUrls: ['./order-data-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDataDialogComponent implements OnInit {
  readonly ICONS = ICONS;

  readonly projectId = input.required<number>();
  readonly close = output<void>();

  activeTab = signal<'order' | 'sync'>('order');
  orderData: OrderData | null = null;
  loading = true;
  error: string | null = null;
  generatingPdf = false;

  readonly rosterSyncStatus = signal<string | null>(null);
  readonly rosterSyncResult = signal<{ created: number; updated: number; deleted: number; warnings: string[] } | null>(null);

  readonly syncBannerText = computed(() => {
    const result = this.rosterSyncResult();
    if (!result) return '';
    const parts: string[] = [];
    if (result.created > 0) parts.push(`${result.created} hozzáadva`);
    if (result.updated > 0) parts.push(`${result.updated} frissítve`);
    if (result.deleted > 0) parts.push(`${result.deleted} törölve`);
    return parts.join(', ');
  });

  private destroyRef = inject(DestroyRef);
  private partnerService = inject(PartnerService);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadOrderData();
  }

  loadOrderData(): void {
    this.loading = true;
    this.error = null;

    this.partnerService.getProjectOrderData(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.orderData = response.data as OrderData;
            this.updateSyncState(this.orderData);
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
          this.logger.error('Partner order data load error', err);
        },
      });
  }

  private updateSyncState(data: OrderData | null): void {
    if (!data) return;
    this.rosterSyncStatus.set(data.rosterSyncStatus);
    this.rosterSyncResult.set(data.rosterSyncResult);
    if (data.rosterSyncStatus === 'processing') {
      this.startSyncPolling();
    }
  }

  private startSyncPolling(): void {
    let elapsed = 0;
    const intervalMs = 3000;
    const maxMs = 60000;

    timer(intervalMs, intervalMs).pipe(
      takeUntilDestroyed(this.destroyRef),
      takeWhile(() => elapsed < maxMs && this.rosterSyncStatus() === 'processing'),
      switchMap(() => {
        elapsed += intervalMs;
        return this.partnerService.getProjectOrderData(this.projectId());
      }),
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data as OrderData;
          this.rosterSyncStatus.set(data.rosterSyncStatus);
          this.rosterSyncResult.set(data.rosterSyncResult);
          this.cdr.markForCheck();
        }
      },
    });
  }

  openPdf(): void {
    if (this.generatingPdf) return;

    this.generatingPdf = true;
    this.cdr.markForCheck();

    this.partnerService.viewProjectOrderPdf(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.pdfUrl && isSecureUrl(response.pdfUrl)) {
            openSecureUrl(response.pdfUrl);
          } else {
            this.toastService.error('Hiba', response.message || 'Hiba a PDF generalasakor');
          }
          this.generatingPdf = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.logger.error('Partner order PDF generation failed', err);
          this.toastService.error('Hiba', 'Hiba tortent a PDF generalasakor');
          this.generatingPdf = false;
          this.cdr.markForCheck();
        },
      });
  }

  get hasTags(): boolean {
    return !!this.orderData?.tags && this.orderData.tags.length > 0;
  }

  get hasAttachments(): boolean {
    return !!this.orderData?.backgroundUrl || (this.orderData?.otherFiles?.length ?? 0) > 0;
  }

  downloadFile(url: string): void {
    if (isSecureUrl(url)) {
      openSecureUrl(url);
    }
  }
}
