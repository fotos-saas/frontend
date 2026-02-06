import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { concatMap, scan, map, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  GalleryResponse,
  CreateGalleryResponse,
  GalleryPhoto,
  GalleryProgress,
} from '../models/gallery.models';

/**
 * Dashboard statisztikák
 */
export interface PartnerDashboardStats {
  totalProjects: number;
  activeQrCodes: number;
  totalSchools: number;
  upcomingPhotoshoots: number;
  projectsByStatus: Record<string, number>;
}

/**
 * Kapcsolattartó interface
 */
export interface ProjectContact {
  id?: number;
  name: string;
  email: string | null;
  phone: string | null;
  isPrimary?: boolean;
}

/**
 * Tablo Status interface
 */
export interface TabloStatus {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
}

/**
 * QR kód interface
 */
export type { QrCode } from '../../../shared/interfaces/qr-code.interface';
import type { QrCode } from '../../../shared/interfaces/qr-code.interface';

/**
 * Projekt lista elem
 */
export interface PartnerProjectListItem {
  id: number;
  name: string;
  schoolName: string | null;
  schoolCity: string | null;
  className: string | null;
  classYear: string | null;
  status: string | null;
  statusLabel: string;
  statusColor?: string;
  tabloStatus: TabloStatus | null;
  photoDate: string | null;
  deadline: string | null;
  guestsCount: number;
  expectedClassSize: number | null;
  missingCount: number;
  missingStudentsCount: number;
  missingTeachersCount: number;
  samplesCount: number;
  sampleThumbUrl: string | null;
  draftPhotoCount: number;
  contact: ProjectContact | null;
  hasActiveQrCode: boolean;
  isAware: boolean;
  createdAt: string;
  finalizedAt: string | null;
}

/**
 * QR kód előzmény (rövid)
 */
