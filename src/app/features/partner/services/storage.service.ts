import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Tárhely használat adatok
 */
export interface StorageUsage {
  used_gb: number;
  plan_limit_gb: number;
  additional_gb: number;
  total_limit_gb: number;
  usage_percent: number;
  is_near_limit: boolean;
  addon_price_monthly: number;
  addon_price_yearly: number;
  billing_cycle: 'monthly' | 'yearly';
}

/**
 * Storage addon frissítés válasz
 */
export interface StorageAddonResponse {
  message: string;
  additional_gb: number;
  total_limit_gb: number;
}

/**
 * Storage Service
 *
 * Partner tárhely kezelés:
 * - Tárhely használat lekérdezése
 * - Extra tárhely vásárlás/módosítás
 * - Extra tárhely eltávolítása
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/storage`;

  /**
   * Tárhely használat és árak lekérdezése
   */
  getUsage(): Observable<StorageUsage> {
    return this.http.get<StorageUsage>(`${this.baseUrl}/usage`);
  }

  /**
   * Extra tárhely beállítása/módosítása
   * @param gb Extra tárhely GB-ban (0 = törlés)
   */
  setAddon(gb: number): Observable<StorageAddonResponse> {
    return this.http.post<StorageAddonResponse>(`${this.baseUrl}/addon`, { gb });
  }

  /**
   * Extra tárhely eltávolítása
   */
  removeAddon(): Observable<StorageAddonResponse> {
    return this.http.delete<StorageAddonResponse>(`${this.baseUrl}/addon`);
  }

  /**
   * Ár számítás adott GB-ra és billing cycle-re
   */
  calculatePrice(gb: number, isYearly: boolean, monthlyPrice: number, yearlyPrice: number): number {
    return gb * (isYearly ? yearlyPrice : monthlyPrice);
  }

  /**
   * Havi ár számítás (éves esetén 12-vel osztva)
   */
  calculateMonthlyEquivalent(gb: number, isYearly: boolean, monthlyPrice: number, yearlyPrice: number): number {
    if (isYearly) {
      return Math.round((gb * yearlyPrice) / 12);
    }
    return gb * monthlyPrice;
  }
}
