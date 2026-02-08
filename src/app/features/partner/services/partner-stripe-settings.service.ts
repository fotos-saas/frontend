import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { StripeSettings, UpdateStripeSettingsPayload } from '../models/stripe-settings.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerStripeSettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner/stripe-settings`;

  readonly settings = signal<StripeSettings | null>(null);
  readonly loading = signal(false);
  readonly validating = signal(false);
  readonly error = signal<string | null>(null);

  loadSettings(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<ApiResponse<{ stripe_settings: StripeSettings }>>(this.baseUrl).subscribe({
      next: (res) => {
        this.settings.set(res.data.stripe_settings);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nem sikerült betölteni a Stripe beállításokat.');
        this.loading.set(false);
      },
    });
  }

  updateSettings(payload: UpdateStripeSettingsPayload, onSuccess?: () => void): void {
    this.loading.set(true);

    this.http.put<ApiResponse<{ stripe_settings: StripeSettings; message: string }>>(this.baseUrl, payload).subscribe({
      next: (res) => {
        this.settings.set(res.data.stripe_settings);
        this.loading.set(false);
        onSuccess?.();
      },
      error: () => {
        this.error.set('Nem sikerült menteni a Stripe beállításokat.');
        this.loading.set(false);
      },
    });
  }

  validateKeys(onResult?: (valid: boolean, message: string) => void): void {
    this.validating.set(true);

    this.http.post<ApiResponse<{ valid: boolean; message: string }>>(`${this.baseUrl}/validate`, {}).subscribe({
      next: (res) => {
        this.validating.set(false);
        onResult?.(res.data.valid, res.data.message);
      },
      error: () => {
        this.validating.set(false);
        onResult?.(false, 'Hiba a kulcsok validálásakor.');
      },
    });
  }
}
