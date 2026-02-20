import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  MarketplaceConfig,
  ModulesResponse,
  PackagesResponse,
  ModuleActionResponse,
  PackageActionResponse,
  UsageResponse,
  MarketplaceCheckoutRequest,
  CheckoutResponse,
  CheckoutCompleteResponse,
  PartnerModule,
  PartnerPackage,
  BillingCycle,
} from '../models/marketplace.models';

/**
 * Marketplace Service
 *
 * Moduláris piactér kezelés:
 * - Konfiguráció lekérése (publikus)
 * - Modulok listázás/aktiválás/lemondás/szünet
 * - Csomagok listázás/aktiválás/lemondás
 * - Használat összesítő
 * - Checkout (regisztráció)
 */
@Injectable({
  providedIn: 'root',
})
export class MarketplaceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/marketplace`;

  // =========================================================================
  // Állapot (signal-ek)
  // =========================================================================

  /** Betöltött modulok */
  readonly modules = signal<PartnerModule[]>([]);

  /** Betöltött csomagok */
  readonly packages = signal<PartnerPackage[]>([]);

  /** Aktív csomag kulcs */
  readonly activePackage = signal<string | null>(null);

  /** Betöltés állapot */
  readonly loading = signal(false);

  /** Aktív modulok száma */
  readonly activeModulesCount = computed(() =>
    this.modules().filter(m =>
      ['active', 'package', 'trial', 'free'].includes(m.partner_status)
    ).length
  );

  /** Havi modul költség */
  readonly monthlyModuleCost = signal(0);

  // =========================================================================
  // Publikus API (nincs auth)
  // =========================================================================

  /**
   * Teljes marketplace konfiguráció (publikus, cache-elt backend-en)
   */
  getConfig(): Observable<MarketplaceConfig> {
    return this.http.get<MarketplaceConfig>(`${this.baseUrl}/config`);
  }

  /**
   * Checkout session létrehozás (regisztráció)
   */
  createCheckout(data: MarketplaceCheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.baseUrl}/checkout`, data);
  }

  /**
   * Checkout befejezés
   */
  completeCheckout(sessionId: string): Observable<CheckoutCompleteResponse> {
    return this.http.post<CheckoutCompleteResponse>(`${this.baseUrl}/checkout/complete`, {
      session_id: sessionId,
    });
  }

  // =========================================================================
  // Modulok (auth)
  // =========================================================================

  /**
   * Partner moduljainak listája állapottal
   */
  getModules(): Observable<ModulesResponse> {
    this.loading.set(true);

    return this.http.get<ModulesResponse>(`${this.baseUrl}/modules`).pipe(
      tap(res => {
        this.modules.set(res.modules);
        this.monthlyModuleCost.set(res.summary.monthly_module_cost);
        this.activePackage.set(res.summary.active_package);
        this.loading.set(false);
      })
    );
  }

  /**
   * Modul aktiválás
   */
  activateModule(moduleKey: string, billingCycle?: BillingCycle): Observable<ModuleActionResponse> {
    return this.http
      .post<ModuleActionResponse>(`${this.baseUrl}/modules/${moduleKey}/activate`, {
        billing_cycle: billingCycle,
      })
      .pipe(tap(() => this.refreshModules()));
  }

  /**
   * Modul lemondás
   */
  cancelModule(moduleKey: string): Observable<ModuleActionResponse> {
    return this.http
      .delete<ModuleActionResponse>(`${this.baseUrl}/modules/${moduleKey}`)
      .pipe(tap(() => this.refreshModules()));
  }

  /**
   * Modul szüneteltetés
   */
  pauseModule(moduleKey: string): Observable<ModuleActionResponse> {
    return this.http
      .post<ModuleActionResponse>(`${this.baseUrl}/modules/${moduleKey}/pause`, {})
      .pipe(tap(() => this.refreshModules()));
  }

  /**
   * Modul újraindítás
   */
  resumeModule(moduleKey: string): Observable<ModuleActionResponse> {
    return this.http
      .post<ModuleActionResponse>(`${this.baseUrl}/modules/${moduleKey}/resume`, {})
      .pipe(tap(() => this.refreshModules()));
  }

  // =========================================================================
  // Csomagok (auth)
  // =========================================================================

  /**
   * Csomagok listája
   */
  getPackages(): Observable<PackagesResponse> {
    return this.http.get<PackagesResponse>(`${this.baseUrl}/packages`).pipe(
      tap(res => {
        this.packages.set(res.packages);
        this.activePackage.set(res.current_package);
      })
    );
  }

  /**
   * Csomag aktiválás
   */
  activatePackage(packageKey: string, billingCycle?: BillingCycle): Observable<PackageActionResponse> {
    return this.http
      .post<PackageActionResponse>(`${this.baseUrl}/packages/${packageKey}/activate`, {
        billing_cycle: billingCycle,
      })
      .pipe(tap(() => this.refreshModules()));
  }

  /**
   * Csomag lemondás
   */
  cancelPackage(packageKey: string): Observable<PackageActionResponse> {
    return this.http
      .delete<PackageActionResponse>(`${this.baseUrl}/packages/${packageKey}`)
      .pipe(tap(() => this.refreshModules()));
  }

  // =========================================================================
  // Használat (auth)
  // =========================================================================

  /**
   * Per-use havi összesítő
   */
  getUsage(month?: string): Observable<UsageResponse> {
    const params: Record<string, string> = {};
    if (month) params['month'] = month;

    return this.http.get<UsageResponse>(`${this.baseUrl}/usage`, { params });
  }

  // =========================================================================
  // Privát
  // =========================================================================

  private refreshModules(): void {
    this.getModules().subscribe();
  }
}
