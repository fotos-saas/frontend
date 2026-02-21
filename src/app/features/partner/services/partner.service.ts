import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Backward compatibility re-exportok
export type {
  PartnerDashboardStats, ProjectContact, TabloStatus, PartnerProjectListItem, QrCodeHistory,
  PartnerProjectDetails, SampleItem, TabloPersonItem, MissingPersonItem, UploadedPhoto,
  DraftInfo, DraftDetails, MatchResult, AlbumType, AlbumSummaryItem, AlbumsSummary,
  AlbumMissingPerson, AlbumDetails, PhotoAssignment, SchoolItem, SchoolListItem, SchoolLimits,
  ContactListItem, ContactLimits, GuestSession, SamplePackage, SampleVersionImage, SampleVersion,
  ProjectAutocompleteItem, CreateProjectRequest, CreateSchoolRequest, ProjectLimits,
  PaginatedResponse, ProjectListResponse, UploadProgress, TabloSize, TabloSizeThreshold,
} from '../models/partner.models';
export type { QrCode } from '../../../shared/interfaces/qr-code.interface';
export type { ImportResult } from './partner-contact.service';

import type {
  PartnerDashboardStats, ProjectContact, PartnerProjectListItem, PartnerProjectDetails,
  SampleItem, TabloPersonItem, UploadedPhoto, MatchResult, AlbumType, AlbumsSummary,
  AlbumDetails, PhotoAssignment, SchoolItem, CreateProjectRequest, CreateSchoolRequest,
  ProjectListResponse, UploadProgress, SamplePackage, ProjectAutocompleteItem, TabloSize,
} from '../models/partner.models';
import type { QrCode } from '../../../shared/interfaces/qr-code.interface';
// Import sub-service-ek
import { PartnerProjectService } from './partner-project.service';
import { PartnerQrService } from './partner-qr.service';
import { PartnerSchoolService } from './partner-school.service';
import { PartnerContactService, ImportResult } from './partner-contact.service';
import { PartnerAlbumService } from './partner-album.service';
import { PartnerGalleryService } from './partner-gallery.service';
import { PartnerGuestService } from './partner-guest.service';

// Gallery típusok (nem re-exportáltak, csak a delegáláshoz kellenek)
import type {
  GalleryResponse,
  CreateGalleryResponse,
  GalleryProgress,
} from '../models/gallery.models';
import type { MonitoringResponse } from '../models/gallery-monitoring.models';

