import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  WorkflowStep,
  StepDataResponse,
  AutoSaveResponse,
} from '../models/workflow.models';

/**
 * API Endpoints
 * Backend uses /api/tablo/ prefix for workflow endpoints
 */
const WORKFLOW_API = {
  stepData: (sessionId: number) => `${environment.apiUrl}/tablo/step-data/${sessionId}`,
  claiming: `${environment.apiUrl}/tablo/claiming`,
  retouchAutoSave: `${environment.apiUrl}/tablo/retouch/auto-save`,
  tabloAutoSave: `${environment.apiUrl}/tablo/tablo/auto-save`,
  tabloClear: `${environment.apiUrl}/tablo/tablo/clear`,
  tablo: `${environment.apiUrl}/tablo/tablo`,
  finalize: `${environment.apiUrl}/tablo/workflow/finalize`,
  requestModification: `${environment.apiUrl}/tablo/workflow/request-modification`,
  nextStep: `${environment.apiUrl}/tablo/next-step`,
  previousStep: `${environment.apiUrl}/tablo/previous-step`,
  moveToStep: `${environment.apiUrl}/tablo/move-to-step`,
};

/**
 * Workflow API Service
 *
 * Felelősség: CSAK HTTP API hívások, response mapping nélkül.
 * Tiszta HTTP kommunikáció a backend TabloWorkflowController-rel.
 *
 * NEM tartalmaz:
 * - State management (signals)
 * - Security validáció (külön service)
 * - Error handling (facade végzi)
 * - Response mapping (facade végzi)
 */
@Injectable({
  providedIn: 'root'
})
export class WorkflowApiService {
  private readonly http = inject(HttpClient);

  /**
   * Step data betöltése (unified endpoint)
   * @param galleryId A galéria ID (tabloGalleryId a projektből)
   * @param step Opcionális lépés (ha nincs megadva, aktuális lépés jön vissza)
   */
  loadStepData$(galleryId: number, step?: WorkflowStep): Observable<StepDataResponse> {
    let url = WORKFLOW_API.stepData(galleryId);
    if (step) {
      url += `?step=${step}`;
    }
    return this.http.get<StepDataResponse>(url);
  }

  /**
   * Step data betöltése readonly megtekintéshez (finalized workflow)
   * @param galleryId A galéria ID
   * @param step A megtekintendő lépés
   */
  loadStepDataForViewing$(galleryId: number, step: WorkflowStep): Observable<StepDataResponse> {
    const url = `${WORKFLOW_API.stepData(galleryId)}?step=${step}&readonly=true`;
    return this.http.get<StepDataResponse>(url);
  }

  /**
   * Claiming szelekció mentése (auto-save)
   * @param galleryId A galéria ID
   * @param photoIds Kiválasztott fotó ID-k (tisztított)
   */
  saveClaimingSelection$(galleryId: number, photoIds: number[]): Observable<AutoSaveResponse> {
    return this.http.post<AutoSaveResponse>(WORKFLOW_API.claiming, {
      workSessionId: galleryId, // Backend még workSessionId-t vár
      photoIds,
    });
  }

  /**
   * Retouch szelekció auto-save
   * @param galleryId A galéria ID
   * @param photoIds Kiválasztott fotó ID-k (tisztított)
   */
  autoSaveRetouchSelection$(galleryId: number, photoIds: number[]): Observable<AutoSaveResponse> {
    return this.http.post<AutoSaveResponse>(WORKFLOW_API.retouchAutoSave, {
      workSessionId: galleryId, // Backend még workSessionId-t vár
      photoIds,
    });
  }

  /**
   * Tablo szelekció auto-save
   * @param galleryId A galéria ID
   * @param photoId Kiválasztott fotó ID (tisztított)
   */
  autoSaveTabloSelection$(galleryId: number, photoId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(WORKFLOW_API.tabloAutoSave, {
      workSessionId: galleryId, // Backend még workSessionId-t vár
      photoId,
    });
  }

  /**
   * Tablo kijelölés törlése (null-ra állítja a tablo_media_id-t)
   * @param galleryId A galéria ID
   */
  clearTabloSelection$(galleryId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(WORKFLOW_API.tabloClear, {
      workSessionId: galleryId, // Backend még workSessionId-t vár
    });
  }

  /**
   * Tablo véglegesítés (workflow befejezése)
   * @param galleryId A galéria ID
   * @param photoId Kiválasztott fotó ID (tisztított)
   */
  finalizeTabloSelection$(galleryId: number, photoId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(WORKFLOW_API.finalize, {
      workSessionId: galleryId, // Backend még workSessionId-t vár
    });
  }

  /**
   * Módosítás kérelem (un-finalize workflow)
   * @param galleryId A galéria ID
   */
  requestModification$(galleryId: number): Observable<{ success: boolean; was_free: boolean; message: string }> {
    return this.http.post<{ success: boolean; was_free: boolean; message: string }>(
      WORKFLOW_API.requestModification,
      { workSessionId: galleryId }
    );
  }

  /**
   * Következő lépésre váltás (backend-driven)
   * @param galleryId A galéria ID
   */
  nextStep$(galleryId: number): Observable<StepDataResponse> {
    return this.http.post<StepDataResponse>(WORKFLOW_API.nextStep, {
      workSessionId: galleryId, // Backend még workSessionId-t vár
    });
  }

  /**
   * Előző lépésre váltás (backend-driven)
   * @param galleryId A galéria ID
   */
  previousStep$(galleryId: number): Observable<StepDataResponse> {
    return this.http.post<StepDataResponse>(WORKFLOW_API.previousStep, {
      workSessionId: galleryId, // Backend még workSessionId-t vár
    });
  }

  /**
   * Adott lépésre ugrás (backward navigation)
   * @param galleryId A galéria ID
   * @param targetStep Cél lépés
   */
  moveToStep$(galleryId: number, targetStep: WorkflowStep): Observable<StepDataResponse> {
    return this.http.post<StepDataResponse>(WORKFLOW_API.moveToStep, {
      workSessionId: galleryId, // Backend még workSessionId-t vár
      targetStep,
    });
  }
}
