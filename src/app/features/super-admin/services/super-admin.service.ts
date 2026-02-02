import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardStats, PaginatedResponse, DashboardProjectItem } from '../../../shared/components/dashboard';

/**
 * Előfizető lista item
 */
export interface SubscriberListItem {
  id: number;
  name: string;
  email: string;
  companyName: string | null;
  plan: 'alap' | 'iskola' | 'studio';
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  price: number;
  subscriptionStatus: 'active' | 'paused' | 'canceling' | 'trial';
  subscriptionEndsAt: string | null;
  createdAt: string;
}

/**
 * Előfizető részletes adatok
 */
export interface SubscriberDetail {
  id: number;
  name: string;
  email: string;
  companyName: string | null;
  taxNumber: string | null;
  billingCountry: string | null;
  billingPostalCode: string | null;
  billingCity: string | null;
  billingAddress: string | null;
  phone: string | null;
  plan: 'alap' | 'iskola' | 'studio';
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  price: number;
  subscriptionStatus: 'active' | 'paused' | 'canceling' | 'trial' | 'canceled';
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
  trialDaysRemaining: number | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  storageLimitGb: number | null;
  maxClasses: number | null;
  features: string[] | null;
  createdAt: string;
}

/**
 * Audit log bejegyzés
 */
export interface AuditLogEntry {
  id: number;
  adminName: string;
  action: string;
  actionLabel: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

/**
 * Rendszer beállítások
 */
export interface SystemSettings {
  system: {
    registrationEnabled: boolean;
    trialDays: number;
    defaultPlan: 'alap' | 'iskola' | 'studio';
  };
  email: {
    host: string | null;
    port: number | null;
    username: string | null;
  };
  stripe: {
    publicKey: string | null;
    webhookConfigured: boolean;
  };
  info: {
    appVersion: string;
    laravelVersion: string;
    phpVersion: string;
    environment: string;
    cacheDriver: string;
    queueDriver: string;
  };
}

/**
 * Super Admin API Service
 * API hívások a super admin felülethez.
 */
@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/super-admin`;

  /**
   * Dashboard statisztikák lekérése
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Partnerek listázása (paginált)
   */
  getProjects(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  }): Observable<PaginatedResponse<DashboardProjectItem>> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params?.sort_dir) httpParams = httpParams.set('sort_dir', params.sort_dir);

    return this.http.get<PaginatedResponse<DashboardProjectItem>>(`${this.baseUrl}/partners`, { params: httpParams });
  }

  /**
   * Előfizetők listázása (paginált)
   */
  getSubscribers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    plan?: string;
    status?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  }): Observable<PaginatedResponse<SubscriberListItem>> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.plan) httpParams = httpParams.set('plan', params.plan);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params?.sort_dir) httpParams = httpParams.set('sort_dir', params.sort_dir);

    return this.http.get<PaginatedResponse<SubscriberListItem>>(`${this.baseUrl}/subscribers`, { params: httpParams });
  }

  /**
   * Rendszer beállítások lekérése
   */
  getSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(`${this.baseUrl}/settings`);
  }

  /**
   * Rendszer beállítások mentése
   */
  updateSettings(settings: Partial<SystemSettings['system']>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/settings`, settings);
  }

  /**
   * Előfizető részletes adatainak lekérése
   */
  getSubscriber(id: number): Observable<SubscriberDetail> {
    return this.http.get<SubscriberDetail>(`${this.baseUrl}/subscribers/${id}`);
  }

  /**
   * Manuális terhelés Stripe Invoice-szal
   */
  chargeSubscriber(id: number, data: { amount: number; description: string }): Observable<{ success: boolean; message: string; invoiceId?: string }> {
    return this.http.post<{ success: boolean; message: string; invoiceId?: string }>(`${this.baseUrl}/subscribers/${id}/charge`, data);
  }

  /**
   * Csomag váltás
   */
  changePlan(id: number, data: { plan: 'alap' | 'iskola' | 'studio'; billing_cycle?: 'monthly' | 'yearly' }): Observable<{ success: boolean; message: string; newPrice?: number }> {
    return this.http.put<{ success: boolean; message: string; newPrice?: number }>(`${this.baseUrl}/subscribers/${id}/change-plan`, data);
  }

  /**
   * Előfizetés törlése
   */
  cancelSubscription(id: number, immediate: boolean): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/subscribers/${id}/subscription`, {
      body: { immediate }
    });
  }

  /**
   * Audit logok lekérése
   */
  getAuditLogs(id: number, params?: {
    page?: number;
    per_page?: number;
    search?: string;
    action?: string;
    sort_dir?: 'asc' | 'desc';
  }): Observable<PaginatedResponse<AuditLogEntry>> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.action) httpParams = httpParams.set('action', params.action);
    if (params?.sort_dir) httpParams = httpParams.set('sort_dir', params.sort_dir);

    return this.http.get<PaginatedResponse<AuditLogEntry>>(`${this.baseUrl}/subscribers/${id}/audit-logs`, { params: httpParams });
  }
}
