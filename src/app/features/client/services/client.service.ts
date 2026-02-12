import { Injectable, inject, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { ClientAuthService } from './client-auth.service';
import { ClientAlbumService } from './client-album.service';
import { ClientHelperService } from './client-helper.service';

/**
 * Partner branding data
 */
export interface ClientBranding {
  brandName: string | null;
  logoUrl: string | null;
  hideBrandName: boolean;
}

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
  branding?: ClientBranding;
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
  branding?: ClientBranding;
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
 * Client Service (Facade)
 *
 * API calls for partner client album management.
 * Uses separate token from auth service (client_token in sessionStorage).
 *
 * Delegates to:
 * - ClientAuthService: auth, profile, logout
 * - ClientAlbumService: albums, selections
 * - ClientHelperService: UI helpers (status/type labels)
 */
@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly auth = inject(ClientAuthService);
  private readonly album = inject(ClientAlbumService);
  private readonly helper = inject(ClientHelperService);

  /** Current client info (reactive) */
  readonly clientInfo = this.auth.clientInfo;

  /** Client name computed */
  readonly clientName = computed(() => this.auth.clientInfo()?.name ?? '');

  /** Client email computed */
  readonly clientEmail = computed(() => this.auth.clientInfo()?.email ?? '');

  /** Is authenticated computed */
  readonly isAuthenticated = computed(() => !!this.auth.getToken());

  /** Is registered computed (email/password login enabled) */
  readonly isRegistered = computed(() => this.auth.clientInfo()?.isRegistered ?? false);

  /** Can register computed (has album that allows registration) */
  readonly canRegister = this.auth.canRegister;

  /** Has any album with download enabled */
  readonly hasDownloadableAlbum = this.album.hasDownloadableAlbum;

  /** Partner branding (ha aktív) */
  readonly branding = this.auth.branding;

  // === AUTH DELEGATION ===

  getToken(): string | null {
    return this.auth.getToken();
  }

  getClientInfo(): ClientInfo | null {
    return this.auth.getClientInfo();
  }

  logout(): void {
    this.auth.logout();
  }

  // === ALBUM DELEGATION ===

  getAlbums(): Observable<{ success: boolean; data: ClientAlbum[] }> {
    return this.album.getAlbums();
  }

  getAlbum(id: number): Observable<{ success: boolean; data: ClientAlbumDetail }> {
    return this.album.getAlbum(id);
  }

  saveSimpleSelection(albumId: number, selectedIds: number[], finalize = false): Observable<SaveSelectionResponse> {
    return this.album.saveSimpleSelection(albumId, selectedIds, finalize);
  }

  saveTabloSelection(
    albumId: number,
    step: 'claiming' | 'retouch' | 'tablo',
    ids: number[],
    finalize = false
  ): Observable<SaveSelectionResponse> {
    return this.album.saveTabloSelection(albumId, step, ids, finalize);
  }

  // === HELPER DELEGATION ===

  getStatusLabel(status: string): string {
    return this.helper.getStatusLabel(status);
  }

  getStatusColor(status: string): string {
    return this.helper.getStatusColor(status);
  }

  getTypeLabel(type: string): string {
    return this.helper.getTypeLabel(type);
  }

  // === AUTH METHODS ===

  getProfile(): Observable<{ success: boolean; data: ClientProfile }> {
    return this.auth.getProfile();
  }

  register(email: string, password: string, passwordConfirmation: string): Observable<RegisterResponse> {
    return this.auth.register(email, password, passwordConfirmation);
  }

  loginWithPassword(email: string, password: string): Observable<LoginResponse> {
    return this.auth.loginWithPassword(email, password);
  }

  updateNotifications(wantsNotifications: boolean): Observable<{ success: boolean; message: string }> {
    return this.auth.updateNotifications(wantsNotifications);
  }

  changePassword(currentPassword: string, newPassword: string, confirmation: string): Observable<{ success: boolean; message: string }> {
    return this.auth.changePassword(currentPassword, newPassword, confirmation);
  }
}
