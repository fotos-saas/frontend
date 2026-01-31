import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { safeJsonParse } from '../../../shared/utils/safe-json-parse';

/**
 * Client info stored in localStorage
 */
export interface ClientInfo {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  isRegistered?: boolean;
  wantsNotifications?: boolean;
}

/**
 * Client profile response
 */
export interface ClientProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  isRegistered: boolean;
  registeredAt: string | null;
  wantsNotifications: boolean;
  canRegister: boolean;
}

/**
 * Register response
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  client: {
    id: number;
    name: string;
    email: string;
    isRegistered: boolean;
  };
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    type: string;
    isRegistered: boolean;
  };
  client: ClientInfo;
  albums: ClientAlbum[];
  token: string;
  tokenType: string;
  loginType: string;
}

/**
 * Album summary for client
 */
export interface ClientAlbum {
  id: number;
  name: string;
  type: 'selection' | 'tablo';
  typeName: string;
  status: string;
  statusName: string;
  photosCount: number;
  maxSelections: number | null;
  minSelections: number | null;
  maxRetouchPhotos: number | null;
  isCompleted: boolean;
  isDraft: boolean;
  finalizedAt: string | null;
  createdAt: string;
  previewThumbs: string[];
  progress: ClientAlbumProgress | null;
  canDownload: boolean;
  downloadDaysRemaining: number | null;
}

/**
 * Album progress
 */
export interface ClientAlbumProgress {
  currentStep: 'claiming' | 'retouch' | 'tablo';
  percentage: number;
  stepName: string;
  selectedCount: number;
}

/**
 * Album detail with photos
 */
export interface ClientAlbumDetail extends ClientAlbum {
  photos: ClientPhoto[];
  progress: ClientAlbumDetailProgress;
}

/**
 * Album detail progress
 */
export interface ClientAlbumDetailProgress {
  currentStep: 'claiming' | 'retouch' | 'tablo';
  claimedIds: number[];
  retouchIds: number[];
  tabloId: number | null;
  percentage: number;
  stepName: string;
  selectedCount: number;
}

/**
 * Photo in album
 */
export interface ClientPhoto {
  id: number;
  name: string;
  original_url: string;
  thumb_url: string;
  preview_url: string;
  size: number;
  mime_type: string;
  order: number;
}

/**
 * Selection save request for simple selection
 */
export interface SaveSimpleSelectionRequest {
  selected_ids: number[];
  finalize?: boolean;
}

/**
 * Selection save request for tablo workflow
 */
export interface SaveTabloSelectionRequest {
  step: 'claiming' | 'retouch' | 'tablo';
  ids: number[];
  finalize?: boolean;
}

/**
 * Selection save response
 */
export interface SaveSelectionResponse {
  success: boolean;
  message: string;
  data: {
    selectedCount?: number;
    currentStep?: string;
    percentage?: number;
    isCompleted: boolean;
  };
}

/**
 * Client Service
 *
 * API calls for partner client album management.
 * Uses separate token from auth service (client_token in localStorage).
 */
