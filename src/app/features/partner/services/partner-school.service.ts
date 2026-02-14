import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  SchoolItem,
  SchoolListItem,
  SchoolLimits,
  SchoolDetail,
  SchoolChangeLogEntry,
  CreateSchoolRequest,
  PaginatedResponse,
} from '../models/partner.models';

/**
 * Iskola kezelés service.
 * Iskolák CRUD, autocomplete, limitek.
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerSchoolService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /**
   * Összes iskola lekérése (projekt létrehozáshoz / autocomplete)
   */
  getAllSchools(search?: string): Observable<SchoolItem[]> {
    let httpParams = new HttpParams();
    if (search) {
      httpParams = httpParams.set('search', search);
    }
    return this.http.get<SchoolItem[]>(
      `${this.baseUrl}/schools/all`,
      { params: httpParams },
    );
  }

  /**
   * Új iskola létrehozása
   */
  createSchool(data: CreateSchoolRequest): Observable<{
    success: boolean;
    message: string;
    data: SchoolItem;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: SchoolItem;
    }>(`${this.baseUrl}/schools`, data);
  }

  /**
   * Partner iskoláinak lekérése (paginált)
   */
  getSchools(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    graduation_year?: number;
  }): Observable<PaginatedResponse<SchoolListItem> & { limits?: SchoolLimits }> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.graduation_year) httpParams = httpParams.set('graduation_year', params.graduation_year.toString());

    return this.http.get<PaginatedResponse<SchoolListItem> & { limits?: SchoolLimits }>(
      `${this.baseUrl}/schools`,
      { params: httpParams },
    );
  }

  /**
   * Iskola módosítása
   */
  updateSchool(id: number, data: { name?: string; city?: string | null }): Observable<{
    success: boolean;
    message: string;
    data: SchoolItem;
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: SchoolItem;
    }>(`${this.baseUrl}/schools/${id}`, data);
  }

  /**
   * Iskola részletek lekérése
   */
  getSchool(id: number): Observable<{ data: SchoolDetail }> {
    return this.http.get<{ data: SchoolDetail }>(
      `${this.baseUrl}/schools/${id}/detail`,
    );
  }

  /**
   * Iskola changelog lekérése
   */
  getChangelog(id: number, params?: { per_page?: number }): Observable<PaginatedResponse<SchoolChangeLogEntry>> {
    let httpParams = new HttpParams();
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginatedResponse<SchoolChangeLogEntry>>(
      `${this.baseUrl}/schools/${id}/changelog`,
      { params: httpParams },
    );
  }

  /**
   * Iskola törlése
   */
  deleteSchool(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/schools/${id}`,
    );
  }

  /**
   * Iskolák összekapcsolása
   */
  linkSchools(schoolIds: number[]): Observable<{ success: boolean; message: string; linkedGroup: string }> {
    return this.http.post<{ success: boolean; message: string; linkedGroup: string }>(
      `${this.baseUrl}/schools/link`,
      { school_ids: schoolIds },
    );
  }

  /**
   * Iskola leválasztása csoportról
   */
  unlinkSchool(schoolId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/schools/${schoolId}/unlink`,
    );
  }

  /**
   * Tanári aktív fotók ZIP letöltése iskolához (blob)
   */
  downloadTeacherPhotosZip(schoolId: number, fileNaming: string, allProjects = false): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/schools/${schoolId}/download-teacher-photos`,
      { file_naming: fileNaming, ...(allProjects ? { all_projects: true } : {}) },
      { responseType: 'blob' },
    );
  }

  /**
   * Összekapcsolt csoportok lekérése
   */
  getLinkedGroups(): Observable<{ data: Array<{ linkedGroup: string; schools: SchoolItem[] }> }> {
    return this.http.get<{ data: Array<{ linkedGroup: string; schools: SchoolItem[] }> }>(
      `${this.baseUrl}/schools/linked-groups`,
    );
  }
}