/**
 * Partner API Service - Backward compatibility facade.
 *
 * Ez a service delegál az alábbi specifikus service-ekbe:
 * - PartnerProjectService  (projekt CRUD, settings, dashboard)
 * - PartnerQrService       (QR kód kezelés)
 * - PartnerSchoolService   (iskola kezelés)
 * - PartnerContactService  (kapcsolattartó kezelés)
 * - PartnerAlbumService    (album kezelés, fotó upload)
 * - PartnerGalleryService  (galéria kezelés)
 * - PartnerGuestService    (guest session, sample packages)
 *
 * Új kódban közvetlenül a specifikus service-t használd!
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  // Sub-service-ek
  private projectService = inject(PartnerProjectService);
  private qrService = inject(PartnerQrService);
  private schoolService = inject(PartnerSchoolService);
  private contactService = inject(PartnerContactService);
  private albumService = inject(PartnerAlbumService);
  private galleryService = inject(PartnerGalleryService);
  private guestService = inject(PartnerGuestService);

  // ============================================
  // DASHBOARD (→ PartnerProjectService)
  // ============================================

  getStats(): Observable<PartnerDashboardStats> {
    return this.projectService.getStats();
  }

  // ============================================
  // PROJECTS (→ PartnerProjectService)
  // ============================================

  getProjects(params?: Parameters<PartnerProjectService['getProjects']>[0]): Observable<ProjectListResponse> {
    return this.projectService.getProjects(params);
  }

  getProjectDetails(id: number): Observable<PartnerProjectDetails> {
    return this.projectService.getProjectDetails(id);
  }

  createProject(data: CreateProjectRequest): Observable<{ success: boolean; message: string; data: PartnerProjectListItem }> {
    return this.projectService.createProject(data);
  }

  updateProject(projectId: number, data: Partial<CreateProjectRequest> & { status?: string }): Observable<{
    success: boolean;
    message: string;
    data?: { status: string; statusLabel: string; statusColor: string };
  }> {
    return this.projectService.updateProject(projectId, data);
  }

  deleteProject(projectId: number): Observable<{ success: boolean; message: string }> {
    return this.projectService.deleteProject(projectId);
  }

  toggleProjectAware(projectId: number): Observable<{ success: boolean; message: string; isAware: boolean }> {
    return this.projectService.toggleProjectAware(projectId);
  }

  togglePhotosUploaded(projectId: number): Observable<{ success: boolean; message: string; photosUploaded: boolean }> {
    return this.projectService.togglePhotosUploaded(projectId);
  }

  getProjectSamples(projectId: number): Observable<{ data: SampleItem[] }> {
    return this.projectService.getProjectSamples(projectId);
  }

  getProjectPersons(projectId: number, withoutPhoto?: boolean): Observable<{ data: TabloPersonItem[] }> {
    return this.projectService.getProjectPersons(projectId, withoutPhoto);
  }

  getProjectMissingPersons(projectId: number, withoutPhoto?: boolean): Observable<{ data: TabloPersonItem[] }> {
    return this.projectService.getProjectMissingPersons(projectId, withoutPhoto);
  }

  overridePersonPhoto(projectId: number, personId: number, photoId: number) {
    return this.projectService.overridePersonPhoto(projectId, personId, photoId);
  }

  resetPersonPhoto(projectId: number, personId: number) {
    return this.projectService.resetPersonPhoto(projectId, personId);
  }

  getProjectsAutocomplete(search?: string): Observable<ProjectAutocompleteItem[]> {
    return this.projectService.getProjectsAutocomplete(search);
  }

  getProjectOrderData(projectId: number): Observable<{ success: boolean; data: unknown; message?: string }> {
    return this.projectService.getProjectOrderData(projectId);
  }

  viewProjectOrderPdf(projectId: number): Observable<{ success: boolean; pdfUrl?: string; message?: string }> {
    return this.projectService.viewProjectOrderPdf(projectId);
  }

  getProjectSettings(projectId: number) {
    return this.projectService.getProjectSettings(projectId);
  }

  updateProjectSettings(projectId: number, data: {
    max_retouch_photos: number | null;
    free_edit_window_hours?: number | null;
    export_zip_content?: string | null;
    export_file_naming?: string | null;
    export_always_ask?: boolean | null;
  }) {
    return this.projectService.updateProjectSettings(projectId, data);
  }

  getTabloSizes() {
    return this.projectService.getTabloSizes();
  }

  updateTabloSizes(data: Parameters<PartnerProjectService['updateTabloSizes']>[0]) {
    return this.projectService.updateTabloSizes(data);
  }

  getGlobalSettings() {
    return this.projectService.getGlobalSettings();
  }

  updateGlobalSettings(data: {
    default_max_retouch_photos: number | null;
    default_free_edit_window_hours?: number | null;
    billing_enabled?: boolean;
    default_zip_content?: string;
    default_file_naming?: string;
    export_always_ask?: boolean;
  }) {
    return this.projectService.updateGlobalSettings(data);
  }

  // ============================================
  // QR CODES (→ PartnerQrService)
  // ============================================

  getProjectQrCodes(projectId: number): Observable<{ qrCodes: QrCode[] }> {
    return this.qrService.getProjectQrCodes(projectId);
  }

  generateQrCode(projectId: number, options: { type: string; expires_at?: string; max_usages?: number | null }): Observable<{ success: boolean; message: string; qrCode: QrCode }> {
    return this.qrService.generateQrCode(projectId, options);
  }

  deactivateQrCode(projectId: number, codeId: number): Observable<{ success: boolean; message: string }> {
    return this.qrService.deactivateQrCode(projectId, codeId);
  }

  pinQrCode(projectId: number, codeId: number): Observable<{ success: boolean; message: string }> {
    return this.qrService.pinQrCode(projectId, codeId);
  }

  // ============================================
  // SCHOOLS (→ PartnerSchoolService)
  // ============================================

  getAllSchools(search?: string): Observable<SchoolItem[]> {
    return this.schoolService.getAllSchools(search);
  }

  createSchool(data: CreateSchoolRequest): Observable<{ success: boolean; message: string; data: SchoolItem }> {
    return this.schoolService.createSchool(data);
  }

  getSchools(params?: Parameters<PartnerSchoolService['getSchools']>[0]) {
    return this.schoolService.getSchools(params);
  }

  updateSchool(id: number, data: { name?: string; city?: string | null }) {
    return this.schoolService.updateSchool(id, data);
  }

  deleteSchool(id: number): Observable<{ success: boolean; message: string }> {
    return this.schoolService.deleteSchool(id);
  }

  linkSchools(schoolIds: number[]) {
    return this.schoolService.linkSchools(schoolIds);
  }

  unlinkSchool(schoolId: number) {
    return this.schoolService.unlinkSchool(schoolId);
  }

  // ============================================
  // CONTACTS (→ PartnerContactService)
  // ============================================

  getAllContacts(search?: string): Observable<ProjectContact[]> {
    return this.contactService.getAllContacts(search);
  }

  addContact(projectId: number, contact: { name: string; email?: string | null; phone?: string | null; isPrimary?: boolean }) {
    return this.contactService.addContact(projectId, contact);
  }

  updateContact(projectId: number, contactId: number, contact: { name?: string; email?: string | null; phone?: string | null; isPrimary?: boolean }) {
    return this.contactService.updateContact(projectId, contactId, contact);
  }

  deleteContact(projectId: number, contactId: number): Observable<{ success: boolean; message: string }> {
    return this.contactService.deleteContact(projectId, contactId);
  }

  getContacts(params?: Parameters<PartnerContactService['getContacts']>[0]) {
    return this.contactService.getContacts(params);
  }

  createStandaloneContact(data: Parameters<PartnerContactService['createStandaloneContact']>[0]) {
    return this.contactService.createStandaloneContact(data);
  }

  updateStandaloneContact(id: number, data: Parameters<PartnerContactService['updateStandaloneContact']>[1]) {
    return this.contactService.updateStandaloneContact(id, data);
  }

  deleteStandaloneContact(id: number): Observable<{ success: boolean; message: string }> {
    return this.contactService.deleteStandaloneContact(id);
  }

  exportContactsExcel(search?: string) {
    return this.contactService.exportExcel(search);
  }

  exportContactsVcard(search?: string) {
    return this.contactService.exportVcard(search);
  }

  importContactsExcel(file: File) {
    return this.contactService.importExcel(file);
  }

  // ============================================
  // ALBUMS (→ PartnerAlbumService)
  // ============================================

  getAlbums(projectId: number): Observable<{ albums: AlbumsSummary }> {
    return this.albumService.getAlbums(projectId);
  }

  getAlbum(projectId: number, album: AlbumType): Observable<{ album: AlbumDetails }> {
    return this.albumService.getAlbum(projectId, album);
  }

  uploadToAlbum(projectId: number, album: AlbumType, files: File[]) {
    return this.albumService.uploadToAlbum(projectId, album, files);
  }

  uploadToAlbumChunked(projectId: number, album: AlbumType, files: File[]): Observable<UploadProgress> {
    return this.albumService.uploadToAlbumChunked(projectId, album, files);
  }

  uploadZipToAlbum(projectId: number, album: AlbumType, zipFile: File) {
    return this.albumService.uploadZipToAlbum(projectId, album, zipFile);
  }

  clearAlbum(projectId: number, album: AlbumType) {
    return this.albumService.clearAlbum(projectId, album);
  }

  deletePendingPhotos(projectId: number, mediaIds: number[]) {
    return this.albumService.deletePendingPhotos(projectId, mediaIds);
  }

  bulkUploadPhotos(projectId: number, files: File[], album: AlbumType = 'students') {
    return this.albumService.bulkUploadPhotos(projectId, files, album);
  }

  uploadZip(projectId: number, zipFile: File, album: AlbumType = 'students') {
    return this.albumService.uploadZip(projectId, zipFile, album);
  }

  getPendingPhotos(projectId: number): Observable<{ photos: UploadedPhoto[] }> {
    return this.albumService.getPendingPhotos(projectId);
  }

  matchPhotos(projectId: number, photoIds?: number[]) {
    return this.albumService.matchPhotos(projectId, photoIds);
  }

  assignPhotos(projectId: number, assignments: PhotoAssignment[]) {
    return this.albumService.assignPhotos(projectId, assignments);
  }

  assignToTalon(projectId: number, mediaIds: number[]) {
    return this.albumService.assignToTalon(projectId, mediaIds);
  }

  getTalonPhotos(projectId: number): Observable<{ photos: UploadedPhoto[] }> {
    return this.albumService.getTalonPhotos(projectId);
  }

  uploadPersonPhoto(projectId: number, personId: number, photo: File) {
    return this.albumService.uploadPersonPhoto(projectId, personId, photo);
  }

  // ============================================
  // GALLERY (→ PartnerGalleryService)
  // ============================================

  getGallery(projectId: number): Observable<GalleryResponse> {
    return this.galleryService.getGallery(projectId);
  }

  createGallery(projectId: number): Observable<CreateGalleryResponse> {
    return this.galleryService.createGallery(projectId);
  }

  uploadGalleryPhotos(projectId: number, files: File[]) {
    return this.galleryService.uploadGalleryPhotos(projectId, files);
  }

  uploadGalleryPhotosChunked(projectId: number, files: File[]) {
    return this.galleryService.uploadGalleryPhotosChunked(projectId, files);
  }

  deleteGalleryPhoto(projectId: number, mediaId: number) {
    return this.galleryService.deleteGalleryPhoto(projectId, mediaId);
  }

  deleteGalleryPhotos(projectId: number, photoIds: number[]) {
    return this.galleryService.deleteGalleryPhotos(projectId, photoIds);
  }

  setGalleryDeadline(projectId: number, deadline: string | null) {
    return this.galleryService.setGalleryDeadline(projectId, deadline);
  }

  getGalleryProgress(projectId: number): Observable<GalleryProgress> {
    return this.galleryService.getGalleryProgress(projectId);
  }

  getGalleryMonitoring(projectId: number): Observable<MonitoringResponse> {
    return this.galleryService.getMonitoring(projectId);
  }

  // ============================================
  // GUEST SESSIONS (→ PartnerGuestService)
  // ============================================

  getProjectGuestSessions(projectId: number, params?: Parameters<PartnerGuestService['getProjectGuestSessions']>[1]) {
    return this.guestService.getProjectGuestSessions(projectId, params);
  }

  updateGuestSession(projectId: number, sessionId: number, data: { guest_name?: string; guest_email?: string | null }) {
    return this.guestService.updateGuestSession(projectId, sessionId, data);
  }

  deleteGuestSession(projectId: number, sessionId: number) {
    return this.guestService.deleteGuestSession(projectId, sessionId);
  }

  toggleBanGuestSession(projectId: number, sessionId: number) {
    return this.guestService.toggleBanGuestSession(projectId, sessionId);
  }

  // ============================================
  // SAMPLE PACKAGES (→ PartnerGuestService)
  // ============================================

  getSamplePackages(projectId: number): Observable<{ data: SamplePackage[] }> {
    return this.guestService.getSamplePackages(projectId);
  }

  createSamplePackage(projectId: number, title: string) {
    return this.guestService.createSamplePackage(projectId, title);
  }

  updateSamplePackage(projectId: number, packageId: number, title: string) {
    return this.guestService.updateSamplePackage(projectId, packageId, title);
  }

  deleteSamplePackage(projectId: number, packageId: number) {
    return this.guestService.deleteSamplePackage(projectId, packageId);
  }

  addSampleVersion(projectId: number, packageId: number, formData: FormData) {
    return this.guestService.addSampleVersion(projectId, packageId, formData);
  }

  updateSampleVersion(projectId: number, packageId: number, versionId: number, formData: FormData) {
    return this.guestService.updateSampleVersion(projectId, packageId, versionId, formData);
  }

  deleteSampleVersion(projectId: number, packageId: number, versionId: number) {
    return this.guestService.deleteSampleVersion(projectId, packageId, versionId);
  }

  // ============================================
  // AI SUMMARY (marad itt - nincs külön service)
  // ============================================

  generateAiSummary(text: string): Observable<{ success: boolean; summary: string }> {
    return this.http.post<{ success: boolean; summary: string }>(
      `${this.baseUrl}/ai/generate-summary`,
      { text },
    );
  }

  classifyNameGenders(names: string[]): Observable<{
    success: boolean;
    classifications: Array<{ name: string; gender: 'boy' | 'girl' }>;
  }> {
    return this.http.post<{
      success: boolean;
      classifications: Array<{ name: string; gender: 'boy' | 'girl' }>;
    }>(`${this.baseUrl}/ai/classify-name-genders`, { names });
  }

  matchCustomNameOrder(layerNames: string[], customOrder: string): Observable<{
    success: boolean;
    ordered_names: string[];
    unmatched: string[];
  }> {
    return this.http.post<{
      success: boolean;
      ordered_names: string[];
      unmatched: string[];
    }>(`${this.baseUrl}/ai/match-custom-order`, { layer_names: layerNames, custom_order: customOrder });
  }

  sortNamesAbc(names: string[]): Observable<{
    success: boolean;
    sorted_names: string[];
  }> {
    return this.http.post<{
      success: boolean;
      sorted_names: string[];
    }>(`${this.baseUrl}/ai/sort-names-abc`, { names });
  }
}
