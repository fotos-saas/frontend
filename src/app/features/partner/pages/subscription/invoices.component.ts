import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionService } from '../../services/subscription.service';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Számla adat interface
 */
interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  created_at: string;
  pdf_url: string | null;
  hosted_url: string | null;
}

/**
 * Invoices Page
 *
 * Számlák listája:
 * - Korábbi számlák
 * - PDF letöltés
 * - Stripe hosted invoice link
 */
@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTooltipModule],
  template: `
    <div class="invoices-page page-card">
      <h1 class="page-title">
        <lucide-icon [name]="ICONS.FILE_TEXT" [size]="24" />
        Számlák
      </h1>

      <p class="page-description">
        Itt találod a korábbi számláidat. A számlák kezeléséhez és fizetési adatok módosításához
        használd a Stripe portált.
      </p>

      @if (loading()) {
        <div class="loading-state">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-row"></div>
          }
        </div>
      } @else if (invoices().length === 0) {
        <div class="empty-state">
          <lucide-icon [name]="ICONS.FILE_TEXT" [size]="48" />
          <h2>Nincsenek számlák</h2>
          <p>Még nem állítottunk ki számlát.</p>
        </div>
      } @else {
        <div class="invoices-list">
          <div class="table-header">
            <span class="th th-number">Számlaszám</span>
            <span class="th th-date">Dátum</span>
            <span class="th th-amount">Összeg</span>
            <span class="th th-status">Státusz</span>
            <span class="th th-actions">Műveletek</span>
          </div>

          @for (invoice of invoices(); track invoice.id) {
            <div class="invoice-row">
              <span class="td td-number">{{ invoice.number }}</span>
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
                    <lucide-icon [name]="ICONS.DOWNLOAD" [size]="18" />
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
                    <lucide-icon [name]="ICONS.EXTERNAL_LINK" [size]="18" />
                  </a>
                }
              </span>
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
      margin: 0 auto; /* Középre igazítás */
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .page-description {
      color: #64748b;
      margin-bottom: 24px;
      font-size: 0.9375rem;
    }

    /* Table */
    .table-header {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr 1fr 100px;
      gap: 16px;
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
    }

    .th-actions {
      text-align: right;
    }

    .invoice-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr 1fr 100px;
      gap: 16px;
      padding: 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-top: none;
      align-items: center;
      transition: background 0.2s ease;
    }

    .invoice-row:last-child {
      border-radius: 0 0 8px 8px;
    }

    .invoice-row:hover {
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

    .status-badge--void,
    .status-badge--uncollectible {
      background: #f1f5f9;
      color: #64748b;
    }

    /* Action Button */
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      color: #64748b;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #e2e8f0;
      color: #3b82f6;
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

    /* Mobile */
    @media (max-width: 768px) {
      .table-header {
        display: none;
      }

      .invoice-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        border-radius: 8px;
        margin-bottom: 8px;
        border: 1px solid #e2e8f0;
      }

      .td::before {
        content: attr(data-label);
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
        display: block;
        margin-bottom: 2px;
      }

      .td-actions {
        justify-content: flex-start;
        padding-top: 8px;
        border-top: 1px solid #e2e8f0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton-row,
      .spin {
        animation: none;
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
  portalLoading = signal(false);

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    // TODO: Implement invoices endpoint
    // Egyelőre mock data
    setTimeout(() => {
      this.invoices.set([]);
      this.loading.set(false);
    }, 500);
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
    }).format(amount / 100); // Stripe returns cents
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      paid: 'Fizetve',
      open: 'Nyitott',
      void: 'Érvénytelen',
      uncollectible: 'Behajtható'
    };
    return labels[status] ?? status;
  }
}
