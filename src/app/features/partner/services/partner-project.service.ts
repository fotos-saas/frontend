import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PartnerDashboardStats,
  PartnerProjectListItem,
  PartnerProjectDetails,
  CreateProjectRequest,
  ProjectListResponse,
  ProjectAutocompleteItem,
  SampleItem,
  TabloPersonItem,
} from '../models/partner.models';

/**
 * Projekt kezelés service.
 * CRUD, settings, order data, dashboard statisztikák.
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerProjectService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  // ============================================
  // DASHBOARD
  // ============================================

  /**
   * Dashboard statisztikák lekérése
   */
  getStats(): Observable<PartnerDashboardStats> {
    return this.http.get<PartnerDashboardStats>(`${this.baseUrl}/stats`);
  }

  // ============================================
  // PROJECTS CRUD
  // ============================================

  /**
   * Projektek listázása (paginált, limitekkel)
   */
  getProjects(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: 'created_at' | 'photo_date' | 'class_year' | 'school_name' | 'tablo_status' | 'missing_count' | 'samples_count';
    sort_dir?: 'asc' | 'desc';
    status?: string;
    is_aware?: boolean;
    has_draft?: boolean;
    school_id?: number;
  }): Observable<ProjectListResponse> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params?.sort_dir) httpParams = httpParams.set('sort_dir', params.sort_dir);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.is_aware !== undefined) httpParams = httpParams.set('is_aware', params.is_aware.toString());
    if (params?.has_draft !== undefined) httpParams = httpParams.set('has_draft', params.has_draft.toString());
    if (params?.school_id) httpParams = httpParams.set('school_id', params.school_id.toString());

    return this.http.get<ProjectListResponse>(`${this.baseUrl}/projects`, { params: httpParams });
  }

  /**
   * Projekt részletek lekérése
   */
  getProjectDetails(id: number): Observable<PartnerProjectDetails> {
    return this.http.get<PartnerProjectDetails>(`${this.baseUrl}/projects/${id}`);
  }

  /**
   * Új projekt létrehozása
   */
  createProject(data: CreateProjectRequest): Observable<{
    success: boolean;
    message: string;
    data: PartnerProjectListItem;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: PartnerProjectListItem;
    }>(`${this.baseUrl}/projects`, data);
  }

  /**
   * Projekt módosítása
   */
  updateProject(projectId: number, data: Partial<CreateProjectRequest>): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}`,
      data,
    );
  }

  /**
   * Projekt törlése
   */
  deleteProject(projectId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}`,
    );
  }

  /**
   * Tudnak róla státusz toggle
   */
  toggleProjectAware(projectId: number): Observable<{
    success: boolean;
    message: string;
    isAware: boolean;
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      isAware: boolean;
    }>(`${this.baseUrl}/projects/${projectId}/toggle-aware`, {});
  }

  // ============================================
  // SAMPLES & PERSONS
  // ============================================

  /**
   * Projekt minták lekérése
   */
  getProjectSamples(projectId: number): Observable<{ data: SampleItem[] }> {
    return this.http.get<{ data: SampleItem[] }>(
      `${this.baseUrl}/projects/${projectId}/samples`,
    );
  }

  /**
   * Projekt személyeinek lekérése
   */
  getProjectPersons(projectId: number, withoutPhoto?: boolean): Observable<{ data: TabloPersonItem[] }> {
    let httpParams = new HttpParams();
    if (withoutPhoto) {
      httpParams = httpParams.set('without_photo', 'true');
    }
    return this.http.get<{ data: TabloPersonItem[] }>(
      `${this.baseUrl}/projects/${projectId}/persons`,
      { params: httpParams },
    );
  }

  /**
   * @deprecated Use getProjectPersons instead
   */
  getProjectMissingPersons(projectId: number, withoutPhoto?: boolean): Observable<{ data: TabloPersonItem[] }> {
    return this.getProjectPersons(projectId, withoutPhoto);
  }

  // ============================================
  // AUTOCOMPLETE
  // ============================================

  /**
   * Projektek lekérése autocomplete-hez (kapcsolattartó modalhoz)
   */
  getProjectsAutocomplete(search?: string): Observable<ProjectAutocompleteItem[]> {
    let httpParams = new HttpParams();
    if (search) {
      httpParams = httpParams.set('search', search);
    }
    return this.http.get<ProjectAutocompleteItem[]>(
      `${this.baseUrl}/projects/autocomplete`,
      { params: httpParams },
    );
  }

  // ============================================
  // ORDER DATA
  // ============================================

  /**
   * Megrendelési adatok lekérése projekthez (partner view)
   */
  getProjectOrderData(projectId: number): Observable<{
    success: boolean;
    data: unknown;
    message?: string;
  }> {
    return this.http.get<{ success: boolean; data: unknown; message?: string }>(
      `${this.baseUrl}/projects/${projectId}/order-data`,
    );
  }

  /**
   * Megrendelési adatlap PDF generálása (partner view)
   */
  viewProjectOrderPdf(projectId: number): Observable<{
    success: boolean;
    pdfUrl?: string;
    message?: string;
  }> {
    return this.http.post<{
      success: boolean;
      pdfUrl?: string;
      message?: string;
    }>(`${this.baseUrl}/projects/${projectId}/order-data/view-pdf`, {});
  }

  // ============================================
  // SETTINGS
  // ============================================

  /**
   * Projekt beállítások lekérése
   */
  getProjectSettings(projectId: number): Observable<{
    data: {
      max_retouch_photos: number | null;
      effective_max_retouch_photos: number;
      global_default_max_retouch_photos: number;
      free_edit_window_hours: number | null;
      effective_free_edit_window_hours: number;
      global_default_free_edit_window_hours: number;
      export_zip_content: string | null;
      export_file_naming: string | null;
      export_always_ask: boolean | null;
      effective_export: { zip_content: string; file_naming: string; always_ask: boolean };
      global_default_zip_content: string;
      global_default_file_naming: string;
      global_export_always_ask: boolean;
    };
  }> {
    return this.http.get<{
      data: {
        max_retouch_photos: number | null;
        effective_max_retouch_photos: number;
        global_default_max_retouch_photos: number;
        free_edit_window_hours: number | null;
        effective_free_edit_window_hours: number;
        global_default_free_edit_window_hours: number;
        export_zip_content: string | null;
        export_file_naming: string | null;
        export_always_ask: boolean | null;
        effective_export: { zip_content: string; file_naming: string; always_ask: boolean };
        global_default_zip_content: string;
        global_default_file_naming: string;
        global_export_always_ask: boolean;
      };
    }>(`${this.baseUrl}/projects/${projectId}/settings`);
  }

  /**
   * Projekt beállítások módosítása
   */
  updateProjectSettings(projectId: number, data: {
    max_retouch_photos: number | null;
    free_edit_window_hours?: number | null;
    export_zip_content?: string | null;
    export_file_naming?: string | null;
    export_always_ask?: boolean | null;
  }): Observable<{
    success: boolean;
    message: string;
    data: {
      max_retouch_photos: number | null;
      effective_max_retouch_photos: number;
      free_edit_window_hours: number | null;
      effective_free_edit_window_hours: number;
      effective_export: { zip_content: string; file_naming: string; always_ask: boolean };
    };
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: {
        max_retouch_photos: number | null;
        effective_max_retouch_photos: number;
        free_edit_window_hours: number | null;
        effective_free_edit_window_hours: number;
        effective_export: { zip_content: string; file_naming: string; always_ask: boolean };
      };
    }>(`${this.baseUrl}/projects/${projectId}/settings`, data);
  }

  /**
   * Globális beállítások lekérése
   */
  getGlobalSettings(): Observable<{
    data: {
      default_max_retouch_photos: number;
      default_free_edit_window_hours: number;
      billing_enabled: boolean;
      default_zip_content: string;
      default_file_naming: string;
      export_always_ask: boolean;
    };
  }> {
    return this.http.get<{
      data: {
        default_max_retouch_photos: number;
        default_free_edit_window_hours: number;
        billing_enabled: boolean;
        default_zip_content: string;
        default_file_naming: string;
        export_always_ask: boolean;
      };
    }>(`${this.baseUrl}/settings`);
  }

  /**
   * Globális beállítások módosítása
   */
  updateGlobalSettings(data: {
    default_max_retouch_photos: number | null;
    default_free_edit_window_hours?: number | null;
    billing_enabled?: boolean;
    default_zip_content?: string;
    default_file_naming?: string;
    export_always_ask?: boolean;
  }): Observable<{
    success: boolean;
    message: string;
    data: {
      default_max_retouch_photos: number;
      default_free_edit_window_hours: number;
      billing_enabled: boolean;
      default_zip_content: string;
      default_file_naming: string;
      export_always_ask: boolean;
    };
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: {
        default_max_retouch_photos: number;
        default_free_edit_window_hours: number;
        billing_enabled: boolean;
        default_zip_content: string;
        default_file_naming: string;
        export_always_ask: boolean;
      };
    }>(`${this.baseUrl}/settings`, data);
  }
}
