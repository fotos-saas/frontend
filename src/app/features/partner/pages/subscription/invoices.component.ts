import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionService, Invoice } from '../../services/subscription.service';
import { ICONS } from '../../../../shared/constants/icons.constants';

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
  imports: [CommonModule, FormsModule, LucideAngularModule, MatTooltipModule],
  template: `
    <div class="invoices-page page-card">
      <div class="header-title">
        <lucide-icon [name]="ICONS.FILE_TEXT" [size]="24" />
        <h1>Számlák</h1>
      </div>

      <p class="page-description">
        Itt találod a korábbi számláidat. A számlák kezeléséhez és fizetési adatok módosításához
        használd a Stripe portált.
      </p>

      <div class="filter-section">
        <label for="statusFilter" class="filter-label">
          <lucide-icon [name]="ICONS.FILTER" [size]="16" />
          Szűrés:
        </label>
        <select
          id="statusFilter"
          class="filter-select"
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusFilterChange($event)"
        >
          <option value="">Összes</option>
          <option value="paid">Fizetve</option>
          <option value="open">Nyitott</option>
          <option value="void">Érvénytelen</option>
        </select>
      </div>

      @if (loading() && invoices().length === 0) {
        <div class="loading-state">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-row"></div>
          }
        </div>
      } @else if (invoices().length === 0) {
        <div class="empty-state">
          <lucide-icon [name]="ICONS.FILE_TEXT" [size]="48" />
          <h2>Nincsenek számlák</h2>
          <p>{{ statusFilter() ? 'Nincs a szűrésnek megfelelő számla.' : 'Még nem állítottunk ki számlát.' }}</p>
        </div>
      } @else {
        <div class="table-wrapper">
          <div class="invoices-list">
            <div class="table-header">
              <span class="th th-number">Számlaszám</span>
              <span class="th th-date">Dátum</span>
              <span class="th th-amount">Összeg</span>
              <span class="th th-status">Státusz</span>
              <span class="th th-actions">Műveletek</span>
            </div>

            <div class="row-grid">
              @for (invoice of invoices(); track invoice.id; let i = $index) {
                <div class="list-row" [style.animation-delay]="i * 0.03 + 's'">
                  <span class="td td-number">{{ invoice.number || '-' }}</span>
                  <span class="td td-date">{{ formatDate(invoice.created_at) }}</span>
                  <span class="td td-amount">{{ formatAmount(invoice.amount, invoice.currency) }}</span>
                  <span class="td td-status">
                    <span class="status-badge" [class]="'status-badge--' + invoice.status">
                      {{ getStatusLabel(invoice.status) }}
                    </span>
                  </span>
                  <span class="td td-actions">
                    @if (invoice.pdf_url) {
                      <a
                        [href]="invoice.pdf_url"
                        target="_blank"
                        rel="noopener"
                        class="action-btn"
                        matTooltip="PDF letöltése"
                      >
                        <lucide-icon [name]="ICONS.DOWNLOAD" [size]="16" />
                        <span class="action-label">Letöltés</span>
                      </a>
                    }
                    @if (invoice.hosted_url) {
                      <a
                        [href]="invoice.hosted_url"
                        target="_blank"
                        rel="noopener"
                        class="action-btn"
                        matTooltip="Megtekintés"
                      >
                        <lucide-icon [name]="ICONS.EXTERNAL_LINK" [size]="16" />
                        <span class="action-label">Megnyitás</span>
                      </a>
                    }
                  </span>
                </div>
              }
            </div>
          </div>
        </div>

          @if (hasMore()) {
            <div class="load-more">
              <button
                class="btn btn--secondary"
                (click)="loadMore()"
                [disabled]="loadingMore()"
              >
                @if (loadingMore()) {
                  <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
                }
                Több betöltése
              </button>
            </div>
          }
        </div>
      }

      <div class="portal-section">
        <button class="btn btn--primary" (click)="openPortal()" [disabled]="portalLoading()">
          @if (portalLoading()) {
            <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
          } @else {
            <lucide-icon [name]="ICONS.CREDIT_CARD" [size]="18" />
          }
          Fizetési adatok kezelése
        </button>
      </div>
    </div>
  `,
  styles: [`
    .invoices-page {
      max-width: 900px;
      margin: 0 auto;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      h1 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }
    }

    .filter-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .filter-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
      color: #64748b;
    }

    .filter-select {
      padding: 6px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #1e293b;
      background: white;
      cursor: pointer;
      transition: border-color 0.2s ease;

      &:hover {
        border-color: #cbd5e1;
      }

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }

    .page-description {
      color: #64748b;
      margin-bottom: 16px;
      font-size: 0.9375rem;
    }

    /* Table wrapper for horizontal scroll on mobile */
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 0 -16px;
      padding: 0 16px;
    }

    .invoices-list {
      min-width: 600px;
    }

    /* Table */
    .table-header {
      display: grid;
      grid-template-columns: 1.2fr 1fr 0.8fr 0.8fr 140px;
      gap: 12px;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 8px 8px 0 0;
      border: 1px solid #e2e8f0;
      border-bottom: none;
    }

    .th {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .th-actions {
      text-align: right;
    }

    .row-grid {
      display: flex;
      flex-direction: column;
    }

    .list-row {
      display: grid;
      grid-template-columns: 1.2fr 1fr 0.8fr 0.8fr 140px;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-top: none;
      align-items: center;
      transition: background 0.2s ease;
      animation: fadeSlideIn 0.3s ease forwards;
      opacity: 0;
    }

    @keyframes fadeSlideIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .list-row:last-child {
      border-radius: 0 0 8px 8px;
    }

    .list-row:hover {
      background: #f8fafc;
    }

    .td {
      font-size: 0.875rem;
      color: #1e293b;
    }

    .td-number {
      font-family: monospace;
      font-weight: 500;
    }

    .td-date {
      color: #64748b;
    }

    .td-amount {
      font-weight: 600;
    }

    .td-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge--paid {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-badge--open {
      background: #fef3c7;
      color: #d97706;
    }

    .status-badge--draft {
      background: #f1f5f9;
      color: #64748b;
    }

    .status-badge--void,
    .status-badge--uncollectible {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Action Button */
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 6px;
      color: #64748b;
      text-decoration: none;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #e2e8f0;
      color: #3b82f6;
    }

    .action-label {
      display: inline;
    }

    /* Load More */
    .load-more {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }

    /* Portal Section */
    .portal-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }

    /* Button */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn--primary {
      background: #3b82f6;
      color: white;
    }

    .btn--primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn--secondary {
      background: white;
      color: #1e293b;
      border: 1px solid #e2e8f0;
    }

    .btn--secondary:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    /* Loading & Empty */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .skeleton-row {
      height: 60px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      background: #f8fafc;
      border-radius: 12px;
      color: #64748b;
      text-align: center;
    }

    .empty-state h2 {
      margin: 16px 0 8px;
      font-size: 1.125rem;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Mobile - horizontal scroll hint */
    @media (max-width: 640px) {
      .table-wrapper {
        margin: 0 -20px;
        padding: 0 20px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton-row,
      .spin,
      .list-row {
        animation: none;
      }

      .list-row {
        opacity: 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicesComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  protected readonly ICONS = ICONS;

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
    }).subscribe({
      next: (res) => {
        this.invoices.set(res.invoices);
        this.hasMore.set(res.has_more);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load invoices:', err);
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
    }).subscribe({
      next: (res) => {
        this.invoices.update(prev => [...prev, ...res.invoices]);
        this.hasMore.set(res.has_more);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('Failed to load more invoices:', err);
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
    this.subscriptionService.openPortal().subscribe({
      next: (res) => {
        window.open(res.portal_url, '_blank');
        this.portalLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to open portal:', err);
        this.portalLoading.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0
    }).format(amount / 100);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Piszkozat',
      paid: 'Fizetve',
      open: 'Nyitott',
      void: 'Érvénytelen',
      uncollectible: 'Behajtható'
    };
    return labels[status] ?? status;
  }
}
