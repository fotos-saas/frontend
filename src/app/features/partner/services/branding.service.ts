import { Injectable, inject, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BrandingData {
  brand_name: string | null;
  is_active: boolean;
  hide_brand_name: boolean;
  logo_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
}

export interface BrandingResponse {
  branding: BrandingData | null;
}

export interface BrandingUpdateResponse {
  message: string;
  branding: BrandingData;
}

export interface MediaUploadResponse {
  message: string;
  logo_url?: string;
  favicon_url?: string;
  og_image_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BrandingService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly baseUrl = `${environment.apiUrl}/partner/branding`;

  /** Reaktív branding state - az egész app-ból olvasható */
  readonly brandName = signal<string | null>(null);
  readonly logoUrl = signal<string | null>(null);
  readonly faviconUrl = signal<string | null>(null);
  readonly hideBrandName = signal(false);

  constructor() {
    // Favicon dinamikus frissítése, ha változik
    effect(() => {
      const url = this.faviconUrl();
      this.updateFavicon(url);
    });
  }

  /** Frissíti a branding state-et a kapott adatokból */
  updateState(branding: BrandingData | null): void {
    this.brandName.set(branding?.brand_name ?? null);
    this.logoUrl.set(branding?.logo_url ?? null);
    this.faviconUrl.set(branding?.favicon_url ?? null);
    this.hideBrandName.set(branding?.hide_brand_name ?? false);
  }

  private updateFavicon(url: string | null): void {
    const head = this.document.head;
    // Csak a dinamikusan hozzáadott favicon-t kezeljük
    let dynamicLink = head.querySelector('link[data-dynamic-favicon]') as HTMLLinkElement | null;

    if (url) {
      if (!dynamicLink) {
        dynamicLink = this.document.createElement('link');
        dynamicLink.setAttribute('data-dynamic-favicon', '');
        dynamicLink.rel = 'icon';
        dynamicLink.type = 'image/png';
        head.appendChild(dynamicLink);
      }
      dynamicLink.href = url;
      // Statikus favicon-ok elrejtése
      head.querySelectorAll('link[rel*="icon"]:not([data-dynamic-favicon])').forEach(el => {
        (el as HTMLLinkElement).setAttribute('data-original-href', (el as HTMLLinkElement).href);
        (el as HTMLLinkElement).removeAttribute('href');
      });
    } else {
      // Visszaállítás az eredeti favicon-okra
      if (dynamicLink) {
        dynamicLink.remove();
      }
      head.querySelectorAll('link[rel*="icon"][data-original-href]').forEach(el => {
        (el as HTMLLinkElement).href = (el as HTMLLinkElement).getAttribute('data-original-href')!;
        (el as HTMLLinkElement).removeAttribute('data-original-href');
      });
    }
  }

  getBranding(): Observable<BrandingResponse> {
    return this.http.get<BrandingResponse>(this.baseUrl);
  }

  updateBranding(data: { brand_name: string | null; is_active: boolean; hide_brand_name: boolean }): Observable<BrandingUpdateResponse> {
    return this.http.post<BrandingUpdateResponse>(this.baseUrl, data);
  }

  uploadLogo(file: File): Observable<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<MediaUploadResponse>(`${this.baseUrl}/logo`, formData);
  }

  uploadFavicon(file: File): Observable<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('favicon', file);
    return this.http.post<MediaUploadResponse>(`${this.baseUrl}/favicon`, formData);
  }

  uploadOgImage(file: File): Observable<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('og_image', file);
    return this.http.post<MediaUploadResponse>(`${this.baseUrl}/og-image`, formData);
  }

  deleteLogo(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/logo`);
  }

  deleteFavicon(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/favicon`);
  }

  deleteOgImage(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/og-image`);
  }
}