export interface QrCodeHistory {
  id: number;
  code: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

/**
 * Projekt részletek
 */
export interface PartnerProjectDetails extends PartnerProjectListItem {
  school: {
    id: number;
    name: string;
    city: string | null;
  } | null;
  partner: {
    id: number;
    name: string;
  } | null;
  contacts: ProjectContact[];
  qrCode: QrCode | null;
  qrCodesHistory: QrCodeHistory[];
  tabloGalleryId: number | null;
  galleryPhotosCount: number;
  updatedAt: string;
}

/**
 * Minta kép interface
 */
export interface SampleItem {
  id: number;
  url: string;
  thumbnailUrl: string;
  name: string;
  createdAt?: string;
  description?: string;
}

/**
 * Tablo személy interface (partner view)
 */
export interface TabloPersonItem {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  hasPhoto: boolean;
  email: string | null;
  photoThumbUrl: string | null;
  photoUrl: string | null;
}

/**
 * @deprecated Use TabloPersonItem instead
 */
export type MissingPersonItem = TabloPersonItem;

/**
 * Feltöltött kép interface
 */
export interface UploadedPhoto {
  mediaId: number;
  filename: string;
  iptcTitle: string | null;
  thumbUrl: string;
  fullUrl: string;
  uploadedAt?: string;
}

/**
 * Draft információ interface
 * @deprecated Use AlbumSummary instead
 */
export interface DraftInfo {
  id: string;
  photoCount: number;
  createdAt: string;
  lastModifiedAt: string;
  firstThumbUrl: string | null;
  mediaIds: number[];
  hasAssignments?: boolean;
  assignmentCount?: number;
}

/**
 * Draft részletek interface (fotókkal és párosításokkal)
 * @deprecated Use AlbumDetails instead
 */
export interface DraftDetails extends DraftInfo {
  photos: UploadedPhoto[];
  assignments?: PhotoAssignment[];
}

/**
 * Album típus
 */
export type AlbumType = 'students' | 'teachers';

/**
 * Album összefoglaló interface (egy album)
 */
export interface AlbumSummaryItem {
  photoCount: number;
  missingCount: number;
  firstThumbUrl: string | null;
  previewThumbs: string[];
}

/**
 * Mindkét album összefoglalója
 */
export interface AlbumsSummary {
  students: AlbumSummaryItem;
  teachers: AlbumSummaryItem;
}

/**
 * Hiányzó személy album nélküli (csak lényeges adatok)
 */
export interface AlbumMissingPerson {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  email: string | null;
}

/**
 * Album részletek interface
 */
export interface AlbumDetails {
  album: AlbumType;
  photoCount: number;
  missingCount: number;
  photos: UploadedPhoto[];
  missingPersons: AlbumMissingPerson[];
}

/**
 * AI párosítási eredmény
 */
export interface MatchResult {
  matches: Array<{
    name: string;
    filename: string;
    confidence: 'high' | 'medium';
    mediaId: number | null;
  }>;
  uncertain: Array<{
    filename: string;
    candidates: string[];
    reason: string;
    mediaId: number | null;
  }>;
  unmatchedNames: string[];
  unmatchedFiles: string[];
  summary: string;
}

/**
 * Kép hozzárendelés request
 */
export interface PhotoAssignment {
  personId: number;
  mediaId: number;
}

/**
 * Iskola interface (autocomplete-hez)
 */
export interface SchoolItem {
  id: number;
  name: string;
  city: string | null;
}

/**
 * Iskola lista elem (partner iskolái)
 */
export interface SchoolListItem {
  id: number;
  name: string;
  city: string | null;
  projectsCount: number;
  activeProjectsCount: number;
  hasActiveProjects: boolean;
}

/**
 * Iskola limitek
 */
export interface SchoolLimits {
  current: number;
  max: number | null;
  can_create: boolean;
  plan_id: string;
}

/**
 * Kapcsolattartó lista elem (partner kapcsolattartói)
 */
export interface ContactListItem {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  isPrimary: boolean;
  // New: multiple projects support
  projectIds: number[];
  projectNames: string[];
  schoolNames: string[];
  // Backward compatibility: first project
  projectId: number | null;
  projectName: string | null;
  schoolName: string | null;
  callCount: number;
  smsCount: number;
}

/**
 * Kapcsolattartó limitek
 */
export interface ContactLimits {
  current: number;
  max: number | null;
  can_create: boolean;
  plan_id: string;
}

/**
 * Guest session interface (projekt felhasználók)
 */
export interface GuestSession {
  id: number;
  guestName: string;
  guestEmail: string | null;
  ipAddress: string | null;
  isBanned: boolean;
  isExtra: boolean;
  isCoordinator: boolean;
  registrationType: string | null;
  registrationTypeLabel: string | null;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  points: number;
  rankLevel: number;
  rankName: string;
  lastActivityAt: string | null;
  createdAt: string;
}

/**
 * Minta csomag interface
 */
export interface SamplePackage {
  id: number;
  title: string;
  sortOrder: number;
  isActive: boolean;
  versionsCount: number;
  versions: SampleVersion[];
  createdAt: string;
}

/**
 * Minta verzió interface
 */
export interface SampleVersion {
  id: number;
  versionNumber: number;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: string;
}

/**
 * Projekt autocomplete elem (kapcsolattartó modalhoz)
 */
export interface ProjectAutocompleteItem {
  id: number;
  name: string;
  schoolName: string | null;
}

/**
 * Projekt létrehozás request
 */
export interface CreateProjectRequest {
  school_id?: number | null;
  class_name?: string | null;
  class_year?: string | null;
  photo_date?: string | null;
  deadline?: string | null;
  expected_class_size?: number | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

/**
 * Iskola létrehozás request
 */
export interface CreateSchoolRequest {
  name: string;
  city?: string | null;
}

/**
 * Projekt limitek interface
 */
export interface ProjectLimits {
  current: number;
  max: number | null;
  can_create: boolean;
  plan_id: string;
}

/**
 * Pagináció response interface
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
 * Projekt lista válasz interface (limitekkel)
 */
export interface ProjectListResponse extends PaginatedResponse<PartnerProjectListItem> {
  limits?: ProjectLimits;
}

/**
 * Upload progress interface (chunk upload-hoz)
 */
export interface UploadProgress {
  /** Feltöltött képek száma */
  uploadedCount: number;
  /** Összes kép száma */
  totalCount: number;
  /** Feltöltött képek */
  photos: UploadedPhoto[];
  /** Album típus */
  album: AlbumType;
  /** Aktuális chunk index */
  currentChunk: number;
  /** Összes chunk száma */
  totalChunks: number;
  /** Százalékos progress (0-100) */
  progress: number;
  /** Kész-e a feltöltés */
  completed: boolean;
  /** Hibás fájlok száma */
  errorCount: number;
}

/**
 * Partner API Service
 * API hívások a fotós/partner felülethez.
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /** Chunk méret - hány kép kerüljön egy batch-be */
  private readonly CHUNK_SIZE = 10;

