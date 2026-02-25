/**
 * Partner modul közös interface-ek és típusok.
 * Single source of truth - MINDEN partner service innen importál.
 */

import type { QrCode } from '../../../shared/interfaces/qr-code.interface';
import type { ExtendedPaginatedResponse } from '../../../core/models/api.models';

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
 * Projekt email metrikák (lista badge-hez)
 */
export interface ProjectEmailMetrics {
  unansweredCount: number;
  lastEmailAt: string | null;
  avgResponseHours: number | null;
  responseStatus: 'good' | 'warning' | 'critical' | null;
}

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
  personsCount: number;
  missingCount: number;
  missingStudentsCount: number;
  missingTeachersCount: number;
  samplesCount: number;
  sampleThumbUrl: string | null;
  draftPhotoCount: number;
  contact: ProjectContact | null;
  hasActiveQrCode: boolean;
  isAware: boolean;
  photosUploaded: boolean;
  createdAt: string;
  finalizedAt: string | null;
  orderSubmittedAt: string | null;
  isPreliminary: boolean;
  linkedProjectId: number | null;
  linkedAt: string | null;
  preliminaryNote: string | null;
  emailMetrics: ProjectEmailMetrics | null;
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
  activeQrCodes: Array<{
    id: number;
    code: string;
    type: string;
    typeLabel: string;
    usageCount: number;
    isValid: boolean;
    registrationUrl: string;
  }>;
  qrCodesHistory: QrCodeHistory[];
  tabloGalleryId: number | null;
  galleryPhotosCount: number;
  studentsCount?: number;
  teachersCount?: number;
  studentsWithPhotoCount?: number;
  teachersWithPhotoCount?: number;
  personsPreview?: Array<{
    id: number;
    name: string;
    type: 'student' | 'teacher';
    hasPhoto: boolean;
    photoThumbUrl: string | null;
  }>;
  extraNames?: { students: string; teachers: string };
  pendingStudentPhotos?: number;
  pendingTeacherPhotos?: number;
  inPrintAt?: string | null;
  doneAt?: string | null;
  printSmallTablo?: PrintReadyFile | null;
  printFlat?: PrintReadyFile | null;
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
  archiveId: number | null;
  hasOverride: boolean;
  title: string | null;
  photoType: string | null;
  note: string | null;
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
  linkedGroup: string | null;
  linkedSchools: SchoolItem[];
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
  projectIds: number[];
  projectNames: string[];
  schoolNames: string[];
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
 * Minta verzió kép
 */
export interface SampleVersionImage {
  id: number;
  url: string;
  thumbUrl: string;
}

/**
 * Minta verzió interface
 */
export interface SampleVersion {
  id: number;
  versionNumber: number;
  description: string;
  images: SampleVersionImage[];
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
  preliminary_count: number;
}

/**
 * Pagináció response interface (alias a központi ExtendedPaginatedResponse-ra)
 */
export type PaginatedResponse<T> = ExtendedPaginatedResponse<T>;

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
 * Iskola részletek (detail nézet)
 */
export interface SchoolDetail {
  id: number;
  name: string;
  city: string | null;
  projectsCount: number;
  activeProjectsCount: number;
  teachersCount: number;
  recentProjects: SchoolRecentProject[];
  recentTeachers: SchoolRecentTeacher[];
  createdAt: string | null;
}

export interface SchoolRecentProject {
  id: number;
  name: string;
  className: string | null;
  status: string | null;
  createdAt: string | null;
}

export interface SchoolRecentTeacher {
  id: number;
  canonicalName: string;
  position: string | null;
}

/**
 * Iskola changelog bejegyzés
 */
export interface SchoolChangeLogEntry {
  id: number;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  userName: string | null;
  createdAt: string;
}

/**
 * Tablóméret (elérhető méretek a partner beállításokban)
 */
export interface TabloSize {
  label: string;
  value: string;
}

