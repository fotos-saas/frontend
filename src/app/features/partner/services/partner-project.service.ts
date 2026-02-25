import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
import {
  PartnerDashboardStats,
  PartnerProjectListItem,
  PartnerProjectDetails,
  CreateProjectRequest,
  ProjectListResponse,
  ProjectAutocompleteItem,
  SampleItem,
  TabloPersonItem,
  TabloSize,
  TabloSizeThreshold,
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
    sort_by?: 'created_at' | 'photo_date' | 'class_year' | 'school_name' | 'tablo_status' | 'missing_count' | 'samples_count' | 'order_submitted_at';
    sort_dir?: 'asc' | 'desc';
    status?: string;
    is_aware?: boolean;
    has_draft?: boolean;
    school_id?: number;
    graduation_year?: number;
    is_preliminary?: string;
    photos_uploaded?: string;
    tag_ids?: string;
  }): Observable<ProjectListResponse> {
    const httpParams = buildHttpParams({
      page: params?.page,
      per_page: params?.per_page,
      search: params?.search,
      sort_by: params?.sort_by,
      sort_dir: params?.sort_dir,
      status: params?.status,
      is_aware: params?.is_aware,
      has_draft: params?.has_draft,
      school_id: params?.school_id,
      graduation_year: params?.graduation_year,
      is_preliminary: params?.is_preliminary,
      photos_uploaded: params?.photos_uploaded,
      tag_ids: params?.tag_ids,
    });

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
  updateProject(projectId: number, data: Partial<CreateProjectRequest> & { status?: string }): Observable<{
    success: boolean;
    message: string;
    data?: { status: string; statusLabel: string; statusColor: string };
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data?: { status: string; statusLabel: string; statusColor: string };
    }>(
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
   * Feltöltve státusz toggle
   */
  togglePhotosUploaded(projectId: number): Observable<{
    success: boolean;
    message: string;
    photosUploaded: boolean;
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      photosUploaded: boolean;
    }>(`${this.baseUrl}/projects/${projectId}/toggle-photos-uploaded`, {});
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
  getProjectPersons(projectId: number, withoutPhoto?: boolean): Observable<{
    data: TabloPersonItem[];
    extraNames: { students: string; teachers: string };
  }> {
    const httpParams = buildHttpParams({
      without_photo: withoutPhoto || undefined,
    });
    return this.http.get<{
      data: TabloPersonItem[];
      extraNames: { students: string; teachers: string };
    }>(
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

  /**
   * Személy adatainak módosítása (név, pozíció/tantárgy)
   */
  updatePerson(projectId: number, personId: number, data: { name?: string; title?: string | null; note?: string | null }): Observable<{
    success: boolean;
    message: string;
    data: { id: number; name: string; title: string | null; note: string | null };
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      data: { id: number; name: string; title: string | null; note: string | null };
    }>(`${this.baseUrl}/projects/${projectId}/persons/${personId}`, data);
  }

  /**
   * Személy törlése a projektből
   */
  deletePerson(projectId: number, personId: number): Observable<{
    success: boolean;
    message: string;
    data: { id: number };
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
      data: { id: number };
    }>(`${this.baseUrl}/projects/${projectId}/persons/${personId}`);
  }

  /**
   * Override: projekt-specifikus fotó beállítása
   */
  overridePersonPhoto(projectId: number, personId: number, photoId: number): Observable<{
    success: boolean;
    message: string;
    data: { id: number; hasPhoto: boolean; photoThumbUrl: string | null; photoUrl: string | null; hasOverride: boolean };
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      data: { id: number; hasPhoto: boolean; photoThumbUrl: string | null; photoUrl: string | null; hasOverride: boolean };
    }>(`${this.baseUrl}/projects/${projectId}/persons/${personId}/override-photo`, { photo_id: photoId });
  }

  /**
   * Extra nevek frissítése (tanítottak még / egyéb nevek)
   */
  updateExtraNames(projectId: number, data: { students: string; teachers: string }): Observable<{
    success: boolean;
    message: string;
    data: { extraNames: { students: string; teachers: string } };
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      data: { extraNames: { students: string; teachers: string } };
    }>(`${this.baseUrl}/projects/${projectId}/extra-names`, data);
  }

  /**
   * Override visszaállítása (archive default fotó)
   */
  resetPersonPhoto(projectId: number, personId: number): Observable<{
    success: boolean;
    message: string;
    data: { id: number; hasPhoto: boolean; photoThumbUrl: string | null; photoUrl: string | null; hasOverride: boolean };
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      data: { id: number; hasPhoto: boolean; photoThumbUrl: string | null; photoUrl: string | null; hasOverride: boolean };
    }>(`${this.baseUrl}/projects/${projectId}/persons/${personId}/override-photo`, { photo_id: null });
  }

  /**
   * Személyek hozzáadása névlista alapján
   */
  addPersons(projectId: number, names: string, type: 'student' | 'teacher'): Observable<{
    success: boolean;
    message: string;
    data: {
      created: Array<{ id: number; name: string; type: string; archiveLinked: boolean; hasPhoto: boolean }>;
      duplicates: string[];
      archiveMatches: number;
    };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: {
        created: Array<{ id: number; name: string; type: string; archiveLinked: boolean; hasPhoto: boolean }>;
        duplicates: string[];
        archiveMatches: number;
      };
    }>(`${this.baseUrl}/projects/${projectId}/persons/add`, { names, type });
  }

  // ============================================
  // AUTOCOMPLETE
  // ============================================

  /**
   * Projektek lekérése autocomplete-hez (kapcsolattartó modalhoz)
   */
  getProjectsAutocomplete(search?: string): Observable<ProjectAutocompleteItem[]> {
    const httpParams = buildHttpParams({ search });
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
  // TABLO SIZES
  // ============================================

  /**
   * Elérhető tablóméretek lekérése
   */
  getTabloSizes(): Observable<{
    sizes: TabloSize[];
    defaults: TabloSize[];
    isDefault: boolean;
    threshold: TabloSizeThreshold | null;
  }> {
    return this.http.get<{
      sizes: TabloSize[];
      defaults: TabloSize[];
      isDefault: boolean;
      threshold: TabloSizeThreshold | null;
    }>(`${this.baseUrl}/tablo-sizes`);
  }

  /**
   * Elérhető tablóméretek mentése (méretekkel és küszöbértékkel)
   */
  updateTabloSizes(data: {
    sizes: TabloSize[];
    threshold?: number | null;
    size_below_threshold?: string | null;
    size_above_threshold?: string | null;
  }): Observable<{
    success: boolean;
    message: string;
    data: { sizes: TabloSize[]; isDefault: boolean; threshold: TabloSizeThreshold | null };
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: { sizes: TabloSize[]; isDefault: boolean; threshold: TabloSizeThreshold | null };
    }>(`${this.baseUrl}/tablo-sizes`, data);
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
