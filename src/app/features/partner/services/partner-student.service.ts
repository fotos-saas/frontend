import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  StudentListItem,
  StudentDetail,
  StudentPhoto,
  StudentChangeLogEntry,
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentBulkImportPreviewItem,
  StudentBulkImportExecuteItem,
  StudentBulkImportExecuteResult,
  StudentsBySchoolResponse,
} from '../models/student.models';
import { PaginatedResponse } from '../models/partner.models';

@Injectable({
  providedIn: 'root',
})
export class PartnerStudentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/students`;

  getStudents(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    school_id?: number;
    class_name?: string;
  }): Observable<PaginatedResponse<StudentListItem>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.school_id) httpParams = httpParams.set('school_id', params.school_id.toString());
    if (params?.class_name) httpParams = httpParams.set('class_name', params.class_name);

    return this.http.get<PaginatedResponse<StudentListItem>>(this.baseUrl, { params: httpParams });
  }

  getStudentsBySchool(params?: {
    class_year?: string;
    school_id?: number;
    missing_only?: boolean;
  }): Observable<StudentsBySchoolResponse> {
    let httpParams = new HttpParams();
    if (params?.class_year) httpParams = httpParams.set('class_year', params.class_year);
    if (params?.school_id) httpParams = httpParams.set('school_id', params.school_id.toString());
    if (params?.missing_only) httpParams = httpParams.set('missing_only', '1');

    return this.http.get<StudentsBySchoolResponse>(`${this.baseUrl}/by-project`, { params: httpParams });
  }

  getClassYears(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/class-years`);
  }

  getStudent(id: number): Observable<{ success: boolean; data: StudentDetail }> {
    return this.http.get<{ success: boolean; data: StudentDetail }>(`${this.baseUrl}/${id}`);
  }

  createStudent(data: CreateStudentRequest): Observable<{ success: boolean; message: string; data: StudentDetail }> {
    return this.http.post<{ success: boolean; message: string; data: StudentDetail }>(this.baseUrl, data);
  }

  updateStudent(id: number, data: UpdateStudentRequest): Observable<{ success: boolean; message: string; data: StudentDetail }> {
    return this.http.put<{ success: boolean; message: string; data: StudentDetail }>(`${this.baseUrl}/${id}`, data);
  }

  deleteStudent(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`);
  }

  uploadStudentPhoto(studentId: number, file: File, year: number, setActive = false): Observable<{ success: boolean; message: string; data: StudentPhoto }> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('year', year.toString());
    if (setActive) formData.append('set_active', '1');

    return this.http.post<{ success: boolean; message: string; data: StudentPhoto }>(`${this.baseUrl}/${studentId}/photos`, formData);
  }

  setActivePhoto(studentId: number, photoId: number): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${studentId}/photos/${photoId}/active`, {});
  }

  deleteStudentPhoto(studentId: number, photoId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${studentId}/photos/${photoId}`);
  }

  markNoPhoto(studentId: number): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${studentId}/mark-no-photo`, {});
  }

  undoNoPhoto(studentId: number): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${studentId}/undo-no-photo`, {});
  }

  getChangelog(studentId: number, params?: { page?: number; per_page?: number }): Observable<PaginatedResponse<StudentChangeLogEntry>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginatedResponse<StudentChangeLogEntry>>(`${this.baseUrl}/${studentId}/changelog`, { params: httpParams });
  }

  bulkImportPreview(schoolId: number, names: string[]): Observable<{ success: boolean; data: StudentBulkImportPreviewItem[] }> {
    return this.http.post<{ success: boolean; data: StudentBulkImportPreviewItem[] }>(`${this.baseUrl}/bulk-import/preview`, {
      school_id: schoolId,
      names,
    });
  }

  bulkImportPreviewFile(schoolId: number, file: File): Observable<{ success: boolean; data: StudentBulkImportPreviewItem[] }> {
    const formData = new FormData();
    formData.append('school_id', schoolId.toString());
    formData.append('file', file);
    return this.http.post<{ success: boolean; data: StudentBulkImportPreviewItem[] }>(`${this.baseUrl}/bulk-import/preview`, formData);
  }

  bulkImportExecute(schoolId: number, items: StudentBulkImportExecuteItem[]): Observable<{ success: boolean; message: string; data: StudentBulkImportExecuteResult }> {
    return this.http.post<{ success: boolean; message: string; data: StudentBulkImportExecuteResult }>(`${this.baseUrl}/bulk-import/execute`, {
      school_id: schoolId,
      items,
    });
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export-csv`, { responseType: 'blob' });
  }
}