@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = `${environment.apiUrl}/client`;

  /** Current client info (reactive) */
  private _clientInfo = signal<ClientInfo | null>(null);
  readonly clientInfo = this._clientInfo.asReadonly();

  /** Client name computed */
  readonly clientName = computed(() => this._clientInfo()?.name ?? '');

  /** Client email computed */
  readonly clientEmail = computed(() => this._clientInfo()?.email ?? '');

  /** Is authenticated computed */
  readonly isAuthenticated = computed(() => !!this.getToken());

  /** Is registered computed (email/password login enabled) */
  readonly isRegistered = computed(() => this._clientInfo()?.isRegistered ?? false);

  /** Can register computed (has album that allows registration) */
  private _canRegister = signal(false);
  readonly canRegister = this._canRegister.asReadonly();

  /** Has any album with download enabled */
  private _hasDownloadableAlbum = signal(false);
  readonly hasDownloadableAlbum = this._hasDownloadableAlbum.asReadonly();

  constructor() {
    this.initializeFromStorage();
  }

  /**
   * Initialize from localStorage
   */
  private initializeFromStorage(): void {
    const stored = localStorage.getItem('client_info');
    if (stored) {
      const info = safeJsonParse<ClientInfo | null>(stored, null);
      if (info) {
        this._clientInfo.set(info);
      }
    }
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem('client_token');
  }

  /**
   * Get HTTP headers with auth token
   */
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
  }

  /**
   * Get client info
   */
  getClientInfo(): ClientInfo | null {
    return this._clientInfo();
  }

  /**
   * Logout and clear storage
   */
  logout(): void {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_info');
    localStorage.removeItem('client_albums');
    this._clientInfo.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Get all albums for client
   */
  getAlbums(): Observable<{ success: boolean; data: ClientAlbum[] }> {
    return this.http.get<{ success: boolean; data: ClientAlbum[] }>(
      `${this.baseUrl}/albums`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        // Check if any album has download enabled
        const hasDownloadable = response.data.some(album => album.canDownload);
        this._hasDownloadableAlbum.set(hasDownloadable);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get album detail with photos
   */
  getAlbum(id: number): Observable<{ success: boolean; data: ClientAlbumDetail }> {
    return this.http.get<{ success: boolean; data: ClientAlbumDetail }>(
      `${this.baseUrl}/albums/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
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
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
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
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: { status: number; error?: { message?: string } }): Observable<never> {
    // 401 - unauthorized, redirect to login
    if (error.status === 401) {
      this.logout();
      return throwError(() => new Error('A munkamenet lejárt. Kérlek jelentkezz be újra.'));
    }

    const message = error.error?.message ?? 'Hiba történt. Kérlek próbáld újra.';
    return throwError(() => new Error(message));
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get status label in Hungarian
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Előkészítés',
      claiming: 'Kiválasztás',
      retouch: 'Retusálás',
      tablo: 'Tablókép',
      completed: 'Lezárva',
    };
    return labels[status] ?? status;
  }

  /**
   * Get status color class
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      claiming: 'bg-blue-100 text-blue-800',
      retouch: 'bg-yellow-100 text-yellow-800',
      tablo: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-800';
  }

  /**
   * Get type label in Hungarian
   */
  getTypeLabel(type: string): string {
    return type === 'selection' ? 'Képválasztás' : 'Tablókép';
  }

  // ============================================
  // AUTH METHODS
  // ============================================

  /**
   * Get client profile (includes canRegister flag)
   */
  getProfile(): Observable<{ success: boolean; data: ClientProfile }> {
    return this.http.get<{ success: boolean; data: ClientProfile }>(
      `${this.baseUrl}/profile`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        this._canRegister.set(response.data.canRegister);
        // Update client info with registration status
        const current = this._clientInfo();
        if (current) {
          this._clientInfo.set({
            ...current,
            isRegistered: response.data.isRegistered,
            wantsNotifications: response.data.wantsNotifications,
          });
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Register with email and password
   * FONTOS: Ez után a kód alapú belépés MEGSZŰNIK!
   */
  register(email: string, password: string, passwordConfirmation: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${this.baseUrl}/register`,
      {
        email,
        password,
        password_confirmation: passwordConfirmation,
      },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        // Update token and client info
        localStorage.setItem('client_token', response.token);
        this._clientInfo.set({
          ...this._clientInfo()!,
          email: response.client.email,
          isRegistered: true,
        });
        localStorage.setItem('client_info', JSON.stringify(this._clientInfo()));
        this._canRegister.set(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Login with email and password (for registered clients)
   */
  loginWithPassword(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`,
      { email, password }
    ).pipe(
      tap(response => {
        // Save token and client info
        localStorage.setItem('client_token', response.token);
        localStorage.setItem('client_info', JSON.stringify({
          id: response.client.id,
          name: response.client.name,
          email: response.client.email,
          phone: response.client.phone,
          isRegistered: response.user.isRegistered,
          wantsNotifications: response.client.wantsNotifications,
        }));
        this._clientInfo.set({
          id: response.client.id,
          name: response.client.name,
          email: response.client.email,
          phone: response.client.phone,
          isRegistered: response.user.isRegistered,
          wantsNotifications: response.client.wantsNotifications,
        });
        // Store albums in localStorage for quick access
        localStorage.setItem('client_albums', JSON.stringify(response.albums));
      }),
      catchError(err => {
        const message = err.error?.message ?? 'Hiba történt. Kérlek próbáld újra.';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Update notification preferences
   */
  updateNotifications(wantsNotifications: boolean): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string; data: { wantsNotifications: boolean } }>(
      `${this.baseUrl}/notifications`,
      { wants_notifications: wantsNotifications },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        const current = this._clientInfo();
        if (current) {
          this._clientInfo.set({
            ...current,
            wantsNotifications: response.data.wantsNotifications,
          });
          localStorage.setItem('client_info', JSON.stringify(this._clientInfo()));
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string, confirmation: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/change-password`,
      {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmation,
      },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}
