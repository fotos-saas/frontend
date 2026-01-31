import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, concatMap, scan, map, catchError, of, finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Partner Client (ügyfél) interface
 */
export interface PartnerClient {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  accessCode: string | null;
  accessCodeEnabled: boolean;
  accessCodeExpiresAt: string | null;
  lastLoginAt: string | null;
  albumsCount: number;
  allowRegistration: boolean;
  isRegistered: boolean;
  createdAt: string;
}

/**
 * Partner Client részletek (albumokkal)
 */
export interface PartnerClientDetails extends PartnerClient {
  albums: PartnerOrderAlbumSummary[];
  updatedAt: string;
}

/**
 * Partner Order Album összefoglaló
 */
export interface PartnerOrderAlbumSummary {
  id: number;
  name: string;
  type: 'selection' | 'tablo';
  status: AlbumStatus;
  photosCount: number;
  thumbnails: string[];
  expiresAt: string | null;
  allowDownload: boolean;
  createdAt: string;
}

/**
 * Album státuszok
 */
export type AlbumStatus = 'draft' | 'claiming' | 'retouch' | 'tablo' | 'completed';

/**
 * Album típusok
 */
export type OrderAlbumType = 'selection' | 'tablo';

/**
 * Partner Order Album lista elem
 */
export interface PartnerOrderAlbumListItem {
  id: number;
  name: string;
  type: OrderAlbumType;
  status: AlbumStatus;
  client: {
    id: number;
    name: string;
  };
  photosCount: number;
  maxSelections: number | null;
  minSelections: number | null;
  expiresAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
}

/**
 * Partner Order Album részletek
 */
export interface PartnerOrderAlbumDetails {
  id: number;
  name: string;
  type: OrderAlbumType;
  status: AlbumStatus;
  client: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
  };
  photos: AlbumPhoto[];
  photosCount: number;
  maxSelections: number | null;
  minSelections: number | null;
  maxRetouchPhotos: number | null;
  settings: Record<string, unknown> | null;
  progress: AlbumProgress | null;
  expiresAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Album fotó
 */
export interface AlbumPhoto {
  id: number;
  name: string;
  title: string; // IPTC title vagy fájlnév kiterjesztés nélkül
  original_url: string;
  thumb_url: string;
  preview_url: string;
  size: number;
  mime_type: string;
  order: number;
}

/**
 * Album progress (tablo típushoz)
 */
export interface AlbumProgress {
  currentStep: 'claiming' | 'retouch' | 'tablo';
  stepName: string;
  progressPercent: number;
  claimedIds: number[];
  retouchIds: number[];
  tabloId: number | null;
}

/**
 * Album létrehozás request
 */
export interface CreateAlbumRequest {
  client_id: number;
  name: string;
  type: OrderAlbumType;
  max_selections?: number | null;
  min_selections?: number | null;
  max_retouch_photos?: number | null;
}

/**
 * Album módosítás request
 */
export interface UpdateAlbumRequest {
  name?: string;
  max_selections?: number | null;
  min_selections?: number | null;
  max_retouch_photos?: number | null;
  status?: 'draft' | 'claiming';
}

/**
 * Client létrehozás request
 */
export interface CreateClientRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
}

/**
 * Client módosítás request
 */
export interface UpdateClientRequest {
  name?: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  allow_registration?: boolean;
}

/**
 * Paginált válasz
 */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/**
 * Upload progress interface
 */
export interface UploadProgress {
  uploadedCount: number;
  totalCount: number;
  photos: AlbumPhoto[];
  currentChunk: number;
  totalChunks: number;
  progress: number;
  completed: boolean;
  errorCount: number;
}

