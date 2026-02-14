import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TeacherListItem,
  TeacherDetail,
  TeacherPhoto,
  TeacherChangeLogEntry,
  TeacherLinkedGroup,
  CreateTeacherRequest,
  UpdateTeacherRequest,
  BulkImportPreviewItem,
  BulkImportExecuteItem,
  BulkImportExecuteResult,
  TeachersBySchoolResponse,
  SyncTeacherRequest,
  SyncPreviewResponse,
  SyncExecuteResponse,
} from '../models/teacher.models';
import { PaginatedResponse } from '../models/partner.models';
import {
  ArchiveService,
  ArchiveBySchoolResponse,
  ArchiveBulkImportPreviewItem,
  ArchiveBulkImportExecuteItem,
  ArchiveBulkImportExecuteResult,
  BulkPhotoMatch,
  BulkPhotoUploadSummary,
  BulkPhotoUploadResult,
} from '../models/archive.models';

@Injectable({
  providedIn: 'root',
})
export class PartnerTeacherService implements ArchiveService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/teachers`;

  getTeachers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    school_id?: number;
    class_year?: string;
  }): Observable<PaginatedResponse<TeacherListItem>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.school_id) httpParams = httpParams.set('school_id', params.school_id.toString());
    if (params?.class_year) httpParams = httpParams.set('class_year', params.class_year);

    return this.http.get<PaginatedResponse<TeacherListItem>>(this.baseUrl, { params: httpParams });
  }

  getTeachersBySchool(params?: {
    class_year?: string;
    school_id?: number;
    missing_only?: boolean;
  }): Observable<TeachersBySchoolResponse> {
    let httpParams = new HttpParams();
    if (params?.class_year) httpParams = httpParams.set('class_year', params.class_year);
    if (params?.school_id) httpParams = httpParams.set('school_id', params.school_id.toString());
    if (params?.missing_only) httpParams = httpParams.set('missing_only', '1');

    return this.http.get<TeachersBySchoolResponse>(`${this.baseUrl}/by-project`, { params: httpParams });
  }

  getClassYears(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/class-years`);
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

  markNoPhoto(teacherId: number): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${teacherId}/mark-no-photo`, {});
  }

  undoNoPhoto(teacherId: number): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${teacherId}/undo-no-photo`, {});
  }

  getChangelog(teacherId: number, params?: { page?: number; per_page?: number }): Observable<PaginatedResponse<TeacherChangeLogEntry>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginatedResponse<TeacherChangeLogEntry>>(`${this.baseUrl}/${teacherId}/changelog`, { params: httpParams });
  }

  bulkImportPreview(schoolId: number, names: string[]): Observable<{ success: boolean; data: ArchiveBulkImportPreviewItem[] }> {
    return this.http.post<{ success: boolean; data: BulkImportPreviewItem[] }>(`${this.baseUrl}/bulk-import/preview`, {
      school_id: schoolId,
      names,
    }).pipe(map(res => ({
      ...res,
      data: res.data.map(item => ({ ...item, matchId: item.teacherId, matchName: item.teacherName })),
    })));
  }

  bulkImportPreviewFile(schoolId: number, file: File): Observable<{ success: boolean; data: ArchiveBulkImportPreviewItem[] }> {
    const formData = new FormData();
    formData.append('school_id', schoolId.toString());
    formData.append('file', file);
    return this.http.post<{ success: boolean; data: BulkImportPreviewItem[] }>(`${this.baseUrl}/bulk-import/preview`, formData).pipe(
      map(res => ({
        ...res,
        data: res.data.map(item => ({ ...item, matchId: item.teacherId, matchName: item.teacherName })),
      }))
    );
  }

  bulkImportExecute(schoolId: number, items: ArchiveBulkImportExecuteItem[]): Observable<{ success: boolean; message: string; data: ArchiveBulkImportExecuteResult }> {
    const mappedItems: BulkImportExecuteItem[] = items.map(i => ({
      input_name: i.input_name,
      action: i.action,
      teacher_id: i.match_id,
    }));
    return this.http.post<{ success: boolean; message: string; data: BulkImportExecuteResult }>(`${this.baseUrl}/bulk-import/execute`, {
      school_id: schoolId,
      items: mappedItems,
    });
  }

  previewSync(request: SyncTeacherRequest): Observable<{ success: boolean; data: SyncPreviewResponse }> {
    return this.http.post<{ success: boolean; data: SyncPreviewResponse }>(`${this.baseUrl}/sync-to-project/preview`, request);
  }

  executeSync(request: SyncTeacherRequest): Observable<{ success: boolean; message: string; data: SyncExecuteResponse }> {
    return this.http.post<{ success: boolean; message: string; data: SyncExecuteResponse }>(`${this.baseUrl}/sync-to-project/execute`, request);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export-csv`, { responseType: 'blob' });
  }

  syncCrossSchool(archiveId: number): Observable<{ success: boolean; message: string; data: { photoThumbUrl: string; photoUrl: string } }> {
    return this.http.post<{ success: boolean; message: string; data: { photoThumbUrl: string; photoUrl: string } }>(
      `${this.baseUrl}/${archiveId}/sync-cross-school`,
      {}
    );
  }

  // ============ Teacher Linking (Tanár összekapcsolás) ============

  linkTeachers(teacherIds: number[]): Observable<{ success: boolean; message: string; data: { linkedGroup: string } }> {
    return this.http.post<{ success: boolean; message: string; data: { linkedGroup: string } }>(
      `${this.baseUrl}/link`,
      { teacher_ids: teacherIds }
    );
  }

  unlinkTeacher(teacherId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${teacherId}/unlink`);
  }

  getLinkedGroups(): Observable<{ data: TeacherLinkedGroup[] }> {
    return this.http.get<{ data: TeacherLinkedGroup[] }>(`${this.baseUrl}/linked-groups`);
  }

  // ============ ArchiveService adapter metódusok ============

  uploadPhoto(id: number, file: File, year: number, setActive = false): Observable<any> {
    return this.uploadTeacherPhoto(id, file, year, setActive);
  }

  getArchive(id: number): Observable<{ success: boolean; data: any }> {
    return this.getTeacher(id);
  }

  createArchive(payload: any): Observable<{ success: boolean; message: string; data: any }> {
    return this.createTeacher(payload);
  }

  updateArchive(id: number, payload: any): Observable<{ success: boolean; message: string; data: any }> {
    return this.updateTeacher(id, payload);
  }

  getBySchool(params?: { class_year?: string; school_id?: number; missing_only?: boolean }): Observable<ArchiveBySchoolResponse> {
    return this.getTeachersBySchool(params).pipe(
      map(res => ({
        schools: res.schools.map(s => ({
          schoolId: s.schoolId,
          schoolName: s.schoolName,
          classes: s.classes,
          classCount: s.classCount,
          itemCount: s.teacherCount,
          missingPhotoCount: s.missingPhotoCount,
          syncAvailable: s.syncAvailable,
          hasTeacherPersons: s.hasTeacherPersons,
          items: s.teachers.map(t => ({
            archiveId: t.archiveId,
            name: t.name,
            hasPhoto: t.hasPhoto,
            hasSyncablePhoto: t.hasSyncablePhoto,
            noPhotoMarked: t.noPhotoMarked,
            photoThumbUrl: t.photoThumbUrl,
            photoUrl: t.photoUrl,
            photoFileName: t.photoFileName,
            photoTakenAt: t.photoTakenAt,
          })),
        })),
        summary: {
          totalSchools: res.summary.totalSchools,
          totalItems: res.summary.totalTeachers,
          withPhoto: res.summary.withPhoto,
          missingPhoto: res.summary.missingPhoto,
        },
      }))
    );
  }

  getBySchoolRaw(params?: { class_year?: string; school_id?: number; missing_only?: boolean }): Observable<TeachersBySchoolResponse> {
    return this.getTeachersBySchool(params);
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
