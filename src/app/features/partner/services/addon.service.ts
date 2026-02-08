import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { formatPrice as formatPriceUtil } from '../../../shared/utils/formatters.util';

/**
 * Addon definíció
 */
export interface Addon {
  key: string;
  name: string;
  description: string;
  includes: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  isIncludedInPlan: boolean;
  canPurchase: boolean;
  isFree?: boolean;
}

/**
 * Aktív addon
 */
export interface ActiveAddon {
  key: string;
  name: string;
  activatedAt: string;
  includes: string[];
}

/**
 * Addon lista válasz
 */
export interface AddonListResponse {
  addons: Addon[];
  plan: string;
  billing_cycle: 'monthly' | 'yearly';
}

/**
 * Aktív addonok válasz
 */
export interface ActiveAddonsResponse {
  addons: ActiveAddon[];
}

/**
 * Addon subscribe válasz
 */
export interface AddonSubscribeResponse {
  message: string;
  subscription_item_id: string;
}

/**
 * Addon cancel válasz
 */
export interface AddonCancelResponse {
  message: string;
}

/**
 * Addon Service
 *
 * Partner addon kezelés:
 * - Elérhető addonok listázása
 * - Aktív addonok lekérdezése
 * - Addon aktiválása (Stripe)
 * - Addon lemondása
 */
@Injectable({
  providedIn: 'root'
})
export class AddonService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/addons`;

  /**
   * Elérhető addonok listája a partnerhez
   */
  getAddons(): Observable<AddonListResponse> {
    return this.http.get<AddonListResponse>(this.baseUrl);
  }

  /**
   * Partner aktív addonjai
   */
  getActiveAddons(): Observable<ActiveAddonsResponse> {
    return this.http.get<ActiveAddonsResponse>(`${this.baseUrl}/active`);
  }

  /**
   * Addon aktiválása (hozzáadás a Stripe előfizetéshez)
   * @param key Addon kulcs (pl. 'community_pack')
   */
  subscribe(key: string): Observable<AddonSubscribeResponse> {
    return this.http.post<AddonSubscribeResponse>(`${this.baseUrl}/${key}/subscribe`, {});
  }

  /**
   * Addon lemondása
   * @param key Addon kulcs (pl. 'community_pack')
   */
  cancel(key: string): Observable<AddonCancelResponse> {
    return this.http.delete<AddonCancelResponse>(`${this.baseUrl}/${key}`);
  }

  /**
   * Ár formázás HUF-ban
   * @deprecated Használd a formatPrice() függvényt a '@shared/utils/formatters.util'-ból
   */
  formatPrice(price: number): string {
    return formatPriceUtil(price);
  }

  /**
   * Feature ikon lekérés
   */
  getFeatureIcon(feature: string): string {
    const icons: Record<string, string> = {
      forum: 'message-circle',
      polls: 'check-circle',
      branding: 'palette',
      invoicing: 'file-text',
    };
    return icons[feature] || 'check';
  }

  /**
   * Feature név lekérés (magyar)
   */
  getFeatureName(feature: string): string {
    const names: Record<string, string> = {
      forum: 'Fórum',
      polls: 'Szavazás',
      branding: 'Márkajelzés',
      invoicing: 'Számlázás',
    };
    return names[feature] || feature;
  }
}
