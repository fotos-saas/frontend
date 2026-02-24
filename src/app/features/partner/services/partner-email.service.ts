import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ProjectEmail,
  EmailDetailResponse,
  EmailStats,
  ReplyData,
} from '../models/project-email.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

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
 * Partner Email Service.
 * Projekt emailek lekérdezése és kezelése.
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerEmailService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /**
   * Projekt emailek lekérdezése (paginált).
   */
  getProjectEmails(
    projectId: number,
    params: {
      page?: number;
      perPage?: number;
      direction?: string;
      needsReply?: boolean;
      search?: string;
    } = {},
  ): Observable<PaginatedData<ProjectEmail>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.perPage) httpParams = httpParams.set('per_page', params.perPage);
    if (params.direction) httpParams = httpParams.set('direction', params.direction);
    if (params.needsReply) httpParams = httpParams.set('needs_reply', '1');
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http
      .get<ApiResponse<PaginatedData<ProjectEmail>>>(
        `${this.baseUrl}/projects/${projectId}/emails`,
        { params: httpParams },
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Egyedi email + thread lekérdezése.
   */
  getEmail(projectId: number, emailId: number): Observable<EmailDetailResponse> {
    return this.http
      .get<ApiResponse<EmailDetailResponse>>(
        `${this.baseUrl}/projects/${projectId}/emails/${emailId}`,
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Email olvasottnak jelölése.
   */
  markRead(projectId: number, emailId: number): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/projects/${projectId}/emails/${emailId}/read`,
      {},
    );
  }

  /**
   * Email megválaszoltnak jelölése.
   */
  markReplied(projectId: number, emailId: number): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/projects/${projectId}/emails/${emailId}/replied`,
      {},
    );
  }

  /**
   * Válasz küldése egy emailre.
   */
  replyToEmail(projectId: number, emailId: number, data: ReplyData): Observable<ProjectEmail> {
    return this.http
      .post<ApiResponse<ProjectEmail>>(
        `${this.baseUrl}/projects/${projectId}/emails/${emailId}/reply`,
        data,
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Email statisztikák lekérdezése.
   */
  getStats(projectId: number): Observable<EmailStats> {
    return this.http
      .get<ApiResponse<EmailStats>>(
        `${this.baseUrl}/projects/${projectId}/emails/stats`,
      )
      .pipe(map((res) => res.data));
  }
}
