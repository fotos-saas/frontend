import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  EmailFolder,
  EmailLabel,
  EmailListItem,
  EmailDetail,
  QuickReply,
  EmailClientStats,
} from '../models/email-client.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class EmailClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner/email-client`;
  private readonly labelsUrl = `${environment.apiUrl}/partner/labels`;

  // --- Email endpoints ---

  getEmails(params: {
    folder?: string;
    label_id?: number;
    search?: string;
    unread?: boolean;
    page?: number;
    per_page?: number;
  }): Observable<PaginatedResponse<EmailListItem>> {
    let httpParams = new HttpParams();
    if (params.folder) httpParams = httpParams.set('folder', params.folder);
    if (params.label_id) httpParams = httpParams.set('label_id', String(params.label_id));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.unread) httpParams = httpParams.set('unread', '1');
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.per_page) httpParams = httpParams.set('per_page', String(params.per_page));

    return this.http.get<ApiResponse<PaginatedResponse<EmailListItem>>>(
      `${this.baseUrl}/emails`, { params: httpParams }
    ).pipe(map(r => r.data));
  }

  getEmail(id: number): Observable<{ email: EmailDetail; thread: EmailListItem[] }> {
    return this.http.get<ApiResponse<{ email: EmailDetail; thread: EmailListItem[] }>>(
      `${this.baseUrl}/emails/${id}`
    ).pipe(map(r => r.data));
  }

  toggleStar(id: number): Observable<{ is_starred: boolean }> {
    return this.http.put<ApiResponse<{ is_starred: boolean }>>(
      `${this.baseUrl}/emails/${id}/star`, {}
    ).pipe(map(r => r.data));
  }

  markRead(id: number, isRead = true): Observable<{ is_read: boolean }> {
    return this.http.put<ApiResponse<{ is_read: boolean }>>(
      `${this.baseUrl}/emails/${id}/read`, { is_read: isRead }
    ).pipe(map(r => r.data));
  }

  syncLabels(emailId: number, labelIds: number[]): Observable<{ labels: { id: number; name: string; color: string }[] }> {
    return this.http.post<ApiResponse<{ labels: { id: number; name: string; color: string }[] }>>(
      `${this.baseUrl}/emails/${emailId}/labels`, { label_ids: labelIds }
    ).pipe(map(r => r.data));
  }

  getFolders(): Observable<{ folders: EmailFolder[] }> {
    return this.http.get<ApiResponse<{ folders: EmailFolder[] }>>(
      `${this.baseUrl}/folders`
    ).pipe(map(r => r.data));
  }

  getStats(): Observable<EmailClientStats> {
    return this.http.get<ApiResponse<EmailClientStats>>(
      `${this.baseUrl}/stats`
    ).pipe(map(r => r.data));
  }

  getQuickReplies(emailId: number): Observable<{ replies: QuickReply[] }> {
    return this.http.post<ApiResponse<{ replies: QuickReply[] }>>(
      `${this.baseUrl}/emails/${emailId}/quick-replies`, {}
    ).pipe(map(r => r.data));
  }

  // --- Label endpoints ---

  getLabels(): Observable<{ labels: EmailLabel[] }> {
    return this.http.get<ApiResponse<{ labels: EmailLabel[] }>>(
      this.labelsUrl
    ).pipe(map(r => r.data));
  }

  createLabel(data: { name: string; color: string; sort_order?: number }): Observable<{ label: EmailLabel }> {
    return this.http.post<ApiResponse<{ label: EmailLabel }>>(
      this.labelsUrl, data
    ).pipe(map(r => r.data));
  }

  updateLabel(id: number, data: { name: string; color: string; sort_order?: number }): Observable<{ label: EmailLabel }> {
    return this.http.put<ApiResponse<{ label: EmailLabel }>>(
      `${this.labelsUrl}/${id}`, data
    ).pipe(map(r => r.data));
  }

  deleteLabel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.labelsUrl}/${id}`);
  }
}