/**
 * Partner Orders Service
 *
 * API hívások a partner ügyfelekhez és albumokhoz (fotós megrendelések).
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerOrdersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/orders`;

  private readonly CHUNK_SIZE = 10;

  // ============================================
  // CLIENTS
  // ============================================

  /**
   * Ügyfelek listázása (paginált)
   */
  getClients(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Observable<PaginatedResponse<PartnerClient>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<PaginatedResponse<PartnerClient>>(`${this.baseUrl}/clients`, { params: httpParams });
  }

  /**
   * Ügyfél részletek lekérése
   */
  getClient(id: number): Observable<PartnerClientDetails> {
    return this.http.get<PartnerClientDetails>(`${this.baseUrl}/clients/${id}`);
  }

  /**
   * Új ügyfél létrehozása
   */
  createClient(data: CreateClientRequest): Observable<{ success: boolean; message: string; data: PartnerClient }> {
    return this.http.post<{ success: boolean; message: string; data: PartnerClient }>(
      `${this.baseUrl}/clients`,
      data
    );
  }

  /**
   * Ügyfél módosítása
   */
  updateClient(id: number, data: UpdateClientRequest): Observable<{ success: boolean; message: string; data: PartnerClient }> {
    return this.http.put<{ success: boolean; message: string; data: PartnerClient }>(
      `${this.baseUrl}/clients/${id}`,
      data
    );
  }

  /**
   * Ügyfél törlése
   */
  deleteClient(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/clients/${id}`);
  }

  /**
   * Belépési kód generálása
   */
  generateCode(clientId: number, expiresAt?: string): Observable<{
    success: boolean;
    message: string;
    data: {
      accessCode: string;
      accessCodeEnabled: boolean;
      accessCodeExpiresAt: string | null;
    };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: {
        accessCode: string;
        accessCodeEnabled: boolean;
        accessCodeExpiresAt: string | null;
      };
    }>(`${this.baseUrl}/clients/${clientId}/generate-code`, { expires_at: expiresAt });
  }

  /**
   * Belépési kód lejáratának módosítása
   */
  extendCode(clientId: number, expiresAt: string): Observable<{
    success: boolean;
    message: string;
    data: {
      accessCodeExpiresAt: string | null;
    };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: {
        accessCodeExpiresAt: string | null;
      };
    }>(`${this.baseUrl}/clients/${clientId}/extend-code`, { expires_at: expiresAt });
  }

  /**
   * Belépési kód inaktiválása
   */
  disableCode(clientId: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/clients/${clientId}/disable-code`,
      {}
    );
  }

  // ============================================
  // ALBUMS
  // ============================================

  /**
   * Albumok listázása (paginált)
   */
  getAlbums(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    client_id?: number;
    type?: OrderAlbumType;
    status?: AlbumStatus;
  }): Observable<PaginatedResponse<PartnerOrderAlbumListItem>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.client_id) httpParams = httpParams.set('client_id', params.client_id.toString());
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<PaginatedResponse<PartnerOrderAlbumListItem>>(`${this.baseUrl}/albums`, { params: httpParams });
  }

  /**
   * Album részletek lekérése
   */
  getAlbum(id: number): Observable<PartnerOrderAlbumDetails> {
    return this.http.get<PartnerOrderAlbumDetails>(`${this.baseUrl}/albums/${id}`);
  }

  /**
   * Új album létrehozása
   */
  createAlbum(data: CreateAlbumRequest): Observable<{ success: boolean; message: string; data: PartnerOrderAlbumSummary }> {
    return this.http.post<{ success: boolean; message: string; data: PartnerOrderAlbumSummary }>(
      `${this.baseUrl}/albums`,
      data
    );
  }

  /**
   * Album módosítása
   */
  updateAlbum(id: number, data: UpdateAlbumRequest): Observable<{ success: boolean; message: string; data: PartnerOrderAlbumSummary }> {
    return this.http.put<{ success: boolean; message: string; data: PartnerOrderAlbumSummary }>(
      `${this.baseUrl}/albums/${id}`,
      data
    );
  }

  /**
   * Album törlése
   */
  deleteAlbum(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/albums/${id}`);
  }

  /**
   * Album aktiválása (draft -> claiming)
   */
  activateAlbum(id: number): Observable<{ success: boolean; message: string; data: { id: number; status: AlbumStatus } }> {
    return this.http.post<{ success: boolean; message: string; data: { id: number; status: AlbumStatus } }>(
      `${this.baseUrl}/albums/${id}/activate`,
      {}
    );
  }

  /**
   * Album deaktiválása (claiming -> draft)
   */
  deactivateAlbum(id: number): Observable<{ success: boolean; message: string; data: { id: number; status: AlbumStatus } }> {
    return this.http.post<{ success: boolean; message: string; data: { id: number; status: AlbumStatus } }>(
      `${this.baseUrl}/albums/${id}/deactivate`,
      {}
    );
  }

  /**
   * Album újranyitása (completed -> claiming)
   */
  reopenAlbum(id: number): Observable<{ success: boolean; message: string; data: { id: number; status: AlbumStatus } }> {
    return this.http.post<{ success: boolean; message: string; data: { id: number; status: AlbumStatus } }>(
      `${this.baseUrl}/albums/${id}/reopen`,
      {}
    );
  }

  /**
   * Album letöltés engedélyezés toggle
   */
  toggleAlbumDownload(id: number): Observable<{ success: boolean; message: string; data: { id: number; allowDownload: boolean } }> {
    return this.http.post<{ success: boolean; message: string; data: { id: number; allowDownload: boolean } }>(
      `${this.baseUrl}/albums/${id}/toggle-download`,
      {}
    );
  }

  /**
   * Album lejárat módosítása
   */
  extendAlbumExpiry(albumId: number, expiresAt: string): Observable<{
    success: boolean;
    message: string;
    data: {
      expiresAt: string | null;
    };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: {
        expiresAt: string | null;
      };
    }>(`${this.baseUrl}/albums/${albumId}/extend-expiry`, { expires_at: expiresAt });
  }

  /**
   * Képek feltöltése albumba (egyszerű)
   */
  uploadPhotos(albumId: number, files: File[]): Observable<{
    success: boolean;
    message: string;
    uploadedCount: number;
    photos: AlbumPhoto[];
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));

    return this.http.post<{
      success: boolean;
      message: string;
      uploadedCount: number;
      photos: AlbumPhoto[];
    }>(`${this.baseUrl}/albums/${albumId}/photos`, formData);
  }

  /**
   * Képek feltöltése albumba CHUNKED módon
   */
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
        uploadedCount: 0,
        totalCount,
        photos: [],
        currentChunk: 0,
        totalChunks,
        progress: 0,
        completed: false,
        errorCount: 0,
      } as UploadProgress)
    );
  }

  private uploadChunk(albumId: number, files: File[], chunkIndex: number, _totalChunks: number): Observable<{
    uploadedCount: number;
    photos: AlbumPhoto[];
    chunkIndex: number;
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));

    return this.http.post<{
      success: boolean;
      uploadedCount: number;
      photos: AlbumPhoto[];
    }>(`${this.baseUrl}/albums/${albumId}/photos`, formData).pipe(
      map(response => ({
        uploadedCount: response.uploadedCount,
        photos: response.photos,
        chunkIndex,
      })),
      catchError(() => of({
        uploadedCount: 0,
        photos: [],
        chunkIndex,
      }))
    );
  }

  /**
   * Kép törlése albumból
   */
  deletePhoto(albumId: number, mediaId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/albums/${albumId}/photos/${mediaId}`
    );
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Tömb feldarabolása adott méretű részekre
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Állapot fordítása magyarra
   */
  getStatusLabel(status: AlbumStatus): string {
    const labels: Record<AlbumStatus, string> = {
      draft: 'Piszkozat',
      claiming: 'Kiválasztás',
      retouch: 'Retusálás',
      tablo: 'Tablókép',
      completed: 'Befejezett',
    };
    return labels[status] || status;
  }

  /**
   * Állapot szín osztály
   */
  getStatusColor(status: AlbumStatus): string {
    const colors: Record<AlbumStatus, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      claiming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      retouch: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      tablo: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Típus fordítása magyarra
   */
  getTypeLabel(type: OrderAlbumType): string {
    return type === 'selection' ? 'Képválasztás' : 'Tablókép';
  }

  // ============================================
  // EXPORT (ZIP, Excel)
  // ============================================

  /**
   * Kiválasztott képek letöltése ZIP-ben
   */
  downloadSelectedZip(albumId: number, photoIds: number[]): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/albums/${albumId}/download-zip`,
      { photo_ids: photoIds },
      { responseType: 'blob' }
    );
  }

  /**
   * Képek fájlneveinek exportálása Excel-be
   */
  exportExcel(albumId: number, photoIds: number[]): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/albums/${albumId}/export-excel`,
      { photo_ids: photoIds },
      { responseType: 'blob' }
    );
  }
}
