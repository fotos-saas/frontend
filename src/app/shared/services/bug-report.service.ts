import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BugReport,
  CreateBugReportDto,
  AddBugReportCommentDto,
  UpdateBugReportStatusDto,
  BugReportComment,
} from '../types/bug-report.types';

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Bug Report Service
 *
 * Hibajelentések kezelése - partner/marketer és admin oldal is.
 * Signal-based unread count SuperAdmin badge-hez.
 */
@Injectable({
  providedIn: 'root'
})
export class BugReportService {
  private readonly apiUrl = environment.apiUrl;

  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly hasUnread = computed(() => this._unreadCount() > 0);

  constructor(private readonly http: HttpClient) {}

  /** Base URL építése: üres prefix esetén nem ad dupla perjelet */
  private bugReportsUrl(prefix: string): string {
    return prefix
      ? `${this.apiUrl}/${prefix}/bug-reports`
      : `${this.apiUrl}/bug-reports`;
  }

  // ==========================================
  // PARTNER / MARKETER / TEAM
  // ==========================================

  list(prefix: string, params: Record<string, string> = {}): Observable<PaginatedResponse<BugReport>> {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${this.bugReportsUrl(prefix)}${queryParams ? '?' + queryParams : ''}`;
    return this.http.get<PaginatedResponse<BugReport>>(url);
  }

  get(prefix: string, id: number): Observable<BugReport> {
    return this.http.get<BugReport>(`${this.bugReportsUrl(prefix)}/${id}`);
  }

  create(prefix: string, data: CreateBugReportDto, attachments: File[] = []): Observable<{ message: string; id: number }> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('priority', data.priority);

    attachments.forEach((file, i) => {
      formData.append(`attachments[${i}]`, file);
    });

    return this.http.post<{ message: string; id: number }>(this.bugReportsUrl(prefix), formData);
  }

  addComment(prefix: string, reportId: number, dto: AddBugReportCommentDto): Observable<{ message: string; comment: BugReportComment }> {
    return this.http.post<{ message: string; comment: BugReportComment }>(
      `${this.bugReportsUrl(prefix)}/${reportId}/comments`,
      dto
    );
  }

  // ==========================================
  // SUPER ADMIN
  // ==========================================

  listAdmin(params: Record<string, string> = {}): Observable<PaginatedResponse<BugReport>> {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${this.apiUrl}/super-admin/bug-reports${queryParams ? '?' + queryParams : ''}`;
    return this.http.get<PaginatedResponse<BugReport>>(url);
  }

  getAdmin(id: number): Observable<BugReport> {
    return this.http.get<BugReport>(`${this.apiUrl}/super-admin/bug-reports/${id}`);
  }

  updateStatus(reportId: number, dto: UpdateBugReportStatusDto): Observable<{ message: string; status: string; status_label: string }> {
    return this.http.patch<{ message: string; status: string; status_label: string }>(
      `${this.apiUrl}/super-admin/bug-reports/${reportId}/status`,
      dto
    );
  }

  updatePriority(reportId: number, priority: string): Observable<{ message: string; priority: string; priority_label: string }> {
    return this.http.patch<{ message: string; priority: string; priority_label: string }>(
      `${this.apiUrl}/super-admin/bug-reports/${reportId}/priority`,
      { priority }
    );
  }

  addCommentAdmin(reportId: number, dto: AddBugReportCommentDto): Observable<{ message: string; comment: BugReportComment }> {
    return this.http.post<{ message: string; comment: BugReportComment }>(
      `${this.apiUrl}/super-admin/bug-reports/${reportId}/comments`,
      dto
    );
  }

  fetchUnreadCount(): void {
    this.http.get<{ count: number }>(`${this.apiUrl}/super-admin/bug-reports/unread-count`)
      .pipe(tap(res => this._unreadCount.set(res.count)))
      .subscribe();
  }
}
