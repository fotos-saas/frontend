import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ProjectTag } from '../models/partner.models';

/**
 * Projekt címke CRUD service.
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerTagService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /** Partner összes címkéje */
  getTags(): Observable<{ data: ProjectTag[] }> {
    return this.http.get<{ data: ProjectTag[] }>(`${this.baseUrl}/tags`);
  }

  /** Új címke létrehozása */
  createTag(data: { name: string; color: string }): Observable<{ data: ProjectTag }> {
    return this.http.post<{ data: ProjectTag }>(`${this.baseUrl}/tags`, data);
  }

  /** Címke frissítése */
  updateTag(id: number, data: { name: string; color: string }): Observable<{ data: ProjectTag }> {
    return this.http.put<{ data: ProjectTag }>(`${this.baseUrl}/tags/${id}`, data);
  }

  /** Címke törlése */
  deleteTag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tags/${id}`);
  }

  /** Címkék szinkronizálása egy projekthez */
  syncProjectTags(projectId: number, tagIds: number[]): Observable<{ data: ProjectTag[] }> {
    return this.http.post<{ data: ProjectTag[] }>(
      `${this.baseUrl}/projects/${projectId}/tags/sync`,
      { tag_ids: tagIds }
    );
  }
}
