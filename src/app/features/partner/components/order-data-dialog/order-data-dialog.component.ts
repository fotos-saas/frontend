import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService } from '../../services/partner.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SafeHtmlPipe } from '../../../../shared/pipes/safe-html.pipe';
import { LinkifyPipe } from '../../../../shared/pipes/linkify.pipe';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { isSecureUrl, openSecureUrl } from '../../../../core/utils/url-validator.util';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { OrderData } from '../../../order-data/services/order-data.service';

@Component({
  selector: 'app-order-data-dialog',
  standalone: true,
  imports: [DatePipe, LucideAngularModule, SafeHtmlPipe, LinkifyPipe, DialogWrapperComponent],
  templateUrl: './order-data-dialog.component.html',
  styleUrls: ['./order-data-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDataDialogComponent implements OnInit {
  readonly ICONS = ICONS;

  readonly projectId = input.required<number>();
  readonly close = output<void>();

  orderData: OrderData | null = null;
  loading = true;
  error: string | null = null;
  generatingPdf = false;

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
          } else {
            this.error = response.message || 'Nem sikerult betolteni az adatokat';
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Hiba tortent az adatok betoltesekor';
          this.loading = false;
          this.cdr.markForCheck();
          this.logger.error('Partner order data load error', err);
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
}
