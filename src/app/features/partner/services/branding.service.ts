import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BrandingData {
  brand_name: string | null;
  is_active: boolean;
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
  private readonly baseUrl = `${environment.apiUrl}/partner/branding`;

  getBranding(): Observable<BrandingResponse> {
    return this.http.get<BrandingResponse>(this.baseUrl);
  }

  updateBranding(data: { brand_name: string | null; is_active: boolean }): Observable<BrandingUpdateResponse> {
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
