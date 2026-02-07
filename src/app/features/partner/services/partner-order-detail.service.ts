import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, concatMap, scan, map, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  PartnerOrderAlbumDetails,
  PartnerOrderAlbumSummary,
  UpdateAlbumRequest,
  AlbumPhoto,
  AlbumStatus,
  UploadProgress,
} from './partner-orders.service';

/**
 * Partner Order Detail Service
 *
 * Album részletek, fotó kezelés, státusz váltás, export.
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerOrderDetailService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner/orders`;
  private readonly CHUNK_SIZE = 10;

  // ============================================
  // ALBUM DETAIL
  // ============================================

  getAlbum(id: number): Observable<PartnerOrderAlbumDetails> {
    return this.http.get<PartnerOrderAlbumDetails>(`${this.baseUrl}/albums/${id}`);
  }

  updateAlbum(id: number, data: UpdateAlbumRequest): Observable<{
    success: boolean; message: string; data: PartnerOrderAlbumSummary;
  }> {
    return this.http.put<{
      success: boolean; message: string; data: PartnerOrderAlbumSummary;
    }>(`${this.baseUrl}/albums/${id}`, data);
  }

  deleteAlbum(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/albums/${id}`);
  }

  activateAlbum(id: number): Observable<{
    success: boolean; message: string; data: { id: number; status: AlbumStatus };
  }> {
    return this.http.post<{
      success: boolean; message: string; data: { id: number; status: AlbumStatus };
    }>(`${this.baseUrl}/albums/${id}/activate`, {});
  }

  deactivateAlbum(id: number): Observable<{
    success: boolean; message: string; data: { id: number; status: AlbumStatus };
  }> {
    return this.http.post<{
      success: boolean; message: string; data: { id: number; status: AlbumStatus };
    }>(`${this.baseUrl}/albums/${id}/deactivate`, {});
  }

  reopenAlbum(id: number): Observable<{
    success: boolean; message: string; data: { id: number; status: AlbumStatus };
  }> {
    return this.http.post<{
      success: boolean; message: string; data: { id: number; status: AlbumStatus };
    }>(`${this.baseUrl}/albums/${id}/reopen`, {});
  }

  toggleAlbumDownload(id: number): Observable<{
    success: boolean; message: string; data: { id: number; allowDownload: boolean };
  }> {
    return this.http.post<{
      success: boolean; message: string; data: { id: number; allowDownload: boolean };
    }>(`${this.baseUrl}/albums/${id}/toggle-download`, {});
  }

  extendAlbumExpiry(albumId: number, expiresAt: string): Observable<{
    success: boolean; message: string; data: { expiresAt: string | null };
  }> {
    return this.http.post<{
      success: boolean; message: string; data: { expiresAt: string | null };
    }>(`${this.baseUrl}/albums/${albumId}/extend-expiry`, { expires_at: expiresAt });
  }

  // ============================================
  // PHOTOS
  // ============================================

  uploadPhotos(albumId: number, files: File[]): Observable<{
    success: boolean; message: string; uploadedCount: number; photos: AlbumPhoto[];
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));
    return this.http.post<{
      success: boolean; message: string; uploadedCount: number; photos: AlbumPhoto[];
    }>(`${this.baseUrl}/albums/${albumId}/photos`, formData);
  }

  uploadPhotosChunked(albumId: number, files: File[]): Observable<UploadProgress> {
    const totalCount = files.length;
    const chunks = this.chunkArray(files, this.CHUNK_SIZE);
    const totalChunks = chunks.length;

    return from(chunks).pipe(
      concatMap((chunk, index) => this.uploadChunk(albumId, chunk, index, totalChunks)),
      scan((acc: UploadProgress, chunkResult: { uploadedCount: number; photos: AlbumPhoto[]; chunkIndex: number }) => ({
        uploadedCount: acc.uploadedCount + chunkResult.uploadedCount,
        totalCount,
        photos: [...acc.photos, ...chunkResult.photos],
        currentChunk: chunkResult.chunkIndex + 1,
        totalChunks,
        progress: Math.round(((chunkResult.chunkIndex + 1) / totalChunks) * 100),
        completed: chunkResult.chunkIndex === totalChunks - 1,
        errorCount: acc.errorCount,
      }), {
        uploadedCount: 0, totalCount, photos: [],
        currentChunk: 0, totalChunks, progress: 0,
        completed: false, errorCount: 0,
      } as UploadProgress)
    );
  }

  deletePhoto(albumId: number, mediaId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/albums/${albumId}/photos/${mediaId}`
    );
  }

  // ============================================
  // EXPORT
  // ============================================

  downloadSelectedZip(albumId: number, photoIds: number[]): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/albums/${albumId}/download-zip`,
      { photo_ids: photoIds },
      { responseType: 'blob' }
    );
  }

  exportExcel(albumId: number, photoIds: number[]): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/albums/${albumId}/export-excel`,
      { photo_ids: photoIds },
      { responseType: 'blob' }
    );
  }

  // ============================================
  // PRIVATE
  // ============================================

  private uploadChunk(albumId: number, files: File[], chunkIndex: number, _totalChunks: number): Observable<{
    uploadedCount: number; photos: AlbumPhoto[]; chunkIndex: number;
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));
    return this.http.post<{
      success: boolean; uploadedCount: number; photos: AlbumPhoto[];
    }>(`${this.baseUrl}/albums/${albumId}/photos`, formData).pipe(
      map(response => ({
        uploadedCount: response.uploadedCount, photos: response.photos, chunkIndex,
      })),
      catchError(() => of({ uploadedCount: 0, photos: [], chunkIndex }))
    );
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
