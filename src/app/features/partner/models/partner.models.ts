import type { QrCode } from '../../../shared/interfaces/qr-code.interface';
import type { ExtendedPaginatedResponse } from '../../../core/models/api.models';
import type { TabloStatus } from '../../../shared/types/tablo.types';

export type { TabloStatus } from '../../../shared/types/tablo.types';

export interface PartnerDashboardStats {
  totalProjects: number;
  activeQrCodes: number;
  totalSchools: number;
  upcomingPhotoshoots: number;
  projectsByStatus: Record<string, number>;
}

export interface ProjectContact {
  id?: number;
  name: string;
  email: string | null;
  phone: string | null;
  isPrimary?: boolean;
}

export interface ProjectTag {
  id: number;
  name: string;
  color: string;
}

export interface ProjectEmailMetrics {
  unansweredCount: number;
  lastEmailAt: string | null;
  avgResponseHours: number | null;
  responseStatus: 'good' | 'warning' | 'critical' | null;
}

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
  tags: ProjectTag[];
  lastActivityAt: string | null;
  emailMetrics: ProjectEmailMetrics | null;
  pendingTaskCount: number;
  tabloSize: string | null;
}

export interface QrCodeHistory {
  id: number;
  code: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

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
  tabloSize: string | null;
  printSmallTablo?: PrintReadyFile | null;
  printFlat?: PrintReadyFile | null;
  updatedAt: string;
}

export interface SampleItem {
  id: number;
  url: string;
  thumbnailUrl: string;
  name: string;
  createdAt?: string;
  description?: string;
}

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
  linkedGroup: string | null;
  class_name?: string | null;
  guest_session_id?: number | null;
  photosCount?: number;
  isPortraitProcessed?: boolean;
  isCropProcessed?: boolean;
}

/**
 * @deprecated Use TabloPersonItem instead
 */
export type MissingPersonItem = TabloPersonItem;

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

export type AlbumType = 'students' | 'teachers';

export interface AlbumSummaryItem {
  photoCount: number;
  missingCount: number;
  firstThumbUrl: string | null;
  previewThumbs: string[];
}

export interface AlbumsSummary {
  students: AlbumSummaryItem;
  teachers: AlbumSummaryItem;
}

export interface AlbumMissingPerson {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  email: string | null;
}

export interface AlbumDetails {
  album: AlbumType;
  photoCount: number;
  missingCount: number;
  photos: UploadedPhoto[];
  missingPersons: AlbumMissingPerson[];
}

export interface PhotoAssignment {
  personId: number;
  mediaId: number;
}

export interface SchoolItem {
  id: number;
  name: string;
  city: string | null;
}

export interface SchoolListItem {
  id: number;
  name: string;
  city: string | null;
  projectsCount: number;
  activeProjectsCount: number;
  hasActiveProjects: boolean;
  linkedGroup: string | null;
  linkedSchools: SchoolItem[];
  groupSize: number;
}

export interface SchoolGroupRow {
  primary: SchoolListItem;
  members: SchoolListItem[];
  linkedGroup: string | null;
}

export interface SchoolLimits {
  current: number;
  max: number | null;
  can_create: boolean;
  plan_id: string;
}

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

export interface ContactLimits {
  current: number;
  max: number | null;
  can_create: boolean;
  plan_id: string;
}

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

export interface SamplePackage {
  id: number;
  title: string;
  sortOrder: number;
  isActive: boolean;
  versionsCount: number;
  versions: SampleVersion[];
  createdAt: string;
}

export interface SampleVersionImage {
  id: number;
  url: string;
  thumbUrl: string;
}

export interface SampleVersion {
  id: number;
  versionNumber: number;
  description: string;
  images: SampleVersionImage[];
  createdAt: string;
}

export interface ProjectAutocompleteItem {
  id: number;
  name: string;
  schoolName: string | null;
}

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

export interface CreateSchoolRequest {
  name: string;
  city?: string | null;
}

export interface ProjectLimits {
  current: number;
  max: number | null;
  can_create: boolean;
  plan_id: string;
  preliminary_count: number;
}

