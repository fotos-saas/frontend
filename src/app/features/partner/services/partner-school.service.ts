import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  SchoolItem,
  SchoolListItem,
  SchoolLimits,
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
  }): Observable<PaginatedResponse<SchoolListItem> & { limits?: SchoolLimits }> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);

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
   * Iskola törlése
   */
  deleteSchool(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/schools/${id}`,
    );
  }
}
