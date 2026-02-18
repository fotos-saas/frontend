import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
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
import {
  ArchiveService,
  ArchiveBySchoolResponse,
  ArchiveBulkImportPreviewItem,
  ArchiveBulkImportExecuteItem,
  ArchiveBulkImportExecuteResult,
  ArchivePhoto,
  ArchiveDetail,
  CreateArchivePayload,
  UpdateArchivePayload,
  BulkPhotoMatch,
  BulkPhotoUploadSummary,
  BulkPhotoUploadResult,
} from '../models/archive.models';

@Injectable({
  providedIn: 'root',
})
export class PartnerStudentService implements ArchiveService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/students`;

  getStudents(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    school_id?: number;
    class_name?: string;
  }): Observable<PaginatedResponse<StudentListItem>> {
    const httpParams = buildHttpParams({
      page: params?.page,
      per_page: params?.per_page,
      search: params?.search,
      school_id: params?.school_id,
      class_name: params?.class_name,
    });

    return this.http.get<PaginatedResponse<StudentListItem>>(this.baseUrl, { params: httpParams });
  }

  getStudentsBySchool(params?: {
    class_year?: string;
    school_id?: number;
    missing_only?: boolean;
  }): Observable<StudentsBySchoolResponse> {
    const httpParams = buildHttpParams({
      class_year: params?.class_year,
      school_id: params?.school_id,
      missing_only: params?.missing_only ? '1' : undefined,
    });

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
    const httpParams = buildHttpParams({
      page: params?.page,
      per_page: params?.per_page,
    });

    return this.http.get<PaginatedResponse<StudentChangeLogEntry>>(`${this.baseUrl}/${studentId}/changelog`, { params: httpParams });
  }

  bulkImportPreview(schoolId: number, names: string[]): Observable<{ success: boolean; data: ArchiveBulkImportPreviewItem[] }> {
    return this.http.post<{ success: boolean; data: StudentBulkImportPreviewItem[] }>(`${this.baseUrl}/bulk-import/preview`, {
      school_id: schoolId,
      names,
    }).pipe(map(res => ({
      ...res,
      data: res.data.map(item => ({ ...item, matchId: item.studentId, matchName: item.studentName })),
    })));
  }

  bulkImportPreviewFile(schoolId: number, file: File): Observable<{ success: boolean; data: ArchiveBulkImportPreviewItem[] }> {
    const formData = new FormData();
    formData.append('school_id', schoolId.toString());
    formData.append('file', file);
    return this.http.post<{ success: boolean; data: StudentBulkImportPreviewItem[] }>(`${this.baseUrl}/bulk-import/preview`, formData).pipe(
      map(res => ({
        ...res,
        data: res.data.map(item => ({ ...item, matchId: item.studentId, matchName: item.studentName })),
      }))
    );
  }

  bulkImportExecute(schoolId: number, items: ArchiveBulkImportExecuteItem[]): Observable<{ success: boolean; message: string; data: ArchiveBulkImportExecuteResult }> {
    const mappedItems: StudentBulkImportExecuteItem[] = items.map(i => ({
      input_name: i.input_name,
      action: i.action,
      student_id: i.match_id,
    }));
    return this.http.post<{ success: boolean; message: string; data: StudentBulkImportExecuteResult }>(`${this.baseUrl}/bulk-import/execute`, {
      school_id: schoolId,
      items: mappedItems,
    });
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export-csv`, { responseType: 'blob' });
  }

  // ============ ArchiveService adapter metódusok ============

  uploadPhoto(id: number, file: File, year: number, setActive = false): Observable<{ success: boolean; message: string; data: ArchivePhoto }> {
    return this.uploadStudentPhoto(id, file, year, setActive);
  }

  getArchive(id: number): Observable<{ success: boolean; data: ArchiveDetail }> {
    return this.getStudent(id) as Observable<{ success: boolean; data: ArchiveDetail }>;
  }

  createArchive(payload: CreateArchivePayload): Observable<{ success: boolean; message: string; data: ArchiveDetail }> {
    return this.createStudent(payload as CreateStudentRequest) as Observable<{ success: boolean; message: string; data: ArchiveDetail }>;
  }

  updateArchive(id: number, payload: UpdateArchivePayload): Observable<{ success: boolean; message: string; data: ArchiveDetail }> {
    return this.updateStudent(id, payload as UpdateStudentRequest) as Observable<{ success: boolean; message: string; data: ArchiveDetail }>;
  }

  getBySchool(params?: { class_year?: string; school_id?: number; missing_only?: boolean }): Observable<ArchiveBySchoolResponse> {
    return this.getStudentsBySchool(params).pipe(
      map(res => ({
        schools: res.schools.map(s => ({
          schoolId: s.schoolId,
          schoolName: s.schoolName,
          classes: s.classes,
          classCount: s.classCount,
          itemCount: s.studentCount,
          missingPhotoCount: s.missingPhotoCount,
          items: s.students.map(st => ({
            archiveId: st.archiveId,
            name: st.name,
            className: st.className,
            hasPhoto: st.hasPhoto,
            noPhotoMarked: st.noPhotoMarked,
            photoThumbUrl: st.photoThumbUrl,
            photoMiniThumbUrl: st.photoMiniThumbUrl,
            photoUrl: st.photoUrl,
          })),
        })),
        summary: {
          totalSchools: res.summary.totalSchools,
          totalItems: res.summary.totalStudents,
          withPhoto: res.summary.withPhoto,
          missingPhoto: res.summary.missingPhoto,
        },
      }))
    );
  }

  getBySchoolRaw(params?: { class_year?: string; school_id?: number; missing_only?: boolean }): Observable<StudentsBySchoolResponse> {
    return this.getStudentsBySchool(params);
  }

  bulkPhotoMatch(schoolId: number, year: number, filenames: string[]): Observable<{ success: boolean; data: BulkPhotoMatch[] }> {
    return this.http.post<{ success: boolean; data: BulkPhotoMatch[] }>(`${this.baseUrl}/bulk-photos/match`, {
      school_id: schoolId,
      year,
      filenames,
    });
  }

  bulkPhotoUpload(schoolId: number, year: number, setActive: boolean, assignments: Record<string, number>, photos: File[]): Observable<{ success: boolean; data: { summary: BulkPhotoUploadSummary; results: BulkPhotoUploadResult[] } }> {
    const formData = new FormData();
    formData.append('school_id', schoolId.toString());
    formData.append('year', year.toString());
    formData.append('set_active', setActive ? '1' : '0');
    formData.append('assignments', JSON.stringify(assignments));
    for (const photo of photos) {
      formData.append('photos[]', photo);
    }
    return this.http.post<{ success: boolean; data: { summary: BulkPhotoUploadSummary; results: BulkPhotoUploadResult[] } }>(`${this.baseUrl}/bulk-photos/upload`, formData);
  }
}
