import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
import {
  ProjectContact,
  ContactListItem,
  ContactLimits,
  PaginatedResponse,
} from '../models/partner.models';

/**
 * Kapcsolattartó kezelés service.
 * Projekt kontaktok + standalone kontaktok CRUD.
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerContactService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  // ============================================
  // PROJEKT KONTAKTOK (autocomplete + CRUD)
  // ============================================

  /**
   * Összes kapcsolattartó lekérése (projekt létrehozáshoz)
   */
  getAllContacts(search?: string): Observable<ProjectContact[]> {
    const httpParams = buildHttpParams({ search });
    return this.http.get<ProjectContact[]>(
      `${this.baseUrl}/contacts/all`,
      { params: httpParams },
    );
  }

  /**
   * Kapcsolattartó hozzáadása projekthez
   */
  addContact(projectId: number, contact: {
    name: string;
    email?: string | null;
    phone?: string | null;
    isPrimary?: boolean;
  }): Observable<{ success: boolean; message: string; data: ProjectContact }> {
    return this.http.post<{ success: boolean; message: string; data: ProjectContact }>(
      `${this.baseUrl}/projects/${projectId}/contacts`,
      contact,
    );
  }

  /**
   * Kapcsolattartó módosítása
   */
  updateContact(projectId: number, contactId: number, contact: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    isPrimary?: boolean;
  }): Observable<{ success: boolean; message: string; data: ProjectContact }> {
    return this.http.put<{ success: boolean; message: string; data: ProjectContact }>(
      `${this.baseUrl}/projects/${projectId}/contacts/${contactId}`,
      contact,
    );
  }

  /**
   * Kapcsolattartó törlése projektből
   */
  deleteContact(projectId: number, contactId: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/contacts/${contactId}`,
    );
  }

  // ============================================
  // STANDALONE KONTAKTOK (partner szintű)
  // ============================================

  /**
   * Partner kapcsolattartóinak lekérése (paginált, limitekkel)
   */
  getContacts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Observable<PaginatedResponse<ContactListItem> & { limits?: ContactLimits }> {
    const httpParams = buildHttpParams({
      page: params?.page,
      per_page: params?.per_page,
      search: params?.search,
    });

    return this.http.get<PaginatedResponse<ContactListItem> & { limits?: ContactLimits }>(
      `${this.baseUrl}/contacts`,
      { params: httpParams },
    );
  }

  /**
   * Új kapcsolattartó létrehozása (opcionálisan projektekhez kötve)
   */
  createStandaloneContact(data: {
    name: string;
    email?: string | null;
    phone?: string | null;
    note?: string | null;
    project_id?: number | null;
    project_ids?: number[];
  }): Observable<{ success: boolean; message: string; data: ContactListItem }> {
    return this.http.post<{ success: boolean; message: string; data: ContactListItem }>(
      `${this.baseUrl}/contacts`,
      data,
    );
  }

  /**
   * Kapcsolattartó módosítása (projekt ID-k is módosíthatók)
   */
  updateStandaloneContact(id: number, data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    note?: string | null;
    project_id?: number | null;
    project_ids?: number[];
  }): Observable<{ success: boolean; message: string; data: ContactListItem }> {
    return this.http.put<{ success: boolean; message: string; data: ContactListItem }>(
      `${this.baseUrl}/contacts/${id}`,
      data,
    );
  }

  /**
   * Kapcsolattartó törlése
   */
  deleteStandaloneContact(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/contacts/${id}`,
    );
  }

  // ============================================
  // EXPORT / IMPORT
  // ============================================

  /**
   * Kapcsolattartók exportálása Excel-be
   */
  exportExcel(search?: string): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/contacts/export-excel`,
      { search: search || null },
      { responseType: 'blob' },
    );
  }

  /**
   * Kapcsolattartók exportálása vCard (.vcf) formátumba
   */
  exportVcard(search?: string): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/contacts/export-vcard`,
      { search: search || null },
      { responseType: 'blob' },
    );
  }

  /**
   * Kapcsolattartók importálása Excel fájlból
   */
  importExcel(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImportResult>(
      `${this.baseUrl}/contacts/import-excel`,
      formData,
    );
  }
}

export interface ImportResult {
  success: boolean;
  message: string;
  data: {
    imported: number;
    skipped: number;
    errors: number;
    details: string[];
  };
}