/**
 * Tablóméret küszöbérték beállítás
 * threshold: diáklétszám határ
 * below: méret ha kevesebb diák van
 * above: méret ha több vagy egyenlő diák van
 */
export interface TabloSizeThreshold {
  threshold: number;
  below: string;
  above: string;
}

/**
 * Véglegesítés lista elem
 */
export interface FinalizationListItem {
  id: number;
  name: string;
  status: string;
  schoolName: string | null;
  schoolCity: string | null;
  className: string | null;
  classYear: string | null;
  sampleThumbUrl: string | null;
  samplePreviewUrl: string | null;
  finalizedAt: string | null;
  orderSubmittedAt: string | null;
  tabloSize: string | null;
  printSmallTablo: PrintReadyFile | null;
  printFlat: PrintReadyFile | null;
  contact: { name: string } | null;
  createdAt: string;
}

/**
 * Nyomdakész fájl adatok
 */
export interface PrintReadyFile {
  id: number;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Előzetes projekt létrehozás request
 */
export interface CreatePreliminaryRequest {
  school_name: string;
  school_id?: number | null;
  class_name?: string | null;
  class_year?: string | null;
  note?: string | null;
}

/**
 * Link jelölt projekt (valós projektek lista)
 */
export interface LinkCandidate {
  id: number;
  name: string;
  schoolName: string | null;
  className: string | null;
  classYear: string | null;
}

/**
 * Link előnézet válasz
 */
export interface LinkPreview {
  conflicts: LinkConflict[];
  transferable: TransferablePerson[];
  photosCount: number;
}

/**
 * Link ütközés
 */
export interface LinkConflict {
  sourcePersonId: number;
  sourcePersonName: string;
  sourcePersonType: 'student' | 'teacher';
  sourceHasPhoto: boolean;
  targetPersonId: number;
  targetPersonName: string;
  targetHasPhoto: boolean;
}

/**
 * Átvihető személy
 */
export interface TransferablePerson {
  personId: number;
  name: string;
  type: 'student' | 'teacher';
  hasPhoto: boolean;
}

/**
 * Link request
 */
export interface LinkPreliminaryRequest {
  target_project_id: number;
  conflict_resolution: Array<{ person_id: number; action: 'skip' | 'transfer_photo' }>;
}

/**
 * Link eredmény
 */
export interface LinkPreliminaryResult {
  stats: {
    students_transferred: number;
    teachers_transferred: number;
    photos_transferred: number;
    conflicts_skipped: number;
  };
}

/**
 * Személy archív fotó
 */
export interface PersonPhoto {
  id: number;
  mediaId: number;
  url: string;
  thumbUrl: string;
  year: number | null;
  isActive: boolean;
  fileName: string;
  isOverrideOnly: boolean;
}

/**
 * Személy archív fotók válasz
 */
export interface PersonPhotosResponse {
  photos: PersonPhoto[];
  overridePhoto: PersonPhoto | null;
  overridePhotoId: number | null;
  hasOverride: boolean;
}

/**
 * Partner e-mail fiók (IMAP/SMTP) beállítások
 */
export interface PartnerEmailAccount {
  id: number;
  tablo_partner_id: number;
  name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_encryption: string;
  smtp_username: string;
  smtp_password?: string;
  smtp_from_address: string;
  smtp_from_name: string;
  imap_host: string;
  imap_port: number;
  imap_encryption: string;
  imap_username: string;
  imap_password?: string;
  imap_sent_folder: string;
  imap_save_sent: boolean;
  is_active: boolean;
  last_test_at: string | null;
  last_test_status: 'ok' | 'failed' | null;
  created_at: string;
  updated_at: string;
}

/**
 * E-mail fiók teszt eredmény
 */
export interface EmailAccountTestResult {
  smtp: { ok: boolean; error: string | null; info?: string | null };
  imap: { ok: boolean; error: string | null };
}

// Re-export QrCode from shared
export type { QrCode } from '../../../shared/interfaces/qr-code.interface';
