import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';

export interface ActivityLogItem {
  id: number;
  log_name: string;
  description: string;
  event: string | null;
  subject_type: string | null;
  subject_id: number | null;
  subject_name: string | null;
  project: { id: number; name: string } | null;
  causer: { id: number; name: string } | null;
  changes: { old?: Record<string, unknown>; attributes?: Record<string, unknown>; source?: string; meta?: Record<string, unknown> } | null;
  created_at: string;
}

export interface ProjectActivityItem {
  id: number;
  logName: string;
  event: string | null;
  eventLabel: string;
  subjectType: string | null;
  subjectId: number | null;
  subjectName: string | null;
  changes: { old?: Record<string, unknown>; attributes?: Record<string, unknown>; source?: string } | null;
  causer: { id: number; name: string } | null;
  createdAt: string;
}

export interface ProjectActivityResponse {
  items: ProjectActivityItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ActivityLogResponse {
  items: ActivityLogItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ActivityLogFilters {
  log_name?: string;
  event?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  causer_id?: number;
  project_id?: number;
  per_page?: number;
  page?: number;
}

export interface ProjectActivitySummary {
  project_id: number;
  project_name: string;
  activity_count: number;
  new_activity_count: number;
  last_activity_at: string | null;
  reviewed_at: string | null;
}

export interface ActivitySummaryResponse {
  items: ProjectActivitySummary[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ActivitySummaryFilters {
  search?: string;
  graduation_year?: number;
  date_from?: string;
  date_to?: string;
  reviewed?: 'yes' | 'no' | '';
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerActivityService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/partner/activity-log`;

  getActivityLog(filters: ActivityLogFilters = {}): Observable<ActivityLogResponse> {
    const params = buildHttpParams(filters as Record<string, string | number | boolean | null | undefined>);
    return this.http.get<ActivityLogResponse>(this.apiUrl, { params });
  }

  getActivitySummary(filters: ActivitySummaryFilters = {}): Observable<ActivitySummaryResponse> {
    const params = buildHttpParams(filters as Record<string, string | number | boolean | null | undefined>);
    return this.http.get<ActivitySummaryResponse>(`${this.apiUrl}/summary`, { params });
  }

  toggleProjectReview(projectIds: number[], reviewed: boolean): Observable<{ message: string; count: number }> {
    return this.http.post<{ message: string; count: number }>(
      `${this.apiUrl}/review`,
      { project_ids: projectIds, reviewed },
    );
  }

  getProjectActivity(projectId: number, page = 1, perPage = 20): Observable<ProjectActivityResponse> {
    const params = buildHttpParams({ page, per_page: perPage });
    return this.http.get<ProjectActivityResponse>(
      `${environment.apiUrl}/partner/projects/${projectId}/activity`,
      { params },
    );
  }
}
