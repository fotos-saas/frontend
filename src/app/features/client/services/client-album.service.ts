import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ClientAuthService } from './client-auth.service';
import { handleClientError } from '../../../shared/utils/http-error.util';
import type {
  ClientAlbum,
  ClientAlbumDetail,
  SaveSimpleSelectionRequest,
  SaveTabloSelectionRequest,
  SaveSelectionResponse
} from './client.service';

/**
 * Client Album Service
 *
 * Album műveletek:
 * - getAlbums() - összes album
 * - getAlbum(id) - egyetlen album részletei + fotók
 * - saveSimpleSelection() - egyszerű képválasztás
 * - saveTabloSelection() - tablós workflow
 */
@Injectable({
  providedIn: 'root'
})
export class ClientAlbumService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(ClientAuthService);
  private readonly baseUrl = `${environment.apiUrl}/client`;

  /** Has any album with download enabled */
  private readonly _hasDownloadableAlbum = signal(false);
  readonly hasDownloadableAlbum = this._hasDownloadableAlbum.asReadonly();

  /**
   * Get all albums for client
   */
  getAlbums(): Observable<{ success: boolean; data: ClientAlbum[] }> {
    return this.http.get<{ success: boolean; data: ClientAlbum[] }>(
      `${this.baseUrl}/albums`,
      { headers: this.auth.getHeaders() }
    ).pipe(
      tap(response => {
        // Check if any album has download enabled
        const hasDownloadable = response.data.some(album => album.canDownload);
        this._hasDownloadableAlbum.set(hasDownloadable);
      }),
      catchError(error => throwError(() => handleClientError(error, () => this.auth.logout())))
    );
  }

  /**
   * Get album detail with photos
   */
  getAlbum(id: number): Observable<{ success: boolean; data: ClientAlbumDetail }> {
    return this.http.get<{ success: boolean; data: ClientAlbumDetail }>(
      `${this.baseUrl}/albums/${id}`,
      { headers: this.auth.getHeaders() }
    ).pipe(
      catchError(error => throwError(() => handleClientError(error, () => this.auth.logout())))
    );
  }

  /**
   * Save selection for simple selection album
   */
  saveSimpleSelection(albumId: number, selectedIds: number[], finalize = false): Observable<SaveSelectionResponse> {
    const body: SaveSimpleSelectionRequest = {
      selected_ids: selectedIds,
      finalize,
    };

    return this.http.post<SaveSelectionResponse>(
      `${this.baseUrl}/albums/${albumId}/selection`,
      body,
      { headers: this.auth.getHeaders() }
    ).pipe(
      catchError(error => throwError(() => handleClientError(error, () => this.auth.logout())))
    );
  }

  /**
   * Save selection for tablo workflow album
   */
  saveTabloSelection(
    albumId: number,
    step: 'claiming' | 'retouch' | 'tablo',
    ids: number[],
    finalize = false
  ): Observable<SaveSelectionResponse> {
    const body: SaveTabloSelectionRequest = {
      step,
      ids,
      finalize,
    };

    return this.http.post<SaveSelectionResponse>(
      `${this.baseUrl}/albums/${albumId}/selection`,
      body,
      { headers: this.auth.getHeaders() }
    ).pipe(
      catchError(error => throwError(() => handleClientError(error, () => this.auth.logout())))
    );
  }

}
