import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PublicPrepaymentData {
  prepayment: {
    uuid: string;
    prepayment_number: string;
    mode: string;
    mode_label: string;
    status: string;
    status_label: string;
    amount_huf: number;
    parent_name: string;
    parent_email: string;
    parent_phone: string | null;
    child_name: string | null;
    class_name: string | null;
    payment_deadline: string | null;
    is_paid: boolean;
    is_expired: boolean;
    custom_terms: string | null;
    payment_methods: string[];
  };
  packages: {
    id: number;
    key: string;
    name: string;
    description: string | null;
    price_huf: number;
    included_items: { product_name: string; quantity: number }[];
  }[];
  branding: {
    name: string;
    logo_url: string | null;
    primary_color: string | null;
  };
}

export interface CheckoutResponse {
  success: boolean;
  data: {
    payment_method: string;
    checkout_url?: string;
    bank_details?: {
      account_name: string;
      account_number: string;
      reference: string;
      amount_huf: number;
    };
  };
  message: string;
}

export interface PrepaymentSuccessData {
  prepayment_number: string;
  amount_huf: number;
  status: string;
  status_label: string;
  child_name: string | null;
  paid_at: string | null;
  package: { name: string; included_items: { product_name: string; quantity: number }[] } | null;
  branding: {
    name: string;
    logo_url: string | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PrepaymentPublicService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/prepayment`;

  getPrepayment(token: string): Observable<{ success: boolean; data: PublicPrepaymentData }> {
    return this.http.get<{ success: boolean; data: PublicPrepaymentData }>(`${this.baseUrl}/${token}`);
  }

  createCheckout(token: string, data: {
    parent_name: string;
    parent_email: string;
    parent_phone?: string;
    billing_name?: string;
    billing_address?: string;
    billing_tax_number?: string;
    payment_method: string;
    package_key?: string;
    accept_terms: boolean;
  }): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.baseUrl}/${token}/checkout`, data);
  }

  getSuccess(token: string): Observable<{ success: boolean; data: PrepaymentSuccessData }> {
    return this.http.get<{ success: boolean; data: PrepaymentSuccessData }>(`${this.baseUrl}/${token}/success`);
  }
}
