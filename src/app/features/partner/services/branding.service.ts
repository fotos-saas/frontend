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

export interface BrandingSavePayload {
  brand_name: string | null;
  is_active: boolean;
  hide_brand_name: boolean;
  logo?: File;
  favicon?: File;
  og_image?: File;
  delete_logo?: boolean;
  delete_favicon?: boolean;
  delete_og_image?: boolean;
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

  /**
   * Egységes mentés: alap adatok + opcionális média feltöltés/törlés.
   * Egy request-ben kezeli a szöveges mezőket, fájl feltöltéseket és törléseket.
   */
  saveBranding(payload: BrandingSavePayload): Observable<BrandingUpdateResponse> {
    const formData = new FormData();
    formData.append('brand_name', payload.brand_name ?? '');
    formData.append('is_active', payload.is_active ? '1' : '0');
    formData.append('hide_brand_name', payload.hide_brand_name ? '1' : '0');

    if (payload.logo) {
      formData.append('logo', payload.logo);
    }
    if (payload.favicon) {
      formData.append('favicon', payload.favicon);
    }
    if (payload.og_image) {
      formData.append('og_image', payload.og_image);
    }
    if (payload.delete_logo) {
      formData.append('delete_logo', '1');
    }
    if (payload.delete_favicon) {
      formData.append('delete_favicon', '1');
    }
    if (payload.delete_og_image) {
      formData.append('delete_og_image', '1');
    }

    return this.http.post<BrandingUpdateResponse>(this.baseUrl, formData);
  }
}
