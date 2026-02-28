import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ProjectTask, ProjectTaskGroup, ProjectTaskSections, TaskAssignee } from '../models/partner.models';

@Injectable({
  providedIn: 'root',
})
export class PartnerTaskService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /** Projekt feladatai (szekciókra bontva) */
  getProjectTasks(projectId: number): Observable<{ data: ProjectTaskSections }> {
    return this.http.get<{ data: ProjectTaskSections }>(`${this.baseUrl}/projects/${projectId}/tasks`);
  }

  /** Feladat létrehozása (FormData — fájlok miatt) */
  createTask(
    projectId: number,
    data: { title: string; description?: string | null; assigned_to_user_id?: number | null },
    attachments: File[] = []
  ): Observable<{ data: ProjectTask }> {
    const formData = this.buildFormData(data, attachments);
    return this.http.post<{ data: ProjectTask }>(`${this.baseUrl}/projects/${projectId}/tasks`, formData);
  }

  /** Feladat szerkesztése (FormData — fájlok miatt) */
  updateTask(
    projectId: number,
    taskId: number,
    data: { title: string; description?: string | null; assigned_to_user_id?: number | null },
    attachments: File[] = [],
    removeAttachmentIds: number[] = []
  ): Observable<{ data: ProjectTask }> {
    const formData = this.buildFormData(data, attachments, removeAttachmentIds);
    // Laravel PUT nem támogat FormData-t natívan — POST + _method=PUT
    formData.append('_method', 'PUT');
    return this.http.post<{ data: ProjectTask }>(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`, formData);
  }

  /** Kész/nem kész váltás */
  toggleComplete(projectId: number, taskId: number): Observable<{ data: ProjectTask }> {
    return this.http.patch<{ data: ProjectTask }>(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}/toggle`, {});
  }

  /** Feladat törlése */
  deleteTask(projectId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`);
  }

  /** Egyedi csatolmány törlése */
  deleteAttachment(projectId: number, taskId: number, attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`);
  }

  /** Összes feladat összesítő */
  getAllTasks(): Observable<{ data: ProjectTaskGroup[] }> {
    return this.http.get<{ data: ProjectTaskGroup[] }>(`${this.baseUrl}/projects/tasks/all`);
  }

  /** Hátralévő feladatok száma (sidebar badge) */
  getPendingCount(): Observable<{ data: { count: number } }> {
    return this.http.get<{ data: { count: number } }>(`${this.baseUrl}/projects/tasks/pending-count`);
  }

  /** Kiosztható csapattagok listája */
  getAssignees(): Observable<{ data: TaskAssignee[] }> {
    return this.http.get<{ data: TaskAssignee[] }>(`${this.baseUrl}/task-assignees`);
  }

  private buildFormData(
    data: { title: string; description?: string | null; assigned_to_user_id?: number | null },
    attachments: File[],
    removeAttachmentIds: number[] = []
  ): FormData {
    const fd = new FormData();
    fd.append('title', data.title);
    if (data.description) {
      fd.append('description', data.description);
    }
    if (data.assigned_to_user_id) {
      fd.append('assigned_to_user_id', String(data.assigned_to_user_id));
    }
    for (const file of attachments) {
      fd.append('attachments[]', file);
    }
    for (const id of removeAttachmentIds) {
      fd.append('remove_attachment_ids[]', String(id));
    }
    return fd;
  }
}
