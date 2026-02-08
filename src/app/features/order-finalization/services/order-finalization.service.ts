import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OrderFinalizationData,
  FileUploadResponse,
  FinalizeOrderResponse,
  PreviewPdfResponse,
  FinalizationDataResponse,
  SaveFinalizationRequest,
  EMPTY_ORDER_FINALIZATION_DATA,
  SortType,
  SORT_TYPE_OPTIONS,
  TeacherResolution
} from '../models/order-finalization.models';

/**
 * Order Finalization Service
 * API hívások a megrendelés véglegesítéshez
 * Konzisztens az api.tablostudio.hu mezőneveivel
 */
@Injectable({
  providedIn: 'root'
})
export class OrderFinalizationService {

  private readonly baseUrl = `${environment.apiUrl}/tablo-frontend`;

  /** Érvényes sortType értékek */
  private readonly validSortTypes = SORT_TYPE_OPTIONS.map(o => o.value);

  constructor(private http: HttpClient) {}

  /**
   * Ellenőrzi, hogy a sortType érvényes érték-e
   * Ha nem (régi adat pl. "mindenki befele nézzen"), visszaadja az alapértelmezett 'abc'-t
   */
  private sanitizeSortType(value: string | null | undefined): SortType {
    if (!value) return 'abc';
    return this.validSortTypes.includes(value as SortType)
      ? (value as SortType)
      : 'abc';
  }

  /**
   * Meglévő véglegesítési adatok lekérése (kapcsolattartó prefill-hez)
   */
  getExistingData(): Observable<FinalizationDataResponse> {
    return this.http.get<FinalizationDataResponse>(
      `${this.baseUrl}/finalization`
    );
  }

  /**
   * API válasz konvertálása frontend form modellre
   */
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
        acceptTerms: false, // Mindig újra el kell fogadni
        teacherResolutions: d.teacherResolutions || undefined
      }
    };
  }

  /**
   * Frontend form modell konvertálása API request-re
   */
  mapFormDataToRequest(data: OrderFinalizationData): SaveFinalizationRequest {
    return {
      // Step 1
      name: data.contact.name,
      contactEmail: data.contact.email,
      contactPhone: data.contact.phone,

      // Step 2
      schoolName: data.basicInfo.schoolName,
      schoolCity: data.basicInfo.city || undefined,
      className: data.basicInfo.className,
      classYear: data.basicInfo.classYear,
      quote: data.basicInfo.quote || undefined,

      // Step 3
      fontFamily: data.design.fontFamily || undefined,
      color: data.design.fontColor || undefined,
      description: data.design.description || undefined,

      // Step 4
      sortType: data.roster.sortType || undefined,
      studentDescription: data.roster.studentRoster,
      teacherDescription: data.roster.teacherRoster,
      teacherResolutions: data.roster.teacherResolutions,
      acceptTerms: data.roster.acceptTerms
    };
  }

  /**
   * Megrendelés véglegesítése (mentés)
   */
  finalizeOrder(data: OrderFinalizationData): Observable<FinalizeOrderResponse> {
    const request = this.mapFormDataToRequest(data);
    return this.http.post<FinalizeOrderResponse>(
      `${this.baseUrl}/finalization`,
      request
    );
  }

  /**
   * Fájl feltöltése (háttérkép vagy csatolmány)
   */
  uploadFile(file: File, type: 'background' | 'attachment'): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.http.post<FileUploadResponse>(
      `${this.baseUrl}/finalization/upload`,
      formData
    );
  }

  /**
   * Feltöltött fájl törlése
   */
  deleteFile(fileId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.baseUrl}/finalization/file`,
      { body: { fileId } }
    );
  }

  /**
   * Auto-save draft (automatikus piszkozat mentés)
   * Debounced mentés - nem követeli meg az összes kötelező mezőt
   */
  autoSaveDraft(data: OrderFinalizationData): Observable<{ success: boolean }> {
    const request = this.mapFormDataToRequest(data);
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/finalization/draft`,
      request
    );
  }

  /**
   * PDF előnézet generálása
   * A form részleges adataival is működik
   */
  generatePreviewPdf(data: Partial<OrderFinalizationData>): Observable<PreviewPdfResponse> {
    // Ha van data, konvertáljuk API formátumra
    const request = data ? {
      name: data.contact?.name,
      contactEmail: data.contact?.email,
      contactPhone: data.contact?.phone,
      schoolName: data.basicInfo?.schoolName,
      schoolCity: data.basicInfo?.city,
      className: data.basicInfo?.className,
      classYear: data.basicInfo?.classYear,
      quote: data.basicInfo?.quote,
      fontFamily: data.design?.fontFamily,
      color: data.design?.fontColor,
      description: data.design?.description,
      sortType: data.roster?.sortType,
      studentDescription: data.roster?.studentRoster,
      teacherDescription: data.roster?.teacherRoster
    } : {};

    return this.http.post<PreviewPdfResponse>(
      `${this.baseUrl}/finalization/preview-pdf`,
      request
    );
  }
}
