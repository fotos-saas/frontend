import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TeacherListItem,
  TeacherDetail,
  TeacherPhoto,
  TeacherChangeLogEntry,
  CreateTeacherRequest,
  UpdateTeacherRequest,
  BulkImportPreviewItem,
  BulkImportExecuteItem,
  BulkImportExecuteResult,
} from '../models/teacher.models';
import { PaginatedResponse } from '../models/partner.models';

@Injectable({
  providedIn: 'root',
})
export class PartnerTeacherService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/teachers`;

  getTeachers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    school_id?: number;
  }): Observable<PaginatedResponse<TeacherListItem>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.school_id) httpParams = httpParams.set('school_id', params.school_id.toString());

    return this.http.get<PaginatedResponse<TeacherListItem>>(this.baseUrl, { params: httpParams });
  }

  getAllTeachers(params?: { search?: string; school_id?: number }): Observable<TeacherListItem[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.school_id) httpParams = httpParams.set('school_id', params.school_id.toString());

    return this.http.get<TeacherListItem[]>(`${this.baseUrl}/all`, { params: httpParams });
  }

  getTeacher(id: number): Observable<{ success: boolean; data: TeacherDetail }> {
    return this.http.get<{ success: boolean; data: TeacherDetail }>(`${this.baseUrl}/${id}`);
  }

  createTeacher(data: CreateTeacherRequest): Observable<{ success: boolean; message: string; data: TeacherDetail }> {
    return this.http.post<{ success: boolean; message: string; data: TeacherDetail }>(this.baseUrl, data);
  }

  updateTeacher(id: number, data: UpdateTeacherRequest): Observable<{ success: boolean; message: string; data: TeacherDetail }> {
    return this.http.put<{ success: boolean; message: string; data: TeacherDetail }>(`${this.baseUrl}/${id}`, data);
  }

  deleteTeacher(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`);
  }

  uploadTeacherPhoto(teacherId: number, file: File, year: number, setActive = false): Observable<{ success: boolean; message: string; data: TeacherPhoto }> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('year', year.toString());
    if (setActive) formData.append('set_active', '1');

    return this.http.post<{ success: boolean; message: string; data: TeacherPhoto }>(`${this.baseUrl}/${teacherId}/photos`, formData);
  }

  setActivePhoto(teacherId: number, photoId: number): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${teacherId}/photos/${photoId}/active`, {});
  }

  deleteTeacherPhoto(teacherId: number, photoId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${teacherId}/photos/${photoId}`);
  }

  getChangelog(teacherId: number, params?: { page?: number; per_page?: number }): Observable<PaginatedResponse<TeacherChangeLogEntry>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginatedResponse<TeacherChangeLogEntry>>(`${this.baseUrl}/${teacherId}/changelog`, { params: httpParams });
  }

  bulkImportPreview(schoolId: number, names: string[]): Observable<{ success: boolean; data: BulkImportPreviewItem[] }> {
    return this.http.post<{ success: boolean; data: BulkImportPreviewItem[] }>(`${this.baseUrl}/bulk-import/preview`, {
      school_id: schoolId,
      names,
    });
  }

  bulkImportPreviewFile(schoolId: number, file: File): Observable<{ success: boolean; data: BulkImportPreviewItem[] }> {
    const formData = new FormData();
    formData.append('school_id', schoolId.toString());
    formData.append('file', file);
    return this.http.post<{ success: boolean; data: BulkImportPreviewItem[] }>(`${this.baseUrl}/bulk-import/preview`, formData);
  }

  bulkImportExecute(schoolId: number, items: BulkImportExecuteItem[]): Observable<{ success: boolean; message: string; data: BulkImportExecuteResult }> {
    return this.http.post<{ success: boolean; message: string; data: BulkImportExecuteResult }>(`${this.baseUrl}/bulk-import/execute`, {
      school_id: schoolId,
      items,
    });
  }
}
