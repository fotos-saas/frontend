import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ProjectTask, ProjectTaskGroup } from '../models/partner.models';

@Injectable({
  providedIn: 'root',
})
export class PartnerTaskService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /** Projekt feladatai */
  getProjectTasks(projectId: number): Observable<{ data: ProjectTask[] }> {
    return this.http.get<{ data: ProjectTask[] }>(`${this.baseUrl}/projects/${projectId}/tasks`);
  }

  /** Feladat létrehozása */
  createTask(projectId: number, data: { title: string; description?: string | null }): Observable<{ data: ProjectTask }> {
    return this.http.post<{ data: ProjectTask }>(`${this.baseUrl}/projects/${projectId}/tasks`, data);
  }

  /** Feladat szerkesztése */
  updateTask(projectId: number, taskId: number, data: { title: string; description?: string | null }): Observable<{ data: ProjectTask }> {
    return this.http.put<{ data: ProjectTask }>(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`, data);
  }

  /** Kész/nem kész váltás */
  toggleComplete(projectId: number, taskId: number): Observable<{ data: ProjectTask }> {
    return this.http.patch<{ data: ProjectTask }>(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}/toggle`, {});
  }

  /** Feladat törlése */
  deleteTask(projectId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`);
  }

  /** Összes feladat összesítő */
  getAllTasks(): Observable<{ data: ProjectTaskGroup[] }> {
    return this.http.get<{ data: ProjectTaskGroup[] }>(`${this.baseUrl}/projects/tasks/all`);
  }
}
