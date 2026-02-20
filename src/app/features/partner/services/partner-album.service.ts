import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { concatMap, scan, map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AlbumType,
  AlbumsSummary,
  AlbumDetails,
  UploadedPhoto,
  UploadProgress,
  MatchResult,
  PhotoAssignment,
} from '../models/partner.models';

/**
 * Album kezelés service.
 * Album CRUD, fotó feltöltés (chunk), matching, assign.
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerAlbumService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /** Chunk méret - hány kép kerüljön egy batch-be */
  private readonly CHUNK_SIZE = 10;

  // ============================================
  // ALBUM CRUD
  // ============================================

  /**
   * Albumok összefoglalója (diákok + tanárok)
   */
  getAlbums(projectId: number): Observable<{ albums: AlbumsSummary }> {
    return this.http.get<{ albums: AlbumsSummary }>(
      `${this.baseUrl}/projects/${projectId}/albums`,
    );
  }

  /**
   * Egyetlen album részletei
   */
  getAlbum(projectId: number, album: AlbumType): Observable<{ album: AlbumDetails }> {
    return this.http.get<{ album: AlbumDetails }>(
      `${this.baseUrl}/projects/${projectId}/albums/${album}`,
    );
  }

  /**
   * Album törlése (összes kép)
   */
  clearAlbum(projectId: number, album: AlbumType): Observable<{
    success: boolean;
    message: string;
    deletedCount: number;
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>(`${this.baseUrl}/projects/${projectId}/albums/${album}`);
  }

  // ============================================
  // FOTÓ FELTÖLTÉS
  // ============================================

  /**
   * Képek feltöltése albumba (egyszerű - kis mennyiséghez)
   */
  uploadToAlbum(projectId: number, album: AlbumType, files: File[]): Observable<{
    success: boolean;
    uploadedCount: number;
    album: AlbumType;
    photos: UploadedPhoto[];
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));

    return this.http.post<{
      success: boolean;
      uploadedCount: number;
      album: AlbumType;
      photos: UploadedPhoto[];
    }>(`${this.baseUrl}/projects/${projectId}/albums/${album}/upload`, formData);
  }

  /**
   * Képek feltöltése albumba CHUNKED módon (nagy mennyiséghez)
   */
  uploadToAlbumChunked(projectId: number, album: AlbumType, files: File[]): Observable<UploadProgress> {
    const totalCount = files.length;
    const chunks = this.chunkArray(files, this.CHUNK_SIZE);
    const totalChunks = chunks.length;

    const initialState: UploadProgress = {
      uploadedCount: 0,
      totalCount,
      photos: [],
      album,
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
        return this.uploadChunk(projectId, album, chunk).pipe(
          map(result => ({
            chunkIndex: index,
            uploadedCount: result.uploadedCount,
            photos: result.photos,
            error: false,
          })),
          catchError(() => of({
            chunkIndex: index,
            uploadedCount: 0,
            photos: [] as UploadedPhoto[],
            error: true,
          })),
        );
      }),
      scan((acc: UploadProgress, chunkResult) => {
        const newUploadedCount = acc.uploadedCount + chunkResult.uploadedCount;
        const newPhotos = [...acc.photos, ...chunkResult.photos];
        const newErrorCount = acc.errorCount + (chunkResult.error ? chunkResult.photos.length || this.CHUNK_SIZE : 0);
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
   * ZIP fájl feltöltése albumba
   */
  uploadZipToAlbum(projectId: number, album: AlbumType, zipFile: File): Observable<{
    success: boolean;
    uploadedCount: number;
    album: AlbumType;
    photos: UploadedPhoto[];
  }> {
    const formData = new FormData();
    formData.append('zip', zipFile);

    return this.http.post<{
      success: boolean;
      uploadedCount: number;
      album: AlbumType;
      photos: UploadedPhoto[];
    }>(`${this.baseUrl}/projects/${projectId}/albums/${album}/upload`, formData);
  }

  /**
   * Bulk upload képek (album alapú)
   * @deprecated Use uploadToAlbum() instead
   */
  bulkUploadPhotos(projectId: number, files: File[], album: AlbumType = 'students'): Observable<{
    success: boolean;
    uploadedCount: number;
    album: AlbumType;
    photos: UploadedPhoto[];
  }> {
    return this.uploadToAlbum(projectId, album, files);
  }

  /**
   * ZIP fájl feltöltése (album alapú)
   * @deprecated Use uploadZipToAlbum() instead
   */
  uploadZip(projectId: number, zipFile: File, album: AlbumType = 'students'): Observable<{
    success: boolean;
    uploadedCount: number;
    album: AlbumType;
    photos: UploadedPhoto[];
  }> {
    return this.uploadZipToAlbum(projectId, album, zipFile);
  }

  // ============================================
  // PENDING FOTÓK & MATCHING
  // ============================================

  /**
   * Pending képek lekérése (feltöltött de nem párosított)
   */
  getPendingPhotos(projectId: number): Observable<{ photos: UploadedPhoto[] }> {
    return this.http.get<{ photos: UploadedPhoto[] }>(
      `${this.baseUrl}/projects/${projectId}/photos/pending`,
    );
  }

  /**
   * Pending fotók letöltése ZIP-ben (opcionális album szűrővel)
   */
  downloadPendingZip(projectId: number, album?: string): Observable<Blob> {
    const params = album ? `?album=${album}` : '';
    return this.http.get(
      `${this.baseUrl}/projects/${projectId}/photos/pending/download-zip${params}`,
      { responseType: 'blob' },
    );
  }

  /**
   * Pending képek törlése mediaId-k alapján
   */
  deletePendingPhotos(projectId: number, mediaIds: number[]): Observable<{
    success: boolean;
    message: string;
    deleted_count: number;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      deleted_count: number;
    }>(`${this.baseUrl}/projects/${projectId}/photos/pending/delete`, { media_ids: mediaIds });
  }

  /**
   * AI párosítás indítása
   */
  matchPhotos(projectId: number, photoIds?: number[]): Observable<{
    success: boolean;
    message?: string;
  } & MatchResult> {
    return this.http.post<{ success: boolean; message?: string } & MatchResult>(
      `${this.baseUrl}/projects/${projectId}/photos/match`,
      photoIds ? { photoIds } : {},
    );
  }

  /**
   * Képek hozzárendelése személyekhez (véglegesítés)
   */
  assignPhotos(projectId: number, assignments: PhotoAssignment[]): Observable<{
    success: boolean;
    assignedCount: number;
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      assignedCount: number;
      message: string;
    }>(`${this.baseUrl}/projects/${projectId}/photos/assign`, { assignments });
  }

  /**
   * Képek talonba mozgatása (párosítás kihagyása)
   */
  assignToTalon(projectId: number, mediaIds: number[]): Observable<{
    success: boolean;
    movedCount: number;
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      movedCount: number;
      message: string;
    }>(`${this.baseUrl}/projects/${projectId}/photos/assign-to-talon`, { mediaIds });
  }

  /**
   * Talon képek lekérése
   */
  getTalonPhotos(projectId: number): Observable<{ photos: UploadedPhoto[] }> {
    return this.http.get<{ photos: UploadedPhoto[] }>(
      `${this.baseUrl}/projects/${projectId}/photos/talon`,
    );
  }

  /**
   * Egyéni kép feltöltése személyhez
   */
  uploadPersonPhoto(projectId: number, personId: number, photo: File): Observable<{
    success: boolean;
    message: string;
    photo: {
      mediaId: number;
      filename: string;
      thumbUrl: string;
      version: number;
    };
  }> {
    const formData = new FormData();
    formData.append('photo', photo);

    return this.http.post<{
      success: boolean;
      message: string;
      photo: {
        mediaId: number;
        filename: string;
        thumbUrl: string;
        version: number;
      };
    }>(`${this.baseUrl}/projects/${projectId}/persons/${personId}/photo`, formData);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Egyetlen chunk feltöltése
   */
  private uploadChunk(projectId: number, album: AlbumType, files: File[]): Observable<{
    success: boolean;
    uploadedCount: number;
    photos: UploadedPhoto[];
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));

    return this.http.post<{
      success: boolean;
      uploadedCount: number;
      album: AlbumType;
      photos: UploadedPhoto[];
    }>(`${this.baseUrl}/projects/${projectId}/albums/${album}/upload`, formData);
  }

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
