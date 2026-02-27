import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
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
   * Csoport tagok lekérése (lazy load chevron kattintásra)
   */
  getGroupMembers(linkedGroup: string): Observable<SchoolListItem[]> {
    return this.http.get<SchoolListItem[]>(
      `${this.baseUrl}/schools/group/${linkedGroup}`,
    );
  }

  /**
   * Összes iskola lekérése (projekt létrehozáshoz / autocomplete)
   */
  getAllSchools(search?: string): Observable<SchoolItem[]> {
    const httpParams = buildHttpParams({ search });
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
    const httpParams = buildHttpParams({
      page: params?.page,
      per_page: params?.per_page,
      search: params?.search,
      graduation_year: params?.graduation_year,
    });

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
    const httpParams = buildHttpParams({ per_page: params?.per_page });

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
