import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BillingCharge, BillingChargeStatus, BillingSummary } from '../models/billing.models';
import { isSecureUrl, openSecureUrl } from '@core/utils/url-validator.util';

interface ApiChargesResponse {
  success: boolean;
  data: {
    charges: ApiCharge[];
  };
}

interface ApiSummaryResponse {
  success: boolean;
  data: {
    summary: {
      total_amount: number;
      paid_amount: number;
      pending_amount: number;
      charges_count: number;
    };
  };
}

interface ApiCharge {
  id: number;
  charge_number: string;
  service_type: string;
  service_label: string;
  description: string;
  amount_huf: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend/billing`;

  readonly charges = signal<BillingCharge[]>([]);
  readonly summary = signal<BillingSummary | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeFilter = signal<BillingChargeStatus | 'all'>('all');

  readonly filteredCharges = computed(() => {
    const filter = this.activeFilter();
    const all = this.charges();
    if (filter === 'all') return all;
    return all.filter(c => c.status === filter);
  });

  readonly paymentLoadingId = signal<number | null>(null);

  startPayment(chargeId: number): void {
    this.paymentLoadingId.set(chargeId);

    this.http.post<{ success: boolean; data: { checkout_url: string } }>(
      `${this.apiUrl}/${chargeId}/checkout`, {}
    ).subscribe({
      next: (res) => {
        this.paymentLoadingId.set(null);
        if (isSecureUrl(res.data.checkout_url)) {
          window.location.href = res.data.checkout_url;
        } else {
          this.error.set('Érvénytelen fizetési URL.');
        }
      },
      error: () => {
        this.paymentLoadingId.set(null);
        this.error.set('Nem sikerült elindítani a fizetést.');
      },
    });
  }

  downloadInvoice(invoiceUrl: string): void {
    openSecureUrl(invoiceUrl);
  }

  handlePaymentReturn(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      this.loadCharges();
      this.loadSummary();
      // URL-ből eltávolítjuk a payment paramot
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('charge_id');
      window.history.replaceState({}, '', url.toString());
    }
  }

  loadCharges(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<ApiChargesResponse>(this.apiUrl).subscribe({
      next: (res) => {
        this.charges.set(res.data.charges.map(c => this.mapCharge(c)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nem sikerült betölteni a terheléseket.');
        this.loading.set(false);
      },
    });
  }

  loadSummary(): void {
    this.http.get<ApiSummaryResponse>(`${this.apiUrl}/summary`).subscribe({
      next: (res) => {
        const s = res.data.summary;
        this.summary.set({
          totalAmount: s.total_amount,
          paidAmount: s.paid_amount,
          pendingAmount: s.pending_amount,
          chargesCount: s.charges_count,
        });
      },
      error: () => {
        // summary hiba nem blokkoló
      },
    });
  }

  private mapCharge(c: ApiCharge): BillingCharge {
    return {
      id: c.id,
      chargeNumber: c.charge_number,
      serviceType: c.service_type as BillingCharge['serviceType'],
      serviceLabel: c.service_label,
      description: c.description,
      amountHuf: c.amount_huf,
      status: c.status as BillingChargeStatus,
      dueDate: c.due_date,
      paidAt: c.paid_at,
      invoiceNumber: c.invoice_number,
      invoiceUrl: c.invoice_url,
      createdAt: c.created_at,
    };
  }
}
