import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
import type {
  WorkflowListResponse,
  WorkflowDetail,
  WorkflowType,
  WorkflowDashboardStats,
  WorkflowScheduleSettings,
} from '../models/workflow.models';

@Injectable({
  providedIn: 'root',
})
export class PartnerWorkflowService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/workflows`;

  /** Workflow-k listázása (projekt szintű, szűrhető) */
  getWorkflows(
    projectId: number,
    filters?: { status?: string; page?: number },
  ): Observable<WorkflowListResponse> {
    const params = buildHttpParams({
      status: filters?.status,
      page: filters?.page,
    });
    return this.http.get<WorkflowListResponse>(
      `${environment.apiUrl}/partner/projects/${projectId}/workflows`,
      { params },
    );
  }

  /** Összes workflow listázása (nem projekt-specifikus, szűrhető) */
  getAllWorkflows(
    filters?: Record<string, string | number>,
  ): Observable<WorkflowListResponse> {
    const params = buildHttpParams(filters ?? {});
    return this.http.get<WorkflowListResponse>(this.baseUrl, { params });
  }

  /** Egyedi workflow részletei */
  getWorkflow(workflowId: number): Observable<WorkflowDetail> {
    return this.http.get<WorkflowDetail>(`${this.baseUrl}/${workflowId}`);
  }

  /** Új workflow indítása */
  createWorkflow(
    projectId: number,
    body: { type: WorkflowType },
  ): Observable<WorkflowDetail> {
    return this.http.post<WorkflowDetail>(
      `${environment.apiUrl}/partner/projects/${projectId}/workflows`,
      body,
    );
  }

  /** Workflow jóváhagyása */
  approveWorkflow(
    workflowId: number,
    body?: { notes?: string },
  ): Observable<WorkflowDetail> {
    return this.http.post<WorkflowDetail>(
      `${this.baseUrl}/${workflowId}/approve`,
      body ?? {},
    );
  }

  /** Workflow elutasítása */
  rejectWorkflow(
    workflowId: number,
    body: { reason: string },
  ): Observable<WorkflowDetail> {
    return this.http.post<WorkflowDetail>(
      `${this.baseUrl}/${workflowId}/reject`,
      body,
    );
  }

  /** Dashboard statisztikák */
  getDashboardStats(): Observable<WorkflowDashboardStats> {
    return this.http.get<WorkflowDashboardStats>(`${this.baseUrl}/stats`);
  }

  /** Jóváhagyásra váró workflow-k száma (sidebar badge) */
  getPendingCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/pending-count`);
  }

  // ============================================
  // ÜTEMEZÉS
  // ============================================

  private scheduleUrl = `${environment.apiUrl}/partner/workflow-schedules`;

  /** Ütemezési beállítások listázása */
  getScheduleSettings(): Observable<WorkflowScheduleSettings[]> {
    return this.http.get<WorkflowScheduleSettings[]>(this.scheduleUrl);
  }

  /** Új ütemezés létrehozása */
  createSchedule(
    settings: WorkflowScheduleSettings,
  ): Observable<WorkflowScheduleSettings> {
    return this.http.post<WorkflowScheduleSettings>(this.scheduleUrl, settings);
  }

  /** Ütemezés frissítése */
  updateSchedule(
    id: number,
    settings: Partial<WorkflowScheduleSettings>,
  ): Observable<WorkflowScheduleSettings> {
    return this.http.put<WorkflowScheduleSettings>(
      `${this.scheduleUrl}/${id}`,
      settings,
    );
  }

  /** Ütemezés törlése */
  deleteSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.scheduleUrl}/${id}`);
  }
}
