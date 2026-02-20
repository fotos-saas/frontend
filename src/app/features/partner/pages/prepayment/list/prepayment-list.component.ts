import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';
import {
  Prepayment,
  PrepaymentStatus,
  PrepaymentSummary,
  PREPAYMENT_STATUS_LABELS,
  PREPAYMENT_STATUS_COLORS,
  PREPAYMENT_MODE_LABELS,
} from '../../../models/prepayment.models';
import { CreatePrepaymentDialogComponent } from '../create-dialog/create-prepayment-dialog.component';
import { PrepaymentDetailDialogComponent } from '../detail-dialog/prepayment-detail-dialog.component';
import { MarkPaidDialogComponent } from '../mark-paid-dialog/mark-paid-dialog.component';
import { RefundDialogComponent } from '../refund-dialog/refund-dialog.component';
import { BulkPrepaymentDialogComponent } from '../bulk-dialog/bulk-prepayment-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-prepayment-list',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    CreatePrepaymentDialogComponent,
    PrepaymentDetailDialogComponent,
    MarkPaidDialogComponent,
    RefundDialogComponent,
    BulkPrepaymentDialogComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './prepayment-list.component.html',
  styleUrl: './prepayment-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrepaymentListComponent implements OnInit {
  private readonly prepaymentService = inject(PartnerPrepaymentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly STATUS_LABELS = PREPAYMENT_STATUS_LABELS;
  readonly STATUS_COLORS = PREPAYMENT_STATUS_COLORS;
  readonly MODE_LABELS = PREPAYMENT_MODE_LABELS;

  // Adatok
  prepayments = signal<Prepayment[]>([]);
  summary = signal<PrepaymentSummary | null>(null);
  loading = signal(true);

  // Lapozás
  currentPage = signal(1);
  lastPage = signal(1);
  total = signal(0);

  // Szűrők
  searchQuery = signal('');
  statusFilter = signal<PrepaymentStatus | ''>('');
  projectFilter = signal('');

  // Dialógusok
  showCreateDialog = signal(false);
  showDetailDialog = signal(false);
  showMarkPaidDialog = signal(false);
  showRefundDialog = signal(false);
  showBulkDialog = signal(false);
  showCancelConfirm = signal(false);
  selectedPrepayment = signal<Prepayment | null>(null);

  // Összegző kártyák
  readonly summaryCards = computed(() => {
    const s = this.summary();
    if (!s) return [];
    return [
      { label: 'Összes', value: s.total, icon: ICONS.LIST, color: 'slate' },
      { label: 'Beszedve', value: s.total_collected, icon: ICONS.CHECK_CIRCLE, color: 'green', isCurrency: true },
      { label: 'Függőben', value: s.total_pending, icon: ICONS.CLOCK, color: 'amber', isCurrency: true },
      { label: 'Fizetve', value: s.paid, icon: ICONS.BANKNOTE, color: 'blue' },
      { label: 'Fizetésre vár', value: s.pending, icon: ICONS.HOURGLASS, color: 'orange' },
    ];
  });

  readonly statusOptions: { value: PrepaymentStatus | ''; label: string }[] = [
    { value: '', label: 'Minden státusz' },
    { value: 'pending', label: 'Fizetésre vár' },
    { value: 'paid', label: 'Fizetve' },
    { value: 'used', label: 'Felhasználva' },
    { value: 'partially_used', label: 'Részben felhasználva' },
    { value: 'cancelled', label: 'Sztornózva' },
    { value: 'refunded', label: 'Visszatérítve' },
    { value: 'expired', label: 'Lejárt' },
  ];

  ngOnInit(): void {
    this.loadPrepayments();
  }

  loadPrepayments(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: this.currentPage().toString(),
    };
    if (this.searchQuery()) params['search'] = this.searchQuery();
    if (this.statusFilter()) params['status'] = this.statusFilter();
    if (this.projectFilter()) params['project_id'] = this.projectFilter();

    this.prepaymentService.getPrepayments(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.prepayments.set(res.data);
          this.currentPage.set(res.meta.current_page);
          this.lastPage.set(res.meta.last_page);
          this.total.set(res.meta.total);
          if (res.summary) this.summary.set(res.summary);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadPrepayments();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.onSearch();
  }

  onStatusChange(status: PrepaymentStatus | ''): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadPrepayments();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.loadPrepayments();
  }

  // --- Műveletek ---
  openDetail(p: Prepayment): void {
    this.selectedPrepayment.set(p);
    this.showDetailDialog.set(true);
  }

  openMarkPaid(p: Prepayment): void {
    this.selectedPrepayment.set(p);
    this.showMarkPaidDialog.set(true);
  }

  openRefund(p: Prepayment): void {
    this.selectedPrepayment.set(p);
    this.showRefundDialog.set(true);
  }

  confirmCancel(p: Prepayment): void {
    this.selectedPrepayment.set(p);
    this.showCancelConfirm.set(true);
  }

  cancelPrepayment(): void {
    const p = this.selectedPrepayment();
    if (!p) return;
    this.prepaymentService.cancelPrepayment(p.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.showCancelConfirm.set(false); this.loadPrepayments(); } });
  }

  resend(p: Prepayment): void {
    this.prepaymentService.resendNotification(p.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onDialogClose(): void {
    this.showCreateDialog.set(false);
    this.showDetailDialog.set(false);
    this.showMarkPaidDialog.set(false);
    this.showRefundDialog.set(false);
    this.showBulkDialog.set(false);
    this.showCancelConfirm.set(false);
    this.selectedPrepayment.set(null);
  }

  onDialogSaved(): void {
    this.onDialogClose();
    this.loadPrepayments();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(value);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('hu-HU');
  }
}
