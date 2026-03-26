import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
import { SendToPrintPayload, RequestReprintPayload, PrintShopMessage } from '@core/models/print-order.models';
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

@Injectable({ providedIn: 'root' })
export class PartnerProjectService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  getStats(): Observable<PartnerDashboardStats> {
    return this.http.get<PartnerDashboardStats>(`${this.baseUrl}/stats`);
  }

  getProjects(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: 'created_at' | 'photo_date' | 'class_year' | 'school_name' | 'tablo_status' | 'missing_count' | 'samples_count' | 'order_submitted_at' | 'last_content_update' | 'last_activity_at';
    sort_dir?: 'asc' | 'desc';
    status?: string;
    is_aware?: boolean;
    has_draft?: boolean;
    school_id?: number;
    graduation_year?: number;
    is_preliminary?: string;
    photos_uploaded?: string;
    tag_ids?: string;
    project_ids?: string;
    exclude_statuses?: string;
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
      project_ids: params?.project_ids,
      exclude_statuses: params?.exclude_statuses,
    });
    return this.http.get<ProjectListResponse>(`${this.baseUrl}/projects`, { params: httpParams });
  }

  getProjectDetails(id: number): Observable<PartnerProjectDetails> {
    return this.http.get<PartnerProjectDetails>(`${this.baseUrl}/projects/${id}`);
  }

  checkPhotoChanges(projectId: number, placedPhotos: Record<string, number>): Observable<{
    changed: Array<{ personId: number; personName: string; type: string; newPhotoUrl: string }>;
    unchanged: number;
    notFound: number;
    newPhotos: Array<{ personId: number; personName: string; type: string; newPhotoUrl: string }>;
  }> {
    return this.http.post<{
      changed: Array<{ personId: number; personName: string; type: string; newPhotoUrl: string }>;
      unchanged: number;
      notFound: number;
      newPhotos: Array<{ personId: number; personName: string; type: string; newPhotoUrl: string }>;
    }>(`${this.baseUrl}/projects/${projectId}/check-photo-changes`, { placedPhotos });
  }

  batchCheckPhotoChanges(items: Array<{ projectId: number; placedPhotos: Record<string, number> }>): Observable<{
    data: { modifiedProjectIds: number[]; checkedCount: number };
  }> {
    return this.http.post<{
      data: { modifiedProjectIds: number[]; checkedCount: number };
    }>(`${this.baseUrl}/projects/batch-check-photo-changes`, { items });
  }

  createProject(data: CreateProjectRequest): Observable<{
    success: boolean; message: string; data: PartnerProjectListItem;
  }> {
    return this.http.post<{
      success: boolean; message: string; data: PartnerProjectListItem;
    }>(`${this.baseUrl}/projects`, data);
  }

  updateProject(projectId: number, data: Partial<CreateProjectRequest> & { status?: string }): Observable<{
    success: boolean; message: string;
    data?: { status: string; statusLabel: string; statusColor: string };
  }> {
    return this.http.put<{
      success: boolean; message: string;
      data?: { status: string; statusLabel: string; statusColor: string };
    }>(`${this.baseUrl}/projects/${projectId}`, data);
  }

  deleteProject(projectId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/projects/${projectId}`);
  }

  togglePhotosUploaded(projectId: number): Observable<{
    success: boolean; message: string; photosUploaded: boolean;
  }> {
    return this.http.patch<{
      success: boolean; message: string; photosUploaded: boolean;
    }>(`${this.baseUrl}/projects/${projectId}/toggle-photos-uploaded`, {});
  }

  toggleProjectAware(projectId: number): Observable<{
    success: boolean; message: string; isAware: boolean;
  }> {
    return this.http.patch<{
      success: boolean; message: string; isAware: boolean;
    }>(`${this.baseUrl}/projects/${projectId}/toggle-aware`, {});
  }

  getProjectSamples(projectId: number): Observable<{ data: SampleItem[] }> {
    return this.http.get<{ data: SampleItem[] }>(`${this.baseUrl}/projects/${projectId}/samples`);
  }

  getProjectPersons(projectId: number, withoutPhoto?: boolean): Observable<{
    data: TabloPersonItem[];
    extraNames: { students: string; teachers: string };
  }> {
    const httpParams = buildHttpParams({ without_photo: withoutPhoto || undefined });
    return this.http.get<{
      data: TabloPersonItem[];
      extraNames: { students: string; teachers: string };
    }>(`${this.baseUrl}/projects/${projectId}/persons`, { params: httpParams });
  }

  /** @deprecated Use getProjectPersons instead */
  getProjectMissingPersons(projectId: number, withoutPhoto?: boolean): Observable<{ data: TabloPersonItem[] }> {
    return this.getProjectPersons(projectId, withoutPhoto);
  }

  getProjectsAutocomplete(search?: string): Observable<ProjectAutocompleteItem[]> {
    const httpParams = buildHttpParams({ search });
    return this.http.get<ProjectAutocompleteItem[]>(`${this.baseUrl}/projects/autocomplete`, { params: httpParams });
  }

  getProjectOrderData(projectId: number): Observable<{ success: boolean; data: unknown; message?: string }> {
    return this.http.get<{ success: boolean; data: unknown; message?: string }>(`${this.baseUrl}/projects/${projectId}/order-data`);
  }

  viewProjectOrderPdf(projectId: number): Observable<{ success: boolean; pdfUrl?: string; message?: string }> {
    return this.http.post<{ success: boolean; pdfUrl?: string; message?: string }>(
      `${this.baseUrl}/projects/${projectId}/order-data/view-pdf`, {},
    );
  }

  getTabloSizes(): Observable<{
    sizes: TabloSize[]; defaults: TabloSize[]; isDefault: boolean; threshold: TabloSizeThreshold | null;
  }> {
    return this.http.get<{
      sizes: TabloSize[]; defaults: TabloSize[]; isDefault: boolean; threshold: TabloSizeThreshold | null;
    }>(`${this.baseUrl}/tablo-sizes`);
  }

  updateTabloSizes(data: {
    sizes: TabloSize[];
    threshold?: number | null;
    size_below_threshold?: string | null;
    size_above_threshold?: string | null;
  }): Observable<{
    success: boolean; message: string;
    data: { sizes: TabloSize[]; isDefault: boolean; threshold: TabloSizeThreshold | null };
  }> {
    return this.http.put<{
      success: boolean; message: string;
      data: { sizes: TabloSize[]; isDefault: boolean; threshold: TabloSizeThreshold | null };
    }>(`${this.baseUrl}/tablo-sizes`, data);
  }

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

  updateProjectSettings(projectId: number, data: {
    max_retouch_photos: number | null;
    free_edit_window_hours?: number | null;
    export_zip_content?: string | null;
    export_file_naming?: string | null;
    export_always_ask?: boolean | null;
  }): Observable<{
    success: boolean; message: string;
    data: {
      max_retouch_photos: number | null;
      effective_max_retouch_photos: number;
      free_edit_window_hours: number | null;
      effective_free_edit_window_hours: number;
      effective_export: { zip_content: string; file_naming: string; always_ask: boolean };
    };
  }> {
    return this.http.put<{
      success: boolean; message: string;
      data: {
        max_retouch_photos: number | null;
        effective_max_retouch_photos: number;
        free_edit_window_hours: number | null;
        effective_free_edit_window_hours: number;
        effective_export: { zip_content: string; file_naming: string; always_ask: boolean };
      };
    }>(`${this.baseUrl}/projects/${projectId}/settings`, data);
  }

  getSampleSettings(projectId: number): Observable<{
    data: {
      sample_use_large_size: boolean | null;
      sample_watermark_color: 'white' | 'black' | null;
      sample_watermark_opacity: number | null;
    };
  }> {
    return this.http.get<{
      data: {
        sample_use_large_size: boolean | null;
        sample_watermark_color: 'white' | 'black' | null;
        sample_watermark_opacity: number | null;
      };
    }>(`${this.baseUrl}/projects/${projectId}/sample-settings`);
  }

  updateSampleSettings(projectId: number, data: {
    sample_use_large_size?: boolean | null;
    sample_watermark_color?: 'white' | 'black' | null;
    sample_watermark_opacity?: number | null;
  }): Observable<{
    success: boolean;
    data: {
      sample_use_large_size: boolean | null;
      sample_watermark_color: 'white' | 'black' | null;
      sample_watermark_opacity: number | null;
    };
  }> {
    return this.http.put<{
      success: boolean;
      data: {
        sample_use_large_size: boolean | null;
        sample_watermark_color: 'white' | 'black' | null;
        sample_watermark_opacity: number | null;
      };
    }>(`${this.baseUrl}/projects/${projectId}/sample-settings`, data);
  }

  getGlobalSettings(): Observable<{
    data: {
      default_max_retouch_photos: number;
      default_free_edit_window_hours: number;
      billing_enabled: boolean;
      default_zip_content: string;
      default_file_naming: string;
      export_always_ask: boolean;
      project_creation_mode: 'simple' | 'wizard';
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
        project_creation_mode: 'simple' | 'wizard';
      };
    }>(`${this.baseUrl}/settings`);
  }

  updateGlobalSettings(data: {
    default_max_retouch_photos: number | null;
    default_free_edit_window_hours?: number | null;
    billing_enabled?: boolean;
    default_zip_content?: string;
    default_file_naming?: string;
    export_always_ask?: boolean;
    project_creation_mode?: 'simple' | 'wizard';
  }): Observable<{
    success: boolean; message: string;
    data: {
      default_max_retouch_photos: number;
      default_free_edit_window_hours: number;
      billing_enabled: boolean;
      default_zip_content: string;
      default_file_naming: string;
      export_always_ask: boolean;
      project_creation_mode: 'simple' | 'wizard';
    };
  }> {
    return this.http.put<{
      success: boolean; message: string;
      data: {
        default_max_retouch_photos: number;
        default_free_edit_window_hours: number;
        billing_enabled: boolean;
        default_zip_content: string;
        default_file_naming: string;
        export_always_ask: boolean;
        project_creation_mode: 'simple' | 'wizard';
      };
    }>(`${this.baseUrl}/settings`, data);
  }

  createProjectWithWizard(data: {
    contacts?: Array<{ name: string; email?: string; phone?: string; is_primary?: boolean }>;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    school_name: string;
    city?: string;
    class_name: string;
    class_year: string;
    quote?: string;
    font_family?: string;
    font_color?: string;
    description?: string;
    sort_type?: string;
    student_roster?: string;
    teacher_roster?: string;
  }): Observable<{ success: boolean; message: string; data: PartnerProjectListItem }> {
    return this.http.post<{
      success: boolean; message: string; data: PartnerProjectListItem;
    }>(`${this.baseUrl}/projects/wizard`, data);
  }

  updateProjectWithWizard(projectId: number, data: {
    contacts?: Array<{ name: string; email?: string; phone?: string; is_primary?: boolean }>;
    school_name: string;
    class_name: string;
    class_year: string;
    description?: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{
      success: boolean; message: string;
    }>(`${this.baseUrl}/projects/${projectId}/wizard`, data);
  }

  // =========================================================================
  // Nyomda megrendelés
  // =========================================================================

  sendToPrint(projectId: number, payload: SendToPrintPayload): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/send-to-print`, payload,
    );
  }

  requestReprint(projectId: number, payload: RequestReprintPayload): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/request-reprint`, payload,
    );
  }

  getPrintMessages(projectId: number): Observable<PrintShopMessage[]> {
    return this.http.get<{ data: PrintShopMessage[] }>(
      `${this.baseUrl}/projects/${projectId}/print-messages`,
    ).pipe(map(res => res.data));
  }

  sendPrintMessage(projectId: number, message: string): Observable<PrintShopMessage> {
    return this.http.post<{ data: PrintShopMessage }>(
      `${this.baseUrl}/projects/${projectId}/print-messages`, { message },
    ).pipe(map(res => res.data));
  }

  respondToDeadlineModification(projectId: number, action: 'accept' | 'reject'): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/projects/${projectId}/respond-deadline-modification`, { action },
    );
  }

  toggleUrgent(projectId: number): Observable<{ is_urgent: boolean }> {
    return this.http.patch<{ data: { is_urgent: boolean } }>(
      `${this.baseUrl}/projects/${projectId}/toggle-urgent`, {},
    ).pipe(map(res => res.data));
  }

  updatePrintOrder(projectId: number, data: { print_copies?: number; print_deadline?: string | null }): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/projects/${projectId}/update-print-order`, data);
  }

  acknowledgePrintError(projectId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/projects/${projectId}/acknowledge-print-error`, {});
  }

  sendCorrection(projectId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/projects/${projectId}/send-correction`, {});
  }
}