  /**
   * Dashboard statisztikák lekérése
   */
  getStats(): Observable<PartnerDashboardStats> {
    return this.http.get<PartnerDashboardStats>(`${this.baseUrl}/stats`);
  }

  // ============================================
  // PROJECTS
  // ============================================

  /**
   * Projektek listázása (paginált, limitekkel)
   */
  getProjects(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: 'created_at' | 'photo_date' | 'class_year' | 'school_name' | 'tablo_status' | 'missing_count' | 'samples_count';
    sort_dir?: 'asc' | 'desc';
    status?: string;
    is_aware?: boolean;
    has_draft?: boolean;
  }): Observable<ProjectListResponse> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params?.sort_dir) httpParams = httpParams.set('sort_dir', params.sort_dir);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.is_aware !== undefined) httpParams = httpParams.set('is_aware', params.is_aware.toString());
    if (params?.has_draft !== undefined) httpParams = httpParams.set('has_draft', params.has_draft.toString());

    return this.http.get<ProjectListResponse>(`${this.baseUrl}/projects`, { params: httpParams });
  }

  /**
   * Projekt részletek lekérése
   */
  getProjectDetails(id: number): Observable<PartnerProjectDetails> {
    return this.http.get<PartnerProjectDetails>(`${this.baseUrl}/projects/${id}`);
  }

  /**
   * Új projekt létrehozása
   */
  createProject(data: CreateProjectRequest): Observable<{ success: boolean; message: string; data: PartnerProjectListItem }> {
    return this.http.post<{ success: boolean; message: string; data: PartnerProjectListItem }>(
      `${this.baseUrl}/projects`,
      data
    );
  }

  /**
   * Projekt módosítása
   */
  updateProject(projectId: number, data: Partial<CreateProjectRequest>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}`,
      data
    );
  }

  /**
   * Projekt törlése
   */
  deleteProject(projectId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}`
    );
  }

  /**
   * Tudnak róla státusz toggle
   */
  toggleProjectAware(projectId: number): Observable<{ success: boolean; message: string; isAware: boolean }> {
    return this.http.patch<{ success: boolean; message: string; isAware: boolean }>(
      `${this.baseUrl}/projects/${projectId}/toggle-aware`,
      {}
    );
  }

  // ============================================
  // SAMPLES & MISSING PERSONS
  // ============================================

  /**
   * Projekt minták lekérése
   */
  getProjectSamples(projectId: number): Observable<{ data: SampleItem[] }> {
    return this.http.get<{ data: SampleItem[] }>(`${this.baseUrl}/projects/${projectId}/samples`);
  }

  /**
   * Projekt személyeinek lekérése
   */
  getProjectPersons(projectId: number, withoutPhoto?: boolean): Observable<{ data: TabloPersonItem[] }> {
    let httpParams = new HttpParams();
    if (withoutPhoto) {
      httpParams = httpParams.set('without_photo', 'true');
    }
    return this.http.get<{ data: TabloPersonItem[] }>(
      `${this.baseUrl}/projects/${projectId}/persons`,
      { params: httpParams }
    );
  }

  /**
   * @deprecated Use getProjectPersons instead
   */
  getProjectMissingPersons(projectId: number, withoutPhoto?: boolean): Observable<{ data: TabloPersonItem[] }> {
    return this.getProjectPersons(projectId, withoutPhoto);
  }

  // ============================================
  // QR CODES
  // ============================================

  /**
   * Projekt QR kódok lekérése
   */
  getProjectQrCodes(projectId: number): Observable<{ qrCodes: QrCode[] }> {
    return this.http.get<{ qrCodes: QrCode[] }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes`
    );
  }

  /**
   * Új QR kód generálása projekthez
   */
  generateQrCode(projectId: number, options: {
    type: string;
    expires_at?: string;
    max_usages?: number | null;
  }): Observable<{ success: boolean; message: string; qrCode: QrCode }> {
    return this.http.post<{ success: boolean; message: string; qrCode: QrCode }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes`,
      options
    );
  }

  /**
   * QR kód inaktiválása
   */
  deactivateQrCode(projectId: number, codeId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes/${codeId}`
    );
  }

  /**
   * QR kód rögzítése (pin)
   */
  pinQrCode(projectId: number, codeId: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes/${codeId}/pin`,
      {}
    );
  }

  // ============================================
  // SCHOOLS
  // ============================================

  /**
   * Összes iskola lekérése (projekt létrehozáshoz)
   */
  getAllSchools(search?: string): Observable<SchoolItem[]> {
    let httpParams = new HttpParams();
    if (search) {
      httpParams = httpParams.set('search', search);
    }
    return this.http.get<SchoolItem[]>(
      `${this.baseUrl}/schools/all`,
      { params: httpParams }
    );
  }

  /**
   * Új iskola létrehozása
   */
  createSchool(data: CreateSchoolRequest): Observable<{ success: boolean; message: string; data: SchoolItem }> {
    return this.http.post<{ success: boolean; message: string; data: SchoolItem }>(
      `${this.baseUrl}/schools`,
      data
    );
  }

  // ============================================
  // CONTACTS
  // ============================================

  /**
   * Összes kapcsolattartó lekérése (projekt létrehozáshoz)
   */
  getAllContacts(search?: string): Observable<ProjectContact[]> {
    let httpParams = new HttpParams();
    if (search) {
      httpParams = httpParams.set('search', search);
    }
    return this.http.get<ProjectContact[]>(
      `${this.baseUrl}/contacts/all`,
      { params: httpParams }
    );
  }

  // ============================================
  // CONTACT MANAGEMENT
  // ============================================

  /**
   * Kapcsolattartó hozzáadása projekthez
   */
  addContact(projectId: number, contact: {
    name: string;
    email?: string | null;
    phone?: string | null;
    isPrimary?: boolean;
  }): Observable<{ success: boolean; message: string; data: ProjectContact }> {
    return this.http.post<{ success: boolean; message: string; data: ProjectContact }>(
      `${this.baseUrl}/projects/${projectId}/contacts`,
      contact
    );
  }

  /**
   * Kapcsolattartó módosítása
   */
  updateContact(projectId: number, contactId: number, contact: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    isPrimary?: boolean;
  }): Observable<{ success: boolean; message: string; data: ProjectContact }> {
    return this.http.put<{ success: boolean; message: string; data: ProjectContact }>(
      `${this.baseUrl}/projects/${projectId}/contacts/${contactId}`,
      contact
    );
  }

  /**
   * Kapcsolattartó törlése
   */
  deleteContact(projectId: number, contactId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/contacts/${contactId}`
    );
  }

  // ============================================
  // ALBUM MANAGEMENT
  // ============================================

  /**
   * Albumok összefoglalója (diákok + tanárok)
   */
  getAlbums(projectId: number): Observable<{ albums: AlbumsSummary }> {
    return this.http.get<{ albums: AlbumsSummary }>(
      `${this.baseUrl}/projects/${projectId}/albums`
    );
  }

  /**
   * Egyetlen album részletei
   */
  getAlbum(projectId: number, album: AlbumType): Observable<{ album: AlbumDetails }> {
    return this.http.get<{ album: AlbumDetails }>(
      `${this.baseUrl}/projects/${projectId}/albums/${album}`
    );
  }

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
   *
   * A képeket 10-es csoportokba (chunk) bontja és egymás után tölti fel.
   * Minden chunk után progress update érkezik.
   *
   * @param projectId Projekt ID
   * @param album Album típus ('students' | 'teachers')
   * @param files Feltöltendő fájlok
   * @returns Observable<UploadProgress> - Folyamatos progress update-ek
   *
   * @example
   * ```typescript
   * this.partnerService.uploadToAlbumChunked(123, 'students', files).subscribe({
   *   next: (progress) => {
   *     console.log(`${progress.progress}% - ${progress.uploadedCount}/${progress.totalCount}`);
   *   },
   *   complete: () => console.log('Kész!')
   * });
   * ```
   */
  uploadToAlbumChunked(projectId: number, album: AlbumType, files: File[]): Observable<UploadProgress> {
    const totalCount = files.length;
    const chunks = this.chunkArray(files, this.CHUNK_SIZE);
    const totalChunks = chunks.length;

    // Kezdő állapot
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

    // Ha nincs feltöltendő fájl, azonnal kész
    if (files.length === 0) {
      return of({ ...initialState, completed: true, progress: 100 });
    }

    // Chunk-ok egymás utáni feltöltése
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
          }))
        );
      }),
      // Állapot akkumulálás
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
      }, initialState)
    );
  }

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

  /**
   * Pending képek törlése mediaId-k alapján
   */
  deletePendingPhotos(projectId: number, mediaIds: number[]): Observable<{ success: boolean; message: string; deleted_count: number }> {
    return this.http.post<{ success: boolean; message: string; deleted_count: number }>(
      `${this.baseUrl}/projects/${projectId}/photos/pending/delete`,
      { media_ids: mediaIds }
    );
  }

  // ============================================
  // PHOTO UPLOAD & MATCHING
  // ============================================

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

  /**
   * Pending képek lekérése (feltöltött de nem párosított)
   */
  getPendingPhotos(projectId: number): Observable<{ photos: UploadedPhoto[] }> {
    return this.http.get<{ photos: UploadedPhoto[] }>(
      `${this.baseUrl}/projects/${projectId}/photos/pending`
    );
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
      photoIds ? { photoIds } : {}
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
      `${this.baseUrl}/projects/${projectId}/photos/talon`
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
  // SCHOOLS MANAGEMENT
  // ============================================

  /**
   * Partner iskoláinak lekérése (paginált)
   */
  getSchools(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Observable<PaginatedResponse<SchoolListItem> & { limits?: SchoolLimits }> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<PaginatedResponse<SchoolListItem> & { limits?: SchoolLimits }>(`${this.baseUrl}/schools`, { params: httpParams });
  }

  /**
   * Iskola módosítása
   */
  updateSchool(id: number, data: { name?: string; city?: string | null }): Observable<{ success: boolean; message: string; data: SchoolItem }> {
    return this.http.put<{ success: boolean; message: string; data: SchoolItem }>(
      `${this.baseUrl}/schools/${id}`,
      data
    );
  }

  /**
   * Iskola törlése
   */
  deleteSchool(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/schools/${id}`
    );
  }

  // ============================================
  // CONTACTS MANAGEMENT
  // ============================================

  /**
   * Partner kapcsolattartóinak lekérése (paginált, limitekkel)
   */
  getContacts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Observable<PaginatedResponse<ContactListItem> & { limits?: ContactLimits }> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<PaginatedResponse<ContactListItem> & { limits?: ContactLimits }>(`${this.baseUrl}/contacts`, { params: httpParams });
  }

  /**
   * Új kapcsolattartó létrehozása (opcionálisan projektekhez kötve)
   */
  createStandaloneContact(data: {
    name: string;
    email?: string | null;
    phone?: string | null;
    note?: string | null;
    project_id?: number | null;
    project_ids?: number[];
  }): Observable<{ success: boolean; message: string; data: ContactListItem }> {
    return this.http.post<{ success: boolean; message: string; data: ContactListItem }>(
      `${this.baseUrl}/contacts`,
      data
    );
  }

  /**
   * Kapcsolattartó módosítása (projekt ID-k is módosíthatók)
   */
  updateStandaloneContact(id: number, data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    note?: string | null;
    project_id?: number | null;
    project_ids?: number[];
  }): Observable<{ success: boolean; message: string; data: ContactListItem }> {
    return this.http.put<{ success: boolean; message: string; data: ContactListItem }>(
      `${this.baseUrl}/contacts/${id}`,
      data
    );
  }

  /**
   * Kapcsolattartó törlése
   */
  deleteStandaloneContact(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/contacts/${id}`
    );
  }

  // ============================================
  // ORDER DATA
  // ============================================

  /**
   * Megrendelési adatok lekérése projekthez (partner view)
   */
  getProjectOrderData(projectId: number): Observable<{ success: boolean; data: any; message?: string }> {
    return this.http.get<{ success: boolean; data: any; message?: string }>(
      `${this.baseUrl}/projects/${projectId}/order-data`
    );
  }

  /**
   * Megrendelési adatlap PDF generálása (partner view)
   */
  viewProjectOrderPdf(projectId: number): Observable<{ success: boolean; pdfUrl?: string; message?: string }> {
    return this.http.post<{ success: boolean; pdfUrl?: string; message?: string }>(
      `${this.baseUrl}/projects/${projectId}/order-data/view-pdf`,
      {}
    );
  }

  // ============================================
  // GALLERY MANAGEMENT
  // ============================================

  /**
   * Galéria lekérése projekthez
   */
  getGallery(projectId: number): Observable<GalleryResponse> {
    return this.http.get<GalleryResponse>(`${this.baseUrl}/projects/${projectId}/gallery`);
  }

  /**
   * Galéria létrehozása/lekérése projekthez
   */
  createGallery(projectId: number): Observable<CreateGalleryResponse> {
    return this.http.post<CreateGalleryResponse>(`${this.baseUrl}/projects/${projectId}/gallery`, {});
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
          }))
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
      }, initialState)
    );
  }

  /**
   * Egyetlen fotó törlése galériából
   */
  deleteGalleryPhoto(projectId: number, mediaId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/gallery/photos/${mediaId}`
    );
  }

  /**
   * Több fotó törlése galériából
   */
  deleteGalleryPhotos(projectId: number, photoIds: number[]): Observable<{ success: boolean; message: string; deletedCount: number }> {
    return this.http.delete<{ success: boolean; message: string; deletedCount: number }>(
      `${this.baseUrl}/projects/${projectId}/gallery/photos`,
      { body: { photo_ids: photoIds } }
    );
  }

  /**
   * Galéria haladás lekérése (diák workflow)
   */
  getGalleryProgress(projectId: number): Observable<GalleryProgress> {
    return this.http.get<GalleryProgress>(`${this.baseUrl}/projects/${projectId}/gallery/progress`);
  }

  /**
   * Projektek lekérése autocomplete-hez (kapcsolattartó modalhoz)
   */
  getProjectsAutocomplete(search?: string): Observable<ProjectAutocompleteItem[]> {
    let httpParams = new HttpParams();
    if (search) {
      httpParams = httpParams.set('search', search);
    }
    return this.http.get<ProjectAutocompleteItem[]>(
      `${this.baseUrl}/projects/autocomplete`,
      { params: httpParams }
    );
  }

  // ============================================
  // GUEST SESSIONS (PROJECT USERS)
  // ============================================

  getProjectGuestSessions(projectId: number, params?: {
    search?: string;
    filter?: string;
    page?: number;
    per_page?: number;
  }): Observable<PaginatedResponse<GuestSession>> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.filter) httpParams = httpParams.set('filter', params.filter);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginatedResponse<GuestSession>>(
      `${this.baseUrl}/projects/${projectId}/guest-sessions`,
      { params: httpParams }
    );
  }

  updateGuestSession(projectId: number, sessionId: number, data: {
    guest_name?: string;
    guest_email?: string | null;
  }): Observable<{ success: boolean; message: string; data: Partial<GuestSession> }> {
    return this.http.put<{ success: boolean; message: string; data: Partial<GuestSession> }>(
      `${this.baseUrl}/projects/${projectId}/guest-sessions/${sessionId}`,
      data
    );
  }

  deleteGuestSession(projectId: number, sessionId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/guest-sessions/${sessionId}`
    );
  }

  toggleBanGuestSession(projectId: number, sessionId: number): Observable<{ success: boolean; message: string; isBanned: boolean }> {
    return this.http.patch<{ success: boolean; message: string; isBanned: boolean }>(
      `${this.baseUrl}/projects/${projectId}/guest-sessions/${sessionId}/ban`,
      {}
    );
  }

  // ============================================
  // SAMPLE PACKAGES
  // ============================================

  getSamplePackages(projectId: number): Observable<{ data: SamplePackage[] }> {
    return this.http.get<{ data: SamplePackage[] }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages`
    );
  }

  createSamplePackage(projectId: number, title: string): Observable<{ success: boolean; message: string; data: SamplePackage }> {
    return this.http.post<{ success: boolean; message: string; data: SamplePackage }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages`,
      { title }
    );
  }

  updateSamplePackage(projectId: number, packageId: number, title: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages/${packageId}`,
      { title }
    );
  }

  deleteSamplePackage(projectId: number, packageId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages/${packageId}`
    );
  }

  addSampleVersion(projectId: number, packageId: number, formData: FormData): Observable<{ success: boolean; message: string; data: SampleVersion }> {
    return this.http.post<{ success: boolean; message: string; data: SampleVersion }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages/${packageId}/versions`,
      formData
    );
  }

  updateSampleVersion(projectId: number, packageId: number, versionId: number, formData: FormData): Observable<{ success: boolean; message: string; data: SampleVersion }> {
    return this.http.put<{ success: boolean; message: string; data: SampleVersion }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages/${packageId}/versions/${versionId}`,
      formData
    );
  }

  deleteSampleVersion(projectId: number, packageId: number, versionId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/sample-packages/${packageId}/versions/${versionId}`
    );
  }
}
