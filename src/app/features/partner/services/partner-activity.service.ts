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
  causer: { id: number; name: string } | null;
  changes: { old?: Record<string, unknown>; attributes?: Record<string, unknown> } | null;
  created_at: string;
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
}
