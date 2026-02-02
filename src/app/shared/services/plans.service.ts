import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Plan limitekhez tartozó interfész
 */
export interface PlanLimits {
  storage_gb: number;
  max_classes: number | null;
  max_schools: number | null;
  max_templates: number | null;
}

/**
 * Egyetlen csomag konfigurációja
 */
export interface PlanConfig {
  name: string;
  description: string;
  popular?: boolean;
  monthly_price: number;
  yearly_price: number;
  paused_price: number;
  limits: PlanLimits;
  feature_keys: string[];
  feature_labels: string[];
}

/**
 * Addon konfiguráció
 */
export interface AddonConfig {
  name: string;
  description: string;
  includes: string[];
  monthly_price: number;
  yearly_price: number;
  available_for: string[];
}

/**
 * Extra tárhely addon konfiguráció
 */
export interface StorageAddonConfig {
  unit_price_monthly: number;
  unit_price_yearly: number;
}

/**
 * Teljes plans API válasz
 */
export interface PlansResponse {
  plans: Record<string, PlanConfig>;
  addons: Record<string, AddonConfig>;
  storage_addon: StorageAddonConfig;
}

/**
 * Frontend számára formázott plan adat
 */
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  pausedPrice: number;
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
}

/**
 * Plans Service
 *
 * Központi csomag konfiguráció lekérdezése a backend API-ból.
 * Single source of truth - az összes csomag és ár adat innen származik.
 *
 * Jellemzők:
 * - Egyszer tölti be az adatokat, utána cache-ből szolgáltat
 * - Signal alapú reaktív cache
 * - Helper metódusok a frontend komponensek számára
 *
 * @see backend/config/plans.php
 */
@Injectable({
  providedIn: 'root'
})
export class PlansService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // Cache signal
  private plansCache = signal<PlansResponse | null>(null);
  private plansRequest$: Observable<PlansResponse> | null = null;

  /**
   * Plans konfiguráció lekérése (cache-elt)
   */
  getPlans(): Observable<PlansResponse> {
    // Ha már cache-ben van, azonnal visszaadjuk
    const cached = this.plansCache();
    if (cached) {
      return of(cached);
    }

    // Ha már fut egy kérés, azt adjuk vissza
    if (this.plansRequest$) {
      return this.plansRequest$;
    }

    // Új kérés indítása
    this.plansRequest$ = this.http.get<PlansResponse>(`${this.baseUrl}/plans`).pipe(
      tap(response => {
        this.plansCache.set(response);
        this.plansRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.plansRequest$;
  }

  /**
   * Plans konfiguráció formázva frontend használatra (PricingPlan tömb)
   */
  getPricingPlans(): Observable<PricingPlan[]> {
    return this.getPlans().pipe(
      map(response => this.formatPlansForUI(response.plans))
    );
  }

  /**
   * Egyetlen plan lekérése ID alapján
   */
  getPlan(planId: string): Observable<PlanConfig | null> {
    return this.getPlans().pipe(
      map(response => response.plans[planId] ?? null)
    );
  }

  /**
   * Addon lekérése key alapján
   */
  getAddon(addonKey: string): Observable<AddonConfig | null> {
    return this.getPlans().pipe(
      map(response => response.addons[addonKey] ?? null)
    );
  }

  /**
   * Extra tárhely árak lekérése
   */
  getStorageAddonPrices(): Observable<StorageAddonConfig> {
    return this.getPlans().pipe(
      map(response => response.storage_addon)
    );
  }

  /**
   * Plan árak lekérése (komponensek számára egyszerűsített formátum)
   */
  getPlanPrices(): Observable<Record<string, { monthly: number; yearly: number }>> {
    return this.getPlans().pipe(
      map(response => {
        const prices: Record<string, { monthly: number; yearly: number }> = {};
        for (const [key, plan] of Object.entries(response.plans)) {
          prices[key] = {
            monthly: plan.monthly_price,
            yearly: plan.yearly_price,
          };
        }
        return prices;
      })
    );
  }

  /**
   * Plans formázása frontend komponensek számára
   */
  private formatPlansForUI(plans: Record<string, PlanConfig>): PricingPlan[] {
    return Object.entries(plans).map(([id, plan]) => ({
      id,
      name: plan.name.replace('TablóStúdió ', ''), // Rövid név
      description: plan.description,
      monthlyPrice: plan.monthly_price,
      yearlyPrice: plan.yearly_price,
      pausedPrice: plan.paused_price,
      features: plan.feature_labels,
      limits: plan.limits,
      popular: plan.popular,
    }));
  }

  /**
   * Cache törlése (teszteléshez, force reload-hoz)
   */
  clearCache(): void {
    this.plansCache.set(null);
    this.plansRequest$ = null;
  }
}
