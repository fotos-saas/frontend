import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api.models';
import type {
  EmailHubDashboard,
  DraftResponse,
  DraftFilter,
  ModificationRound,
  AiCostSummary,
  AiDailyCost,
  VoiceProfile,
} from '../models/email-hub.models';

interface PaginatedData<T> {
  items: T[];
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

/**
 * Email Hub Service.
 * AI email dashboard, draft-ok, módosítási körök, voice profile, AI költségek.
 */
@Injectable({
  providedIn: 'root',
})
export class EmailHubService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/email-hub`;

  // --- Dashboard ---

  getDashboard(): Observable<EmailHubDashboard> {
    return this.http
      .get<ApiResponse<EmailHubDashboard>>(`${this.baseUrl}/dashboard`)
      .pipe(map((res) => res.data));
  }

  // --- Drafts ---

  getDrafts(params: { page?: number; status?: DraftFilter } = {}): Observable<PaginatedData<DraftResponse>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.status && params.status !== 'all') httpParams = httpParams.set('status', params.status);

    return this.http
      .get<ApiResponse<PaginatedData<DraftResponse>>>(`${this.baseUrl}/drafts`, { params: httpParams })
      .pipe(map((res) => res.data));
  }

  getDraft(draftId: number): Observable<DraftResponse> {
    return this.http
      .get<ApiResponse<DraftResponse>>(`${this.baseUrl}/drafts/${draftId}`)
      .pipe(map((res) => res.data));
  }

  approveDraft(draftId: number): Observable<DraftResponse> {
    return this.http
      .put<ApiResponse<DraftResponse>>(`${this.baseUrl}/drafts/${draftId}/approve`, {})
      .pipe(map((res) => res.data));
  }

  rejectDraft(draftId: number): Observable<void> {
    return this.http
      .put<void>(`${this.baseUrl}/drafts/${draftId}/reject`, {});
  }

  // --- Modification Rounds ---

  getModificationRounds(params: { page?: number; projectId?: number; status?: string } = {}): Observable<PaginatedData<ModificationRound>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.projectId) httpParams = httpParams.set('project_id', params.projectId);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http
      .get<ApiResponse<PaginatedData<ModificationRound>>>(`${this.baseUrl}/modifications`, { params: httpParams })
      .pipe(map((res) => res.data));
  }

  getModificationRound(roundId: number): Observable<ModificationRound> {
    return this.http
      .get<ApiResponse<ModificationRound>>(`${this.baseUrl}/modifications/${roundId}`)
      .pipe(map((res) => res.data));
  }

  // --- AI Costs ---

  getAiCosts(): Observable<AiCostSummary> {
    return this.http
      .get<ApiResponse<AiCostSummary>>(`${this.baseUrl}/ai-costs`)
      .pipe(map((res) => res.data));
  }

  getAiCostsDaily(): Observable<AiDailyCost[]> {
    return this.http
      .get<ApiResponse<{ month: string; days: AiDailyCost[] }>>(`${this.baseUrl}/ai-costs/daily`)
      .pipe(map((res) => res.data.days));
  }

  // --- Voice Profile ---

  getVoiceProfile(): Observable<VoiceProfile | null> {
    return this.http
      .get<ApiResponse<{ profile: VoiceProfile | null; is_built: boolean }>>(`${this.baseUrl}/voice-profile`)
      .pipe(map((res) => res.data.profile));
  }

  rebuildVoiceProfile(): Observable<{ status: string }> {
    return this.http
      .post<ApiResponse<{ status: string }>>(`${this.baseUrl}/voice-profile/rebuild`, {})
      .pipe(map((res) => res.data));
  }
}
