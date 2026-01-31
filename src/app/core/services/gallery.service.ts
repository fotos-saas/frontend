import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  GalleryPhoto,
  GalleryInfo,
  GalleryPhotosResponse,
} from '../models/gallery.models';

/**
 * Gallery Service
 *
 * Galéria fotók kezelése a TabloGallery-ből.
 * Signal-based state management.
 */
@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /** Galéria fotók (Signal) */
  private readonly _photos = signal<GalleryPhoto[]>([]);

  /** Galéria info (Signal) */
  private readonly _galleryInfo = signal<GalleryInfo | null>(null);

  /** Loading state (Signal) */
  private readonly _isLoading = signal<boolean>(false);

  /** Error state (Signal) */
  private readonly _error = signal<string | null>(null);

  /** Publikus signals (readonly) */
  readonly photos = this._photos.asReadonly();
  readonly galleryInfo = this._galleryInfo.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Galéria fotók betöltése
   */
  getGalleryPhotos(): Observable<GalleryPhotosResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<GalleryPhotosResponse>(`${this.apiUrl}/gallery-photos`).pipe(
      tap((response) => {
        if (response.success) {
          this._photos.set(response.data);
          this._galleryInfo.set(response.gallery);
        } else {
          this._photos.set([]);
          this._galleryInfo.set(null);
          if (response.message) {
            this._error.set(response.message);
          }
        }
        this._isLoading.set(false);
      }),
      catchError((err) => {
        this._isLoading.set(false);
        this._error.set(err.message || 'Hiba a galéria betöltése során');
        return of({
          success: false,
          message: err.message || 'Hiba a galéria betöltése során',
          data: [],
          gallery: null,
        });
      })
    );
  }

  /**
   * State reset
   */
  reset(): void {
    this._photos.set([]);
    this._galleryInfo.set(null);
    this._isLoading.set(false);
    this._error.set(null);
  }
}