export type PaginatedResponse<T> = ExtendedPaginatedResponse<T>;

export interface ProjectListResponse extends PaginatedResponse<PartnerProjectListItem> {
  limits?: ProjectLimits;
}

export interface UploadProgress {
  uploadedCount: number;
  totalCount: number;
  photos: UploadedPhoto[];
  album: AlbumType;
  currentChunk: number;
  totalChunks: number;
  progress: number;
  completed: boolean;
  errorCount: number;
}

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

export interface SchoolChangeLogEntry {
  id: number;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  userName: string | null;
  createdAt: string;
}

export interface TabloSize {
  label: string;
  value: string;
}

export interface TabloSizeThreshold {
  threshold: number;
  below: string;
  above: string;
}

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

export interface PrintReadyFile {
  id: number;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface CreatePreliminaryRequest {
  school_name: string;
  school_id?: number | null;
  class_name?: string | null;
  class_year?: string | null;
  note?: string | null;
}

export interface LinkCandidate {
  id: number;
  name: string;
  schoolName: string | null;
  className: string | null;
  classYear: string | null;
}

export interface LinkPreview {
  conflicts: LinkConflict[];
  transferable: TransferablePerson[];
  photosCount: number;
}

export interface LinkConflict {
  sourcePersonId: number;
  sourcePersonName: string;
  sourcePersonType: 'student' | 'teacher';
  sourceHasPhoto: boolean;
  targetPersonId: number;
  targetPersonName: string;
  targetHasPhoto: boolean;
}

export interface TransferablePerson {
  personId: number;
  name: string;
  type: 'student' | 'teacher';
  hasPhoto: boolean;
}

export interface LinkPreliminaryRequest {
  target_project_id: number;
  conflict_resolution: Array<{ person_id: number; action: 'skip' | 'transfer_photo' }>;
}

export interface LinkPreliminaryResult {
  stats: {
    students_transferred: number;
    teachers_transferred: number;
    photos_transferred: number;
    conflicts_skipped: number;
  };
}

export interface PersonPhoto {
  id: number;
  mediaId: number;
  url: string;
  thumbUrl: string;
  year: number | null;
  isActive: boolean;
  fileName: string;
  isOverrideOnly: boolean;
  isPortraitProcessed?: boolean;
}

export interface PersonPhotosResponse {
  photos: PersonPhoto[];
  overridePhoto: PersonPhoto | null;
  overridePhotoId: number | null;
  hasOverride: boolean;
}

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
  imap_host: string | null;
  imap_port: number | null;
  imap_encryption: string | null;
  imap_username: string | null;
  imap_password?: string;
  imap_sent_folder: string | null;
  imap_save_sent: boolean;
  is_active: boolean;
  last_test_at: string | null;
  last_test_status: 'ok' | 'failed' | null;
  created_at: string;
  updated_at: string;
}

export interface EmailAccountTestResult {
  smtp: { ok: boolean; error: string | null; info?: string | null };
  imap?: { ok: boolean; error: string | null };
}

export interface TaskUser {
  id: number;
  name: string;
}

export interface TaskAssignee {
  id: number;
  name: string;
  role: string;
}

export interface TaskAttachment {
  id: number;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  width: number | null;
  height: number | null;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  type: 'task' | 'question' | 'note';
  is_completed: boolean;
  completed_at: string | null;
  is_reviewed: boolean;
  reviewed_at: string | null;
  reviewed_by: TaskUser | null;
  created_at: string;
  created_by: TaskUser | null;
  assigned_to: TaskUser | null;
  attachments: TaskAttachment[];
  answer: string | null;
  answered_at: string | null;
  answered_by: TaskUser | null;
}

export interface ProjectTaskSections {
  my_tasks: ProjectTask[];
  assigned_to_me: ProjectTask[];
}

export interface ProjectTaskGroup {
  project_id: number;
  project_name: string;
  school_name: string | null;
  tasks: ProjectTask[];
  completed_count: number;
  total_count: number;
}

// Re-export QrCode from shared
export type { QrCode } from '../../../shared/interfaces/qr-code.interface';
