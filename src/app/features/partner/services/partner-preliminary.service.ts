import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
import type {
  CreatePreliminaryRequest,
  LinkCandidate,
  LinkPreview,
  LinkPreliminaryRequest,
  LinkPreliminaryResult,
  PartnerProjectListItem,
} from '../models/partner.models';

/**
 * Előzetes projektek API service.
 */
@Injectable({ providedIn: 'root' })
export class PartnerPreliminaryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/preliminary-projects`;

  createProject(data: CreatePreliminaryRequest): Observable<{
    success: boolean;
    message: string;
    data: Partial<PartnerProjectListItem>;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: Partial<PartnerProjectListItem>;
    }>(this.baseUrl, data);
  }

  getLinkCandidates(search?: string): Observable<{ success: boolean; data: LinkCandidate[] }> {
    const params = buildHttpParams({ search });
    return this.http.get<{ success: boolean; data: LinkCandidate[] }>(
      `${this.baseUrl}/link-candidates`,
      { params },
    );
  }

  getLinkPreview(preliminaryId: number, targetProjectId: number): Observable<{ success: boolean; data: LinkPreview }> {
    const params = buildHttpParams({ target_project_id: targetProjectId });
    return this.http.get<{ success: boolean; data: LinkPreview }>(
      `${this.baseUrl}/${preliminaryId}/link-preview`,
      { params },
    );
  }

  linkProject(preliminaryId: number, data: LinkPreliminaryRequest): Observable<{ success: boolean; message: string; data: LinkPreliminaryResult }> {
    return this.http.post<{ success: boolean; message: string; data: LinkPreliminaryResult }>(
      `${this.baseUrl}/${preliminaryId}/link`,
      data,
    );
  }

  deleteProject(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`);
  }
}
