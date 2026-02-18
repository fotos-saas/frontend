import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
import {
  GuestSession,
  PaginatedResponse,
  SamplePackage,
  SampleVersion,
} from '../models/partner.models';

/**
 * Guest session & minta csomag kezelés service.
 * Vendég felhasználók, minta csomagok/verziók CRUD.
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerGuestService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  // ============================================
  // GUEST SESSIONS
  // ============================================

  /**
   * Projekt vendég session-ök lekérése
   */
  getProjectGuestSessions(projectId: number, params?: {
    search?: string;
    filter?: string;
    page?: number;
    per_page?: number;
  }): Observable<PaginatedResponse<GuestSession>> {
    const httpParams = buildHttpParams({
      search: params?.search,
      filter: params?.filter,
      page: params?.page,
      per_page: params?.per_page,
    });

    return this.http.get<PaginatedResponse<GuestSession>>(
      `${this.baseUrl}/projects/${projectId}/guest-sessions`,
      { params: httpParams },
    );
  }

  /**
   * Vendég session módosítása
   */
  updateGuestSession(projectId: number, sessionId: number, data: {
    guest_name?: string;
    guest_email?: string | null;
  }): Observable<{ success: boolean; message: string; data: Partial<GuestSession> }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: Partial<GuestSession>;
    }>(`${this.baseUrl}/projects/${projectId}/guest-sessions/${sessionId}`, data);
  }

  /**
   * Vendég session törlése
   */
  deleteGuestSession(projectId: number, sessionId: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/guest-sessions/${sessionId}`,
    );
  }

  /**
   * Vendég session tiltás toggle
   */
  toggleBanGuestSession(projectId: number, sessionId: number): Observable<{
    success: boolean;
    message: string;
    isBanned: boolean;
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      isBanned: boolean;
    }>(`${this.baseUrl}/projects/${projectId}/guest-sessions/${sessionId}/ban`, {});
  }

  // ============================================
  // SAMPLE PACKAGES
  // ============================================

  /**
   * Minta csomagok lekérése
   */
  getSamplePackages(projectId: number): Observable<{ data: SamplePackage[] }> {
    return this.http.get<{ data: SamplePackage[] }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages`,
    );
  }

  /**
   * Minta csomag létrehozása
   */
  createSamplePackage(projectId: number, title: string): Observable<{
    success: boolean;
    message: string;
    data: SamplePackage;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: SamplePackage;
    }>(`${this.baseUrl}/projects/${projectId}/sample-packages`, { title });
  }

  /**
   * Minta csomag módosítása
   */
  updateSamplePackage(projectId: number, packageId: number, title: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages/${packageId}`,
      { title },
    );
  }

  /**
   * Minta csomag törlése
   */
  deleteSamplePackage(projectId: number, packageId: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages/${packageId}`,
    );
  }

  /**
   * Minta verzió hozzáadása
   */
  addSampleVersion(projectId: number, packageId: number, formData: FormData): Observable<{
    success: boolean;
    message: string;
    data: SampleVersion;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: SampleVersion;
    }>(`${this.baseUrl}/projects/${projectId}/sample-packages/${packageId}/versions`, formData);
  }

  /**
   * Minta verzió módosítása
   */
  updateSampleVersion(
    projectId: number,
    packageId: number,
    versionId: number,
    formData: FormData,
  ): Observable<{ success: boolean; message: string; data: SampleVersion }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: SampleVersion;
    }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages/${packageId}/versions/${versionId}`,
      formData,
    );
  }

  /**
   * Minta verzió törlése
   */
  deleteSampleVersion(
    projectId: number,
    packageId: number,
    versionId: number,
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages/${packageId}/versions/${versionId}`,
    );
  }
}
