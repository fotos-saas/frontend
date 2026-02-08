import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  WorkflowStep,
  StepData,
  StepDataResponse,
  mapApiPhoto,
  AutoSaveResponse,
} from '../models/workflow.models';
import { WorkflowApiService } from './workflow-api.service';
import { WorkflowSecurityService } from './workflow-security.service';

/**
 * Tablo Workflow Service (FACADE)
 *
 * Felelősség: Orchestration - kombinálja az API és Security service-eket.
 * - Error handling
 * - Response mapping
 * - Business logic
 *
 * State management: A photo-selection.state.ts kezeli!
 *
 * FONTOS: A service a galéria ID-t használja (tabloGalleryId),
 * NEM a workSessionId-t! A workflow a galéria képeivel dolgozik.
 */
@Injectable({
  providedIn: 'root'
})
export class TabloWorkflowService {
  private readonly apiService = inject(WorkflowApiService);
  private readonly securityService = inject(WorkflowSecurityService);

  // === API METHODS (ORCHESTRATION) ===

  /**
   * Step data betöltése (unified endpoint)
   * @param galleryId A galéria ID (tabloGalleryId a projektből)
   * @param step Opcionális lépés
   */
  loadStepData(galleryId: number, step?: WorkflowStep): Observable<StepData> {
    // IDOR védelem - Gallery ID validáció
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    return this.apiService.loadStepData$(galleryId, step).pipe(
      map(response => this.mapStepDataResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Step data betöltése readonly megtekintéshez (finalized workflow)
   * Nem módosítja a workflow state-et, csak az adatokat tölti be
   * @param galleryId A galéria ID
   * @param step A megtekintendő lépés
   */
  loadStepDataForViewing(galleryId: number, step: WorkflowStep): Observable<StepData> {
    // IDOR védelem - Gallery ID validáció
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    return this.apiService.loadStepDataForViewing$(galleryId, step).pipe(
      map(response => this.mapStepDataResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Claiming szelekció mentése (auto-save)
   * @param galleryId A galéria ID
   * @param photoIds Kiválasztott fotó ID-k (lehet szennyezett)
   * @returns Observable with optional cascade_message if photos were removed from later steps
   */
  saveClaimingSelection(galleryId: number, photoIds: number[]): Observable<AutoSaveResponse> {
    // IDOR védelem - Gallery ID validáció
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    // Photo ID-k validálása és tisztítása
    const validatedPhotoIds = this.securityService.sanitizePhotoIds(photoIds);

    if (validatedPhotoIds.length === 0 && photoIds.length > 0) {
      const error = new Error('Érvénytelen fotó azonosítók.');
      return throwError(() => error);
    }

    return this.apiService.saveClaimingSelection$(galleryId, validatedPhotoIds).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Retouch szelekció auto-save
   * @param galleryId A galéria ID
   * @param photoIds Kiválasztott fotó ID-k (lehet szennyezett)
   * @returns Observable with optional cascade_message if tablo was removed
   */
  autoSaveRetouchSelection(galleryId: number, photoIds: number[]): Observable<AutoSaveResponse> {
    // IDOR védelem - Gallery ID validáció
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    // Photo ID-k validálása és tisztítása
    const validatedPhotoIds = this.securityService.sanitizePhotoIds(photoIds);

    if (validatedPhotoIds.length === 0 && photoIds.length > 0) {
      const error = new Error('Érvénytelen fotó azonosítók.');
      return throwError(() => error);
    }

    return this.apiService.autoSaveRetouchSelection$(galleryId, validatedPhotoIds).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Tablo szelekció auto-save
   * @param galleryId A galéria ID
   * @param photoId Kiválasztott fotó ID
   */
  autoSaveTabloSelection(galleryId: number, photoId: number): Observable<void> {
    // IDOR védelem - Gallery ID validáció
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    // Photo ID validálása
    if (!this.securityService.isValidPhotoId(photoId)) {
      const error = new Error('Érvénytelen fotó azonosító.');
      return throwError(() => error);
    }

    return this.apiService.autoSaveTabloSelection$(galleryId, photoId).pipe(
      map(() => void 0),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Tablo kijelölés törlése (null-ra állítja)
   * @param galleryId A galéria ID
   */
  clearTabloSelection(galleryId: number): Observable<void> {
    // IDOR védelem - Gallery ID validáció
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    return this.apiService.clearTabloSelection$(galleryId).pipe(
      map(() => void 0),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Tablo véglegesítés (workflow befejezése)
   * @param galleryId A galéria ID
   * @param photoId Kiválasztott fotó ID
   */
  finalizeTabloSelection(galleryId: number, photoId: number): Observable<void> {
    // IDOR védelem - Gallery ID validáció
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    // Photo ID validálása
    if (!this.securityService.isValidPhotoId(photoId)) {
      const error = new Error('Érvénytelen fotó azonosító.');
      return throwError(() => error);
    }

    return this.apiService.finalizeTabloSelection$(galleryId, photoId).pipe(
      map(() => void 0),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Következő lépésre váltás (backend-driven)
   * Backend most már teljes step adatot ad vissza (StepDataResponse formátum)
   * @param galleryId A galéria ID
   */
  nextStep(galleryId: number): Observable<StepData> {
    // IDOR védelem - Gallery ID validáció
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    return this.apiService.nextStep$(galleryId).pipe(
      map(response => this.mapStepDataResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Előző lépésre váltás (backend-driven)
   * Backend most már teljes step adatot ad vissza (StepDataResponse formátum)
   * @param galleryId A galéria ID
   */
  previousStep(galleryId: number): Observable<StepData> {
    // IDOR védelem - Gallery ID validáció
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    return this.apiService.previousStep$(galleryId).pipe(
      map(response => this.mapStepDataResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Adott lépésre ugrás (backward navigation)
   * Backend most már teljes step adatot ad vissza (StepDataResponse formátum)
   * @param galleryId A galéria ID
   * @param targetStep Cél lépés
   */
  moveToStep(galleryId: number, targetStep: WorkflowStep): Observable<StepData> {
    // IDOR védelem - Gallery ID validáció
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    return this.apiService.moveToStep$(galleryId, targetStep).pipe(
      map(response => this.mapStepDataResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Módosítás kérelem (un-finalize workflow)
   * @param galleryId A galéria ID
   */
  requestModification(galleryId: number): Observable<{ success: boolean; was_free: boolean; message: string }> {
    try {
      this.securityService.validateGalleryAccess(galleryId);
    } catch (error) {
      return throwError(() => error);
    }

    return this.apiService.requestModification$(galleryId).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // === PRIVATE HELPERS ===

  /**
   * API response mapping - WorkflowPhoto objektumok létrehozása
   */
  private mapStepDataResponse(response: StepDataResponse): StepData {
    return {
      ...response,
      visible_photos: (response.visible_photos || []).map(mapApiPhoto),
      review_groups: response.review_groups,
      modification_info: response.modification_info,
    };
  }

  /**
   * Centralizált hiba kezelés
   * Mapeli a backend hibákat felhasználóbarát üzenetekké
   */
  private handleError(error: HttpErrorResponse | Error | unknown): Observable<never> {
    let message = 'Hiba történt. Kérlek próbáld újra!';

    // Handle HttpErrorResponse
    if (error && typeof error === 'object' && 'status' in error) {
      const httpError = error as HttpErrorResponse;
      if (httpError.error?.message) {
        message = httpError.error.message;
      } else if (httpError.status === 0) {
        message = 'Nincs internetkapcsolat.';
      } else if (httpError.status === 401) {
        message = 'Nincs jogosultságod ehhez a művelethez.';
      } else if (httpError.status === 403) {
        message = 'A megrendelés már véglegesítve lett.';
      } else if (httpError.status === 404) {
        message = 'A keresett adat nem található.';
      }
    } else if (error instanceof Error) {
      // Handle regular Error objects
      message = error.message || message;
    }

    return throwError(() => new Error(message));
  }
}
