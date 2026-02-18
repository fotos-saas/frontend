import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
import type { ExtendedPaginatedResponse } from '../../../core/models/api.models';

/**
 * Dashboard statisztikák
 */
export interface DashboardStats {
  totalProjects: number;
  activeQrCodes: number;
  totalSchools: number;
  projectsByStatus: Record<string, number>;
}

/**
 * Kapcsolattartó interface
 */
export interface ProjectContact {
  id?: number;
  name: string;
  email: string | null;
  phone: string | null;
  isPrimary?: boolean;
}

/**
 * Tablo Status interface
 */
export interface TabloStatus {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
}

/**
 * QR kód interface (shared)
 */
export type { QrCode } from '../../../shared/interfaces/qr-code.interface';
import type { QrCode } from '../../../shared/interfaces/qr-code.interface';

/**
 * QR kód előzmény (rövid)
 */
export interface QrCodeHistory {
  id: number;
  code: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

/**
 * Projekt lista elem
 */
export interface ProjectListItem {
  id: number;
  name: string;
  schoolName: string | null;
  schoolCity: string | null;
  className: string | null;
  classYear: string | null;
  status: string | null;
  statusLabel: string;
  tabloStatus: TabloStatus | null;
  photoDate: string | null;
  deadline: string | null;
  contact: ProjectContact | null;
  hasActiveQrCode: boolean;
  qrCodeId: number | null;
  createdAt: string;
}

/**
 * Projekt részletek
 */
export interface ProjectDetails extends ProjectListItem {
  school: {
    id: number;
    name: string;
    city: string | null;
  } | null;
  partner: {
    id: number;
    name: string;
  } | null;
  expectedClassSize: number | null;
  contacts: ProjectContact[];
  qrCode: QrCode | null;
  activeQrCodes: Array<{ id: number; code: string; type: string; typeLabel: string; usageCount: number; isValid: boolean; registrationUrl: string }>;
  qrCodesHistory: QrCodeHistory[];
  personsCount?: number;
  studentsCount?: number;
  teachersCount?: number;
  studentsWithPhotoCount?: number;
  teachersWithPhotoCount?: number;
  personsPreview?: Array<{
    id: number;
    name: string;
    type: 'student' | 'teacher';
    hasPhoto: boolean;
    photoThumbUrl: string | null;
  }>;
  updatedAt: string;
}

/**
 * Iskola lista elem
 */
export interface SchoolListItem {
  id: number;
  name: string;
  city: string | null;
  projectsCount: number;
}

/**
 * Marketer-specifikus pagináció response (alias a központi ExtendedPaginatedResponse-ra)
 */
export type MarketerPaginatedResponse<T> = ExtendedPaginatedResponse<T>;

/**
 * Export alias - komponensek backward compatibility-hez
 */
export type PaginatedResponse<T> = ExtendedPaginatedResponse<T>;

/**
 * Marketer API Service
 * API hívások a marketinges/ügyintéző felülethez.
 */
@Injectable({
  providedIn: 'root'
})
export class MarketerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/marketer`;

  /**
   * Dashboard statisztikák lekérése
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Projektek listázása (paginált)
   */
  getProjects(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: 'created_at' | 'photo_date' | 'class_year';
    sort_dir?: 'asc' | 'desc';
    status?: string;
  }): Observable<PaginatedResponse<ProjectListItem>> {
    const httpParams = buildHttpParams({
      page: params?.page,
      per_page: params?.per_page,
      search: params?.search,
      sort_by: params?.sort_by,
      sort_dir: params?.sort_dir,
      status: params?.status,
    });

    return this.http.get<PaginatedResponse<ProjectListItem>>(`${this.baseUrl}/projects`, { params: httpParams });
  }

  /**
   * Projekt részletek lekérése
   */
  getProjectDetails(id: number): Observable<ProjectDetails> {
    return this.http.get<ProjectDetails>(`${this.baseUrl}/projects/${id}`);
  }

  /**
   * Projekt QR kódok lekérése
   */
  getProjectQrCodes(projectId: number): Observable<{ qrCodes: QrCode[] }> {
    return this.http.get<{ qrCodes: QrCode[] }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes`
    );
  }

  /**
   * Új QR kód generálása - Marketer MINDIG coordinator típust kap
   */
  generateQrCode(projectId: number, options: {
    type: string;
    expires_at?: string;
    max_usages?: number | null;
  }): Observable<{ success: boolean; message: string; qrCode: QrCode }> {
    return this.http.post<{ success: boolean; message: string; qrCode: QrCode }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes`,
      { ...options, type: 'coordinator' }
    );
  }

  /**
   * QR kód inaktiválása
   */
  deactivateQrCode(projectId: number, codeId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes/${codeId}`
    );
  }

  /**
   * QR kód rögzítése (pin)
   */
  pinQrCode(projectId: number, codeId: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes/${codeId}/pin`,
      {}
    );
  }

  /**
   * Iskolák listázása (paginált)
   */
  getSchools(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    city?: string;
  }): Observable<PaginatedResponse<SchoolListItem>> {
    const httpParams = buildHttpParams({
      page: params?.page,
      per_page: params?.per_page,
      search: params?.search,
      city: params?.city,
    });

    return this.http.get<PaginatedResponse<SchoolListItem>>(`${this.baseUrl}/schools`, { params: httpParams });
  }

  /**
   * Városok listájának lekérése (szűréshez)
   */
  getCities(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/schools/cities`);
  }

  // ============================================
  // CONTACT MANAGEMENT
  // ============================================

  /**
   * Kapcsolattartó hozzáadása projekthez
   */
  addContact(projectId: number, contact: {
    name: string;
    email?: string | null;
    phone?: string | null;
    isPrimary?: boolean;
  }): Observable<{ success: boolean; message: string; data: ProjectContact }> {
    return this.http.post<{ success: boolean; message: string; data: ProjectContact }>(
      `${this.baseUrl}/projects/${projectId}/contacts`,
      contact
    );
  }

  /**
   * Kapcsolattartó módosítása
   */
  updateContact(projectId: number, contactId: number, contact: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    isPrimary?: boolean;
  }): Observable<{ success: boolean; message: string; data: ProjectContact }> {
    return this.http.put<{ success: boolean; message: string; data: ProjectContact }>(
      `${this.baseUrl}/projects/${projectId}/contacts/${contactId}`,
      contact
    );
  }

  /**
   * Kapcsolattartó törlése
   */
  deleteContact(projectId: number, contactId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/contacts/${contactId}`
    );
  }

  // ============================================
  // PROJECT CREATION
  // ============================================

  /**
   * Összes iskola lekérése (projekt létrehozáshoz)
   * Visszaadja az összes iskolát, nem csak azokat ahol van projekt.
   */
  getAllSchools(search?: string): Observable<Array<{ id: number; name: string; city: string | null }>> {
    const httpParams = buildHttpParams({ search });
    return this.http.get<Array<{ id: number; name: string; city: string | null }>>(
      `${this.baseUrl}/schools/all`,
      { params: httpParams }
    );
  }

  /**
   * Új projekt létrehozása
   */
  createProject(data: {
    school_id?: number | null;
    class_name?: string | null;
    class_year?: string | null;
  }): Observable<{ success: boolean; message: string; data: ProjectListItem }> {
    return this.http.post<{ success: boolean; message: string; data: ProjectListItem }>(
      `${this.baseUrl}/projects`,
      data
    );
  }
}
