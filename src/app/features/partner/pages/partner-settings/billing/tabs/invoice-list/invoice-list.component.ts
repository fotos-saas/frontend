import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { PsInputComponent, PsSelectComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { InvoiceService } from '../../../../../services/invoice.service';
import {
  Invoice,
  InvoiceStatistics,
  InvoiceStatus,
  PARTNER_INVOICE_STATUS_LABELS,
  PARTNER_INVOICE_STATUS_COLORS,
} from '../../../../../models/invoice.models';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatAmount, formatPrice } from '@shared/utils/formatters.util';
import { saveFile } from '@shared/utils/file.util';
import { InvoiceCreateDialogComponent } from '../../components/invoice-create-dialog/invoice-create-dialog.component';
import { TableHeaderComponent, TableColumn } from '../../../../../../../shared/components/table-header';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [DatePipe, FormsModule, LucideAngularModule, MatTooltipModule, PsInputComponent, PsSelectComponent, InvoiceCreateDialogComponent, TableHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
})
export class InvoiceListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly STATUS_LABELS = PARTNER_INVOICE_STATUS_LABELS;
  readonly STATUS_COLORS = PARTNER_INVOICE_STATUS_COLORS;
  readonly formatPrice = formatPrice;

  readonly tableCols: TableColumn[] = [
    { key: 'number', label: 'Számlaszám', width: '1.5fr' },
    { key: 'customer', label: 'Vevő', width: '1.5fr' },
    { key: 'amount', label: 'Összeg', width: '1fr' },
    { key: 'status', label: 'Státusz', width: '0.8fr' },
    { key: 'date', label: 'Dátum', width: '0.8fr' },
    { key: 'actions', label: 'Műveletek', width: '1fr' },
  ];
  readonly gridTemplate = this.tableCols.map(c => c.width ?? '1fr').join(' ');

  readonly statusOptions: PsSelectOption[] = [
    { id: 'draft', label: 'Piszkozat' },
    { id: 'sent', label: 'Kiküldve' },
    { id: 'paid', label: 'Fizetve' },
    { id: 'cancelled', label: 'Sztornózva' },
    { id: 'overdue', label: 'Lejárt' },
  ];

  readonly yearOptions: PsSelectOption[] = this.getYearOptions().map(y => ({ id: y, label: '' + y }));

  readonly loading = signal(true);
  readonly invoices = signal<Invoice[]>([]);
  readonly statistics = signal<InvoiceStatistics | null>(null);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);

  readonly searchTerm = signal('');
  readonly statusFilter = signal('');
  readonly yearFilter = signal(new Date().getFullYear());

  readonly showCreateDialog = signal(false);
  readonly syncing = signal<number | null>(null);

  ngOnInit(): void {
    this.loadInvoices();
    this.loadStatistics();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.invoiceService.getInvoices({
      page: this.currentPage(),
      per_page: 15,
      status: this.statusFilter() || undefined,
      year: this.yearFilter() || undefined,
      search: this.searchTerm() || undefined,
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.invoices.set(res.data.items);
        this.totalPages.set(res.data.pagination.last_page);
        this.total.set(res.data.pagination.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Hiba', 'Számlák betöltése sikertelen');
        this.loading.set(false);
      },
    });
  }

  loadStatistics(): void {
    this.invoiceService.getStatistics(this.yearFilter()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (stats) => this.statistics.set(stats),
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
    this.loadInvoices();
  }

  onStatusFilter(value: string): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadInvoices();
  }

  onYearFilter(value: string): void {
    this.yearFilter.set(+value);
    this.currentPage.set(1);
    this.loadInvoices();
    this.loadStatistics();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadInvoices();
  }

  syncInvoice(invoice: Invoice): void {
    this.syncing.set(invoice.id);
    this.invoiceService.syncInvoice(invoice.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Siker', res.message);
        } else {
          this.toast.error('Hiba', res.message);
        }
        this.syncing.set(null);
        this.loadInvoices();
        this.loadStatistics();
      },
      error: () => {
        this.toast.error('Hiba', 'Kiállítás sikertelen');
        this.syncing.set(null);
      },
    });
  }

  cancelInvoice(invoice: Invoice): void {
    this.invoiceService.cancelInvoice(invoice.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Siker', res.message);
        } else {
          this.toast.error('Hiba', res.message);
        }
        this.loadInvoices();
        this.loadStatistics();
      },
      error: () => {
        this.toast.error('Hiba', 'Sztornó sikertelen');
      },
    });
  }

  downloadPdf(invoice: Invoice): void {
    this.invoiceService.downloadPdf(invoice.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (blob) => {
        saveFile(blob, `${invoice.invoice_number ?? 'szamla'}.pdf`);
      },
      error: () => {
        this.toast.error('Hiba', 'PDF letöltés sikertelen');
      },
    });
  }

  readonly formatAmount = formatAmount;

  getStatusLabel(status: InvoiceStatus): string {
    return this.STATUS_LABELS[status] ?? status;
  }

  getStatusColor(status: InvoiceStatus): string {
    return this.STATUS_COLORS[status] ?? '#94a3b8';
  }

  onInvoiceCreated(): void {
    this.showCreateDialog.set(false);
    this.loadInvoices();
    this.loadStatistics();
  }

  getYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }
}
