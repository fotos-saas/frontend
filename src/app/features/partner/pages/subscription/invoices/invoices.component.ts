import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionService, Invoice } from '../../../services/subscription.service';
import { LoggerService } from '../../../../../core/services/logger.service';
import { ICONS, getInvoiceStatusLabel } from '../../../../../shared/constants';
import { formatAmount as sharedFormatAmount } from '@shared/utils/formatters.util';
import { PsSelectComponent, PsSelectOption } from '@shared/components/form';

/**
 * Invoices Page
 *
 * Számlák listája:
 * - Korábbi számlák Stripe-ból
 * - PDF letöltés
 * - Státusz szűrő
 * - Cursor-based paginálás
 */
@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [FormsModule, DatePipe, LucideAngularModule, MatTooltipModule, PsSelectComponent],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly logger = inject(LoggerService);
  protected readonly ICONS = ICONS;

  readonly statusOptions: PsSelectOption[] = [
    { id: '', label: 'Összes' },
    { id: 'paid', label: 'Fizetve' },
    { id: 'open', label: 'Nyitott' },
    { id: 'void', label: 'Érvénytelen' },
  ];

  invoices = signal<Invoice[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  portalLoading = signal(false);
  statusFilter = signal('');

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.subscriptionService.getInvoices({
      status: this.statusFilter() || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.invoices.set(res.invoices);
          this.hasMore.set(res.has_more);
          this.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to load invoices:', err);
          this.invoices.set([]);
          this.hasMore.set(false);
          this.loading.set(false);
        }
      });
  }

  loadMore(): void {
    const currentInvoices = this.invoices();
    if (currentInvoices.length === 0) return;

    const lastInvoice = currentInvoices[currentInvoices.length - 1];
    this.loadingMore.set(true);

    this.subscriptionService.getInvoices({
      status: this.statusFilter() || undefined,
      starting_after: lastInvoice.id,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.invoices.update(prev => [...prev, ...res.invoices]);
          this.hasMore.set(res.has_more);
          this.loadingMore.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to load more invoices:', err);
          this.loadingMore.set(false);
        }
      });
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.loadInvoices();
  }

  openPortal(): void {
    this.portalLoading.set(true);
    this.subscriptionService.openPortal()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          window.open(res.portal_url, '_blank');
          this.portalLoading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to open portal:', err);
          this.portalLoading.set(false);
        }
      });
  }

  formatAmount(amount: number, currency: string): string {
    return sharedFormatAmount(amount, currency, true);
  }

  // Központi konstansból
  getStatusLabel = getInvoiceStatusLabel;
}
