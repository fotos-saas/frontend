import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PartnerOrderListService } from './partner-order-list.service';
import { PartnerOrderDetailService } from './partner-order-detail.service';
import type { ExtendedPaginatedResponse } from '../../../core/models/api.models';

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

/** Album státuszok */
export type AlbumStatus = 'draft' | 'claiming' | 'retouch' | 'tablo' | 'completed';

/** Album típusok */
export type OrderAlbumType = 'selection' | 'tablo';

/**
 * Partner Order Album lista elem
 */
export interface PartnerOrderAlbumListItem {
  id: number;
  name: string;
  type: OrderAlbumType;
  status: AlbumStatus;
  client: { id: number; name: string };
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
  client: { id: number; name: string; email: string | null; phone: string | null };
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

/** Album fotó */
export interface AlbumPhoto {
  id: number;
  name: string;
  title: string;
  original_url: string;
  thumb_url: string;
  preview_url: string;
  size: number;
  mime_type: string;
  order: number;
}

/** Album progress */
export interface AlbumProgress {
  currentStep: 'claiming' | 'retouch' | 'tablo';
  stepName: string;
  progressPercent: number;
  claimedIds: number[];
  retouchIds: number[];
  tabloId: number | null;
}

/** Album létrehozás request */
export interface CreateAlbumRequest {
  client_id: number;
  name: string;
  type: OrderAlbumType;
  max_selections?: number | null;
  min_selections?: number | null;
  max_retouch_photos?: number | null;
}

/** Album módosítás request */
export interface UpdateAlbumRequest {
  name?: string;
  max_selections?: number | null;
  min_selections?: number | null;
  max_retouch_photos?: number | null;
  status?: 'draft' | 'claiming';
}

/** Client létrehozás request */
export interface CreateClientRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
}

/** Client módosítás request */
export interface UpdateClientRequest {
  name?: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  allow_registration?: boolean;
}

/** Paginált válasz (alias a központi ExtendedPaginatedResponse-ra) */
export type PaginatedResponse<T> = ExtendedPaginatedResponse<T>;

/** Upload progress */
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
 * Partner Orders Service (Facade)
 *
 * Backward compatible facade a PartnerOrderListService és PartnerOrderDetailService fölött.
 * Az interfészek és típusok innen exportálódnak (a meglévő importok ne törjenek el).
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerOrdersService {
  private readonly listService = inject(PartnerOrderListService);
  private readonly detailService = inject(PartnerOrderDetailService);

  // === CLIENT DELEGÁLÁS ===

  getClients(params?: { page?: number; per_page?: number; search?: string }) { return this.listService.getClients(params); }
  getClient(id: number) { return this.listService.getClient(id); }
  createClient(data: CreateClientRequest) { return this.listService.createClient(data); }
  updateClient(id: number, data: UpdateClientRequest) { return this.listService.updateClient(id, data); }
  deleteClient(id: number) { return this.listService.deleteClient(id); }
  generateCode(clientId: number, expiresAt?: string) { return this.listService.generateCode(clientId, expiresAt); }
  extendCode(clientId: number, expiresAt: string) { return this.listService.extendCode(clientId, expiresAt); }
  disableCode(clientId: number) { return this.listService.disableCode(clientId); }

  // === ALBUM LIST DELEGÁLÁS ===

  getAlbums(params?: { page?: number; per_page?: number; search?: string; client_id?: number; type?: OrderAlbumType; status?: AlbumStatus }) {
    return this.listService.getAlbums(params);
  }
  createAlbum(data: CreateAlbumRequest) { return this.listService.createAlbum(data); }

  // === ALBUM DETAIL DELEGÁLÁS ===

  getAlbum(id: number) { return this.detailService.getAlbum(id); }
  updateAlbum(id: number, data: UpdateAlbumRequest) { return this.detailService.updateAlbum(id, data); }
  deleteAlbum(id: number) { return this.detailService.deleteAlbum(id); }
  activateAlbum(id: number) { return this.detailService.activateAlbum(id); }
  deactivateAlbum(id: number) { return this.detailService.deactivateAlbum(id); }
  reopenAlbum(id: number) { return this.detailService.reopenAlbum(id); }
  toggleAlbumDownload(id: number) { return this.detailService.toggleAlbumDownload(id); }
  extendAlbumExpiry(albumId: number, expiresAt: string) { return this.detailService.extendAlbumExpiry(albumId, expiresAt); }

  // === PHOTO DELEGÁLÁS ===

  uploadPhotos(albumId: number, files: File[]) { return this.detailService.uploadPhotos(albumId, files); }
  uploadPhotosChunked(albumId: number, files: File[]) { return this.detailService.uploadPhotosChunked(albumId, files); }
  deletePhoto(albumId: number, mediaId: number) { return this.detailService.deletePhoto(albumId, mediaId); }

  // === HELPERS ===

  getStatusLabel(status: AlbumStatus) { return this.listService.getStatusLabel(status); }
  getStatusColor(status: AlbumStatus) { return this.listService.getStatusColor(status); }
  getTypeLabel(type: OrderAlbumType) { return this.listService.getTypeLabel(type); }

  // === EXPORT ===

  downloadSelectedZip(albumId: number, photoIds: number[]) { return this.detailService.downloadSelectedZip(albumId, photoIds); }
  exportExcel(albumId: number, photoIds: number[]) { return this.detailService.exportExcel(albumId, photoIds); }
}
