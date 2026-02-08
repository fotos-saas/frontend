import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface PartnerCharge {
  id: number;
  charge_number: string;
  service_type: string;
  service_label: string;
  service_name: string | null;
  description: string | null;
  amount_huf: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  person_name: string | null;
  person_id: number;
  project_id: number;
  invoice_number: string | null;
  invoice_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface PartnerBillingSummary {
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  charges_count: number;
  pending_count: number;
  paid_count: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PaginatedChargesResponse {
  charges: PartnerCharge[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PartnerBillingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner/billing`;

  readonly charges = signal<PartnerCharge[]>([]);
  readonly summary = signal<PartnerBillingSummary | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pagination = signal<PaginatedChargesResponse['pagination'] | null>(null);

  readonly activeFilter = signal<string>('all');
  readonly projectFilter = signal<number | null>(null);

  readonly filteredCharges = computed(() => {
    const filter = this.activeFilter();
    const all = this.charges();
    if (filter === 'all') return all;
    return all.filter(c => c.status === filter);
  });

  loadCharges(page = 1): void {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams().set('page', page.toString());
    const projectId = this.projectFilter();
    if (projectId) {
      params = params.set('project_id', projectId.toString());
    }

    this.http.get<ApiResponse<PaginatedChargesResponse>>(this.baseUrl, { params }).subscribe({
      next: (res) => {
        this.charges.set(res.data.charges);
        this.pagination.set(res.data.pagination);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nem sikerült betölteni a terheléseket.');
        this.loading.set(false);
      },
    });
  }

  loadSummary(): void {
    let params = new HttpParams();
    const projectId = this.projectFilter();
    if (projectId) {
      params = params.set('project_id', projectId.toString());
    }

    this.http.get<ApiResponse<{ summary: PartnerBillingSummary }>>(`${this.baseUrl}/summary`, { params }).subscribe({
      next: (res) => {
        this.summary.set(res.data.summary);
      },
    });
  }

  createCharge(payload: Record<string, unknown>, onSuccess?: () => void): void {
    this.http.post<ApiResponse<{ charge: PartnerCharge }>>(this.baseUrl, payload).subscribe({
      next: (res) => {
        this.charges.update(list => [res.data.charge, ...list]);
        onSuccess?.();
      },
      error: () => {
        this.error.set('Nem sikerült létrehozni a terhelést.');
      },
    });
  }

  cancelCharge(id: number): void {
    this.http.post<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}/cancel`, {}).subscribe({
      next: () => {
        this.charges.update(list => list.map(c =>
          c.id === id ? { ...c, status: 'cancelled' } : c
        ));
      },
      error: () => {
        this.error.set('Nem sikerült törölni a terhelést.');
      },
    });
  }
}
