import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PartnerPersonService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  ensurePersonArchive(projectId: number, personId: number): Observable<{
    success: boolean; data: { archiveId: number }; message: string;
  }> {
    return this.http.post<{
      success: boolean; data: { archiveId: number }; message: string;
    }>(`${this.baseUrl}/projects/${projectId}/persons/${personId}/ensure-archive`, {});
  }

  updatePerson(projectId: number, personId: number, data: {
    name?: string; title?: string | null; note?: string | null;
  }): Observable<{
    success: boolean; message: string;
    data: { id: number; name: string; title: string | null; note: string | null };
  }> {
    return this.http.patch<{
      success: boolean; message: string;
      data: { id: number; name: string; title: string | null; note: string | null };
    }>(`${this.baseUrl}/projects/${projectId}/persons/${personId}`, data);
  }

  deletePerson(projectId: number, personId: number): Observable<{
    success: boolean; message: string; data: { id: number };
  }> {
    return this.http.delete<{
      success: boolean; message: string; data: { id: number };
    }>(`${this.baseUrl}/projects/${projectId}/persons/${personId}`);
  }

  deletePersonsBatch(projectId: number, ids: number[]): Observable<{
    success: boolean; message: string; data: { deleted_count: number };
  }> {
    return this.http.post<{
      success: boolean; message: string; data: { deleted_count: number };
    }>(`${this.baseUrl}/projects/${projectId}/persons/batch-delete`, { ids });
  }

  overridePersonPhoto(projectId: number, personId: number, photoId: number): Observable<{
    success: boolean; message: string;
    data: { id: number; hasPhoto: boolean; photoThumbUrl: string | null; photoUrl: string | null; hasOverride: boolean };
  }> {
    return this.http.patch<{
      success: boolean; message: string;
      data: { id: number; hasPhoto: boolean; photoThumbUrl: string | null; photoUrl: string | null; hasOverride: boolean };
    }>(`${this.baseUrl}/projects/${projectId}/persons/${personId}/override-photo`, { photo_id: photoId });
  }

  resetPersonPhoto(projectId: number, personId: number): Observable<{
    success: boolean; message: string;
    data: { id: number; hasPhoto: boolean; photoThumbUrl: string | null; photoUrl: string | null; hasOverride: boolean };
  }> {
    return this.http.patch<{
      success: boolean; message: string;
      data: { id: number; hasPhoto: boolean; photoThumbUrl: string | null; photoUrl: string | null; hasOverride: boolean };
    }>(`${this.baseUrl}/projects/${projectId}/persons/${personId}/override-photo`, { photo_id: null });
  }

  updateExtraNames(projectId: number, data: { students: string; teachers: string }): Observable<{
    success: boolean; message: string;
    data: { extraNames: { students: string; teachers: string } };
  }> {
    return this.http.patch<{
      success: boolean; message: string;
      data: { extraNames: { students: string; teachers: string } };
    }>(`${this.baseUrl}/projects/${projectId}/extra-names`, data);
  }

  addPersons(projectId: number, names: string, type: 'student' | 'teacher'): Observable<{
    success: boolean; message: string;
    data: {
      created: Array<{ id: number; name: string; type: string; archiveLinked: boolean; hasPhoto: boolean }>;
      duplicates: string[];
      archiveMatches: number;
    };
  }> {
    return this.http.post<{
      success: boolean; message: string;
      data: {
        created: Array<{ id: number; name: string; type: string; archiveLinked: boolean; hasPhoto: boolean }>;
        duplicates: string[];
        archiveMatches: number;
      };
    }>(`${this.baseUrl}/projects/${projectId}/persons/add`, { names, type });
  }
}
