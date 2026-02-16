import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OrderFinalizationData,
  FileUploadResponse,
  FinalizeOrderResponse,
  FinalizationDataResponse,
  SORT_TYPE_OPTIONS,
  SortType,
  EMPTY_ORDER_FINALIZATION_DATA,
} from '../../order-finalization/models/order-finalization.models';

/**
 * Partner Finalization API Service
 * Partner oldalról használja a megrendelés leadását.
 * URL: /partner/projects/{id}/order-wizard
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerFinalizationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner/projects`;

  private readonly validSortTypes = SORT_TYPE_OPTIONS.map(o => o.value);

  private sanitizeSortType(value: string | null | undefined): SortType {
    if (!value) return 'abc';
    return this.validSortTypes.includes(value as SortType)
      ? (value as SortType)
      : 'abc';
  }

  getFinalizationData(projectId: number): Observable<FinalizationDataResponse> {
    return this.http.get<FinalizationDataResponse>(
      `${this.baseUrl}/${projectId}/order-wizard`
    );
  }

  mapResponseToFormData(response: FinalizationDataResponse): OrderFinalizationData {
    if (!response.success || !response.data) {
      return { ...EMPTY_ORDER_FINALIZATION_DATA };
    }

    const d = response.data;
    return {
      contact: {
        name: d.name || '',
        email: d.contactEmail || '',
        phone: d.contactPhone || ''
      },
      basicInfo: {
        schoolName: d.schoolName || '',
        city: d.schoolCity || '',
        className: d.className || '',
        classYear: d.classYear || '',
        quote: d.quote || ''
      },
      design: {
        fontFamily: d.fontFamily || '',
        fontColor: d.color || '#000000',
        description: d.description || '',
        backgroundImageId: d.background || null,
        attachmentIds: d.otherFile ? [d.otherFile] : []
      },
      roster: {
        studentRoster: d.studentDescription || '',
        teacherRoster: d.teacherDescription || '',
        sortType: this.sanitizeSortType(d.sortType),
        acceptTerms: false,
        teacherResolutions: d.teacherResolutions || undefined
      }
    };
  }

  finalizeOrder(projectId: number, data: OrderFinalizationData): Observable<FinalizeOrderResponse> {
    const request = this.mapFormDataToRequest(data);
    return this.http.post<FinalizeOrderResponse>(
      `${this.baseUrl}/${projectId}/order-wizard`,
      request
    );
  }

  uploadFile(projectId: number, file: File, type: 'background' | 'attachment'): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.http.post<FileUploadResponse>(
      `${this.baseUrl}/${projectId}/order-wizard/upload`,
      formData
    );
  }

  deleteFile(projectId: number, fileId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.baseUrl}/${projectId}/order-wizard/file`,
      { body: { fileId } }
    );
  }

  autoSaveDraft(projectId: number, data: OrderFinalizationData): Observable<{ success: boolean }> {
    const request = this.mapFormDataToRequest(data);
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/${projectId}/order-wizard/draft`,
      request
    );
  }

  private mapFormDataToRequest(data: OrderFinalizationData): Record<string, unknown> {
    return {
      name: data.contact.name,
      contactEmail: data.contact.email,
      contactPhone: data.contact.phone,
      schoolName: data.basicInfo.schoolName,
      schoolCity: data.basicInfo.city || undefined,
      className: data.basicInfo.className,
      classYear: data.basicInfo.classYear,
      quote: data.basicInfo.quote || undefined,
      fontFamily: data.design.fontFamily || undefined,
      color: data.design.fontColor || undefined,
      description: data.design.description || undefined,
      sortType: data.roster.sortType || undefined,
      studentDescription: data.roster.studentRoster || undefined,
      teacherDescription: data.roster.teacherRoster || undefined,
      teacherResolutions: data.roster.teacherResolutions,
    };
  }
}
