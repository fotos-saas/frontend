import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Subscription információ a partner előfizetéséről
 */
export interface SubscriptionInfo {
  plan: 'alap' | 'iskola' | 'studio';
  plan_name: string;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'paused' | 'canceling' | 'trial' | 'canceled' | 'pending';
  started_at: string | null;
  ends_at: string | null;
  features: string[];
  limits: {
    storage_gb: number;
    max_classes: number | null;
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

  /**
   * Előfizetés adatok lekérése
   */
  getSubscription(): Observable<SubscriptionInfo> {
    return this.http.get<SubscriptionInfo>(`${this.baseUrl}/subscription`);
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
}
