import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { concatMap, scan, map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  GalleryResponse,
  CreateGalleryResponse,
  GalleryPhoto,
  GalleryProgress,
} from '../models/gallery.models';
import { MonitoringResponse } from '../models/gallery-monitoring.models';

/**
 * Galéria kezelés service.
 * Galéria CRUD, fotó feltöltés (chunk), progress.
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerGalleryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /** Chunk méret - hány kép kerüljön egy batch-be */
  private readonly CHUNK_SIZE = 10;

  /**
   * Galéria lekérése projekthez
   */
  getGallery(projectId: number): Observable<GalleryResponse> {
    return this.http.get<GalleryResponse>(
      `${this.baseUrl}/projects/${projectId}/gallery`,
    );
  }

  /**
   * Galéria létrehozása/lekérése projekthez
   */
  createGallery(projectId: number): Observable<CreateGalleryResponse> {
    return this.http.post<CreateGalleryResponse>(
      `${this.baseUrl}/projects/${projectId}/gallery`,
      {},
    );
  }

  /**
   * Fotók feltöltése galériába
   */
  uploadGalleryPhotos(projectId: number, files: File[]): Observable<{
    success: boolean;
    message: string;
    uploadedCount: number;
    photos: GalleryPhoto[];
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));

    return this.http.post<{
      success: boolean;
      message: string;
      uploadedCount: number;
      photos: GalleryPhoto[];
    }>(`${this.baseUrl}/projects/${projectId}/gallery/photos`, formData);
  }

  /**
   * Fotók feltöltése galériába CHUNKED módon
   */
  uploadGalleryPhotosChunked(projectId: number, files: File[]): Observable<{
    uploadedCount: number;
    totalCount: number;
    photos: GalleryPhoto[];
    currentChunk: number;
    totalChunks: number;
    progress: number;
    completed: boolean;
    errorCount: number;
  }> {
    const totalCount = files.length;
    const chunks = this.chunkArray(files, this.CHUNK_SIZE);
    const totalChunks = chunks.length;

    const initialState = {
      uploadedCount: 0,
      totalCount,
      photos: [] as GalleryPhoto[],
      currentChunk: 0,
      totalChunks,
      progress: 0,
      completed: false,
      errorCount: 0,
    };

    if (files.length === 0) {
      return of({ ...initialState, completed: true, progress: 100 });
    }

    return from(chunks.map((chunk, index) => ({ chunk, index }))).pipe(
      concatMap(({ chunk, index }) => {
        const formData = new FormData();
        chunk.forEach(file => formData.append('photos[]', file));

        return this.http.post<{
          success: boolean;
          uploadedCount: number;
          photos: GalleryPhoto[];
        }>(`${this.baseUrl}/projects/${projectId}/gallery/photos`, formData).pipe(
          map(result => ({
            chunkIndex: index,
            uploadedCount: result.uploadedCount,
            photos: result.photos,
            error: false,
          })),
          catchError(() => of({
            chunkIndex: index,
            uploadedCount: 0,
            photos: [] as GalleryPhoto[],
            error: true,
          })),
        );
      }),
      scan((acc, chunkResult) => {
        const newUploadedCount = acc.uploadedCount + chunkResult.uploadedCount;
        const newPhotos = [...acc.photos, ...chunkResult.photos];
        const newErrorCount = acc.errorCount + (chunkResult.error ? this.CHUNK_SIZE : 0);
        const currentChunk = chunkResult.chunkIndex + 1;
        const progress = Math.round((currentChunk / totalChunks) * 100);
        const completed = currentChunk === totalChunks;

        return {
          ...acc,
          uploadedCount: newUploadedCount,
          photos: newPhotos,
          currentChunk,
          progress,
          completed,
          errorCount: newErrorCount,
        };
      }, initialState),
    );
  }

  /**
   * Egyetlen fotó törlése galériából
   */
  deleteGalleryPhoto(projectId: number, mediaId: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/gallery/photos/${mediaId}`,
    );
  }

  /**
   * Több fotó törlése galériából
   */
  deleteGalleryPhotos(projectId: number, photoIds: number[]): Observable<{
    success: boolean;
    message: string;
    deletedCount: number;
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>(`${this.baseUrl}/projects/${projectId}/gallery/photos`, {
      body: { photo_ids: photoIds },
    });
  }

  /**
   * Galéria határidő beállítása
   */
  setGalleryDeadline(projectId: number, deadline: string | null): Observable<{
    success: boolean;
    message: string;
    data: { deadline: string | null };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: { deadline: string | null };
    }>(`${this.baseUrl}/projects/${projectId}/gallery/deadline`, { deadline });
  }

  /**
   * Galéria haladás lekérése (diák workflow)
   */
  getGalleryProgress(projectId: number): Observable<GalleryProgress> {
    return this.http.get<GalleryProgress>(
      `${this.baseUrl}/projects/${projectId}/gallery/progress`,
    );
  }

  /**
   * Galéria monitoring adatok lekérése (személyek + haladás)
   */
  getMonitoring(projectId: number): Observable<MonitoringResponse> {
    return this.http.get<MonitoringResponse>(
      `${this.baseUrl}/projects/${projectId}/gallery/monitoring`,
    );
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Tömb chunk-okra bontása
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
