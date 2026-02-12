import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Subscription információ a partner előfizetéséről
 */
export interface SubscriptionInfo {
  partner_name: string; // Partner (főnök) neve
  plan: 'alap' | 'iskola' | 'studio' | 'vip';
  plan_name: string;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'paused' | 'canceling' | 'trial' | 'canceled' | 'pending';
  started_at: string | null;
  ends_at: string | null;
  features: string[];
  limits: {
    storage_gb: number;
    max_classes: number | null;
    max_schools: number | null;
    max_templates: number | null;
  };
  usage?: {
    schools: number;
    classes: number;
    templates: number;
  };
  // Módosítás jelzők (extra tárhely, addonok)
  is_modified: boolean;
  has_extra_storage: boolean;
  extra_storage_gb: number;
  has_addons: boolean;
  active_addons: string[];
  // Stripe adatok (ha elérhető)
  stripe_status?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  // Költség Stripe-ból (fillérben)
  monthly_cost?: number;
  currency?: string;
  // Árak (config-ból)
  prices?: {
    plan_monthly: number;
    plan_yearly: number;
    storage_monthly: number;
    storage_yearly: number;
    addons: Record<string, { monthly: number; yearly: number }>;
  };
}

/**
 * Stripe számla adat
 */
export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  created_at: string;
  pdf_url: string | null;
  hosted_url: string | null;
}

/**
 * Számlák lekérés válasz
 */
export interface InvoicesResponse {
  invoices: Invoice[];
  has_more: boolean;
}

/**
 * Számlák lekérés paraméterei
 */
export interface InvoicesParams {
  per_page?: number;
  starting_after?: string;
  status?: string;
}

/**
 * Fiók törlés válasz
 */
export interface DeleteAccountResponse {
  message: string;
  deletion_date: string;
}

/**
 * Fiók státusz válasz
 */
export interface AccountStatusResponse {
  is_deleted: boolean;
  deletion_scheduled_at: string | null;
  days_until_permanent_deletion: number | null;
}

/**
 * Subscription Service
 *
 * Partner előfizetés kezelés:
 * - Előfizetés adatok lekérése
 * - Stripe Customer Portal megnyitása
 * - Előfizetés lemondás/folytatás
 * - Szüneteltetés/feloldás
 * - Fiók törlés
 */
@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** Cache signal - null = nincs még betöltve */
  private readonly cache = signal<SubscriptionInfo | null>(null);

  /**
   * Előfizetés adatok lekérése (cache-elt)
   */
  getSubscription(): Observable<SubscriptionInfo> {
    // Ha már van cache, azt használjuk
    const cached = this.cache();
    if (cached) {
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    // Ha nincs cache, lekérjük és cache-eljük
    return this.http.get<SubscriptionInfo>(`${this.baseUrl}/subscription`).pipe(
      tap(info => this.cache.set(info))
    );
  }

  /**
   * Cache törlése (pl. előfizetés módosítás után)
   */
  clearCache(): void {
    this.cache.set(null);
  }

  /**
   * Számlák lekérése Stripe-ból
   */
  getInvoices(params?: InvoicesParams): Observable<InvoicesResponse> {
    const httpParams: Record<string, string> = {};
    if (params?.per_page) httpParams['per_page'] = params.per_page.toString();
    if (params?.starting_after) httpParams['starting_after'] = params.starting_after;
    if (params?.status) httpParams['status'] = params.status;

    return this.http.get<InvoicesResponse>(`${this.baseUrl}/subscription/invoices`, { params: httpParams });
  }

  /**
   * Stripe Customer Portal megnyitása (csomag váltás, fizetési adatok)
   */
  openPortal(): Observable<{ portal_url: string }> {
    return this.http.post<{ portal_url: string }>(`${this.baseUrl}/subscription/portal`, {});
  }

  /**
   * Előfizetés lemondása (időszak végén)
   */
  cancel(): Observable<{ message: string; cancel_at: string }> {
    return this.http.post<{ message: string; cancel_at: string }>(`${this.baseUrl}/subscription/cancel`, {});
  }

  /**
   * Lemondott előfizetés folytatása
   */
  resume(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/subscription/resume`, {});
  }

  /**
   * Előfizetés szüneteltetése (csökkentett árral)
   */
  pause(): Observable<{ message: string; paused_price: number }> {
    return this.http.post<{ message: string; paused_price: number }>(`${this.baseUrl}/subscription/pause`, {});
  }

  /**
   * Szüneteltetett előfizetés feloldása
   */
  unpause(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/subscription/unpause`, {});
  }

  // ==========================================
  // FIÓK KEZELÉS
  // ==========================================

  /**
   * Fiók státusz lekérése
   */
  getAccountStatus(): Observable<AccountStatusResponse> {
    return this.http.get<AccountStatusResponse>(`${this.baseUrl}/account/status`);
  }

  /**
   * Fiók törlése (soft delete, 30 nap retention)
   */
  deleteAccount(): Observable<DeleteAccountResponse> {
    return this.http.delete<DeleteAccountResponse>(`${this.baseUrl}/account`);
  }

  /**
   * Fiók törlés visszavonása
   */
  cancelDeletion(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/account/cancel-deletion`, {});
  }

  // ==========================================
  // REGISZTRÁCIÓ
  // ==========================================

  /**
   * Stripe Checkout session létrehozása regisztrációhoz
   */
  createCheckoutSession(data: {
    name: string;
    email: string;
    password: string;
    billing: Record<string, unknown>;
    plan: string;
    billing_cycle: string;
  }): Observable<{ checkout_url: string; session_id: string }> {
    return this.http.post<{ checkout_url: string; session_id: string }>(
      `${this.baseUrl}/subscription/checkout`,
      data
    );
  }

  /**
   * Regisztráció véglegesítése Stripe payment után
   */
  completeRegistration(sessionId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/subscription/complete`,
      { session_id: sessionId }
    );
  }
}
